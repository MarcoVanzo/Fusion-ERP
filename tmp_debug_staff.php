<?php
require_once 'api/config.php';
session_start();
$member = App\Model\Staff::find(79); // Adjust ID if needed
print_r($member);
