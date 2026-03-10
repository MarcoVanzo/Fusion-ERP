<?php
// Run V048 + V049 on the PRODUCTION MySQL database.
// Delete this file after use.

$host = '31.11.39.161';
$db = 'Sql1804377_2';
$user = 'Sql1804377';
$pass = 'u3z4t994$@psAPr';
$port = 3306;

$dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$migrations = [
    __DIR__ . '/db/migrations/V048__societa.sql',
    __DIR__ . '/db/migrations/V049__network.sql',
];

foreach ($migrations as $file) {
    $name = basename($file);
    echo "Running {$name}...\n";

    $sql = file_get_contents($file);

    // Split on semicolons and run statement by statement
    foreach (explode(';', $sql) as $stmt) {
        $stmt = trim($stmt);
        if (strlen($stmt) < 4)
            continue;
        // Skip pure comment blocks
        if (str_starts_with($stmt, '--'))
            continue;
        try {
            $pdo->exec($stmt);
        }
        catch (PDOException $e) {
            // Table already exists → skip (idempotent via IF NOT EXISTS)
            if (str_contains($e->getMessage(), 'already exists')) {
                echo "  (already exists — skipped)\n";
            }
            else {
                echo "  ERROR: " . $e->getMessage() . "\n";
                echo "  Statement: " . substr($stmt, 0, 120) . "...\n";
            }
        }
    }
    echo "  OK\n";
}

// Verify tables
$tables = [
    'societa_profile', 'societa_roles', 'societa_members', 'societa_documents', 'societa_deadlines',
    'network_collaborations', 'network_documents', 'network_trials', 'network_trial_evaluations', 'network_activities',
];
echo "\nTable verification:\n";
$allOk = true;
foreach ($tables as $t) {
    $r = $pdo->query("SHOW TABLES LIKE '{$t}'")->fetch();
    if (!$r)
        $allOk = false;
    echo ($r ? '  ✓ ' : '  ✗ MISSING: ') . $t . "\n";
}
echo ($allOk ? "\nALL 10 TABLES OK\n" : "\nSOME TABLES MISSING\n");