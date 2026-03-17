<?php
/**
 * Standalone migration script — no Composer, no framework.
 * Reads .env manually and creates scouting_athletes table.
 * DELETE THIS FILE AFTER USE.
 */
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Parse .env file manually
function loadEnvFile($path) {
    if (!file_exists($path)) return false;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $vars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $eqPos = strpos($line, '=');
        if ($eqPos === false) continue;
        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));
        $vars[$key] = $value;
    }
    return $vars;
}

$env = loadEnvFile(__DIR__ . '/.env');
if ($env === false) {
    die("ERROR: .env file not found in " . __DIR__);
}

$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$name = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$pass = $env['DB_PASS'] ?? '';

echo "Connecting to MySQL: host=$host, port=$port, db=$name, user=$user\n";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "Connected successfully.\n";

    $sql = "CREATE TABLE IF NOT EXISTS scouting_athletes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        societa_appartenenza VARCHAR(255),
        anno_nascita INT,
        note TEXT,
        rilevatore VARCHAR(255),
        data_rilevazione DATE,
        source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "SUCCESS: Table scouting_athletes created (or already exists).\n";

    // Verify
    $stmt = $pdo->query("SHOW TABLES LIKE 'scouting_athletes'");
    $result = $stmt->fetchAll();
    echo "Verification: " . (count($result) > 0 ? "Table EXISTS" : "Table NOT FOUND") . "\n";

} catch (PDOException $e) {
    echo "PDO ERROR: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
