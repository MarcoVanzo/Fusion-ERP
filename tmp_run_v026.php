<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

$sql = file_get_contents(__DIR__ . '/db/migrations/V026__website_cms.sql');

try {
    $db = new PDO(
        "mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4",
        $_ENV['DB_USER'], $_ENV['DB_PASS']
        );
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec($sql);
    echo "Migrazione V026 applicata con successo.\n";

    // Inseriamo un articolo di prova finto
    $stmt = $db->prepare("INSERT IGNORE INTO website_news (category_id, title, slug, excerpt, content_html, is_published, published_at) VALUES (1, 'Vittoria clamorosa!', 'vittoria-clamorosa', 'Un 3-0 che fa sognare', '<p>Testo articolo</p>', 1, NOW())");
    $stmt->execute();

    echo "Record di test inserito.\n";
}
catch (Exception $e) {
    echo "Errore: " . $e->getMessage() . "\n";
}