<?php
$searchDir = realpath(__DIR__);
echo "Searching in $searchDir\n";

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($searchDir));
foreach ($iterator as $file) {
    if ($file->getFilename() === '.env') {
        echo "Found: " . $file->getPathname() . "\n";
        $lines = file($file->getPathname());
        echo "  - Lines: " . count($lines) . "\n";
        $hasScouting = false;
        foreach ($lines as $line) {
            if (strpos($line, 'SCOUTING_FUSION_FORM_ID') !== false) {
                $hasScouting = true;
                break;
            }
        }
        echo "  - Has Scouting keys? " . ($hasScouting ? 'YES' : 'NO') . "\n";
    }
}
