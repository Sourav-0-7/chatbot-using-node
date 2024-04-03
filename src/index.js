const responses = require('./chatbotResponses');
const express = require('express');
const app = express();
const path = require('path');

// Add this line here
app.use(express.static(path.join(__dirname, '..', 'public')));

// Existing code
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const collection = require("./config");
const bcrypt = require('bcrypt');

const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/Login-tut',
    collection: 'sessions' // Collection to store session data
});

// Catch errors from the MongoDB session store
store.on('error', (error) => {
    console.error('MongoDB session store error:', error);
});

app.use(session({
    secret: 'Key',
    resave: false,
    saveUninitialized: false,
    store: store, // Use MongoDB as the session store
    cookie: {
        secure: false, // Set to true if using HTTPS
        //maxAge:  15 * 60 * 1000 // Session duration in milliseconds
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    }
}));
console.log("Session cookie name:", app.get("session name"));
// Convert data into JSON format
app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Use EJS as the view engine
app.set("view engine", "ejs");

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        // User is authenticated, proceed to the next middleware
        next();
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect('/login');
    }
};

// Homepage route (only accessible after login)
app.get("/home", isAuthenticated, (req, res) => {
    req.session.isAuth = true; // Set session data
    res.render("home"); // Render login page
});

app.get("/login", (req, res) => {
    res.render('login');
});

// Signup route
app.get("/signup", (req, res) => {
    res.render("signup"); // Render signup page
});

// Register User route
app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password
    };

    try {
        // Check if the username already exists in the database
        const existingUser = await collection.findOne({ name: data.name });

        if (existingUser) {
            return res.send('User already exists. Please choose a different username.');
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;

        // Create a new user document in the database
        await collection.create(data);

        return res.send('User registered successfully.');
    } catch (error) {
        console.error(error);
        return res.send('An error occurred during user registration.');
    }
});

// Login user route
app.post("/login", async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.username });

        if (!user) {
            res.send("User not found.");
        } else {
            // Compare the hashed password from the database with the plaintext password
            const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

            if (isPasswordMatch) {
                // Save session ID to the database
                await collection.updateOne(
                    { name: user.name },
                    { $set: { sessionId: req.session.id } }
                );

                req.session.userId = user._id;
                res.redirect("/home"); // Redirect to the /home route
            } else {
                res.send("Incorrect password.");
            }
        }
    } catch (error) {
        console.error(error);
        res.send("An error occurred.");
    }
});

app.get('/logout', async (req, res) => {
    try {
        console.log('Logging out user with userId:', req.session.userId);

        // Remove the user's session ID from the database
        console.log('Removing session ID from database...');
        const dbResult = await collection.updateOne(
            { _id: req.session.userId },
            { $unset: { sessionId: "" } }
        );
        console.log('Database update result:', dbResult);

        // Destroy the session on the server
        console.log('Destroying server-side session...');
        req.session.destroy(err => {
            if (err) {
                console.error(err);
                return res.send('An error occurred during logout.');
            }

            // Clear the session cookie on the client
            console.log('Clearing session cookie on the client...');
            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
            });

            // Redirect the user to the login page
            console.log('Redirecting to login page...');
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        res.send('An error occurred during logout.');
    }
});



let conversationHistory = [];

app.post('/chatbot', (req, res) => {
  const message = req.body.message;
  const response = generateChatbotResponse(message);
  conversationHistory.push({ message, response });
  res.json({ conversationHistory, response });
});

function generateChatbotResponse(message) {
  return responses[message.toLowerCase()] || responses["default"];
}





const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});