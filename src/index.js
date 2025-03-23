require('dotenv').config();
const { startWhatsAppBot } = require('./app');
const { initDatabase } = require('./database/init');

const start = async () => {
  console.log('Initializing TBC WhatsApp Bot...');

  console.log('Setting up database...');
  const dbInitialized = await initDatabase();

  if (!dbInitialized) {
    console.error('Failed to initialize database. Exiting...');
    process.exit(1);
  }

  console.log('Starting WhatsApp Bot...');
  await startWhatsAppBot();
};

start().catch((err) => {
  console.error('Error starting bot:', err);
  process.exit(1);
});
