<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;

Route::get('/', function () {
    return response()->json([
        'status' => 'Baitulmall API is online',
        'version' => '1.2.1',
        'docs' => '/api/v1/test'
    ]);
});

// Urgent Sync Bridge in Web Routes
Route::get('urgent-sync', function() {
    if (request('token') !== 'BAITULMALL_DEPLOY_2026') return response('Unauthorized', 401);
    $step = request('step', 'migrate');
    try {
        if ($step === 'migrate') {
            echo "Step: Migrate Fresh...\n";
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
            return "SUCCESS: Migration Complete. \n" . \Illuminate\Support\Facades\Artisan::output();
        } elseif ($step === 'seed') {
            echo "Step: Seeding...\n";
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
            return "SUCCESS: Seeding Complete. \n" . \Illuminate\Support\Facades\Artisan::output();
        } elseif ($step === 'seed-only') {
            // Seed tanpa UserFactory - bypass fake() error
            echo "Step: Seeding (no factory)...\n";
            // Create admin user directly
            \App\Models\User::firstOrCreate(
                ['email' => 'admin@baitulmall.com'],
                ['name' => 'Admin Baitulmall', 'password' => Hash::make('password123'), 'remember_token' => \Illuminate\Support\Str::random(10)]
            );
            \App\Models\User::firstOrCreate(
                ['email' => 'fajarmaqbulkandri@gmail.com'],
                ['name' => 'Fajar Maqbul', 'password' => Hash::make('Kandri2026!'), 'remember_token' => \Illuminate\Support\Str::random(10)]
            );
            // Run seeders that don't use factories
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'RTSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'AsnafSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'SDMSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'SignatureSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'ZakatFitrahSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'SettingSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'TransactionalDataSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'UserAccountSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'ProductSeeder', '--force' => true]);
            return "SUCCESS: Direct Seeding Complete.\n";
        }
        return "ERROR: Step not recognized.";
    } catch (\Exception $e) {
        return "ERROR in $step: " . $e->getMessage() . "\n" . $e->getTraceAsString();
    }
});

