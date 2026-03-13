<?php
require_once __DIR__ . '/vendor/autoload.php';
use FusionERP\Shared\TenantContext;

// Inject tenant manually to test
$_SERVER['HTTP_HOST'] = 'localhost';
TenantContext::set('TNT_default');

$repo = new \FusionERP\Modules\Vald\ValdRepository();
$res1 = $repo->getResultsByAthlete('ATH_7188f043');
echo "Count ATH_7188f043: " . count($res1) . "\n";
$res2 = $repo->getResultsByAthlete('ATH_f0bd6636');
echo "Count ATH_f0bd6636: " . count($res2) . "\n";
