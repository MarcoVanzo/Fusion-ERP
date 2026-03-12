<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;
use FusionERP\Modules\Vald\ValdRepository;

// Allow web trigger

$db = Database::getInstance();

echo "[*] Iniziando importazione massiva storica da VALD (dal 2020)...\n";

$tenantStmt = $db->query("SELECT DISTINCT tenant_id FROM athletes WHERE vald_athlete_id IS NOT NULL");
$tenants = $tenantStmt->fetchAll(\PDO::FETCH_COLUMN);

foreach ($tenants as $tId) {
    TenantContext::setOverride((int)$tId);
    echo "\n[*] --- Elaborazione Tenant ID: $tId ---\n";
    
    $service = new ValdService();
    $repo = new ValdRepository();
    
    $page = 1;
    $synced = 0;
    $skipped = 0;
    $found = 0;

    $valdAthletes = [];
    $stmt = $db->prepare("SELECT vald_athlete_id FROM athletes WHERE tenant_id = ? AND vald_athlete_id IS NOT NULL");
    $stmt->execute([$tId]);
    while ($row = $stmt->fetch()) {
        $valdAthletes[] = $row['vald_athlete_id'];
    }
    echo "[*] Trovati " . count($valdAthletes) . " atleti collegati in questo tenant.\n";

while (true) {
    echo "  -> Fetching page $page...\n";
    $pageResults = $service->getTestResults('2020-01-01T00:00:00Z', '', $page);
    
    if (empty($pageResults) || !is_array($pageResults) || isset($pageResults['error'])) {
        break;
    }
    
    $found += count($pageResults);

    foreach ($pageResults as $test) {
        $valdAthleteId = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
        if (!$valdAthleteId || !in_array($valdAthleteId, $valdAthletes)) {
            $skipped++;
            continue;
        }

        // Fetch trials
        $teamId = $test['teamId'] ?? '';
        $testIdStr = $test['id'] ?? '';
        
        $metrics = [
            'weight' => $test['weight'] ?? null,
            'testType' => $test['testType'] ?? null,
        ];

        if ($teamId && $testIdStr) {
            $trialsData = $service->getTrials($teamId, $testIdStr);
            if (!empty($trialsData) && is_array($trialsData)) {
                $sums = [];
                $counts = [];
                $bestTrial = null;
                $maxJumpHeight = -1;

                foreach ($trialsData as $trial) {
                    // Only process valid trials (id > 0)
                    $trialId = $trial['id'] ?? 0;
                    if ($trialId <= 0) continue;

                    if (!isset($trial['metrics']) || !is_array($trial['metrics'])) continue;
                    
                    // Track best trial for metrics we don't average
                    $jh = $trial['metrics']['JumpHeightTotal']['Value'] ?? $trial['metrics']['JumpHeight']['Value'] ?? 0;
                    if ($jh > $maxJumpHeight) {
                        $maxJumpHeight = $jh;
                        $bestTrial = $trial;
                    }

                    // Sum metrics for averaging
                    foreach ($trial['metrics'] as $key => $metricData) {
                        if (!isset($metricData['Value'])) continue;
                        $val = (float)$metricData['Value'];

                        if (!isset($sums[$key])) {
                            $sums[$key] = ['sum' => 0.0, 'count' => 0, 'Unit' => $metricData['Unit'] ?? ''];
                        }
                        $sums[$key]['sum'] += $val;
                        $sums[$key]['count']++;
                    }
                }

                if (!empty($sums)) {
                    foreach ($sums as $key => $data) {
                        if ($data['count'] > 0) {
                            $avgVal = $data['sum'] / $data['count'];

                            if ($key === 'RSIModified' && $avgVal > 10) {
                                $avgVal = $avgVal / 100;
                            }
                            if ($key === 'RSI' && $avgVal > 10) {
                                $avgVal = $avgVal / 100;
                            }

                            $metrics[$key] = [
                                'Value' => $avgVal,
                                'Unit' => $data['Unit']
                            ];
                        }
                    }
                    if ($bestTrial) {
                        $metrics['BrakingImpulse'] = $bestTrial['metrics']['BrakingImpulse'] 
                            ?? $bestTrial['metrics']['EccentricBrakingImpulse'] 
                            ?? $bestTrial['metrics']['BrakingPhaseImpulse'] 
                            ?? null;
    
                        $metrics['PeakForce'] = $bestTrial['metrics']['PeakForce'] ?? null;
                    }
                } else if (!empty($test['metrics'])) {
                    $metrics = array_merge($metrics, $test['metrics']);
                }
            } else {
                $metrics = array_merge($metrics, $test['metrics'] ?? []);
            }
        } else {
            $metrics = array_merge($metrics, $test['metrics'] ?? []);
        }

        // Apply fallback scaling on RSI if no trials were found
        if (isset($metrics['RSIModified']['Value']) && $metrics['RSIModified']['Value'] > 10) {
            $metrics['RSIModified']['Value'] = $metrics['RSIModified']['Value'] / 100;
        }

        $stmt = $db->prepare("SELECT id FROM athletes WHERE vald_athlete_id = ? AND tenant_id = ?");
        $stmt->execute([$valdAthleteId, $tId]);
        $erpAthleteId = $stmt->fetchColumn();

        if ($erpAthleteId) {
            $repo->saveResult([
                ':id'         => $testIdStr,
                ':tenant_id'  => $tId,
                ':athlete_id' => $erpAthleteId,
                ':test_id'    => $testIdStr,
                ':test_date'  => gmdate('Y-m-d H:i:s', ($test['recordedUTC'] ?? 0) / 1000),
                ':test_type'  => $test['testType'] ?? '',
                ':metrics'    => json_encode($metrics)
            ]);
            $synced++;
        }
    }

    if (count($pageResults) < 100) {
        break;
    }
    $page++;
    if ($page > 50) break; // Limit
}
} // end foreach tenants

echo "\n====== SINC MASSIVA COMPLETATA ======\n";
echo "Test Trovati: $found\n";
echo "Test Salvati: $synced\n";
echo "Test Saltati: $skipped\n";
