<?php
// DIAGNOSTIC — DELETE AFTER USE
header('Content-Type: text/plain; charset=utf-8');
error_reporting(E_ALL); ini_set('display_errors',1);

foreach (file(__DIR__.'/.env', FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) as $line) {
    if (!$line || $line[0]==='#' || !str_contains($line,'=')) continue;
    [$k,$v] = explode('=',$line,2);
    $_ENV[trim($k)] = trim($v," \t\n\r\0\x0B\"'");
}
$apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
echo "API Key: " . (empty($apiKey)?'MISSING':substr($apiKey,0,10).'...') . "\n\n";

$prompt = "Rispondi SOLO con un JSON valido: {\"diagnosis\":\"test ok\",\"plan\":\"piano ok\"}";
$payload = json_encode(['contents'=>[['parts'=>[['text'=>$prompt]]]],'generationConfig'=>['maxOutputTokens'=>100,'temperature'=>0]]);
$ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}");
curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$payload,CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_TIMEOUT=>20]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch,CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $code\n\n";
$data = json_decode($resp,true);
$text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'NO TEXT';
echo "RAW TEXT (repr):\n";
// Show exact bytes including control chars
echo bin2hex(substr($text,0,200))."\n\n";
echo "PLAIN:\n$text\n\n";
// Try json_decode
$flat = str_replace(["\r\n","\r","\n"],' ',$text);
$parsed = json_decode($flat,true);
echo "json_decode flat: ".($parsed?'OK':'FAIL')."\n";
if ($parsed) echo "diagnosis: ".$parsed['diagnosis']."\n";
// json_last_error
echo "json_last_error: ".json_last_error_msg()."\n";
