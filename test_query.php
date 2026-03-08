<?php
// Just dump the sql syntax of the query to check if it's correct
$sql = "SELECT
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
   AND tenant_id = 1";
echo "OK\n";