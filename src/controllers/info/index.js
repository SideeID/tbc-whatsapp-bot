const { GoogleGenerativeAI } = require('@google/generative-ai');
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const infoSessions = {};

async function handleInfo(sock, sender, message, originalMessage) {
  if (message === 'start') {
    infoSessions[sender] = { active: true };
    await sock.sendMessage(sender, {
      text: '*Informasi TBC dengan Sekawan AI*\n\nAnda dapat menanyakan informasi seputar Tuberkulosis (TBC).\n\nContoh pertanyaan:\n- Bagaimana cara pencegahan TBC?\n- Apa perbedaan TBC aktif dan laten?\n- Apakah TBC berbahaya bagi ibu hamil?\n\nSilakan ajukan pertanyaan Anda, atau ketik *menu* untuk kembali ke menu utama.',
    });
    return;
  }

  if (message.toLowerCase() === 'menu') {
    delete infoSessions[sender];
    return;
  }

  if (!infoSessions[sender]) {
    infoSessions[sender] = { active: true };
  }

  try {
    await sock.sendPresenceUpdate('composing', sender);
    const response = await generateTBCInfo(message);

    await sock.sendMessage(sender, {
      text: `${response}\n\nApakah ada pertanyaan lain seputar TBC? Atau ketik menu untuk kembali ke menu utama.\n\n> Sekawan AI`,

      contextInfo: {
        quotedMessage: originalMessage.message,
        stanzaId: originalMessage.key.id,
        participant: originalMessage.key.participant || sender,
      },
    });
  } catch (error) {
    console.error('Error generating TBC info:', error);
    await sock.sendMessage(sender, {
      text: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi atau ketik *menu* untuk kembali ke menu utama.',

      contextInfo: {
        quotedMessage: originalMessage.message,
        stanzaId: originalMessage.key.id,
        participant: originalMessage.key.participant || sender,
      },
    });
  }
}

async function generateTBCInfo(query) {
  if (!API_KEY) {
    return 'Maaf, fitur AI belum diaktifkan. Silakan hubungi admin untuk informasi lebih lanjut.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
    Pertanyaan pengguna tentang Tuberkulosis (TBC): "${query}"
   
    Berikan jawaban yang informatif, akurat, dan mudah dipahami berdasarkan fakta medis terpercaya dari WHO dan CDC.
    Fokus pada informasi yang faktual tentang TBC.
    Jika pertanyaan tidak berkaitan dengan TBC, beri tahu pengguna bahwa Anda hanya dapat menjawab pertanyaan seputar TBC.
    Jawaban tidak lebih dari 300 kata dan dalam bahasa Indonesia.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error('Error with Gemini AI:', error);
    return 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini. Silakan coba lagi nanti.';
  }
}

module.exports = { handleInfo };
