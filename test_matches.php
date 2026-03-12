<?php
require_once __DIR__ . '/api/vendor/autoload.php';
use FusionERP\Shared\Database;
$db = Database::getInstance();
$stmt = $db->query("SELECT count(*) as c FROM federation_matches");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
$stmt = $db->query("SELECT count(*) as c FROM federation_matches WHERE LOWER(home_team) LIKE '%fusion%' OR LOWER(away_team) LIKE '%fusion%'");
print_r($stmt->fetch(PDO::FETCH_ASSOC));
$stmt = $db->query("SELECT id, label, is_active FROM federation_championships");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
