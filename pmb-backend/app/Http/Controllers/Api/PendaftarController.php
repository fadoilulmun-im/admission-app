<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePendaftarRequest;
use App\Http\Requests\UpdateStatusRequest;
use App\Models\Pendaftar;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Carbon;

/**
 * PendaftarController — API endpoint untuk mengelola data pendaftar PMB
 */
class PendaftarController extends Controller
{
    /**
     * Menampilkan semua data pendaftar
     * GET /api/pendaftar
     */
    public function index(): JsonResponse
    {
        try {
            $pendaftarList = Pendaftar::orderBy('created_at', 'desc')->get();
            return response()->json([
                'success' => true,
                'data'    => $pendaftarList,
                'meta'    => ['total' => $pendaftarList->count()],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data pendaftar',
            ], 500);
        }
    }

    /**
     * Menyimpan pendaftar baru
     * POST /api/pendaftar
     */
    public function store(StorePendaftarRequest $request): JsonResponse
    {
        try {
            $nomorPendaftaran = $this->generateNomor();

            $pendaftar = Pendaftar::create([
                'nomor_pendaftaran' => $nomorPendaftaran,
                'nama'              => $request->nama,
                'nomor_hp'          => $request->nomor_hp,
                'email'             => $request->email,
                'asal_sekolah'      => $request->asal_sekolah,
                'prodi'             => $request->prodi,
                'jalur'             => $request->jalur,
                'status'            => Pendaftar::STATUS_MENUNGGU,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran berhasil disimpan',
                'data'    => $pendaftar,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data pendaftaran',
            ], 500);
        }
    }

    /**
     * Menampilkan satu pendaftar berdasarkan nomor pendaftaran
     * GET /api/pendaftar/{nomorPendaftaran}
     */
    public function show(string $nomorPendaftaran): JsonResponse
    {
        $pendaftar = Pendaftar::where('nomor_pendaftaran', $nomorPendaftaran)->first();

        if (!$pendaftar) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor pendaftaran tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $pendaftar,
        ]);
    }

    /**
     * Mengubah status pendaftar
     * PATCH /api/pendaftar/{id}/status
     */
    public function updateStatus(UpdateStatusRequest $request, int $id): JsonResponse
    {
        try {
            $pendaftar = Pendaftar::findOrFail($id);
            $pendaftar->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'Status berhasil diperbarui',
                'data'    => $pendaftar->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftar tidak ditemukan',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status',
            ], 500);
        }
    }

    /**
     * Generate nomor pendaftaran unik format PMB-2025-XXXX
     */
    private function generateNomor(): string
    {
        do {
            $nomor = 'PMB-2025-' . str_pad(random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
        } while (Pendaftar::where('nomor_pendaftaran', $nomor)->exists());

        return $nomor;
    }

    /**
     * Statistik jumlah pendaftar per prodi, jalur, dan status
     * GET /api/statistik
     */
    public function statistik(): JsonResponse
    {
        try {
            $perProdi = Pendaftar::selectRaw('prodi, COUNT(*) as total')
                ->groupBy('prodi')
                ->orderByDesc('total')
                ->get();

            $perJalur = Pendaftar::selectRaw('jalur, COUNT(*) as total')
                ->groupBy('jalur')
                ->orderByDesc('total')
                ->get();

            $perStatus = Pendaftar::selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->get();

            return response()->json([
                'success' => true,
                'data'    => [
                    'total'      => Pendaftar::count(),
                    'per_prodi'  => $perProdi,
                    'per_jalur'  => $perJalur,
                    'per_status' => $perStatus,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat statistik',
            ], 500);
        }
    }

    /**
     * Export semua data pendaftar ke file CSV
     * GET /api/pendaftar/export/csv
     */
    public function exportCsv(): StreamedResponse
    {
        $pendaftarList = Pendaftar::orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="pendaftar-pmb-2025.csv"',
        ];

        $columns = ['No', 'Nomor Pendaftaran', 'Nama', 'Email', 'Nomor HP',
                    'Asal Sekolah', 'Program Studi', 'Jalur', 'Status',
                    'Heregistrasi', 'Tanggal Daftar'];

        $callback = function () use ($pendaftarList, $columns) {
            $file = fopen('php://output', 'w');
            // BOM untuk Excel agar bisa baca UTF-8
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            foreach ($pendaftarList as $i => $p) {
                fputcsv($file, [
                    $i + 1,
                    $p->nomor_pendaftaran,
                    $p->nama,
                    $p->email,
                    $p->nomor_hp,
                    $p->asal_sekolah,
                    $p->prodi,
                    $p->jalur,
                    $p->status,
                    $p->heregistrasi_at
                        ? Carbon::parse($p->heregistrasi_at)->format('d/m/Y H:i')
                        : '-',
                    Carbon::parse($p->created_at)->format('d/m/Y H:i'),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Heregistrasi oleh mahasiswa yang lolos seleksi
     * POST /api/pendaftar/{nomorPendaftaran}/heregistrasi
     */
    public function heregistrasi(string $nomorPendaftaran): JsonResponse
    {
        $pendaftar = Pendaftar::where('nomor_pendaftaran', $nomorPendaftaran)->first();

        if (!$pendaftar) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor pendaftaran tidak ditemukan',
            ], 404);
        }

        if ($pendaftar->status !== Pendaftar::STATUS_LOLOS) {
            return response()->json([
                'success' => false,
                'message' => 'Heregistrasi hanya bisa dilakukan oleh pendaftar yang lolos seleksi',
            ], 422);
        }

        if ($pendaftar->heregistrasi_at) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan heregistrasi sebelumnya',
            ], 422);
        }

        $pendaftar->update(['heregistrasi_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Heregistrasi berhasil! Selamat datang di keluarga besar kampus kami.',
            'data'    => $pendaftar->fresh(),
        ]);
    }
}