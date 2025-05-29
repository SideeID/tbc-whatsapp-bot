const db = require('../../database/models');
const sessionManager = require('../../utils/sessionManager');

const screeningQuestions = [
  {
    id: 'batuk1',
    section: 'BATUK',
    question: 'Apakah anda mengalami batuk selama 2 minggu atau lebih?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },

  {
    id: 'gejala1',
    section: 'GEJALA',
    question:
      'Apakah anda pernah mengalami sesak nafas dalam 2 bulan terakhir?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'gejala2',
    section: 'GEJALA',
    question:
      'Apakah anda pernah berkeringat saat malam hari tanpa berkegiatan?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'gejala3',
    section: 'GEJALA',
    question:
      'Apakah anda pernah mengalami demam meriang selama lebih dari 1 bulan?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },

  {
    id: 'risiko1',
    section: 'RISIKO',
    question: 'Apakah anda ibu hamil?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'risiko2',
    section: 'RISIKO',
    question: 'Apakah anda adalah lansia lebih dari 60 tahun?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'risiko3',
    section: 'RISIKO',
    question: 'Apakah anda menderita diabetes melitus?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'risiko4',
    section: 'RISIKO',
    question: 'Apakah anda merokok?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
  {
    id: 'risiko5',
    section: 'RISIKO',
    question: 'Apakah anda pernah berobat TBC dan tidak tuntas?',
    options: ['Ya', 'Tidak'],
    weight: 1,
  },
];

async function handleScreening(sock, sender, message) {
  const phoneNumber = sender.split('@')[0];
  const session = await sessionManager.getOrCreateSession(phoneNumber);

  if (message === 'start') {
    await sessionManager.updateSessionData(phoneNumber, {
      screening: {
        currentQuestion: 0,
        answers: {},
        personalInfo: {},
        contacts: [],
        contactStep: 0,
      },
    });

    await sock.sendMessage(sender, {
      text: 'Selamat datang di Screening TBC.\n\nSilakan masukkan nama Anda:',
    });

    return;
  }

  const screeningData = session.data?.screening || {
    currentQuestion: 0,
    answers: {},
    personalInfo: {},
    contacts: [],
    contactStep: 0,
  };

  if (!screeningData.personalInfo.name) {
    screeningData.personalInfo.name = message;
    await sessionManager.updateSessionData(phoneNumber, {
      screening: screeningData,
    });

    await sock.sendMessage(sender, {
      text: `Terima kasih, ${message}. Berapa usia Anda (dalam tahun)?`,
    });

    return;
  }

  if (!screeningData.personalInfo.age) {
    const age = parseInt(message);
    if (isNaN(age) || age < 1 || age > 120) {
      await sock.sendMessage(sender, {
        text: 'Mohon masukkan usia yang valid (angka 1-120):',
      });
      return;
    }

    screeningData.personalInfo.age = age;
    await sessionManager.updateSessionData(phoneNumber, {
      screening: screeningData,
    });

    await sock.sendMessage(sender, {
      text: 'Jenis kelamin Anda?\n\n1. Laki-laki\n2. Perempuan',
    });

    return;
  }

  if (!screeningData.personalInfo.gender) {
    let gender = null;

    if (
      message === '1' ||
      message.toLowerCase() === 'laki-laki' ||
      message.toLowerCase() === 'laki' ||
      message.toLowerCase() === 'l'
    ) {
      gender = 'Laki-laki';
    } else if (
      message === '2' ||
      message.toLowerCase() === 'perempuan' ||
      message.toLowerCase() === 'p'
    ) {
      gender = 'Perempuan';
    }

    if (!gender) {
      await sock.sendMessage(sender, {
        text: 'Mohon pilih jenis kelamin yang valid:\n\n1. Laki-laki\n2. Perempuan',
      });
      return;
    }

    screeningData.personalInfo.gender = gender;
    await sessionManager.updateSessionData(phoneNumber, {
      screening: screeningData,
    });

    await sock.sendMessage(sender, {
      text: 'Terima kasih atas informasinya. Sekarang kita akan mulai screening TBC.\n\nUntuk setiap pertanyaan, mohon jawab dengan mengetik *1* untuk Ya atau *2* untuk Tidak.',
    });

    await askScreeningQuestion(sock, sender, screeningData);

    return;
  }

  if (screeningData.currentQuestion < screeningQuestions.length) {
    let answer = null;

    if (
      message === '1' ||
      message.toLowerCase() === 'ya' ||
      message.toLowerCase() === 'y'
    ) {
      answer = 'Ya';
    } else if (
      message === '2' ||
      message.toLowerCase() === 'tidak' ||
      message.toLowerCase() === 'n' ||
      message.toLowerCase() === 't'
    ) {
      answer = 'Tidak';
    }

    if (!answer) {
      await sock.sendMessage(sender, {
        text: 'Mohon jawab dengan *1* untuk Ya atau *2* untuk Tidak:',
      });
      return;
    }

    const currentQuestion = screeningQuestions[screeningData.currentQuestion];
    screeningData.answers[currentQuestion.id] = answer;
    screeningData.currentQuestion++;
    await sessionManager.updateSessionData(phoneNumber, {
      screening: screeningData,
    });

    if (screeningData.currentQuestion >= screeningQuestions.length) {
      await sock.sendMessage(sender, {
        text: 'Terima kasih telah menjawab semua pertanyaan screening.\n\nSekarang, mohon masukkan nomor HP WhatsApp 3 orang teman/keluarga Anda yang Anda rekomendasikan untuk melakukan screening TBC juga.\n\nSilakan masukkan nomor HP WhatsApp pertama (contoh: 08xxxxxxxxxx):',
      });
      return;
    }

    await askScreeningQuestion(sock, sender, screeningData);
    return;
  }

  if (screeningData.contacts.length < 3) {
    const phoneRegex = /^(0|62|\+62)?[0-9]{9,13}$/;

    if (phoneRegex.test(message)) {
      let contactNumber = message.replace(/^0/, '62');
      if (!contactNumber.startsWith('62')) {
        contactNumber = '62' + contactNumber;
      }

      const digitsOnly = contactNumber.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 13) {
        await sock.sendMessage(sender, {
          text: 'Nomor HP harus terdiri dari 10-13 digit. Silakan masukkan nomor WhatsApp yang valid (contoh: 08xxxxxxxxxx atau 628xxxxxxxxxx).',
        });
        return;
      }

      screeningData.contacts.push(contactNumber);
      await sessionManager.updateSessionData(phoneNumber, {
        screening: screeningData,
      });

      if (screeningData.contacts.length < 3) {
        await sock.sendMessage(sender, {
          text: `Terima kasih. Silakan masukkan nomor HP WhatsApp ke-${
            screeningData.contacts.length + 1
          }:`,
        });
      } else {
        await calculateAndShowResults(sock, sender, screeningData);

        for (const contactNumber of screeningData.contacts) {
          await sendAutoMessageToContact(sock, contactNumber);
        }
      }
    } else {
      await sock.sendMessage(sender, {
        text: 'Nomor HP tidak valid. Silakan masukkan nomor WhatsApp yang valid (contoh: 08xxxxxxxxxx atau 628xxxxxxxxxx). Nomor harus terdiri dari 10-13 digit.',
      });
    }
    return;
  }

  if (message.toLowerCase() === 'menu') {
    await sessionManager.updateSessionState(phoneNumber, 'menu');
    await sock.sendMessage(sender, {
      text: 'Kembali ke menu utama.',
    });
    return;
  }

  await sock.sendMessage(sender, {
    text: 'Screening Anda telah selesai. Ketik *menu* untuk kembali ke menu utama.',
  });
}

function extractNumberFromVCard(vcard) {
  const telRegex = /TEL[^:]*:([\d+\-\s]+)/i;
  const waidRegex = /waid=(\d+)/i;

  let number = null;

  const waidMatch = vcard.match(waidRegex);
  if (waidMatch && waidMatch[1]) {
    number = waidMatch[1];
  } else {
    const telMatch = vcard.match(telRegex);
    if (telMatch && telMatch[1]) {
      number = telMatch[1].replace(/[^\d+]/g, '');
    }
  }

  return number;
}

async function askScreeningQuestion(sock, sender, screeningData) {
  const questionIndex = screeningData.currentQuestion;
  const question = screeningQuestions[questionIndex];

  let sectionName = '';
  switch (question.section) {
    case 'BATUK':
      sectionName = 'BATUK';
      break;
    case 'GEJALA':
      sectionName = 'GEJALA LAIN';
      break;
    case 'RISIKO':
      sectionName = 'FAKTOR RISIKO';
      break;
    default:
      sectionName = '';
  }

  await sock.sendMessage(sender, {
    text: `*${sectionName} - Pertanyaan ${questionIndex + 1}/${
      screeningQuestions.length
    }*\n\n${question.question}\n\n1. Ya\n2. Tidak`,
  });
}

async function sendAutoMessageToContact(sock, contactNumber) {
  try {
    const formattedNumber = contactNumber.includes('@s.whatsapp.net')
      ? contactNumber
      : `${contactNumber}@s.whatsapp.net`;

    const message = `[ Ayo Screening Tuberkulosis Gratis ]\n\nHalo, ini adalah pesan otomatis dari Sekawan's TB Jember yakni organisasi non profit yang bergerak dalam penanggulangan tuberkulosis di Kabupaten Jember.\n\nTuberkulosis adalah penyakit kronik menular akibat bakteri Mycobacterium tuberculosis yang dapat menyerang organ paru dan organ tubuh lain seperti kalenjar limfa, tulang, dan lainnya.\n\nTahukah Anda? Di tingkat nasional, Jawa Timur mendapatkan peringkat ke 2 dengan jumlah kasus tuberkulosis terbanyak, dan di tingkat Jawa Timur, Jember mendapatkan peringkat 2 dengan jumlah kasus tuberkulosis terbanyak.\n\nAyo ambil bagian dalam program eliminasi tuberkulosis sebelum tahun 2030 dengan melakukan cek status kesehatan terkait tuberkulosis secara gratis dengan klik link berikut:\nhttps://sekawanstb.my.id/screening`;

    await sock.sendMessage(formattedNumber, { text: message });

    console.log(`Auto message sent to ${contactNumber}`);
    return true;
  } catch (error) {
    console.error(`Error sending auto message to ${contactNumber}:`, error);
    return false;
  }
}

async function calculateAndShowResults(sock, sender, screeningData) {
  const phoneNumber = sender.split('@')[0];

  const hasBatuk =
    Object.keys(screeningData.answers).filter(
      (q) => q.startsWith('batuk') && screeningData.answers[q] === 'Ya',
    ).length > 0;

  const hasGejala =
    Object.keys(screeningData.answers).filter(
      (q) => q.startsWith('gejala') && screeningData.answers[q] === 'Ya',
    ).length > 0;

  const hasRisiko =
    Object.keys(screeningData.answers).filter(
      (q) => q.startsWith('risiko') && screeningData.answers[q] === 'Ya',
    ).length > 0;

  const isDugaPositif = hasBatuk && hasGejala && hasRisiko;
  const riskLevel = isDugaPositif ? 'Positif' : 'Negatif';

  let recommendation;
  if (isDugaPositif) {
    recommendation =
      'Hasil skrining menunjukkan anda diduga positif TB Paru. Tenang saja, TB dapat diobati dengan melakukan pengobatan, segera pastikan status anda dengan melakukan tes ke dokter.';
  } else {
    recommendation =
      'Selamat, hasil skrining anda menunjukkan anda diduga negatif TB Paru. Berikut adalah saran yang kami dapat berikan terkait menjaga kesehatan, semoga membantu.';
  }

  try {
    await db.ScreeningResult.create({
      userNumber: phoneNumber,
      name: screeningData.personalInfo.name,
      age: screeningData.personalInfo.age,
      gender: screeningData.personalInfo.gender,
      answers: screeningData.answers,
      contacts: screeningData.contacts,
      riskLevel: riskLevel,
      recommendation: recommendation,
      followedUp: false,
    });
  } catch (error) {
    console.error('Error saving screening result:', error);
  }

  let resultMessage = `*HASIL SCREENING TBC*\n\n`;
  resultMessage += `Nama: ${screeningData.personalInfo.name}\n`;
  resultMessage += `Usia: ${screeningData.personalInfo.age}\n`;
  resultMessage += `Jenis Kelamin: ${screeningData.personalInfo.gender}\n\n`;

  if (isDugaPositif) {
    resultMessage += `Status: *DIDUGA POSITIF TB PARU*\n\n`;
    resultMessage += `${recommendation}\n\n`;
    resultMessage += `Anda disarankan untuk mengunjungi fasilitas kesehatan terdekat untuk pemeriksaan lebih lanjut.\n\n`;
  } else {
    resultMessage += `Status: *DIDUGA NEGATIF TB PARU*\n\n`;
    resultMessage += `${recommendation}\n\n`;
    resultMessage += `Tetap jaga kesehatan Anda dengan pola hidup sehat:\n`;
    resultMessage += `• Konsumsi makanan bergizi seimbang\n`;
    resultMessage += `• Olahraga secara teratur\n`;
    resultMessage += `• Hindari merokok dan minuman beralkohol\n`;
    resultMessage += `• Istirahat yang cukup\n\n`;
  }

  resultMessage += `Terima kasih telah berpartisipasi dalam program screening TBC.\n\n`;
  resultMessage += `Ketik *menu* untuk kembali ke menu utama.`;

  await sock.sendMessage(sender, { text: resultMessage });

  await sessionManager.updateSessionState(phoneNumber, 'screeningComplete');
}

module.exports = { handleScreening };
