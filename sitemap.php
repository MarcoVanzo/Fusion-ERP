<?php
/**
 * Sitemap XML dinamica — Fusion Team Volley
 * Parte dell'ERP per accesso diretto al DB.
 * URL: https://www.fusionteamvolley.it/ERP/sitemap.php
 */

declare(strict_types=1);

// Load .env into $_ENV / getenv() — same method used by ERP bootstrap
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// Bootstrap ERP shared classes (Database singleton)
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

$SITE_BASE = 'https://www.fusionteamvolley.it/demo';

$staticPages = [
    ['loc' => $SITE_BASE . '/',          'priority' => '1.0', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/news',      'priority' => '0.9', 'changefreq' => 'daily'],
    ['loc' => $SITE_BASE . '/teams',     'priority' => '0.8', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/results',   'priority' => '0.7', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/shop',      'priority' => '0.6', 'changefreq' => 'weekly'],
    ['loc' => $SITE_BASE . '/outseason', 'priority' => '0.5', 'changefreq' => 'monthly'],
];

$articleUrls = [];
try {
    $pdo  = Database::getInstance();
    $stmt = $pdo->query(
        "SELECT slug, published_at
         FROM website_news
         WHERE is_published = 1 AND published_at <= NOW()
         ORDER BY published_at DESC
         LIMIT 500"
    );
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $slug = htmlspecialchars($row['slug'] ?? '', ENT_XML1, 'UTF-8');
        if (!$slug) continue;
        $articleUrls[] = [
            'loc'        => $SITE_BASE . '/news/' . $slug,
            'lastmod'    => date('Y-m-d', strtotime($row['published_at'])),
            'priority'   => '0.8',
            'changefreq' => 'monthly',
        ];
    }
} catch (Throwable $e) {
    error_log('[Sitemap] DB error: ' . $e->getMessage());
}

// Output
header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$today = date('Y-m-d');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ([...$staticPages, ...$articleUrls] as $url) {
    $lm = $url['lastmod'] ?? $today;
    echo "  <url>\n";
    echo "    <loc>{$url['loc']}</loc>\n";
    echo "    <lastmod>{$lm}</lastmod>\n";
    echo "    <changefreq>{$url['changefreq']}</changefreq>\n";
    echo "    <priority>{$url['priority']}</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>' . "\n";
