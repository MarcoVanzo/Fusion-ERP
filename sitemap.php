<?php
/**
 * Sitemap XML dinamica — Fusion Team Volley
 * Chiama l'API ERP via localhost per ottenere gli articoli.
 * URL: https://www.fusionteamvolley.it/ERP/sitemap.php
 */

$SITE_BASE = 'https://www.fusionteamvolley.it';

$staticPages = [
    ['loc' => $SITE_BASE . '/',          'lastmod' => date('Y-m-d'), 'priority' => '1.0', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/news',      'lastmod' => date('Y-m-d'), 'priority' => '0.9', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/teams',     'lastmod' => date('Y-m-d'), 'priority' => '0.8', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/results',   'lastmod' => date('Y-m-d'), 'priority' => '0.7', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/shop',      'lastmod' => date('Y-m-d'), 'priority' => '0.6', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/outseason', 'lastmod' => date('Y-m-d'), 'priority' => '0.5', 'changefreq' => 'monthly'],
    ['loc' => $SITE_BASE . '/club',      'lastmod' => date('Y-m-d'), 'priority' => '0.7', 'changefreq' => 'monthly'],
    ['loc' => $SITE_BASE . '/foresteria','lastmod' => date('Y-m-d'), 'priority' => '0.7', 'changefreq' => 'monthly'],
    ['loc' => $SITE_BASE . '/network',   'lastmod' => date('Y-m-d'), 'priority' => '0.6', 'changefreq' => 'monthly'],
    ['loc' => $SITE_BASE . '/sponsors',  'lastmod' => date('Y-m-d'), 'priority' => '0.6', 'changefreq' => 'monthly'],
];

$articleUrls = [];
$teamUrls = [];

// Prova più endpoint: localhost (bypass firewall), IP dello stesso server, e URL pubblico
$endpoints = [
    'http://localhost/ERP/api/router.php?module=website&action=getSitemapUrls',
    'http://127.0.0.1/ERP/api/router.php?module=website&action=getSitemapUrls',
    'https://www.fusionteamvolley.it/ERP/api/router.php?module=website&action=getSitemapUrls',
];

$body = false;
foreach ($endpoints as $apiUrl) {
    if (function_exists('curl_init')) {
        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT      => 'FusionSitemap/1.0',
            CURLOPT_HTTPHEADER     => ['Host: www.fusionteamvolley.it'],
        ]);
        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body && $httpCode === 200) break;
        $body = false;
    }
}

if ($body) {
    $data = json_decode($body, true);
    if (isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $article) {
            $slug = htmlspecialchars($article['slug'] ?? '', ENT_XML1, 'UTF-8');
            if (!$slug) continue;
            $articleUrls[] = [
                'loc'        => $SITE_BASE . '/news/' . $slug,
                'lastmod'    => date('Y-m-d', strtotime($article['published_at'] ?? 'now')),
                'priority'   => '0.8',
                'changefreq' => 'monthly',
            ];
        }
    }
}

// FETCH TEAMS
$teamEndpoints = [
    'http://localhost/ERP/api/router.php?module=athletes&action=getPublicTeams',
    'http://127.0.0.1/ERP/api/router.php?module=athletes&action=getPublicTeams',
    'https://www.fusionteamvolley.it/ERP/api/router.php?module=athletes&action=getPublicTeams',
];

$teamBody = false;
foreach ($teamEndpoints as $apiUrl) {
    if (function_exists('curl_init')) {
        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT      => 'FusionSitemap/1.0',
            CURLOPT_HTTPHEADER     => ['Host: www.fusionteamvolley.it'],
        ]);
        $teamBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($teamBody && $httpCode === 200) break;
        $teamBody = false;
    }
}

if ($teamBody) {
    $data = json_decode($teamBody, true);
    if (isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $team) {
            $id = $team['id'] ?? '';
            if (!$id) continue;
            $teamUrls[] = [
                'loc'        => $SITE_BASE . '/teams/' . $id,
                'lastmod'    => date('Y-m-d'), // Teams usually don't have published_at
                'priority'   => '0.7',
                'changefreq' => 'weekly',
            ];
        }
    }
}

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ([...$staticPages, ...$articleUrls, ...$teamUrls] as $url) {
    echo "  <url>\n";
    echo "    <loc>{$url['loc']}</loc>\n";
    echo "    <lastmod>{$url['lastmod']}</lastmod>\n";
    echo "    <changefreq>{$url['changefreq']}</changefreq>\n";
    echo "    <priority>{$url['priority']}</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>' . "\n";
