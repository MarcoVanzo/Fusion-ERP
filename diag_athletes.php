<?php
/**
 * diag_athletes.php — One-shot diagnostic (DELETE AFTER USE)
 * Token: FUSION_DIAG_2026
 */
declare(strict_types=1);

if (($_GET['token'] ?? '') !== 'FUSION_DIAG_2026') {
    http_response_code(403);
    echo 'forbidden';
    exit;
}

$envFile = __DIR__ . '/.env';
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#')
            continue;
        [$key, $value] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value, '"\''));
    }
}

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    getenv('DB_HOST'), getenv('DB_PORT'), getenv('DB_NAME'));

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // 1. Check columns
    $cols = $pdo->query(
        "SELECT COLUMN_NAME, DATA_TYPE, GENERATION_EXPRESSION 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = '" . getenv('DB_NAME') . "' AND TABLE_NAME = 'athletes'
         ORDER BY ORDINAL_POSITION"
    )->fetchAll();

    // 2. Get 3 sample athletes using the EXACT same query as listAthletes
    $listQuery = "SELECT a.id, a.first_name, a.last_name, a.full_name, a.jersey_number, a.role,
                       a.birth_date, a.phone, a.email, a.medical_cert_expires_at, a.federal_id,
                       a.height_cm, a.weight_kg, a.photo_path, a.is_active,
                       COALESCE(t.name, 'Nessuna squadra') AS team_name, COALESCE(t.category, 'Nessuna') AS category
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id
                WHERE a.deleted_at IS NULL AND a.is_active = 1
                ORDER BY a.full_name LIMIT 3";
    $listData = $pdo->query($listQuery)->fetchAll();

    // 3. Get 1 athlete detail using the EXACT same query as getAthleteById
    $detailId = $listData[0]['id'] ?? null;
    $detailData = null;
    if ($detailId) {
        $stmt = $pdo->prepare(
            "SELECT a.id, a.user_id, a.team_id, a.first_name, a.last_name, a.full_name,
                    a.jersey_number, a.role, a.birth_date, a.birth_place,
                    a.height_cm, a.weight_kg, a.photo_path,
                    a.residence_address, a.residence_city, a.phone, a.email,
                    a.identity_document, a.fiscal_code, a.medical_cert_expires_at,
                    a.federal_id, a.parent_contact, a.parent_phone, a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             JOIN teams t ON a.team_id = t.id
             WHERE a.id = :id AND a.deleted_at IS NULL
             LIMIT 1"
        );
        $stmt->execute([':id' => $detailId]);
        $detailData = $stmt->fetch();
    }

    echo json_encode([
        'success' => true,
        'column_count' => count($cols),
        'columns' => array_map(fn($c) => $c['COLUMN_NAME'] . ' (' . $c['DATA_TYPE'] . ')' . ($c['GENERATION_EXPRESSION'] ? ' [GEN]' : ''), $cols),
        'list_sample' => $listData,
        'detail_sample' => $detailData,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}