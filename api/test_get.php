<?php
$_SERVER['SERVER_NAME'] = 'localhost';
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env');
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && !str_starts_with($line, '#')) {
            list($k, $v) = explode('=', $line, 2);
            putenv(trim($k) . '=' . trim($v));
            $_ENV[trim($k)] = trim($v);
        }
    }
}
spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'FusionERP\\')) {
        require_once __DIR__ . '/'.str_replace('\\', '/', substr($class, 10)) . '.php';
    }
});

class MockContext {
    public static function id() {
        return 'TNT_default';
    }
}
class_alias('MockContext', 'FusionERP\Shared\TenantContext');
class MockAuth {
    public static function requireRead($module) {}
}
class_alias('MockAuth', 'FusionERP\Shared\Auth');

$_GET['campionato_id'] = 'fed_dc788225';
// Dobbiamo mockare INPU_GET bypassando filter_input
// Visto che filter_input su INPUT_GET non vede $_GET se modificato a runtime in CLI,
// Usiamo una reflection per sovrascrivere direttamente il comportamento o facciamo una chiamata cURL locale.
echo "To test locally without HTTP call, we'll just check DB.\n";
$pdo = \FusionERP\Shared\Database::getInstance();
$stmt = $pdo->prepare("
            SELECT m.*, c.url as source_url, c.last_synced_at
            FROM federation_matches m
            JOIN federation_championships c ON m.championship_id = c.id
            WHERE c.id = :cid AND c.tenant_id = :tid
            ORDER BY m.match_date ASC
        ");
$stmt->execute([':cid' => 'fed_dc788225', ':tid' => 'TNT_default']);
$matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Count matches: " . count($matches) . "\n";
echo "Needs sync IF count == 0. \n";

// E per getStandings?
$stmt2 = $pdo->prepare("
            SELECT s.*, c.last_synced_at
            FROM federation_standings s
            JOIN federation_championships c ON s.championship_id = c.id
            WHERE c.id = :cid AND c.tenant_id = :tid
            ORDER BY s.position ASC
        ");
$stmt2->execute([':cid' => 'fed_dc788225', ':tid' => 'TNT_default']);
$standings = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "Count standings: " . count($standings) . "\n";
