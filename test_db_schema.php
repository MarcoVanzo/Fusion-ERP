<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once 'api/Shared/Database.php';
use FusionERP\Shared\Database;
use PDO;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT * FROM ec_orders ORDER BY data_ordine DESC LIMIT 5");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];
    foreach ($results as $r) {
        $orders[] = [
            'id' => $r['cognito_id'],
            'dataOrdine' => $r['data_ordine'],
            'nomeCliente' => $r['nome_cliente'],
            'email' => $r['email'],
            'telefono' => $r['telefono'],
            'articoli' => current(json_decode($r['articoli'] ?? '[]', true) ?: []),
            'totale' => (float)$r['totale'],
            'metodoPagamento' => $r['metodo_pagamento'],
            'statoForms' => $r['stato_forms'],
            'statoInterno' => $r['stato_interno'],
            'rawEntry' => $r['raw_data'] ? json_decode($r['raw_data'], true) : []
        ];
    }
    echo json_encode(['success' => true, 'orders' => $orders]);
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " on line " . $e->getLine();
}
