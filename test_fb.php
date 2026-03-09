<?php
require_once __DIR__ . "/api/Shared/Database.php";
require_once __DIR__ . "/api/Modules/Social/SocialRepository.php";
$db = \FusionERP\Shared\Database::getInstance();
$tokenRow = $db->query("SELECT * FROM meta_tokens LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$tokenRow) die("No token\n");
$repo = new \FusionERP\Modules\Social\SocialRepository();
$res = $repo->getFbPageInsights($tokenRow['page_id'], $tokenRow['access_token']);
print_r($res);
