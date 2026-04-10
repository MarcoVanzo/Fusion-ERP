<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/api/router.php?module=auth&action=login';

// Mock get_file_contents for JSON
$postData = json_encode(['email' => 't.test@test.com', 'password' => 'password123']);
file_put_contents('php://memory', $postData); // actually we can't mock php://input easily without modifying router.php.
