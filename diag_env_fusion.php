// simplified_check.php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';
try {
    $db = \FusionERP\Shared\Database::getInstance();
    foreach (['athletes', 'staff_members'] as $table) {
        $stmt = $db->query("DESCRIBE $table");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Table $table columns: " . implode(", ", $cols) . "<br><br>";
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage();
}

