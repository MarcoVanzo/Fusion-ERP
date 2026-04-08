<?php
$files = glob(__DIR__ . '/../db/migrations/V*__*.sql');
$basenames = array_map('basename', $files);
echo json_encode(['found_files' => $basenames]);
