<?php
namespace FusionERP\Shared {
    class TenantContext {
        public static function id() { return 'fipav_test_tenant'; }
    }
    class Auth {
        public static function requireRead($slug) {}
        public static function requireWrite($slug) {}
    }
    class Database {
        public static function getInstance() { return new \PDO('sqlite::memory:'); }
    }
}

namespace {
    require 'vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->load();

    require_once 'api/Modules/Results/ResultsController.php';

    $ctrl = new \FusionERP\Modules\Results\ResultsController();
    $url = 'https://www.federvolley.it/serie-b2-femminile-calendario?girone=D';
    
    $reflector = new ReflectionClass(get_class($ctrl));
    $method = $reflector->getMethod('_parseMatchesFedervolleyAPI');
    $method->setAccessible(true);
    
    $matches = $method->invokeArgs($ctrl, [$url]);
    echo "Found " . count($matches) . " matches via _parseMatchesFedervolleyAPI.\n";
    
    $paramsMethod = $reflector->getMethod('_extractFedervolleyApiParams');
    $paramsMethod->setAccessible(true);
    $params = $paramsMethod->invokeArgs($ctrl, [$url]);
    print_r($params);
    
    $standingsMethod = $reflector->getMethod('_parseStandingsFedervolley');
    $standingsMethod->setAccessible(true);
    if ($params) {
        $standings = $standingsMethod->invokeArgs($ctrl, [$params, 18]);
        echo "Found " . count($standings) . " standings.\n";
    }
}