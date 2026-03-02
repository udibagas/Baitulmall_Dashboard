<?php
// Vercel Entry Point

if (isset($_GET['sync']) && $_GET['sync'] === '2026') {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    try {
        echo "Starting Full Production Sync...\n";
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        echo "Migration: " . \Illuminate\Support\Facades\Artisan::output() . "\n";
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        echo "Seeding: " . \Illuminate\Support\Facades\Artisan::output() . "\n";
        echo "SUCCESS: Produksi Sinkron.";
    } catch (\Exception $e) {
        echo "ERROR: " . $e->getMessage();
    }
    exit;
}

// This block handles requests for api/health.php
if (basename($_SERVER['PHP_SELF']) === 'health.php') {
    // Health check logic should ideally be in health.php, 
    // but this handles it if accessed via index.php route.
    require __DIR__ . '/health.php';
    exit;
}

try {
    require __DIR__ . '/../public/index.php';
} catch (\Throwable $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'class' => get_class($e)
    ]);
    exit;
}
