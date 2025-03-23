const {
  getTextMessageContent,
  formatPhoneNumber,
} = require('../utils/helpers');
const { handleQnA } = require('./qna');
const { handleScreening } = require('./screening');
const { handleInfo } = require('./info');
const sessionManager = require('../utils/sessionManager');
const adminManager = require('../utils/adminManager');

async function handleIncomingMessage(sock, message) {
  const sender = message.key.remoteJid;
  const textMessage = getTextMessageContent(message);

  if (!textMessage) return;

  const phoneNumber = formatPhoneNumber(sender.split('@')[0]);

  if (await handleGlobalAdminCommands(sock, sender, phoneNumber, textMessage)) {
    return;
  }

  let session = await sessionManager.getOrCreateSession(phoneNumber);

  if (session.isNew) {
    await sendWelcomeMessage(sock, sender);
    return;
  }

  const lowerText = textMessage.toLowerCase();

  if (lowerText === 'menu') {
    await sessionManager.updateSessionState(phoneNumber, 'menu');
    await sendMenuMessage(sock, sender);
    return;
  }

  switch (session.state) {
    case 'welcome':
      await sessionManager.updateSessionState(phoneNumber, 'menu');
      await sendMenuMessage(sock, sender);
      break;

    case 'menu':
      if (lowerText === 'a') {
        await sessionManager.updateSessionState(phoneNumber, 'screening');
        await handleScreening(sock, sender, 'start', message);
      } else if (lowerText === 'b') {
        await sessionManager.updateSessionState(phoneNumber, 'info');
        await handleInfo(sock, sender, 'start', message);
      } else if (lowerText === 'c') {
        await sessionManager.updateSessionState(phoneNumber, 'qna');
        await handleQnA(sock, sender, 'start', message);
      } else {
        await sock.sendMessage(sender, {
          text: 'Pilihan tidak valid. Silakan pilih A, B, atau C.',
        });
      }
      break;

    case 'screening':
      await handleScreening(sock, sender, textMessage, message);
      break;

    case 'info':
      await handleInfo(sock, sender, textMessage, message);
      break;

    case 'qna':
      await handleQnA(sock, sender, textMessage, message);
      break;

    default:
      await sessionManager.updateSessionState(phoneNumber, 'menu');
      await sendMenuMessage(sock, sender);
  }

  await sessionManager.updateLastActivity(phoneNumber);
}

async function handleGlobalAdminCommands(sock, sender, phoneNumber, message) {
  if (message.toLowerCase().includes('selesai')) {
    const isAdmin = await checkIfAdmin(phoneNumber);
    if (!isAdmin) {
      return false; 
    }

    console.log(`Admin ${phoneNumber} attempting global selesai command`);

    const matches = message.match(/selesai\s+(\d+)/i);
    let userNumber = null;

    if (matches && matches[1]) {
      userNumber = matches[1];
    } else {
      const numberMatches = message.match(/(\d+)/);
      if (numberMatches && numberMatches[1]) {
        userNumber = numberMatches[1];
      }
    }

    if (!userNumber) {
      await sock.sendMessage(sender, {
        text: 'Format perintah tidak valid. Gunakan format: selesai [nomor_pengguna]',
      });
      return true; 
    }

    try {
      const adminNumber = phoneNumber;
      console.log(
        `Checking if admin ${adminNumber} is assigned to user ${userNumber}`,
      );

      const assignedUser = await adminManager.getAssignedUser(adminNumber);
      console.log(`Admin ${adminNumber} is assigned to: ${assignedUser}`);

      if (assignedUser === userNumber) {
        console.log(`Releasing admin ${adminNumber} from user ${userNumber}`);
        const released = await adminManager.releaseAdmin(adminNumber);
        console.log(`Admin release result: ${released ? 'success' : 'failed'}`);

        await sock.sendMessage(sender, {
          text: `Anda telah menyelesaikan sesi chat dengan pengguna ${userNumber}.`,
        });

        await sock.sendMessage(userNumber + '@s.whatsapp.net', {
          text: 'Sesi chat dengan admin telah selesai. Terima kasih telah menggunakan layanan kami.\n\nKetik *menu* untuk kembali ke menu utama.',
        });

        const nextAssignment = await adminManager.processQueue();
        if (nextAssignment) {
          try {
            await sock.sendMessage(
              nextAssignment.adminNumber + '@s.whatsapp.net',
              {
                text: `Ada permintaan chat dari pengguna dengan nomor ${nextAssignment.userNumber} yang sedang menunggu dalam antrean. Anda ditugaskan untuk menangani permintaan ini.\n\n*PENTING*: Untuk menandai sesi chat selesai, ketik:\n*selesai ${nextAssignment.userNumber}*`,
              },
            );

            await sock.sendMessage(
              nextAssignment.userNumber + '@s.whatsapp.net',
              {
                text: 'Admin kami sudah tersedia dan akan segera menghubungi Anda.',
              },
            );
          } catch (error) {
            console.error('Error processing queue assignment:', error);
            await adminManager.releaseAdmin(nextAssignment.adminNumber);
          }
        }
      } else {
        await sock.sendMessage(sender, {
          text: `Anda tidak sedang menangani pengguna dengan nomor ${userNumber}. Periksa kembali nomor yang Anda masukkan.`,
        });
      }
    } catch (error) {
      console.error('Error in global selesai command:', error);
      await sock.sendMessage(sender, {
        text: 'Terjadi kesalahan saat memproses perintah. Silakan coba lagi nanti.',
      });
    }

    return true; 
  }

  if (message.toLowerCase() === 'status admin') {
    const isAdmin = await checkIfAdmin(phoneNumber);
    if (!isAdmin) {
      return false; 
    }

    try {
      const status = await adminManager.getQueueStatus();
      const currentUser = await adminManager.getAssignedUser(phoneNumber);

      let statusMessage = '*Status Admin*\n\n';
      statusMessage += `Admin yang tersedia: ${status.availableAdmins.length}\n`;
      statusMessage += `Jumlah antrean: ${status.queueLength}\n\n`;

      if (currentUser) {
        statusMessage += `Anda sedang menangani: ${currentUser}\n\n`;
      } else {
        statusMessage += `Anda tidak sedang menangani pengguna.\n\n`;
      }

      if (status.queueLength > 0) {
        statusMessage += 'Pengguna dalam antrean:\n';
        status.queuedUsers.forEach((user, index) => {
          statusMessage += `${index + 1}. ${user}\n`;
        });
      }

      await sock.sendMessage(sender, { text: statusMessage });
    } catch (error) {
      console.error('Error getting admin status:', error);
      await sock.sendMessage(sender, {
        text: 'Terjadi kesalahan saat memperoleh status admin. Silakan coba lagi nanti.',
      });
    }

    return true; 
  }

  return false; 
}

async function checkIfAdmin(phoneNumber) {
  try {
    const admins = await adminManager.getAllAdmins();
    return admins.some((admin) => admin.number === phoneNumber);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

async function sendWelcomeMessage(sock, to) {
  await sock.sendMessage(to, {
    text: `Selamat datang di Bot Informasi TBC! 👋\n\nBot ini dapat membantu Anda mendapatkan informasi tentang Tuberkulosis (TBC), melakukan skrining awal, dan menjawab pertanyaan umum.\n\nKetik *menu* untuk melihat layanan yang tersedia.`,
  });
}

async function sendMenuMessage(sock, to) {
  await sock.sendMessage(to, {
    text: `*MENU LAYANAN BOT TBC*\n\nPilih layanan dengan mengetik huruf yang sesuai:\n\nA. Screening TBC\nB. Informasi TBC\nC. QnA TBC\n\nContoh: ketik *A* untuk melakukan Screening TBC.`,
  });
}

module.exports = {
  handleIncomingMessage,
  handleGlobalAdminCommands,
  checkIfAdmin,
};
