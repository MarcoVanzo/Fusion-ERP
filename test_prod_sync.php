<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$_SERVER['SERVER_NAME'] = 'localhost';

$env = file_get_contents(__DIR__ . '/.env');
$dbHost = ''; $dbPort = ''; $dbName = ''; $dbUser = ''; $dbPass = '';
foreach (explode("\n", $env) as $line) {
    if (str_starts_with($line, 'DB_HOST=')) $dbHost = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_PORT=')) $dbPort = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_NAME=')) $dbName = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_USER=')) $dbUser = trim(substr($line, 8));
    if (str_starts_with($line, 'DB_PASS=')) $dbPass = trim(substr($line, 8));
}

try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM federation_championships WHERE tenant_id = 'TNT_default'");
    $stmt->execute();
    $champs = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
