const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { handleIncomingMessage } = require('./controllers');
const { isWithinWorkHours } = require('./utils/helpers');
const { setupApi } = require('./api');
const socketStore = require('./utils/socketStore');

const sessionsDir = path.join(__dirname, '..', 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Initialize server outside the function so it's only created once
let apiServer = null;
let isServerRunning = false;

const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  socketStore.setSocket(sock);

  sock.isConnected = () => sock.user !== undefined;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('QR Code generated. Scan to connect.');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode !==
            DisconnectReason.loggedOut
          : true;

      if (shouldReconnect) {
        console.log('Connection closed due to error, reconnecting...');
        // Only reconnect WhatsApp, don't restart the server
        connectToWhatsApp();
      } else {
        console.log('Connection closed. You are logged out.');
      }
    }

    if (connection === 'open') {
      console.log('Bot connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      if (message.key.fromMe) continue;

      const isGroup = message.key.remoteJid.endsWith('@g.us');
      if (isGroup) continue;

      await handleIncomingMessage(sock, message);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
};

const startWhatsAppBot = async () => {
  // Start WhatsApp connection
  const sock = await connectToWhatsApp();

  // Only start the API server once
  if (!isServerRunning) {
    const apiApp = setupApi(sock);
    const PORT = process.env.PORT || 3001;

    apiServer = apiApp.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on port ${PORT}`);
      isServerRunning = true;
    });

    // Handle server errors
    apiServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Please use a different port.`,
        );
        process.exit(1);
      } else {
        console.error('API server error:', error);
      }
    });
  }

  return sock;
};

module.exports = { startWhatsAppBot };
