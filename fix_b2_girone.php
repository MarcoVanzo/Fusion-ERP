<?php
$envPath = __DIR__ . '/.env';
if (!file_exists($envPath)) {
    die("No .env file found.\n");
}
$envFile = file_get_contents($envPath);
$lines = explode("\n", $envFile);
$env = [];
foreach ($lines as $line) {
    if (strpos(trim($line), '#') === 0 || empty(trim($line)))
        continue;
    $parts = explode('=', $line, 2);
    if (count($parts) == 2) {
        $env[trim($parts[0])] = trim($parts[1], " \"'");
    }
}

$host = $env['DB_HOST'];
$db = $env['DB_NAME'];
$user = $env['DB_USER'];
$pass = $env['DB_PASS'];

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // Check current B2 championships
    $stmt = $pdo->query("SELECT * FROM federation_championships WHERE label LIKE '%b2%' OR url LIKE '%b2%'");
    $results = $stmt->fetchAll();

    echo "CURRENT STATUS (federation_championships):\n";
    print_r($results);

    // Update wrong URLs
    $stmt2 = $pdo->prepare("UPDATE federation_championships SET url = REPLACE(url, 'girone=A', 'girone=D') WHERE label LIKE '%b2%' OR url LIKE '%b2%'");
    $stmt2->execute();

    echo "\nROWS UPDATED in federation_championships: " . $stmt2->rowCount() . "\n";

    // Check if it's stored in `championships` table as well
    $stmt3 = $pdo->query("SELECT id, name, external_url FROM championships WHERE name LIKE '%b2%' OR external_url LIKE '%b2%'");
    echo "\nCURRENT STATUS (championships):\n";
    print_r($stmt3->fetchAll());

    $stmt4 = $pdo->prepare("UPDATE championships SET external_url = REPLACE(external_url, 'girone=A', 'girone=D') WHERE name LIKE '%b2%' OR external_url LIKE '%b2%'");
    $stmt4->execute();
    echo "\nROWS UPDATED in championships: " . $stmt4->rowCount() . "\n";

}
catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// Self delete
unlink(__FILE__);
echo "\nSelf-deleted script.\n";