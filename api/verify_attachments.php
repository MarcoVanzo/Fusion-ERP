<?php
header('Content-Type: application/json');
$attachDir = realpath(__DIR__ . '/../talent-day/attachments');
if (!$attachDir) {
    echo json_encode(['error' => 'Path not found']);
    exit;
}
$files = [];
foreach (glob($attachDir . '/*') as $file) {
    if (is_file($file)) {
        $files[] = [
            'path' => $file,
            'size' => filesize($file),
            'readable' => is_readable($file)
        ];
    }
}
echo json_encode(['dir' => $attachDir, 'files' => $files]);
