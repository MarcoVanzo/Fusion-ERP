<?php
/**
 * Website Controller — CRUD Operations for CMS
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Website;

// Shared classes are autoloaded by Composer PSR-4
require_once __DIR__ . '/WebsiteRepository.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class WebsiteController
{
    private WebsiteRepository $repo;

    public function __construct()
    {
        $this->repo = new WebsiteRepository();
    }

    // ─── GET /api/?module=website&action=categories ─────────────────────────
    public function categories(): void
    {
        // Public endpoint allowed or authenticated
        Response::success($this->repo->getCategories());
    }

    // ─── GET /api/?module=website&action=newsList ───────────────────────────
    public function newsList(): void
    {
        // Require auth strictly for admin backend, unless it's a public endpoint check
        // We'll allow auth for internal dashboard first
        Auth::requireRole('operator');

        $limit = (int)(\filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?? 50);
        Response::success($this->repo->getNews(false, $limit));
    }

    // ─── GET /api/?module=website&action=getPublicNews ──────────────────────
    public function getPublicNews(): void
    {
        // NO Auth required. Used by the external website SPA
        $limit = (int)(\filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?? 10);
        Response::success($this->repo->getNews(true, $limit));
    }

    // ─── GET /api/?module=website&action=getArticle&id_or_slug=... ──────────
    public function getArticle(): void
    {
        // NO Auth required for public articles (or check auth if private)
        $idOrSlug = filter_input(INPUT_GET, 'id_or_slug', FILTER_DEFAULT) ?? '';

        if (empty($idOrSlug)) {
            Response::error('Identificativo articolo mancante.', 400);
        }

        $isPublic = !isset($_SESSION['user_id']); // Simple check for guest
        $article = $this->repo->getNewsArticle($idOrSlug, $isPublic);

        if (!$article) {
            Response::error('Articolo non trovato o non pubblicato.', 404);
        }

        Response::success($article);
    }

    // ─── GET /api/?module=website&action=getSitemapUrls ──────────────────────
    // Public endpoint — used by sitemap.php to generate XML sitemap
    public function getSitemapUrls(): void
    {
        $articles = $this->repo->getNews(true, 500); // all published
        $urls = array_map(fn($a) => [
            'slug'        => $a['slug'],
            'published_at' => $a['published_at'],
        ], $articles);
        Response::success($urls);
    }

    // ─── POST /api/?module=website&action=createNews ────────────────────────
    public function createNews(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['title', 'slug', 'category_id']);

        $tenantId = TenantContext::id();
        $dbTenantId = $tenantId === 'TNT_default' ? null : (is_numeric($tenantId) ? (int)$tenantId : $tenantId);

        $excerpt = $body['excerpt'] ?? null;
        $contentHtml = $body['content_html'] ?? null;

        if (empty(trim((string)$excerpt)) && !empty(trim((string)$contentHtml))) {
            $plainText = strip_tags($contentHtml);
            // Decode HTML entities so we count literal characters, then limit to 150
            $plainText = html_entity_decode($plainText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Remove excessive whitespace
            $plainText = preg_replace('/\s+/', ' ', $plainText);
            $excerpt = mb_strlen(trim($plainText)) > 150 ? mb_substr(trim($plainText), 0, 150) . '...' : trim($plainText);
        }

        $data = [
            ':tenant_id' => $dbTenantId,
            ':author_id' => $_SESSION['user_id'] ?? null,
            ':category_id' => $body['category_id'],
            ':title' => trim($body['title']),
            ':slug' => preg_replace('/[^a-z0-9\-]/', '', strtolower(trim($body['slug']))),
            ':cover_image_url' => $body['cover_image_url'] ?? null,
            ':excerpt' => $excerpt,
            ':content_html' => $contentHtml,
            ':is_published' => isset($body['is_published']) ? (int)$body['is_published'] : 0,
            ':published_at' => $body['published_at'] ?? null,
        ];

        try {
            $id = $this->repo->createNews($data);
            Response::success(['id' => $id, 'message' => 'Articolo creato con successo'], 201);
        }
        catch (\PDOException $e) {
            if ($e->getCode() === '23000') { // Integrity constraint violation (e.g. unique slug)
                Response::error('Lo slug fornito è già in uso. Scegline uno diverso.', 409);
            }
            Response::error('Errore durante il salvataggio.', 500);
        }
    }

    // ─── PUT /api/?module=website&action=updateNews ─────────────────────────
    public function updateNews(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'title', 'slug', 'category_id']);

        $id = (int)$body['id'];

        $excerpt = $body['excerpt'] ?? null;
        $contentHtml = $body['content_html'] ?? null;

        if (empty(trim((string)$excerpt)) && !empty(trim((string)$contentHtml))) {
            $plainText = strip_tags($contentHtml);
            $plainText = html_entity_decode($plainText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $plainText = preg_replace('/\s+/', ' ', $plainText);
            $excerpt = mb_strlen(trim($plainText)) > 150 ? mb_substr(trim($plainText), 0, 150) . '...' : trim($plainText);
        }

        // Optional fields check
        $data = [
            ':category_id' => $body['category_id'],
            ':title' => trim($body['title']),
            ':slug' => preg_replace('/[^a-z0-9\-]/', '', strtolower(trim($body['slug']))),
            ':cover_image_url' => $body['cover_image_url'] ?? null,
            ':excerpt' => $excerpt,
            ':content_html' => $contentHtml,
            ':is_published' => isset($body['is_published']) ? (int)$body['is_published'] : 0,
            ':published_at' => $body['published_at'] ?? null,
        ];

        try {
            $success = $this->repo->updateNews($id, $data);
            if ($success) {
                Response::success(['message' => 'Articolo aggiornato con successo']);
            }
            else {
                Response::error('Articolo non trovato o nessun permesso', 404);
            }
        }
        catch (\PDOException $e) {
            if ($e->getCode() === '23000') {
                Response::error('Lo slug fornito è già in uso. Scegline uno diverso.', 409);
            }
            Response::error('Errore durante il salvataggio.', 500);
        }
    }

    // ─── DELETE /api/?module=website&action=deleteNews ──────────────────────
    public function deleteNews(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            Response::error('ID articolo non valido.', 400);
        }

        $before = $this->repo->getNewsArticle((string)$id);
        if (!$before) {
            Response::error('Articolo non trovato.', 404);
        }

        $this->repo->deleteNews($id);
        // Audit::log('DELETE', 'website_news', (string)$id, $before, null); // Assuming Audit class is available
        Response::success(['message' => 'Articolo eliminato con successo']);
    }



    // ─── POST /api/?module=website&action=uploadImage ───────────────────────
    public function uploadImage(): void
    {
        Auth::requireRole('operator');

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Nessun file caricato o errore nel caricamento.', 400);
        }

        $file = $_FILES['image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            Response::error('Formato file non supportato. Usa JPG, PNG o WEBP.', 400);
        }

        // Limit size to 5MB
        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error('Il file è troppo grande. Dimensione massima 5MB.', 400);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('news_cover_') . '.' . $ext;

        $uploadDir = dirname(__DIR__, 3) . '/uploads/website/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . $filename;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            // Return public URL relative to ERP base
            $publicUrl = '/uploads/website/' . $filename;
            Response::success(['url' => $publicUrl]);
        }
        else {
            Response::error('Errore nel salvataggio del file.', 500);
        }
    }

    // ─── POST /api/?module=website&action=subscribeNewsletter ────────────────
    public function subscribeNewsletter(): void
    {
        // Public endpoint allowed (no auth required)
        $body = Response::jsonBody();
        Response::requireFields($body, ['email']);

        $email = filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL);
        if (!$email) {
            Response::error('Indirizzo email non valido.', 400);
        }

        require_once dirname(__DIR__) . '/Newsletter/MailerLiteService.php';
        $mailer = new \FusionERP\Modules\Newsletter\MailerLiteService();

        if (!$mailer->isConfigured()) {
            Response::error('Il servizio newsletter non è momentaneamente disponibile.', 503);
        }

        try {
            // Note: We leave name etc empty for public subscription, they can be updated later
            $result = $mailer->upsertSubscriber($email);
            
            if ($result) {
                Response::success(['message' => 'Iscrizione completata con successo!']);
            } else {
                Response::error('Si è verificato un errore durante l\'iscrizione.', 500);
            }
        } catch (\Throwable $e) {
            error_log('[Newsletter Subscribe] Error: ' . $e->getMessage());
            Response::error('Servizio temporaneamente non disponibile.', 500);
        }
    }

    // ─── GET /api/?module=website&action=getPublicTeams ──────────────────────
    public function getPublicTeams(): void
    {
        // NO Auth required. Used by the external website SPA
        Response::success($this->repo->getPublicTeams());
    }
}
 	