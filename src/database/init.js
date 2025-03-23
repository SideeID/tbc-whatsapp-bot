const db = require('./models');

const initDatabase = async () => {
  try {
    await db.sequelize.sync();
    console.log('Database synchronized successfully');

    await initAdmins();

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

const initAdmins = async () => {
  try {
    const adminNumbersStr =
      process.env.ADMIN_NUMBERS || process.env.ADMIN_NUMBER || '';
    const adminNumbers = adminNumbersStr.split(',').map((num) => num.trim());

    if (
      !adminNumbers.length ||
      (adminNumbers.length === 1 && !adminNumbers[0])
    ) {
      console.warn(
        'No admin numbers configured. Set ADMIN_NUMBERS in .env file.',
      );
      return;
    }

    for (const number of adminNumbers) {
      if (!number) continue;

      await db.Admin.findOrCreate({
        where: { number },
        defaults: {
          isAvailable: true,
          lastAssignedTime: new Date(),
          currentUser: null,
        },
      });
    }

    console.log(`${adminNumbers.length} admin(s) initialized`);
  } catch (error) {
    console.error('Admin initialization error:', error);
  }
};

module.exports = { initDatabase };
