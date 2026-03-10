<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

session_start();
$_SESSION['user_id'] = 'USR_123';

$_GET['module'] = 'tasks';
$_GET['action'] = 'listTasks';

require 'api/router.php';
