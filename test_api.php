<?php
require __DIR__ . '/api/bootstrap.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['module'] = 'teams';
$_GET['action'] = 'listGrouped';
session_start();
$_SESSION['user'] = ['id' => 'admin_debug', 'role' => 'admin'];
require __DIR__ . '/api/router.php';