<?php
require_once 'vendor/autoload.php';
use FusionERP\Shared\Auth;
Auth::startSession();
$_SESSION['test'] = 123;
echo session_id() . "\n";
echo "Session path: " . session_save_path() . "\n";
