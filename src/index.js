require('dotenv').config();
const { startWhatsAppBot } = require('./app');
const { initDatabase } = require('./database/init');

let botInstance = null;

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
    botInstance = await startWhatsAppBot();

    console.log('✅ Bot is ready! Waiting for QR code or connection...');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);

  try {
    if (botInstance && typeof botInstance.stop === 'function') {
      console.log('🛑 Stopping WhatsApp bot...');
      await botInstance.stop();
    }
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

start().catch((err) => {
  console.error('❌ Fatal error starting bot:', err);
  process.exit(1);
});
