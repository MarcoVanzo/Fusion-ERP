<?php
$rootDir = __DIR__;
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

$repo = new \FusionERP\Modules\Admin\AdminRepository();
$backups = $repo->listBackupRecords();

print_r($backups);
