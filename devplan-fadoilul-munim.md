# Development Plan — Modul Penjadwalan Tes Seleksi & Wawancara PMB
## Vibe Coding & Venture SEVIMA — oleh Fadoilul Mun'im

> **Konteks dokumen:** Ini adalah *development plan* untuk **menambahkan** modul penjadwalan tes ke sistem PMB (Penerimaan Mahasiswa Baru) yang **sudah berjalan** — bukan membangun dari nol.
>
> **Stack existing:** React 18 + Tailwind CSS (frontend) · Laravel 12 + SQLite + Sanctum (backend).
> **Fitur existing:** pendaftaran online, generate nomor pendaftaran, cek status, dashboard admin + statistik, update status, login admin (Sanctum), export CSV, tombol heregistrasi.
> **Tabel existing:** `pendaftars` dan `users` (beserta `personal_access_tokens` Sanctum).

> **Asumsi semantik kunci (mengikat seluruh dokumen):**
> Status `Lolos Seleksi` yang sudah ada diperlakukan sebagai **lolos seleksi administrasi/berkas**. Pendaftar yang berstatus `Lolos Seleksi` adalah peserta yang **berhak dijadwalkan** untuk **tes tulis + wawancara**, sebelum akhirnya melakukan heregistrasi. Dengan begitu modul ini berdiri **di antara** status `Lolos Seleksi` → `heregistrasi`, dan **hanya membaca** data pendaftar yang ada tanpa mengubah alur lama.

---

# BAGIAN 1 — Analisa Teknis

## 1.1 Identifikasi Pengguna

| Pengguna | Status di Sistem | Peran dalam Modul Penjadwalan |
|----------|------------------|-------------------------------|
| **Admin / Panitia PMB** | Sudah ada (`users`, login Sanctum) | **Peran baru:** membuat & mengelola sesi tes/wawancara, meng-*assign* peserta yang Lolos Seleksi ke sesi, memantau kapasitas & kehadiran, menyetujui/menolak permintaan reschedule, memicu notifikasi & reminder massal. |
| **Calon Mahasiswa / Peserta** | Sudah ada (`pendaftars`) | **Peran baru:** melihat jadwal tes & wawancara pribadinya, mengonfirmasi kehadiran (RSVP), mengajukan permintaan reschedule, menerima notifikasi (in-app/email/WhatsApp), melihat lokasi/link & instruksi tes. |
| **Penguji / Proktor / Pewawancara** | **Baru** — spesifik modul ini | Melihat daftar sesi yang ditugaskan kepadanya, melihat daftar peserta per sesi, menandai kehadiran (Hadir/Tidak Hadir), dan menginput catatan/hasil singkat tiap peserta. Disimpan di `users` dengan `role = 'penguji'`. |
| **Sistem (otomatis)** | Aktor non-manusia | Melakukan auto-assignment berbasis kuota, mengirim notifikasi multi-channel saat jadwal dibuat/berubah, dan mengirim reminder H-1 secara terjadwal. |

> Catatan: Admin dan Calon Mahasiswa **sudah ada** di modul pendaftaran — di sini peran mereka *bertambah*. **Penguji/Proktor adalah tipe pengguna baru** yang tidak relevan di modul pendaftaran namun esensial untuk modul penjadwalan.

## 1.2 Fitur Utama per Pengguna

> Hanya mencantumkan fitur **baru** yang belum ada di sistem (pendaftaran, cek status, dashboard, dll. tidak diulang).

**Admin / Panitia PMB**
1. CRUD **sesi tes/wawancara**: tanggal, waktu mulai–selesai, lokasi (offline) atau link (online), kuota, dan penguji yang ditugaskan.
2. **Assign peserta** Lolos Seleksi ke sesi — manual (pilih satu/banyak) atau **auto-distribute** sesuai kuota & prodi.
3. **Dashboard monitoring**: kapasitas terisi per sesi, rekap kehadiran (Terjadwal/Hadir/Tidak Hadir), dan peserta yang belum punya jadwal.
4. **Kelola permintaan reschedule**: lihat antrean, setujui (pindahkan ke sesi lain) atau tolak dengan alasan.
5. **Kirim notifikasi & reminder** multi-channel (in-app + email + WhatsApp) secara massal/per sesi.

**Calon Mahasiswa / Peserta**
1. **Lihat jadwal pribadi** (tes tulis & wawancara) cukup dengan memasukkan nomor pendaftaran di halaman Cek Status.
2. **Konfirmasi kehadiran** (RSVP) atas jadwal yang diterima.
3. **Ajukan reschedule** disertai alasan (dan preferensi sesi tujuan bila ada).
4. **Lihat detail logistik**: lokasi/ruangan atau link online, jam, dan instruksi tes.
5. **Terima notifikasi** otomatis saat jadwal dibuat/berubah serta reminder H-1.

**Penguji / Proktor / Pewawancara**
1. **Lihat daftar sesi** yang ditugaskan kepadanya.
2. **Lihat daftar peserta** per sesi (beserta status konfirmasi).
3. **Tandai kehadiran** peserta saat hari-H (Hadir/Tidak Hadir).
4. **Input catatan/hasil singkat** per peserta (internal, opsional).

## 1.3 Tech Stack yang Dipilih

> Stack utama tetap: **React 18 + Tailwind** (frontend) & **Laravel 12** (backend). Berikut komponen **tambahan** khusus modul ini.

| Komponen | Pilihan | Alasan |
|----------|---------|--------|
| Pemilih tanggal/waktu (FE) | `react-day-picker` | Memilih slot tanggal sesi tanpa membangun kalender dari nol; ringan & mudah di-styling Tailwind agar konsisten dengan UI existing. |
| Format tanggal lokal (FE) | `date-fns` (+ locale `id`) | Menampilkan tanggal/jam dalam format Indonesia yang rapi & konsisten lintas komponen. |
| Pengiriman email (BE) | **Laravel Mail** + Markdown Mailable | Native di Laravel, tanpa dependensi eksternal; template email jadwal & reminder mudah dibuat. |
| Antrean tugas (BE) | **Laravel Queue** driver `database` | Pengiriman email/WhatsApp dijalankan asinkron agar tidak memblok request; driver `database` cocok dengan SQLite (tabel `jobs`). |
| Penjadwal tugas (BE) | **Laravel Task Scheduler** + Artisan command | Mengirim reminder **H-1** otomatis (`schedule:run`) tanpa setup cron yang rumit. |
| Gateway WhatsApp (BE) | **Fonnte / Twilio** via `Http::post` (Laravel HTTP Client) | Sesuai brief (panitia kini pakai WhatsApp). Memakai HTTP Client bawaan, tanpa SDK berat; Fonnte murah & populer di Indonesia. |
| Notifikasi in-app | Reuse pola fetch existing pada halaman Cek Status | Peserta langsung melihat jadwal saat cek status; tanpa library tambahan. |

> Prinsip: **tidak mengganti stack inti**, hanya menambah pustaka pendukung yang relevan dengan kebutuhan modul (kalender, multi-channel notifikasi, penjadwalan reminder).

## 1.4 Batasan & Asumsi

1. **Read-only terhadap data lama.** Modul ini **membaca** `pendaftars` (status, nama, email, no HP) tetapi **tidak mengubah** kolom `status` maupun `heregistrasi_at` yang sudah ada — sehingga alur seleksi & heregistrasi existing tidak terganggu (anti-regresi).
2. **Hanya peserta Lolos Seleksi yang dijadwalkan.** Eligibility dijadwalkan diasumsikan dari `pendaftars.status = 'Lolos Seleksi'` (sesuai asumsi semantik di awal dokumen).
3. **Integrasi lewat foreign key, bukan modifikasi tabel lama.** Keterhubungan ke pendaftar memakai FK `pendaftar_id → pendaftars.id` di tabel baru. **Tidak ada** kolom baru yang ditambahkan ke `pendaftars`. Satu-satunya sentuhan ke tabel lama adalah penambahan kolom **additive** `role` di `users` (default `'admin'`, aman untuk data lama) guna membedakan admin vs penguji.
4. **Auth peserta tetap *lightweight*.** Peserta mengakses jadwalnya melalui **nomor pendaftaran** (mengikuti pola Cek Status existing), tanpa membangun sistem login peserta penuh — menjaga konsistensi arsitektur.
5. **Notifikasi bergantung konfigurasi `.env`.** Email (SMTP) dan WhatsApp (token gateway) dibaca dari `.env`. Bila tidak dikonfigurasi, modul tetap berjalan dengan **degradasi anggun**: notifikasi in-app tetap aktif, sedangkan email/WA dicatat `gagal`/`tertunda` di log tanpa menghentikan proses penjadwalan.

---

# BAGIAN 2 — Bisnis Proses & Flow

## 2.1 Flow Utama: Penjadwalan Tes Seleksi

```
[Admin]   → login via Sanctum (endpoint existing /api/auth/login)        → [terautentikasi, Bearer token]
[Admin]   → buat Sesi Tes (tipe, tanggal, waktu, lokasi/link, kuota)     → [INSERT sesi_tes]
[Admin]   → buka daftar peserta eligible
            ╰─ INTEGRASI (READ): GET pendaftars WHERE status='Lolos Seleksi' → [daftar peserta eligible]
          ↓ pilih cara assign
[Admin]   → assign peserta ke sesi (manual / auto-distribute by kuota)    → [INSERT jadwal_peserta, status_kehadiran='Terjadwal']
[Sistem]  → dispatch job notifikasi multi-channel
            ╰─ in-app + email (Laravel Mail) + WhatsApp (Http::post gateway) → [INSERT notifikasi_log: terkirim/gagal]
[Peserta] → buka halaman Cek Status, input nomor_pendaftaran (publik)     → [jadwal pribadi tampil + StatusBadge]
          ↓ jika belum konfirmasi
[Peserta] → klik "Konfirmasi Kehadiran"                                   → [UPDATE jadwal_peserta.konfirmasi_hadir=true, konfirmasi_at=now]
[Sistem]  → reminder H-1 (Task Scheduler harian cek sesi_tes.tanggal)     → [INSERT notifikasi_log: reminder terkirim]
[Penguji] → buka sesi yang ditugaskan → lihat daftar peserta
[Penguji] → tandai kehadiran tiap peserta saat hari-H                     → [UPDATE jadwal_peserta.status_kehadiran='Hadir'/'Tidak Hadir']
```

**Titik integrasi dengan sistem lama (eksplisit):**
- **Baca:** `pendaftars` (status, nama, email, nomor_hp) untuk menentukan eligibility & tujuan notifikasi.
- **Tulis:** seluruh penulisan terjadi di tabel **baru** (`sesi_tes`, `jadwal_peserta`, `notifikasi_log`) — tidak menyentuh kolom milik modul lama.

## 2.2 Flow Alternatif: Peserta Minta Reschedule

```
[Peserta] → di halaman jadwal (Cek Status) klik "Ajukan Reschedule"
[Peserta] → isi alasan (+ pilih sesi tujuan opsional) → submit            → [INSERT permintaan_reschedule, status='Menunggu']
[Sistem]  → notifikasi ke admin (antrean reschedule bertambah)            → [INSERT notifikasi_log]
[Admin]   → review permintaan
          ↓ jika DISETUJUI (dan kuota sesi tujuan masih ada)
[Admin]   → pindahkan peserta ke sesi baru                                → [UPDATE jadwal_peserta.sesi_tes_id; permintaan_reschedule.status='Disetujui', diproses_oleh, diproses_at]
[Sistem]  → notifikasi peserta: jadwal baru                               → [INSERT notifikasi_log]
          ↓ jika DITOLAK
[Admin]   → tolak + tulis alasan                                          → [UPDATE permintaan_reschedule.status='Ditolak', diproses_oleh, diproses_at]
[Sistem]  → notifikasi peserta: permintaan ditolak                        → [INSERT notifikasi_log]
```

## 2.3 Happy Path vs Error Path (untuk Flow 2.1)

**Happy path:** Admin membuat sesi → assign peserta → notifikasi terkirim ke 3 channel → peserta melihat & mengonfirmasi kehadiran → reminder H-1 terkirim → peserta hadir → penguji menandai "Hadir".

**Error path (≥2):**

| # | Kondisi Error | Respon Sistem |
|---|---------------|---------------|
| 1 | **Kuota sesi penuh** saat admin meng-assign peserta tambahan. | Validasi backend menolak assignment (jumlah `jadwal_peserta` untuk sesi ≥ `kuota`), mengembalikan pesan "Kuota sesi penuh", dan UI meminta admin memilih sesi lain. |
| 2 | **Pengiriman email/WhatsApp gagal** (SMTP down / nomor HP invalid / token gateway salah). | Jadwal **tetap tersimpan**; `notifikasi_log.status_kirim='gagal'` + `error_message`; notifikasi in-app tetap tampil; admin melihat indikator "notif gagal" dan dapat **kirim ulang**. (degradasi anggun) |
| 3 | **Double-assign** peserta ke sesi yang sama / tipe yang sama. | Dicegah oleh `UNIQUE(pendaftar_id, sesi_tes_id)`; backend mengembalikan error duplikasi sehingga peserta tidak terjadwal ganda. |

---

# BAGIAN 3 — Alur Data

## 3.1 Alur Data: Proses Penjadwalan

```
[Admin isi form sesi]                         (React: ScheduleAdmin.jsx)
        → [POST /api/jadwal/sesi]             (api.js: apiFetch + Bearer token)
        → [SesiTesController@store]           (Laravel: validasi StoreSesiTesRequest)
        → [INSERT tabel sesi_tes]             (Database)

[Admin assign peserta]
        → [GET /api/jadwal/eligible-peserta]  (BACA pendaftars WHERE status='Lolos Seleksi')  ← TITIK BACA LINTAS MODUL
        → [POST /api/jadwal/assign]           (JadwalPesertaController@store)
        → [INSERT jadwal_peserta]             (FK pendaftar_id → pendaftars.id, sesi_tes_id → sesi_tes.id)  ← TITIK TULIS
        → [dispatch Job KirimNotifikasi]      (Queue database)
              → Laravel Mail (email)
              → Http::post (WhatsApp gateway)
              → [INSERT notifikasi_log]
        → [Output ke Pengguna]                (dashboard admin: kapasitas terisi · halaman peserta: jadwal muncul)
```

## 3.2 Alur Data: Peserta Cek Jadwal

```
[Peserta input nomor_pendaftaran]             (React: CekStatus.jsx — halaman existing diperluas)
        → [GET /api/jadwal/peserta/{nomor_pendaftaran}]   (publik, pola sama seperti /pendaftar/{nomor})
        → [JadwalPesertaController@byNomor]   (Laravel)
              → JOIN pendaftars ⋈ jadwal_peserta ⋈ sesi_tes
        → [return { success: true, data: [ {sesi, tanggal, jam, lokasi/link, status_kehadiran} ] }]
        → [React render kartu jadwal + StatusBadge]       (komponen UI existing di-reuse)
        → [Output ke Pengguna]                (peserta melihat jadwal + tombol Konfirmasi / Ajukan Reschedule)
```

## 3.3 Data Apa yang Sensitif?

| Data / Field | Lokasi | Perlakuan Khusus & Alasan |
|--------------|--------|---------------------------|
| `nomor_hp`, `email` peserta | `pendaftars` | **PII.** Dipakai modul untuk kirim WhatsApp/email. Tidak boleh diekspos ke peserta lain maupun di endpoint publik selain ke pemilik nomor pendaftaran. |
| `link_online` sesi | `sesi_tes` | Hanya untuk peserta terjadwal & penguji sesi tersebut — mencegah orang tak diundang ikut bergabung ke tes/wawancara online. |
| Token Sanctum admin/penguji | `personal_access_tokens` | Rahasia auth; hanya dikirim sekali saat login, disimpan di `sessionStorage`, tidak pernah ditampilkan ulang. |
| `catatan_penguji` / hasil | `jadwal_peserta` | Penilaian internal; **tidak** ditampilkan ke peserta sampai diputuskan resmi, agar integritas seleksi terjaga. |
| `alasan` reschedule | `permintaan_reschedule` | Bisa memuat informasi pribadi/medis; akses terbatas untuk admin. |

---

# BAGIAN 4 — ERD / Desain Database

## 4.1 Daftar Tabel

**Tabel baru:**

| Nama Tabel | Deskripsi |
|------------|-----------|
| `sesi_tes` | Slot sesi tes tulis / wawancara yang dibuat admin (tanggal, waktu, lokasi/link, kuota, penguji). |
| `jadwal_peserta` | Penugasan peserta (pendaftar Lolos Seleksi) ke sebuah sesi — **tabel pivot inti** yang mengintegrasikan modul ini ke `pendaftars`. Menyimpan status kehadiran & konfirmasi. |
| `permintaan_reschedule` | Permintaan perubahan jadwal dari peserta beserta keputusan admin. |
| `notifikasi_log` | Catatan pengiriman notifikasi (in-app/email/WhatsApp) per jadwal — untuk audit, status kirim, dan reminder. |

**Tabel existing yang direferensikan (tidak dirancang ulang):** `pendaftars`, `users`, `personal_access_tokens`.
**Perubahan additive terkendali:** kolom `role` ditambahkan ke `users` (membedakan `admin` vs `penguji`).

## 4.2 Struktur Tiap Tabel

### `sesi_tes`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `kode_sesi` | VARCHAR(20) | UNIQUE, NOT NULL | Kode unik sesi, mis. `TES-2025-001`. |
| `tipe` | ENUM('Tes Tulis','Wawancara') | NOT NULL | Jenis sesi. |
| `tanggal` | DATE | NOT NULL | Tanggal pelaksanaan. |
| `waktu_mulai` | TIME | NOT NULL | Jam mulai. |
| `waktu_selesai` | TIME | NOT NULL | Jam selesai. |
| `lokasi` | VARCHAR(150) | NULLABLE | Ruangan/alamat (untuk sesi offline). |
| `link_online` | VARCHAR(255) | NULLABLE | Link meeting (untuk sesi online). |
| `kuota` | SMALLINT UNSIGNED | NOT NULL, DEFAULT 0 | Kapasitas maksimum peserta. |
| `penguji_id` | BIGINT UNSIGNED | NULLABLE, FK → `users.id` | Penguji/proktor yang ditugaskan. |
| `created_at` / `updated_at` | TIMESTAMP | NULLABLE | Audit waktu. |

### `jadwal_peserta`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `pendaftar_id` | BIGINT UNSIGNED | NOT NULL, FK → `pendaftars.id`, ON DELETE CASCADE | **Titik integrasi** ke data pendaftar. |
| `sesi_tes_id` | BIGINT UNSIGNED | NOT NULL, FK → `sesi_tes.id`, ON DELETE CASCADE | Sesi yang ditugaskan. |
| `status_kehadiran` | ENUM('Terjadwal','Hadir','Tidak Hadir','Dijadwal Ulang') | NOT NULL, DEFAULT 'Terjadwal' | Status kehadiran peserta. |
| `konfirmasi_hadir` | BOOLEAN | NOT NULL, DEFAULT false | RSVP peserta. |
| `konfirmasi_at` | TIMESTAMP | NULLABLE | Waktu peserta mengonfirmasi. |
| `catatan_penguji` | TEXT | NULLABLE | Catatan/hasil internal dari penguji. |
| `created_at` / `updated_at` | TIMESTAMP | NULLABLE | Audit waktu. |
| — | — | **UNIQUE(`pendaftar_id`, `sesi_tes_id`)** | Mencegah peserta terjadwal ganda di sesi yang sama. |

### `permintaan_reschedule`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `jadwal_peserta_id` | BIGINT UNSIGNED | NOT NULL, FK → `jadwal_peserta.id`, ON DELETE CASCADE | Jadwal yang ingin diubah. |
| `alasan` | TEXT | NOT NULL | Alasan reschedule dari peserta. |
| `sesi_tujuan_id` | BIGINT UNSIGNED | NULLABLE, FK → `sesi_tes.id` | Preferensi sesi baru (opsional). |
| `status` | ENUM('Menunggu','Disetujui','Ditolak') | NOT NULL, DEFAULT 'Menunggu' | Status keputusan. |
| `diproses_oleh` | BIGINT UNSIGNED | NULLABLE, FK → `users.id` | Admin yang memproses. |
| `diproses_at` | TIMESTAMP | NULLABLE | Waktu diproses. |
| `created_at` / `updated_at` | TIMESTAMP | NULLABLE | Audit waktu. |

### `notifikasi_log`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `jadwal_peserta_id` | BIGINT UNSIGNED | NOT NULL, FK → `jadwal_peserta.id`, ON DELETE CASCADE | Jadwal terkait. |
| `channel` | ENUM('in_app','email','whatsapp') | NOT NULL | Kanal pengiriman. |
| `tipe` | VARCHAR(50) | NOT NULL | Jenis notif, mis. `jadwal_dibuat`, `reminder_h1`, `reschedule_disetujui`. |
| `status_kirim` | ENUM('terkirim','gagal','tertunda') | NOT NULL, DEFAULT 'tertunda' | Status pengiriman. |
| `error_message` | VARCHAR(255) | NULLABLE | Pesan error bila gagal. |
| `dikirim_at` | TIMESTAMP | NULLABLE | Waktu berhasil terkirim. |
| `created_at` / `updated_at` | TIMESTAMP | NULLABLE | Audit waktu. |

### `users` (perubahan additive)
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `role` | VARCHAR(20) | NOT NULL, DEFAULT 'admin' | Membedakan `admin` vs `penguji`. Default aman untuk user lama. |

## 4.3 Relasi Antar Tabel

```
[pendaftars] ---(1 : N)--- [jadwal_peserta]
Keterangan: Satu pendaftar (Lolos Seleksi) dapat memiliki beberapa jadwal (tes tulis + wawancara).
            FK jadwal_peserta.pendaftar_id → pendaftars.id. Inilah titik integrasi inti ke sistem lama.

[sesi_tes] ---(1 : N)--- [jadwal_peserta]
Keterangan: Satu sesi menampung banyak peserta hingga batas kuota.
            FK jadwal_peserta.sesi_tes_id → sesi_tes.id.
            → Secara efektif: [pendaftars] (M : N) [sesi_tes] melalui pivot jadwal_peserta.

[users] ---(1 : N)--- [sesi_tes]
Keterangan: Satu penguji (users.role='penguji') memandu banyak sesi.
            FK sesi_tes.penguji_id → users.id.

[jadwal_peserta] ---(1 : N)--- [permintaan_reschedule]
Keterangan: Satu jadwal dapat memiliki beberapa permintaan reschedule (riwayat pengajuan).
            FK permintaan_reschedule.jadwal_peserta_id → jadwal_peserta.id.

[sesi_tes] ---(1 : N)--- [permintaan_reschedule]   (opsional)
Keterangan: Permintaan boleh menunjuk sesi tujuan yang diinginkan peserta.
            FK permintaan_reschedule.sesi_tujuan_id → sesi_tes.id.

[users] ---(1 : N)--- [permintaan_reschedule]
Keterangan: Admin yang memproses keputusan reschedule.
            FK permintaan_reschedule.diproses_oleh → users.id.

[jadwal_peserta] ---(1 : N)--- [notifikasi_log]
Keterangan: Tiap jadwal memiliki banyak entri log notifikasi (per channel & per tipe).
            FK notifikasi_log.jadwal_peserta_id → jadwal_peserta.id.
```

## 4.4 Indexing

| Kolom / Komposit | Tabel | Alasan |
|------------------|-------|--------|
| `kode_sesi` (UNIQUE) | `sesi_tes` | Lookup cepat & menjamin keunikan kode sesi. |
| `tanggal` | `sesi_tes` | Query reminder harian ("sesi besok") sering memfilter berdasarkan tanggal. |
| `penguji_id` (FK) | `sesi_tes` | Penguji membuka daftar sesi miliknya (`WHERE penguji_id = ?`). |
| `pendaftar_id` (FK) | `jadwal_peserta` | Peserta cek jadwal & JOIN ke `pendaftars` — operasi paling sering. |
| `sesi_tes_id` (FK) | `jadwal_peserta` | Menampilkan daftar peserta per sesi (admin/penguji). |
| (`pendaftar_id`, `sesi_tes_id`) UNIQUE | `jadwal_peserta` | Mencegah duplikasi + mempercepat pengecekan assignment. |
| `status_kehadiran` | `jadwal_peserta` | Filter dashboard kehadiran (Terjadwal/Hadir/Tidak Hadir). |
| `status` | `permintaan_reschedule` | Admin memfilter antrean `WHERE status='Menunggu'`. |
| (`jadwal_peserta_id`, `channel`) | `notifikasi_log` | Cek status kirim per channel & basis reminder. |

> Prinsip indexing: prioritaskan **kolom FK yang sering di-JOIN** dan **kolom status/tanggal yang sering muncul di klausa WHERE/filter dashboard** — bukan semua kolom.

---

# BAGIAN 5 — Prompt Siap Pakai untuk AI

> Prompt tunggal di bawah ini merangkum Bagian 1–4 menggunakan **formula 5 komponen** dan sudah *context-aware* — AI langsung paham ini pengembangan lanjutan, bukan project baru.

```
[KONTEKS]
Saya sedang mengembangkan aplikasi PMB (Penerimaan Mahasiswa Baru) yang SUDAH BERJALAN.
Stack: React 18 + Tailwind CSS (frontend, Vite, routing path-based di App.jsx) dan
Laravel 12 + SQLite + Laravel Sanctum (backend). Fitur yang SUDAH ADA dan TIDAK BOLEH
diubah/di-reset: pendaftaran online, generate nomor pendaftaran, cek status by nomor,
dashboard admin + statistik, update status pendaftar, login admin (Sanctum token),
export CSV, dan tombol heregistrasi.
Tabel yang SUDAH ADA: `pendaftars` (kolom: id, nomor_pendaftaran [unique], nama,
nomor_hp, email, asal_sekolah, prodi, jalur, status [nilai: 'Menunggu'/'Lolos Seleksi'/
'Tidak Lolos'], heregistrasi_at) dan `users` (auth admin Sanctum, trait HasApiTokens).
Konvensi backend: response API berbentuk { success, data, message }; controller di
app/Http/Controllers/Api; validasi pakai FormRequest; route admin diproteksi
middleware auth:sanctum, route peserta bersifat publik.
Konvensi frontend: helper src/utils/api.js memakai fungsi apiFetch (fetch + header
Authorization Bearer dari token di sessionStorage key 'pmb_admin_token'); ada komponen
UI reusable Button (variant: primary/secondary/danger/success) dan Input, serta
StatusBadge; warna utama blue-600; kartu memakai class "bg-white border border-slate-200
rounded-xl".

[TUJUAN]
Tambahkan MODUL PENJADWALAN TES SELEKSI & WAWANCARA di atas sistem ini, sebagai
pengembangan lanjutan (BUKAN dari nol). Modul ini menjadwalkan peserta yang sudah
berstatus 'Lolos Seleksi' (diperlakukan sebagai lolos seleksi administrasi) ke sesi
tes tulis & wawancara, lalu mengirim notifikasi multi-channel (in-app + email +
WhatsApp) sehingga tidak ada lagi peserta yang tidak tahu jadwalnya. Scope: CRUD sesi,
assignment peserta, halaman jadwal peserta, alur reschedule, dan reminder otomatis H-1.

[FITUR]
Admin: CRUD sesi tes/wawancara (tanggal, waktu, lokasi/link, kuota, penguji);
  assign peserta Lolos Seleksi ke sesi (manual & auto-distribute by kuota); dashboard
  monitoring kapasitas & kehadiran; setujui/tolak permintaan reschedule; kirim
  notifikasi & reminder multi-channel.
Peserta: lihat jadwal pribadi via nomor pendaftaran (perluas halaman Cek Status);
  konfirmasi kehadiran (RSVP); ajukan reschedule + alasan; lihat lokasi/link & instruksi;
  terima notifikasi in-app/email/WhatsApp.
Penguji (tipe user baru, users.role='penguji'): lihat sesi yang ditugaskan; lihat daftar
  peserta per sesi; tandai kehadiran (Hadir/Tidak Hadir); input catatan/hasil singkat.
Sistem otomatis: kirim notifikasi saat jadwal dibuat/berubah; reminder H-1 via scheduler.

[CONSTRAINT]
- JANGAN mengubah tabel `pendaftars` (cukup BACA: status='Lolos Seleksi', nama, email,
  nomor_hp). Jangan mengubah kolom status/heregistrasi_at. Jangan merusak fitur lama.
- Buat 4 tabel baru via migration Laravel:
  1) sesi_tes(id, kode_sesi[unique], tipe[enum 'Tes Tulis'/'Wawancara'], tanggal[date],
     waktu_mulai[time], waktu_selesai[time], lokasi[nullable], link_online[nullable],
     kuota[unsigned], penguji_id[FK users.id, nullable], timestamps)
  2) jadwal_peserta(id, pendaftar_id[FK pendaftars.id], sesi_tes_id[FK sesi_tes.id],
     status_kehadiran[enum 'Terjadwal'/'Hadir'/'Tidak Hadir'/'Dijadwal Ulang' default
     'Terjadwal'], konfirmasi_hadir[bool default false], konfirmasi_at[nullable],
     catatan_penguji[text nullable], timestamps, UNIQUE(pendaftar_id, sesi_tes_id))
  3) permintaan_reschedule(id, jadwal_peserta_id[FK], alasan[text], sesi_tujuan_id[FK
     sesi_tes.id nullable], status[enum 'Menunggu'/'Disetujui'/'Ditolak' default
     'Menunggu'], diproses_oleh[FK users.id nullable], diproses_at[nullable], timestamps)
  4) notifikasi_log(id, jadwal_peserta_id[FK], channel[enum 'in_app'/'email'/'whatsapp'],
     tipe[string], status_kirim[enum 'terkirim'/'gagal'/'tertunda' default 'tertunda'],
     error_message[nullable], dikirim_at[nullable], timestamps)
  + tambahkan kolom additive `role`[default 'admin'] ke tabel users (migration terpisah).
- Index: sesi_tes.tanggal, sesi_tes.penguji_id, jadwal_peserta.pendaftar_id,
  jadwal_peserta.sesi_tes_id, jadwal_peserta.status_kehadiran, permintaan_reschedule.status.
- Endpoint baru ikuti pola existing { success, data, message }: route admin & penguji
  diproteksi auth:sanctum, route peserta (cek jadwal, konfirmasi, ajukan reschedule)
  publik berbasis nomor_pendaftaran. Validasi pakai FormRequest. Tolak assignment bila
  kuota penuh; cegah double-assign lewat UNIQUE.
- Email pakai Laravel Mail (Markdown Mailable), dikirim via Queue (driver database);
  WhatsApp via Http::post ke gateway (Fonnte/Twilio) dengan kredensial dari .env;
  reminder H-1 via Laravel Task Scheduler. Bila SMTP/WA gateway tidak terkonfigurasi,
  lakukan graceful degradation (catat 'gagal'/'tertunda' di notifikasi_log, in-app tetap
  jalan) tanpa menghentikan proses.
- Di frontend, tambahkan fungsi API baru di src/utils/api.js mengikuti pola apiFetch yang
  ada (mis. objek scheduleApi), dan tambahkan halaman admin baru lewat routing path-based
  di App.jsx (mis. '/admin/jadwal'). JANGAN memasang React Router baru.

[TAMPILAN]
Konsisten dengan UI existing: warna utama blue-600; kartu "bg-white border
border-slate-200 rounded-xl"; REUSE komponen Button (variant primary/success/danger),
Input, dan StatusBadge (pakai pola badge berwarna untuk status_kehadiran:
Terjadwal=biru/abu, Hadir=hijau, Tidak Hadir=merah, Dijadwal Ulang=kuning).
Halaman admin "Kelola Jadwal": form buat sesi (pakai date picker), tabel sesi dengan
kapasitas terisi, dan panel assign peserta Lolos Seleksi (multi-select). Halaman peserta:
perluas Cek Status agar setelah menampilkan status pendaftaran juga menampilkan kartu
jadwal (tanggal, jam, lokasi/link, status) beserta tombol "Konfirmasi Kehadiran" dan
"Ajukan Reschedule". Halaman penguji: daftar sesi + tabel peserta dengan aksi tandai
kehadiran. Semua responsive (mobile-friendly, min-h-[44px] untuk elemen tap).

[UJI MANDIRI]
Pastikan hasilnya menyambung dengan sistem yang sudah berjalan TANPA merusak fitur lama
(pendaftaran, cek status, dashboard admin, export CSV, heregistrasi). Migrasi baru tidak
boleh mengubah skema tabel pendaftars. Jalankan `php artisan migrate` di atas database
existing tanpa error.
```

---

# BAGIAN 6 — Jalankan Prompt & Evaluasi Hasil ⭐ (Bonus)

> **Status: belum dikerjakan pada iterasi ini.** Bagian ini bersifat bonus dan memerlukan implementasi kode nyata (menjalankan prompt Bagian 5, mengeksekusi hasil di browser bersama sistem existing, lalu mengevaluasi kesesuaian & regresi). Direncanakan dikerjakan terpisah dengan struktur repo akhir:
>
> ```
> nama-repo/
> ├── devplan-fadoilul-munim.md     ← dokumen ini (+ log prompt + evaluasi saat Bagian 6 dikerjakan)
> └── app/
>     ├── pmb-frontend/             ← extend dari sistem existing
>     ├── pmb-backend/              ← extend dari sistem existing
>     └── README-app.md             ← cara menjalankan + fitur baru + konfirmasi fitur lama tetap jalan
> ```
>
> Saat dikerjakan, bagian ini akan diisi: (6.1) log prompt utama + setiap iterasi beserta alasannya, (6.2) tabel evaluasi kesesuaian terhadap Bagian 1.2/2/4 dengan status ✅/⚠️/❌ + baris khusus pengecekan **tidak ada regresi** pada fitur lama, dan (6.3) push hasil ke repo yang sama.
