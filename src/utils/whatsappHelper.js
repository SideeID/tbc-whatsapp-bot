const { getSocket } = require('../app');

/**
 * Fungsi untuk mengirim pesan WhatsApp
 * @param {string} jid - Nomor tujuan dalam format WhatsApp JID
 * @param {string} message - Pesan yang akan dikirim
 * @returns {Promise} - Promise yang mengembalikan status pengiriman
 */
async function sendMessage(jid, message) {
  try {
    const socket = getSocket();

    if (!socket) {
      throw new Error('WhatsApp connection not established');
    }

    await socket.sendMessage(jid, { text: message });

    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

module.exports = {
  sendMessage,
};
