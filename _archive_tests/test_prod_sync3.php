<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Read raw .env file to get credentials
$env = @file_get_contents(__DIR__ . '/.env');
if (!$env) $env = @file_get_contents(__DIR__ . '/api/.env');
if (!$env) die("Could not find .env file");

$dbHost = ''; $dbPort = ''; $dbName = ''; $dbUser = ''; $dbPass = '';
foreach (explode("\n", $env) as $line) {
    if (str_starts_with($line, 'DB_HOST=')) $dbHost = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_PORT=')) $dbPort = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_NAME=')) $dbName = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_USER=')) $dbUser = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_PASS=')) $dbPass = trim(substr($line, 8));
}

$dbHost = str_replace(['"', "'", "\r"], "", $dbHost);
$dbPort = str_replace(['"', "'", "\r"], "", $dbPort);
$dbName = str_replace(['"', "'", "\r"], "", $dbName);
$dbUser = str_replace(['"', "'", "\r"], "", $dbUser);
$dbPass = str_replace(['"', "'", "\r"], "", $dbPass);

if ($dbHost === 'localhost') {
    $dbHost = '127.0.0.1'; // Fix for socket error 2002
}

try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM federation_championships");
    $stmt->execute();
    $champs = $stmt->fetchAll();

    header('Content-Type: text/plain');
    foreach ($champs as $c) {
        $stmtM = $pdo->prepare("SELECT COUNT(*) FROM federation_matches WHERE championship_id = :cid");
        $stmtM->execute([':cid' => $c['id']]);
        $mCount = $stmtM->fetchColumn();
        
        $stmtS = $pdo->prepare("SELECT COUNT(*) FROM federation_standings WHERE championship_id = :cid");
        $stmtS->execute([':cid' => $c['id']]);
        $sCount = $stmtS->fetchColumn();
        
        echo "Champ: {$c['label']} (ID: {$c['id']}) - URL: {$c['url']}\n";
        echo "  > Matches: $mCount\n";
        echo "  > Standings: $sCount\n";
        echo "  > Last Synced: {$c['last_synced_at']}\n\n";
    }
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage();
}
