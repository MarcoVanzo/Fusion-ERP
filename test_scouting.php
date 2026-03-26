<?php
$dir = __DIR__ . '/api/Modules/Scouting';
$envFile = realpath($dir . '/../../../.env');
echo "Dir: " . $dir . "\n";
echo "EnvFile expected: " . $dir . '/../../../.env' . "\n";
echo "Realpath: " . var_export($envFile, true) . "\n";
echo "File exists: " . (file_exists($dir . '/../../../.env') ? 'yes' : 'no') . "\n";
