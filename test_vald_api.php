<?php
require_once 'api/config/env.php';
require_once 'api/modules/Vald/ValdService.php';

$vs = new \FusionERP\Modules\Vald\ValdService();
$athletes = $vs->getAthletes();
print_r(array_slice($athletes, 0, 2));
