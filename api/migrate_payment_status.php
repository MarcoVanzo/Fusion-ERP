<?php
/**
 * One-time migration: Add AWAITING_PAYMENT to payment_status ENUM
 * DELETE THIS FILE AFTER RUNNING
 */
require_once __DIR__ . '/bootstrap.php';
use App\Core\Database;

try {
    $pdo = Database::getInstance();
    $pdo->exec("ALTER TABLE outseason_entries MODIFY COLUMN payment_status ENUM('PENDING','PAID','FAILED','REFUNDED','AWAITING_PAYMENT') NOT NULL DEFAULT 'PENDING'");
    echo json_encode(['success' => true, 'message' => 'ENUM updated: AWAITING_PAYMENT added']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
