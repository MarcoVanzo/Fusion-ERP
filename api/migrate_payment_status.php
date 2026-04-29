<?php
/**
 * One-time migration: Add AWAITING_PAYMENT to payment_status ENUM
 * DELETE THIS FILE AFTER RUNNING
 */
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FusionERP\Shared\Database;

$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = Database::getInstance();
    $pdo->exec("ALTER TABLE outseason_entries MODIFY COLUMN payment_status ENUM('PENDING','PAID','FAILED','REFUNDED','AWAITING_PAYMENT') NOT NULL DEFAULT 'PENDING'");
    echo json_encode(['success' => true, 'message' => 'ENUM updated: AWAITING_PAYMENT added']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
