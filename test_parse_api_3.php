<?php
namespace FusionERP\Shared {
    class TenantContext
    {
        public static function id()
        {
            return 'fipav_test_tenant';
        }
    }
    class Auth
    {
        public static function requireRead($slug)
        {
        }
        public static function requireWrite($slug)
        {
        }
    }
    class Database
    {
        public static function getInstance()
        {
            return new \PDO('sqlite::memory:');
        }
    }
}

namespace {
    require 'vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->load();

    require_once 'api/Modules/Results/ResultsController.php';

    $ctrl = new \FusionERP\Modules\Results\ResultsController();
    $url = 'https://www.federvolley.it/serie-b2-femminile-calendario';

    $reflector = new ReflectionClass(get_class($ctrl));
    $methodParams = $reflector->getMethod('_extractFedervolleyApiParams');
    $methodParams->setAccessible(true);
    $params = $methodParams->invokeArgs($ctrl, [$url]);

    echo "Extracted Params:\n";
    print_r($params);
    echo "\n";

    if ($params) {
        $methodAPI = $reflector->getMethod('_parseMatchesFedervolleyAPI');
        $methodAPI->setAccessible(true);
        $matches = $methodAPI->invokeArgs($ctrl, [$params]);
        echo "Found " . count($matches) . " matches via JSON API.\n";
    }
}