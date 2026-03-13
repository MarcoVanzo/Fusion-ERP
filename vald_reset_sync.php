<?php
/**
 * VALD Resync (ultimi 180 giorni) — ELIMINARE DOPO L'USO.
 */
set_time_limit(120);
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

// Skip session + auth — set tenant directly
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;
use FusionERP\Modules\Vald\ValdRepository;

$db = Database::getInstance();

// Resolve tenant without Auth (bypass session)
$row = $db->query('SELECT id FROM tenants LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if (!$row) { echo "ERRORE: nessun tenant.\n"; exit; }
TenantContext::setOverride($row['id']);
$tenantId = $row['id'];
echo "Tenant: $tenantId\n";

$dateFrom = date('Y-m-d', strtotime('-180 days'));
$dateTo   = date('Y-m-d');
echo "Periodo: $dateFrom → $dateTo\n\n";
flush(); ob_flush();

// Build linked-athletes lookup
$stmt = $db->prepare('SELECT id, vald_athlete_id FROM athletes WHERE tenant_id = :tid AND vald_athlete_id IS NOT NULL');
$stmt->execute([':tid' => $tenantId]);
$linked = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $linked[$r['vald_athlete_id']] = $r['id'];
}
echo "Atleti collegati: " . count($linked) . "\n\n";
flush(); ob_flush();

$service = new ValdService();
$repo    = new ValdRepository();
$found = $synced = $skipped = 0;

$page = 1;
while (true) {
    $results = $service->getTestResults($dateFrom, '', $page, $dateTo);
    if (empty($results) || !is_array($results)) break;

    $found += count($results);
    echo "Pagina $page: " . count($results) . " test trovati\n";
    flush(); ob_flush();

    foreach ($results as $test) {
        $vid = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
        if (!$vid || !isset($linked[$vid])) { $skipped++; continue; }
        $athleteId = $linked[$vid];

        $metrics = ['weight' => $test['weight'] ?? null, 'testType' => $test['testType'] ?? null];
        $teamId  = $test['teamId'] ?? '';
        $testId  = $test['id']     ?? '';

        if ($teamId && $testId) {
            try {
                $trials = $service->getTrials($teamId, $testId);
                if (is_array($trials) && !empty($trials)) {
                    $acc = []; $cnt = [];
                    foreach ($trials as $trial) {
                        if (!isset($trial['results'])) continue;
                        foreach ($trial['results'] as $res) {
                            $def  = strtoupper($res['definition']['result'] ?? '');
                            $val  = $res['value'] ?? null;
                            $limb = $res['limb'] ?? 'Trial';
                            if (!$def || $val === null) continue;
                            $k = null;
                            if ($limb === 'Trial') {
                                if ($def === 'RSI_MODIFIED') { $v=(float)$val; if($v>3)$v/=100; $val=round($v,3); $k='RSIModified'; }
                                elseif (in_array($def,['JUMP_HEIGHT_FLIGHT_TIME','FLIGHT_TIME_JUMP_HEIGHT','JUMP_HEIGHT','ESTIMATED_JUMP_HEIGHT','JUMP_HEIGHT_IMPULSE','JUMP_HEIGHT_IMP_MOM','JUMP_HEIGHT_IMPULSE_MOMENTUM'])) { $cm=(float)$val; if($cm<1)$cm*=100; $val=$cm; $k='JumpHeight'; }
                                elseif ($def==='PEAK_FORCE')     { $k='PeakForce'; }
                                elseif ($def==='BRAKING_IMPULSE') { $k='BrakingImpulse'; }
                                elseif ($def==='TIME_TO_TAKEOFF') { $val=((float)$val)*1000; $k='TimeToTakeoff'; }
                                elseif (in_array($def,['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE'])) { $k='PeakLandingForce'; }
                            }
                            if ($limb==='Left')  { if(in_array($def,['PEAK_FORCE','PEAK_FORCE_LEFT']))$k='PeakForceLeft'; if(in_array($def,['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE','LANDING_FORCE_LEFT']))$k='LandingForceLeft'; }
                            if ($limb==='Right') { if(in_array($def,['PEAK_FORCE','PEAK_FORCE_RIGHT']))$k='PeakForceRight'; if(in_array($def,['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE','LANDING_FORCE_RIGHT']))$k='LandingForceRight'; }
                            if ($k) { $acc[$k]=($acc[$k]??0)+(float)$val; $cnt[$k]=($cnt[$k]??0)+1; }
                        }
                    }
                    foreach ($acc as $key=>$sum) {
                        $n=$cnt[$key]??1;
                        $d=match(true){$key==='TimeToTakeoff'=>0,$key==='RSIModified'=>3,in_array($key,['JumpHeight','PeakForce','LandingForceLeft','LandingForceRight','PeakForceLeft','PeakForceRight'])=>1,default=>2};
                        $metrics[$key]=['Value'=>round($sum/$n,$d)];
                    }
                }
            } catch (\Throwable $e) { /* silently skip broken trial */ }
        }

        $repo->saveResult([
            ':id'         => 'VTST_'.bin2hex(random_bytes(4)),
            ':tenant_id'  => $tenantId,
            ':athlete_id' => $athleteId,
            ':test_id'    => $testId,
            ':test_date'  => date('Y-m-d H:i:s', strtotime($test['recordedUTC'] ?? 'now')),
            ':test_type'  => $test['testType'] ?? 'CMJ',
            ':metrics'    => json_encode($metrics),
        ]);
        $synced++;
    }

    if (count($results) < 50) break;
    $page++;
    if ($page > 20) break;
    flush(); ob_flush();
}

echo "\n=== RISULTATO ===\n";
echo "Trovati : $found\nSalvati : $synced\nSaltati : $skipped\n\n";

// Spot-check
$rows = $db->query('SELECT metrics FROM vald_test_results LIMIT 20')->fetchAll(PDO::FETCH_COLUMN);
$ok=$bad=0;
foreach ($rows as $json) {
    $m=json_decode($json,true)??[];
    $rsi=$m['RSIModified']['Value']??null;
    if($rsi===null)continue;
    if($rsi>=0.05&&$rsi<=3.0)$ok++; else{$bad++;echo"RSImod anomalo: $rsi\n";}
}
echo "RSImod [0.05–3.0]: $ok OK | $bad anomali\n";
