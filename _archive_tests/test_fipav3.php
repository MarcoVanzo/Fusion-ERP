<?php
$dateStr = '18/04/26';
$parts = explode('/', $dateStr);
if (count($parts) === 3) {
    if (strlen($parts[2]) === 2) {
        $y = (int)$parts[2] < 50 ? 2000 + (int)$parts[2] : 1900 + (int)$parts[2];
        $dateStr = sprintf('%02d/%02d/%04d', $parts[0], $parts[1], $y);
    } else {
        $dateStr = sprintf('%02d/%02d/%04d', $parts[0], $parts[1], $parts[2]);
    }
}
echo "2-digit: " . $dateStr . PHP_EOL;

$dateStr2 = '18/04/2026';
$parts2 = explode('/', $dateStr2);
if (count($parts2) === 3) {
    if (strlen($parts2[2]) === 2) {
        $y = (int)$parts2[2] < 50 ? 2000 + (int)$parts2[2] : 1900 + (int)$parts2[2];
        $dateStr2 = sprintf('%02d/%02d/%04d', $parts2[0], $parts2[1], $y);
    } else {
        $dateStr2 = sprintf('%02d/%02d/%04d', $parts2[0], $parts2[1], $parts2[2]);
    }
}
echo "4-digit: " . $dateStr2 . PHP_EOL;
