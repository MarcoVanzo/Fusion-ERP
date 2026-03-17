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
class MockAuth {
    public static function requireRead($module) {}
}
class_alias('MockAuth', 'FusionERP\Shared\Auth');

$_GET['campionato_id'] = 'fed_dc788225';
$rc = new \FusionERP\Modules\Results\ResultsController();

// We'll simulate filter_input by redefining it, but we can't.
// Let's just create a modified copy of getResults logic
        $campionatoId = 'fed_dc788225';

        $pdo = \FusionERP\Shared\Database::getInstance();
        $tenantId = \FusionERP\Shared\TenantContext::id();

        // ── Check Database first ─────────────────────────────────────────────
        $stmt = $pdo->prepare("
            SELECT m.*, c.url as source_url, c.last_synced_at
            FROM federation_matches m
            JOIN federation_championships c ON m.championship_id = c.id
            WHERE c.id = :cid AND c.tenant_id = :tid
            ORDER BY m.match_date ASC
        ");
        $stmt->execute([':cid' => $campionatoId, ':tid' => $tenantId]);
        $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($matches)) {
            // Adapt DB names to UI names if needed
            foreach ($matches as &$m) {
                $m['home'] = $m['home_team'];
                $m['away'] = $m['away_team'];
                $m['score'] = ($m['home_score'] !== null && $m['away_score'] !== null)
                    ? $m['home_score'] . ' - ' . $m['away_score']
                    : null;
                $m['sets_home'] = $m['home_score'];
                $m['sets_away'] = $m['away_score'];
                $m['date'] = $m['match_date'] ? date('d/m/Y', strtotime($m['match_date'])) : null;
                $m['time'] = $m['match_date'] ? date('H:i', strtotime($m['match_date'])) : null;
                
                // Need to use reflection to call private method
                $refIsOurTeam = new ReflectionMethod($rc, '_isOurTeam');
                $refIsOurTeam->setAccessible(true);
                $m['is_our_team'] = $refIsOurTeam->invokeArgs($rc, [$m['home_team'], $m['away_team']]);
            }
            echo json_encode(['matches' => $matches]);
        }
