/**
 * Simple socket store to avoid circular dependencies
 * between app.js and the session manager
 */

let socketInstance = null;

/**
 * Store the socket instance for later use
 * @param {Object} socket - The WhatsApp socket instance
 */
function setSocket(socket) {
  socketInstance = socket;
}

/**
 * Get the current socket instance
 * @returns {Object} The WhatsApp socket instance
 */
function getSocket() {
  return socketInstance;
}

module.exports = {
  setSocket,
  getSocket,
};
