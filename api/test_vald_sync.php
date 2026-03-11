<?php
define('IS_CRON', true); 
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../vendor/autoload.php';

foreach (file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if ($line === '' || $line[0] === '#') continue;
    if (strpos($line, '=') !== false) {
        list($k, $v) = explode('=', trim($line), 2);
        putenv(trim($k) . '=' . trim($v, " \t\"'"));
        $_ENV[trim($k)] = trim($v, " \t\"'");
    }
}

try {
    $service = new \FusionERP\Modules\Vald\ValdService();
    $tests = $service->getTestResults(date('Y-m-d', strtotime('-30 days')));
    
    if (empty($tests)) {
        echo "No tests found.\n";
    } else {
        $testId = $tests[0]['id'];
        $teamId = $tests[0]['teamId'];
        
        $method = new ReflectionMethod($service, 'request');
        $method->setAccessible(true);
        $trials = $method->invoke($service, 'GET', "/v2019q3/teams/$teamId/tests/$testId/trials");
        
        $keys = [];
        if (is_array($trials)) {
            foreach ($trials as $trial) {
                if (!isset($trial['results']) || !is_array($trial['results'])) continue;
                foreach ($trial['results'] as $res) {
                    $keys[] = $res['definition']['result'];
                }
            }
        }
        echo "ALL UNIQUE METRIC KEYS IN TRIAL:\n";
        print_r(array_unique($keys));
    }
} catch (\Throwable $e) {
    echo "CRASH Caught:\n" . $e->getMessage() . "\n";
}
