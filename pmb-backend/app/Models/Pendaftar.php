<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model Pendaftar — merepresentasikan satu data calon mahasiswa PMB
 */
class Pendaftar extends Model
{
    const STATUS_MENUNGGU = 'Menunggu';
    const STATUS_LOLOS = 'Lolos Seleksi';
    const STATUS_TIDAK_LOLOS = 'Tidak Lolos';

    const STATUS_LIST = [
        self::STATUS_MENUNGGU,
        self::STATUS_LOLOS,
        self::STATUS_TIDAK_LOLOS,
    ];

    protected $fillable = [
        'nomor_pendaftaran',
        'nama',
        'nomor_hp',
        'email',
        'asal_sekolah',
        'prodi',
        'jalur',
        'status',
        'heregistrasi_at',
    ];

    protected $casts = [
        'heregistrasi_at' => 'datetime',
    ];
}
