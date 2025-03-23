// src/utils/helpers.js
const moment = require('moment');

function getTextMessageContent(message) {
  if (!message.message) return null;

  if (message.message.conversation) {
    return message.message.conversation;
  }

  if (
    message.message.extendedTextMessage &&
    message.message.extendedTextMessage.text
  ) {
    return message.message.extendedTextMessage.text;
  }

  return null;
}

function isWithinWorkHours() {
  const now = moment();
  const hour = now.hour();
  const dayOfWeek = now.day();

  const isWorkday = dayOfWeek >= 1 && dayOfWeek <= 7;

  const isWorkHour = hour >= 9 && hour < 24;

  return isWorkday && isWorkHour;
}

function formatPhoneNumber(phoneNumber) {
  let cleaned = phoneNumber.replace(/\D/g, '');

  if (!cleaned.startsWith('62') && cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  return cleaned;
}

function shouldForwardToAdmin(message) {
  const lowercaseMsg = message.toLowerCase();
  const keywords = [
    'admin',
    'bantuan',
    'tolong',
    'bantu',
    'manusia',
    'orang',
    'operator',
    'staff',
  ];

  return keywords.some((keyword) => lowercaseMsg.includes(keyword));
}

function isAdmin(phoneNumber) {
  const adminNumbersStr =
    process.env.ADMIN_NUMBERS || process.env.ADMIN_NUMBER || '';
  const adminNumbers = adminNumbersStr
    .split(',')
    .map((num) => formatPhoneNumber(num.trim()));

  return adminNumbers.includes(formatPhoneNumber(phoneNumber));
}

module.exports = {
  getTextMessageContent,
  isWithinWorkHours,
  formatPhoneNumber,
  shouldForwardToAdmin,
  isAdmin,
};
