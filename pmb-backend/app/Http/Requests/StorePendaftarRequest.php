<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StorePendaftarRequest — validasi input pendaftaran baru
 */
class StorePendaftarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama'          => 'required|string|min:3|max:100',
            'nomor_hp'      => ['required', 'string', 'regex:/^\d{10,13}$/'],
            'email'         => 'required|email|max:100',
            'asal_sekolah'  => 'required|string|min:3|max:150',
            'prodi'         => 'required|string|in:Teknik Informatika,Sistem Informasi,Manajemen Bisnis,Akuntansi',
            'jalur'         => 'required|string|in:SNBT,Mandiri,Prestasi',
        ];
    }

    public function messages(): array
    {
        return [
            'nama.required'         => 'Nama tidak boleh kosong',
            'nama.min'              => 'Nama minimal 3 karakter',
            'nomor_hp.required'     => 'Nomor HP tidak boleh kosong',
            'nomor_hp.regex'        => 'Nomor HP harus 10–13 digit angka',
            'email.required'        => 'Email tidak boleh kosong',
            'email.email'           => 'Format email tidak valid',
            'asal_sekolah.required' => 'Asal sekolah tidak boleh kosong',
            'prodi.required'        => 'Program studi wajib dipilih',
            'prodi.in'              => 'Program studi tidak valid',
            'jalur.required'        => 'Jalur pendaftaran wajib dipilih',
            'jalur.in'              => 'Jalur pendaftaran tidak valid',
        ];
    }
}
