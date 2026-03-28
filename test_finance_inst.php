<?php
require_once __DIR__ . '/api/vendor/autoload.php';

try {
    echo "Creating controller reflection...\n";
    $rc = new \ReflectionClass(\FusionERP\Modules\Finance\FinanceRepository::class);
    $repo = $rc->newInstanceWithoutConstructor();
    
    echo "Creating service...\n";
    $svc = new \FusionERP\Modules\Finance\FinanceService($repo);
    echo "Service created successfully.\n";

    $refCtrl = new \ReflectionClass(\FusionERP\Modules\Finance\FinanceController::class);
    $ctrl = $refCtrl->newInstanceWithoutConstructor();
    echo "Controller created successfully.\n";

} catch (\Throwable $e) {
    echo "THROWABLE CAUGHT: (" . get_class($e) . ") " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
}
