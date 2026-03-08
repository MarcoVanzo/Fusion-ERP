<?php
require 'api/Shared/Database.php';

putenv('DB_HOST=31.11.39.161');
putenv('DB_PORT=3306');
putenv('DB_NAME=Sql1804377_2');
putenv('DB_USER=Sql1804377');
putenv('DB_PASS=u3z4t994$@psAPr');

try {
    $pdo = \FusionERP\Shared\Database::getInstance();
    $sql = file_get_contents('db/migrations/V040__add_round_to_federation_matches.sql');
    $pdo->exec($sql);
    echo "Migration V040 applied successfully.\n";
}
catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    }
    else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}