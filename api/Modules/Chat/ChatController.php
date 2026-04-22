<?php
/**
 * Chat Controller — Real-time Messaging
 * Fusion ERP v1.0
 *
 * Handles: channels list, message CRUD, SSE streaming, read receipts.
 * Uses Server-Sent Events (SSE) for real-time without WebSocket server.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Chat;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Database;
use PDO;

class ChatController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── GET /api/?module=chat&action=channels ─────────────────────────────────
    // List all channels the current user belongs to.
    public function channels(): void
    {
        $user = Auth::requireRead('chat');
        $tenantId = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT c.id, c.name, c.type, c.team_id, c.created_at,
                    cm.last_read_at, cm.muted,
                    (SELECT COUNT(*) FROM chat_messages m
                     WHERE m.channel_id = c.id AND m.deleted_at IS NULL
                       AND m.created_at > COALESCE(cm.last_read_at, \'1970-01-01\')
                       AND m.user_id != :uid2) AS unread_count,
                    (SELECT m2.content FROM chat_messages m2
                     WHERE m2.channel_id = c.id AND m2.deleted_at IS NULL
                     ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
                    (SELECT m3.created_at FROM chat_messages m3
                     WHERE m3.channel_id = c.id AND m3.deleted_at IS NULL
                     ORDER BY m3.created_at DESC LIMIT 1) AS last_message_at
             FROM chat_channels c
             JOIN chat_channel_members cm ON cm.channel_id = c.id AND cm.user_id = :uid
             WHERE c.tenant_id = :tid AND c.is_active = 1
             ORDER BY last_message_at DESC'
        );
        $stmt->execute([':uid' => $user['id'], ':uid2' => $user['id'], ':tid' => $tenantId]);
        $channels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($channels);
    }

    // ─── POST /api/?module=chat&action=createChannel ───────────────────────────
    public function createChannel(): void
    {
        $user = Auth::requireWrite('chat');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name', 'type']);

        $tenantId = TenantContext::id();
        $channelId = 'CHN_' . bin2hex(random_bytes(4));
        $type = in_array($body['type'], ['team', 'staff', 'parents', 'direct', 'general'])
            ? $body['type'] : 'general';

        $stmt = $this->db->prepare(
            'INSERT INTO chat_channels (id, tenant_id, team_id, name, type, created_by)
             VALUES (:id, :tid, :team_id, :name, :type, :created_by)'
        );
        $stmt->execute([
            ':id' => $channelId,
            ':tid' => $tenantId,
            ':team_id' => $body['team_id'] ?? null,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':type' => $type,
            ':created_by' => $user['id'],
        ]);

        // Add creator as admin member
        $stmtMem = $this->db->prepare(
            'INSERT INTO chat_channel_members (channel_id, user_id, role) VALUES (:cid, :uid, \'admin\')'
        );
        $stmtMem->execute([':cid' => $channelId, ':uid' => $user['id']]);

        // If team channel, auto-add all team members
        if (!empty($body['team_id'])) {
            $this->autoAddTeamMembers($channelId, $body['team_id']);
        }

        // Add specified members
        if (!empty($body['member_ids']) && is_array($body['member_ids'])) {
            foreach ($body['member_ids'] as $memberId) {
                $this->addMemberToChannel($channelId, $memberId);
            }
        }

        Audit::log('INSERT', 'chat_channels', $channelId, null, ['name' => $body['name'], 'type' => $type]);
        Response::success(['id' => $channelId], 201);
    }

    // ─── GET /api/?module=chat&action=messages&channel_id=CHN_xxx ──────────────
    public function messages(): void
    {
        $user = Auth::requireRead('chat');
        $channelId = filter_input(INPUT_GET, 'channel_id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $before = filter_input(INPUT_GET, 'before', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $limit = min(50, max(10, (int)(filter_input(INPUT_GET, 'limit') ?? '30')));

        if (empty($channelId)) {
            Response::error('channel_id obbligatorio', 400);
        }

        // Verify membership
        if (!$this->isMember($channelId, $user['id'])) {
            Response::error('Non sei membro di questo canale', 403);
        }

        $sql = 'SELECT m.id, m.user_id, m.content, m.type, m.metadata, m.is_edited,
                       m.created_at, m.updated_at,
                       u.full_name AS author_name, u.role AS author_role
                FROM chat_messages m
                JOIN users u ON u.id = m.user_id
                WHERE m.channel_id = :cid AND m.deleted_at IS NULL';
        $params = [':cid' => $channelId];

        if (!empty($before)) {
            $sql .= ' AND m.created_at < :before';
            $params[':before'] = $before;
        }

        $sql .= ' ORDER BY m.created_at DESC LIMIT ' . $limit;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode metadata JSON
        foreach ($messages as &$msg) {
            $msg['metadata'] = $msg['metadata'] ? json_decode($msg['metadata'], true) : null;
        }

        // Update last_read_at
        $this->markReadInternal($channelId, $user['id']);

        // Return in chronological order
        Response::success(array_reverse($messages));
    }

    // ─── POST /api/?module=chat&action=send ────────────────────────────────────
    public function send(): void
    {
        $user = Auth::requireWrite('chat');
        $body = Response::jsonBody();
        Response::requireFields($body, ['channel_id', 'content']);

        $channelId = $body['channel_id'];
        $content = trim($body['content']);

        if (empty($content)) {
            Response::error('Il messaggio non può essere vuoto', 400);
        }

        if (!$this->isMember($channelId, $user['id'])) {
            Response::error('Non sei membro di questo canale', 403);
        }

        $messageId = 'MSG_' . bin2hex(random_bytes(4));
        $type = in_array($body['type'] ?? 'text', ['text', 'image', 'file', 'system', 'event'])
            ? ($body['type'] ?? 'text') : 'text';

        $stmt = $this->db->prepare(
            'INSERT INTO chat_messages (id, channel_id, user_id, content, type, metadata)
             VALUES (:id, :cid, :uid, :content, :type, :meta)'
        );
        $stmt->execute([
            ':id' => $messageId,
            ':cid' => $channelId,
            ':uid' => $user['id'],
            ':content' => htmlspecialchars($content, ENT_QUOTES, 'UTF-8'),
            ':type' => $type,
            ':meta' => isset($body['metadata']) ? json_encode($body['metadata']) : null,
        ]);

        // Update sender's last_read_at
        $this->markReadInternal($channelId, $user['id']);

        Response::success([
            'id' => $messageId,
            'channel_id' => $channelId,
            'content' => $content,
            'type' => $type,
            'created_at' => date('Y-m-d H:i:s'),
            'author_name' => $user['fullName'] ?? $user['full_name'] ?? '',
        ], 201);
    }

    // ─── GET /api/?module=chat&action=stream&channel_id=CHN_xxx ────────────────
    // Server-Sent Events endpoint for real-time messages.
    public function stream(): void
    {
        $user = Auth::requireRead('chat');
        $channelId = filter_input(INPUT_GET, 'channel_id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

        if (empty($channelId) || !$this->isMember($channelId, $user['id'])) {
            Response::error('Accesso negato', 403);
        }

        // Close session to avoid blocking
        session_write_close();

        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        $lastId = filter_input(INPUT_GET, 'last_id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $lastCheck = $lastId ? null : date('Y-m-d H:i:s');

        // SSE loop — poll every 2 seconds for 30 seconds max, then client reconnects
        $maxIterations = 15;
        for ($i = 0; $i < $maxIterations; $i++) {
            if (connection_aborted())
                break;

            $sql = 'SELECT m.id, m.user_id, m.content, m.type, m.metadata, m.created_at,
                           u.full_name AS author_name
                    FROM chat_messages m
                    JOIN users u ON u.id = m.user_id
                    WHERE m.channel_id = :cid AND m.deleted_at IS NULL';
            $params = [':cid' => $channelId];

            if ($lastId) {
                $sql .= ' AND m.id > :last_id';
                $params[':last_id'] = $lastId;
            }
            elseif ($lastCheck) {
                $sql .= ' AND m.created_at > :last_check';
                $params[':last_check'] = $lastCheck;
            }

            $sql .= ' ORDER BY m.created_at ASC LIMIT 50';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($messages)) {
                foreach ($messages as $msg) {
                    $msg['metadata'] = $msg['metadata'] ? json_decode($msg['metadata'], true) : null;
                    echo "id: {$msg['id']}\n";
                    echo "data: " . json_encode($msg) . "\n\n";
                    $lastId = $msg['id'];
                }
                ob_flush();
                flush();
            }
            else {
                // Send keepalive
                echo ": keepalive\n\n";
                ob_flush();
                flush();
            }

            sleep(2);
        }

        // End SSE connection (client will auto-reconnect via EventSource)
        echo "event: reconnect\ndata: {}\n\n";
        ob_flush();
        flush();
    }

    // ─── POST /api/?module=chat&action=markRead ────────────────────────────────
    public function markRead(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
        $channelId = $body['channel_id'] ?? '';

        if (!empty($channelId)) {
            $this->markReadInternal($channelId, $user['id']);
        }

        Response::success(['message' => 'Letto']);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function isMember(string $channelId, string $userId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM chat_channel_members WHERE channel_id = :cid AND user_id = :uid'
        );
        $stmt->execute([':cid' => $channelId, ':uid' => $userId]);
        return (bool)$stmt->fetch();
    }

    private function markReadInternal(string $channelId, string $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE chat_channel_members SET last_read_at = NOW() WHERE channel_id = :cid AND user_id = :uid'
        );
        $stmt->execute([':cid' => $channelId, ':uid' => $userId]);
    }


    private function addMemberToChannel(string $channelId, string $userId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO chat_channel_members (channel_id, user_id, role)
             VALUES (:cid, :uid, \'member\')'
        );
        $stmt->execute([':cid' => $channelId, ':uid' => $userId]);
    }

    private function autoAddTeamMembers(string $channelId, string $teamId): void
    {
        // Add all athletes' linked users + coaches
        $stmt = $this->db->prepare(
            'SELECT DISTINCT user_id FROM (
                SELECT user_id FROM athletes WHERE team_id = :tid AND user_id IS NOT NULL AND is_active = 1
                UNION
                SELECT coach_id AS user_id FROM teams WHERE id = :tid2 AND coach_id IS NOT NULL
             ) sub WHERE user_id IS NOT NULL'
        );
        $stmt->execute([':tid' => $teamId, ':tid2' => $teamId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $this->addMemberToChannel($channelId, $row['user_id']);
        }
    }
}