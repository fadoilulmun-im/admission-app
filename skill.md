# skill.md — Technical Standards & Conventions
## Prototype Sistem Penerimaan Mahasiswa Baru

> File ini mendefinisikan standar teknis yang harus diikuti di seluruh codebase.
> Setiap kode yang dihasilkan — baik oleh developer maupun AI agent — harus konsisten dengan panduan ini.

---

## 1. Tech Stack

| Layer | Teknologi | Versi | Keterangan |
|-------|-----------|-------|------------|
| Frontend | React | 18+ | Menggunakan Vite sebagai build tool |
| Styling | Tailwind CSS | 3+ | Tidak ada custom CSS file kecuali `index.css` untuk directive |
| Backend | Laravel | 12+ | PHP 8.3+ |
| Database (dev) | SQLite | — | Untuk kemudahan setup lokal di Fase 2 |
| Database (prod) | PostgreSQL | 17+ | Fase 3 dan seterusnya |
| HTTP Client | Fetch API | — | Bawaan browser, tidak perlu axios |

---

## 2. Struktur Folder

```
pmb-project/
├── pmb-frontend/               # React + Vite
│   ├── src/
│   │   ├── components/         # Komponen reusable
│   │   │   ├── ui/             # Komponen UI generik (Button, Badge, Input)
│   │   │   └── pmb/            # Komponen domain PMB (FormPendaftaran, StatusBadge)
│   │   ├── pages/              # Halaman utama
│   │   │   ├── Home.jsx
│   │   │   └── Admin.jsx
│   │   ├── hooks/              # Custom hooks (usePendaftar, useLocalStorage)
│   │   ├── utils/              # Helper functions (generateNomor, formatDate)
│   │   ├── constants/          # Nilai tetap (PRODI_LIST, JALUR_LIST, STATUS_LIST)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
└── pmb-backend/                # Laravel (Fase 2+)
    ├── app/
    │   ├── Http/
    │   │   ├── Controllers/Api/
    │   │   └── Requests/
    │   └── Models/
    ├── database/
    │   ├── migrations/
    │   └── seeders/
    └── routes/
        └── api.php
```

---

## 3. Konvensi React

### Penamaan
- **Komponen:** PascalCase → `FormPendaftaran.jsx`, `StatusBadge.jsx`
- **Hooks:** camelCase dengan prefix `use` → `usePendaftar.js`, `useLocalStorage.js`
- **Utils/helpers:** camelCase → `generateNomor.js`, `formatDate.js`
- **Constants:** UPPER_SNAKE_CASE → `PRODI_LIST`, `STATUS_COLORS`

### Struktur Komponen
```jsx
// Selalu gunakan functional component
// Selalu tambahkan komentar ringkas di atas komponen

/**
 * FormPendaftaran — Form utama untuk calon mahasiswa mendaftar PMB
 * Props: onSuccess (callback setelah submit berhasil)
 */
const FormPendaftaran = ({ onSuccess }) => {
  // 1. State declarations
  const [formData, setFormData] = useState({ nama: '', nomorHp: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Derived values / useMemo

  // 3. Effects

  // 4. Event handlers
  const handleSubmit = (e) => { ... };

  // 5. Render
  return ( ... );
};

export default FormPendaftaran;
```

### State Management
- Gunakan `useState` untuk state lokal komponen
- Gunakan `useEffect` untuk side effects (fetch data, localStorage)
- Gunakan `useMemo` untuk computed values dari array besar (filter, aggregate)
- **Jangan** gunakan library state management (Redux, Zustand) di Fase 1–2

### Validasi Form
- Validasi dilakukan di handler sebelum submit, **bukan** menggunakan atribut HTML `required` saja
- Error ditampilkan di bawah field yang bermasalah, bukan sebagai `alert()`
- Format pesan error: singkat, spesifik, dalam bahasa Indonesia

```jsx
// ✅ Benar
const validate = (data) => {
  const errors = {};
  if (!data.nama || data.nama.length < 3) {
    errors.nama = 'Nama minimal 3 karakter';
  }
  if (!/^\d{10,13}$/.test(data.nomorHp)) {
    errors.nomorHp = 'Nomor HP harus 10–13 digit angka';
  }
  return errors;
};

// ❌ Hindari
alert('Nama tidak boleh kosong');
```

---

## 4. Konvensi Tailwind CSS

### Warna yang Digunakan
```
Biru utama   : #1a56db  → gunakan [#1a56db] atau blue-600/700 terdekat
Aksen kuning : #f59e0b  → amber-500
Teks utama   : #1e293b  → slate-800
Teks sekunder: #64748b  → slate-500
Border       : #e2e8f0  → slate-200
Background   : #f0f4ff  → custom / slate-50
```

### Status Badge Colors
```
Menunggu    : bg-yellow-100 text-yellow-800
Lolos       : bg-green-100  text-green-800
Tidak Lolos : bg-red-100    text-red-800
Cadangan    : bg-blue-100   text-blue-800
```

### Panduan Penggunaan
- Semua styling menggunakan Tailwind utility classes
- Tidak membuat file CSS tambahan kecuali `index.css` untuk `@tailwind` directives
- Gunakan arbitrary values `[#hex]` hanya jika tidak ada class Tailwind yang mendekati
- Responsive: mobile-first, gunakan breakpoint `sm:`, `md:`, `lg:` sesuai kebutuhan

---

## 5. Konvensi Laravel (Fase 2+)

### Penamaan
- **Model:** PascalCase singular → `Pendaftar`, `JadwalTes`
- **Controller:** PascalCase + Controller → `PendaftarController`
- **Migration:** snake_case dengan timestamp → `create_pendaftars_table`
- **Route:** kebab-case → `/api/jadwal-tes`, `/api/pendaftar/{id}/status`

### Format Response API
Semua response API harus menggunakan format ini secara konsisten:

```json
// Success
{
  "success": true,
  "message": "Data berhasil disimpan",
  "data": { ... }
}

// Success dengan list
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 42,
    "per_page": 20,
    "current_page": 1
  }
}

// Error (4xx)
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "nama": ["Nama tidak boleh kosong"],
    "nomor_hp": ["Format nomor HP tidak valid"]
  }
}

// Error (5xx)
{
  "success": false,
  "message": "Terjadi kesalahan pada server"
}
```

### Konvensi Database
- Nama tabel: snake_case plural → `pendaftars`, `jadwal_tes`
- Primary key: `id` BIGINT AUTO_INCREMENT
- Foreign key: `{nama_tabel}_id` → `prodi_id`, `pendaftar_id`
- Selalu include `timestamps()` di migration (created_at, updated_at)
- Soft delete menggunakan `softDeletes()` jika data tidak boleh dihapus permanen
- Enum disimpan sebagai VARCHAR dengan konstanta di model

```php
// Di Model Pendaftar.php
const STATUS_MENUNGGU = 'Menunggu';
const STATUS_LOLOS = 'Lolos Seleksi';
const STATUS_TIDAK_LOLOS = 'Tidak Lolos';

const STATUS_LIST = [
    self::STATUS_MENUNGGU,
    self::STATUS_LOLOS,
    self::STATUS_TIDAK_LOLOS,
];
```

---

## 6. Komentar Kode

Setiap komponen React dan method Laravel wajib memiliki komentar:

```jsx
// React — komentar di atas komponen dan fungsi handler
/**
 * generateNomorPendaftaran — generate nomor unik format PMB-2025-XXXX
 * @returns {string} nomor pendaftaran
 */
const generateNomorPendaftaran = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PMB-2025-${random}`;
};
```

```php
// Laravel — PHPDoc di atas method controller
/**
 * Menampilkan semua data pendaftar
 * GET /api/pendaftar
 */
public function index(Request $request): JsonResponse
{
    ...
}
```

---

## 7. Error Handling

### Di React (saat fetch API)
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('http://localhost:8000/api/pendaftar');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    setData(json.data);
  } catch (err) {
    setError(err.message || 'Gagal memuat data. Coba lagi.');
  } finally {
    setLoading(false);
  }
};
```

### Di Laravel (Controller)
```php
// Gunakan try-catch untuk operasi DB
try {
    $pendaftar = Pendaftar::create($validated);
    return response()->json(['success' => true, 'data' => $pendaftar], 201);
} catch (\Exception $e) {
    return response()->json(['success' => false, 'message' => 'Gagal menyimpan data'], 500);
}
```

---

## 8. Hal yang Harus Dihindari

| ❌ Hindari | ✅ Ganti dengan |
|-----------|----------------|
| `alert()` untuk error | Pesan error inline di bawah field |
| Class component React | Functional component + hooks |
| Inline style (`style={{}}`) | Tailwind utility classes |
| Hardcode warna di JSX | Tailwind class atau variabel konstanta |
| `console.log` di production | Hapus sebelum commit |
| Magic number/string | Konstanta di `src/constants/` |
| Nama variabel tidak jelas (`data`, `x`, `temp`) | Nama deskriptif (`pendaftarList`, `selectedProdi`) |
