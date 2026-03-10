<?php
/**
 * Sitemap XML dinamica — fusionteamvolley.it/demo/sitemap.xml
 * Legge gli articoli pubblicati dall'ERP e genera un sitemap XML completo.
 */

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$SITE_BASE = 'https://www.fusionteamvolley.it/demo';
$ERP_API   = 'https://www.fusionteamvolley.it/ERP/api/router.php';

// Pagine statiche
$staticPages = [
    ['loc' => $SITE_BASE . '/',            'priority' => '1.0', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/news',        'priority' => '0.9', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/teams',       'priority' => '0.8', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/results',     'priority' => '0.7', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/shop',        'priority' => '0.6', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/outseason',   'priority' => '0.5', 'changefreq' => 'monthly'],
];

// Articoli dinamici dall'ERP
$articleUrls = [];
$context = stream_context_create(['http' => ['timeout' => 5]]);
$response = @file_get_contents("{$ERP_API}?module=website&action=getSitemapUrls", false, $context);

if ($response !== false) {
    $data = json_decode($response, true);
    if (isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $article) {
            $slug    = htmlspecialchars($article['slug'] ?? '', ENT_XML1);
            $lastmod = date('Y-m-d', strtotime($article['published_at'] ?? 'now'));
            if (!$slug) continue;
            $articleUrls[] = [
                'loc'        => $SITE_BASE . '/news/' . $slug,
                'lastmod'    => $lastmod,
                'priority'   => '0.8',
                'changefreq' => 'monthly',
            ];
        }
    }
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

$today = date('Y-m-d');

foreach ($staticPages as $page) {
    echo "  <url>\n";
    echo "    <loc>{$page['loc']}</loc>\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>{$page['changefreq']}</changefreq>\n";
    echo "    <priority>{$page['priority']}</priority>\n";
    echo "  </url>\n";
}

foreach ($articleUrls as $url) {
    echo "  <url>\n";
    echo "    <loc>{$url['loc']}</loc>\n";
    echo "    <lastmod>{$url['lastmod']}</lastmod>\n";
    echo "    <changefreq>{$url['changefreq']}</changefreq>\n";
    echo "    <priority>{$url['priority']}</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>' . "\n";
