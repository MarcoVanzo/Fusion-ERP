<?php
$_SERVER['SERVER_NAME'] = 'localhost';
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env');
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && !str_starts_with($line, '#')) {
            list($k, $v) = explode('=', $line, 2);
            putenv(trim($k) . '=' . trim($v));
            $_ENV[trim($k)] = trim($v);
        }
    }
}
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Results/ResultsController.php';

class MockContext {
    public static function id() {
        return 'TNT_default';
    }
}
class_alias('MockContext', 'FusionERP\Shared\TenantContext');

$ctrl = new \FusionERP\Modules\Results\ResultsController();
$ctx = stream_context_create(['http'=>[
    'method'=>'GET',
    'header'=>"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n"
]]);
$html = file_get_contents('https://venezia.portalefipav.net/risultati-classifiche.aspx?CId=84415', false, $ctx);

$refM = new ReflectionMethod($ctrl, '_parseMatches');
$refM->setAccessible(true);
$matches = $refM->invoke($ctrl, $html);
echo "Generic parses matches (venezia): " . count($matches) . "\n";

$refV = new ReflectionMethod($ctrl, '_parseMatchesFipavVeneto');
$refV->setAccessible(true);
$matches2 = $refV->invoke($ctrl, $html);
echo "Veneto parses matches: " . count($matches2) . "\n";
