<?php
require_once 'api/config/env.php';
require_once 'api/Modules/Vald/ValdRepository.php';

$repo = new \FusionERP\Modules\Vald\ValdRepository();
// just dump some athletes to see if any have vald_profile_id
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT id, full_name, vald_profile_id FROM athletes WHERE vald_profile_id IS NOT NULL LIMIT 5");
print_r($stmt->fetchAll(\PDO::FETCH_ASSOC));
