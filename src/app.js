const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { handleIncomingMessage } = require('./controllers');
const { isWithinWorkHours } = require('./utils/helpers');

const sessionsDir = path.join(__dirname, '..', 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const startWhatsAppBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('sessions');
  
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' })
  });
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('QR Code generated. Scan to connect.');
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom) ? 
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
      
      if (shouldReconnect) {
        console.log('Connection closed due to error, reconnecting...');
        startWhatsAppBot();
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

module.exports = { startWhatsAppBot };