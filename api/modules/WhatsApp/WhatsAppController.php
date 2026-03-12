<?php
/**
 * WhatsApp Controller — Inbox & Contacts
 * Fusion ERP v1.0
 *
 * Azioni:
 *   - getConversations  — lista conversazioni raggruppate per from_phone
 *   - getMessages       — messaggi di una conversazione
 *   - reply             — invia risposta via WhatsApp Cloud API
 *   - getContacts       — lista contatti importati
 *   - importContacts    — parsing e import vCard (.vcf)
 *   - linkContact       — collega contatto a un atleta
 */

declare(strict_types=1);

namespace FusionERP\Modules\WhatsApp;

use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\Auth;
use FusionERP\Shared\WhatsAppClient;

class WhatsAppController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── GET CONVERSATIONS ────────────────────────────────────────────────────

    public function getConversations(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';

        $stmt = $this->db->prepare("
            SELECT
                wm.from_phone,
                MAX(wm.created_at)                          AS last_message_at,
                SUBSTRING_INDEX(GROUP_CONCAT(wm.body ORDER BY wm.created_at DESC SEPARATOR '|||'), '|||', 1)
                                                            AS last_body,
                COUNT(CASE WHEN wm.status = 'received' THEN 1 END) AS unread_count,
                MAX(c.name)                                 AS contact_name,
                MAX(a.id)                                   AS athlete_id,
                MAX(TRIM(CONCAT(COALESCE(a.first_name,''), ' ', COALESCE(a.last_name,''))))
                                                            AS athlete_name,
                MAX(a.parent_contact)                       AS parent_name
            FROM whatsapp_messages wm
            LEFT JOIN contacts c
                ON c.phone_normalized = wm.from_phone
               AND c.tenant_id = :tenant_id
            LEFT JOIN athletes a
                ON (a.id = c.athlete_id OR
                    REGEXP_REPLACE(a.phone, '[^0-9]', '') LIKE CONCAT('%', RIGHT(wm.from_phone, 9)) OR
                    REGEXP_REPLACE(a.parent_phone, '[^0-9]', '') LIKE CONCAT('%', RIGHT(wm.from_phone, 9)))
            WHERE wm.tenant_id = :tenant_id
              AND wm.from_phone != 'me'
            GROUP BY wm.from_phone
            ORDER BY last_message_at DESC
            LIMIT 100
        ");
        $stmt->execute([':tenant_id' => $tenantId]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            if (!empty($row['contact_name'])) {
                $row['display_name'] = $row['contact_name'];
            }
            elseif (!empty($row['parent_name'])) {
                $row['display_name'] = 'Genitore di ' . trim($row['athlete_name'] ?: '');
            }
            elseif (!empty($row['athlete_name']) && trim($row['athlete_name']) !== '') {
                $row['display_name'] = trim($row['athlete_name']);
            }
            else {
                $row['display_name'] = null;
            }
        }
        unset($row);

        Response::success(['conversations' => $rows]);
    }

    // ─── GET MESSAGES ─────────────────────────────────────────────────────────

    public function getMessages(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';
        $fromPhone = $_GET['from_phone'] ?? '';

        if (empty($fromPhone)) {
            Response::error('Parametro from_phone mancante', 400);
        }

        // Messaggi in entrata dal numero + risposte uscite (media_id = numero destinatario)
        $stmt = $this->db->prepare("
            SELECT id, from_phone, message_type, body, media_id, timestamp, status, created_at
            FROM whatsapp_messages
            WHERE tenant_id = :tenant_id
              AND (from_phone = :phone
                   OR (from_phone = 'me' AND media_id = :phone))
            ORDER BY timestamp ASC, created_at ASC
            LIMIT 200
        ");
        $stmt->execute([':tenant_id' => $tenantId, ':phone' => $fromPhone]);
        $messages = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Marca come letti
        $this->db->prepare("
            UPDATE whatsapp_messages SET status = 'read'
            WHERE tenant_id = :tenant_id AND from_phone = :phone AND status = 'received'
        ")->execute([':tenant_id' => $tenantId, ':phone' => $fromPhone]);

        Response::success(['messages' => $messages]);
    }

    // ─── REPLY ─────────────────────────────────────────────────────────────────

    public function reply(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';
        $body = Response::jsonBody();
        $toPhone = $body['to_phone'] ?? '';
        $text = trim($body['text'] ?? '');

        if (empty($toPhone) || empty($text)) {
            Response::error('Parametri to_phone e text obbligatori', 400);
        }

        $wa = new WhatsAppClient();
        $result = $wa->sendText($toPhone, $text);

        if (!$result['success']) {
            Response::error($result['error'] ?? 'Errore invio WhatsApp', 500);
        }

        $id = 'WA_' . bin2hex(random_bytes(6));
        $waId = $result['data']['messages'][0]['id'] ?? 'OUT_' . $id;
        $stmt = $this->db->prepare("
            INSERT INTO whatsapp_messages
                (id, wa_message_id, from_phone, message_type, body, timestamp, status, tenant_id, media_id)
            VALUES
                (:id, :wa_id, 'me', 'text', :body, :ts, 'read', :tenant, :conv_phone)
        ");
        $stmt->execute([
            ':id' => $id,
            ':wa_id' => $waId,
            ':body' => $text,
            ':ts' => time(),
            ':tenant' => $tenantId,
            ':conv_phone' => $toPhone,
        ]);

        Response::success(['id' => $id, 'body' => $text, 'ts' => time()]);
    }

    // ─── GET CONTACTS ─────────────────────────────────────────────────────────

    public function getContacts(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';

        $stmt = $this->db->prepare("
            SELECT c.id, c.name, c.phone_raw, c.phone_normalized, c.source, c.created_at,
                   c.athlete_id,
                   TRIM(CONCAT(COALESCE(a.first_name,''), ' ', COALESCE(a.last_name,''))) AS athlete_name
            FROM contacts c
            LEFT JOIN athletes a ON a.id = c.athlete_id
            WHERE c.tenant_id = :tenant_id
            ORDER BY c.name ASC
        ");
        $stmt->execute([':tenant_id' => $tenantId]);
        $contacts = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        Response::success(['contacts' => $contacts]);
    }

    // ─── IMPORT CONTACTS (vCard) ──────────────────────────────────────────────

    public function importContacts(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';

        $isPreview = isset($_GET['preview']) && $_GET['preview'] === '1';

        // Modalità preview: legge il file caricato
        if ($isPreview) {
            if (empty($_FILES['vcf']['tmp_name'])) {
                Response::error('File .vcf non ricevuto', 400);
            }
            $content = file_get_contents($_FILES['vcf']['tmp_name']);
            if ($content === false)
                Response::error('Impossibile leggere il file', 400);

            $parsed = $this->parseVCard($content);
            foreach ($parsed as &$c) {
                $c['athlete_match'] = $this->findAthleteMatch($c['phone_normalized']);
            }
            unset($c);
            Response::success(['preview' => $parsed, 'total' => count($parsed)]);
        }

        // Modalità import: salva i contatti selezionati
        $body = Response::jsonBody();
        $selected = $body['contacts'] ?? [];
        if (empty($selected)) {
            Response::error('Nessun contatto da importare', 400);
        }

        $imported = 0;
        $skipped = 0;

        foreach ($selected as $c) {
            if (empty($c['phone_normalized']) || empty($c['name'])) {
                $skipped++;
                continue;
            }
            try {
                $id = 'CNT_' . bin2hex(random_bytes(5));
                $stmt = $this->db->prepare("
                    INSERT INTO contacts (id, name, phone_raw, phone_normalized, source, athlete_id, tenant_id)
                    VALUES (:id, :name, :raw, :norm, 'vcard', :athlete_id, :tenant)
                    ON DUPLICATE KEY UPDATE
                        name        = VALUES(name),
                        athlete_id  = COALESCE(VALUES(athlete_id), athlete_id)
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':name' => $c['name'],
                    ':raw' => $c['phone_raw'] ?? $c['phone_normalized'],
                    ':norm' => $c['phone_normalized'],
                    ':athlete_id' => $c['athlete_id'] ?? null,
                    ':tenant' => $tenantId,
                ]);
                $imported++;
            }
            catch (\Throwable) {
                $skipped++;
            }
        }

        Response::success(['imported' => $imported, 'skipped' => $skipped]);
    }

    // ─── LINK CONTACT ─────────────────────────────────────────────────────────

    public function linkContact(): void
    {
        $user = Auth::requireAuth();
        $tenantId = $user['tenant_id'] ?? 'TNT_default';
        $body = Response::jsonBody();

        $contactId = $body['contact_id'] ?? '';
        $athleteId = $body['athlete_id'] ?? null;

        if (empty($contactId))
            Response::error('contact_id obbligatorio', 400);

        $stmt = $this->db->prepare("
            UPDATE contacts SET athlete_id = :athlete_id
            WHERE id = :id AND tenant_id = :tenant
        ");
        $stmt->execute([
            ':athlete_id' => $athleteId ?: null,
            ':id' => $contactId,
            ':tenant' => $tenantId,
        ]);

        Response::success(['updated' => true]);
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private function parseVCard(string $content): array
    {
        $content = preg_replace("/\r\n[ \t]/", '', $content);
        $content = preg_replace("/\r\n/", "\n", $content);
        $content = preg_replace("/\r/", "\n", $content);

        $cards = [];
        $blocks = preg_split('/BEGIN:VCARD/i', $content);

        foreach ($blocks as $block) {
            if (empty(trim($block)))
                continue;

            $name = '';
            $phones = [];

            foreach (explode("\n", $block) as $line) {
                $line = trim($line);
                if (empty($line) || stripos($line, 'END:VCARD') === 0)
                    continue;

                if (preg_match('/^FN(?:;[^:]*)?:(.+)$/i', $line, $m)) {
                    $name = $this->decodeVCardValue(trim($m[1]));
                }
                if (preg_match('/^TEL(?:;[^:]*)?:(.+)$/i', $line, $m)) {
                    $raw = trim($m[1]);
                    $norm = $this->normalizePhone($raw);
                    if ($norm)
                        $phones[] = ['raw' => $raw, 'normalized' => $norm];
                }
            }

            if (empty($name) || empty($phones))
                continue;

            foreach ($phones as $ph) {
                $cards[] = [
                    'name' => $name,
                    'phone_raw' => $ph['raw'],
                    'phone_normalized' => $ph['normalized'],
                    'athlete_id' => null,
                    'athlete_match' => null,
                ];
            }
        }

        return $cards;
    }

    private function normalizePhone(string $raw): ?string
    {
        $digits = preg_replace('/[^0-9+]/', '', $raw);
        if (str_starts_with($digits, '+')) {
            $digits = ltrim($digits, '+');
        }
        elseif (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }
        elseif (str_starts_with($digits, '0')) {
            $digits = '39' . $digits;
        }
        $digits = preg_replace('/[^0-9]/', '', $digits);
        if (strlen($digits) < 8 || strlen($digits) > 15)
            return null;
        return $digits;
    }

    private function decodeVCardValue(string $v): string
    {
        return trim(str_replace(['\\,', '\\;', '\\n', '\\\\'], [',', ';', ' ', '\\'], $v));
    }

    private function findAthleteMatch(string $phoneNorm): ?array
    {
        if (empty($phoneNorm))
            return null;
        $suffix = '%' . substr($phoneNorm, -9);
        try {
            $stmt = $this->db->prepare("
                SELECT id, TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))) AS name
                FROM athletes
                WHERE REGEXP_REPLACE(phone, '[^0-9]', '') LIKE :suffix
                   OR REGEXP_REPLACE(parent_phone, '[^0-9]', '') LIKE :suffix
                LIMIT 1
            ");
            $stmt->execute([':suffix' => $suffix]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ?: null;
        }
        catch (\Throwable) {
            return null;
        }
    }
}