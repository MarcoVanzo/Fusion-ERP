<?php
/**
 * Website Repository — Database operations for CMS module
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Website;

$_websiteShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_websiteShared . 'Database.php';
require_once $_websiteShared . 'TenantContext.php';
unset($_websiteShared);

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use Exception;
use PDO;

class WebsiteRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all categories
     */
    public function getCategories(): array
    {
        $stmt = $this->db->query("SELECT id, name, slug, color_hex FROM website_categories ORDER BY name ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get news for current tenant
     */
    public function getNews(bool $publicOnly = false, int $limit = 50): array
    {
        $tenantId = TenantContext::id();
        $dbTenantId = $tenantId === 'TNT_default' ? null : (is_numeric($tenantId) ? (int)$tenantId : $tenantId);
        $params = [];

        $sql = "
            SELECT n.id, n.title, n.slug, n.cover_image_url, n.excerpt, 
                   n.is_published, n.published_at, n.created_at,
                   c.name as category_name, c.color_hex
            FROM website_news n
            LEFT JOIN website_categories c ON n.category_id = c.id
            WHERE 1=1
        ";

        if ($dbTenantId !== null) {
            $sql .= " AND (n.tenant_id = :tenant_id OR n.tenant_id IS NULL)";
            $params[':tenant_id'] = $dbTenantId;
        }

        if ($publicOnly) {
            $sql .= " AND n.is_published = 1 AND n.published_at <= NOW()";
        }

        $sql .= " ORDER BY COALESCE(n.published_at, n.created_at) DESC LIMIT " . (int)$limit;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get single news article by ID or slug
     */
    public function getNewsArticle(string $identifier, bool $publicOnly = false): ?array
    {
        $tenantId = TenantContext::id();
        $dbTenantId = $tenantId === 'TNT_default' ? null : (is_numeric($tenantId) ? (int)$tenantId : $tenantId);
        $params = [];
        $isNumeric = is_numeric($identifier);

        $sql = "
            SELECT n.*, c.name as category_name, c.color_hex, c.slug as category_slug
            FROM website_news n
            LEFT JOIN website_categories c ON n.category_id = c.id
            WHERE " . ($isNumeric ? "n.id = :id" : "n.slug = :slug");

        $params[$isNumeric ? ':id' : ':slug'] = $identifier;

        if ($dbTenantId !== null) {
            $sql .= " AND (n.tenant_id = :tenant_id OR n.tenant_id IS NULL)";
            $params[':tenant_id'] = $dbTenantId;
        }

        if ($publicOnly) {
            $sql .= " AND n.is_published = 1 AND n.published_at <= NOW()";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Create news article
     */
    public function createNews(array $data): int
    {
        $sql = "
            INSERT INTO website_news 
            (tenant_id, author_id, category_id, title, slug, cover_image_url, excerpt, content_html, is_published, published_at)
            VALUES 
            (:tenant_id, :author_id, :category_id, :title, :slug, :cover_image_url, :excerpt, :content_html, :is_published, :published_at)
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Update news article
     */
    public function updateNews(int $id, array $data): bool
    {
        $tenantId = TenantContext::id();
        $dbTenantId = $tenantId === 'TNT_default' ? null : (is_numeric($tenantId) ? (int)$tenantId : $tenantId);

        $sql = "
            UPDATE website_news 
            SET category_id = :category_id, 
                title = :title, 
                slug = :slug,
                cover_image_url = :cover_image_url, 
                excerpt = :excerpt, 
                content_html = :content_html, 
                is_published = :is_published, 
                published_at = :published_at
            WHERE id = :id AND (tenant_id = :tenant_id OR tenant_id IS NULL)
        ";

        $data[':id'] = $id;
        $data[':tenant_id'] = $dbTenantId;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    /**
     * Delete news article
     */
    public function deleteNews(int $id): bool
    {
        $tenantId = TenantContext::id();
        $dbTenantId = $tenantId === 'TNT_default' ? null : (is_numeric($tenantId) ? (int)$tenantId : $tenantId);
        $sql = "DELETE FROM website_news WHERE id = :id AND (tenant_id = :tenant_id OR tenant_id IS NULL)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id, ':tenant_id' => $dbTenantId]);
    }

    /**
     * Get sports teams for the public website
     */
    public function getPublicTeams(): array
    {
        $stmt = $this->db->prepare(
            'SELECT ts.id AS id, t.name, t.category, t.color_hex, ts.season
             FROM team_seasons ts
             JOIN teams t ON ts.team_id = t.id
             WHERE t.deleted_at IS NULL AND t.is_active = 1
             ORDER BY ts.season DESC, t.category, t.name'
        );
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
 	