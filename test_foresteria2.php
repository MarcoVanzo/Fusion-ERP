<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/index.php?action=getForesteria&module=societa';
$_GET['action'] = 'getForesteria';
$_GET['module'] = 'societa';
// bypass Auth::requireAuth() by mocking or setting $_SESSION
$_ENV['APP_DEBUG'] = 'true';
require 'api/router.php';
