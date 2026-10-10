#!/bin/bash
# ==============================================================================
# Script Setup Otomatis LMS Bahasa Inggris untuk LXC Proxmox (Debian/Ubuntu)
# ==============================================================================

set -e

echo "🚀 [1/5] Memperbarui sistem dan menginstal dependensi (Nginx, Git)..."
apt update
apt install -y nginx git curl nano

echo "🌐 [2/5] Mengatur hak akses direktori /var/www/bahasa-inggris..."
APP_DIR="/var/www/bahasa-inggris"
if [ ! -d "$APP_DIR" ]; then
    echo "Direktori $APP_DIR tidak ditemukan. Mengkloning dari GitHub..."
    git clone https://github.com/kajurtkjsmkbp-hub/bahasa-inggris.git "$APP_DIR"
fi

chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

echo "⚙️  [3/5] Mengonfigurasi Virtual Host Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/bahasa-inggris
server {
    listen 80;
    listen [::]:80;

    server_name _;

    root /var/www/bahasa-inggris;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|mp3|wav|ogg|webp)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Hapus default dan aktifkan konfigurasi baru
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/bahasa-inggris /etc/nginx/sites-enabled/

echo "🔍 [4/5] Menguji konfigurasi Nginx..."
nginx -t

echo "🔄 [5/5] Me-restart layanan Nginx..."
systemctl enable --now nginx
systemctl restart nginx

# Daftarkan helper update-lms ke /usr/local/bin
cat << 'EOF' > /usr/local/bin/update-lms
#!/bin/bash
set -e
echo "🔄 Mengunduh versi terbaru LMS Bahasa Inggris..."
git config --global --add safe.directory /var/www/bahasa-inggris 2>/dev/null || true
cd /var/www/bahasa-inggris
git fetch origin main
git reset --hard origin/main
chown -R www-data:www-data /var/www/bahasa-inggris
chmod -R 755 /var/www/bahasa-inggris
systemctl reload nginx
echo "✅ Pembaruan selesai! Web server telah dimuat ulang."
EOF
chmod +x /usr/local/bin/update-lms

IP_ADDR=$(hostname -I | awk '{print $1}')
echo "=================================================================="
echo "🎉 INSTALASI SELESAI & BERHASIL!"
echo "Akses LMS Bahasa Inggris melalui peramban: http://${IP_ADDR}"
echo "Untuk pembaruan di masa mendatang, cukup ketik perintah: update-lms"
echo "=================================================================="
