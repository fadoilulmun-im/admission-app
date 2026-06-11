# PRD — Product Requirements Document
## Prototype Sistem Penerimaan Mahasiswa Baru
### Vibe Coding & Venture SEVIMA

---

## 1. Latar Belakang & Visi

Perguruan tinggi saat ini masih banyak mengelola proses PMB secara manual atau semi-digital — formulir fisik, pengumuman via papan pengumuman, dan koordinasi jadwal via WhatsApp. Ini menyebabkan informasi tidak sampai tepat waktu, data tidak terpusat, dan beban kerja panitia meningkat di setiap periode penerimaan.

**Visi produk:**
> Membangun prototype sistem PMB yang memungkinkan calon mahasiswa mendaftar, memantau status, dan mendapatkan informasi — serta memudahkan admin mengelola seluruh proses — dalam satu platform digital yang bersih dan mudah digunakan.

**Tujuan prototype ini:**
- Memvalidasi alur pendaftaran secara digital end-to-end
- Menggantikan proses manual yang paling bermasalah terlebih dahulu
- Menjadi dasar pengembangan sistem PMB yang lebih lengkap ke depannya

---

## 2. User Personas

### 2.1 Calon Mahasiswa
- **Siapa:** Siswa SMA/SMK/MA yang akan mendaftar ke perguruan tinggi
- **Kebutuhan utama:** Bisa mendaftar online kapan saja, tahu status pendaftarannya, tidak perlu datang ke kampus hanya untuk mengumpulkan formulir
- **Pain point saat ini:** Tidak tahu apakah berkas sudah diterima, jadwal tes sering berubah tanpa pemberitahuan resmi

### 2.2 Admin PMB
- **Siapa:** Staf panitia PMB yang mengelola data pendaftar dan proses seleksi
- **Kebutuhan utama:** Lihat semua data pendaftar terpusat, ubah status seleksi, export laporan
- **Pain point saat ini:** Data tersebar di spreadsheet berbeda, sering ada data duplikat atau tidak lengkap

### 2.3 Operator / Panitia Lapangan *(Fase 3)*
- **Siapa:** Panitia yang bertugas di lapangan saat hari tes berlangsung
- **Kebutuhan utama:** Verifikasi kehadiran peserta dengan cepat berdasarkan nomor pendaftaran
- **Pain point saat ini:** Absensi masih manual dengan kertas, rawan salah catat

---

## 3. Fitur per Persona

### Calon Mahasiswa
| # | Fitur | Fase |
|---|-------|------|
| CM-1 | Mengisi form pendaftaran online | 1 |
| CM-2 | Mendapatkan nomor pendaftaran otomatis | 1 |
| CM-3 | Mengecek status pendaftaran via nomor pendaftaran | 1 |
| CM-4 | Melihat jadwal tes seleksi | 2 |
| CM-5 | Melakukan daftar ulang (heregistrasi) setelah dinyatakan lolos | 3 |

### Admin PMB
| # | Fitur | Fase |
|---|-------|------|
| AD-1 | Login ke panel admin | 1 |
| AD-2 | Melihat daftar semua pendaftar | 1 |
| AD-3 | Mengubah status pendaftar (Menunggu / Lolos / Tidak Lolos) | 1 |
| AD-4 | Filter dan cari data pendaftar | 1 |
| AD-5 | Melihat statistik pendaftaran per prodi dan jalur | 2 |
| AD-6 | Export data pendaftar ke CSV | 2 |
| AD-7 | Membuat dan mengelola jadwal tes | 2 |
| AD-8 | Mengirim notifikasi status ke pendaftar | 3 |

---

## 4. Fase Pengembangan

### Fase 1 — Core Prototype (MVP)
**Scope:** Alur pendaftaran dasar end-to-end, data di localStorage
**Target:** Bisa didemonstrasikan sebagai prototype dalam 1 hari kerja
**Done when:**
- Calon mahasiswa bisa mendaftar dan mendapat nomor pendaftaran
- Admin bisa login, lihat daftar pendaftar, dan ubah status
- Cek status berfungsi dari sisi publik

### Fase 2 — Backend Integration
**Scope:** Data pindah ke server (Laravel API), fitur statistik dan ekspor
**Target:** Admin panel terhubung ke backend, data persisten
**Done when:**
- Admin dashboard konsumsi data dari Laravel API
- Export CSV berfungsi
- Statistik per prodi dan jalur akurat

### Fase 3 — Full System
**Scope:** Autentikasi proper, fitur heregistrasi, notifikasi, operator tools
**Target:** Siap diuji oleh pengguna nyata (UAT)
**Done when:**
- Semua fitur dari tabel di atas tersedia
- Autentikasi menggunakan Laravel Sanctum
- Data tersimpan di PostgreSQL

---

## 5. Acceptance Criteria (Fase 1)

| Fitur | Kriteria Diterima |
|-------|-------------------|
| Form pendaftaran | Semua field tervalidasi, submit gagal jika ada field kosong atau format salah |
| Nomor pendaftaran | Format PMB-2025-XXXX, unik setiap submit |
| Cek status | Input nomor pendaftaran → tampilkan nama, prodi, jalur, dan status dengan benar |
| Login admin | Tolak kredensial salah, simpan sesi di sessionStorage |
| Tabel pendaftar | Menampilkan semua data dari localStorage, filter real-time berfungsi |
| Ubah status | Perubahan status langsung tampil di badge tanpa reload halaman |

---

## 6. Non-Functional Requirements

- **Responsivitas:** Semua halaman harus dapat digunakan di layar mobile (min. 375px)
- **Performa:** Halaman utama harus selesai render dalam < 2 detik
- **Aksesibilitas:** Semua input harus punya label yang jelas, tombol harus bisa diketuk di mobile (min. 44px height)
- **Konsistensi:** Warna, font, dan komponen harus konsisten di seluruh halaman

---

## 7. Out of Scope (Prototype Ini)

- Integrasi dengan SIAKAD atau sistem kampus yang sudah ada
- Pembayaran online (UKT, biaya pendaftaran)
- Verifikasi dokumen oleh panitia secara digital
- Mobile app (iOS/Android)
- Multi-perguruan-tinggi (hanya untuk 1 kampus)
