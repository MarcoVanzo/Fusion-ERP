<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once 'api/Shared/Database.php';

// Mock classes to bypass auth - must be in namespace block FIRST
namespace FusionERP\Shared {
    class TenantContext {
        public static function id(): string { return $GLOBALS['__tid']; }
    }
    class Auth {
        public static function requireRead(string $slug): void {}
        public static function requireWrite(string $slug): void {}
    }
    class Response {
        public static function success($data): void {
            echo "\n✅ SUCCESSO:\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            exit(0);
        }
        public static function error(string $msg, int $code = 500): void {
            echo "\n❌ ERRORE $code: $msg\n";
            exit(1);
        }
        public static function jsonBody(): array { return $GLOBALS['__body'] ?? []; }
    }
}

namespace {
    $pdo = FusionERP\Shared\Database::getInstance();

    // Get actual tenant
    $t = $pdo->query("SELECT id FROM tenants LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$t) { echo "❌ Nessun tenant trovato!\n"; exit(1); }
    $GLOBALS['__tid'] = $t['id'];
    echo "📌 Tenant: {$t['id']}\n";

    $GLOBALS['__body'] = [
        'label' => 'Serie B2 Femminile Girone D',
        'url'   => 'https://www.federvolley.it/serie-b2-femminile-calendario?girone=D',
    ];

    require_once 'api/Modules/Results/ResultsController.php';

    echo "🏐 Aggiunta campionato Serie B2 Femminile Girone D...\n";
    echo "   Recupero partite da FederVolley (30-90 secondi)...\n\n";

    set_time_limit(300);
    $ctrl = new FusionERP\Modules\Results\ResultsController();
    $ctrl->addCampionato();
}