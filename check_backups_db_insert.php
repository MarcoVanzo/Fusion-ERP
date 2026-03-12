<?php
$rootDir = __DIR__;
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

$repo = new \FusionERP\Modules\Admin\AdminRepository();

try {
    $repo->saveBackupRecord([
        ':id' => 'BKP_test_' . time(),
        ':filename' => 'test.zip',
        ':filesize' => 123,
        ':tables_list' => json_encode(['users']),
        ':table_count' => 1,
        ':row_count' => 10,
        ':created_by' => null,
        ':status' => 'ok',
        ':notes' => 'Cron automatico',
        ':drive_file_id' => null,
        ':drive_uploaded_at' => null,
    ]);
    echo "Insert OK\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
