#!/bin/bash
# ==============================================================================
# Script Update Otomatis LMS Bahasa Inggris untuk Server LXC Proxmox
# ==============================================================================

set -e

APP_DIR="/var/www/bahasa-inggris"

echo "🔄 [1/3] Menarik perubahan terbaru dari repository GitHub..."
cd "$APP_DIR" || { echo "❌ Direktori $APP_DIR tidak ditemukan!"; exit 1; }

# Pastikan git mengizinkan root mengelola repositori milik www-data
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

git fetch origin main
git reset --hard origin/main

echo "🔒 [2/3] Mengatur perizinan berkas (permissions)..."
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

echo "🌐 [3/3] Memuat ulang (reload) Nginx Web Server..."
systemctl reload nginx

echo "✅ Sukses! Aplikasi LMS Bahasa Inggris telah berhasil diperbarui ke versi terbaru."
