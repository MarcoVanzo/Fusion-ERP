<?php
/**
 * VALD Partial Resync — sincronizza solo gli ultimi 180 giorni.
 * ELIMINARE DOPO L'USO.
 */
set_time_limit(120);
ini_set('max_execution_time', 120);
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;
use FusionERP\Modules\Vald\ValdRepository;
use FusionERP\Modules\Vald\ValdCredentials;

$db = Database::getInstance();

// Set tenant context (first active tenant)
$stmt = $db->query('SELECT id FROM tenants WHERE status = "active" LIMIT 1');
$tenantRow = $stmt->fetch(PDO::FETCH_ASSOC) ?: $db->query('SELECT id FROM tenants LIMIT 1')->fetch(PDO::FETCH_ASSOC);
if (!$tenantRow) { echo "ERRORE: nessun tenant.\n"; exit; }
TenantContext::set($tenantRow['id']);
$tenantId = $tenantRow['id'];
echo "Tenant: $tenantId\n";

// Only sync last 180 days to fit within server timeout
$dateFrom = date('Y-m-d', strtotime('-180 days'));
$dateTo   = date('Y-m-d');
echo "Periodo sync: $dateFrom → $dateTo\n\n";
flush(); ob_flush();

$service = new ValdService();
$repo    = new ValdRepository();
$stats   = ['found' => 0, 'synced' => 0, 'skipped' => 0];

// Fetch org athletes linkage
$linkedAthletes = [];
$rows = $db->prepare('SELECT id, vald_athlete_id FROM athletes WHERE tenant_id = :tid AND vald_athlete_id IS NOT NULL');
$rows->execute([':tid' => $tenantId]);
foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $linkedAthletes[$r['vald_athlete_id']] = $r['id'];
}
echo "Atleti collegati a VALD: " . count($linkedAthletes) . "\n\n";

// Paginated fetch
$page = 1;
while (true) {
    $results = $service->getTestResults($dateFrom, '', $page, $dateTo);
    if (empty($results) || !is_array($results)) break;
    
    $stats['found'] += count($results);
    echo "Pagina $page: " . count($results) . " test\n";
    flush(); ob_flush();

    foreach ($results as $test) {
        $valdAthleteId = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
        if (!$valdAthleteId || !isset($linkedAthletes[$valdAthleteId])) {
            $stats['skipped']++;
            continue;
        }
        $athleteId = $linkedAthletes[$valdAthleteId];

        // Get trials
        $metrics = ['weight' => $test['weight'] ?? null, 'testType' => $test['testType'] ?? null];
        $teamId  = $test['teamId'] ?? '';
        $testId  = $test['id'] ?? '';

        if ($teamId && $testId) {
            try {
                $trialsData = $service->getTrials($teamId, $testId);
                if (is_array($trialsData) && !empty($trialsData)) {
                    $acc = []; $counts = [];
                    foreach ($trialsData as $trial) {
                        if (!isset($trial['results'])) continue;
                        foreach ($trial['results'] as $res) {
                            $def = strtoupper($res['definition']['result'] ?? '');
                            $val = $res['value'] ?? null;
                            $limb = $res['limb'] ?? 'Trial';
                            if (!$def || $val === null) continue;
                            $k = null;
                            if ($limb === 'Trial') {
                                if ($def === 'RSI_MODIFIED')   { $rsi = (float)$val; if ($rsi > 3) $rsi /= 100; $val = round($rsi,3); $k = 'RSIModified'; }
                                if (in_array($def, ['JUMP_HEIGHT_FLIGHT_TIME','FLIGHT_TIME_JUMP_HEIGHT','JUMP_HEIGHT','ESTIMATED_JUMP_HEIGHT','JUMP_HEIGHT_IMPULSE','JUMP_HEIGHT_IMP_MOM','JUMP_HEIGHT_IMPULSE_MOMENTUM'])) { $cm=(float)$val; if($cm<1)$cm*=100; $val=$cm; $k='JumpHeight'; }
                                if ($def === 'PEAK_FORCE')     { $k = 'PeakForce'; }
                                if ($def === 'BRAKING_IMPULSE') { $k = 'BrakingImpulse'; }
                                if ($def === 'TIME_TO_TAKEOFF') { $val = ((float)$val)*1000; $k = 'TimeToTakeoff'; }
                                if (in_array($def, ['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE'])) { $k = 'PeakLandingForce'; }
                            }
                            if ($limb === 'Left')  { if (in_array($def,['PEAK_FORCE','PEAK_FORCE_LEFT'])) $k='PeakForceLeft'; if (in_array($def,['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE','LANDING_FORCE_LEFT'])) $k='LandingForceLeft'; }
                            if ($limb === 'Right') { if (in_array($def,['PEAK_FORCE','PEAK_FORCE_RIGHT'])) $k='PeakForceRight'; if (in_array($def,['PEAK_LANDING_FORCE','LANDING_PEAK_FORCE','LANDING_FORCE_RIGHT'])) $k='LandingForceRight'; }
                            if ($k) { $acc[$k] = ($acc[$k] ?? 0) + (float)$val; $counts[$k] = ($counts[$k] ?? 0) + 1; }
                        }
                    }
                    foreach ($acc as $key => $sum) {
                        $n = $counts[$key] ?? 1;
                        $decimals = match(true) { $key==='TimeToTakeoff'=>0, $key==='RSIModified'=>3, in_array($key,['JumpHeight','PeakForce','LandingForceLeft','LandingForceRight','PeakForceLeft','PeakForceRight'])=>1, default=>2 };
                        $metrics[$key] = ['Value' => round($sum/$n, $decimals)];
                    }
                }
            } catch (\Throwable $e) { /* skip broken trial */ }
        }

        $repo->saveResult([
            ':id'         => 'VTST_' . bin2hex(random_bytes(4)),
            ':tenant_id'  => $tenantId,
            ':athlete_id' => $athleteId,
            ':test_id'    => $testId,
            ':test_date'  => date('Y-m-d H:i:s', strtotime($test['recordedUTC'] ?? 'now')),
            ':test_type'  => $test['testType'] ?? 'CMJ',
            ':metrics'    => json_encode($metrics),
        ]);
        $stats['synced']++;
    }

    if (count($results) < 50) break;
    $page++;
    if ($page > 20) break;
}

echo "\n=== RISULTATO ===\n";
echo "Trovati : {$stats['found']}\n";
echo "Salvati : {$stats['synced']}\n";
echo "Saltati : {$stats['skipped']}\n\n";

// Spot-check RSImod
$rows2 = $db->query('SELECT metrics FROM vald_test_results LIMIT 20')->fetchAll(PDO::FETCH_COLUMN);
$ok = $bad = 0;
foreach ($rows2 as $json) {
    $m = json_decode($json, true) ?: [];
    $rsi = $m['RSIModified']['Value'] ?? null;
    if ($rsi === null) continue;
    if ($rsi >= 0.05 && $rsi <= 3.0) $ok++;
    else { $bad++; echo "RSImod anomalo: $rsi\n"; }
}
echo "RSImod nel range [0.05–3.0]: $ok ok | $bad anomali\n";
