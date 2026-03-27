<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();

$pdo = \FusionERP\Shared\Database::getInstance();

try {
    $stmt = $pdo->prepare(
        'INSERT INTO societa_sponsors
            (id, tenant_id, name, stagione, description, logo_path,
             website_url, instagram_url, facebook_url, linkedin_url, tiktok_url,
             importo, rapporto, sponsorizzazione,
             sort_order, is_active)
         VALUES
            (:id, :tenant_id, :name, :stagione, :description, :logo_path,
             :website_url, :instagram_url, :facebook_url, :linkedin_url, :tiktok_url,
             :importo, :rapporto, :sponsorizzazione,
             :sort_order, :is_active)'
    );

    $stmt->execute([
        ':id' => 'SSP_TEST_2',
        ':tenant_id' => 'tenant_123',
        ':name' => 'TestCase2',
        ':stagione' => '2024/2025',
        ':description' => null,
        ':logo_path' => null,
        ':website_url' => null,
        ':instagram_url' => null,
        ':facebook_url' => null,
        ':linkedin_url' => null,
        ':tiktok_url' => null,
        ':importo' => null,
        ':rapporto' => null,
        ':sponsorizzazione' => null,
        ':sort_order' => 0,
        ':is_active' => 1
    ]);
    echo "SUCCESS_CREATE\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
