<?php
$url = 'https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA';
$opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
];

// Direct
$ch = curl_init($url);
curl_setopt_array($ch, $opts);
$htmlDirect = curl_exec($ch);
$codeDirect = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// GAS Proxy
$proxyUrl = 'https://script.google.com/macros/s/AKfycbzWEVIrWNDnKqP7U5lrL5pM2EMK_UuPMJoJHi5RIpnhJrx-r04MmWYixQoxV6TaAIU/exec?url=' . urlencode($url);
$ch2 = curl_init($proxyUrl);
curl_setopt_array($ch2, $opts);
$htmlProxy = curl_exec($ch2);
$codeProxy = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

header('Content-Type: application/json');
echo json_encode([
    'direct' => [
        'code' => $codeDirect,
        'length' => strlen((string)$htmlDirect),
        'snippet' => substr(strip_tags((string)$htmlDirect), 0, 200)
    ],
    'proxy' => [
        'code' => $codeProxy,
        'length' => strlen((string)$htmlProxy),
        'snippet' => substr(strip_tags((string)$htmlProxy), 0, 200)
    ]
]);
