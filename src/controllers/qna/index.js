const { isWithinWorkHours } = require('../../utils/helpers');
const adminManager = require('../../utils/adminManager');
const sessionManager = require('../../utils/sessionManager');

const tbcQuestions = [
  {
    id: 1,
    question: '*Apa itu TBC?* 🦠',
    answer:
      'Tuberkulosis (TB) adalah penyakit yang disebabkan oleh bakteri Mycobacterium tuberculosis yang menyebar dari orang ke orang melalui udara. TBC biasanya menyerang paru-paru, namun bisa juga menyerang dan merusak bagian tubuh mana pun, seperti otak, ginjal, atau tulang belakang. Seseorang dengan TBC bisa meninggal tanpa pengobatan.',
  },
  {
    id: 2,
    question: '*Bagaimana cara penularan TBC?* 😷',
    answer:
      '*Cara Penularan TBC:*\n\n✨ Bakteri TBC masuk ke udara ketika penderita TBC paru-paru atau tenggorokan batuk, bersin, atau berbicara\n✨ Bakteri dapat bertahan di udara selama beberapa jam\n✨ Orang yang menghirup udara yang mengandung bakteri TBC dapat tertular (infeksi TBC laten)\n\n*Risiko Penularan:*\nPenularan sering terjadi pada orang-orang yang menghabiskan waktu bersama sehari-hari, seperti:\n• Anggota keluarga\n• Rekan kerja\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 3,
    question: '*Apakah vaksin TBC tersedia?* 💉',
    answer:
      '*Tentang Vaksin TBC:*\n\n✅ BCG (Bacille Calmette-Guerin) adalah vaksin untuk TBC\n❗ Vaksin tidak selalu memberikan perlindungan 100%\n⚡ BCG banyak digunakan di negara dengan prevalensi TBC tinggi\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 4,
    question: '*Apa saja gejala TBC?* 🤒',
    answer:
      '*Jenis-jenis TB berdasarkan kondisi:*\n\n*1. TB Pasif:* 😴\n• Bakteri dalam keadaan tidak aktif\n• Tidak menimbulkan gejala\n• Tidak menular\n• Bisa berubah menjadi aktif\n\n*2. TB Aktif:* ⚠️\nGejala utama:\n• Batuk berdahak\n• Batuk darah\n• Nyeri dada saat bernafas/batuk\n• Penurunan berat badan\n• Demam\n• Berkeringat malam\n• Kehilangan selera makan\n• Meriang\n\n*Gejala TB di organ lain:* 🔍\n• Nyeri punggung (TB tulang)\n• Pembengkakan kelenjar\n• Kencing berdarah (TB ginjal)\n• Sakit kepala/kejang (TB otak)\n• Sakit perut (TB usus)\n\n*Faktor Risiko:* ⚠️\n• Diabetes\n• HIV/AIDS\n• Kekurangan gizi\n• Penggunaan tembakau\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 5,
    question: '*Apakah TBC pada anak berbahaya?* 👶',
    answer:
      '*Gejala TBC pada Anak:* 🔍\n\n❗ Gejala TBC pada anak cenderung lebih sulit dikenali karena tidak khas dan sering dianggap sebagai gejala penyakit lain.\n\n*Gejala yang mungkin ditemukan:* 📝\n\n✨ Batuk persisten >2 minggu\n✨ Berat badan menurun/gagal tumbuh\n✨ Pembengkakan kelenjar getah bening\n✨ Demam terus-menerus >2 minggu\n✨ Anak tampak lemas dan kurang aktif\n✨ Gejala tidak membaik dengan antibiotik\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 6,
    question: '*Apa itu TBC Resisten Obat ?* 💊',
    answer:
      'Tuberkulosis yang resistan terhadap obat Tuberculosis Multii Drug Resistant (TB-MDR) adalah suatu bentuk TBC yang disebabkan oleh bakteri yang tidak merespons terhadap isoniazid dan rifampisin, yang merupakan dua obat TBC lini pertama yang paling efektif. TB-MDR dapat diobati dan disembuhkan dengan menggunakan obat lini kedua. Namun, pilihan pengobatan lini kedua memerlukan obat-obatan ekstensif yang mahal dan beracun.\n\nDalam beberapa kasus, resistensi obat yang lebih luas dapat terjadi dan dikenal dengan istilah Extended Drug Resistant TBC (TB-XDR) yang disebabkan oleh bakteri yang tidak memberikan respons terhadap obat TBC lini kedua yang paling efektif dapat menyebabkan pilihan pengobatan bagi pasien menjadi sangat terbatas.\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 7,
    question: '*Kapan harus ke dokter?* 🏥',
    answer:
      'Segera periksakan ke dokter jika Anda atau anak Anda mengalami gejala TBC, terutama jika tinggal bersama atau ada kontak erat dengan penderita TBC. Diagnosis dan pengobatan dini pada penyakit ini dapat membantu mengurangi kemungkinan terjadinya komplikasi.\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 8,
    question:
      '*Pemeriksaan apa saja yang harus dilakukan untuk mendeteksi TBC?* 🔍',
    answer:
      'Jika pasien diduga mengalami TBC, dokter akan meminta pasien menjalani pemeriksaan dahak yang disebut pemeriksaan BTA. Pada kasus TBC pada organ selain paru, pemeriksaan BTA juga dapat dilakukan dengan menggunakan sampel selain dahak. Jika dokter membutuhkan hasil yang lebih spesifik, pasien akan dianjurkan untuk menjalani tes kultur BTA. Tes ini juga menggunakan sampel dahak pasien, tetapi memerlukan waktu yang lebih lama. Selain pemeriksaan BTA, dokter dapat melakukan serangkaian pemeriksaan TBC lainnya untuk mendukung diagnosis, yaitu:\n• Tes kulit mantoux atau tuberculin skin test\n• Tes darah IGRA (Interferon Gamma Release Assay)\n• Bronkoskopi\n• Foto Rontgen\n• CT scan\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 9,
    question: '*Bagaimana cara mencegah TBC?* 🛡️',
    answer:
      'Beberapa langkah upaya pencegahan Tuberkulosis yakni:\n\n*1. Pencegahan primer:*\n• Vaksin BCG (Bacillus Calmette-Guerin). Di Indonesia, vaksin ini termasuk dalam daftar imunisasi wajib dan diberikan sebelum bayi berusia 2 bulan. Bagi yang belum pernah menerima vaksin BCG, dianjurkan untuk melakukan vaksin bila terdapat salah satu anggota keluarga yang menderita TBC.\n• Melakukan Terapi Pencegahan Tuberkulosis (TPT) dianjurkan untuk orang yang memiliki kontak erat dengan penderita TBC agar menurunkan risiko tertular.\n• Cuci Tangan Pakai Sabun utamanya saat setelah buang air dan melakukan aktivitas serta sebelum makan, serta memakai masker saat berinteraksi dengan pasien TBC.\n• Tutup mulut saat bersin, batuk, dan tertawa atau gunakan tisu untuk menutup mulut, tisu yang sudah digunakan dimasukan kedalam plastik dan di buang ke kotak sampah.\n• Jangan tidur sekamar dengan orang lain, sampai dokter menyatakan TBC yang diderita tidak lagi menular.\n• Pastikan rumah memiliki sirkulasi udara yang baik, misalnya dengan sering membuka pintu dan jendela agar udara segar serta sinar matahari dapat masuk.\n\n*2. Pencegahan sekunder:*\n• Melakukan tes dahak di fasilitas layanan kesehatan terdekat\n• Melakukan tes kulit tuberculin pada kelompok risiko tinggi seperti imigran dan kontak erat dengan pasien TBC, petugas kesehatan\n• Melakukan pemeriksaan lanjutan rontgen dada pada orang dengan hasil tes kulit tuberculin positif\n• Melaksanakan rangkaian pengobatan Tuberkulosis secara teratur dan tidak putus obat\n\n*3. Pencegahan tersier:*\n• Pencegahan penyakit paru kronis akibat menghirup udara tercemar debu pekerja tambang\n• Melakukan rehabilitasi\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
  {
    id: 10,
    question: '*Apa yang harus dilakukan jika positif TBC?* ⚠️',
    answer:
      'Ada beberapa hal yang dapat dilakukan saat anda dinyatakan positif menderita TBC:\n• Berobat secepatnya ke Puskesmas atau Fasilitas Kesehatan terdekat\n• Melakukan pengobatan sampai tuntas\n• Melakukan kontrol dan pendampingan\n• Menjaga kesehatan untuk mencegah adanya kekambuhan\n• Segera mendapatkan vaksin BCG\n• Menerapkan etika batuk yang baik\n• Melakukan investigasi kontak melakukan pengecekan tes TBC dengan kontak terdekat agar memutus rantai penularan\n\n_Yuk segera lakukan screening tuberkulosis sekarang!_ 🏥\nKlik link berikut: https://sekawanstb.com/screening',
  },
];

async function handleQnA(sock, sender, message) {
  if (message === 'start') {
    let questionList = '*QnA TBC - Pertanyaan Umum*\n\n';
    tbcQuestions.forEach((q) => {
      questionList += `${q.id}. ${q.question}\n`;
    });

    questionList += '\nKetik nomor pertanyaan untuk melihat jawabannya.\n';
    questionList +=
      'Ketik *admin* untuk berbicara dengan admin (hanya tersedia pada jam kerja 09.00-16.00).\n';
    questionList += 'Ketik *menu* untuk kembali ke menu utama.';

    await sock.sendMessage(sender, { text: questionList });
    return;
  }

  if (message.toLowerCase() === 'admin') {
    if (isWithinWorkHours()) {
      const userNumber = sender.split('@')[0];

      const adminNumber = await adminManager.assignUserToAdmin(userNumber);

      if (adminNumber) {
        await sock.sendMessage(sender, {
          text: 'Permintaan chat dengan admin telah diterima. Mohon tunggu sebentar, admin kami akan segera menghubungi Anda.',
        });

        try {
          await sock.sendMessage(adminNumber + '@s.whatsapp.net', {
            text: `Ada permintaan chat dari pengguna dengan nomor ${userNumber}. Anda ditugaskan untuk menangani permintaan ini.\n\n*PENTING*: Untuk menandai sesi chat selesai, ketik:\n*selesai ${userNumber}*`,
          });

          try {
            const vcard = `BEGIN:VCARD
VERSION:3.0
N:User ${userNumber}
FN:User ${userNumber}
NICKNAME:TBC User
TEL;type=CELL;type=VOICE;waid=${userNumber}:+${userNumber}
NOTE:TBC Bot User
END:VCARD`;

            await sock.sendMessage(adminNumber + '@s.whatsapp.net', {
              contacts: {
                displayName: `User ${userNumber}`,
                contacts: [{ vcard }],
              },
            });
          } catch (vcardError) {
            console.log(
              'Failed to send vCard but text message was sent:',
              vcardError.message,
            );
          }
        } catch (error) {
          console.error('Error notifying admin:', error);
          await adminManager.releaseAdmin(adminNumber);

          await sock.sendMessage(sender, {
            text: 'Terjadi kesalahan saat menghubungi admin. Silakan coba lagi nanti.',
          });
        }
      } else {
        const queuePosition = await adminManager.getQueuePosition(userNumber);

        await sock.sendMessage(sender, {
          text: `Semua admin kami sedang sibuk saat ini. Anda masuk dalam antrean (posisi: ${queuePosition}). Mohon tunggu sampai admin tersedia.`,
        });

        const queueStatus = await adminManager.getQueueStatus();

        if (queueStatus.availableAdmins.length > 0) {
          for (const adminNum of queueStatus.availableAdmins) {
            try {
              await sock.sendMessage(adminNum + '@s.whatsapp.net', {
                text: `Pengguna ${userNumber} masuk dalam antrean. Total antrean saat ini: ${queueStatus.queueLength}.`,
              });

              try {
                const queueUserVcard = `BEGIN:VCARD
VERSION:3.0
N:User ${userNumber}
FN:User ${userNumber}
NICKNAME:TBC User
TEL;type=CELL;type=VOICE;waid=${userNumber}:+${userNumber}
NOTE:TBC Bot User (In Queue)
END:VCARD`;

                await sock.sendMessage(adminNum + '@s.whatsapp.net', {
                  contacts: {
                    displayName: `User ${userNumber}`,
                    contacts: [{ vcard: queueUserVcard }],
                  },
                });
              } catch (vcardError) {
                console.log(
                  `Failed to send vCard to admin ${adminNum}, but text notification was sent:`,
                  vcardError.message,
                );
              }
            } catch (error) {
              console.error(
                `Error sending queue notification to admin ${adminNum}:`,
                error,
              );
            }
          }
        }
      }
    } else {
      await sock.sendMessage(sender, {
        text: 'Maaf, fitur chat dengan admin hanya tersedia pada jam kerja (09.00-16.00). Silakan coba lagi pada jam kerja atau pilih pertanyaan dari daftar.',
      });
    }
    return;
  }

  if (message.toLowerCase().includes('selesai')) {
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

    if (userNumber) {
      const adminNumber = sender.split('@')[0];
      console.log(
        `Admin ${adminNumber} trying to complete session with user ${userNumber}`,
      );

      try {
        const assignedUser = await adminManager.getAssignedUser(adminNumber);
        console.log(`Admin ${adminNumber} is assigned to: ${assignedUser}`);

        if (assignedUser === userNumber) {
          console.log(`Releasing admin ${adminNumber} from user ${userNumber}`);
          const released = await adminManager.releaseAdmin(adminNumber);
          console.log(
            `Admin release result: ${released ? 'success' : 'failed'}`,
          );

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

              try {
                const nextUserVcard = `BEGIN:VCARD
VERSION:3.0
N:User ${nextAssignment.userNumber}
FN:User ${nextAssignment.userNumber}
NICKNAME:TBC User
TEL;type=CELL;type=VOICE;waid=${nextAssignment.userNumber}:+${nextAssignment.userNumber}
NOTE:TBC Bot User (From Queue)
END:VCARD`;

                await sock.sendMessage(
                  nextAssignment.adminNumber + '@s.whatsapp.net',
                  {
                    contacts: {
                      displayName: `User ${nextAssignment.userNumber}`,
                      contacts: [{ vcard: nextUserVcard }],
                    },
                  },
                );
              } catch (vcardError) {
                console.log(
                  'Failed to send vCard for queue assignment, but text message was sent:',
                  vcardError.message,
                );
              }

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
        console.error(
          `Error handling session completion for admin ${adminNumber}:`,
          error,
        );
        await sock.sendMessage(sender, {
          text: 'Terjadi kesalahan saat memperbarui status admin. Silakan coba lagi dengan format: selesai [nomor_pengguna]',
        });
      }
      return;
    } else {
      await sock.sendMessage(sender, {
        text: 'Format perintah tidak valid. Gunakan format: selesai [nomor_pengguna]',
      });
    }
    return;
  }

  if (message.toLowerCase() === 'status admin') {
    const adminNumber = sender.split('@')[0];

    const admin = await adminManager
      .getAllAdmins()
      .then((admins) => admins.find((a) => a.number === adminNumber));

    if (admin) {
      const status = await adminManager.getQueueStatus();
      const currentUser = await adminManager.getAssignedUser(adminNumber);

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
      return;
    }
  }

  const questionNumber = parseInt(message);
  if (
    !isNaN(questionNumber) &&
    questionNumber >= 1 &&
    questionNumber <= tbcQuestions.length
  ) {
    const question = tbcQuestions[questionNumber - 1];

    await sock.sendMessage(sender, {
      text: `*${question.question}*\n\n${question.answer}\n\n> Setelah mendapatkan informasi ini, apakah Anda tertarik untuk melakukan skrining TBC? Ketik *A* untuk melakukan skrining atau *menu* untuk kembali ke menu utama.`,
    });
    return;
  }

  await sock.sendMessage(sender, {
    text: 'Maaf, input tidak valid. Silakan ketik nomor pertanyaan (1-10), *admin* untuk berbicara dengan admin, atau *menu* untuk kembali ke menu utama.',
  });
}

module.exports = { handleQnA };
