<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateStatusRequest — validasi perubahan status pendaftar
 */
class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:Menunggu,Lolos Seleksi,Tidak Lolos',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status tidak boleh kosong',
            'status.in'       => 'Status tidak valid',
        ];
    }
}
