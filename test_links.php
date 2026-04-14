<?php
require_once 'api/config/env.php';
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query('SELECT COUNT(*) as c FROM athletes WHERE vald_profile_id IS NOT NULL');
$res = $stmt->fetch();
print_r($res);
