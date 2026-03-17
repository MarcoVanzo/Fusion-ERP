<?php
$content = file_get_contents(__DIR__ . '/api/Modules/Scouting/ScoutingController.php');
// Print lines 20-40 where getEnvVar is
$lines = explode("\n", $content);
echo "--- Server ScoutingController.php lines 20-50 ---\n";
foreach (array_slice($lines, 19, 31) as $line) {
    echo $line . "\n";
}
