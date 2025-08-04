const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

/**
 * Setup API server untuk menerima requests dari aplikasi Laravel
 * @param {object} socket - Instance WhatsApp client dari baileys (dapat berupa function yang mengembalikan socket)
 * @returns {object} Express app instance
 */
const setupApi = (socketOrGetter) => {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  // Helper function to get current socket
  const getSocket = () => {
    if (typeof socketOrGetter === 'function') {
      return socketOrGetter();
    }
    return socketOrGetter;
  };

  app.post('/api/send-message', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required',
        });
      }

      const sock = getSocket();
      if (!sock) {
        return res.status(503).json({
          success: false,
          message: 'WhatsApp bot is not connected',
        });
      }

      let formattedNumber = phoneNumber;
      if (!formattedNumber.endsWith('@s.whatsapp.net')) {
        formattedNumber = `${phoneNumber}@s.whatsapp.net`;
      }

      console.log(`📤 Sending message to ${formattedNumber}`);

      await sock.sendMessage(formattedNumber, { text: message });

      return res.json({
        success: true,
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  });

  app.get('/api/health', (req, res) => {
    const sock = getSocket();
    const isConnected = sock ? sock.user !== undefined : false;

    return res.json({
      success: true,
      status: 'Service is running',
      connected: isConnected,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

module.exports = { setupApi };
