<?php
session_save_path(__DIR__ . '/api/sessions');
session_start();
$_SESSION['user'] = 'test';
session_regenerate_id(true);
$new_id = session_id();
echo "New ID: $new_id\n";
exit;
