<?php
/**
 * Federation Controller — Tesseramenti & RASD
 * Fusion ERP v1.0
 *
 * Per-athlete federation card tracking, RASD registration,
 * batch export for federation portals.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Federation;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Database;
use PDO;

class FederationController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── DASHBOARD ────────────────────────────────────────────────────────────

    /**
     * GET /api/?module=federation&action=dashboard
     */
    public function dashboard(): void
    {
        Auth::requireRead('federation');
        $tid = TenantContext::id();

        // Card counts by status
        $stmt = $this->db->prepare(
            'SELECT status, COUNT(*) AS cnt
             FROM federation_cards WHERE tenant_id = :tid
             GROUP BY status'
        );
        $stmt->execute([':tid' => $tid]);
        $statusCounts = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $statusCounts[$row['status']] = (int)$row['cnt'];
        }

        // Cards by federation
        $fedStmt = $this->db->prepare(
            'SELECT federation, COUNT(*) AS cnt
             FROM federation_cards WHERE tenant_id = :tid
             GROUP BY federation ORDER BY cnt DESC'
        );
        $fedStmt->execute([':tid' => $tid]);
        $byFederation = $fedStmt->fetchAll(PDO::FETCH_ASSOC);

        // Expiring soon (30 days)
        $expStmt = $this->db->prepare(
            'SELECT fc.id, fc.card_number, fc.federation, fc.expires_at,
                    a.first_name, a.last_name
             FROM federation_cards fc
             JOIN athletes a ON a.id = fc.athlete_id
             WHERE fc.tenant_id = :tid AND fc.status = \'active\'
               AND fc.expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
             ORDER BY fc.expires_at'
        );
        $expStmt->execute([':tid' => $tid]);
        $expiring = $expStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($expiring as &$e) {
            $e['athlete_name'] = trim($e['first_name'] . ' ' . $e['last_name']);
            unset($e['first_name'], $e['last_name']);
        }

        // RASD status
        $rasdStmt = $this->db->prepare(
            'SELECT * FROM rasd_registrations WHERE tenant_id = :tid ORDER BY registration_date DESC LIMIT 1'
        );
        $rasdStmt->execute([':tid' => $tid]);
        $rasd = $rasdStmt->fetch(PDO::FETCH_ASSOC) ?: null;

        Response::success([
            'status_counts' => $statusCounts,
            'by_federation' => $byFederation,
            'expiring_soon' => $expiring,
            'rasd' => $rasd,
            'total_cards' => array_sum($statusCounts),
        ]);
    }

    // ─── CARDS CRUD ───────────────────────────────────────────────────────────

    /**
     * GET /api/?module=federation&action=listCards
     */
    public function listCards(): void
    {
        Auth::requireRead('federation');
        $tid = TenantContext::id();

        $season = filter_input(INPUT_GET, 'season', FILTER_DEFAULT) ?: null;
        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?: null;
        $federation = filter_input(INPUT_GET, 'federation', FILTER_DEFAULT) ?: null;

        $where = 'fc.tenant_id = :tid';
        $params = [':tid' => $tid];

        if ($season) {
            $where .= ' AND fc.season = :season';
            $params[':season'] = $season;
        }
        if ($status) {
            $where .= ' AND fc.status = :status';
            $params[':status'] = $status;
        }
        if ($federation) {
            $where .= ' AND fc.federation = :federation';
            $params[':federation'] = $federation;
        }

        $stmt = $this->db->prepare(
            "SELECT fc.*, a.first_name, a.last_name, a.fiscal_code
             FROM federation_cards fc
             JOIN athletes a ON a.id = fc.athlete_id
             WHERE {$where}
             ORDER BY a.last_name, a.first_name"
        );
        $stmt->execute($params);
        $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cards as &$c) {
            $c['athlete_name'] = trim($c['first_name'] . ' ' . $c['last_name']);
        }

        Response::success($cards);
    }

    /**
     * POST /api/?module=federation&action=createCard
     */
    public function createCard(): void
    {
        $user = Auth::requireWrite('federation');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'federation', 'season']);

        $tid = TenantContext::id();
        $id = 'FC_' . bin2hex(random_bytes(4));

        $stmt = $this->db->prepare(
            'INSERT INTO federation_cards
             (id, tenant_id, athlete_id, federation, card_number, season, card_type,
              status, requested_at, issued_at, expires_at, fee_amount, notes, created_by)
             VALUES (:id, :tid, :aid, :fed, :num, :season, :type,
                     :status, :req, :issued, :exp, :fee, :notes, :uid)'
        );
        $stmt->execute([
            ':id' => $id,
            ':tid' => $tid,
            ':aid' => $body['athlete_id'],
            ':fed' => strtoupper(trim($body['federation'])),
            ':num' => $body['card_number'] ?? null,
            ':season' => $body['season'],
            ':type' => $body['card_type'] ?? 'atleta',
            ':status' => $body['status'] ?? 'pending',
            ':req' => $body['requested_at'] ?? date('Y-m-d'),
            ':issued' => $body['issued_at'] ?? null,
            ':exp' => $body['expires_at'] ?? null,
            ':fee' => $body['fee_amount'] ?? null,
            ':notes' => $body['notes'] ?? null,
            ':uid' => $user['id'],
        ]);

        Audit::log('INSERT', 'federation_cards', $id, null, [
            'athlete_id' => $body['athlete_id'], 'federation' => $body['federation']
        ]);
        Response::success(['id' => $id], 201);
    }

    /**
     * POST /api/?module=federation&action=updateCard
     */
    public function updateCard(): void
    {
        Auth::requireWrite('federation');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $tid = TenantContext::id();
        $id = $body['id'];
        $sets = [];
        $params = [':id' => $id, ':tid' => $tid];

        foreach (['card_number', 'status', 'issued_at', 'expires_at', 'fee_amount', 'fee_paid', 'notes'] as $f) {
            if (isset($body[$f])) {
                $sets[] = "{$f} = :{$f}";
                $params[":{$f}"] = $body[$f];
            }
        }

        if (empty($sets)) {
            Response::error('Nessun campo da aggiornare', 400);
        }

        $sql = 'UPDATE federation_cards SET ' . implode(', ', $sets) . ' WHERE id = :id AND tenant_id = :tid';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            Response::error('Tessera non trovata', 404);
        }

        Audit::log('UPDATE', 'federation_cards', $id);
        Response::success(['id' => $id]);
    }

    // ─── BATCH EXPORT ─────────────────────────────────────────────────────────

    /**
     * GET /api/?module=federation&action=exportBatch
     * Export CSV for federation portal batch import
     */
    public function exportBatch(): void
    {
        Auth::requireRead('federation');
        $tid = TenantContext::id();

        $season = filter_input(INPUT_GET, 'season', FILTER_DEFAULT) ?: '';
        $federation = filter_input(INPUT_GET, 'federation', FILTER_DEFAULT) ?: '';
        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?: 'pending';

        $where = 'fc.tenant_id = :tid';
        $params = [':tid' => $tid];

        if ($season) {
            $where .= ' AND fc.season = :season';
            $params[':season'] = $season;
        }
        if ($federation) {
            $where .= ' AND fc.federation = :federation';
            $params[':federation'] = $federation;
        }
        if ($status !== 'all') {
            $where .= ' AND fc.status = :status';
            $params[':status'] = $status;
        }

        $stmt = $this->db->prepare(
            "SELECT a.last_name, a.first_name, a.fiscal_code, a.birth_date, a.birth_place,
                    a.gender, fc.federation, fc.card_type, fc.season, fc.card_number
             FROM federation_cards fc
             JOIN athletes a ON a.id = fc.athlete_id
             WHERE {$where}
             ORDER BY a.last_name, a.first_name"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Generate CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="tesseramenti_' . ($federation ?: 'all') . '_' . ($season ?: 'all') . '.csv"');

        $fp = fopen('php://output', 'w');
        fputcsv($fp, ['Cognome', 'Nome', 'Codice Fiscale', 'Data Nascita', 'Luogo Nascita', 'Sesso', 'Federazione', 'Tipo', 'Stagione', 'N° Tessera']);
        foreach ($rows as $row) {
            fputcsv($fp, array_values($row));
        }
        fclose($fp);
        exit;
    }

    // ─── RASD ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/?module=federation&action=rasdStatus
     */
    public function rasdStatus(): void
    {
        Auth::requireRead('federation');
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT * FROM rasd_registrations WHERE tenant_id = :tid ORDER BY registration_date DESC'
        );
        $stmt->execute([':tid' => $tid]);

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * POST /api/?module=federation&action=updateRasd
     */
    public function updateRasd(): void
    {
        Auth::requireWrite('federation');
        $body = Response::jsonBody();
        $tid = TenantContext::id();

        $id = $body['id'] ?? null;

        if ($id) {
            // Update existing
            $sets = [];
            $params = [':id' => $id, ':tid' => $tid];
            foreach (['rasd_code', 'status', 'sport_type', 'legal_form', 'affiliated_federation',
            'affiliation_number', 'last_renewal', 'next_renewal', 'notes'] as $f) {
                if (isset($body[$f])) {
                    $sets[] = "{$f} = :{$f}";
                    $params[":{$f}"] = $body[$f];
                }
            }
            if (!empty($sets)) {
                $sql = 'UPDATE rasd_registrations SET ' . implode(', ', $sets) . ' WHERE id = :id AND tenant_id = :tid';
                $this->db->prepare($sql)->execute($params);
            }
        }
        else {
            // Create — validate required fields BEFORE generating the ID
            Response::requireFields($body, ['sport_type', 'legal_form']);
            $id = 'RASD_' . bin2hex(random_bytes(4));

            $stmt = $this->db->prepare(
                'INSERT INTO rasd_registrations
                 (id, tenant_id, rasd_code, registration_date, status, sport_type, legal_form,
                  affiliated_federation, affiliation_number, last_renewal, next_renewal, notes)
                 VALUES (:id, :tid, :code, :dt, :status, :sport, :form, :fed, :affnum, :last, :next, :notes)'
            );
            $stmt->execute([
                ':id' => $id,
                ':tid' => $tid,
                ':code' => $body['rasd_code'] ?? null,
                ':dt' => $body['registration_date'] ?? date('Y-m-d'),
                ':status' => $body['status'] ?? 'active',
                ':sport' => $body['sport_type'],
                ':form' => $body['legal_form'],
                ':fed' => $body['affiliated_federation'] ?? null,
                ':affnum' => $body['affiliation_number'] ?? null,
                ':last' => $body['last_renewal'] ?? null,
                ':next' => $body['next_renewal'] ?? null,
                ':notes' => $body['notes'] ?? null,
            ]);
        }

        Audit::log(($body['id'] ?? null) ? 'UPDATE' : 'INSERT', 'rasd_registrations', $id);
        Response::success(['id' => $id]);
    }
}