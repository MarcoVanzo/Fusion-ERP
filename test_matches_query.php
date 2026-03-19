<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

$pdo = Database::getInstance();
$campionatoId = "fed_3316c68e";
$tenantId = "TNT_default";

$stmt = $pdo->prepare("
    SELECT m.id, c.url as source_url, c.last_synced_at
    FROM federation_matches m
    JOIN federation_championships c ON m.championship_id = c.id
    WHERE c.id = :cid AND c.tenant_id = :tid
    ORDER BY m.match_date ASC
");
$stmt->execute([':cid' => $campionatoId, ':tid' => $tenantId]);
$matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Campionato: " . $campionatoId . "\n";
echo "Total Matches Found: " . count($matches) . "\n";
if (!empty($matches)) {
    print_r($matches[0]);
}
