<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once 'api/Shared/Database.php';

// Mock TenantContext
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
    class Response
    {
        public static function success($data)
        {
            echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
            exit;
        }
        public static function error($msg, $code)
        {
            echo "ERROR $code: $msg\n";
            exit;
        }
    }
}

namespace {
    define('TEST_MODE', true);
    require_once 'api/Modules/Results/ResultsController.php';

    $db = FusionERP\Shared\Database::getInstance();
    $tid = 'fipav_test_tenant';

    // Insert dummy B2 
    $db->prepare("INSERT IGNORE INTO tenants (id, name) VALUES ('$tid', 'Test Tenant')")->execute();

    $url = 'https://www.federvolley.it/serie-b2-femminile-calendario?girone=D';
    $champId = 'test_b2';

    $db->prepare("INSERT INTO federation_championships (id, tenant_id, label, url) VALUES (?, ?, 'B2', ?) ON DUPLICATE KEY UPDATE url = url")
        ->execute([$champId, $tid, $url]);

    $_GET['id'] = $champId;
    $ctrl = new FusionERP\Modules\Results\ResultsController();
    $ctrl->sync();
}