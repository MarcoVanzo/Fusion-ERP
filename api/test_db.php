<?php
// Tmp api file to view data
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/..');
$dotenv->load();
use FusionERP\Shared\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT
                    COUNT(*)                                                AS total_athletes,
                    SUM(role             IS NOT NULL AND role <> '')      AS with_role,
                    SUM(phone            IS NOT NULL AND phone <> '')     AS with_phone,
                    SUM(email            IS NOT NULL AND email <> '')     AS with_email,
                    SUM(fiscal_code      IS NOT NULL AND fiscal_code <> '') AS with_fiscal,
                    SUM(medical_cert_expires_at IS NOT NULL)                AS with_med_cert,
                    SUM(residence_address IS NOT NULL AND residence_address <> '') AS with_address,
                    SUM(residence_city   IS NOT NULL AND residence_city <> '') AS with_city,
                    SUM(parent_contact   IS NOT NULL AND parent_contact <> '') AS with_parent,
                    SUM(parent_phone     IS NOT NULL AND parent_phone <> '') AS with_parent_ph
                 FROM athletes
                 WHERE is_active = 1
                   AND deleted_at IS NULL
                   AND tenant_id = 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $row]);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}