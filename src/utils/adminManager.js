const db = require('../database/models');
const { Op } = require('sequelize');

class AdminManager {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.initialized = true;

      await this.resetAfterRestart();
    } catch (error) {
      console.error('Error initializing AdminManager:', error);
    }
  }

  async resetAfterRestart() {
    try {
      await db.Admin.update(
        {
          isAvailable: true,
          currentUser: null,
        },
        { where: {} },
      );

      await db.QueuedUser.destroy({ where: {} });

      console.log('Admin statuses reset after restart');
    } catch (error) {
      console.error('Error resetting admin statuses:', error);
    }
  }

  async getAllAdmins() {
    try {
      const admins = await db.Admin.findAll();
      return admins;
    } catch (error) {
      console.error('Error getting all admins:', error);
      return [];
    }
  }

  async getAvailableAdmin() {
    try {
      const admin = await db.Admin.findOne({
        where: { isAvailable: true },
        order: [['lastAssignedTime', 'ASC']],
      });

      return admin;
    } catch (error) {
      console.error('Error finding available admin:', error);
      return null;
    }
  }

  async assignUserToAdmin(userNumber) {
    await this.init();

    try {
      const assignedAdmin = await db.Admin.findOne({
        where: { currentUser: userNumber },
      });

      if (assignedAdmin) {
        return assignedAdmin.number;
      }

      const admin = await this.getAvailableAdmin();

      if (!admin) {
        await this.addToQueue(userNumber);
        return null;
      }

      await admin.update({
        isAvailable: false,
        currentUser: userNumber,
        lastAssignedTime: new Date(),
      });

      return admin.number;
    } catch (error) {
      console.error('Error assigning user to admin:', error);
      return null;
    }
  }

  async addToQueue(userNumber) {
    try {
      const existingUser = await db.QueuedUser.findOne({
        where: { number: userNumber },
      });

      if (existingUser) {
        return existingUser.queuePosition;
      }

      const maxPosition = (await db.QueuedUser.max('queuePosition')) || 0;

      await db.QueuedUser.create({
        number: userNumber,
        queueTime: new Date(),
        queuePosition: maxPosition + 1,
      });

      return maxPosition + 1;
    } catch (error) {
      console.error('Error adding user to queue:', error);
      return null;
    }
  }

  async releaseAdmin(adminNumber) {
    try {
      console.log(`Attempting to release admin: ${adminNumber}`);

      adminNumber = adminNumber.replace(/\D/g, '');
      if (adminNumber.startsWith('0')) {
        adminNumber = '62' + adminNumber.substring(1);
      }

      const beforeAdmin = await db.Admin.findOne({
        where: { number: adminNumber },
      });

      console.log(
        `Admin before release - Number: ${adminNumber}, Available: ${
          beforeAdmin ? beforeAdmin.isAvailable : 'not found'
        }, CurrentUser: ${beforeAdmin ? beforeAdmin.currentUser : 'none'}`,
      );

      if (!beforeAdmin) {
        console.log(`Admin ${adminNumber} not found in database`);
        return false;
      }

      const result = await db.Admin.update(
        {
          isAvailable: true,
          currentUser: null,
        },
        {
          where: { number: adminNumber },
          returning: true,
        },
      );

      console.log(`Admin release update result:`, result);

      const afterAdmin = await db.Admin.findOne({
        where: { number: adminNumber },
      });

      console.log(
        `Admin after release - Number: ${adminNumber}, Available: ${afterAdmin.isAvailable}, CurrentUser: ${afterAdmin.currentUser}`,
      );

      return true;
    } catch (error) {
      console.error('Error releasing admin:', error);
      return false;
    }
  }

  async releaseUser(userNumber) {
    try {
      const admin = await db.Admin.findOne({
        where: { currentUser: userNumber },
      });

      if (!admin) return false;

      return await this.releaseAdmin(admin.number);
    } catch (error) {
      console.error('Error releasing user:', error);
      return false;
    }
  }

  async processQueue() {
    try {
      const admin = await this.getAvailableAdmin();

      if (!admin) return null; 

      const nextUser = await db.QueuedUser.findOne({
        order: [['queuePosition', 'ASC']],
      });

      if (!nextUser) return null; 

      await admin.update({
        isAvailable: false,
        currentUser: nextUser.number,
        lastAssignedTime: new Date(),
      });

      await nextUser.destroy();

      await this.reorderQueue();

      return {
        adminNumber: admin.number,
        userNumber: nextUser.number,
      };
    } catch (error) {
      console.error('Error processing queue:', error);
      return null;
    }
  }

  async reorderQueue() {
    try {
      const users = await db.QueuedUser.findAll({
        order: [['queuePosition', 'ASC']],
      });

      for (let i = 0; i < users.length; i++) {
        await users[i].update({
          queuePosition: i + 1,
        });
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
    }
  }

  async isAdminBusy(adminNumber) {
    try {
      const admin = await db.Admin.findOne({
        where: { number: adminNumber },
      });

      return admin ? !admin.isAvailable : false;
    } catch (error) {
      console.error('Error checking if admin is busy:', error);
      return false;
    }
  }

  async getAssignedAdmin(userNumber) {
    try {
      const admin = await db.Admin.findOne({
        where: { currentUser: userNumber },
      });

      return admin ? admin.number : null;
    } catch (error) {
      console.error('Error getting assigned admin:', error);
      return null;
    }
  }

  async getAssignedUser(adminNumber) {
    try {
      const admin = await db.Admin.findOne({
        where: { number: adminNumber },
      });

      return admin ? admin.currentUser : null;
    } catch (error) {
      console.error('Error getting assigned user:', error);
      return null;
    }
  }

  async getQueueStatus() {
    try {
      const queuedUsers = await db.QueuedUser.findAll({
        order: [['queuePosition', 'ASC']],
      });

      const activeAdmins = await db.Admin.findAll({
        where: {
          isAvailable: false,
          currentUser: {
            [Op.not]: null,
          },
        },
      });

      const availableAdmins = await db.Admin.findAll({
        where: { isAvailable: true },
      });

      return {
        queueLength: queuedUsers.length,
        queuedUsers: queuedUsers.map((user) => user.number),
        activeChats: activeAdmins.map((admin) => ({
          admin: admin.number,
          user: admin.currentUser,
        })),
        availableAdmins: availableAdmins.map((admin) => admin.number),
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {
        queueLength: 0,
        queuedUsers: [],
        activeChats: [],
        availableAdmins: [],
      };
    }
  }

  async getQueuePosition(userNumber) {
    try {
      const user = await db.QueuedUser.findOne({
        where: { number: userNumber },
      });

      return user ? user.queuePosition : null;
    } catch (error) {
      console.error('Error getting queue position:', error);
      return null;
    }
  }
}

const adminManager = new AdminManager();

module.exports = adminManager;
