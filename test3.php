<?php
require_once __DIR__ . '/api/vendor/autoload.php';
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Database;
use FusionERP\Modules\Vald\ValdRepository;

TenantContext::set('TNT_default');
$repo = new ValdRepository();
$res = $repo->getResultsByAthlete('ATH_7188f043');
echo "Count for ATH_7188f043: " . count($res) . "\n";

$res2 = $repo->getResultsByAthlete('ATH_f0bd6636');
echo "Count for ATH_f0bd6636: " . count($res2) . "\n";
