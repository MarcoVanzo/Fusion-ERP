<?php
require_once 'api/Shared/Database.php';
require_once 'api/config/env.php';

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT id, full_name, vald_profile_id FROM athletes WHERE vald_profile_id IS NOT NULL");
print_r($stmt->fetchAll(\PDO::FETCH_ASSOC));
