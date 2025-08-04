#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sessionsDir = path.join(__dirname, 'sessions');

console.log('🔄 Resetting WhatsApp Bot Session...');

try {
  // Kill any running node processes first
  console.log('🛑 Stopping any running processes...');

  // Remove sessions directory completely
  if (fs.existsSync(sessionsDir)) {
    fs.rmSync(sessionsDir, { recursive: true, force: true });
    console.log('✅ Old session files removed');
  }

  // Create fresh sessions directory
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log('✅ Fresh sessions directory created');

  // Clear any cache or temporary files that might interfere
  const tempDirs = [
    path.join(__dirname, 'node_modules', '.cache'),
    path.join(__dirname, '.tmp'),
  ];

  tempDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Cleared ${dir}`);
      } catch (err) {
        // Ignore errors for cache cleanup
      }
    }
  });

  console.log('🎉 Session reset complete!');
  console.log('💡 Run "npm start" to generate new QR code');
  console.log('🔧 If you still have issues, try restarting your terminal');
} catch (error) {
  console.error('❌ Error resetting session:', error);
  process.exit(1);
}
