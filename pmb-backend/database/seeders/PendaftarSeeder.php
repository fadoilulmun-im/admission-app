<?php

namespace Database\Seeders;

use App\Models\Pendaftar;
use Illuminate\Database\Seeder;

/**
 * PendaftarSeeder — menyiapkan 3 data dummy pendaftar untuk keperluan demo
 */
class PendaftarSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'nomor_pendaftaran' => 'PMB-2025-1001',
                'nama'              => 'Andi Pratama',
                'nomor_hp'          => '081234567890',
                'email'             => 'andi.pratama@email.com',
                'asal_sekolah'      => 'SMA Negeri 1 Surabaya',
                'prodi'             => 'Teknik Informatika',
                'jalur'             => 'SNBT',
                'status'            => 'Menunggu',
            ],
            [
                'nomor_pendaftaran' => 'PMB-2025-1002',
                'nama'              => 'Siti Rahayu',
                'nomor_hp'          => '082345678901',
                'email'             => 'siti.rahayu@email.com',
                'asal_sekolah'      => 'SMK Negeri 2 Bandung',
                'prodi'             => 'Manajemen Bisnis',
                'jalur'             => 'Prestasi',
                'status'            => 'Lolos Seleksi',
            ],
            [
                'nomor_pendaftaran' => 'PMB-2025-1003',
                'nama'              => 'Budi Santoso',
                'nomor_hp'          => '083456789012',
                'email'             => 'budi.santoso@email.com',
                'asal_sekolah'      => 'MA Negeri 1 Yogyakarta',
                'prodi'             => 'Sistem Informasi',
                'jalur'             => 'Mandiri',
                'status'            => 'Tidak Lolos',
            ],
        ];

        foreach ($data as $item) {
            Pendaftar::create($item);
        }
    }
}
