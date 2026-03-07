<?php
/**
 * Fusion ERP — Test di Verifica Post-Fix Bug Critici
 *
 * Esegui da CLI:
 *   php tests/verify_bugfixes.php
 *
 * Verifica:
 *   1. Syntax check di tutti i file PHP core
 *   2. Firma corretta dei 3 metodi con tenantId
 *   3. Assenza di 'migrate' e secret hardcoded nel router
 *   4. Font CSS presenti nell'import
 *   5. Nessuna migrazione V013 duplicata
 */

declare(strict_types=1);

$root = dirname(__DIR__);
$passed = 0;
$failed = 0;
$results = [];

// ─── HELPER ──────────────────────────────────────────────────────────────────

function pass(string $label): void
{
    global $passed, $results;
    $passed++;
    $results[] = ['status' => '✅', 'label' => $label];
}

function fail(string $label, string $detail = ''): void
{
    global $failed, $results;
    $failed++;
    $results[] = ['status' => '❌', 'label' => $label, 'detail' => $detail];
}

function assertContains(string $content, string $needle, string $label): void
{
    str_contains($content, $needle) ? pass($label) : fail($label, "Non trovato: {$needle}");
}

function assertNotContains(string $content, string $needle, string $label): void
{
    !str_contains($content, $needle) ? pass($label) : fail($label, "Trovato (inatteso): {$needle}");
}

// ─── 1. SYNTAX CHECK ─────────────────────────────────────────────────────────

$phpFiles = [
    'api/Modules/Payments/PaymentsRepository.php',
    'api/Modules/Health/HealthRepository.php',
    'api/Modules/Athletes/AthletesRepository.php',
    'api/Modules/Athletes/AthletesController.php',
    'api/Modules/Dashboard/DashboardController.php',
    'api/router.php',
];

foreach ($phpFiles as $rel) {
    $path = $root . '/' . $rel;
    exec("php -l " . escapeshellarg($path) . " 2>&1", $out, $code);
    $code === 0 ? pass("Syntax: $rel") : fail("Syntax: $rel", implode(' ', $out));
    unset($out);
}

// ─── 2. TENANCY FIX — FIRMA METODI ───────────────────────────────────────────

$pr = file_get_contents($root . '/api/Modules/Payments/PaymentsRepository.php');
$hr = file_get_contents($root . '/api/Modules/Health/HealthRepository.php');
$ar = file_get_contents($root . '/api/Modules/Athletes/AthletesRepository.php');
$ac = file_get_contents($root . '/api/Modules/Athletes/AthletesController.php');
$dc = file_get_contents($root . '/api/Modules/Dashboard/DashboardController.php');

// PaymentsRepository
assertContains($pr, 'getGlobalStatus(string $tenantId)', 'PaymentsRepo: getGlobalStatus ha tenantId');
assertContains($pr, 'pp.tenant_id = :tid', 'PaymentsRepo: query filtra per tenant_id');
assertNotContains($pr, 'WHERE pp.status = \'active\'\n        ");', 'PaymentsRepo: vecchia query senza tenant rimossa');

// HealthRepository
assertContains($hr, 'getGlobalSummary(string $tenantId)', 'HealthRepo: getGlobalSummary ha tenantId');
assertContains($hr, 'a.tenant_id = :tid', 'HealthRepo: query filtra per tenant_id');

// AthletesRepository
assertContains($ar, 'getUnacknowledgedAlerts(string $tenantId', 'AthletesRepo: getUnacknowledgedAlerts ha tenantId');
assertContains($ar, 'a.tenant_id = :tid', 'AthletesRepo: alert filtra per tenant_id');
assertContains($ar, 'a.deleted_at IS NULL', 'AthletesRepo: alert esclude atleti cancellati');

// AthletesController — deve passare tenantId e richiedere manager
assertContains($ac, 'TenantContext::id()', 'AthletesCtrl: recupera tenantId via TenantContext');
assertContains($ac, 'requireRole(\'manager\')', 'AthletesCtrl: alerts() richiede ruolo manager');

// DashboardController — tutte le query devono avere tenant_id
assertContains($dc, 'TenantContext::id()', 'DashboardCtrl: usa TenantContext::id()');
assertContains($dc, "AND tenant_id = :tid", 'DashboardCtrl: stats() filtra per tenant_id');
assertContains($dc, "AND a.tenant_id = :tid", 'DashboardCtrl: acwr_alerts filtra per tenant_id');
assertContains($dc, "AND fc.tenant_id = :tid", 'DashboardCtrl: federation_cards filtra per tenant_id');

// ─── 3. ROUTER — ENDPOINT MIGRATE RIMOSSO ────────────────────────────────────

$router = file_get_contents($root . '/api/router.php');
assertNotContains($router, "'migrate'", 'Router: case migrate rimosso');
assertNotContains($router, "fusionerp2025v037", 'Router: secret hardcoded rimosso');
assertNotContains($router, "V037__federation_sync", 'Router: percorso file SQL rimosso');
assertContains($router, 'dispatch(',       'Router: funzione dispatch presente');

// Verifica che i 19 moduli legittimi siano ancora presenti
$modules = ['auth', 'athletes', 'teams', 'events', 'transport', 'admin', 'dashboard',
    'social', 'outseason', 'results', 'vald', 'finance', 'biometrics',
    'federation', 'documents', 'payments', 'health', 'tournaments', 'vehicles'];
foreach ($modules as $mod) {
    assertContains($router, "'$mod'", "Router: modulo '$mod' presente");
}

// ─── 4. CSS — FONT PRESENTI ──────────────────────────────────────────────────

$css = file_get_contents($root . '/css/style_v2.css');
assertContains($css, 'family=Syne', 'CSS: font Syne importato');
assertContains($css, 'family=JetBrains+Mono', 'CSS: font JetBrains Mono importato');
assertContains($css, "'Syne', sans-serif", 'CSS: --font-display usa Syne');
assertContains($css, "'JetBrains Mono'", 'CSS: --font-mono usa JetBrains Mono');

// ─── 5. MIGRAZIONI — V013 DUPLICATA RISOLTA ──────────────────────────────────

$migDir = $root . '/db/migrations';
$v013orig = glob($migDir . '/V013__*.sql');
$v013b = glob($migDir . '/V013b*.sql');
$allV013 = glob($migDir . '/V013*.sql');

if (count($v013orig) <= 1) {
    pass('Migrazioni: V013 non ha duplicati (una sola entry V013__)');
}
else {
    fail('Migrazioni: ancora ' . count($v013orig) . ' file V013__*.sql', implode(', ', $v013orig));
}

count($v013b) > 0 ? pass('Migrazioni: V013b__ presente') : fail('Migrazioni: V013b__ mancante');

// ─── REPORT FINALE ───────────────────────────────────────────────────────────

echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║    Fusion ERP — Verifica Post-Fix Bug Critici        ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

$maxLabel = max(array_map(fn($r) => strlen($r['label']), $results));
foreach ($results as $r) {
    $pad = str_repeat(' ', $maxLabel - strlen($r['label']));
    echo " {$r['status']}  {$r['label']}{$pad}";
    if (!empty($r['detail'])) {
        echo "  → {$r['detail']}";
    }
    echo "\n";
}

$total = $passed + $failed;
echo "\n────────────────────────────────────────────────────────\n";
echo " Risultato: {$passed}/{$total} test superati";
if ($failed > 0) {
    echo "  ⚠️  {$failed} falliti\n";
    exit(1);
}
else {
    echo "  🎉  TUTTI SUPERATI\n";
    exit(0);
}