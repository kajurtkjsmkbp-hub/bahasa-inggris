# 📖 Panduan Lengkap Instalasi & Pemeliharaan di Proxmox VE (LXC Container)
## LMS Bahasa Inggris Kelas IV SD (Khanza.NET English Junior)

Panduan ini ditujukan bagi Administrator Jaringan / Guru IT Sekolah untuk memasang aplikasi **Khanza.NET English Junior (LMS Bahasa Inggris)** pada container **LXC (Linux Container)** di **Proxmox Virtual Environment (PVE)**, baik secara mandiri (offline di lab sekolah) maupun online.

---

## 📑 Daftar Isi
1. [Spesifikasi Minimum & Rekomendasi](#1-spesifikasi-minimum--rekomendasi)
2. [Langkah 1: Membuat Container LXC di Proxmox VE](#2-langkah-1-membuat-container-lxc-di-proxmox-ve)
   - [Opsi A: Melalui Web GUI Proxmox](#opsi-a-melalui-web-gui-proxmox)
   - [Opsi B: Melalui Terminal CLI Proxmox (One-Liner)](#opsi-b-melalui-terminal-cli-proxmox-one-liner)
3. [Langkah 2: Menyiapkan Container (Update & Paket Pendukung)](#3-langkah-2-menyiapkan-container)
4. [Langkah 3: Mengunduh Source Code Aplikasi dari GitHub](#4-langkah-3-mengunduh-source-code-aplikasi)
5. [Langkah 4: Konfigurasi Web Server Nginx](#5-langkah-4-konfigurasi-web-server-nginx)
6. [Langkah 5: Pengujian Akses](#6-langkah-5-pengujian-akses)
7. [Langkah 6: Panduan Update & Pemeliharaan Berkala](#7-langkah-6-panduan-update--pemeliharaan-berkala)
8. [Script Otomatisasi (Opsional)](#8-script-otomatisasi-opsional)
9. [Troubleshooting & Solusi Masalah](#9-troubleshooting--solusi-masalah)

---

## 1. Spesifikasi Minimum & Rekomendasi

Aplikasi ini adalah *front-end static application* (HTML5, modern CSS, vanilla JavaScript, dan Web Speech API bawaan peramban). Tidak membutuhkan database SQL berat, sehingga sangat hemat resource server:

| Parameter | Kebutuhan Minimum | Kebutuhan Rekomendasi (30–100 Klien Bersamaan) |
| :--- | :--- | :--- |
| **Sistem Operasi** | Debian 12 (Bookworm) / Ubuntu 22.04 LTS | Debian 12 (Bookworm) 64-bit |
| **CPU Core** | 1 vCPU | 1 - 2 vCPU |
| **RAM** | 256 MB | 512 MB - 1 GB |
| **Swap** | 256 MB | 512 MB |
| **Disk Storage** | 2 GB | 4 GB - 8 GB (SSD / NVMe) |
| **Network** | Bridge `vmbr0` (DHCP atau Static IP) | Static IP (contoh: `192.168.1.50/24`) |

---

## 2. Langkah 1: Membuat Container LXC di Proxmox VE

### Opsi A: Melalui Web GUI Proxmox

1. **Buka Web GUI Proxmox VE**: Akses `https://<ip-proxmox>:8006` melalui browser.
2. **Download Template OS** (jika belum ada):
   - Klik node server Anda (misal: `pve`) > pilih penyimpanan lokal (biasanya `local`).
   - Masuk ke tab **CT Templates** > klik **Templates**.
   - Cari dan download **Debian 12 Standard** (`debian-12-standard_..._amd64.tar.zst`) atau **Ubuntu 22.04/24.04**.
3. **Klik Tombol "Create CT"** di pojok kanan atas:
   - **Tab General**:
     - *Node*: pilih node Proxmox aktif.
     - *CT ID*: masukkan ID kosong (contoh: `105`).
     - *Hostname*: `lms-bahasa-inggris`.
     - *Password*: buat password root untuk container.
     - *Unprivileged container*: centang (✅ Ya, demi keamanan).
   - **Tab Template**:
     - Pilih template `debian-12-standard` yang telah diunduh.
   - **Tab Disks**:
     - *Storage*: `local-lvm` atau pool storage Anda.
     - *Disk size (GiB)*: `4` (atau `8`).
   - **Tab CPU**:
     - *Cores*: `1` (atau `2`).
   - **Tab Memory**:
     - *Memory (MiB)*: `512` (atau `1024`).
     - *Swap (MiB)*: `512`.
   - **Tab Network**:
     - *Bridge*: `vmbr0`.
     - *IPv4*: Masukkan IP statis (contoh: `192.168.1.50/24`) atau pilih **DHCP**.
     - *Gateway (IPv4)*: Masukkan IP router sekolah (contoh: `192.168.1.1`).
   - **Tab DNS**:
     - Kosongkan jika ingin mewarisi DNS host, atau masukkan `8.8.8.8` / IP server DNS lokal.
   - **Tab Confirm**:
     - Centang *Start after created* lalu klik **Finish**.

---

### Opsi B: Melalui Terminal CLI Proxmox (One-Liner)

Jika Anda menyukai terminal di Proxmox Host, Anda bisa langsung menjalankan perintah `pct create`:

```bash
# Sesuaikan nomor CT ID (105), path template, IP, dan gateway jaringan Anda
pct create 105 /var/lib/vz/template/cache/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname lms-bahasa-inggris \
  --cores 1 \
  --memory 512 \
  --swap 512 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.50/24,gw=192.168.1.1 \
  --unprivileged 1 \
  --onboot 1 \
  --start 1
```

---

## 3. Langkah 2: Menyiapkan Container

1. Buka menu **Console** pada container yang baru dibuat di Proxmox Web GUI (atau via CLI host: `pct enter 105`).
2. Login sebagai pengguna `root`.
3. Perbarui repositori paket Linux dan instal **Git** serta **Nginx Web Server**:

```bash
apt update && apt upgrade -y
apt install -y git nginx curl nano
```

4. Pastikan layanan Nginx berjalan dan aktif saat boot:
```bash
systemctl enable --now nginx
systemctl status nginx --no-pager
```

---

## 4. Langkah 3: Mengunduh Source Code Aplikasi

1. Clone repository langsung dari GitHub ke folder web `/var/www/bahasa-inggris`:

```bash
git clone https://github.com/kajurtkjsmkbp-hub/bahasa-inggris.git /var/www/bahasa-inggris
```

2. Atur kepemilikan dan hak akses berkas agar aman dan dapat dibaca oleh web server Nginx:

```bash
chown -R www-data:www-data /var/www/bahasa-inggris
chmod -R 755 /var/www/bahasa-inggris
```

---

## 5. Langkah 4: Konfigurasi Web Server Nginx

1. Buat file konfigurasi virtual host baru untuk aplikasi:

```bash
nano /etc/nginx/sites-available/bahasa-inggris
```

2. Salin dan tempel konfigurasi berikut:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name _; # Menerima akses via IP container atau nama domain lokal

    root /var/www/bahasa-inggris;
    index index.html;

    # Pengaturan routing berkas
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimasi Caching untuk file statis (CSS, JS, Gambar, Audio)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|mp3|wav|ogg|webp)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # Kompresi Gzip untuk menghemat kuota dan mempercepat akses murid
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Keamanan dasar header HTTP
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

3. Simpan berkas (`Ctrl + O`, lalu `Enter`, lalu `Ctrl + X`).

4. Nonaktifkan situs default bawaan Nginx dan aktifkan konfigurasi baru:

```bash
# Hapus symlink default
rm -f /etc/nginx/sites-enabled/default

# Aktifkan konfigurasi bahasa-inggris
ln -s /etc/nginx/sites-available/bahasa-inggris /etc/nginx/sites-enabled/

# Uji sintaks Nginx
nginx -t
```

Jika output menampilkan:
```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

5. Muat ulang Nginx:
```bash
systemctl restart nginx
```

---

## 6. Langkah 5: Pengujian Akses

1. Buka peramban (Google Chrome / Mozilla Firefox / Microsoft Edge) dari laptop atau HP yang terhubung ke jaringan sekolah (Wi-Fi/LAN).
2. Masukkan alamat IP Container LXC:
   ```text
   http://192.168.1.50   <-- (Ganti dengan IP container Anda)
   ```
3. Uji fitur:
   - Pilih unit materi (Unit 1 s/d 10).
   - Klik ikon speaker / tombol suara untuk memastikan pelafalan suara berjalan lancar.
   - Buka kuis dan periksa responsivitas di HP / Tablet.

---

## 7. Langkah 6: Panduan Update & Pemeliharaan Berkala

Jika ada pembaruan modul materi baru, perbaikan kata, atau fitur baru yang di-push ke GitHub:

### Cara 1: Update Singkat Manual (Rekomendasi)
Masuk ke terminal LXC Container dan jalankan perintah satu baris berikut:

```bash
cd /var/www/bahasa-inggris && git pull origin main && chown -R www-data:www-data /var/www/bahasa-inggris && systemctl reload nginx
```

---

### Cara 2: Update Bersih (Jika Terjadi Konflik File Lokal)
Jika Anda sempat mengubah file secara manual di server dan ingin menyamakan persis dengan repositori GitHub:

```bash
cd /var/www/bahasa-inggris
git fetch origin main
git reset --hard origin/main
chown -R www-data:www-data /var/www/bahasa-inggris
systemctl reload nginx
```

---

### Cara 3: Menggunakan Perintah Helper Cepat `update-lms`

Anda dapat membuat shortcut perintah agar siapa pun yang merawat server cukup mengetik `update-lms`:

1. Buat script helper di `/usr/local/bin/update-lms`:
```bash
cat << 'EOF' > /usr/local/bin/update-lms
#!/bin/bash
set -e
echo "🔄 Memeriksa & Mengunduh Update LMS Bahasa Inggris..."
cd /var/www/bahasa-inggris
git pull origin main
chown -R www-data:www-data /var/www/bahasa-inggris
chmod -R 755 /var/www/bahasa-inggris
systemctl reload nginx
echo "✅ Pembaruan Selesai! Versi terbaru sudah aktif."
EOF

chmod +x /usr/local/bin/update-lms
```

2. Di kemudian hari, cukup ketik:
```bash
update-lms
```

---

## 8. Script Otomatisasi (Opsional)

Di dalam repositori ini, telah disediakan script otomatisasi:
- `scripts/setup-lxc.sh`: Script instalasi otomatis Nginx dan konfigurasi vhost.
- `scripts/update.sh`: Script pembaruan repository sekali klik.

Cara menggunakan script otomatisasi pada container Debian/Ubuntu baru:
```bash
# 1. Masuk ke root direktori
apt update && apt install -y git
git clone https://github.com/kajurtkjsmkbp-hub/bahasa-inggris.git /var/www/bahasa-inggris
cd /var/www/bahasa-inggris

# 2. Jalankan setup otomatis
bash scripts/setup-lxc.sh
```

---

## 9. Troubleshooting & Solusi Masalah

### 1. Website Tidak Bisa Diakses dari Komputer Siswa
- Periksa status Nginx: `systemctl status nginx`
- Pastikan firewall Proxmox atau UFW di container tidak memblokir port 80:
  ```bash
  ufw allow 80/tcp
  ```
- Coba tes ping dari komputer klien ke IP container LXC: `ping 192.168.1.50`.

### 2. Suara Pelafalan Kata (Audio) Tidak Bunyi
- Aplikasi menggunakan browser native **Web Speech Synthesis API**.
- Pastikan peramban klien (Chrome/Edge/Firefox) tidak dalam keadaan *mute*.
- Pada sistem operasi tertentu, pastikan paket bahasa Inggris (*English Voice Data*) terpasang di sistem operasi komputer atau HP klien.
- Fitur suara membutuhkan interaksi pertama siswa (klik layar atau klik tombol play audio) sesuai kebijakan *autoplay* peramban modern.

### 3. Container Kehabisan Storage
- Cek pemakaian disk di dalam container: `df -h /`
- Bersihkan cache paket apt: `apt clean && rm -rf /var/lib/apt/lists/*`
- Jika butuh memperbesar disk, Anda dapat me-resize langsung dari Proxmox Web GUI (**LXC** > **Resources** > **Root Disk** > **Volume Action** > **Resize**).

---
*Dibuat untuk memudahkan deploy media pembelajaran interaktif bagi siswa dan guru.*
