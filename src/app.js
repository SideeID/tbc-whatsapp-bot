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

class WhatsAppTBCBot {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async start() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);

      this.socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        fireInitQueries: false,
        mobile: false,
        browser: ['TBC WhatsApp Bot', 'Chrome', '121.0.0.0'],
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
        qrTimeout: 40_000,
        getMessage: async (key) => {
          return undefined;
        },
        shouldSyncHistoryMessage: () => false,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
      });

      socketStore.setSocket(this.socket);

      this.socket.ev.on(
        'connection.update',
        this.handleConnectionUpdate.bind(this),
      );
      this.socket.ev.on('creds.update', saveCreds);
      this.socket.ev.on('messages.upsert', this.handleMessages.bind(this));

      console.log('✅ WhatsApp TBC Bot started successfully');
    } catch (error) {
      console.error('❌ Failed to start WhatsApp bot:', error);
      throw error;
    }
  }

  handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 QR Code received, scan to connect:');
      qrcode.generate(qr, { small: true });
      console.log(
        '\n👆 Please scan this QR code with your WhatsApp mobile app.',
      );
      console.log('💡 Make sure your phone has internet connection.');
      console.log(
        '⏰ QR code will expire in 40 seconds. If it expires, a new one will be generated.',
      );
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log('� Connection closed details:', {
        statusCode:
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode
            : null,
        errorMsg: lastDisconnect?.error?.message || 'Unknown reason',
      });

      console.log(
        '❌ Connection closed due to:',
        lastDisconnect?.error?.message || 'Unknown reason',
      );

      if (shouldReconnect) {
        console.log('🔄 Reconnecting...');
        setTimeout(() => {
          this.start().catch((err) => {
            console.error('💥 Reconnection failed:', err.message);
          });
        }, 5000);
      } else {
        console.log('🚪 Connection closed permanently (logged out)');
        this.isConnected = false;
      }
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp successfully!');
      console.log(`📞 Connected as: ${this.socket.user?.name || 'Unknown'}`);
      console.log(`📱 Phone: ${this.socket.user?.id || 'Unknown'}`);
      this.isConnected = true;
    } else if (connection === 'connecting') {
      console.log('� Connecting to WhatsApp...');
    }
  }

  async handleMessages(m) {
    for (const message of m.messages) {
      if (!message.key.fromMe && message.message) {
        await this.processMessage(message);
      }
    }
  }

  async processMessage(message) {
    try {
      const isGroup = message.key.remoteJid?.endsWith('@g.us');
      if (isGroup) {
        console.log('� Group message ignored');
        return;
      }

      console.log(`📩 Processing message from: ${message.key.remoteJid}`);
      await handleIncomingMessage(this.socket, message);
    } catch (error) {
      console.error('❌ Error processing message:', error);

      try {
        await this.socket?.sendMessage(message.key.remoteJid, {
          text: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.',
        });
      } catch (sendError) {
        console.error('❌ Error sending error message:', sendError);
      }
    }
  }

  async stop() {
    if (this.socket) {
      try {
        await this.socket.logout();
        console.log('✅ WhatsApp bot stopped gracefully');
      } catch (error) {
        console.error('❌ Error stopping bot:', error);
      }
      this.socket = null;
      this.isConnected = false;
      socketStore.setSocket(null);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.user !== undefined;
  }
}

let botInstance = null;

const cleanSessions = () => {
  try {
    console.log('🧹 Cleaning sessions...');

    if (botInstance) {
      botInstance.stop();
      botInstance = null;
    }

    if (fs.existsSync(sessionsDir)) {
      fs.rmSync(sessionsDir, { recursive: true, force: true });
      console.log('✅ Sessions directory cleaned');
    }
    fs.mkdirSync(sessionsDir, { recursive: true });

    if (global.authState) {
      delete global.authState;
    }

    console.log('✅ Sessions cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning sessions:', error);
  }
};

const startWhatsAppBot = async () => {
  try {
    const sessionFiles = fs.readdirSync(sessionsDir);
    if (sessionFiles.length === 0) {
      console.log('📝 No session files found. Starting fresh session...');
    }

    botInstance = new WhatsAppTBCBot();
    await botInstance.start();

    if (!isServerRunning) {
      const apiApp = setupApi(() => botInstance?.getSocket());
      const PORT = process.env.PORT || 3001;

      apiServer = apiApp.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 API server listening on port ${PORT}`);
        isServerRunning = true;
      });

      apiServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(
            `❌ Port ${PORT} is already in use. Please use a different port.`,
          );
          process.exit(1);
        } else {
          console.error('❌ API server error:', error);
        }
      });
    }

    return botInstance;
  } catch (error) {
    console.error('❌ Error starting WhatsApp bot:', error);
    throw error;
  }
};

module.exports = { startWhatsAppBot, cleanSessions };
