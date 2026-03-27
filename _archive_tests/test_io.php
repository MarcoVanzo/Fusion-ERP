<?php
$dummyFile = __DIR__ . '/dummy_logo.png';

$collabId = 'TEST_COL';
$tenantId = '1';
$safeId = preg_replace('/[^A-Za-z0-9_]/', '', $collabId);
$uploadDir = __DIR__ . '/uploads/network/' . $tenantId . '/' . $safeId . '/logo';

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        echo "MKDIR FAILED\n";
        exit;
    }
}
echo "Dir exists: $uploadDir\n";

$ext = pathinfo($dummyFile, PATHINFO_EXTENSION);
$fileName = 'logo_' . date('Ymd_His') . '.' . $ext;
$destPath = $uploadDir . '/' . $fileName;

// Note: move_uploaded_file only works on files uploaded via HTTP POST!
// For our local script, we must use rename() or copy() if we synthesized it.
echo "Moving file to $destPath...\n";
if (copy($dummyFile, $destPath)) {
    echo "SUCCESS\n";
} else {
    echo "FAILED\n";
}
