<?php
/**
 * MailerLiteService — Wrapper around the official MailerLite PHP SDK
 * Fusion ERP v1.0
 *
 * Provides all newsletter operations. Gracefully handles missing API key.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Newsletter;

use MailerLite\MailerLite;

class MailerLiteService
{
    private ?MailerLite $client = null;
    private bool $configured = false;

    public function __construct()
    {
        $apiKey = $_ENV['MAILERLITE_API_KEY'] ?? getenv('MAILERLITE_API_KEY') ?: '';
        if (!empty($apiKey)) {
            $this->client = new MailerLite(['api_key' => $apiKey]);
            $this->configured = true;
        }
    }

    public function isConfigured(): bool
    {
        return $this->configured;
    }

    // ─── STATS ────────────────────────────────────────────────────────────────

    /**
     * Returns aggregate subscriber counts.
     * @return array{total: int, active: int, unsubscribed: int, bounced: int}
     */
    public function getStats(): array
    {
        if (!$this->configured) return $this->emptyStats();

        try {
            // Fetch counts per status in parallel (4 quick calls)
            $active       = $this->countByStatus('active');
            $unsubscribed = $this->countByStatus('unsubscribed');
            $bounced      = $this->countByStatus('bounced');
            $unconfirmed  = $this->countByStatus('unconfirmed');

            return [
                'total'        => $active + $unsubscribed + $bounced + $unconfirmed,
                'active'       => $active,
                'unsubscribed' => $unsubscribed,
                'bounced'      => $bounced,
                'unconfirmed'  => $unconfirmed,
            ];
        } catch (\Throwable $e) {
            error_log('[MailerLite] getStats error: ' . $e->getMessage());
            return $this->emptyStats();
        }
    }

    private function countByStatus(string $status): int
    {
        $response = $this->client->subscribers->get([
            'filter' => ['status' => $status],
            'limit'  => 0,
        ]);
        return (int)($response['body']['total'] ?? 0);
    }

    private function emptyStats(): array
    {
        return ['total' => 0, 'active' => 0, 'unsubscribed' => 0, 'bounced' => 0, 'unconfirmed' => 0];
    }

    // ─── CAMPAIGNS ────────────────────────────────────────────────────────────

    /**
     * Lists recent sent campaigns.
     * @param int $limit Items to return
     */
    public function listCampaigns(int $limit = 10): array
    {
        if (!$this->configured) return [];

        try {
            $response = $this->client->campaigns->get(['filter' => ['status' => 'sent'], 'limit' => $limit]);
            return $response['body']['data'] ?? [];
        } catch (\Throwable $e) {
            error_log('[MailerLite] listCampaigns error: ' . $e->getMessage());
            return [];
        }
    }

    // ─── SUBSCRIBERS ─────────────────────────────────────────────────────────

    /**
     * Returns a page of subscribers.
     * @param string|null $cursor  Pagination cursor from previous response
     * @param int         $limit   Items per page (max 100)
     * @param string      $status  Filter: active|unsubscribed|bounced|unconfirmed|junk|all
     * @param string      $search  Optional search query
     */
    public function listSubscribers(?string $cursor = null, int $limit = 25, string $status = '', string $search = ''): array
    {
        if (!$this->configured) return ['data' => [], 'meta' => ['total' => 0]];

        $params = ['limit' => min($limit, 100)];
        if ($cursor) $params['cursor'] = $cursor;
        if ($status) $params['filter'] = ['status' => $status];
        if ($search) $params['filter']['query'] = $search;

        try {
            $response = $this->client->subscribers->get($params);
            $body = $response['body'] ?? [];
            return [
                'data'   => $body['data'] ?? [],
                'meta'   => $body['meta'] ?? ['total' => 0],
                'links'  => $body['links'] ?? [],
            ];
        } catch (\Throwable $e) {
            error_log('[MailerLite] listSubscribers error: ' . $e->getMessage());
            return ['data' => [], 'meta' => ['total' => 0], 'links' => []];
        }
    }

    /**
     * Creates or updates a subscriber (upsert by email).
     */
    public function upsertSubscriber(string $email, ?string $name = null, ?string $lastName = null, array $groupIds = []): array
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato. Aggiungi MAILERLITE_API_KEY nel .env');

        $payload = ['email' => $email, 'status' => 'active'];
        if ($name || $lastName) {
            $payload['fields'] = [];
            if ($name)     $payload['fields']['name']      = $name;
            if ($lastName) $payload['fields']['last_name'] = $lastName;
        }
        if (!empty($groupIds)) {
            $payload['groups'] = $groupIds;
        }

        $response = $this->client->subscribers->create($payload);
        return $response['body']['data'] ?? [];
    }

    /**
     * Fetches a single subscriber by ID or email.
     */
    public function getSubscriber(string $idOrEmail): array
    {
        if (!$this->configured) return [];

        try {
            $response = $this->client->subscribers->find($idOrEmail);
            return $response['body']['data'] ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Permanently deletes a subscriber.
     */
    public function deleteSubscriber(string $id): void
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');
        $this->client->subscribers->delete($id);
    }

    /**
     * Exports all active subscribers as CSV string.
     */
    public function exportCsv(): string
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');

        $rows   = [['Email', 'Nome', 'Cognome', 'Stato', 'Iscritto il']];
        $cursor = null;

        do {
            $page   = $this->listSubscribers($cursor, 100);
            foreach ($page['data'] as $sub) {
                $fields  = $sub['fields'] ?? [];
                $name    = $this->getField($fields, 'name');
                $last    = $this->getField($fields, 'last_name');
                $rows[]  = [
                    $sub['email']        ?? '',
                    $name,
                    $last,
                    $sub['status']       ?? '',
                    substr($sub['created_at'] ?? '', 0, 10),
                ];
            }
            // Extract next cursor from links
            $cursor = $this->extractNextCursor($page['links']['next'] ?? '');
        } while ($cursor);

        ob_start();
        $fh = fopen('php://output', 'w');
        foreach ($rows as $row) fputcsv($fh, $row);
        fclose($fh);
        return ob_get_clean();
    }

    // ─── GROUPS ──────────────────────────────────────────────────────────────

    public function listGroups(): array
    {
        if (!$this->configured) return [];

        try {
            $response = $this->client->groups->get(['limit' => 100]);
            return $response['body']['data'] ?? [];
        } catch (\Throwable $e) {
            error_log('[MailerLite] listGroups error: ' . $e->getMessage());
            return [];
        }
    }

    public function createGroup(string $name): array
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');
        $response = $this->client->groups->create(['name' => $name]);
        return $response['body']['data'] ?? [];
    }

    public function deleteGroup(string $id): void
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');
        $this->client->groups->delete($id);
    }

    public function assignToGroup(string $groupId, string $subscriberId): void
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');
        $this->client->groups->assignSubscriber($groupId, $subscriberId);
    }

    public function unassignFromGroup(string $groupId, string $subscriberId): void
    {
        if (!$this->configured) throw new \RuntimeException('MailerLite non configurato');
        $this->client->groups->unAssignSubscriber($groupId, $subscriberId);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private function getField(array $fields, string $key): string
    {
        return (string)($fields[$key] ?? '');
    }

    private function extractNextCursor(string $nextUrl): ?string
    {
        if (!$nextUrl) return null;
        parse_str(parse_url($nextUrl, PHP_URL_QUERY) ?? '', $params);
        return $params['cursor'] ?? null;
    }
}
