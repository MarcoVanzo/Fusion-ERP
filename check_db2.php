<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, full_name, tenant_id FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $users]);
}
catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}       'id' => 'USR_123',
        'email' => 'test@test.com',
        'role' => 'manager',
        'fullName' => 'Test User',
        'permissions' => ['dashboard' => 'read']
    ];

    $controller = new DashboardController();

    // We want to capture Response::success outputs, but Response::success ends with exit;
    // We can't easily capture it unless we redefine it or just call the DB logic directly.
    // Let's just run the EXACT same code as DashboardController::summary() to see if it fails.

    $db = \FusionERP\Shared\Database::getInstance();
    $tid = TenantContext::id();

    $stmt = $db->prepare(
        'SELECT
            COUNT(*)                                                AS total_athletes,
            SUM(role             IS NOT NULL AND role <> \'\')      AS with_role,
            SUM(phone            IS NOT NULL AND phone <> \'\')     AS with_phone,
            SUM(email            IS NOT NULL AND email <> \'\')     AS with_email,
            SUM(fiscal_code      IS NOT NULL AND fiscal_code <> \'\') AS with_fiscal,
            SUM(medical_cert_expires_at IS NOT NULL)                AS with_med_cert,
            SUM(residence_address IS NOT NULL AND residence_address <> \'\') AS with_address,
            SUM(residence_city   IS NOT NULL AND residence_city <> \'\') AS with_city,
            SUM(parent_contact   IS NOT NULL AND parent_contact <> \'\') AS with_parent,
            SUM(parent_phone     IS NOT NULL AND parent_phone <> \'\') AS with_parent_ph
         FROM athletes
         WHERE is_active = 1
           AND deleted_at IS NULL
           AND tenant_id = :tid'
    );
    $stmt->execute([':tid' => $tid]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);

    $total = (int)($row['total_athletes'] ?? 0);
    $pct = fn($n) => $total > 0 ? (int)round(((int)$n / $total) * 100) : 0;

    $stmtTeams = $db->prepare(
        'SELECT COUNT(*) FROM teams WHERE tenant_id = :tid AND deleted_at IS NULL'
    );
    $stmtTeams->execute([':tid' => $tid]);
    $totalTeams = (int)$stmtTeams->fetchColumn();

    $pcts = [
        $pct($row['with_role']),
        $pct($row['with_phone']),
        $pct($row['with_email']),
        $pct($row['with_fiscal']),
        $pct($row['with_med_cert']),
        $pct($row['with_address']),
        $pct($row['with_city']),
        $pct($row['with_parent']),
        $pct($row['with_parent_ph']),
    ];

    echo json_encode([
        'total_athletes' => $total,
        'total_teams' => $totalTeams,
        'pct_role' => $pcts[0],
        'pct_phone' => $pcts[1],
        'pct_email' => $pcts[2],
        'pct_fiscal' => $pcts[3],
        'pct_med_cert' => $pcts[4],
        'pct_address' => $pcts[5],
        'pct_city' => $pcts[6],
        'pct_parent' => $pcts[7],
        'pct_parent_ph' => $pcts[8],
        'pct_avg' => (int)round(array_sum($pcts) / count($pcts)),
    ]);
}
catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}