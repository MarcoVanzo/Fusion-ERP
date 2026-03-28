<?php
require_once 'api/vendor/autoload.php';

// Mock DB
namespace FusionERP\Shared {
    class Database {
        public static function getInstance(): \PDO {
            return new \PDO('sqlite::memory:');
        }
    }
}

namespace {
    use FusionERP\Modules\Finance\FinanceController;
    try {
        echo "Instantiating FinanceController...\n";
        $controller = new FinanceController();
        echo "Controller instantiated!\n";
    } catch (\Throwable $e) {
        echo "THROWABLE CAUGHT: (" . get_class($e) . ") " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
    }
}
