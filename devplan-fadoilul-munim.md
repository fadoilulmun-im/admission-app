# Development Plan — Modul Penjadwalan Tes Seleksi & Wawancara PMB
## Vibe Coding & Venture SEVIMA — oleh Fadoilul Mun'im

> **Konteks dokumen:** Ini adalah *development plan* untuk **menambahkan** modul penjadwalan tes ke sistem PMB (Penerimaan Mahasiswa Baru) yang **sudah berjalan** — bukan membangun dari nol.
>
> **Stack existing:** React 18 + Tailwind CSS (frontend) · Laravel 12 + SQLite + Sanctum (backend).
> **Fitur existing:** pendaftaran online, generate nomor pendaftaran, cek status, dashboard admin + statistik, update status, login admin (Sanctum), export CSV, tombol heregistrasi.
> **Tabel existing:** `pendaftars` dan `users` (beserta `personal_access_tokens` Sanctum).

> **Asumsi semantik kunci (mengikat seluruh dokumen):**
> Status `Lolos Seleksi` yang sudah ada diperlakukan sebagai **lolos seleksi administrasi/berkas**. Pendaftar yang berstatus `Lolos Seleksi` adalah peserta yang **berhak dijadwalkan** untuk **tes tulis + wawancara**, sebelum akhirnya melakukan heregistrasi. Dengan begitu modul ini berdiri **di antara** status `Lolos Seleksi` → `heregistrasi`, dan **hanya membaca** data pendaftar yang ada tanpa mengubah alur lama.

> **Catatan revisi (review ulang vs kode existing):** dokumen ini telah melewati review terhadap kode nyata. Penyesuaian utama: (1) tipe kolom memakai `VARCHAR + konstanta model` mengikuti pola existing (`pendaftars.status`), bukan `ENUM`; (2) endpoint publik jadwal diberi **faktor verifikasi kedua + rate limit** karena `nomor_pendaftaran` mudah ditebak (`PMB-2025-XXXX`, ~9.000 kombinasi, tanpa throttle); (3) timezone `Asia/Jakarta` & **normalisasi `nomor_hp` 08→62** untuk reminder/WhatsApp; (4) `react-day-picker`/`date-fns` diturunkan jadi **opsional** (input `date/time` native cukup); (5) klaim `StatusBadge` dikoreksi (perlu diperluas, bukan reuse apa adanya). Bagian 5 menyediakan **prompt tunggal (5A)** + **eksekusi bertahap (5B)**.

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
2. **Assign peserta** Lolos Seleksi ke sesi — manual (pilih satu/banyak) atau **auto-distribute** sesuai kuota & prodi (mencocokkan `pendaftars.prodi` dengan kolom `sesi_tes.prodi_target`; `prodi_target` kosong = sesi untuk semua prodi).
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
| Input tanggal/waktu (FE) | **Native `<input type="date"/"time">`** (opsional: `react-day-picker`) | Komponen `Input` existing sudah meneruskan `type`, jadi date/time picker native HTML5 **sudah cukup** untuk prototype. `react-day-picker` hanya ditambahkan bila butuh kalender visual — bukan keharusan, agar tidak over-engineering. |
| Format tanggal lokal (FE) | **`Date.toLocaleDateString('id-ID')`** (opsional: `date-fns`) | Format tanggal Indonesia bisa dicapai native (pola yang sudah dipakai komponen existing). `date-fns` opsional bila perlu manipulasi tanggal lebih kompleks. |
| Pengiriman email (BE) | **Laravel Mail** + Markdown Mailable | Native di Laravel; `MAIL_MAILER=log` (default existing) membuat email "terkirim ke log" tanpa SMTP → cocok untuk demo. |
| Antrean tugas (BE) | **Laravel Queue** driver `database` | Sudah jadi default (`QUEUE_CONNECTION=database`) & tabel `jobs` sudah ada. Email/WA dikirim asinkron. Catatan: butuh `php artisan queue:work` berjalan agar job benar-benar diproses. |
| Penjadwal tugas (BE) | **Laravel Task Scheduler** + Artisan command | Mengirim reminder **H-1** otomatis tanpa cron rumit. Perhitungan "besok" memakai timezone `Asia/Jakarta` (lihat 1.4). |
| Gateway WhatsApp (BE) | **Fonnte / Twilio** via `Http::post` (Laravel HTTP Client) | Sesuai brief (panitia kini pakai WhatsApp); HTTP Client bawaan, tanpa SDK berat. Perlu **normalisasi `nomor_hp` 08→62** sebelum kirim (format existing `\d{10,13}` belum siap pakai). |
| Notifikasi in-app | Reuse pola fetch existing pada halaman Cek Status | Peserta langsung melihat jadwal saat cek status; tanpa library tambahan. |

> Prinsip: **tidak mengganti stack inti**, hanya menambah pustaka pendukung **seperlunya** (utamakan kapabilitas native dulu). Pustaka tambahan (`react-day-picker`, `date-fns`) bersifat opsional.
>
> *Catatan opsional:* response API existing ditulis manual `{ success, data, message }` di tiap method (tanpa helper). Modul baru menambah beberapa controller, jadi sebuah trait kecil `ApiResponse` boleh dipertimbangkan untuk merapikan — opsional, bukan keharusan.

## 1.4 Batasan & Asumsi

1. **Read-only terhadap data lama.** Modul ini **membaca** `pendaftars` (status, nama, email, no HP) tetapi **tidak mengubah** kolom `status` maupun `heregistrasi_at` yang sudah ada — sehingga alur seleksi & heregistrasi existing tidak terganggu (anti-regresi).
2. **Hanya peserta Lolos Seleksi yang dijadwalkan.** Eligibility dijadwalkan diasumsikan dari `pendaftars.status = 'Lolos Seleksi'` (sesuai asumsi semantik di awal dokumen).
3. **Integrasi lewat foreign key, bukan modifikasi tabel lama.** Keterhubungan ke pendaftar memakai FK `pendaftar_id → pendaftars.id` di tabel baru. **Tidak ada** kolom baru yang ditambahkan ke `pendaftars`. Satu-satunya sentuhan ke tabel lama adalah penambahan kolom **additive** `role` di `users` (default `'admin'`, aman untuk data lama) guna membedakan admin vs penguji.
4. **Auth peserta tetap *lightweight*.** Peserta mengakses jadwalnya melalui **nomor pendaftaran** (mengikuti pola Cek Status existing), tanpa membangun sistem login peserta penuh — menjaga konsistensi arsitektur.
5. **Notifikasi bergantung konfigurasi `.env`.** Email (SMTP) dan WhatsApp (token gateway) dibaca dari `.env`. Bila tidak dikonfigurasi, modul tetap berjalan dengan **degradasi anggun**: notifikasi in-app tetap aktif, sedangkan email/WA dicatat `gagal`/`tertunda` di log tanpa menghentikan proses penjadwalan.
6. **Endpoint publik perlu faktor verifikasi kedua + rate limit.** `nomor_pendaftaran` mudah ditebak (`PMB-2025-XXXX` = `random_int(1000,9999)`, ~9.000 kombinasi) dan route publik existing **tidak punya throttle**. Karena modul ini membocorkan data lebih sensitif (jadwal, lokasi, link online), endpoint jadwal peserta **wajib** meminta **faktor kedua** (mis. 4 digit terakhir `nomor_hp` atau tanggal lahir) dan diberi middleware **`throttle`**. (Mengikat Bagian 3.3.)
7. **Timezone `Asia/Jakarta`.** `config/app.php` existing memakai `UTC`. Reminder H-1 ("sesi besok") dan tampilan jam **harus** memakai zona `Asia/Jakarta` (set di config atau konversi eksplisit) agar tidak meleset ±7 jam.
8. **`nomor_hp` perlu dinormalisasi untuk WhatsApp.** Format existing `^\d{10,13}$` menyimpan `08…`. Sebelum kirim WA dilakukan normalisasi `08…→62…`; nomor tak valid dicatat `gagal` di `notifikasi_log` (tidak menghentikan proses).
9. **Otorisasi berbasis `users.role`.** Token Sanctum tidak otomatis membedakan peran; endpoint admin diberi gate/middleware `role:admin` dan endpoint penguji `role:penguji`, sehingga token penguji tidak bisa mengakses fungsi admin.
10. **`StatusBadge` perlu dimodifikasi, bukan reuse apa adanya.** `StatusBadge.jsx` existing meng-hardcode 3 status pendaftaran. Untuk `status_kehadiran`, peta warnanya **harus diperluas** (modifikasi komponen shared → wajib uji regresi pada tampilan status lama) **atau** dibuat komponen `KehadiranBadge` terpisah.

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
[Admin]   → buka dashboard reschedule (polling GET, bukan push)           → [badge antrean 'Menunggu' bertambah]
[Admin]   → review permintaan
          ↓ jika DISETUJUI (dan kuota sesi tujuan masih ada)
[Admin]   → pindahkan peserta ke sesi baru                                → [UPDATE jadwal_peserta.sesi_tes_id + status_kehadiran='Terjadwal'; permintaan_reschedule.status='Disetujui', diproses_oleh, diproses_at]
[Sistem]  → notifikasi peserta: jadwal baru                               → [INSERT notifikasi_log]
          ↓ jika DITOLAK
[Admin]   → tolak + tulis alasan                                          → [UPDATE permintaan_reschedule.status='Ditolak', diproses_oleh, diproses_at]
[Sistem]  → notifikasi peserta: permintaan ditolak                        → [INSERT notifikasi_log]
```

> Catatan: tidak ada mekanisme *push* ke admin — admin mengetahui permintaan baru lewat **polling dashboard** (`notifikasi_log` hanya untuk peserta). Riwayat tiap pengajuan tersimpan di `permintaan_reschedule` (sesi asal tetap terlacak lewat relasi ke `jadwal_peserta`), sedangkan `status_kehadiran` di-reset ke `Terjadwal` untuk sesi yang baru.

## 2.3 Happy Path vs Error Path (untuk Flow 2.1)

**Happy path:** Admin membuat sesi → assign peserta → notifikasi terkirim ke 3 channel → peserta melihat & mengonfirmasi kehadiran → reminder H-1 terkirim → peserta hadir → penguji menandai "Hadir".

**Error path (≥2):**

| # | Kondisi Error | Respon Sistem |
|---|---------------|---------------|
| 1 | **Kuota sesi penuh** saat admin meng-assign peserta tambahan. | Validasi backend menolak assignment (jumlah `jadwal_peserta` untuk sesi ≥ `kuota`), mengembalikan pesan "Kuota sesi penuh", dan UI meminta admin memilih sesi lain. |
| 2 | **Pengiriman email/WhatsApp gagal** (SMTP down / nomor HP invalid / token gateway salah). | Jadwal **tetap tersimpan**; `notifikasi_log.status_kirim='gagal'` + `error_message`; notifikasi in-app tetap tampil; admin melihat indikator "notif gagal" dan dapat **kirim ulang**. (degradasi anggun) |
| 3 | **Double-assign** peserta. | Dua lapis: (a) sesi yang **persis sama** dicegah oleh `UNIQUE(pendaftar_id, sesi_tes_id)`; (b) dua sesi ber-**tipe sama** (mis. dua "Tes Tulis") dicegah **validasi aplikasi** — backend menolak assign bila peserta sudah punya jadwal dengan `tipe` tersebut. |
| 4 | **Race condition kuota** (dua admin assign bersamaan ke sesi hampir penuh). | Cek-kuota lalu insert dibungkus **DB transaction + lock** (mis. `lockForUpdate` saat menghitung peserta sesi) agar jumlah tidak melebihi `kuota`. Untuk skala prototype boleh dicatat sebagai batasan, tapi pola transaksi tetap direkomendasikan. |

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
[Peserta input nomor_pendaftaran + faktor kedua]   (React: CekStatus.jsx — halaman existing diperluas)
        → [GET /api/jadwal/peserta/{nomor}?verifikasi=XXXX]   (publik + middleware throttle; faktor kedua = 4 digit akhir nomor_hp / tgl lahir)
        → [JadwalPesertaController@byNomor]   (Laravel: validasi nomor + faktor kedua cocok)
              → JOIN pendaftars ⋈ jadwal_peserta ⋈ sesi_tes  (TANPA kolom catatan_penguji/hasil)
        → [return { success: true, data: [ {sesi, tanggal, jam, lokasi/link, status_kehadiran} ] }]
        → [React render kartu jadwal + badge kehadiran]   (StatusBadge diperluas / KehadiranBadge baru — bukan reuse apa adanya)
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

> **Mekanisme proteksi (konsisten dgn Bagian 1.4 poin 6):** karena `nomor_pendaftaran` mudah ditebak dan endpoint jadwal bersifat publik, akses ke data jadwal/PII di atas **wajib** lewat **faktor verifikasi kedua** (mis. 4 digit terakhir `nomor_hp` atau tanggal lahir) + middleware **`throttle`** untuk mencegah enumerasi. Endpoint hanya mengembalikan data milik pemilik nomor, dan **tidak pernah** menyertakan `catatan_penguji`/hasil.

---

# BAGIAN 4 — ERD / Desain Database

## 4.1 Daftar Tabel

**Tabel baru:**

| Nama Tabel | Deskripsi |
|------------|-----------|
| `sesi_tes` | Slot sesi tes tulis / wawancara yang dibuat admin (tanggal, waktu, lokasi/link, kuota, penguji, `prodi_target`). |
| `jadwal_peserta` | Penugasan peserta (pendaftar Lolos Seleksi) ke sebuah sesi — **tabel pivot inti** yang mengintegrasikan modul ini ke `pendaftars`. Menyimpan status kehadiran & konfirmasi. |
| `permintaan_reschedule` | Permintaan perubahan jadwal dari peserta beserta keputusan admin. |
| `notifikasi_log` | Catatan pengiriman notifikasi (in-app/email/WhatsApp) per jadwal — untuk audit, status kirim, dan reminder. |

**Tabel existing yang direferensikan (tidak dirancang ulang):** `pendaftars`, `users`, `personal_access_tokens`.
**Perubahan additive terkendali:** kolom `role` ditambahkan ke `users` (membedakan `admin` vs `penguji`).

## 4.2 Struktur Tiap Tabel

> **Konvensi tipe (mengikuti sistem existing):** kolom berisi nilai terbatas memakai **`VARCHAR` + konstanta di model + validasi `in:`** (persis pola `pendaftars.status` / `Pendaftar::STATUS_*`), **bukan `ENUM`** — karena tak ada satu pun `enum()` di migration existing dan SQLite menyulitkan perubahan nilai enum. Nilai yang diizinkan dicantumkan di kolom Keterangan.

### `sesi_tes`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `kode_sesi` | VARCHAR(20) | UNIQUE, NOT NULL | Kode unik sesi, mis. `TES-2025-001`. |
| `tipe` | VARCHAR(20) | NOT NULL, in: | Nilai: `Tes Tulis` / `Wawancara` (konstanta model + validasi). |
| `prodi_target` | VARCHAR(50) | NULLABLE | Prodi sasaran sesi (untuk auto-distribute); `NULL` = semua prodi. |
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
| `status_kehadiran` | VARCHAR(20) | NOT NULL, DEFAULT 'Terjadwal', in: | Nilai: `Terjadwal` / `Hadir` / `Tidak Hadir` / `Dijadwal Ulang` (konstanta model + validasi). |
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
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'Menunggu', in: | Nilai: `Menunggu` / `Disetujui` / `Ditolak` (konstanta model + validasi). |
| `diproses_oleh` | BIGINT UNSIGNED | NULLABLE, FK → `users.id` | Admin yang memproses. |
| `diproses_at` | TIMESTAMP | NULLABLE | Waktu diproses. |
| `created_at` / `updated_at` | TIMESTAMP | NULLABLE | Audit waktu. |

### `notifikasi_log`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
|------------|-----------|------------|------------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key. |
| `jadwal_peserta_id` | BIGINT UNSIGNED | NOT NULL, FK → `jadwal_peserta.id`, ON DELETE CASCADE | Jadwal terkait. |
| `channel` | VARCHAR(20) | NOT NULL, in: | Nilai: `in_app` / `email` / `whatsapp` (konstanta model + validasi). |
| `tipe` | VARCHAR(50) | NOT NULL | Jenis notif, mis. `jadwal_dibuat`, `reminder_h1`, `reschedule_disetujui`. |
| `status_kirim` | VARCHAR(20) | NOT NULL, DEFAULT 'tertunda', in: | Nilai: `terkirim` / `gagal` / `tertunda` (konstanta model + validasi). |
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
| `prodi_target` | `sesi_tes` | Filter sesi per prodi saat auto-distribute (`WHERE prodi_target IS NULL OR prodi_target = ?`). |

> Prinsip indexing: prioritaskan **kolom FK yang sering di-JOIN** dan **kolom status/tanggal yang sering muncul di klausa WHERE/filter dashboard** — bukan semua kolom.
>
> *Catatan keunikan:* `UNIQUE(pendaftar_id, sesi_tes_id)` hanya menjamin satu baris per pasangan peserta–sesi. Larangan **dua sesi ber-tipe sama** (mis. dua "Tes Tulis") **tidak** dapat di-enforce di level DB (karena `tipe` ada di `sesi_tes`, bukan `jadwal_peserta`) → ditegakkan di **validasi aplikasi** saat assign.

---

# BAGIAN 5 — Prompt Siap Pakai untuk AI

> Bagian ini menyediakan **dua bentuk**: **5A** — satu prompt konsolidasi (memenuhi instruksi rubrik *"ubah semua plan menjadi satu prompt 5 komponen"*); dan **5B** — versi terpecah 6 tahap untuk eksekusi bertahap dengan checkpoint. Keduanya merangkum keputusan Bagian 1–4 (sudah direvisi: string bukan enum, faktor keamanan, timezone, normalisasi HP, dll.).

## 5A — Prompt Tunggal (untuk penilaian)

> Satu prompt 5-komponen, *self-contained* & *context-aware*. Cukup kirim sekali ke AI.

```
[KONTEKS]
Saya mengembangkan aplikasi PMB (Penerimaan Mahasiswa Baru) yang SUDAH BERJALAN — ini
pengembangan LANJUTAN, bukan project baru. Stack: React 18 + Tailwind (frontend, Vite,
routing path-based di App.jsx) & Laravel 12 + SQLite + Sanctum (backend). Fitur existing
yang TIDAK BOLEH rusak: pendaftaran online, generate nomor pendaftaran, cek status by
nomor, dashboard admin + statistik, update status, login admin (Sanctum), export CSV,
heregistrasi. Tabel existing: `pendaftars` (id, nomor_pendaftaran[unique], nama, nomor_hp,
email, asal_sekolah, prodi, jalur, status['Menunggu'/'Lolos Seleksi'/'Tidak Lolos'],
heregistrasi_at) & `users` (admin Sanctum, HasApiTokens). Konvensi: response
{ success, data, message }; controller di app/Http/Controllers/Api; validasi FormRequest;
route admin auth:sanctum, route peserta publik; nilai status disimpan sebagai string +
konstanta model (project ini TIDAK memakai enum). Frontend: helper src/utils/api.js
(apiFetch + Bearer token di sessionStorage 'pmb_admin_token'); komponen Button
(primary/secondary/danger/success), Input (meneruskan `type` → date/time native didukung),
StatusBadge (hardcode 3 status pendaftaran); warna utama blue-600; kartu "bg-white border
border-slate-200 rounded-xl".

[TUJUAN]
Tambahkan MODUL PENJADWALAN TES SELEKSI & WAWANCARA. Modul menjadwalkan peserta berstatus
'Lolos Seleksi' (= lolos administrasi) ke sesi tes tulis & wawancara, mengirim notifikasi
multi-channel (in-app + email + WhatsApp) + reminder H-1, serta menyediakan alur reschedule.
Scope: CRUD sesi, assignment, halaman jadwal peserta, reschedule, penandaan kehadiran.

[FITUR]
- Admin: CRUD sesi (tanggal, waktu, lokasi/link, kuota, penguji, prodi_target); assign
  peserta Lolos Seleksi (manual & auto-distribute by kuota + prodi_target); dashboard
  kapasitas & kehadiran; setujui/tolak reschedule; kirim notifikasi & reminder.
- Peserta (tanpa login, via nomor_pendaftaran + faktor verifikasi kedua): lihat jadwal,
  konfirmasi kehadiran, ajukan reschedule, terima notifikasi.
- Penguji (users.role='penguji'): lihat sesi yang ditugaskan, daftar peserta, tandai
  kehadiran, input catatan.
- Sistem: notifikasi saat assign/ubah jadwal; reminder H-1 via scheduler.

[CONSTRAINT]
- JANGAN ubah skema/kolom `pendaftars` (read-only: status='Lolos Seleksi', nama, email,
  nomor_hp). Jangan rusak fitur lama.
- 4 tabel baru (migration) + 1 kolom additive users.role. Kolom bernilai terbatas pakai
  VARCHAR + konstanta model + validasi in: (BUKAN enum, ikut pola pendaftars.status):
  1) sesi_tes(id, kode_sesi[string20 unique], tipe[string20:'Tes Tulis'/'Wawancara'],
     prodi_target[string50 nullable], tanggal[date], waktu_mulai[time], waktu_selesai
     [time], lokasi[string150 nullable], link_online[string255 nullable],
     kuota[unsignedSmallInt default 0], penguji_id[FK users.id nullable], timestamps)
  2) jadwal_peserta(id, pendaftar_id[FK pendaftars.id cascade], sesi_tes_id[FK sesi_tes.id
     cascade], status_kehadiran[string20 default 'Terjadwal':'Terjadwal'/'Hadir'/'Tidak
     Hadir'/'Dijadwal Ulang'], konfirmasi_hadir[bool default false], konfirmasi_at[ts
     nullable], catatan_penguji[text nullable], timestamps, UNIQUE(pendaftar_id,sesi_tes_id))
  3) permintaan_reschedule(id, jadwal_peserta_id[FK cascade], alasan[text], sesi_tujuan_id
     [FK sesi_tes.id nullable], status[string20 default 'Menunggu':'Menunggu'/'Disetujui'/
     'Ditolak'], diproses_oleh[FK users.id nullable], diproses_at[ts nullable], timestamps)
  4) notifikasi_log(id, jadwal_peserta_id[FK cascade], channel[string20:'in_app'/'email'/
     'whatsapp'], tipe[string50], status_kirim[string20 default 'tertunda':'terkirim'/
     'gagal'/'tertunda'], error_message[string255 nullable], dikirim_at[ts nullable], timestamps)
  + users.role[string20 default 'admin'] (migration terpisah, additive).
- Index: sesi_tes.tanggal, sesi_tes.penguji_id, sesi_tes.prodi_target,
  jadwal_peserta.pendaftar_id, jadwal_peserta.sesi_tes_id, jadwal_peserta.status_kehadiran,
  permintaan_reschedule.status, notifikasi_log(jadwal_peserta_id, channel).
- Endpoint ikut pola { success, data, message } + FormRequest. Endpoint admin & penguji:
  auth:sanctum + gate role (role:admin vs role:penguji; token penguji TIDAK boleh akses
  fungsi admin). Endpoint peserta PUBLIK berbasis nomor_pendaftaran TAPI WAJIB faktor
  verifikasi kedua (mis. 4 digit akhir nomor_hp / tanggal lahir) + middleware throttle
  (nomor mudah ditebak). Endpoint peserta TIDAK mengembalikan catatan_penguji/hasil.
- Assign: tolak bila kuota penuh, bungkus cek-kuota+insert dalam DB transaction +
  lockForUpdate (anti-race); cegah sesi identik (UNIQUE) DAN dua sesi ber-tipe sama
  (validasi aplikasi).
- Notifikasi: Job queueable (QUEUE_CONNECTION=database; jalankan queue:work); email via
  Laravel Mail (MAIL_MAILER=log default = aman tanpa SMTP); WhatsApp via Http::post ke
  gateway (Fonnte/Twilio) — NORMALISASI nomor_hp 08→62 dulu. Graceful degradation: bila
  SMTP/WA gagal/tak dikonfigurasi → catat 'gagal' di notifikasi_log, in_app tetap jalan,
  proses tak berhenti. Reminder H-1 via Task Scheduler memakai timezone Asia/Jakarta
  (config existing UTC → set/konversi) & idempotent (cek notifikasi_log tipe 'reminder_h1').
- Frontend: tambah scheduleApi di src/utils/api.js (pola apiFetch); halaman admin baru
  '/admin/jadwal' + halaman penguji '/penguji' via routing path-based di App.jsx (JANGAN
  pasang React Router). Date/time pakai input native (type=date/time); react-day-picker &
  date-fns OPSIONAL. StatusBadge: PERLUAS peta warnanya untuk status_kehadiran (uji regresi)
  atau buat KehadiranBadge terpisah — BUKAN reuse apa adanya.

[TAMPILAN]
Konsisten UI existing: blue-600; kartu "bg-white border border-slate-200 rounded-xl"; badge
kehadiran berwarna (Terjadwal=biru/abu, Hadir=hijau, Tidak Hadir=merah, Dijadwal Ulang=
kuning). Halaman admin "Kelola Jadwal": form buat sesi (input date/time native), tabel sesi
+ kapasitas terisi, panel assign peserta Lolos Seleksi (multi-select), antrean reschedule
(Setujui/Tolak). Halaman peserta: PERLUAS Cek Status secara ADITIF — DI BAWAH hasil status
existing tampilkan kartu jadwal (tanggal, jam, lokasi/link, status) + tombol "Konfirmasi
Kehadiran" (success) & "Ajukan Reschedule" (secondary, modal alasan). Halaman penguji:
daftar sesi + tabel peserta dengan aksi tandai kehadiran. Semua responsive, min-h-[44px].

[UJI MANDIRI]
`php artisan migrate` jalan di DB existing TANPA mengubah skema pendaftars; seluruh fitur
lama (pendaftaran, cek status, dashboard, export CSV, heregistrasi) tetap normal; endpoint
peserta menolak akses tanpa faktor kedua; assign menolak kuota penuh & double-tipe;
notifikasi tetap jalan walau tanpa SMTP/WA.
```

---

## 5B — Eksekusi Bertahap (panduan implementasi)

> Alih-alih **satu prompt besar**, 5B dipecah menjadi **6 prompt berurutan** yang dijalankan **satu per satu**. Tujuannya: tiap langkah menghasilkan *slice* yang bisa dijalankan & **di-review dulu (✅ Checkpoint)** sebelum lanjut ke prompt berikutnya — mengurangi risiko AI salah arah dan memudahkan koreksi per bagian.
>
> **Cara pakai:**
> 1. Paste **Konteks Bersama** di bawah ini **sekali** di awal sesi AI (atau prepend ke Prompt 1).
> 2. Jalankan **Prompt 1** → review sampai semua Checkpoint hijau → baru lanjut **Prompt 2**, dst. Bila hasil belum sesuai, iterasi prompt tersebut dulu sebelum maju.
> 3. Tiap prompt tetap memakai **formula 5 komponen** (`[KONTEKS]` singkat yang merujuk Konteks Bersama, lalu `[TUJUAN]`/`[FITUR]`/`[CONSTRAINT]`/`[TAMPILAN]`) + blok `✅ CHECKPOINT`.
>
> **Urutan & alasan (bottom-up — tiap lapisan bisa diuji sebelum lapisan di atasnya dibangun):**
>
> | # | Prompt | Lapisan yang dibangun |
> |---|--------|------------------------|
> | 1 | Fondasi Database | migration + model + seeder |
> | 2 | API Admin: Sesi & Assignment | controller, FormRequest, route admin |
> | 3 | Notifikasi Multi-channel + Reminder | Job, Mailable, WA gateway, scheduler |
> | 4 | API Peserta & Reschedule | endpoint publik + approve/reject admin |
> | 5 | Frontend Admin (Kelola Jadwal) | scheduleApi, halaman admin, routing |
> | 6 | Frontend Peserta + Penguji | extend Cek Status, halaman penguji, uji regresi |

---

### 🔗 Konteks Bersama — paste sekali di awal sesi (jadi acuan semua prompt)

```
[KONTEKS BERSAMA]
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

ATURAN GLOBAL (berlaku di setiap prompt):
- Ini pengembangan LANJUTAN, bukan project baru. JANGAN reset arsitektur atau merusak
  fitur lama. JANGAN mengubah skema tabel `pendaftars`.
- Kerjakan HANYA scope prompt yang sedang aktif. Jangan lompat ke tahap berikutnya.
- Ikuti konvensi response { success, data, message } dan pola apiFetch yang sudah ada.
- Kolom bernilai terbatas pakai `string` + konstanta model (project ini TIDAK pakai enum).
- Endpoint admin/penguji: auth:sanctum + gate role. Endpoint publik peserta: WAJIB faktor
  verifikasi kedua (mis. 4 digit akhir nomor_hp) + middleware throttle.
- Timezone Asia/Jakarta untuk reminder/tampilan; normalisasi nomor_hp 08→62 untuk WhatsApp.
```

---

### Prompt 1 — Fondasi Database (migration, model, seeder)

```
[KONTEKS] Lihat KONTEKS BERSAMA. Ini TAHAP 1 dari 6: lapisan database modul penjadwalan.
Belum ada kode modul ini sebelumnya.

[TUJUAN] Bangun skema database modul penjadwalan (4 tabel baru + 1 kolom additive di
users) beserta model Eloquent & relasinya, dan seeder data contoh — TANPA menyentuh
skema tabel pendaftars.

[FITUR] (lapisan data saja, belum ada API/UI)
- 4 tabel: sesi_tes, jadwal_peserta, permintaan_reschedule, notifikasi_log.
- Model Eloquent dengan relationship dua arah.
- Seeder: 1 user penguji + 2 contoh sesi (1 Tes Tulis, 1 Wawancara).

[CONSTRAINT]
- Kolom bernilai terbatas pakai `string` + konstanta di model + validasi (BUKAN enum —
  ikut pola pendaftars.status; project ini tak punya satu pun enum). Buat 4 migration:
  1) sesi_tes(id, kode_sesi[string20 unique], tipe[string20: 'Tes Tulis'/'Wawancara'],
     prodi_target[string50 nullable], tanggal[date], waktu_mulai[time], waktu_selesai[time],
     lokasi[string150 nullable], link_online[string255 nullable],
     kuota[unsignedSmallInteger default 0], penguji_id[FK users.id nullable], timestamps)
  2) jadwal_peserta(id, pendaftar_id[FK pendaftars.id cascadeOnDelete],
     sesi_tes_id[FK sesi_tes.id cascadeOnDelete],
     status_kehadiran[string20 default 'Terjadwal': 'Terjadwal'/'Hadir'/'Tidak Hadir'/
     'Dijadwal Ulang'], konfirmasi_hadir[boolean default false], konfirmasi_at[timestamp
     nullable], catatan_penguji[text nullable], timestamps,
     UNIQUE(pendaftar_id, sesi_tes_id))
  3) permintaan_reschedule(id, jadwal_peserta_id[FK cascadeOnDelete], alasan[text],
     sesi_tujuan_id[FK sesi_tes.id nullable], status[string20 default 'Menunggu':
     'Menunggu'/'Disetujui'/'Ditolak'], diproses_oleh[FK users.id nullable],
     diproses_at[timestamp nullable], timestamps)
  4) notifikasi_log(id, jadwal_peserta_id[FK cascadeOnDelete],
     channel[string20: 'in_app'/'email'/'whatsapp'], tipe[string50],
     status_kirim[string20 default 'tertunda': 'terkirim'/'gagal'/'tertunda'],
     error_message[string255 nullable], dikirim_at[timestamp nullable], timestamps)
  Definisikan nilai-nilai di atas sebagai konstanta di model (mis. SesiTes::TIPE_*).
- Migration TERPISAH: tambah kolom users.role[string20 default 'admin'] (additive,
  aman untuk data lama).
- Index: sesi_tes.tanggal, sesi_tes.penguji_id, sesi_tes.prodi_target,
  jadwal_peserta.pendaftar_id, jadwal_peserta.sesi_tes_id, jadwal_peserta.status_kehadiran,
  permintaan_reschedule.status, notifikasi_log(jadwal_peserta_id, channel).
- Buat model SesiTes, JadwalPeserta, PermintaanReschedule, NotifikasiLog dengan $fillable
  & $casts yang tepat (date/time/boolean/datetime). Relationship: SesiTes hasMany
  JadwalPeserta & belongsTo User(penguji); JadwalPeserta belongsTo Pendaftar & SesiTes,
  hasMany NotifikasiLog & PermintaanReschedule; PermintaanReschedule belongsTo
  JadwalPeserta, SesiTes(sesi_tujuan) & User(diproses_oleh); NotifikasiLog belongsTo
  JadwalPeserta. Tambahkan hasMany jadwalPeserta di model Pendaftar (TANPA mengubah
  tabel/kolomnya).
- JANGAN buat controller, route, atau komponen frontend di tahap ini.

[TAMPILAN] Tidak ada UI di tahap ini.

[✅ CHECKPOINT — verifikasi sebelum lanjut ke Prompt 2]
1. `php artisan migrate` berjalan tanpa error di atas database existing.
2. Skema tabel `pendaftars` TIDAK berubah (tidak ada kolom baru di pendaftars).
3. 4 tabel baru + kolom users.role terbentuk (cek via `php artisan db:show` / sqlite).
4. Relationship jalan di `php artisan tinker` (mis. SesiTes::with('jadwalPeserta')->first()).
5. `php artisan db:seed` membuat penguji + 2 sesi contoh.
```

---

### Prompt 2 — API Admin: Sesi & Assignment

```
[KONTEKS] Lihat KONTEKS BERSAMA. TAHAP 2 dari 6. Tabel & model dari Tahap 1 sudah ada.

[TUJUAN] Sediakan endpoint ADMIN untuk CRUD sesi tes/wawancara dan assignment peserta
"Lolos Seleksi" ke sesi, lengkap dengan validasi kuota & anti-duplikasi.

[FITUR]
- SesiTesController: index, store, update, destroy.
- GET daftar peserta eligible (BACA pendaftars WHERE status='Lolos Seleksi').
- JadwalPesertaController@store: assign peserta ke sesi (mendukung 1/banyak peserta;
  sediakan juga opsi auto-distribute by kuota + prodi_target — cocokkan pendaftars.prodi).
- Endpoint data dashboard: kapasitas terisi per sesi + rekap kehadiran.

[CONSTRAINT]
- Semua route di blok middleware auth:sanctum + gate role:admin (token penguji ditolak).
  Path: GET/POST /api/jadwal/sesi, PUT/DELETE /api/jadwal/sesi/{id},
  GET /api/jadwal/eligible-peserta, POST /api/jadwal/assign, GET /api/jadwal/dashboard.
- Validasi pakai FormRequest (StoreSesiTesRequest, AssignPesertaRequest). Generate
  kode_sesi unik (mis. TES-2025-XXX) di controller, mirip pola generate nomor pendaftar.
- Tolak assignment bila jumlah jadwal_peserta untuk sesi >= kuota → kembalikan
  { success:false, message:'Kuota sesi penuh' }, HTTP 422. Bungkus cek-kuota+insert dalam
  DB transaction + lockForUpdate agar tidak terjadi race condition.
- Cegah double-assign DUA lapis: (a) sesi identik via UNIQUE(pendaftar_id, sesi_tes_id);
  (b) dua sesi ber-tipe sama via validasi aplikasi (cek peserta belum punya jadwal tipe tsb).
- Pastikan pendaftar yang di-assign memang berstatus 'Lolos Seleksi' (validasi server).
- BACA pendaftars read-only; jangan ubah kolom apa pun di pendaftars.
- Semua response ikut format { success, data, message }.
- JANGAN sentuh notifikasi (Tahap 3), endpoint peserta (Tahap 4), atau frontend.

[TAMPILAN] Tidak ada UI di tahap ini.

[✅ CHECKPOINT — verifikasi sebelum lanjut ke Prompt 3]
1. Tanpa token → endpoint /api/jadwal/* mengembalikan 401; token penguji → 403 (gate role).
2. Login admin existing → buat sesi (POST) berhasil, kode_sesi tergenerate unik.
3. GET eligible-peserta HANYA mengembalikan pendaftar berstatus 'Lolos Seleksi'.
4. Assign sampai kuota penuh → assignment berikutnya ditolak 'Kuota sesi penuh'.
5. Assign peserta yang sama ke sesi yang sama → ditolak (anti-duplikasi).
6. Format response konsisten { success, data, message }.
```

---

### Prompt 3 — Notifikasi Multi-channel + Reminder Otomatis

```
[KONTEKS] Lihat KONTEKS BERSAMA. TAHAP 3 dari 6. Assignment (Tahap 2) sudah jalan.

[TUJUAN] Kirim notifikasi multi-channel (in-app + email + WhatsApp) saat peserta
di-assign / jadwal berubah, plus reminder otomatis H-1, dengan logging & graceful
degradation.

[FITUR]
- Job KirimNotifikasi (queueable) yang dipanggil setelah assignment di Tahap 2: tulis
  notifikasi_log untuk channel in_app, kirim email (Mailable), dan kirim WhatsApp.
- Mailable Markdown "JadwalTesMail" berisi detail sesi.
- Pengiriman WhatsApp via Http::post ke gateway (Fonnte/Twilio), kredensial dari .env;
  NORMALISASI nomor_hp (mis. 08xxxx → 628xxxx) sebelum kirim.
- Artisan command "jadwal:reminder" + registrasi di Console scheduler (harian) untuk
  mengirim reminder H-1 (sesi dengan tanggal = besok, dihitung di timezone Asia/Jakarta).

[CONSTRAINT]
- Queue driver 'database' (tabel jobs sudah ada). Email & WhatsApp dikirim async via queue
  (perlu `queue:work` berjalan agar diproses).
- Timezone: hitung "besok" untuk reminder & tampilkan jam dalam Asia/Jakarta (config
  existing UTC → set config atau konversi eksplisit) supaya tidak meleset ±7 jam.
- Normalisasi nomor_hp ke format 62… sebelum kirim WA; nomor tidak valid → catat 'gagal'
  di notifikasi_log (tidak menghentikan proses).
- GRACEFUL DEGRADATION: bila SMTP / WA gateway tidak terkonfigurasi di .env atau gagal,
  JANGAN lempar fatal — set notifikasi_log.status_kirim='gagal' + error_message,
  channel in_app tetap 'terkirim'. Proses penjadwalan tidak boleh terhenti.
- Reminder idempotent: jangan kirim reminder ganda untuk jadwal yang sudah dikirim
  reminder hari itu (cek notifikasi_log tipe 'reminder_h1').
- Integrasikan dispatch Job ke endpoint assign (Tahap 2) tanpa mengubah kontraknya.
- Tetap format { success, data, message } untuk endpoint terkait (mis. kirim ulang notif).

[TAMPILAN] Tidak ada UI baru (cukup siapkan data status notif agar bisa dipakai admin
di Tahap 5).

[✅ CHECKPOINT — verifikasi sebelum lanjut ke Prompt 4]
1. Assign peserta → muncul baris di notifikasi_log (in_app + email + whatsapp).
2. TANPA konfigurasi SMTP/WA → proses tetap sukses; email/WA tercatat 'gagal'/'tertunda',
   in_app 'terkirim'. Tidak ada error fatal.
3. `php artisan queue:work` memproses job; dengan SMTP dev (mis. Mailtrap) email masuk.
4. `php artisan jadwal:reminder` mengirim reminder untuk sesi besok; dijalankan dua kali
   tidak menghasilkan reminder ganda.
```

---

### Prompt 4 — API Peserta & Reschedule

```
[KONTEKS] Lihat KONTEKS BERSAMA. TAHAP 4 dari 6. Tahap 1-3 sudah jalan.

[TUJUAN] Sediakan endpoint untuk PESERTA (publik berbasis nomor_pendaftaran) melihat &
mengonfirmasi jadwal serta mengajukan reschedule, ditambah endpoint ADMIN untuk
menyetujui/menolak reschedule dan endpoint PENGUJI menandai kehadiran.

[FITUR]
- Publik: GET /api/jadwal/peserta/{nomor_pendaftaran} → JOIN pendaftars⋈jadwal_peserta
  ⋈sesi_tes, kembalikan daftar jadwal peserta.
- Publik: POST konfirmasi kehadiran; POST ajukan reschedule (+alasan, sesi_tujuan opsional).
- Admin (auth:sanctum): GET antrean reschedule (status 'Menunggu'); approve (pindahkan ke
  sesi tujuan, cek kuota) / reject (+alasan).
- Penguji (auth:sanctum): GET sesi yang ditugaskan + daftar peserta; POST tandai kehadiran
  (Hadir/Tidak Hadir) + catatan opsional.

[CONSTRAINT]
- Endpoint peserta PUBLIK (tanpa token) TAPI WAJIB faktor verifikasi kedua (mis. 4 digit
  akhir nomor_hp / tanggal lahir) + middleware throttle — karena nomor_pendaftaran mudah
  ditebak. Endpoint TIDAK mengembalikan catatan_penguji/hasil. Endpoint admin & penguji
  diproteksi auth:sanctum + gate role (role:admin / role:penguji).
- Saat approve reschedule (dalam DB transaction + lock): cek kuota sesi tujuan; bila penuh →
  tolak dengan pesan jelas; bila sukses → UPDATE jadwal_peserta.sesi_tes_id +
  status_kehadiran='Terjadwal' + set status permintaan, lalu dispatch Job KirimNotifikasi
  (REUSE dari Tahap 3) untuk memberi tahu peserta.
- Validasi FormRequest; pastikan nomor_pendaftaran + faktor kedua valid & milik peserta.
- Penguji hanya boleh menandai kehadiran untuk sesi miliknya (penguji_id == user).
- Response { success, data, message }. Jangan ubah skema pendaftars.

[TAMPILAN] Tidak ada UI di tahap ini.

[✅ CHECKPOINT — verifikasi sebelum lanjut ke Prompt 5]
1. GET jadwal peserta dengan nomor + faktor kedua yang benar → jadwal tampil; faktor kedua
   salah → ditolak; spam request → kena throttle. Response tidak memuat catatan_penguji.
2. Konfirmasi kehadiran & ajukan reschedule tersimpan (cek tabel).
3. Admin approve reschedule → sesi peserta pindah + notifikasi terpicu; bila kuota tujuan
   penuh → ditolak.
4. Penguji menandai kehadiran hanya pada sesinya; sesi penguji lain / token admin-only → ditolak.
```

---

### Prompt 5 — Frontend Admin: Halaman "Kelola Jadwal"

```
[KONTEKS] Lihat KONTEKS BERSAMA. TAHAP 5 dari 6. Seluruh API backend (Tahap 1-4) siap.

[TUJUAN] Bangun halaman admin "Kelola Jadwal" + fungsi API frontend, konsisten dengan
UI & arsitektur frontend existing (routing path-based, apiFetch, komponen UI reusable).

[FITUR]
- Tambah objek scheduleApi di src/utils/api.js (REUSE apiFetch + Bearer): getSesi,
  createSesi, updateSesi, deleteSesi, getEligiblePeserta, assignPeserta, getDashboard,
  getRescheduleQueue, approveReschedule, rejectReschedule.
- Halaman ScheduleAdmin: (a) form buat sesi (date picker), (b) tabel daftar sesi +
  kapasitas terisi/kuota, (c) panel assign peserta Lolos Seleksi (multi-select),
  (d) antrean permintaan reschedule dengan tombol Setujui/Tolak.
- Routing path-based '/admin/jadwal' di App.jsx + link menuju halaman ini dari dashboard
  Admin existing.

[CONSTRAINT]
- REUSE apiFetch (token sessionStorage 'pmb_admin_token'). JANGAN pasang React Router baru
  — pakai pola routing path-based di App.jsx seperti '/admin'.
- REUSE komponen Button (variant primary/success/danger) & Input. Untuk badge
  status_kehadiran: PERLUAS peta warna StatusBadge (uji regresi tampilan status lama) ATAU
  buat KehadiranBadge terpisah — bukan reuse apa adanya. Date/time pakai input native
  (`type="date"/"time"`); react-day-picker & date-fns OPSIONAL (hanya bila perlu).
- Jangan mengubah halaman existing selain MENAMBAH link navigasi ke '/admin/jadwal'.
- Tangani state loading/error mengikuti pola komponen existing (mis. Admin.jsx).
- Bila token invalid (401), arahkan ke login seperti perilaku existing.

[TAMPILAN]
Konsisten dengan UI existing: warna utama blue-600; kartu "bg-white border
border-slate-200 rounded-xl"; badge status_kehadiran berwarna (Terjadwal=biru/abu,
Hadir=hijau, Tidak Hadir=merah, Dijadwal Ulang=kuning). Layout responsive, elemen tap
min-h-[44px].

[✅ CHECKPOINT — verifikasi sebelum lanjut ke Prompt 6]
1. Admin login → buka /admin/jadwal → buat sesi (date picker) berhasil tampil di tabel.
2. Panel assign menampilkan hanya peserta Lolos Seleksi; assign sukses & kapasitas
   ter-update; kuota penuh memunculkan pesan dari backend.
3. Antrean reschedule bisa di-Setujui/Tolak dari UI.
4. Halaman/dashboard admin existing TETAP normal (tidak ada regresi).
5. Tampilan konsisten dengan tema existing.
```

---

### Prompt 6 — Frontend Peserta + Penguji (+ Uji Regresi)

```
[KONTEKS] Lihat KONTEKS BERSAMA. TAHAP 6 (terakhir) dari 6. Tahap 1-5 sudah jalan.

[TUJUAN] Perluas halaman Cek Status agar peserta bisa melihat/mengonfirmasi jadwal &
mengajukan reschedule, dan buat halaman penguji untuk menandai kehadiran — TANPA merusak
fitur lama.

[FITUR]
- Tambah fungsi peserta+penguji di scheduleApi: getJadwalByNomor, konfirmasiHadir,
  ajukanReschedule, getSesiPenguji, tandaiKehadiran.
- CekStatus diperluas: SETELAH menampilkan status pendaftaran existing, tampilkan kartu
  jadwal (tanggal, jam, lokasi/link, status_kehadiran) + tombol "Konfirmasi Kehadiran"
  dan "Ajukan Reschedule" (modal alasan + pilih sesi tujuan opsional).
- Halaman Penguji (path-based, mis. '/penguji'): login, daftar sesi yang ditugaskan,
  tabel peserta per sesi, aksi tandai Hadir/Tidak Hadir + catatan.

[CONSTRAINT]
- Peserta TANPA login — pakai nomor_pendaftaran (pola Cek Status existing). Perubahan di
  CekStatus harus ADITIF: blok jadwal muncul DI BAWAH hasil cek status yang sudah ada,
  tidak mengubah/menghapus perilaku lama.
- REUSE Button & Input; untuk badge kehadiran pakai StatusBadge yang sudah diperluas
  (Tahap 5) atau KehadiranBadge; routing path-based di App.jsx (jangan React Router).
- Halaman penguji pakai auth:sanctum + gate role:penguji (bedakan dari admin via users.role).
- Konsisten tema (blue-600, kartu bg-white border-slate-200 rounded-xl), responsive.

[TAMPILAN]
Kartu jadwal peserta memakai badge kehadiran berwarna (StatusBadge yang diperluas /
KehadiranBadge) sesuai status_kehadiran; tombol "Konfirmasi Kehadiran" (variant success)
& "Ajukan Reschedule" (variant secondary).
Halaman penguji: tabel peserta dengan dropdown/tombol kehadiran. Mobile-friendly.

[✅ CHECKPOINT FINAL — uji fungsional + REGRESI]
A. Fungsi baru:
   1. Peserta input nomor → status pendaftaran TAMPIL + kartu jadwal muncul (bila terjadwal).
   2. Konfirmasi kehadiran & ajukan reschedule berfungsi dari UI peserta.
   3. Penguji login → lihat sesinya → tandai kehadiran tersimpan.
B. Tidak ada regresi (WAJIB diuji ulang):
   4. Pendaftaran online tetap jalan (buat pendaftar baru, dapat nomor).
   5. Cek status lama tetap menampilkan status & tombol heregistrasi seperti semula.
   6. Dashboard admin + statistik + Export CSV tetap normal.
   7. `php artisan migrate:fresh --seed` lalu jalankan ulang seluruh alur tanpa error.
```

---

> **Uji mandiri menyeluruh (setelah Prompt 6):** "Jika seluruh 6 prompt sudah dijalankan, apakah modul penjadwalan menyambung dengan sistem lama TANPA merusak fitur existing (pendaftaran, cek status, dashboard, export CSV, heregistrasi), dan `php artisan migrate` berjalan di atas database existing tanpa mengubah skema `pendaftars`?"

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
