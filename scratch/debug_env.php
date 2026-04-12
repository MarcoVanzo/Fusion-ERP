<?php
require_once 'api/Shared/Database.php';
$db = FusionERP\Shared\Database::getInstance();
echo "DB Connection: OK\n";

if (class_exists('\Mpdf\Mpdf')) {
    echo "mPDF Class: Found\n";
} else {
    echo "mPDF Class: NOT FOUND\n";
}

$testPath = 'test_write.log';
if (file_put_contents($testPath, "Test write at " . date('Y-m-d H:i:s'))) {
    echo "Write Permission: OK\n";
    unlink($testPath);
} else {
    echo "Write Permission: FAILED\n";
}

// Check extensions
$exts = ['gd', 'mbstring', 'zlib', 'intl'];
foreach ($exts as $e) {
    echo "Extension $e: " . (extension_loaded($e) ? "YES" : "NO") . "\n";
}
