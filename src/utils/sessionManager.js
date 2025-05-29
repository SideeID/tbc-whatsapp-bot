const db = require('../database/models');
const socketStore = require('./socketStore');

const sessionTimeouts = {};
const FIRST_TIMEOUT = 5 * 60 * 1000;
const SECOND_TIMEOUT = 5 * 60 * 1000;

async function getOrCreateSession(phoneNumber) {
  try {
    const [session, created] = await db.UserSession.findOrCreate({
      where: { number: phoneNumber },
      defaults: {
        state: 'welcome',
        lastActivity: new Date(),
        data: {},
      },
    });

    resetSessionTimeouts(phoneNumber);

    return {
      number: session.number,
      state: session.state,
      lastActivity: session.lastActivity,
      data: session.data || {},
      isNew: created,
    };
  } catch (error) {
    console.error('Error getting/creating session:', error);
    return {
      number: phoneNumber,
      state: 'welcome',
      lastActivity: new Date(),
      data: {},
      isNew: true,
    };
  }
}

async function updateSessionState(phoneNumber, state) {
  try {
    await db.UserSession.update(
      { state, lastActivity: new Date() },
      { where: { number: phoneNumber } },
    );

    resetSessionTimeouts(phoneNumber);
  } catch (error) {
    console.error('Error updating session state:', error);
  }
}

async function updateLastActivity(phoneNumber) {
  try {
    await db.UserSession.update(
      { lastActivity: new Date() },
      { where: { number: phoneNumber } },
    );

    resetSessionTimeouts(phoneNumber);
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

async function updateSessionData(phoneNumber, data) {
  try {
    const session = await db.UserSession.findOne({
      where: { number: phoneNumber },
    });

    if (session) {
      const updatedData = { ...(session.data || {}), ...data };
      await session.update({ data: updatedData });

      resetSessionTimeouts(phoneNumber);
    }
  } catch (error) {
    console.error('Error updating session data:', error);
  }
}

function resetSessionTimeouts(phoneNumber) {
  if (sessionTimeouts[phoneNumber]) {
    if (sessionTimeouts[phoneNumber].firstTimeout) {
      clearTimeout(sessionTimeouts[phoneNumber].firstTimeout);
    }
    if (sessionTimeouts[phoneNumber].secondTimeout) {
      clearTimeout(sessionTimeouts[phoneNumber].secondTimeout);
    }
  }

  const firstTimeout = setTimeout(() => {
    sendInactivityMessage(phoneNumber, 1);
  }, FIRST_TIMEOUT);

  const secondTimeout = setTimeout(() => {
    sendInactivityMessage(phoneNumber, 2);
  }, FIRST_TIMEOUT + SECOND_TIMEOUT);

  sessionTimeouts[phoneNumber] = {
    firstTimeout,
    secondTimeout,
  };
}

async function sendInactivityMessage(phoneNumber, messageType) {
  try {
    const sock = socketStore.getSocket();
    if (!sock) {
      console.error('No WhatsApp socket available');
      return;
    }

    const jid = `${phoneNumber}@s.whatsapp.net`;

    if (messageType === 1) {
      await sock.sendMessage(jid, {
        text: 'Hallo, apakah kamu masih terhubung dengan kami? Ada yang bisa kami bantu?',
      });
    } else if (messageType === 2) {
      await sock.sendMessage(jid, {
        text: "Terima kasih sudah menggunakan layanan WhatsApp Bot dari Sekawan's TB Jember. Kamu bisa menghubungi kami lagi di nomor yang sama atau akses website: https://sekawanstb.my.id/ dan Instagram: @sekawanstb_jember",
      });

      if (sessionTimeouts[phoneNumber]) {
        delete sessionTimeouts[phoneNumber];
      }
    }
  } catch (error) {
    console.error(`Error sending inactivity message to ${phoneNumber}:`, error);
  }
}

module.exports = {
  getOrCreateSession,
  updateSessionState,
  updateSessionData,
  updateLastActivity,
  resetSessionTimeouts,
};
