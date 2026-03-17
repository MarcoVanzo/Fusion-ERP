<?php
spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'FusionERP\\')) {
        require_once __DIR__ . '/'.str_replace('\\', '/', substr($class, 10)) . '.php';
    }
});
$rc = new \FusionERP\Modules\Results\ResultsController();
$ref = new ReflectionMethod($rc, '_fetch');
$ref->setAccessible(true);
$err = '';
$url = 'https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA';
$html = $ref->invoke($rc, $url, $err);

if (!$html) {
    echo "Fetch failed: $err\n";
    exit;
}
echo "HTML length: ".strlen($html)."\n";

$refParse = new ReflectionMethod($rc, '_parseMatchesFipavVeneto');
$refParse->setAccessible(true);
$matches = $refParse->invoke($rc, $html);
echo "Matches count: ".count($matches)."\n";
print_r(array_slice($matches, 0, 3));
