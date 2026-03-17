<?php
$url = 'https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA';
$headers = [
    'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'X-Forwarded-For: 8.8.8.8',
    'X-Real-IP: 8.8.8.8',
    'Accept-Language: it-IT,it;q=0.9',
    'Accept: text/html,application/xhtml+xml,application/xml',
    'Connection: keep-alive',
];
$opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    CURLOPT_HTTPHEADER => $headers
];

$ch = curl_init($url);
curl_setopt_array($ch, $opts);
$htmlDirect = curl_exec($ch);
$codeDirect = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');
echo json_encode([
    'code' => $codeDirect,
    'length' => strlen((string)$htmlDirect),
    'snippet' => substr(strip_tags((string)$htmlDirect), 0, 200)
]);
