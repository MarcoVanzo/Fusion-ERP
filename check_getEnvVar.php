<?php
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
echo "Controller path: " . $rc->getFileName() . "\n";
echo "getEnvVar private testing...\n";

// Use reflection to call the private method getEnvVar
$method = $rc->getMethod('getEnvVar');
$method->setAccessible(true);

echo "Fusion Form ID from getEnvVar: ";
$val = $method->invoke(null, 'SCOUTING_FUSION_FORM_ID');
var_dump($val);

// Let's copy the code from getEnvVar and run it raw here:
$envFile = dirname($rc->getFileName(), 4) . '/.env'; 
// wait, the file is in ERP/api/Modules/Scouting/ScoutingController.php
// dirname 1: Scouting
// dirname 2: Modules
// dirname 3: api
// dirname 4: ERP
// IN PHP, dirname(__FILE__, 4) is ERP.
// But __DIR__ inside ScoutingController is ERP/api/Modules/Scouting.
// For __DIR__, level 1 is Modules, level 2 is api, level 3 is ERP.

echo "Raw __DIR__ check:\n";
echo "Level 1: " . dirname(dirname($rc->getFileName())) . "\n";
echo "Level 2: " . dirname(dirname(dirname($rc->getFileName()))) . "\n";
echo "Level 3: " . dirname(dirname(dirname(dirname($rc->getFileName())))) . "\n";
