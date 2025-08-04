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

let apiServer = null;
let isServerRunning = false;

const cleanSessions = () => {
  try {
    if (fs.existsSync(sessionsDir)) {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
      console.log('Sessions directory cleaned');
    }
    fs.mkdirSync(sessionsDir, { recursive: true });

    if (global.authState) {
      delete global.authState;
    }
  } catch (error) {
    console.error('Error cleaning sessions:', error);
  }
};

const connectToWhatsApp = async (retryCount = 0) => {
  try {
    console.log('🔄 Connecting to WhatsApp...');

    socketStore.setSocket(null);

    if (retryCount > 0) {
      console.log('🧹 Force cleaning sessions before retry...');
      cleanSessions();
      await new Promise((resolve) => setTimeout(resolve, 2000)); 
    }

    const { state, saveCreds } = await useMultiFileAuthState('sessions');

    const sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      logger: pino({ level: 'silent' }),
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
      browser: ['TBC WhatsApp Bot', 'Chrome', '121.0.0.0'],
      qrTimeout: 40_000,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      fireInitQueries: false,
      mobile: false,
    });

    socketStore.setSocket(sock);

    sock.isConnected = () => sock.user !== undefined;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log('🔍 Connection update:', {
        connection,
        hasQR: !!qr,
        hasError: !!lastDisconnect?.error,
      });

      if (qr) {
        console.log('\n📱 QR Code generated below:');
        qrcode.generate(qr, { small: true });
        console.log(
          '\n👆 Please scan this QR code with your WhatsApp mobile app.',
        );
        console.log('💡 Make sure your phone has internet connection.');
      }

      if (connection === 'connecting') {
        console.log('🔗 Connecting to WhatsApp...');
      }

      if (connection === 'close') {
        const statusCode =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode
            : null;

        const errorMsg = lastDisconnect?.error?.message || 'Unknown reason';

        console.log('🔍 Connection close details:', {
          statusCode,
          errorMsg,
          isBoom: lastDisconnect?.error instanceof Boom,
          errorOutput:
            lastDisconnect?.error instanceof Boom
              ? lastDisconnect.error.output
              : null,
        });

        console.log(
          `❌ Connection closed: ${errorMsg} (Status: ${
            statusCode || 'Unknown'
          })`,
        );

        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? ![
                DisconnectReason.loggedOut,
                DisconnectReason.badSession,
                DisconnectReason.restartRequired,
                405,
              ].includes(lastDisconnect.error.output.statusCode)
            : false;

        if (shouldReconnect) {
          console.log('⏳ Attempting to reconnect in 5 seconds...');
          setTimeout(() => {
            connectToWhatsApp().catch((err) => {
              console.error('💥 Reconnection failed:', err.message);
            });
          }, 5000);
        } else {
          console.log('🚪 Connection closed permanently.');
          if (
            statusCode === 405 ||
            statusCode === DisconnectReason.badSession
          ) {
            console.log(
              '🧹 Cleaning sessions due to authentication failure...',
            );
            cleanSessions();
            console.log('💡 Starting fresh connection in 3 seconds...');
            setTimeout(() => {
              connectToWhatsApp(1).catch((err) => {
                console.error('💥 Fresh connection failed:', err.message);
              });
            }, 3000);
          } else {
            console.log(
              '💡 Run "npm run reset" to start fresh with new QR code.',
            );
          }
        }
      }

      if (connection === 'open') {
        console.log('✅ Bot connected successfully!');
        console.log(`📞 Connected as: ${sock.user?.name || 'Unknown'}`);
        console.log(`📱 Phone: ${sock.user?.id || 'Unknown'}`);
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
  } catch (error) {
    console.error('❌ Error in connectToWhatsApp:', error);
    throw error;
  }
};
const startWhatsAppBot = async () => {
  try {
    const sessionFiles = fs.readdirSync(sessionsDir);
    if (sessionFiles.length === 0) {
      console.log('No session files found. Starting fresh session...');
      cleanSessions();
    }

    const sock = await connectToWhatsApp();

    if (!isServerRunning) {
      const apiApp = setupApi(sock);
      const PORT = process.env.PORT || 3001;

      apiServer = apiApp.listen(PORT, '0.0.0.0', () => {
        console.log(`API server listening on port ${PORT}`);
        isServerRunning = true;
      });

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
  } catch (error) {
    console.error('Error starting WhatsApp bot:', error);
    throw error;
  }
};

module.exports = { startWhatsAppBot, cleanSessions };
