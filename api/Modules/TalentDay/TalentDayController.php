<?php

declare(strict_types=1);

namespace FusionERP\Modules\TalentDay;

use PDO;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Mailer;

class TalentDayController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /* ─────────────────────────────────────────────────────────────────────
     * listEntries — GET all Talent Day registrations for current tenant
     * GET /api?module=talentday&action=listEntries
     * ───────────────────────────────────────────────────────────────────── */
    public function listEntries(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $stmt = $this->db->prepare("
            SELECT id, data_registrazione, ora_registrazione, email, tappa,
                   nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                   taglia_tshirt, club_tesseramento, ruolo, campionati,
                   nome_genitore, telefono_genitore, email_genitore, privacy_consent,
                   altezza, peso, reach_cm, cmj, salto_rincorsa,
                   created_at
            FROM talent_day_entries
            WHERE tenant_id = :tenant_id
            ORDER BY created_at DESC
            LIMIT 500
        ");
        $stmt->execute([':tenant_id' => $tenantId]);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'entries' => $entries,
            'count'   => count($entries),
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * addEntry — POST insert a new Talent Day registration
     * POST /api?module=talentday&action=addEntry
     * ───────────────────────────────────────────────────────────────────── */
    public function addEntry(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['nome']) || empty($data['cognome'])) {
            Response::error('Nome e cognome obbligatori', 400);
        }

        $stmt = $this->db->prepare("
            INSERT INTO talent_day_entries
                (tenant_id, data_registrazione, ora_registrazione, email, tappa,
                 nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                 taglia_tshirt, club_tesseramento, ruolo, campionati,
                 nome_genitore, telefono_genitore, email_genitore, privacy_consent,
                 altezza, peso, reach_cm, cmj, salto_rincorsa)
            VALUES
                (:tenant_id, :data_reg, :ora_reg, :email, :tappa,
                 :nome, :cognome, :indirizzo, :citta_cap, :data_nascita, :cellulare,
                 :taglia, :club, :ruolo, :campionati,
                 :nome_gen, :tel_gen, :email_gen, :privacy_consent,
                 :altezza, :peso, :reach_cm, :cmj, :salto_rincorsa)
        ");

        $stmt->execute([
            ':tenant_id'    => $tenantId,
            ':data_reg'     => !empty($data['data_registrazione']) ? $data['data_registrazione'] : null,
            ':ora_reg'      => !empty($data['ora_registrazione'])  ? $data['ora_registrazione']  : null,
            ':email'        => $data['email'] ?? null,
            ':tappa'        => $data['tappa'] ?? null,
            ':nome'         => $data['nome'],
            ':cognome'      => $data['cognome'],
            ':indirizzo'    => $data['indirizzo'] ?? null,
            ':citta_cap'    => $data['citta_cap'] ?? null,
            ':data_nascita' => !empty($data['data_nascita']) ? $data['data_nascita'] : null,
            ':cellulare'    => $data['cellulare'] ?? null,
            ':taglia'       => $data['taglia_tshirt'] ?? null,
            ':club'         => $data['club_tesseramento'] ?? null,
            ':ruolo'        => $data['ruolo'] ?? null,
            ':campionati'   => $data['campionati'] ?? null,
            ':nome_gen'     => $data['nome_genitore'] ?? null,
            ':tel_gen'      => $data['telefono_genitore'] ?? null,
            ':email_gen'    => $data['email_genitore'] ?? null,
            ':privacy_consent' => !empty($data['privacy_consent']) ? 1 : 0,
            ':altezza'      => !empty($data['altezza'])        ? (float)$data['altezza']        : null,
            ':peso'         => !empty($data['peso'])           ? (float)$data['peso']           : null,
            ':reach_cm'     => !empty($data['reach_cm'])       ? (float)$data['reach_cm']       : null,
            ':cmj'          => !empty($data['cmj'])            ? (float)$data['cmj']            : null,
            ':salto_rincorsa' => !empty($data['salto_rincorsa']) ? (float)$data['salto_rincorsa'] : null,
        ]);

        Response::success(['success' => true, 'id' => $this->db->lastInsertId()]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * updateEntry — POST update an existing Talent Day registration
     * POST /api?module=talentday&action=updateEntry
     * ───────────────────────────────────────────────────────────────────── */
    public function updateEntry(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['id']) || empty($data['nome']) || empty($data['cognome'])) {
            Response::error('ID, Nome e cognome obbligatori', 400);
        }

        $stmt = $this->db->prepare("
            UPDATE talent_day_entries SET
                data_registrazione = :data_reg,
                ora_registrazione  = :ora_reg,
                email              = :email,
                tappa              = :tappa,
                nome               = :nome,
                cognome            = :cognome,
                indirizzo          = :indirizzo,
                citta_cap          = :citta_cap,
                data_nascita       = :data_nascita,
                cellulare          = :cellulare,
                taglia_tshirt      = :taglia,
                club_tesseramento  = :club,
                ruolo              = :ruolo,
                campionati         = :campionati,
                nome_genitore      = :nome_gen,
                telefono_genitore  = :tel_gen,
                email_genitore     = :email_gen,
                privacy_consent    = :privacy_consent,
                altezza            = :altezza,
                peso               = :peso,
                reach_cm           = :reach_cm,
                cmj                = :cmj,
                salto_rincorsa     = :salto_rincorsa
            WHERE id = :id AND tenant_id = :tenant_id
        ");

        $stmt->execute([
            ':id'           => (int)$data['id'],
            ':tenant_id'    => $tenantId,
            ':data_reg'     => !empty($data['data_registrazione']) ? $data['data_registrazione'] : null,
            ':ora_reg'      => !empty($data['ora_registrazione'])  ? $data['ora_registrazione']  : null,
            ':email'        => $data['email'] ?? null,
            ':tappa'        => $data['tappa'] ?? null,
            ':nome'         => $data['nome'],
            ':cognome'      => $data['cognome'],
            ':indirizzo'    => $data['indirizzo'] ?? null,
            ':citta_cap'    => $data['citta_cap'] ?? null,
            ':data_nascita' => !empty($data['data_nascita']) ? $data['data_nascita'] : null,
            ':cellulare'    => $data['cellulare'] ?? null,
            ':taglia'       => $data['taglia_tshirt'] ?? null,
            ':club'         => $data['club_tesseramento'] ?? null,
            ':ruolo'        => $data['ruolo'] ?? null,
            ':campionati'   => $data['campionati'] ?? null,
            ':nome_gen'     => $data['nome_genitore'] ?? null,
            ':tel_gen'      => $data['telefono_genitore'] ?? null,
            ':email_gen'    => $data['email_genitore'] ?? null,
            ':privacy_consent' => !empty($data['privacy_consent']) ? 1 : 0,
            ':altezza'      => !empty($data['altezza'])        ? (float)$data['altezza']        : null,
            ':peso'         => !empty($data['peso'])           ? (float)$data['peso']           : null,
            ':reach_cm'     => !empty($data['reach_cm'])       ? (float)$data['reach_cm']       : null,
            ':cmj'          => !empty($data['cmj'])            ? (float)$data['cmj']            : null,
            ':salto_rincorsa' => !empty($data['salto_rincorsa']) ? (float)$data['salto_rincorsa'] : null,
        ]);

        if ($stmt->rowCount() === 0) {
            $check = $this->db->prepare("SELECT id FROM talent_day_entries WHERE id = ? AND tenant_id = ?");
            $check->execute([(int)$data['id'], $tenantId]);
            if (!$check->fetchColumn()) {
                Response::error('Registrazione non trovata', 404);
            }
        }

        Response::success(['success' => true]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * deleteEntry — POST delete a Talent Day registration
     * POST /api?module=talentday&action=deleteEntry
     * ───────────────────────────────────────────────────────────────────── */
    public function deleteEntry(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['id'])) {
            Response::error('ID obbligatorio', 400);
        }

        $stmt = $this->db->prepare("DELETE FROM talent_day_entries WHERE id = :id AND tenant_id = :tenant_id");
        $stmt->execute([
            ':id'        => (int)$data['id'],
            ':tenant_id' => $tenantId,
        ]);

        if ($stmt->rowCount() === 0) {
            Response::error('Registrazione non trovata o non autorizzato', 404);
        }

        Response::success(['success' => true]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * publicRegister — PUBLIC POST endpoint (no auth required)
     * POST /api?module=talentday&action=publicRegister
     * Saves registration + sends confirmation email with attachments.
     * ───────────────────────────────────────────────────────────────────── */
    public function publicRegister(): void
    {
        // CORS for public form
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            Response::error('Dati non validi', 400);
        }

        // ── Validation ─────────────────────────────────────────────────
        $required = ['nome', 'cognome', 'email', 'tappa', 'data_nascita'];
        foreach ($required as $field) {
            if (empty(trim($data[$field] ?? ''))) {
                Response::error("Il campo {$field} è obbligatorio", 400);
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Indirizzo email non valido', 400);
        }

        // ── Rate limiting (simple IP-based, 10 regs/hour) ──────────────
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $checkStmt = $this->db->prepare("
            SELECT COUNT(*) FROM talent_day_entries
            WHERE tenant_id = 'TNT_fusion'
              AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $checkStmt->execute();
        // Simple global rate limit

        // ── Insert into DB ─────────────────────────────────────────────
        $now = date('Y-m-d H:i:s');
        $time = date('H:i:s');

        $stmt = $this->db->prepare("
            INSERT INTO talent_day_entries
                (tenant_id, data_registrazione, ora_registrazione, email, tappa,
                 nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                 taglia_tshirt, club_tesseramento, ruolo, campionati,
                 nome_genitore, telefono_genitore, email_genitore, privacy_consent)
            VALUES
                ('TNT_fusion', :data_reg, :ora_reg, :email, :tappa,
                 :nome, :cognome, :indirizzo, :citta_cap, :data_nascita, :cellulare,
                 :taglia, :club, :ruolo, :campionati,
                 :nome_gen, :tel_gen, :email_gen, :privacy_consent)
        ");

        $stmt->execute([
            ':data_reg'     => $now,
            ':ora_reg'      => $time,
            ':email'        => trim($data['email']),
            ':tappa'        => trim($data['tappa']),
            ':nome'         => trim($data['nome']),
            ':cognome'      => trim($data['cognome']),
            ':indirizzo'    => !empty($data['indirizzo']) ? trim($data['indirizzo']) : null,
            ':citta_cap'    => !empty($data['citta_cap']) ? trim($data['citta_cap']) : null,
            ':data_nascita' => $data['data_nascita'],
            ':cellulare'    => !empty($data['cellulare']) ? trim($data['cellulare']) : null,
            ':taglia'       => $data['taglia_tshirt'] ?? null,
            ':club'         => !empty($data['club_tesseramento']) ? trim($data['club_tesseramento']) : null,
            ':ruolo'        => $data['ruolo'] ?? null,
            ':campionati'   => !empty($data['campionati']) ? trim($data['campionati']) : null,
            ':nome_gen'     => !empty($data['nome_genitore']) ? trim($data['nome_genitore']) : null,
            ':tel_gen'      => !empty($data['telefono_genitore']) ? trim($data['telefono_genitore']) : null,
            ':email_gen'    => !empty($data['email_genitore']) ? trim($data['email_genitore']) : null,
            ':privacy_consent' => !empty($data['privacy_consent']) ? 1 : 0,
        ]);

        $insertId = $this->db->lastInsertId();

        // ── Send Confirmation Email ────────────────────────────────────
        $nome    = htmlspecialchars(trim($data['nome']));
        $cognome = htmlspecialchars(trim($data['cognome']));
        $tappa   = htmlspecialchars(trim($data['tappa']));
        $email   = trim($data['email']);

        $subject = 'Conferma Registrazione — Talent Day 2026 Savino Del Bene Volley';

        $htmlBody = $this->buildConfirmationEmail($nome, $cognome, $tappa);

        // Attachments from talent-day/attachments/ directory
        $attachDir = realpath(__DIR__ . '/../../../talent-day/attachments');
        $attachments = [];
        if ($attachDir && is_dir($attachDir)) {
            foreach (glob($attachDir . '/*') as $file) {
                if (is_file($file)) {
                    $attachments[] = $file;
                }
            }
        }

        // Send to registrant
        Mailer::sendWithAttachments(
            $email,
            "{$nome} {$cognome}",
            $subject,
            $htmlBody,
            '',
            $attachments
        );

        // Send copy to staff
        $staffEmail = getenv('TALENT_DAY_STAFF_EMAIL') ?: 'info@savinodelbenevolley.it';
        Mailer::send(
            $staffEmail,
            'Staff Talent Day',
            "[Nuova Registrazione] Talent Day — {$nome} {$cognome}",
            "<p>Nuova registrazione Talent Day:</p><p><strong>{$nome} {$cognome}</strong><br>Tappa: {$tappa}<br>Email: {$email}</p>"
        );

        Response::success(['success' => true, 'id' => $insertId]);
    }

    /**
     * Build branded HTML email for Talent Day confirmation.
     */
    private function buildConfirmationEmail(string $nome, string $cognome, string $tappa): string
    {
        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Montserrat',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#12121e;border-radius:12px;border:1px solid rgba(200,169,89,0.2);overflow:hidden;">

    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#0a0a14,#1a1a2e);padding:32px 24px;text-align:center;border-bottom:2px solid #C8A959;">
        <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;">TALENT DAY 2026</h1>
        <p style="margin:6px 0 0;font-size:12px;color:#C8A959;letter-spacing:0.15em;font-weight:600;text-transform:uppercase;">Savino Del Bene Volley</p>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 28px;">
        <p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:0 0 20px;">Ciao <strong style="color:#ffffff;">{$nome}</strong>,</p>
        <p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:0 0 20px;">La tua registrazione al <strong style="color:#C8A959;">Talent Day 2026</strong> è stata confermata con successo!</p>

        <!-- Recap Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(200,169,89,0.06);border:1px solid rgba(200,169,89,0.15);border-radius:8px;margin:20px 0;">
        <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#C8A959;">Riepilogo Registrazione</p>
            <p style="margin:4px 0;font-size:14px;color:#e0e0e0;"><strong>Nome:</strong> {$nome} {$cognome}</p>
            <p style="margin:4px 0;font-size:14px;color:#e0e0e0;"><strong>Tappa:</strong> {$tappa}</p>
        </td></tr>
        </table>

        <p style="color:#8a8a9a;font-size:13px;line-height:1.7;margin:20px 0 0;">Ti aspettiamo! Per qualsiasi domanda, contattaci a <a href="mailto:info@savinodelbenevolley.it" style="color:#C8A959;">info@savinodelbenevolley.it</a>.</p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:20px 28px;border-top:1px solid rgba(200,169,89,0.1);text-align:center;">
        <p style="margin:0;font-size:11px;color:#8a8a9a;line-height:1.6;">Pallavolo Scandicci Savino Del Bene ssdrl<br>Via Benozzo Gozzoli, 5/6 — 50018 Scandicci (FI)</p>
    </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
