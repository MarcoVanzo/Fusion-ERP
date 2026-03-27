<?php
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance()->getConnection();
    
    $stmt = $db->prepare('SELECT * FROM outseason_verifications WHERE season_key = "2026"');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total verifications: " . count($rows) . "\n\n";
    foreach ($rows as $row) {
        echo "'" . $row['entry_name'] . "' -> Found: " . $row['found'] . ", Confidence: " . $row['confidence'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
