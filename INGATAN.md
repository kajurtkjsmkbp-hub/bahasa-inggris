# MEMORI PROYEK LMS BAHASA INGGRIS SD (INGATAN.MD)

Dokumen ini berisi rangkuman seluruh rekam jejak, arsitektur sistem, aturan bisnis, konfigurasi server, dan solusi teknis untuk aplikasi **Khanza.NET English Junior LMS**.

---

## 1. Identitas Proyek & Branding

- **Nama Aplikasi**: `Khanza.NET English Junior`
- **Sub-judul**: Media Belajar Bahasa Inggris SD (Kelas 4 SD - Kurikulum Merdeka: *My Next Words Grade 4*)
- **Perusahaan / Korporasi**: `PT. Khanza Digital Nusantara`
- **Tampilan Footer Standar**:
  ```text
  Khanza.NET English Junior • Media Belajar Bahasa Inggris SD
  A member of PT. Khanza Digital Nusantara
  ```
- **Repositori GitHub**:
  - Remote URL: `https://github.com/kajurtkjsmkbp-hub/bahasa-inggris.git`
  - Branch Utama: `main`
- **Prinsip Tampilan UI**:
  - Sederhana, bersih, ceria, dan tidak terlalu ramai (*clean and child-friendly*).
  - Menggunakan tema warna pastel modern, kartu materi rapi, dan navigasi yang intuitif untuk anak-anak dan guru.

---

## 2. Struktur Data & Konten Edukasi

Aplikasi telah diperluas ke kapasitas penuh (**100 item per unit x 10 unit = 1.000 item total per fitur**):

### A. 100 Kartu Materi / Flashcards per Unit (`js/data.js`)
- Total: **1.000 Flashcard** lengkap untuk 10 Unit.
- Setiap kartu memiliki:
  1. `image`: Ilustrasi gambar menarik.
  2. `english` & `indonesian`: Kosakata dalam bahasa Inggris dan terjemahannya.
  3. `phonetic` & `easyPronounce`: Panduan pelafalan bunyi santai anak (contoh: *"Rii-ding e buk"*).
  4. `spelling`: Ejaan huruf kapital terpisah (contoh: `R - E - A - D - I - N - G`).
  5. `exampleEn` & `exampleId`: Contoh kalimat sederhana beserta artinya.
  6. **3 Tombol Audio**:
     - `🔊 Suara`: Pengucapan normal via Web Speech API (`en-US`).
     - `🐢 Pelan`: Pengucapan lambat (*rate 0.65*).
     - `🔤 Eja`: Suara mengeja huruf satu per satu dengan penyorotan visual.
  7. Lencana penomoran kartu: `#1` s/d `#100`.

### B. 100 Soal Mini Game Susun Huruf & Tebak Suara (`js/gameBank.js`)
- `lmsGameBank.spelling`: **100 kata per unit** (Total: **1.000 kata**).
  - Dilengkapi navigasi `Kata #X dari 100`, huruf acak, pengecekan ejaan, bintang reward, dan tombol `Kata Berikutnya`.
- `lmsGameBank.listen`: **100 soal per unit** (Total: **1.000 soal**).
  - Dilengkapi tombol pemutar audio, 4 kartu pilihan visual & emoji acak, penanda `Soal #X dari 100`, dan tombol `Soal Berikutnya`.

### C. 100 Soal Kuis Pilihan Ganda & Bank Soal (`js/questionBank.js`)
- **100 soal per unit** (Total: **1.000 soal**) dengan 10 model variasi soal Kurikulum Merdeka:
  1. Arti Kosakata (Vocabulary Meaning)
  2. Terjemahan Indonesia-Inggris
  3. Kalimat Rumpang (Fill in the Blank)
  4. Ejaan Huruf (Spelling Bee)
  5. Identifikasi Gambar / Visual
  6. Dialog Percakapan Sederhana
  7. Benar atau Salah (True or False)
  8. Menjodohkan Pasangan Kata
  9. Tata Bahasa (Grammar Dasar / Simple Present / Present Continuous)
  10. Studi Kasus Nyata Sehari-hari
- Dilengkapi pembahasan mendalam (`explanation`) dan tombol audio untuk setiap soal.
- Tampil langsung di bagian bawah materi unit (#1 s/d #100) dengan filter kategori dan mode ujian (10, 25, 50, 100 soal).

---

## 3. Deployment Server: Proxmox LXC & Nginx

### Lokasi & Hak Akses
- Direktori Web Server: `/var/www/bahasa-inggris`
- Kepemilikan File: `www-data:www-data`
- Web Server: Nginx (Port default 80 atau disesuaikan).

### Masalah `fatal: detected dubious ownership`
Karena direktori `/var/www/bahasa-inggris` dimiliki oleh pengguna `www-data`, sedangkan perintah `git` di Proxmox dijalankan sebagai `root`, Git mencegah operasi demi alasan keamanan kecuali direktori tersebut didaftarkan sebagai `safe.directory`.

### Perintah Standar Update Proxmox LXC (One-Liner Resmi)
Jalankan perintah ini di console terminal Proxmox LXC:
```bash
git config --global --add safe.directory /var/www/bahasa-inggris && cd /var/www/bahasa-inggris && git fetch origin main && git reset --hard origin/main && chown -R www-data:www-data /var/www/bahasa-inggris && systemctl reload nginx
```

---

## 4. Daftar File Utama Proyek

| File / Direktori | Deskripsi & Fungsi |
|---|---|
| `index.html` | Struktur utama aplikasi, navbar, modal game, header branding, dan kontainer 100 soal |
| `css/style.css` | Styling visual responsif, ramah anak, layout kartu materi & kuis |
| `js/data.js` | Database utama 10 Unit materi (100 kartu flashcard per unit = 1.000 kartu) |
| `js/gameBank.js` | Database game: 100 kata spelling + 100 soal tebak suara per unit (total 2.000 entri) |
| `js/questionBank.js`| Database kuis interaktif: 100 soal bervariasi per unit (total 1.000 soal) |
| `js/audio.js` | Modul audio Web Speech API, sintesis suara, ejaan huruf, dan efek suara synthesizer |
| `js/app.js` | Logika interaksi aplikasi, sistem bintang/gamifikasi, navigasi unit, dan mesin game |
| `PANDUAN_PROXMOX_LXC.md` | Panduan lengkap langkah instalasi, konfigurasi vhost Nginx, dan troubleshooting Proxmox |
| `scripts/setup-lxc.sh` | Skrip instalasi otomatis awal di Proxmox LXC |
| `scripts/update.sh` | Skrip otomatisasi git pull & reload Nginx |
| `INGATAN.md` | File memori dan ringkasan pengetahuan AI untuk proyek ini |

---

*Disimpan dan diperbarui secara berkala untuk menjaga kesinambungan pengembangan Khanza.NET English Junior LMS.*
