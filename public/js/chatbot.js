document.addEventListener('DOMContentLoaded', function () {
  const chatbotContainer = document.getElementById('chatbot-container');
  const closeButton = document.getElementById('close-button');
  const sendButton = document.getElementById('send-button');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatbotButton = document.getElementById('chatbot-button');

  // Add event listener to the close button
  closeButton.addEventListener('click', function () {
    // Hide the chatbot container
    chatbotContainer.style.display = 'none';

    // Show the chatbot button
    chatbotButton.style.display = 'block';
  });


  sendButton.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
  
    if (messageText) {
      const userMessageElement = document.createElement('div');
      userMessageElement.classList.add('user-message');
      userMessageElement.textContent = messageText;
      chatMessages.appendChild(userMessageElement);
  
      sendMessageToServer(messageText);
      messageInput.value = '';
    }
  });

  // Function to send the message to the server using AJAX
  function sendMessageToServer(message) {
    // Replace this with your server-side endpoint URL
    const url = '/chatbot';

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }),
    })
      .then(response => response.json())
      .then(data => {
        // Display the response from the server in the chat messages container
        const messageElement = document.createElement('div');
        messageElement.textContent = data.response;
        chatMessages.appendChild(messageElement);

        // Create option buttons if available in the response
        if (data.options && data.options.length > 0) {
          createOptionButtons(data.options);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  // Function to create option buttons
  function createOptionButtons(options) {
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('option-buttons');

    options.forEach((option, index) => {
      const optionButton = document.createElement('button');
      optionButton.textContent = option;
      optionButton.classList.add('option-button');
      optionButton.dataset.option = index + 1; // Assuming options are numbered from 1
      optionsContainer.appendChild(optionButton);
    });

    chatMessages.appendChild(optionsContainer);

    // Add event listeners to option buttons
    const optionButtons = document.querySelectorAll('.option-button');
    optionButtons.forEach(button => {
      button.addEventListener('click', function () {
        const option = this.dataset.option;
        sendMessageToServer(option); // Send the selected option to the server
      });
    });
  }

  // Add event listener to the chatbot button
  chatbotButton.addEventListener('click', function () {
    // Hide the chatbot container
    chatbotContainer.style.display = 'flex';

    // Show the chatbot button
    chatbotButton.style.display = 'none';
  });
});
