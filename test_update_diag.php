<?php
require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/Response.php';
require_once __DIR__ . '/api/Modules/Athletes/AthletesController.php';
require_once __DIR__ . '/api/Modules/Athletes/AthletesRepository.php';
require_once __DIR__ . '/api/Modules/Athletes/AthletesService.php';

// Mock session
$_SESSION['user'] = [
    'id' => 'USR_admin0001',
    'role' => 'admin',
    'permissions' => ['athletes' => 'write']
];

try {
    $repo = new \FusionERP\Modules\Athletes\AthletesRepository();
    $db = \FusionERP\Shared\Database::getInstance();
    // Prendi un atleta esistente
    $sql = "SELECT id FROM athletes LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $id = $stmt->fetchColumn();
    
    if (!$id) {
        echo "Nessun atleta trovato per il test.\n";
        exit;
    }

    echo "Testing update for athlete ID: $id\n";
    
    // Simula i dati del controller
    $body = [
        'id' => $id,
        'first_name' => 'Test',
        'last_name' => 'Update',
        'email' => 'test@example.com'
    ];
    
    // Nota: Il controller usa $val per tutti i campi, prendendoli da $before se mancano in $body.
    // Dobbiamo vedere se qualche campo in $before (SELECT *) rompe l'UPDATE.
    
    $before = $repo->getAthleteById($id);
    $val = fn($k) => array_key_exists($k, $body) ? $body[$k] : ($before[$k] ?? null);
    
    $dataToUpdate = [
        ':first_name'              => trim($body['first_name']),
        ':last_name'               => trim($body['last_name']),
        ':jersey_number' => $val('jersey_number'),
        ':role' => $val('role'),
        ':birth_date' => $val('birth_date'),
        ':birth_place' => $val('birth_place'),
        ':height_cm' => $val('height_cm'),
        ':weight_kg' => $val('weight_kg'),
        ':residence_address' => $val('residence_address'),
        ':residence_city' => $val('residence_city'),
        ':phone' => $val('phone'),
        ':email' => $val('email'),
        ':identity_document' => $val('identity_document'),
        ':fiscal_code' => $val('fiscal_code'),
        ':medical_cert_type' => $val('medical_cert_type'),
        ':medical_cert_expires_at' => $val('medical_cert_expires_at'),
        ':federal_id' => $val('federal_id'),
        ':shirt_size' => $val('shirt_size'),
        ':shoe_size' => $val('shoe_size'),
        ':parent_contact'          => $val('parent_contact'),
        ':parent_phone'            => $val('parent_phone'),
        ':nationality'             => $val('nationality'),
        ':blood_group'             => $val('blood_group'),
        ':allergies'               => $val('allergies'),
        ':medications'             => $val('medications'),
        ':emergency_contact_name'  => $val('emergency_contact_name'),
        ':emergency_contact_phone' => $val('emergency_contact_phone'),
        ':communication_preference' => $val('communication_preference'),
        // ':image_release_consent'   => (int)($body['image_release_consent'] ?? ($before['image_release_consent'] ?? 0)),
        ':medical_cert_issued_at'  => $val('medical_cert_issued_at'),
        ':team_id' => $before['team_id'] ?? null,
    ];

    $repo->updateAthlete($id, $dataToUpdate);
    echo "Update successful!\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "SQL STATE: " . ($e instanceof \PDOException ? $e->getCode() : 'N/A') . "\n";
}
