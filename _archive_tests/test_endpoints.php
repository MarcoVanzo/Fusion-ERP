<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

function mockRequest($module, $action, $bodyArray) {
    echo "--- Testing $module/$action ---\n";
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
    $_GET['module'] = $module;
    $_GET['action'] = $action;

    // We can't mock php://input easily without stream wrapper, but we can inject a mock class for Response
    // Since Response reads file_get_contents('php://input'), we can't do it here easily unless we redefine Response.
    // Instead let's just use curl against PHP built-in server!
}
