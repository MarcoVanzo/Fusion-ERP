<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/../');
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, cognito_id, nome_cliente, articoli, totale, data_ordine FROM ec_orders ORDER BY data_ordine DESC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by everything except ID and Cognito ID to find TRUE duplicates
    $map = [];
    foreach ($rows as $r) {
        // Date from Cognito includes time. Let's see if time is extremely close (duplicate click)
        $key = $r['nome_cliente'] . '|' . $r['articoli'] . '|' . $r['totale'];
        if (!isset($map[$key])) {
            $map[$key] = [];
        }
        $map[$key][] = $r;
    }
    
    foreach ($map as $k => $items) {
        if (count($items) > 1) {
            echo "--- DUPLICATE GROUP: $k ---\n";
            foreach ($items as $item) {
                echo "  Cognito ID: " . $item['cognito_id'] . " | Date: " . $item['data_ordine'] . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}