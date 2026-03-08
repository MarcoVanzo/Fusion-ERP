<?php
/**
 * One-shot migration runner — V042__staff.sql
 * DELETE THIS FILE AFTER RUNNING!
 */
header('Content-Type: text/plain; charset=utf-8');

$dotenv = __DIR__ . '/.env';
if (file_exists($dotenv)) {
    foreach (file($dotenv) as $line) {
        $line = trim($line);
        if (!$line || str_starts_with($line, '#') || !str_contains($line, '='))
            continue;
        [$k, $v] = explode('=', $line, 2);
        putenv(trim($k) . '=' . trim($v, " '\""));
    }
}

$host = getenv('DB_HOST') ?: 'localhost';
$db = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "✅ Connected to database: $db\n\n";

    $sql = file_get_contents(__DIR__ . '/db/migrations/V042__staff.sql');
    if (!$sql) {
        echo "❌ Could not read V042__staff.sql\n";
        exit(1);
    }

    // Execute statement by statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    $count = 0;
    foreach ($statements as $stmt) {
        if (empty($stmt))
            continue;
        $pdo->exec($stmt);
        $count++;
        echo "✅ Executed statement $count\n";
    }

    // Verify table exists
    $check = $pdo->query("SHOW TABLES LIKE 'staff_members'")->fetch();
    if ($check) {
        echo "\n🎉 Table 'staff_members' created successfully!\n";
        echo "✅ V042 migration complete. DELETE this file now.\n";
    }
    else {
        echo "\n⚠️  Table 'staff_members' not found after migration — check output above.\n";
    }

}
catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}