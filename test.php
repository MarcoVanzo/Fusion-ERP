<?php
require "api/Shared/Database.php";
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SHOW COLUMNS FROM tournament_details");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
