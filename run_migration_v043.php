<?php
/**
 * run_migration_v043.php — Temporary migration runner
 * Adds "ecommerce" permission to all tenant_users in one click.
 * DELETE this file after execution!
 */

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $pdo = new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4',
        getenv('DB_USER'),
        getenv('DB_PASS'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );

    // Add ecommerce:write to all existing tenant_users
    $stmt = $pdo->prepare("
        UPDATE tenant_users
        SET roles = JSON_SET(
            COALESCE(roles, '{}'),
            '$.ecommerce', 'write'
        )
        WHERE roles IS NOT NULL
    ");
    $stmt->execute();
    $updated = $stmt->rowCount();

    // Also handle users with NULL roles
    $stmt2 = $pdo->prepare("
        UPDATE tenant_users
        SET roles = JSON_OBJECT('ecommerce', 'write')
        WHERE roles IS NULL
    ");
    $stmt2->execute();
    $nullFixed = $stmt2->rowCount();

    // Verify
    $check = $pdo->query("SELECT user_id, JSON_EXTRACT(roles, '$.ecommerce') as ecommerce_perm FROM tenant_users")->fetchAll();

    echo '<h2>✅ Migration V043 Completata</h2>';
    echo "<p>Righe aggiornate (con roles esistenti): <strong>{$updated}</strong></p>";
    echo "<p>Righe aggiornate (roles NULL → nuovo JSON): <strong>{$nullFixed}</strong></p>";
    echo '<h3>Stato permessi post-migrazione:</h3>';
    echo '<table border="1" cellpadding="6" style="border-collapse:collapse;">';
    echo '<tr><th>user_id</th><th>ecommerce_perm</th></tr>';
    foreach ($check as $row) {
        $ok = $row['ecommerce_perm'] ? '✅' : '❌';
        echo "<tr><td>{$row['user_id']}</td><td>{$ok} {$row['ecommerce_perm']}</td></tr>";
    }
    echo '</table>';
    echo '<p style="color:red;margin-top:20px;"><strong>⚠️ Elimina questo file dal server!</strong></p>';
}
catch (Exception $e) {
    http_response_code(500);
    echo '<h2>❌ Errore</h2><pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
}