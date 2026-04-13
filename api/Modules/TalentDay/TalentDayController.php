<?php

declare(strict_types=1);

namespace FusionERP\Modules\TalentDay;

use PDO;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

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
                   nome_genitore, telefono_genitore, email_genitore,
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
                 nome_genitore, telefono_genitore, email_genitore,
                 altezza, peso, reach_cm, cmj, salto_rincorsa)
            VALUES
                (:tenant_id, :data_reg, :ora_reg, :email, :tappa,
                 :nome, :cognome, :indirizzo, :citta_cap, :data_nascita, :cellulare,
                 :taglia, :club, :ruolo, :campionati,
                 :nome_gen, :tel_gen, :email_gen,
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
}
