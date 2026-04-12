<?php
/**
 * WhatsApp Webhook Controller
 * Fusion ERP v1.0
 *
 * Gestisce il webhook Meta Cloud API per:
 *   - verify  (GET)  — Verifica handshake iniziale con Meta
 *   - receive (POST) — Ricezione messaggi in entrata
 *
 * Route pubblica: ?module=whatsapp&action=verify|receive
 * NON richiede autenticazione (Meta chiama dall'esterno).
 */

declare(strict_types=1);

namespace FusionERP\Modules\WhatsApp;

use FusionERP\Shared\Database;
use FusionERP\Shared\WhatsAppClient;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class WhatsAppWebhookController
{
    // ─── GET ?module=whatsapp&action=verify ──────────────────────────────────

    /**
     * Verifica handshake webhook Meta.
     * Meta invia: hub.mode=subscribe, hub.verify_token, hub.challenge
     * Rispondere con hub.challenge se il token corrisponde.
     */
    public function verify(): void
    {
        $mode = $_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '';

        $expectedToken = $_ENV['WHATSAPP_VERIFY_TOKEN'] ?? '';

        if ($mode === 'subscribe' && $token === $expectedToken) {
            http_response_code(200);
            header('Content-Type: text/plain');
            echo $challenge;
            exit;
        }

        Response::error('Forbidden — verify token mismatch', 403);
    }

    // ─── POST ?module=whatsapp&action=receive ─────────────────────────────────

    /**
     * Riceve ed elabora i messaggi in entrata da Meta.
     * Valida la firma HMAC-SHA256 e salva ogni messaggio nel DB.
     */
    public function receive(): void
    {
        // 1. Leggi il body raw
        $rawBody = file_get_contents('php://input');

        // 2. Validazione firma HMAC (X-Hub-Signature-256)
        if (!$this->validateSignature($rawBody)) {
            Response::error('Firma non valida', 403);
        }

        // 3. Decodifica payload
        $payload = json_decode($rawBody ?: '{}', true);
        if (json_last_error() !== JSON_ERROR_NONE || empty($payload)) {
            Response::error('Payload non valido', 400);
        }

        // 4. Cicla le entry del webhook
        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'messages') {
                    continue;
                }

                $value = $change['value'] ?? [];

                // Messaggi in entrata
                foreach ($value['messages'] ?? [] as $message) {
                    $this->processIncomingMessage($message, $value);
                }

                // Aggiornamenti di stato (delivered, read) — ignorati silenziosamente
                foreach ($value['statuses'] ?? [] as $status) {
                    // Rate-limited by Meta; skip DB save, just acknowledge
                }
            }
        }

        // 5. Meta si aspetta 200 OK in risposta rapida
        http_response_code(200);
        echo json_encode(['status' => 'ok']);
        // NOTE: We keep raw echo here because Meta requires a fast 200 OK
        // and Response::success() would add unnecessary overhead/headers.
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    /**
     * Elabora un singolo messaggio in entrata e lo salva nel DB.
     */
    private function processIncomingMessage(array $message, array $value): void
    {
        $waMessageId = $message['id'] ?? '';
        $fromPhone = $message['from'] ?? '';
        $timestamp = (int)($message['timestamp'] ?? 0);
        $type = $message['type'] ?? 'unknown';

        // Estrai il corpo in base al tipo
        $body = null;
        $mediaId = null;

        switch ($type) {
            case 'text':
                $body = $message['text']['body'] ?? null;
                break;
            case 'image':
                $body = $message['image']['caption'] ?? null;
                $mediaId = $message['image']['id'] ?? null;
                break;
            case 'document':
                $body = $message['document']['caption'] ?? $message['document']['filename'] ?? null;
                $mediaId = $message['document']['id'] ?? null;
                break;
            case 'audio':
                $mediaId = $message['audio']['id'] ?? null;
                break;
            case 'video':
                $body = $message['video']['caption'] ?? null;
                $mediaId = $message['video']['id'] ?? null;
                break;
            case 'reaction':
                $body = $message['reaction']['emoji'] ?? null;
                break;
            case 'interactive':
                $body = $message['interactive']['button_reply']['title']
                    ?? $message['interactive']['list_reply']['title']
                    ?? null;
                break;
        }

        // Tenta di collegare il numero a un atleta esistente
        $resolveResult = $this->resolveAthleteByPhone($fromPhone);
        $athleteId = $resolveResult['athlete_id'];
        $tenantId = $resolveResult['tenant_id'];

        // Salva nel DB
        try {
            $db = Database::getInstance();
            $id = 'WA_' . bin2hex(random_bytes(6));
            $stmt = $db->prepare(
                'INSERT IGNORE INTO whatsapp_messages
                    (id, wa_message_id, from_phone, message_type, body, media_id, timestamp, status, athlete_id, tenant_id)
                 VALUES
                    (:id, :wa_msg_id, :from, :type, :body, :media_id, :ts, "received", :athlete_id, :tenant_id)'
            );
            $stmt->execute([
                ':id' => $id,
                ':wa_msg_id' => $waMessageId,
                ':from' => $fromPhone,
                ':type' => in_array($type, ['text', 'image', 'document', 'audio', 'video', 'reaction', 'interactive'], true)
                ? $type : 'unknown',
                ':body' => $body,
                ':media_id' => $mediaId,
                ':ts' => $timestamp,
                ':athlete_id' => $athleteId,
                ':tenant_id' => $tenantId,
            ]);
        }
        catch (\Throwable $e) {
            error_log('[WhatsApp] DB save failed: ' . $e->getMessage());
            return;
        }

        // Segna il messaggio come "letto" (doppia spunta)
        try {
            $wa = new WhatsAppClient();
            $wa->markAsRead($waMessageId);
        }
        catch (\Throwable $e) {
            error_log('[WhatsApp] markAsRead failed: ' . $e->getMessage());
        }

    }

    /**
     * Cerca un atleta per numero di telefono (phone o parent_phone).
     * Il numero in entrata da Meta è in formato internazionale senza +, es: 393471234567
     * Returns both athlete_id and tenant_id for tenant-scoped message storage.
     */
    private function resolveAthleteByPhone(string $fromPhone): array
    {
        $default = ['athlete_id' => null, 'tenant_id' => TenantContext::id()];

        if (empty($fromPhone)) {
            return $default;
        }

        try {
            $db = Database::getInstance();
            // Normalizza: rimuovi prefisso paese 39 e confronta con cifre finali
            $stmt = $db->prepare(
                'SELECT id, tenant_id FROM athletes
                  WHERE REGEXP_REPLACE(phone, "[^0-9]", "") LIKE :suffix
                     OR REGEXP_REPLACE(parent_phone, "[^0-9]", "") LIKE :suffix
                  LIMIT 1'
            );
            // Prendi le ultime 9 cifre per un match flessibile
            $suffix = '%' . substr($fromPhone, -9);
            $stmt->execute([':suffix' => $suffix]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($row) {
                return ['athlete_id' => $row['id'], 'tenant_id' => $row['tenant_id']];
            }
            return $default;
        }
        catch (\Throwable $e) {
            error_log('[WhatsApp] resolveAthleteByPhone failed: ' . $e->getMessage());
            return $default;
        }
    }

    /**
     * Valida la firma HMAC-SHA256 inviata da Meta nell'header X-Hub-Signature-256.
     * App Secret = WHATSAPP_TOKEN non è corretto — serve l'App Secret Meta (non il Bearer token).
     */
    private function validateSignature(string $rawBody): bool
    {
        $appSecret = $_ENV['WHATSAPP_APP_SECRET'] ?? '';

        if (empty($appSecret)) {
            // In produzione la firma HMAC è obbligatoria — rifiuta la richiesta.
            // In sviluppo (APP_DEBUG=true) il controllo viene saltato per facilitare i test locali.
            $isDebug = filter_var(getenv('APP_DEBUG') ?: ($_ENV['APP_DEBUG'] ?? false), FILTER_VALIDATE_BOOLEAN);
            if (!$isDebug) {
                return false; // 403 verrà restituito dal chiamante
            }
            // debug only — mai in produzione
            error_log('[WhatsApp] ATTENZIONE: WHATSAPP_APP_SECRET non configurato (solo dev/debug).');
            return true;
        }

        $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
        if (empty($signature)) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $appSecret);
        return hash_equals($expected, $signature);
    }
}