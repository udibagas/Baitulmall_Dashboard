<?php
// Standalone health check - needs manual CORS as it doesn't load Laravel
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

die(json_encode([
    'status' => 'ok',
    'php' => PHP_VERSION,
    'key' => !empty(getenv('APP_KEY')),
    'storage' => is_writable('/tmp'),
    'vendor' => is_dir(__DIR__ . '/../vendor')
], JSON_PRETTY_PRINT));
