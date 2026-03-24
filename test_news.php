<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Website/WebsiteRepository.php';

use FusionERP\Modules\Website\WebsiteRepository;

$repo = new WebsiteRepository();
try {
    $repo->createNews([
        ':tenant_id' => 1,
        ':author_id' => 1,
        ':category_id' => 1,
        ':title' => 'Test',
        ':slug' => 'test-' . time(),
        ':cover_image_url' => null,
        ':excerpt' => 'Test',
        ':content_html' => 'Test',
        ':is_published' => 1,
        ':published_at' => date('Y-m-d H:i:s')
    ]);
    echo "Success\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
