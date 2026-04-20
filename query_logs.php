<?php
$_SERVER['DOCUMENT_ROOT'] = __DIR__;
require 'api/Shared/Database.php';
$db = \FusionERP\Shared\Database::getInstance()->getConnection();
$stmt = $db->query("SELECT created_at, action, user_id, table_name FROM audit_logs ORDER BY created_at DESC LIMIT 10");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
