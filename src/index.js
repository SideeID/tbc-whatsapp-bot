require('dotenv').config();
const { startWhatsAppBot } = require('./app');
const { initDatabase } = require('./database/init');

const start = async () => {
  console.log('🚀 Initializing TBC WhatsApp Bot...');

  try {
    console.log('📊 Setting up database...');
    const dbInitialized = await initDatabase();

    if (!dbInitialized) {
      console.error('❌ Failed to initialize database. Exiting...');
      process.exit(1);
    }

    console.log('📱 Starting WhatsApp Bot...');
    await startWhatsAppBot();

    console.log('✅ Bot is ready! Waiting for QR code or connection...');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

start().catch((err) => {
  console.error('❌ Fatal error starting bot:', err);
  process.exit(1);
});
