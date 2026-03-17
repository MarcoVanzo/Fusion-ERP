<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

function loadEnv($path = __DIR__ . '/.env.prod') {
    if (!file_exists($path)) {
        throw new Exception(".env.prod file not found");
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

try {
    loadEnv();
    
    $host = getenv('DB_HOST');
    $db   = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASSWORD');
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $sql = "CREATE TABLE IF NOT EXISTS scouting_athletes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cognome VARCHAR(255) NOT NULL,
        societa_appartenenza VARCHAR(255),
        anno_nascita INTEGER,
        note TEXT,
        rilevatore VARCHAR(255),
        data_rilevazione DATE,
        source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    echo "SUCCESS: Table scouting_athletes created successfully.\\n";
} catch (PDOException $e) {
    echo "PDO ERROR: " . $e->getMessage() . "\\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\\n";
}
