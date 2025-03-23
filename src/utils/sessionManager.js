const db = require('../database/models');

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
    }
  } catch (error) {
    console.error('Error updating session data:', error);
  }
}

module.exports = {
  getOrCreateSession,
  updateSessionState,
  updateSessionData,
  updateLastActivity,
};
