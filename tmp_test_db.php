<?php
require_once __DIR__ . '/api/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$pdo = Database::getInstance();
$stmt = $pdo->query("SELECT id, championship_id, match_date, DATE_FORMAT(match_date, '%d/%m/%Y') as df_date, DATE_FORMAT(match_date, '%H:%i') as df_time FROM federation_matches ORDER BY match_date DESC LIMIT 5");
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($res);