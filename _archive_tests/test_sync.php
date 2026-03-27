<?php
$_SERVER['SERVER_NAME'] = 'localhost';
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env');
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line && !str_starts_with($line, '#')) {
            list($k, $v) = explode('=', $line, 2);
            putenv(trim($k) . '=' . trim($v));
            $_ENV[trim($k)] = trim($v);
        }
    }
}
spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'FusionERP\\')) {
        require_once __DIR__ . '/'.str_replace('\\', '/', substr($class, 10)) . '.php';
    }
});

class MockContext {
    public static function id() {
        return 'TNT_default';
    }
}
class_alias('MockContext', 'FusionERP\Shared\TenantContext');

$rc = new \FusionERP\Modules\Results\ResultsController();
$ref = new ReflectionMethod($rc, '_syncChampionshipData');
$ref->setAccessible(true);
$res = $ref->invoke($rc, 'fed_dc788225');
print_r($res);
