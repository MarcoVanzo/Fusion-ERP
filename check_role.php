<?php
$env = file_get_contents('.env');
foreach(explode("\n", $env) as $line) {
    if (strpos(trim($line), '#') === 0 || empty(trim($line))) continue;
    putenv(trim($line));
}
require 'api/Shared/Database.php';
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("
    SELECT u.id, u.email, u.role, t.roles as tenant_roles 
    FROM users u 
    LEFT JOIN tenant_users t ON u.id = t.user_id 
    WHERE u.email LIKE '%marco%' OR u.role = 'admin'");
while($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
    print_r($row);
}
