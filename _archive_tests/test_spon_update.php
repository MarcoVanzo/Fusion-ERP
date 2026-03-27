<?php
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();

    // Prepare exactly as Repository does
    $stmt = $db->prepare(
        'UPDATE societa_sponsors SET
            name             = :name,
            tipo             = :tipo,
            stagione         = :stagione,
            description      = :description,
            logo_path        = :logo_path,
            website_url      = :website_url,
            instagram_url    = :instagram_url,
            facebook_url     = :facebook_url,
            linkedin_url     = :linkedin_url,
            tiktok_url       = :tiktok_url,
            importo          = :importo,
            rapporto         = :rapporto,
            sponsorizzazione = :sponsorizzazione,
            sort_order       = :sort_order,
            is_active        = :is_active
         WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
    );

    // Mock Payload
    $data = [
        ':name'           => 'Test Sponsor',
        ':tipo'           => 'Sponsor',
        ':stagione'       => '2023/2024',
        ':description'    => null,
        ':logo_path'      => null,
        ':website_url'    => null,
        ':instagram_url'  => null,
        ':facebook_url'   => null,
        ':linkedin_url'   => null,
        ':tiktok_url'     => null,
        ':importo'        => null,
        ':rapporto'       => null,
        ':sponsorizzazione'=> null,
        ':sort_order'     => 0,
        ':is_active'      => 1,
    ];

    $merged = array_merge($data, [':id' => 'DOES_NOT_MATTER', ':tid' => 'TNT_default']);
    $stmt->execute($merged);

    echo "Success!\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
