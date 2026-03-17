<?php
$url = 'https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
$html = curl_exec($ch);
curl_close($ch);

$dom = new \DOMDocument();
libxml_use_internal_errors(true);
$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
libxml_clear_errors();
$xpath = new \DOMXPath($dom);

$matches = [];
$rows = $xpath->query('//table[contains(@class, "tbl-risultati")]//tr[td]');
if (!$rows) {
    echo "No rows found in table.\n";
} else {
    foreach ($rows as $row) {
        $cells = $xpath->query('td', $row);
        if (!$cells || $cells->length < 5) continue;

        $texts = [];
        foreach ($cells as $cell) {
            $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));
        }

        $home = $texts[3] ?? '';
        $away = $texts[4] ?? '';
        if (strlen($home) < 3 || strlen($away) < 3 || preg_match('/^\d+$/', $home)) continue;

        $match = [
            'id' => trim($texts[0] ?? ''), 'date' => null, 'time' => null,
            'home' => $home, 'away' => $away,
            'score' => null, 'sets_home' => null, 'sets_away' => null,
            'status' => 'scheduled', 'round' => null, 'is_our_team' => false,
        ];

        if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{2,4})/', $texts[2] ?? '', $md))
            $match['date'] = $md[1];
        if (preg_match('/(\d{1,2}:\d{2})/', $texts[2] ?? '', $mt))
            $match['time'] = $mt[1];
        if (preg_match('/\b(\d+)\b/', $texts[1] ?? '', $mr))
            $match['round'] = (int)$mr[1];

        if (preg_match('/\b([0-3])\s*[-–]\s*([0-3])\b/', $texts[5] ?? '', $ms)) {
            $match['sets_home'] = (int)$ms[1];
            $match['sets_away'] = (int)$ms[2];
            $match['score'] = $ms[1] . ' - ' . $ms[2];
            $match['status'] = 'played';
        }

        $matches[] = $match;
        echo "Parsed match: Round {$match['round']}, {$match['date']} {$match['time']}, {$match['home']} vs {$match['away']} -> {$match['score']}\n";
    }
    echo "\nTotal matches found: " . count($matches) . "\n";
}
