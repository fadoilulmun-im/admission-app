<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\PendaftarController;
use Illuminate\Support\Facades\Route;

/*
 * API Routes — Sistem PMB
 * Semua route di bawah prefix /api secara otomatis
 */

// --- Auth ---
Route::post('/auth/login', [AdminAuthController::class, 'login']);

// --- Publik (tidak butuh auth) ---
Route::post('/pendaftar', [PendaftarController::class, 'store']);
Route::get('/pendaftar/{nomorPendaftaran}', [PendaftarController::class, 'show'])
    ->where('nomorPendaftaran', 'PMB-[0-9]{4}-[0-9]{4}');
Route::post('/pendaftar/{nomorPendaftaran}/heregistrasi', [PendaftarController::class, 'heregistrasi'])
    ->where('nomorPendaftaran', 'PMB-[0-9]{4}-[0-9]{4}');

// --- Admin (butuh Sanctum token) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AdminAuthController::class, 'logout']);
    Route::get('/pendaftar', [PendaftarController::class, 'index']);
    Route::patch('/pendaftar/{id}/status', [PendaftarController::class, 'updateStatus']);
    Route::get('/statistik', [PendaftarController::class, 'statistik']);
    Route::get('/pendaftar/export/csv', [PendaftarController::class, 'exportCsv']);
});
