<?php
require 'api/bootstrap.php';
use FusionERP\Modules\Athletes\AthletesRepository;
use FusionERP\Shared\Database;

$repo = new AthletesRepository();
$athletes = clone $repo; // just need a repo instance
$athlete = Database::query("SELECT * FROM athletes LIMIT 1")->fetch();

if (!$athlete) {
    echo "No athlete found\n";
    exit;
}

echo "Updating athlete: " . $athlete['id'] . "\n";

$data = [
            ':first_name' => 'Test',
            ':last_name' => 'Update',
            ':jersey_number' => 99,
            ':role' => 'Test Role',
            ':birth_date' => '2000-01-01',
            ':birth_place' => 'Rome',
            ':height_cm' => 180,
            ':weight_kg' => 75,
            ':residence_address' => 'Via Test 1',
            ':residence_city' => 'Rome',
            ':phone' => '1234567890',
            ':email' => 'test@test.com',
            ':identity_document' => 'AB123456',
            ':fiscal_code' => 'TSTTUA00A01H501Z',
            ':medical_cert_type' => 'A',
            ':medical_cert_expires_at' => '2025-01-01',
            ':federal_id' => 'FED123',
            ':shirt_size' => 'M',
            ':shoe_size' => '42',
            ':parent_contact' => 'Parent Name',
            ':parent_phone' => '0987654321',
            ':team_id' => $athlete['team_id'],
];

try {
    $repo->updateAthlete($athlete['id'], $data);
    echo "Success!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
