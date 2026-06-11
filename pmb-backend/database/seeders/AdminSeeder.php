<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * AdminSeeder — buat akun admin default untuk login panel PMB
 * Username: admin | Password: pmb2025
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@pmb.local'],
            [
                'name'     => 'admin',
                'email'    => 'admin@pmb.local',
                'password' => Hash::make('pmb2025'),
            ]
        );
    }
}
