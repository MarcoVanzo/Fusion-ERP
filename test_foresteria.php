<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/index.php?action=getForesteria&module=societa';
$_GET['action'] = 'getForesteria';
$_GET['module'] = 'societa';
require 'api/index.php';
