<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/api/vendor/autoload.php';
    require_once __DIR__ . '/api/config/config.php';
    require_once __DIR__ . '/api/Shared/Database.php';
    require_once __DIR__ . '/api/Modules/Athletes/AthletesRepository.php';

    $repo = new FusionERP\Modules\Athletes\AthletesRepository();
    echo "Testing listAthletes...\n";
    $athletes = $repo->listAthletes();
    echo "Athletes: " . count($athletes) . "\n";

    echo "Testing listTeams...\n";
    $teams = $repo->listTeams();
    echo "Teams: " . count($teams) . "\n";

}
catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}