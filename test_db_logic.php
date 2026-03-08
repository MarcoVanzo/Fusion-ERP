<?php
require_once __DIR__ . '/api/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/api');
$dotenv->load();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT
                    COUNT(*)                                                AS total_athletes,
                    SUM(CASE WHEN role IS NOT NULL AND role <> '' THEN 1 ELSE 0 END) AS with_role_case,
                    SUM(role IS NOT NULL AND role <> '') AS with_role_bool
                 FROM athletes
                 WHERE is_active = 1
                   AND deleted_at IS NULL
                   AND tenant_id = 1");
    var_dump($stmt->fetch(PDO::FETCH_ASSOC));
}
catch (Exception $e) {
    echo $e->getMessage();
}