<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

class DummyAuth {
    public static function user() { return ['id' => 'USR_123', 'full_name' => 'Test User', 'role' => 'admin']; }
}

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $repo = new \FusionERP\Modules\Health\HealthRepository();
    
    $repo->insertInjury([
            ':id' => 'INJ_TEST',
            ':tenant_id' => 'TNT_123',
            ':athlete_id' => 'ATH_123',
            ':injury_date' => '2024-01-01',
            ':type' => '',
            ':body_part' => '',
            ':severity' => '',
            ':stop_days' => 0,
            ':return_date' => null,
            ':notes' => '',
            ':treated_by' => 'Tester',
            ':created_by' => 'USR_123',
            ':location_context' => null,
            ':side' => null,
            ':mechanism' => null,
            ':official_diagnosis' => null,
            ':diagnosis_date' => null,
            ':diagnosed_by' => null,
            ':instrumental_tests' => null,
            ':test_results' => null,
            ':is_recurrence' => 0,
            ':treatment_type' => null,
            ':surgery_date' => null,
            ':physio_plan' => null,
            ':assigned_physio' => null,
            ':current_status' => 'INJURED',
            ':estimated_recovery_time' => null,
            ':estimated_return_date' => null,
            ':medical_clearance_given' => 0,
        ]);
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
