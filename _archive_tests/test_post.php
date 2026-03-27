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

$pdo = \FusionERP\Shared\Database::getInstance();
$tenantId = \FusionERP\Shared\TenantContext::id();

$stmt = $pdo->prepare("SELECT * FROM federation_championships WHERE tenant_id = :tid");
$stmt->execute([':tid' => $tenantId]);
$champs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($champs as $c) {
    // Check match count
    $stmtM = $pdo->prepare("SELECT COUNT(*) FROM federation_matches WHERE championship_id = :cid");
    $stmtM->execute([':cid' => $c['id']]);
    $mCount = $stmtM->fetchColumn();
    
    // Check standings count
    $stmtS = $pdo->prepare("SELECT COUNT(*) FROM federation_standings WHERE championship_id = :cid");
    $stmtS->execute([':cid' => $c['id']]);
    $sCount = $stmtS->fetchColumn();
    
    echo "Champ: {$c['label']} (ID: {$c['id']}) - URL: {$c['url']}\n";
    echo "  > Matches: $mCount\n";
    echo "  > Standings: $sCount\n";
    echo "  > Last Synced: {$c['last_synced_at']}\n";
    echo "\n";
}
