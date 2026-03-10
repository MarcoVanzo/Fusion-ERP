<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Modules/Newsletter/MailerLiteService.php';

use FusionERP\Modules\Newsletter\MailerLiteService;

$ml = new MailerLiteService();

echo "Stats:\n";
print_r($ml->getStats());
