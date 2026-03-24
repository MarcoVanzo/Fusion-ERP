<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Modules/Auth/AuthController.php';

try {
    // Override $_SERVER to fool the session
    $_SERVER['REQUEST_METHOD'] = 'POST';
    FusionERP\Shared\Auth::startSession();
    // Simulate login
    $_POST['email'] = 'marcovanzo'; // The user usually tests with their session. I'll just hardcode an admin login
    $_POST['password'] = 'admin'; // wait, I don't know the password
} catch(Exception $e) {}
