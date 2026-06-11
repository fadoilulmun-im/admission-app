# claude.md — Project Context for Claude
## Prototype Sistem Penerimaan Mahasiswa Baru

> File ini adalah **sumber kebenaran tunggal** tentang kondisi project saat ini.
> Update file ini setiap kali ada perubahan fase, struktur, atau keputusan penting.
> Claude membaca file ini sebelum memulai setiap sesi kerja.

---

## Ringkasan Project

| | |
|---|---|
| **Nama project** | Prototype Sistem Penerimaan Mahasiswa Baru |
| **Event** | Vibe Coding & Venture — SEVIMA |
| **Stack** | React 18 + Tailwind CSS (frontend) · Laravel 12 (backend) |
| **Fase aktif** | Fase 3 |
| **Repo** | *(isi dengan link GitHub jika sudah ada)* |

---

## Cara Membaca File Panduan Project Ini

| File | Isi | Baca untuk |
|------|-----|------------|
| `prd.md` | Fitur, user persona, acceptance criteria | Memahami *apa* yang dibangun |
| `skill.md` | Konvensi kode, struktur folder, standar teknis | Memahami *bagaimana* cara membangunnya |
| `agent.md` | Perilaku agent, cara merespons prompt | Memahami *bagaimana agent bekerja* |
| `claude.md` | Status project saat ini, commands, progress | Memahami *posisi project sekarang* |

---

## Setup & Commands

### Frontend (React + Vite)
```bash
# Install dependencies (sekali saja)
cd pmb-frontend
npm install

# Jalankan dev server
npm run dev
# → Berjalan di http://localhost:5173

# Build untuk production
npm run build
```

### Backend (Laravel) — Tersedia di Fase 2
```bash
# Install dependencies
cd pmb-backend
composer install

# Copy environment
cp .env.example .env
php artisan key:generate

# Setup database SQLite (Fase 2)
touch database/database.sqlite
php artisan migrate --seed

# Jalankan dev server
php artisan serve
# → Berjalan di http://localhost:8000
```

### Konfigurasi CORS (Laravel → React)
File: `config/cors.php`
```php
'allowed_origins' => ['http://localhost:5173'],
```

---

## Status Fase Saat Ini

### ✅ Fase 1 — Core Prototype (AKTIF)

**Yang sudah selesai:**
- [x] Setup React + Vite + Tailwind
- [x] Komponen `Home.jsx` (landing page)
- [x] Komponen `FormPendaftaran.jsx`
- [x] Generate nomor pendaftaran + simpan ke localStorage
- [x] Komponen `CekStatus.jsx`
- [x] Komponen `AdminLogin.jsx`
- [x] Komponen `Admin.jsx` (dashboard)
- [x] Komponen `TabelPendaftar.jsx`
- [x] Komponen `StatusBadge.jsx`
- [x] Filter real-time di tabel admin

**Yang belum selesai:**
- [ ] *(update saat mengerjakan)*

---

### 🔄 Fase 2 — Backend Integration (SELESAI)

**Yang sudah dikerjakan:**
- [x] Setup project Laravel 12
- [x] Model + Migration `Pendaftar`
- [x] `PendaftarController` (index, store, show, updateStatus)
- [x] `StorePendaftarRequest` + `UpdateStatusRequest`
- [x] Routes API (`/api/pendaftar`)
- [x] Seeder 3 data dummy
- [x] Konfigurasi CORS (allow localhost:5173)
- [x] Helper `api.js` di frontend
- [x] Koneksi semua komponen ke API (Form, CekStatus, TabelPendaftar, Admin)

---

### ✅ Fase 3 — Full System (SELESAI)

**Yang sudah dikerjakan:**
- [x] Sanctum auth: AdminAuthController (login/logout), AdminSeeder (admin/pmb2025)
- [x] User model HasApiTokens
- [x] `heregistrasi_at` migration + endpoint
- [x] Statistik endpoint (total, per_prodi, per_jalur)
- [x] Export CSV endpoint (protected, Bearer token)
- [x] 9 routes API dengan proteksi sanctum yang tepat
- [x] Frontend api.js: authApi, statistikApi, getExportCsvUrl, token sessionStorage
- [x] AdminLogin.jsx: Sanctum login dengan token
- [x] Admin.jsx: stat cards + progress bars per prodi/jalur + Export CSV + logout Sanctum
- [x] CekStatus.jsx: tombol heregistrasi (muncul saat status Lolos Seleksi + belum heregistrasi)

---

## Keputusan Teknis yang Sudah Dibuat

> Catat setiap keputusan penting di sini agar tidak diulang diskusinya.

| Keputusan | Alasan | Tanggal |
|-----------|--------|---------|
| Gunakan Laravel 12 (bukan 10) | Versi terbaru, PHP 8.3+ | 2026-06-11 |
| Database dev SQLite, prod PostgreSQL 17+ | Mudah setup lokal, production-grade | 2026-06-11 |
| Field API backend pakai snake_case | Konvensi Laravel default | 2026-06-11 |
| State pendaftar di-lift ke Admin, pass props ke TabelPendaftar | Satu sumber data, stat cards reaktif | 2026-06-11 |

---

## Struktur File Saat Ini

> Update bagian ini setiap kali ada file baru yang dibuat.

```
pmb-frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   └── Input.jsx
│   │   └── pmb/
│   │       ├── FormPendaftaran.jsx
│   │       ├── CekStatus.jsx
│   │       ├── AdminLogin.jsx
│   │       ├── TabelPendaftar.jsx
│   │       └── StatusBadge.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Admin.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   └── usePendaftar.js
│   ├── utils/
│   │   └── generateNomor.js
│   ├── constants/
│   │   └── index.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Konstanta Penting

```javascript
// src/constants/index.js
export const PRODI_LIST = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Manajemen Bisnis',
  'Akuntansi',
];

export const JALUR_LIST = ['SNBT', 'Mandiri', 'Prestasi'];

export const STATUS_LIST = ['Menunggu', 'Lolos Seleksi', 'Tidak Lolos'];

export const LOCALSTORAGE_KEY = 'pmb_pendaftar';

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'pmb2025',
};
```

---

## Catatan & Konteks Penting

- **Ini adalah prototype** — bukan sistem production. Prioritaskan yang bisa dilihat dan didemonstrasikan.
- **Fase 1 cukup dengan localStorage** — jangan mulai setup Laravel sebelum core frontend selesai.
- **Ikuti `skill.md`** — terutama konvensi penamaan, struktur komponen, dan format error.
- **Update file ini** setiap kali checklist berubah atau ada keputusan teknis baru.

---

## Log Sesi

> Isi setiap kali memulai atau mengakhiri sesi kerja.

| Sesi | Tanggal | Yang dikerjakan | Status |
|------|---------|-----------------|--------|
| 1 | 2026-06-11 | Setup Fase 1 lengkap: React+Vite+Tailwind, semua komponen, halaman publik & admin | ✅ Selesai |
| 3 | 2026-06-11 | Fase 3: Sanctum auth, statistik, export CSV, heregistrasi (backend + frontend) | ✅ Selesai |
