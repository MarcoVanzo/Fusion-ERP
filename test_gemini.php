<?php
$apiKey = 'AIzaSyDrQyhRHRgkuKUZiCcihTAwKXy4JMOUzUk';

$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

$prompt = "Sei un esperto di logistica e trasporti sportivi. Analizza il seguente percorso...\n\n";
$prompt .= "1. Suggerisci tappe di raccolta strategiche per raggruppare le atlete...\n";
$prompt .= "2. Evidenzia atlete che abitano fuori rotta e suggerisci soluzioni...\n";
$prompt .= "3. Stima il risparmio in tempo e km se si applicano i tuoi suggerimenti.\n\n";

$prompt .= "DATI DEL TRASPORTO:\n";
$prompt .= "- Destinazione: Palaverde\n";
$prompt .= "- Tappe attuali:\n";
$prompt .= "Tappa 0: [raccolta] Vidor — ore 14:00 — Raccolta Alice\n";
$prompt .= "Tappa 1: [raccolta] Venezia — ore 15:30 — Raccolta Beatrice\n";

$prompt .= "\nFORMATO DI RISPOSTA RICHIESTO (JSON):\n";
$prompt .= "{\n";
$prompt .= '  "consigli": "Testo descrittivo",';
$prompt .= '  "punti_raccolta": [ { "nome": "Punto X", "indirizzo": "Via Y", "atlete": ["Alice"], "motivo": "Ottimale per snodo" } ],';
$prompt .= '  "fuori_percorso": [ { "nome": "Beatrice", "motivo": "Troppo distante" } ],';
$prompt .= '  "risparmio_stimato": "Circa X min e Y km"';
$prompt .= "\n}\n";

$payload = json_encode([
    'contents' => [['parts' => [['text' => $prompt]]]],
    'generationConfig' => [
        'maxOutputTokens'  => 8192,
        'temperature'      => 0.3,
        // 'responseMimeType' => 'application/json',
    ],
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => $payload,
]);

$response = curl_exec($ch);
curl_close($ch);

$responseData = json_decode($response, true);
$text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
echo "RAW TEXT:\n" . $text . "\n";

if (preg_match('/\{[\s\S]*\}/', $text, $matches)) {
    $text = $matches[0];
}

$decoded = json_decode($text, true);
echo "JSON DECODE ERROR: " . json_last_error_msg() . "\n";
if ($decoded) echo "DECODE SUCCESS!\n";
else echo "DECODE FAILED!\n";
