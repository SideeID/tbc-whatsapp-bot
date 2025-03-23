# Bot WhatsApp TBC

Bot WhatsApp yang dirancang untuk menyediakan layanan informasi, skrining, dan tanya jawab terkait Tuberkulosis (TBC). Proyek ini bertujuan untuk meningkatkan kesadaran dan akses informasi tentang TBC serta skrining awal.

## Fitur Utama

- **Informasi TBC**: Layanan informasi berbasis AI menggunakan Google Gemini AI
- **Skrining TBC**: Alat skrining interaktif untuk menilai faktor risiko TBC
- **Tanya Jawab TBC**: Pertanyaan dan jawaban yang telah disiapkan tentang TBC dengan dukungan admin
- **Sistem Antrean Admin**: Penanganan efisien untuk pertanyaan pengguna dengan beberapa admin
- **Integrasi Database**: Penyimpanan data permanen untuk sesi pengguna, hasil skrining, dan data admin

## Teknologi yang Digunakan

- Node.js
- WhatsApp API melalui Baileys
- Google Gemini API untuk respons AI
- SQLite/Sequelize untuk penyimpanan database
- Manajemen sesi untuk percakapan yang berkesinambungan

## Persyaratan Sistem

- Node.js (v14 atau lebih tinggi)
- NPM atau Yarn
- Akun WhatsApp untuk bot
- Kunci API Google Gemini

## Cara Instalasi

1. Clone repositori:
```bash
git clone https://github.com/yourusername/tbc-whatsapp-bot.git
cd tbc-whatsapp-bot
```

2. Instal dependensi:
```bash
npm install
```

3. Buat file `.env` di root proyek berdasarkan contoh:
```
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key

BOT_NAME=TBC Info Bot
ADMIN_NUMBERS=6289xxxxxxxxx,6281xxxxxxxx

DB_NAME=tbc_bot
DB_USER=root
DB_PASS=
DB_HOST=localhost
DB_DIALECT=sqlite
```

4. Jalankan bot dalam mode pengembangan:
```bash
npm run dev
```

## Pengaturan Awal

1. Pindai kode QR yang ditampilkan di terminal dengan akun WhatsApp Anda
2. Tunggu pesan "Bot connected successfully!"
3. Bot siap digunakan

## Fitur untuk Pengguna

### Menu Utama
Pengguna dapat mengakses tiga layanan utama:
- **A. Screening TBC**: Penilaian risiko TBC interaktif
- **B. Informasi TBC**: Layanan informasi TBC berbasis AI
- **C. QnA TBC**: Pertanyaan umum tentang TBC

### Screening TBC
- Pengumpulan informasi pribadi (nama, usia, jenis kelamin)
- Penilaian berdasarkan gejala batuk, gejala lain, dan faktor risiko
- Klasifikasi hasil (dugaan positif/negatif)
- Rekomendasi berdasarkan hasil skrining
- Berbagi kontak untuk penyebaran kesadaran

### Informasi TBC (Sekawan AI)
- Tanyakan apa saja tentang Tuberkulosis
- Dapatkan informasi faktual dari sumber medis terpercaya
- Respons berbasis AI dalam format percakapan

### Tanya Jawab TBC
- Pertanyaan dan jawaban yang telah disiapkan tentang TBC
- Opsi untuk terhubung dengan admin untuk bantuan personal
- Sistem antrean admin untuk penanganan efisien

## Fitur untuk Admin

### Perintah Admin
Admin dapat menggunakan perintah berikut dari status chat mana pun:

- `selesai [nomor_pengguna]`: Menandai percakapan dengan pengguna sebagai selesai
- `status admin`: Memeriksa status admin, penugasan saat ini, dan antrean

### Sistem Antrean
- Distribusi adil pertanyaan pengguna di antara admin
- Penugasan otomatis ketika admin tersedia
- Sistem notifikasi untuk pertanyaan baru
- Kartu kontak untuk komunikasi pengguna yang mudah

## Struktur Proyek

```
tbc-whatsapp-bot/
├── src/
│   ├── app.js             # Penanganan koneksi WhatsApp
│   ├── index.js           # Titik masuk aplikasi
│   ├── controllers/       # Pengendali penanganan pesan
│   │   ├── index.js       # Pengendali utama
│   │   ├── info/          # Layanan informasi
│   │   ├── qna/           # Layanan tanya jawab
│   │   └── screening/     # Layanan skrining
│   ├── database/          # Konfigurasi database
│   │   ├── models/        # Model Sequelize
│   │   └── migrations/    # Migrasi database
│   └── utils/             # Fungsi utilitas
│       ├── adminManager.js # Manajemen admin
│       ├── helpers.js     # Fungsi pembantu
│       └── sessionManager.js # Manajemen sesi
├── sessions/              # Penyimpanan sesi WhatsApp
├── package.json           # Dependensi proyek
└── .env                   # Variabel lingkungan
```

## Dependensi

- `@whiskeysockets/baileys`: WhatsApp Web API
- `@google/generative-ai`: Google Gemini AI API
- `sequelize`: ORM untuk operasi database
- `sqlite3`: Mesin database
- `dotenv`: Manajemen variabel lingkungan
- `pino`: Utilitas logging
- `moment`: Penanganan tanggal

## Cara Penggunaan

### Untuk Pengguna
1. Mulai percakapan dengan nomor WhatsApp bot
2. Ketik "menu" untuk melihat opsi yang tersedia
3. Pilih layanan dengan mengetik A, B, atau C
4. Ikuti petunjuk untuk setiap layanan

### Untuk Admin
1. Pastikan nomor Anda ditambahkan ke ADMIN_NUMBERS di file .env
2. Terima notifikasi saat pengguna meminta bantuan admin
3. Gunakan "selesai [nomor_pengguna]" untuk menyelesaikan sesi pengguna
4. Periksa status admin dengan perintah "status admin"

## Kontribusi

Kontribusi sangat dipersilakan! Jangan ragu untuk mengirimkan Pull Request.

1. Fork repositori
2. Buat branch fitur Anda (`git checkout -b fitur/fitur-keren`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`)
4. Push ke branch (`git push origin fitur/fitur-keren`)
5. Buka Pull Request

## Ucapan Terima Kasih

- [WhatsApp Web API](https://github.com/WhiskeySockets/Baileys)
- [Google Gemini AI](https://ai.google.dev/)
- World Health Organization dan CDC untuk pedoman informasi TBC







git init 
git remote add origin https://github.com/SideeID/tbc-whatsapp-bot.git
git branch -M main

