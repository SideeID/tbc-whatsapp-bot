const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

/**
 * Setup API server untuk menerima requests dari aplikasi Laravel
 * @param {object} sock - Instance WhatsApp client dari baileys
 * @returns {object} Express app instance
 */
const setupApi = (sock) => {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  app.post('/api/send-message', async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required',
        });
      }

      let formattedNumber = phoneNumber;
      if (!formattedNumber.endsWith('@s.whatsapp.net')) {
        formattedNumber = `${phoneNumber}@s.whatsapp.net`;
      }

      console.log(`Sending message to ${formattedNumber}`);

      await sock.sendMessage(formattedNumber, { text: message });

      return res.json({
        success: true,
        message: 'Message sent successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  });

  app.get('/api/health', (req, res) => {
    return res.json({
      success: true,
      status: 'Service is running',
      connected: sock.isConnected(),
    });
  });

  return app;
};

module.exports = { setupApi };
