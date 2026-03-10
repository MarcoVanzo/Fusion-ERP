<?php
/**
 * Sitemap XML dinamica — generata lato ERP per accesso diretto al DB
 * URL: https://www.fusionteamvolley.it/ERP/sitemap.php
 * La demo la richiama con redirect o viene indicata nel robots.txt
 */

declare(strict_types=1);

// Carica .env
$envPath = __DIR__ . '/.env';
$db = ['host' => '127.0.0.1', 'port' => '3306', 'name' => '', 'user' => '', 'pass' => ''];

if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line[0] === '#' || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        match (trim($k)) {
            'DB_HOST' => $db['host'] = trim($v),
            'DB_PORT' => $db['port'] = trim($v),
            'DB_NAME' => $db['name'] = trim($v),
            'DB_USER' => $db['user'] = trim($v),
            'DB_PASS' => $db['pass'] = trim($v),
            default   => null,
        };
    }
}

$SITE_BASE = 'https://www.fusionteamvolley.it/demo';

$staticPages = [
    ['loc' => $SITE_BASE . '/',            'priority' => '1.0', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/news',        'priority' => '0.9', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/teams',       'priority' => '0.8', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/results',     'priority' => '0.7', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/shop',        'priority' => '0.6', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/outseason',   'priority' => '0.5', 'changefreq' => 'monthly'],
];

$articleUrls = [];
try {
    $pdo = new PDO(
        "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4",
        $db['user'], $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]
    );
    $stmt = $pdo->query(
        "SELECT slug, published_at FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT 500"
    );
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $slug = htmlspecialchars($row['slug'] ?? '', ENT_XML1, 'UTF-8');
        if (!$slug) continue;
        $articleUrls[] = [
            'loc'        => $SITE_BASE . '/news/' . $slug,
            'lastmod'    => date('Y-m-d', strtotime($row['published_at'])),
            'priority'   => '0.8',
            'changefreq' => 'monthly',
        ];
    }
} catch (Exception $e) {
    // Silently fail — sitemap shows static pages only
}

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$today = date('Y-m-d');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ([...$staticPages, ...$articleUrls] as $url) {
    $lm = $url['lastmod'] ?? $today;
    echo "  <url>\n    <loc>{$url['loc']}</loc>\n    <lastmod>{$lm}</lastmod>\n    <changefreq>{$url['changefreq']}</changefreq>\n    <priority>{$url['priority']}</priority>\n  </url>\n";
}

echo '</urlset>' . "\n";
