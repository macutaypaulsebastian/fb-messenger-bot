const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Environment variables
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token_here';
const PORT = process.env.PORT || 3000;

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook event handler
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message) {
        handleMessage(senderId, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderId, webhookEvent.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Handle incoming messages
function handleMessage(senderId, message) {
  const text = message.text?.toLowerCase() || '';

  let response;

  if (text.includes('hello') || text.includes('hi')) {
    response = {
      text: 'Hello! How can I help you today?'
    };
  } else if (text.includes('help')) {
    response = {
      text: 'I can assist you with:\n- General inquiries\n- Product information\n- Support\n\nWhat would you like to know?'
    };
  } else if (text.includes('bye')) {
    response = {
      text: 'Goodbye! Feel free to message me anytime.'
    };
  } else {
    response = {
      text: `You said: "${message.text}"\n\nI'm a simple bot. Try saying "hello" or "help"!`
    };
  }

  sendMessage(senderId, response);
}

// Handle postback events (button clicks)
function handlePostback(senderId, postback) {
  const payload = postback.payload;

  let response;

  switch (payload) {
    case 'GET_STARTED':
      response = {
        text: 'Welcome! I\'m your assistant bot. How can I help you?'
      };
      break;
    default:
      response = {
        text: 'Thanks for clicking!'
      };
  }

  sendMessage(senderId, response);
}

// Send message via Messenger API
async function sendMessage(senderId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        recipient: { id: senderId },
        message: message,
        messaging_type: 'RESPONSE'
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
    console.log('Message sent successfully');
  } catch (err) {
    console.error('Error sending message:', err.response?.data || err.message);
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Facebook Messenger Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
