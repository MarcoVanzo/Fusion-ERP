<?php

declare(strict_types=1);

namespace FusionERP\Modules\OpenDay;

use PDO;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Mailer;

class OpenDayController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /* ─────────────────────────────────────────────────────────────────────
     * listEntries — GET all Open Day registrations for current tenant
     * ───────────────────────────────────────────────────────────────────── */
    public function listEntries(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $annata = isset($_GET['annata']) ? (int)$_GET['annata'] : (int)date('Y');

        $stmt = $this->db->prepare("
            SELECT id, annata, data_registrazione, ora_registrazione, email,
                   nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                   taglia_tshirt, club_tesseramento, ruolo, campionati,
                   nome_genitore, telefono_genitore, email_genitore, privacy_consent,
                   altezza, reach_cm, salto_rincorsa_1, salto_rincorsa_2, salto_rincorsa_3,
                   created_at
            FROM open_day_entries
            WHERE tenant_id = :tenant_id AND annata = :annata
            ORDER BY created_at DESC
            LIMIT 500
        ");
        $stmt->execute([':tenant_id' => $tenantId, ':annata' => $annata]);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch all distinct years for the dropdown
        $yearsStmt = $this->db->prepare("SELECT DISTINCT annata FROM open_day_entries WHERE tenant_id = :tid ORDER BY annata DESC");
        $yearsStmt->execute([':tid' => $tenantId]);
        $years = $yearsStmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array((string)$annata, $years) && !in_array($annata, $years)) {
            $years[] = $annata;
            rsort($years);
        }

        Response::success([
            'entries'       => $entries,
            'count'         => count($entries),
            'annata'        => $annata,
            'available_years' => array_map('intval', $years),
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * addEntry — POST insert a new Open Day registration
     * ───────────────────────────────────────────────────────────────────── */
    public function addEntry(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['nome']) || empty($data['cognome'])) {
            Response::error('Nome e cognome obbligatori', 400);
        }

        $annata = !empty($data['annata']) ? (int)$data['annata'] : (int)date('Y');

        $stmt = $this->db->prepare("
            INSERT INTO open_day_entries
                (tenant_id, annata, data_registrazione, ora_registrazione, email,
                 nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                 taglia_tshirt, club_tesseramento, ruolo, campionati,
                 nome_genitore, telefono_genitore, email_genitore, privacy_consent,
                 altezza, reach_cm, salto_rincorsa_1, salto_rincorsa_2, salto_rincorsa_3)
            VALUES
                (:tenant_id, :annata, :data_reg, :ora_reg, :email,
                 :nome, :cognome, :indirizzo, :citta_cap, :data_nascita, :cellulare,
                 :taglia, :club, :ruolo, :campionati,
                 :nome_gen, :tel_gen, :email_gen, :privacy_consent,
                 :altezza, :reach_cm, :salto_rincorsa_1, :salto_rincorsa_2, :salto_rincorsa_3)
        ");

        $stmt->execute([
            ':tenant_id'    => $tenantId,
            ':annata'       => $annata,
            ':data_reg'     => !empty($data['data_registrazione']) ? $data['data_registrazione'] : null,
            ':ora_reg'      => !empty($data['ora_registrazione'])  ? $data['ora_registrazione']  : null,
            ':email'        => $data['email'] ?? null,
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
            ':reach_cm'     => !empty($data['reach_cm'])       ? (float)$data['reach_cm']       : null,
            ':salto_rincorsa_1' => !empty($data['salto_rincorsa_1']) ? (float)$data['salto_rincorsa_1'] : null,
            ':salto_rincorsa_2' => !empty($data['salto_rincorsa_2']) ? (float)$data['salto_rincorsa_2'] : null,
            ':salto_rincorsa_3' => !empty($data['salto_rincorsa_3']) ? (float)$data['salto_rincorsa_3'] : null,
        ]);

        Response::success(['success' => true, 'id' => $this->db->lastInsertId()]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * updateEntry — POST update an existing Open Day registration
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
            UPDATE open_day_entries SET
                data_registrazione = :data_reg,
                ora_registrazione  = :ora_reg,
                email              = :email,
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
                reach_cm           = :reach_cm,
                salto_rincorsa_1   = :salto_rincorsa_1,
                salto_rincorsa_2   = :salto_rincorsa_2,
                salto_rincorsa_3   = :salto_rincorsa_3
            WHERE id = :id AND tenant_id = :tenant_id
        ");

        $stmt->execute([
            ':id'           => (int)$data['id'],
            ':tenant_id'    => $tenantId,
            ':data_reg'     => !empty($data['data_registrazione']) ? $data['data_registrazione'] : null,
            ':ora_reg'      => !empty($data['ora_registrazione'])  ? $data['ora_registrazione']  : null,
            ':email'        => $data['email'] ?? null,
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
            ':reach_cm'     => !empty($data['reach_cm'])       ? (float)$data['reach_cm']       : null,
            ':salto_rincorsa_1' => !empty($data['salto_rincorsa_1']) ? (float)$data['salto_rincorsa_1'] : null,
            ':salto_rincorsa_2' => !empty($data['salto_rincorsa_2']) ? (float)$data['salto_rincorsa_2'] : null,
            ':salto_rincorsa_3' => !empty($data['salto_rincorsa_3']) ? (float)$data['salto_rincorsa_3'] : null,
        ]);

        if ($stmt->rowCount() === 0) {
            $check = $this->db->prepare("SELECT id FROM open_day_entries WHERE id = ? AND tenant_id = ?");
            $check->execute([(int)$data['id'], $tenantId]);
            if (!$check->fetchColumn()) {
                Response::error('Registrazione non trovata', 404);
            }
        }

        Response::success(['success' => true]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * deleteEntry — POST delete an Open Day registration
     * ───────────────────────────────────────────────────────────────────── */
    public function deleteEntry(): void
    {
        Auth::requireRole('allenatore');
        $tenantId = TenantContext::id();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['id'])) {
            Response::error('ID obbligatorio', 400);
        }

        $stmt = $this->db->prepare("DELETE FROM open_day_entries WHERE id = :id AND tenant_id = :tenant_id");
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
     * Returns count of registrations for the single Open Day event
     * ───────────────────────────────────────────────────────────────────── */
    public function publicStatus(): void
    {
        $allowedOrigins = array_filter([
            getenv('APP_URL') ?: '',
            'https://fusionteamvolley.it',
            'https://www.fusionteamvolley.it',
        ]);
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $corsOrigin = '';
        foreach ($allowedOrigins as $ao) {
            $parsed = parse_url($ao);
            $originBase = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            if (!empty($parsed['port'])) $originBase .= ':' . $parsed['port'];
            if ($requestOrigin === $originBase) { $corsOrigin = $requestOrigin; break; }
        }
        if ($corsOrigin) {
            header("Access-Control-Allow-Origin: {$corsOrigin}");
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

        header('Cache-Control: no-cache, no-store, must-revalidate');

        $annata = isset($_GET['annata']) ? (int)$_GET['annata'] : (int)date('Y');

        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count FROM open_day_entries WHERE tenant_id = 'TNT_fusion' AND annata = :annata
        ");
        $stmt->execute([':annata' => $annata]);
        $count = (int)$stmt->fetchColumn();

        Response::success(['count' => $count, 'limit' => 50, 'annata' => $annata]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * publicRegister — PUBLIC POST endpoint (no auth required)
     * Saves registration + sends confirmation email.
     * ───────────────────────────────────────────────────────────────────── */
    public function publicRegister(): void
    {
        try {
        // CORS
        $allowedOrigins = array_filter([
            getenv('APP_URL') ?: '',
            'https://fusionteamvolley.it',
            'https://www.fusionteamvolley.it',
        ]);
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $corsOrigin = '';
        foreach ($allowedOrigins as $ao) {
            $parsed = parse_url($ao);
            $originBase = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            if (!empty($parsed['port'])) $originBase .= ':' . $parsed['port'];
            if ($requestOrigin === $originBase) { $corsOrigin = $requestOrigin; break; }
        }
        if ($corsOrigin) {
            header("Access-Control-Allow-Origin: {$corsOrigin}");
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { Response::error('Dati non validi', 400); }

        // Validation (no tappa required)
        $required = [
            'nome', 'cognome', 'email', 'data_nascita',
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

        // Date of birth validation
        $dob = trim($data['data_nascita'] ?? '');
        $dobDate = \DateTime::createFromFormat('Y-m-d', $dob);
        if (!$dobDate || $dobDate->format('Y-m-d') !== $dob) {
            Response::error('Data di nascita non valida', 400);
        }
        $year = (int)$dobDate->format('Y');
        if ($year < 1900 || $year > (int)date('Y')) {
            Response::error('Anno di nascita non valido', 400);
        }

        // Annata from payload or current year
        $annata = !empty($data['annata']) ? (int)$data['annata'] : (int)date('Y');

        // Quota check (per annata, max 50)
        $limit = 50;
        $checkLimitStmt = $this->db->prepare("
            SELECT COUNT(*) FROM open_day_entries WHERE tenant_id = 'TNT_fusion' AND annata = :annata
        ");
        $checkLimitStmt->execute([':annata' => $annata]);
        if ($checkLimitStmt->fetchColumn() >= $limit) {
            Response::error('Spiacenti, i posti per l\'Open Day sono esauriti (SOLD OUT).', 400);
        }

        // Insert
        $now = date('Y-m-d H:i:s');
        $time = date('H:i:s');

        $stmt = $this->db->prepare("
            INSERT INTO open_day_entries
                (tenant_id, annata, data_registrazione, ora_registrazione, email,
                 nome, cognome, indirizzo, citta_cap, data_nascita, cellulare,
                 taglia_tshirt, club_tesseramento, ruolo, campionati,
                 nome_genitore, telefono_genitore, email_genitore, privacy_consent)
            VALUES
                ('TNT_fusion', :annata, :data_reg, :ora_reg, :email,
                 :nome, :cognome, :indirizzo, :citta_cap, :data_nascita, :cellulare,
                 :taglia, :club, :ruolo, :campionati,
                 :nome_gen, :tel_gen, :email_gen, :privacy_consent)
        ");

        $stmt->execute([
            ':annata'       => $annata,
            ':data_reg'     => $now,
            ':ora_reg'      => $time,
            ':email'        => trim($data['email']),
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

        // Send confirmation email
        $nome    = htmlspecialchars(trim($data['nome']));
        $cognome = htmlspecialchars(trim($data['cognome']));
        $email   = trim($data['email']);

        $subject = 'Conferma Registrazione — Open Day Fusion Team Volley';
        $htmlBody = $this->buildConfirmationEmail($data);

        // Attachments from open-day/attachments/ directory (same docs as Talent Day)
        $attachDir = realpath(__DIR__ . '/../../../open-day/attachments');
        $attachments = [];
        if ($attachDir && is_dir($attachDir)) {
            foreach (glob($attachDir . '/*') as $file) {
                if (is_file($file) && !str_contains(basename($file), '.DS_Store')) {
                    $attachments[] = $file;
                }
            }
        }

        $staffEmail = getenv('OPEN_DAY_STAFF_EMAIL') ?: 'info@fusionteamvolley.it';

        // Logo incorporato come immagine inline (CID)
        $logoPath = realpath(__DIR__ . '/../../../open-day/assets/logo-fusion.png');
        $embeddedImages = [];
        if ($logoPath && is_file($logoPath)) {
            $embeddedImages['logo_fusion'] = $logoPath;
        }

        Mailer::sendWithEmbeddedImages(
            $email,
            "{$nome} {$cognome}",
            $subject,
            $htmlBody,
            '',
            $attachments,
            $embeddedImages,
            [], // cc
            $staffEmail,
            'Fusion Team Volley'
        );

        // Staff copy (no attachments needed)
        Mailer::send(
            $staffEmail,
            'Staff Open Day',
            "[Nuova Registrazione] Open Day — {$nome} {$cognome}",
            "<p>Nuova registrazione Open Day:</p><p><strong>{$nome} {$cognome}</strong><br>Email: {$email}</p>",
            '',
            $staffEmail,
            'Fusion Team Volley'
        );

        Response::success(['success' => true, 'id' => $insertId]);
        } catch (\Throwable $e) {
            Response::error('PHP_ERROR: ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine(), 500);
        }
    }

    /**
     * Build branded HTML email for Open Day confirmation.
     */
    private function buildConfirmationEmail(array $data): string
    {
        $nome         = htmlspecialchars(trim($data['nome'] ?? ''));
        $cognome      = htmlspecialchars(trim($data['cognome'] ?? ''));
        $data_nascita = htmlspecialchars(trim($data['data_nascita'] ?? ''));
        $email        = htmlspecialchars(trim($data['email'] ?? ''));
        $cellulare    = htmlspecialchars(trim($data['cellulare'] ?? ''));
        $citta_cap    = htmlspecialchars(trim($data['citta_cap'] ?? ''));
        $ruolo        = htmlspecialchars(trim($data['ruolo'] ?? ''));
        $campionati   = htmlspecialchars(trim($data['campionati'] ?? ''));
        $club         = htmlspecialchars(trim($data['club_tesseramento'] ?? ''));
        $taglia       = htmlspecialchars(trim($data['taglia_tshirt'] ?? ''));

        // Build data rows as table rows for clean alignment
        $rows = '';
        $fields = [
            ['📅', 'Data di nascita', $data_nascita],
            ['📧', 'Email', $email],
            ['📱', 'Cellulare', $cellulare],
            ['📍', 'Città/CAP', $citta_cap],
            ['🏐', 'Ruolo', $ruolo],
            ['🏆', 'Campionati', $campionati],
            ['🏠', 'Club', $club],
            ['👕', 'Taglia T-shirt', $taglia],
        ];
        foreach ($fields as $f) {
            if (!empty($f[2])) {
                $rows .= "<tr><td style='padding:6px 12px;font-size:13px;color:#999;white-space:nowrap;vertical-align:top;'>{$f[0]} {$f[1]}</td><td style='padding:6px 12px;font-size:14px;color:#ffffff;font-weight:600;'>{$f[2]}</td></tr>";
            }
        }

        $logoSrc = 'cid:logo_fusion';

        return <<<HTML
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <style>
        :root { color-scheme: light dark; }
        @media (prefers-color-scheme: dark) {
            .email-card { background-color: #18181b !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Montserrat','Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;">
<tr><td align="center" style="padding:32px 16px;">

<!-- Main Card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="email-card" style="background-color:#18181b;border-radius:16px;overflow:hidden;border:1px solid #27272a;">

    <!-- ═══ HEADER: Dark with logo + gradient bar ═══ -->
    <tr><td style="background:linear-gradient(135deg,#18181b 0%,#1e1024 100%);padding:40px 32px 30px;text-align:center;">
        <img src="{$logoSrc}" alt="Fusion Team Volley" width="80" height="80" style="width:80px;height:80px;border-radius:50%;border:2px solid rgba(217,70,239,0.4);display:block;margin:0 auto 20px;outline:none;">
        <h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:0.06em;text-transform:uppercase;">OPEN <span style="color:#D946EF;">DAY</span></h1>
        <p style="margin:6px 0 0;font-size:15px;color:#a1a1aa;letter-spacing:0.15em;text-transform:uppercase;">2026 — Fusion Team Volley</p>
    </td></tr>

    <!-- Gradient accent bar -->
    <tr><td style="height:4px;background:linear-gradient(90deg,#D946EF,#a855f7,#D946EF);"></td></tr>

    <!-- ═══ BODY ═══ -->
    <tr><td style="padding:40px 32px;">

        <!-- Greeting -->
        <p style="color:#e4e4e7;font-size:17px;line-height:1.7;margin:0 0 20px;">Ciao <strong style="color:#ffffff;">{$nome} {$cognome}</strong>,</p>
        <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 28px;">siamo felici di confermarti che la tua registrazione all'<strong style="color:#D946EF;">Open Day 2026</strong> è andata a buon fine! Ti aspettiamo per un pomeriggio di sport, divertimento e talento.</p>

        <!-- ═══ Event Info Card ═══ -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1024 0%,#18181b 100%);border:1px solid #D946EF;border-radius:12px;margin:0 0 28px;">
        <tr><td style="padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="56" valign="top" style="padding-right:16px;">
                        <div style="width:48px;height:48px;background:rgba(217,70,239,0.15);border:1px solid rgba(217,70,239,0.3);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">📅</div>
                    </td>
                    <td valign="top">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#D946EF;">Dove e quando</p>
                        <p style="margin:0 0 4px;font-size:18px;color:#ffffff;font-weight:800;">Mercoledì 27 Maggio 2026</p>
                        <p style="margin:0;font-size:14px;color:#a1a1aa;">📍 Palavega — Trivignano (VE) &nbsp;·&nbsp; 🕐 Ore 17:00 – 20:00</p>
                    </td>
                </tr>
            </table>
        </td></tr>
        </table>

        <!-- ═══ Your Data Card ═══ -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #27272a;border-radius:12px;margin:0 0 28px;">
        <tr><td style="padding:20px 16px;">
            <p style="margin:0 0 12px;padding-left:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#D946EF;">I tuoi dati</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                {$rows}
            </table>
        </td></tr>
        </table>

        <!-- ═══ Anticipo notice ═══ -->
        <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 28px;">Ti raccomandiamo di presentarti sul posto con <strong style="color:#ffffff;">30 minuti di anticipo</strong>. L'orario dell'allenamento e l'indirizzo della struttura verranno forniti una volta concluse le iscrizioni.</p>

        <!-- ═══ Checklist Card ═══ -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #27272a;border-radius:12px;margin:0 0 28px;">
        <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 16px;font-size:15px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:0.05em;">🎒 Cosa dovrai avere con te</p>
            <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#d4d4d8;line-height:1.8;">
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Documento di identità</td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Copia cartacea del certificato medico attività sportiva agonistica</td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Liberatoria immagini sottoscritta dal genitore <span style="color:#71717a;">(in allegato)</span></td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Autorizzazione della società a partecipare, firmata dal Presidente</td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Liberatoria scarico responsabilità dal genitore <span style="color:#71717a;">(in allegato)</span></td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Borraccia ad uso personale</td></tr>
                <tr><td style="padding:3px 0;"><span style="color:#D946EF;font-weight:bold;margin-right:8px;">✓</span> Occorrente per l'allenamento <span style="color:#71717a;">(t-shirt evento inclusa!)</span></td></tr>
            </table>
        </td></tr>
        </table>

        <!-- ═══ Rules Warning Box ═══ -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(217,70,239,0.08);border:1px solid rgba(217,70,239,0.25);border-radius:12px;margin:0 0 28px;">
        <tr><td style="padding:20px 28px;">
            <p style="margin:0 0 10px;font-size:14px;font-weight:800;color:#D946EF;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Ricorda inoltre</p>
            <p style="margin:4px 0;font-size:14px;color:#d4d4d8;line-height:1.7;">• L'ingresso del Palasport è consentito ad un massimo di <strong style="color:#ffffff;">due accompagnatori</strong> per ciascuna atleta.</p>
            <p style="margin:4px 0;font-size:14px;color:#d4d4d8;line-height:1.7;">• È <strong style="color:#ffffff;">severamente vietato</strong> scattare fotografie ed effettuare riprese video.</p>
        </td></tr>
        </table>

        <!-- Contact -->
        <p style="border-top:1px solid #27272a;padding-top:24px;color:#71717a;font-size:13px;line-height:1.7;margin:0;">Per informazioni contattaci a <a href="mailto:recruiting@fusionteamvolley.it" style="color:#D946EF;font-weight:bold;text-decoration:none;">recruiting@fusionteamvolley.it</a></p>

    </td></tr>

    <!-- ═══ FOOTER ═══ -->
    <tr><td style="height:3px;background:linear-gradient(90deg,#D946EF,#a855f7,#D946EF);"></td></tr>
    <tr><td style="padding:24px 28px;background:#111113;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:#ffffff;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Fusion Team Volley ASD</p>
        <p style="margin:0;font-size:12px;color:#71717a;">Trivignano (VE) · fusionteamvolley.it</p>
    </td></tr>

</table>

</td></tr></table>
</body></html>
HTML;
    }
}

