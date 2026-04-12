<?php
// check_exact.php
require_once 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
require_once 'api/Shared/Database.php';

$db = FusionERP\Shared\Database::getInstance();

function checkCols($db, $table) {
    echo "<h3>$table</h3>";
    $stmt = $db->query("DESC $table");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . " (" . $row['Type'] . ")<br>";
    }
}

checkCols($db, 'athletes');
checkCols($db, 'staff_members');
