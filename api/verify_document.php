<?php
/**
 * Fusion ERP — Standalone Document Verification Endpoint
 * Validates uploaded documents (ID, Health Card, Medical, Contract) via Gemini AI.
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

// Global Error Handler for JSON responses
set_exception_handler(function(\Throwable $e) {
    $errMsg = '[VERIFY AI FATAL] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    error_log($errMsg);
    if (!empty($_ENV['APP_DEBUG']) || getenv('APP_DEBUG') === 'true') {
        file_put_contents(__DIR__ . '/../local_debug_error.log', date('Y-m-d H:i:s') . ' ' . $errMsg . PHP_EOL, FILE_APPEND);
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => false, 'error' => 'Errore interno API Verifica.']);
    exit;
});

Auth::startSession();
Response::setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Solo POST consentito', 405);
}

Auth::requireAuth(); // Must be logged in

$input = json_decode(file_get_contents('php://input'), true) ?: [];

$imageBase64 = $input['image'] ?? '';
$docType = $input['document_type'] ?? '';
$side = $input['side'] ?? 'fronte';

if (empty($imageBase64)) {
    Response::error('Immagine mancante', 400);
}
if (!in_array($docType, ['carta_identita', 'tessera_sanitaria', 'certificato_medico', 'contratto'])) {
    Response::error('Tipo documento non valido', 400);
}
if (!in_array($side, ['fronte', 'retro'])) {
    Response::error('Lato non valido', 400);
}

$geminiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
if (empty($geminiKey)) {
    // If no key, skip verification successfully so upload isn't blocked completely
    echo json_encode([
        'success' => true,
        'data' => [
            'verified' => true,
            'message' => 'Verifica AI saltata (chiave non configurata).'
        ]
    ]);
    exit;
}

// Clean Base64 format if header exists
$rawBase64 = $imageBase64;
$mimeType = 'image/jpeg';
if (str_contains($imageBase64, ',')) {
    $parts = explode(',', $imageBase64, 2);
    $rawBase64 = $parts[1];
    if (preg_match('/data:([^;]+);/', $parts[0], $mimeMatch)) {
        $mimeType = $mimeMatch[1];
    }
}
if ($mimeType === 'application/pdf') {
    // Gemini vision handles images, not pure base64 PDFs directly encoded this way in 2.5 flash unless specifically requested
    // Wait, gemini 2.5 flash supports PDF via inlineData if application/pdf. 
    // We will pass it normally.
}

$docTypeLabels = [
    'carta_identita' => "Carta d'Identità",
    'tessera_sanitaria' => "Tessera Sanitaria / Codice Fiscale",
    'certificato_medico' => "Certificato Medico Sportivo",
    'contratto' => "Documento Tesseramento / Modulo della Federazione",
];
$docTypeLabel = $docTypeLabels[$docType] ?? 'Documento';

$prompt = "Sei un ispettore documentale esperto. Analizza questa immagine che dovrebbe essere: {$docTypeLabel} (lato {$side}). "
    . "1. Verifica se l'immagine sembra un documento autentico e genuino. Se non è un documento (es. è un selfie o uno schermo nero), metti verified a false. "
    . "2. Controlla che sia effettivamente: {$docTypeLabel}. Se è palesemente un altro documento (es. patente di guida invece di carta d'identità), setta document_type_match a false. "
    . "3. Verifica che il lato corrisponda a: {$side}. (Se è un documento di una pagina come un certificato, consideralo sempre come fronte corretto, ma se è una carta d'identità retro invece che fronte, mettilo false). Se è il lato sbagliato, imposta document_side_match a false. "
    . "Rispondi ESCLUSIVAMENTE con un JSON con questa struttura esatta: "
    . '{"verified": true/false, "authenticity": 0.95, "document_type_detected": "BREVE_NOME_DOCUMENTO_RILEVATO", "document_type_match": true/false, "document_side_match": true/false, "message": "Breve commento esplicativo in italiano"}';

$responseSchema = [
    'type' => 'object',
    'properties' => [
        'verified' => ['type' => 'boolean'],
        'authenticity' => ['type' => 'number'],
        'document_type_detected' => ['type' => 'string'],
        'document_type_match' => ['type' => 'boolean'],
        'document_side_match' => ['type' => 'boolean'],
        'message' => ['type' => 'string'],
    ],
    'required' => ['verified', 'document_type_detected', 'document_type_match', 'document_side_match', 'message']
];

$requestBody = json_encode([
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => $mimeType, 'data' => $rawBase64]]
        ]
    ]],
    'generationConfig' => [
        'temperature' => 0.1,
        'responseMimeType' => 'application/json',
        'responseSchema' => $responseSchema
    ]
]);

$models = ['gemini-2.5-flash', 'gemini-2.5-pro'];
$response = '';
$httpCode = 0;

$caBundle = dirname(__DIR__) . '/api/Modules/Shared/cacert.pem'; // In Fusion ERP
$sslVerify = file_exists($caBundle);

foreach ($models as $idx => $mdl) {
    $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/{$mdl}:generateContent?key={$geminiKey}");
    $curlOpts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $requestBody,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => $sslVerify,
        CURLOPT_SSL_VERIFYHOST => 2,
    ];
    if ($sslVerify) {
        $curlOpts[CURLOPT_CAINFO] = $caBundle;
    }
    curl_setopt_array($ch, $curlOpts);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    @curl_close($ch);

    if ($httpCode === 200) {
        break;
    }
    if ($idx < count($models) - 1) {
        usleep(1000000); // 1s cooldown
    }
}

if ($httpCode !== 200) {
    // AI failed, skip verification to avoid blocking the user
    echo json_encode([
        'success' => true,
        'data' => [
            'verified' => true,
            'message' => 'Verifica AI saltata (servizio non disponibile).'
        ]
    ]);
    exit;
}

$data = json_decode($response, true);
$rawText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
$rawText = trim(preg_replace(['/^```json\s*/i', '/^```\s*/i', '/\s*```$/i'], '', $rawText));

$aiResult = json_decode($rawText, true);

if (!$aiResult || !isset($aiResult['verified'])) {
    Response::error('Risposta AI non valida.');
}

$verified = $aiResult['verified'] ?? false;
$typeMatch = $aiResult['document_type_match'] ?? false;
$sideMatch = $aiResult['document_side_match'] ?? true; 
$message = $aiResult['message'] ?? 'Esito AI mancante.';

if ($verified && !$typeMatch) {
    $verified = false;
    $message = "Il documento caricato non è valido. Atteso: $docTypeLabel. Rilevato: " . ($aiResult['document_type_detected'] ?? 'Sconosciuto');
}

if ($verified && !$sideMatch) {
    $verified = false;
    $message = "Errore: hai caricato il lato errato del documento. Era richiesto il lato: " . strtoupper($side) . ".";
}

echo json_encode([
    'success' => true,
    'data' => [
        'verified' => $verified,
        'message' => $message,
        'raw_ai' => $aiResult
    ]
]);
