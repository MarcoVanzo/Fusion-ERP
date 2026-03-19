<?php
/**
 * NewsletterController — MailerLite integration endpoints
 * Fusion ERP v1.0
 *
 * Endpoints (all via ?module=newsletter&action=…):
 *   getStats / listSubscribers / upsertSubscriber / deleteSubscriber
 *   listGroups / createGroup / deleteGroup
 *   assignToGroup / unassignFromGroup / exportCsv / getConfig
 */

declare(strict_types=1);

namespace FusionERP\Modules\Newsletter;

$_nlShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_nlShared . 'Auth.php';
require_once $_nlShared . 'Audit.php';
require_once $_nlShared . 'Response.php';
require_once $_nlShared . 'TenantContext.php';
unset($_nlShared);
require_once __DIR__ . '/MailerLiteService.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class NewsletterController
{
    private MailerLiteService $ml;

    public function __construct()
    {
        $this->ml = new MailerLiteService();
    }

    // ─── CONFIG CHECK ─────────────────────────────────────────────────────────

    /**
     * Returns whether MailerLite is configured (non-sensitive).
     */
    public function getConfig(): void
    {
        Auth::requireRole('operator');
        Response::success([
            'configured' => $this->ml->isConfigured(),
        ]);
    }

    // ─── STATS ────────────────────────────────────────────────────────────────

    public function getStats(): void
    {
        Auth::requireRole('operator');
        Response::success($this->ml->getStats());
    }

    // ─── CAMPAIGNS ────────────────────────────────────────────────────────────

    public function listCampaigns(): void
    {
        Auth::requireRole('operator');

        $limit = (int)(filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?? 10);
        Response::success($this->ml->listCampaigns($limit));
    }

    // ─── SUBSCRIBERS ─────────────────────────────────────────────────────────

    public function listSubscribers(): void
    {
        Auth::requireRole('operator');

        $cursor = filter_input(INPUT_GET, 'cursor', FILTER_SANITIZE_SPECIAL_CHARS) ?? null;
        $limit  = (int)(filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?? 25);
        $status = filter_input(INPUT_GET, 'status', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $search = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

        $validStatuses = ['', 'active', 'unsubscribed', 'bounced', 'unconfirmed', 'junk'];
        if (!in_array($status, $validStatuses, true)) {
            $status = '';
        }

        Response::success($this->ml->listSubscribers($cursor ?: null, $limit, $status, $search));
    }

    public function upsertSubscriber(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['email']);

        $email    = filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL);
        if (!$email) {
            Response::error('Email non valida', 422);
        }

        $name     = isset($body['name'])      ? htmlspecialchars(trim($body['name']),      ENT_QUOTES, 'UTF-8') : null;
        $lastName = isset($body['last_name']) ? htmlspecialchars(trim($body['last_name']), ENT_QUOTES, 'UTF-8') : null;
        $groups   = isset($body['groups']) && is_array($body['groups']) ? $body['groups'] : [];

        $subscriber = $this->ml->upsertSubscriber($email, $name ?: null, $lastName ?: null, $groups);
        Audit::log('UPSERT', 'newsletter_subscriber', $email, null, ['name' => $name, 'groups' => $groups]);
        Response::success($subscriber, 201);
    }

    public function deleteSubscriber(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $this->ml->deleteSubscriber($body['id']);
        Audit::log('DELETE', 'newsletter_subscriber', $body['id'], null, null);
        Response::success(['message' => 'Iscritto eliminato']);
    }

    // ─── GROUPS ──────────────────────────────────────────────────────────────

    public function listGroups(): void
    {
        Auth::requireRole('operator');
        Response::success($this->ml->listGroups());
    }

    public function createGroup(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);

        $name = htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8');
        if (empty($name)) Response::error('Nome gruppo obbligatorio', 422);

        $group = $this->ml->createGroup($name);
        Audit::log('INSERT', 'newsletter_group', $group['id'] ?? $name, null, ['name' => $name]);
        Response::success($group, 201);
    }

    public function deleteGroup(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $this->ml->deleteGroup($body['id']);
        Audit::log('DELETE', 'newsletter_group', $body['id'], null, null);
        Response::success(['message' => 'Gruppo eliminato']);
    }

    public function assignToGroup(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['group_id', 'subscriber_id']);

        $this->ml->assignToGroup($body['group_id'], $body['subscriber_id']);
        Response::success(['message' => 'Iscritto aggiunto al gruppo']);
    }

    public function unassignFromGroup(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['group_id', 'subscriber_id']);

        $this->ml->unassignFromGroup($body['group_id'], $body['subscriber_id']);
        Response::success(['message' => 'Iscritto rimosso dal gruppo']);
    }

    // ─── EXPORT ──────────────────────────────────────────────────────────────

    public function exportCsv(): void
    {
        Auth::requireRole('manager');

        $csv = $this->ml->exportCsv();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="newsletter_iscritti_' . date('Ymd') . '.csv"');
        header('Content-Length: ' . strlen($csv));
        echo $csv;
        exit;
    }
}
