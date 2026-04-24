<?php
/**
 * DEBUG TEMPORANEO — Diagnosi documenti atleti
 * DA RIMUOVERE dopo la risoluzione del problema
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;

$db = Database::getInstance();

// 1. Cerchiamo Adele Favaretto nel database
$stmt = $db->prepare("SELECT id, full_name, 
    medical_cert_file_path, contract_file_path, 
    id_doc_front_file_path, id_doc_back_file_path,
    cf_doc_front_file_path, cf_doc_back_file_path,
    photo_release_file_path, privacy_policy_file_path,
    guesthouse_rules_file_path, guesthouse_delegate_file_path,
    health_card_file_path
    FROM athletes WHERE full_name LIKE :name LIMIT 5");
$stmt->execute([':name' => '%Favaretto%']);
$athletes = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [
    'athletes_found' => count($athletes),
    'athletes' => [],
    'server_info' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'N/A',
        'dirname_3' => dirname(__DIR__, 2),
        'upload_storage_path' => getenv('UPLOAD_STORAGE_PATH') ?: 'NOT SET',
        'cwd' => getcwd(),
    ],
    'directory_listing' => [],
];

// 2. Per ogni atleta trovato, controlliamo i file
foreach ($athletes as $athlete) {
    $athleteDebug = [
        'id' => $athlete['id'],
        'full_name' => $athlete['full_name'],
        'documents' => [],
    ];

    $docFields = [
        'medical_cert_file_path', 'contract_file_path',
        'id_doc_front_file_path', 'id_doc_back_file_path',
        'cf_doc_front_file_path', 'cf_doc_back_file_path',
        'photo_release_file_path', 'privacy_policy_file_path',
        'guesthouse_rules_file_path', 'guesthouse_delegate_file_path',
        'health_card_file_path'
    ];

    foreach ($docFields as $field) {
        $dbValue = $athlete[$field] ?? null;
        if (empty($dbValue)) continue;

        // Percorso standard (come lo calcola downloadDoc)
        $standardPath = dirname(__DIR__, 2) . '/' . $dbValue;
        // Percorso alternativo con dirname(__DIR__, 3) come nel codice attuale
        $altPath3 = dirname(__DIR__, 3) . '/' . $dbValue;
        // Fallback UPLOAD_STORAGE_PATH
        $uploadPath = rtrim(getenv('UPLOAD_STORAGE_PATH') ?: '', '/') . '/' . basename($dbValue);

        $athleteDebug['documents'][$field] = [
            'db_value' => $dbValue,
            'standard_path_exists' => file_exists($standardPath) ? 'YES' : 'NO (' . $standardPath . ')',
            'alt_path3_exists' => file_exists($altPath3) ? 'YES' : 'NO (' . $altPath3 . ')',
            'upload_path_exists' => file_exists($uploadPath) ? 'YES' : 'NO (' . $uploadPath . ')',
        ];
    }

    $result['athletes'][] = $athleteDebug;
}

// 3. Elenchiamo le directory di storage per capire dove sono i file
$dirs = [
    dirname(__DIR__, 2) . '/storage/docs/athletes',
    dirname(__DIR__, 3) . '/storage/docs/athletes',
    dirname(__DIR__, 2) . '/storage/uploads',
    dirname(__DIR__, 3) . '/storage/uploads',
];

foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $files = array_slice(scandir($dir), 0, 20); // max 20 file
        $result['directory_listing'][$dir] = $files;
    } else {
        $result['directory_listing'][$dir] = 'DIRECTORY NOT FOUND';
    }
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
