<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $controller = new \FusionERP\Modules\Results\ResultsController();
    
    // Inizia un buffer per catturare eventuale output sfuggito
    ob_start();
    $controller->getPublicMatchCenter();
    $output = ob_get_clean();
    
    // Se la response è stata inviata con ob_end_clean o exit dentro al router/Response,
    // forse questo script non arriverà qui se getPublicMatchCenter ha esito positivo (perché fa exit dentro Response::success).
    // Ma se fallisce con un eccezione, lo prendiamo sotto.
    
    echo "Output: " . $output;

} catch (\Throwable $e) { // Usare \Throwable per prendere anche gli Error nativi di PHP
    echo json_encode([
        "success" => false, 
        "exception_type" => get_class($e),
        "message" => $e->getMessage(),
        "file" => $e->getFile(),
        "line" => $e->getLine()
    ]);
}
