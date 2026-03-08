<?php
// Temporary import script — DELETE after use
declare(strict_types=1);

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#'))
            continue;
        if (str_contains($line, '=')) {
            [$k, $v] = explode('=', $line, 2);
            $v = trim($v, " \t\n\r\"'");
            putenv("$k=$v");
            $_ENV[$k] = $v;
        }
    }
}

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'fusion_erp';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}
catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Get tenant_id
$tenant = $pdo->query("SELECT id FROM tenants LIMIT 1")->fetch();
$tenantId = $tenant['id'] ?? null;
if (!$tenantId) {
    echo json_encode(['error' => 'Nessun tenant trovato']);
    exit;
}

// Staff data from Allenatori.xlsx
$rows = [
    ['first_name' => 'Marco', 'last_name' => 'Vanzo', 'role' => 'Primo Allenatore', 'birth_date' => '1979-11-28', 'phone' => '3470800161', 'email' => 'direttoretecnico@fusionteamvolley.it'],
    ['first_name' => 'Carlo', 'last_name' => 'Chieco', 'role' => 'Secondo Allenatore', 'birth_date' => '1972-08-09', 'phone' => '3468040690', 'email' => 'carloKie@libero.it'],
    ['first_name' => 'Stefano', 'last_name' => 'Cietto', 'role' => 'Secondo Allenatore', 'birth_date' => '1991-08-07', 'phone' => '3382986338', 'email' => 'Ciettos00@gmail.com'],
    ['first_name' => 'Jacopo', 'last_name' => 'Micheli', 'role' => 'Secondo Allenatore', 'birth_date' => '2001-02-23', 'phone' => '3703007815', 'email' => 'jacopomicheli23@gmail.com'],
    ['first_name' => 'Marco', 'last_name' => 'Cedolini', 'role' => 'Secondo Allenatore', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Nicola', 'last_name' => 'Martignago', 'role' => 'Primo Allenatore', 'birth_date' => '1996-02-13', 'phone' => '3348062321', 'email' => 'nico.martignago96@gmail.com'],
    ['first_name' => 'Catiuscia', 'last_name' => 'Bazzi', 'role' => 'Secondo Allenatore', 'birth_date' => '1972-01-20', 'phone' => '3384516769', 'email' => 'katiusciabazzi@gmail.com'],
    ['first_name' => 'Alessia', 'last_name' => 'Carraro', 'role' => 'Secondo Allenatore', 'birth_date' => '2003-12-17', 'phone' => '3458233995', 'email' => 'alessiacarraro10@gmail.com'],
    ['first_name' => 'Nicolò', 'last_name' => 'Pellizzari', 'role' => 'Secondo Allenatore', 'birth_date' => '2006-02-20', 'phone' => '3664394242', 'email' => 'nicolopellizzari4@gmail.com'],
    ['first_name' => 'Irene', 'last_name' => 'Girotto', 'role' => 'Preparatore Atletico', 'birth_date' => '2001-04-10', 'phone' => '3425900866', 'email' => 'girottoirene01@gmail.com'],
    ['first_name' => 'Claudio', 'last_name' => 'Pavanello', 'role' => 'Fisioterapista', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Simone', 'last_name' => 'Vergano', 'role' => 'Fisioterapista', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Nicola', 'last_name' => 'Bragato', 'role' => 'Dirigente', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Chantal', 'last_name' => 'Pollon', 'role' => 'Dirigente', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Alessandro', 'last_name' => 'Gobbo', 'role' => 'Dirigente', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Francesco', 'last_name' => 'Donnarumma', 'role' => 'Dirigente', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Alessia', 'last_name' => 'Carraro', 'role' => 'Addetta Stampa', 'birth_date' => null, 'phone' => null, 'email' => null],
    ['first_name' => 'Alessio', 'last_name' => 'Carraro', 'role' => 'Preparatore Atletico', 'birth_date' => null, 'phone' => null, 'email' => null],
];

$sql = "INSERT INTO staff_members (id, tenant_id, first_name, last_name, role, birth_date, phone, email)
        VALUES (:id, :tenant_id, :first_name, :last_name, :role, :birth_date, :phone, :email)
        ON DUPLICATE KEY UPDATE
          role=VALUES(role), birth_date=VALUES(birth_date), phone=VALUES(phone), email=VALUES(email)";

$stmt = $pdo->prepare($sql);
$results = [];

foreach ($rows as $row) {
    $id = substr(md5($tenantId . $row['first_name'] . $row['last_name'] . $row['role']), 0, 20);
    try {
        $stmt->execute([
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':first_name' => trim($row['first_name']),
            ':last_name' => trim($row['last_name']),
            ':role' => $row['role'],
            ':birth_date' => $row['birth_date'],
            ':phone' => $row['phone'] ? (string)$row['phone'] : null,
            ':email' => $row['email'] ? trim($row['email']) : null,
        ]);
        $results[] = ['status' => 'ok', 'name' => $row['first_name'] . ' ' . $row['last_name']];
    }
    catch (PDOException $e) {
        $results[] = ['status' => 'error', 'name' => $row['first_name'] . ' ' . $row['last_name'], 'error' => $e->getMessage()];
    }
}

$total = $pdo->query("SELECT COUNT(*) FROM staff_members WHERE tenant_id=" . $pdo->quote($tenantId))->fetchColumn();

header('Content-Type: application/json');
echo json_encode([
    'tenant_id' => $tenantId,
    'inserted' => count($results),
    'total_in_db' => (int)$total,
    'results' => $results,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);