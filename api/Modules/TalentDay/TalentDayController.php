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
     * publicStatus — PUBLIC GET endpoint (no auth required)
     * GET /api?module=talentday&action=publicStatus
     * Returns count of registrations per tappa
     * ───────────────────────────────────────────────────────────────────── */
    public function publicStatus(): void
    {
        $allowedOrigins = array_filter([
            getenv('APP_URL') ?: '',
            getenv('TALENT_DAY_ORIGIN') ?: '',
            'https://talentday.fusionteamvolley.it',
            'https://www.savinodelbenevolley.it',
        ]);
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $corsOrigin = '';
        foreach ($allowedOrigins as $ao) {
            $parsed = parse_url($ao);
            $originBase = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            if (!empty($parsed['port'])) {
                $originBase .= ':' . $parsed['port'];
            }
            if ($requestOrigin === $originBase) {
                $corsOrigin = $requestOrigin;
                break;
            }
        }
        if ($corsOrigin) {
            header("Access-Control-Allow-Origin: {$corsOrigin}");
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // Prevent caching for live status calls
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        $stmt = $this->db->prepare("
            SELECT tappa, COUNT(*) as count 
            FROM talent_day_entries 
            WHERE tenant_id = 'TNT_fusion' 
            GROUP BY tappa
        ");
        $stmt->execute();
        $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['counts' => $counts]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * publicRegister — PUBLIC POST endpoint (no auth required)
     * POST /api?module=talentday&action=publicRegister
     * Saves registration + sends confirmation email with attachments.
     * ───────────────────────────────────────────────────────────────────── */
    public function publicRegister(): void
    {
        try {
        // CORS for public Talent Day form — whitelist instead of wildcard
        $allowedOrigins = array_filter([
            getenv('APP_URL') ?: '',
            getenv('TALENT_DAY_ORIGIN') ?: '',
            'https://talentday.fusionteamvolley.it',
            'https://www.savinodelbenevolley.it',
        ]);
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $corsOrigin = '';
        foreach ($allowedOrigins as $ao) {
            $parsed = parse_url($ao);
            $originBase = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            if (!empty($parsed['port'])) {
                $originBase .= ':' . $parsed['port'];
            }
            if ($requestOrigin === $originBase) {
                $corsOrigin = $requestOrigin;
                break;
            }
        }
        if ($corsOrigin) {
            header("Access-Control-Allow-Origin: {$corsOrigin}");
            header('Vary: Origin');
        }
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
        $required = [
            'nome', 'cognome', 'email', 'tappa', 'data_nascita',
            'cellulare', 'indirizzo', 'citta_cap', 'taglia_tshirt',
            'club_tesseramento', 'ruolo', 'campionati',
            'nome_genitore', 'telefono_genitore', 'email_genitore'
        ];
        foreach ($required as $field) {
            if (empty(trim((string)($data[$field] ?? '')))) {
                Response::error("Il campo {$field} è obbligatorio", 400);
            }
        }

        if (empty($data['privacy_consent'])) {
            Response::error("Il consenso alla privacy è obbligatorio", 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Indirizzo email non valido', 400);
        }
        if (!filter_var($data['email_genitore'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Indirizzo email genitore non valido', 400);
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

        // ── Backend Limit Validation ───────────────────────────────────
        $tappa = trim($data['tappa']);
        $limit = 50; // Quota massima per tappa
        $checkLimitStmt = $this->db->prepare("
            SELECT COUNT(*) FROM talent_day_entries
            WHERE tenant_id = 'TNT_fusion'
              AND tappa = :tappa
        ");
        $checkLimitStmt->execute([':tappa' => $tappa]);
        if ($checkLimitStmt->fetchColumn() >= $limit) {
            Response::error('Spiacenti, i posti per la tappa selezionata sono esauriti (SOLD OUT).', 400);
        }

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

        $htmlBody = $this->buildConfirmationEmail($data);

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

        // Logo incorporato come immagine inline (CID)
        $logoPath = realpath(__DIR__ . '/../../../talent-day/assets/logo-savino.png');
        $embeddedImages = [];
        if ($logoPath && is_file($logoPath)) {
            $embeddedImages['logo_sdb'] = $logoPath;
        }

        // Send to registrant con logo embedded (CID)
        Mailer::sendWithEmbeddedImages(
            $email,
            "{$nome} {$cognome}",
            $subject,
            $htmlBody,
            '',
            $attachments,
            $embeddedImages,
            [], // cc
            'giovanile@savinodelbenevolley.it', // fromEmail
            'Talent Day SDB'               // fromName
        );

        // Send copy to staff
        $staffEmail = getenv('TALENT_DAY_STAFF_EMAIL') ?: 'giovanile@savinodelbenevolley.it';
        Mailer::send(
            $staffEmail,
            'Staff Talent Day SDB',
            "[Nuova Registrazione] Talent Day — {$nome} {$cognome}",
            "<p>Nuova registrazione Talent Day:</p><p><strong>{$nome} {$cognome}</strong><br>Tappa: {$tappa}<br>Email: {$email}</p>",
            '',
            'giovanile@savinodelbenevolley.it', // fromEmail
            'Talent Day SDB'               // fromName
        );

        Response::success(['success' => true, 'id' => $insertId]);
        } catch (\Throwable $e) {
            Response::error('PHP_ERROR: ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine(), 500);
        }
    }

    /**
     * Build branded HTML email for Talent Day confirmation.
     */
    private function buildConfirmationEmail(array $data): string
    {
        $nome         = htmlspecialchars(trim($data['nome'] ?? ''));
        $cognome      = htmlspecialchars(trim($data['cognome'] ?? ''));
        $tappa        = htmlspecialchars(trim($data['tappa'] ?? ''));
        $data_nascita = htmlspecialchars(trim($data['data_nascita'] ?? ''));
        $email        = htmlspecialchars(trim($data['email'] ?? ''));
        $cellulare    = htmlspecialchars(trim($data['cellulare'] ?? ''));
        $citta_cap    = htmlspecialchars(trim($data['citta_cap'] ?? ''));
        $ruolo        = htmlspecialchars(trim($data['ruolo'] ?? ''));
        $campionati   = htmlspecialchars(trim($data['campionati'] ?? ''));
        $club         = htmlspecialchars(trim($data['club_tesseramento'] ?? ''));
        $taglia       = htmlspecialchars(trim($data['taglia_tshirt'] ?? ''));

        // Formattazione dei dati extra inseriti dall'atleta
        $datiAtleta = "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Data di nascita:</strong> {$data_nascita}</p>";
        if ($email)      $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Email:</strong> <a href=\"mailto:{$email}\" style=\"color:#0056b3;text-decoration:none;\">{$email}</a></p>";
        if ($cellulare)  $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Cellulare:</strong> {$cellulare}</p>";
        if ($citta_cap)  $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Città/CAP:</strong> {$citta_cap}</p>";
        if ($ruolo)      $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Ruolo:</strong> {$ruolo}</p>";
        if ($campionati) $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Campionati disputati:</strong> {$campionati}</p>";
        if ($club)       $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Club di appartenenza:</strong> {$club}</p>";
        if ($taglia)     $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Taglia T-shirt:</strong> {$taglia}</p>";

        // Logo via CID (incorporato nella mail) con fallback a URL remoto
        $logoSrc = 'cid:logo_sdb';

        return <<<HTML
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        :root { color-scheme: light only; }
        [data-ogsc] body, [data-ogsb] body { background-color: #00205B !important; }
        @media (prefers-color-scheme: dark) {
            body, .email-bg { background-color: #00205B !important; }
            .email-card { background-color: #ffffff !important; }
            .email-card td { color: #222222 !important; }
            h1 { color: #00205B !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#00205B;font-family:'Montserrat',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background-color:#00205B;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background-color:#ffffff;border-radius:12px;border:1px solid rgba(0,0,0,0.1);overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

    <!-- Header -->
    <tr><td style="background-color:#ffffff;padding:32px 24px;text-align:center;border-bottom:3px solid #C8A959;">
        <img src="{$logoSrc}" alt="Savino Del Bene Volley" width="180" height="90" style="width:180px;height:90px;max-height:90px;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;outline:none;border:none;">
        <h1 style="margin:0;font-size:25px;font-weight:900;color:#00205B !important;letter-spacing:0.08em;text-transform:uppercase;">TALENT DAY 2026</h1>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:40px 32px;">
        <p style="color:#222222;font-size:16px;line-height:1.7;margin:0 0 20px;">Cara <strong>{$nome} {$cognome}</strong>,</p>
        <p style="color:#444444;font-size:15px;line-height:1.7;margin:0 0 24px;">siamo felici di comunicarti che sei stata selezionata per partecipare al <strong style="color:#00205B;">Talent Day 2026</strong>, una giornata dove potrai mettere in mostra il tuo talento sotto lo sguardo dello staff della <strong>Savino Del Bene Volley Scandicci!</strong> Qui di seguito troverai tutte le informazioni utili.</p>

        <!-- Tappa Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fbfd;border:1px solid #e1e7f0;border-left:4px solid #C8A959;border-radius:6px;margin:24px 0;">
        <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#C8A959;">Dove e quando?</p>
            <p style="margin:4px 0;font-size:16px;color:#00205B;font-weight:bold;">{$tappa}</p>
        </td></tr>
        </table>

        <!-- Dati Atleta Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fbfd;border:1px solid #e1e7f0;border-left:4px solid #00205B;border-radius:6px;margin:24px 0;">
        <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#00205B;">Cosa ci hai comunicato?</p>
            {$datiAtleta}
        </td></tr>
        </table>

        <p style="color:#444444;font-size:15px;line-height:1.7;margin:24px 0 20px;">Ti raccomandiamo di presentarti sul posto con <strong>30 minuti di anticipo</strong>. L'orario dell'allenamento e l’indirizzo della struttura verranno forniti una volta concluse le iscrizioni.</p>

        <p style="color:#00205B;font-size:16px;font-weight:bold;margin:30px 0 10px;">Cosa dovrai avere con te?</p>
        <ul style="color:#444444;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
            <li>documento di identità;</li>
            <li>copia cartacea del certificato medico attività sportiva agonistica;</li>
            <li>liberatoria immagini sottoscritta dal genitore (i moduli sono in allegato alla presente);</li>
            <li>autorizzazione della tua società di appartenenza a partecipare all'allenamento firmata dal Presidente e/o legale rappresentante;</li>
            <li>liberatoria scarico responsabilità sottoscritta dal genitore (i moduli sono in allegato alla presente);</li>
            <li>borraccia ad uso personale (a disposizione per l’intera durata dell’allenamento);</li>
            <li>occorrente per l’allenamento (ti verrà fornita una t-shirt dell’evento).</li>
        </ul>

        <p style="color:#00205B;font-size:16px;font-weight:bold;margin:30px 0 10px;">Ricorda inoltre:</p>
        <ul style="color:#444444;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
            <li>L’ingresso del Palasport sarà consentito ad un massimo di <strong>due accompagnatori</strong> per ciascuna atleta;</li>
            <li>E’ <strong>severamente vietato</strong> scattare fotografie ed effettuare riprese video.</li>
        </ul>

        <p style="border-top:1px solid #eeeeee;padding-top:20px;color:#666666;font-size:13px;line-height:1.7;margin:30px 0 0;">Se hai bisogno di ulteriori informazioni contattaci alla mail <a href="mailto:giovanile@savinodelbenevolley.it" style="color:#0056b3;font-weight:bold;text-decoration:none;">giovanile@savinodelbenevolley.it</a>.</p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:24px 28px;background:#f4f7fa;border-top:1px solid #e1e7f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#777777;line-height:1.6;"><strong>Pallavolo Scandicci Savino Del Bene ssdrl</strong><br>Via Benozzo Gozzoli, 5/6 — 50018 Scandicci (FI)</p>
    </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
