<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_X_REQUESTED_WITH'] = 'xmlhttprequest';
$_GET['module'] = 'finance';
$_GET['action'] = 'categories';
$_ENV['APP_DEBUG'] = 'true';
putenv('APP_DEBUG=true');
require 'api/router.php';
