<?php
/**
 * Diagnostic: Test audit_logs INSERT to find why logs stopped after April 8th.
 * DELETE THIS FILE after debugging.
 */
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '0');

$results = ['steps' => []];

try {
    // 1. Load autoloader
    require_once __DIR__ . '/../vendor/autoload.php';
    $results['steps'][] = '✅ Autoloader loaded';

    // 2. Load env
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        $dotenv = \Dotenv\Dotenv::createImmutable(dirname($envFile));
        $dotenv->safeLoad();
        $results['steps'][] = '✅ .env loaded';
    }

    // 3. Test DB connection
    $db = \FusionERP\Shared\Database::getInstance();
    $results['steps'][] = '✅ DB connected';

    // 4. Check audit_logs columns
    $cols = $db->query("SHOW COLUMNS FROM audit_logs")->fetchAll(\PDO::FETCH_ASSOC);
    $colNames = array_column($cols, 'Field');
    $results['columns'] = $colNames;

    $expectedCols = ['event_type', 'username', 'role', 'user_agent', 'http_status', 'details'];
    $missing = array_diff($expectedCols, $colNames);
    if (empty($missing)) {
        $results['steps'][] = '✅ All V015/V016 columns exist';
    } else {
        $results['steps'][] = '❌ MISSING columns: ' . implode(', ', $missing);
        $results['missing_columns'] = $missing;
    }

    // 5. Count recent logs
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at >= '2026-04-08'");
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);
    $results['logs_after_apr8'] = (int)$row['cnt'];

    // 6. Latest log entry
    $stmt = $db->query("SELECT id, action, event_type, table_name, username, role, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 3");
    $results['latest_logs'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

    // 7. Try a test INSERT with ALL columns
    $testId = 'AUD_diag_' . bin2hex(random_bytes(3));
    try {
        $stmt = $db->prepare(
            'INSERT INTO audit_logs 
                (id, user_id, username, role, action, event_type, table_name, record_id,
                 before_snapshot, after_snapshot, ip_address, user_agent, http_status, details)
             VALUES
                (:id, :user_id, :username, :role, :action, :event_type, :table_name, :record_id,
                 :before, :after, :ip, :user_agent, :http_status, :details)'
        );
        $stmt->execute([
            ':id' => $testId,
            ':user_id' => null,
            ':username' => 'DIAG_TEST',
            ':role' => 'admin',
            ':action' => 'INSERT',
            ':event_type' => 'system',
            ':table_name' => 'diag_test',
            ':record_id' => null,
            ':before' => null,
            ':after' => json_encode(['test' => true]),
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            ':user_agent' => 'DiagTool/1.0',
            ':http_status' => 200,
            ':details' => 'Diagnostic test entry',
        ]);
        $results['steps'][] = "✅ Test INSERT succeeded (id: {$testId})";
        $results['test_insert_ok'] = true;

        // Cleanup
        $db->exec("DELETE FROM audit_logs WHERE id = '{$testId}'");
        $results['steps'][] = '✅ Test entry cleaned up';
    } catch (\Throwable $e) {
        $results['steps'][] = '❌ Test INSERT FAILED: ' . $e->getMessage();
        $results['test_insert_ok'] = false;
        $results['insert_error'] = $e->getMessage();
    }

    // 8. Check PHP version
    $results['php_version'] = PHP_VERSION;
    $results['match_supported'] = version_compare(PHP_VERSION, '8.0.0', '>=');

} catch (\Throwable $e) {
    $results['fatal_error'] = $e->getMessage();
    $results['trace'] = $e->getTraceAsString();
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
