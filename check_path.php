<?php
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
$dir = dirname($rc->getFileName());
echo "FILE_PATH=" . $rc->getFileName() . "\n";
echo "DIRNAME1=" . dirname($dir, 1) . "\n";
echo "DIRNAME2=" . dirname($dir, 2) . "\n";
echo "DIRNAME3=" . dirname($dir, 3) . "\n";
echo "ENV_FILE=" . dirname($dir, 3) . '/.env' . "\n";
echo "FILE_EXISTS=" . (file_exists(dirname($dir, 3) . '/.env') ? 'YES' : 'NO') . "\n";
