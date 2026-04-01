<?php
// fake environment
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_X_REQUESTED_WITH'] = 'xmlhttprequest';
$_GET['module'] = 'vald';
$_GET['action'] = 'analytics';

// skip login by overriding Auth check inside dispatch
require_once __DIR__ . '/api/router.php';
