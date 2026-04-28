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

        $staffEmail = getenv('OPEN_DAY_STAFF_EMAIL') ?: 'info@fusionteamvolley.it';

        Mailer::send(
            $email,
            "{$nome} {$cognome}",
            $subject,
            $htmlBody,
            '',
            $staffEmail,
            'Fusion Team Volley'
        );

        // Staff copy
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

        $datiAtleta = "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Data di nascita:</strong> {$data_nascita}</p>";
        if ($email)      $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Email:</strong> {$email}</p>";
        if ($cellulare)  $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Cellulare:</strong> {$cellulare}</p>";
        if ($citta_cap)  $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Città/CAP:</strong> {$citta_cap}</p>";
        if ($ruolo)      $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Ruolo:</strong> {$ruolo}</p>";
        if ($campionati) $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Campionati:</strong> {$campionati}</p>";
        if ($club)       $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Club:</strong> {$club}</p>";
        if ($taglia)     $datiAtleta .= "<p style='margin:4px 0;font-size:14px;color:#333333;'><strong>Taglia T-shirt:</strong> {$taglia}</p>";

        return <<<HTML
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Montserrat',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <tr><td style="background-color:#ffffff;padding:32px 24px;text-align:center;border-bottom:3px solid #D946EF;">
        <h1 style="margin:0;font-size:25px;font-weight:900;color:#0f172a;letter-spacing:0.08em;text-transform:uppercase;">OPEN DAY 2026</h1>
        <p style="margin:8px 0 0;font-size:14px;color:#64748b;">Fusion Team Volley</p>
    </td></tr>
    <tr><td style="padding:40px 32px;">
        <p style="color:#222;font-size:16px;line-height:1.7;margin:0 0 20px;">Ciao <strong>{$nome} {$cognome}</strong>,</p>
        <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">la tua registrazione all'<strong style="color:#0f172a;">Open Day 2026</strong> della Fusion Team Volley è stata confermata!</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf4ff;border:1px solid #f0abfc;border-left:4px solid #D946EF;border-radius:6px;margin:24px 0;">
        <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#D946EF;">Dove e quando?</p>
            <p style="margin:4px 0;font-size:16px;color:#0f172a;font-weight:bold;">27 Maggio 2026 — Palavega, Trivignano</p>
            <p style="margin:4px 0;font-size:14px;color:#64748b;">Ore 17:00 – 20:00</p>
        </td></tr></table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0f172a;border-radius:6px;margin:24px 0;">
        <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#0f172a;">I tuoi dati</p>
            {$datiAtleta}
        </td></tr></table>
        <p style="color:#444;font-size:15px;line-height:1.7;margin:24px 0 20px;">Ti raccomandiamo di presentarti con <strong>30 minuti di anticipo</strong>.</p>
        <p style="border-top:1px solid #eee;padding-top:20px;color:#666;font-size:13px;line-height:1.7;margin:30px 0 0;">Per informazioni contattaci a <a href="mailto:info@fusionteamvolley.it" style="color:#D946EF;font-weight:bold;text-decoration:none;">info@fusionteamvolley.it</a>.</p>
    </td></tr>
    <tr><td style="padding:24px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#777;line-height:1.6;"><strong>Fusion Team Volley ASD</strong><br>Trivignano (VE)</p>
    </td></tr>
</table>
</td></tr></table>
</body></html>
HTML;
    }
}
