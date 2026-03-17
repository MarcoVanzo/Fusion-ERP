<?php
spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'FusionERP\\')) {
        require_once __DIR__ . '/'.str_replace('\\', '/', substr($class, 10)) . '.php';
    }
});
$rc = new \FusionERP\Modules\Results\ResultsController();
$ref = new ReflectionMethod($rc, '_getStandingsUrlCandidates');
$ref->setAccessible(true);
$url = 'https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA';
$candidates = $ref->invoke($rc, $url);
print_r($candidates);

$refFetch = new ReflectionMethod($rc, '_fetch');
$refFetch->setAccessible(true);

$refParse = new ReflectionMethod($rc, '_parseStandingsFipavVeneto');
$refParse->setAccessible(true);
$refParseOld = new ReflectionMethod($rc, '_parseStandings');
$refParseOld->setAccessible(true);

$err = '';
foreach ($candidates as $cand) {
    echo "Trying: $cand\n";
    $html = $refFetch->invoke($rc, $cand, $err);
    if ($html) {
        $parsed = str_contains($cand, 'fipavveneto.net') ? $refParse->invoke($rc, $html) : $refParseOld->invoke($rc, $html);
        echo "Found " . count($parsed) . " entries in $cand\n";
        if (!empty($parsed)) {
            print_r($parsed);
            break;
        }
    } else {
        echo "Fetch failed: $err\n";
    }
}
