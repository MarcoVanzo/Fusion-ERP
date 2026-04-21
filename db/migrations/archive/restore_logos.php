<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$pdo = \FusionERP\Shared\Database::getInstance();

$baseDir = __DIR__ . '/uploads/societa';
if (!is_dir($baseDir)) {
    echo "No uploads dir\n";
    exit;
}

$tenants = scandir($baseDir);
foreach ($tenants as $tenant) {
    if ($tenant === '.' || $tenant === '..') continue;
    $sponsorDir = $baseDir . '/' . $tenant . '/sponsors';
    if (!is_dir($sponsorDir)) continue;
    
    $files = scandir($sponsorDir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        // Extract sponsor ID from filename: sponsor_SSP_12345678_20260320_210000.png
        if (preg_match('/^sponsor_(SSP_[0-9a-fA-F]+)_/', $file, $m)) {
            $sponsorId = $m[1];
            $relPath = 'uploads/societa/' . $tenant . '/sponsors/' . $file;
            
            // Check if sponsor still has null logo
            $stmt = $pdo->prepare("SELECT logo_path FROM societa_sponsors WHERE id = :id");
            $stmt->execute([':id' => $sponsorId]);
            $row = $stmt->fetch();
            
            if ($row && empty($row['logo_path'])) {
                // Restore!
                $upd = $pdo->prepare("UPDATE societa_sponsors SET logo_path = :path WHERE id = :id");
                $upd->execute([':path' => $relPath, ':id' => $sponsorId]);
                echo "Restored logo for $sponsorId\n";
            }
        }
    }
}
echo "SCAN COMPLETE\n";
