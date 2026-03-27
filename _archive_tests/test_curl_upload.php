<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Create a dummy image file
$dummyFile = __DIR__ . '/dummy_logo.png';
$img = imagecreatetruecolor(10, 10);
imagepng($img, $dummyFile);
imagedestroy($img);

// We need a valid collaboration ID and tenant ID to pass
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query('SELECT id FROM network_collaborations LIMIT 1');
$collab = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collab) {
    echo "No collaboration found to test.\n";
    exit;
}
$collabId = $collab['id'];

// Get valid cookie to pass authentication
$cookieFile = __DIR__ . '/mycookie2.txt';
$cookies = '';
if (file_exists($cookieFile)) {
    $lines = file($cookieFile);
    foreach ($lines as $line) {
        if (strpos($line, 'PHPSESSID') !== false) {
            $parts = explode("\t", trim($line));
            if (count($parts) >= 7) {
                $cookies = $parts[5] . '=' . $parts[6];
            }
        }
    }
}

echo "Testing uploadColLogo with Collab ID $collabId...\n";

$ch = curl_init('http://localhost:8888/api/?module=network&action=uploadColLogo'); // Adjust port if needed
$cfile = new CURLFile($dummyFile, 'image/png', 'logo.png');
$data = array(
    'collaboration_id' => $collabId,
    'logo' => $cfile
);

curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
if ($cookies) {
    curl_setopt($ch, CURLOPT_COOKIE, $cookies);
} else {
    echo "Warning: No valid PHPSESSID cookie found. Auth may fail.\n";
}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpcode\n";
echo "Response Length: " . strlen($response) . " bytes\n";
echo "Error (if any): $error\n";
echo "\n--- Raw Response ---\n";
echo substr($response, 0, 1000) . "\n";
echo "------------------\n";
