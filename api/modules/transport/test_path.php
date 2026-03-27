<?php
echo "DIR: " . __DIR__ . "\n";
echo "DIRNAME 3: " . dirname(__DIR__, 3) . "\n";
echo "ENV PATH: " . dirname(__DIR__, 3) . '/.env' . "\n";
echo "FILE EXISTS: " . (file_exists(dirname(__DIR__, 3) . '/.env') ? 'YES' : 'NO') . "\n";
