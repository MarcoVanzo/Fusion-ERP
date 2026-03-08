<?php
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $tid = 1; // Assuming tenant 1

    $stmt = $db->prepare('SELECT COUNT(*) AS total_athletes,
                    SUM(role             IS NOT NULL AND role <> \'\')      AS with_role,
                    SUM(phone            IS NOT NULL AND phone <> \'\')     AS with_phone,
                    SUM(email            IS NOT NULL AND email <> \'\')     AS with_email,
                    SUM(fiscal_code      IS NOT NULL AND fiscal_code <> \'\') AS with_fiscal,
                    SUM(medical_cert_expires_at IS NOT NULL)                AS with_med_cert,
                    SUM(residence_address IS NOT NULL AND residence_address <> \'\') AS with_address,
                    SUM(residence_city   IS NOT NULL AND residence_city <> \'\') AS with_city,
                    SUM(parent_contact   IS NOT NULL AND parent_contact <> \'\') AS with_parent,
                    SUM(parent_phone     IS NOT NULL AND parent_phone <> \'\') AS with_parent_ph
                 FROM athletes
                 WHERE is_active = 1
                   AND deleted_at IS NULL
                   AND tenant_id = :tid');
    $stmt->execute([':tid' => $tid]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Query result:\n";
    print_r($row);

    // also check what athletes look like
    $stmt2 = $db->prepare('SELECT id, role, phone, email, fiscal_code, medical_cert_expires_at, residence_address, residence_city, parent_contact, parent_phone FROM athletes WHERE is_active = 1 AND deleted_at IS NULL AND tenant_id = :tid LIMIT 2');
    $stmt2->execute([':tid' => $tid]);
    $athletes = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo "First 2 Athletes:\n";
    print_r($athletes);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}