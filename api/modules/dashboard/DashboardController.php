<?php
/**
 * Dashboard Controller — Aggregated stats for the dashboard
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Dashboard;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class DashboardController
{
    // ─── GET /api/?module=dashboard&action=summary ─────────────────────────────
    // Endpoint aggregato leggero: restituisce tutti i KPI in una singola query.
    // Sostituisce la precedente chiamata a athletes/list dal frontend.
    public function summary(): void
    {
        Auth::requireAuth();
        $db = Database::getInstance();
        $tid = TenantContext::id();

        // Query unica con aggregazione condizionale — nessun trasferimento dati massiccio
        $stmt = $db->prepare(
            'SELECT
                COUNT(*)                                                AS total_athletes,
                SUM(role             IS NOT NULL AND role <> \'\')      AS with_role,
                SUM(phone            IS NOT NULL AND phone <> \'\')     AS with_phone,
                SUM(email            IS NOT NULL AND email <> \'\')     AS with_email,
                SUM(fiscal_code      IS NOT NULL AND fiscal_code <> \'\') AS with_fiscal,
                SUM(medical_cert_expires_at IS NOT NULL)                AS with_med_cert,
                SUM(residence_address IS NOT NULL AND residence_address <> \'\') AS with_address,
                SUM(residence_city   IS NOT NULL AND residence_city <> \'\') AS with_city,
                SUM(parent_contact   IS NOT NULL AND parent_contact <> \'\') AS with_parent,
                SUM(parent_phone     IS NOT NULL AND parent_phone <> \'\') AS with_parent_ph
             FROM athletes
             WHERE is_active = 1
               AND deleted_at IS NULL
               AND tenant_id = :tid'
        );
        $stmt->execute([':tid' => $tid]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $total = (int)($row['total_athletes'] ?? 0);
        $pct = fn($n) => $total > 0 ? (int)round(((int)$n / $total) * 100) : 0;

        // Conteggio squadre
        $stmtTeams = $db->prepare(
            'SELECT COUNT(*) FROM teams WHERE tenant_id = :tid AND deleted_at IS NULL'
        );
        $stmtTeams->execute([':tid' => $tid]);
        $totalTeams = (int)$stmtTeams->fetchColumn();

        $pcts = [
            $pct($row['with_role']),
            $pct($row['with_phone']),
            $pct($row['with_email']),
            $pct($row['with_fiscal']),
            $pct($row['with_med_cert']),
            $pct($row['with_address']),
            $pct($row['with_city']),
            $pct($row['with_parent']),
            $pct($row['with_parent_ph']),
        ];

        Response::success([
            'total_athletes' => $total,
            'total_teams' => $totalTeams,
            'pct_role' => $pcts[0],
            'pct_phone' => $pcts[1],
            'pct_email' => $pcts[2],
            'pct_fiscal' => $pcts[3],
            'pct_med_cert' => $pcts[4],
            'pct_address' => $pcts[5],
            'pct_city' => $pcts[6],
            'pct_parent' => $pcts[7],
            'pct_parent_ph' => $pcts[8],
            'pct_avg' => (int)round(array_sum($pcts) / count($pcts)),
        ]);
    }

    // ─── GET /api/?module=dashboard&action=stats ──────────────────────────────
    public function stats(): void
    {
        Auth::requireAuth();
        $db = Database::getInstance();
        $tid = TenantContext::id();

        // Total active athletes — scoped to tenant
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM athletes
             WHERE is_active = 1 AND deleted_at IS NULL AND tenant_id = :tid'
        );
        $stmt->execute([':tid' => $tid]);
        $totalAthletes = (int)$stmt->fetchColumn();

        // Upcoming events (next 14 days) — scoped to tenant
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM events
             WHERE status NOT IN (\'cancelled\')
               AND event_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 14 DAY)
               AND deleted_at IS NULL
               AND tenant_id = :tid'
        );
        $stmt->execute([':tid' => $tid]);
        $upcomingEvents = (int)$stmt->fetchColumn();

        // Expiring medical certs (30 days) — scoped to tenant
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM athletes
             WHERE is_active = 1
               AND deleted_at IS NULL
               AND tenant_id = :tid
               AND medical_cert_expires_at IS NOT NULL
               AND medical_cert_expires_at <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)'
        );
        $stmt->execute([':tid' => $tid]);
        $expiringCerts = (int)$stmt->fetchColumn();

        // High-risk ACWR athletes — scoped to tenant via athletes join
        $stmt = $db->prepare(
            'SELECT COUNT(DISTINCT al.athlete_id)
             FROM acwr_alerts al
             JOIN athletes a ON a.id = al.athlete_id
             WHERE al.log_date = CURDATE()
               AND al.risk_level IN (\'high\', \'extreme\')
               AND al.ack_at IS NULL
               AND a.tenant_id = :tid
               AND a.deleted_at IS NULL'
        );
        $stmt->execute([':tid' => $tid]);
        $atRisk = (int)$stmt->fetchColumn();

        Response::success([
            'total_athletes' => $totalAthletes,
            'upcoming_events' => $upcomingEvents,
            'expiring_certs' => $expiringCerts,
            'athletes_at_risk' => $atRisk,
        ]);
    }

    // ─── GET /api/?module=dashboard&action=deadlines ──────────────────────────
    public function deadlines(): void
    {
        Auth::requireAuth();
        $db = Database::getInstance();
        $tid = TenantContext::id();

        $items = [];

        // 1. Certificati medici in scadenza (60 giorni) — scoped to tenant
        $stmt = $db->prepare(
            'SELECT full_name, medical_cert_expires_at AS expiry_date,
                    DATEDIFF(medical_cert_expires_at, CURDATE()) AS days_left
             FROM athletes
             WHERE is_active = 1
               AND deleted_at IS NULL
               AND tenant_id = :tid
               AND medical_cert_expires_at IS NOT NULL
               AND medical_cert_expires_at <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
             ORDER BY medical_cert_expires_at ASC'
        );
        $stmt->execute([':tid' => $tid]);
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $items[] = [
                'name' => $row['full_name'],
                'label' => 'Certificato Medico',
                'expiry_date' => $row['expiry_date'],
                'days_left' => max(0, (int)$row['days_left']),
                'icon' => 'first-aid-kit',
            ];
        }

        // 2. Contratti in scadenza (60 giorni) — scoped to tenant
        try {
            $stmt = $db->prepare(
                'SELECT u.full_name, c.valid_to AS expiry_date,
                        DATEDIFF(c.valid_to, CURDATE()) AS days_left
                 FROM contracts c
                 JOIN users u ON u.id = c.user_id
                 WHERE c.status = \'signed\'
                   AND c.deleted_at IS NULL
                   AND c.tenant_id = :tid
                   AND c.valid_to IS NOT NULL
                   AND c.valid_to <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                 ORDER BY c.valid_to ASC'
            );
            $stmt->execute([':tid' => $tid]);
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                $items[] = [
                    'name' => $row['full_name'],
                    'label' => 'Contratto',
                    'expiry_date' => $row['expiry_date'],
                    'days_left' => max(0, (int)$row['days_left']),
                    'icon' => 'file-text',
                ];
            }
        }
        catch (\Throwable) {
        // Table may not exist in all environments
        }

        // 3. Tessere federali in scadenza (60 giorni) — scoped to tenant
        try {
            $stmt = $db->prepare(
                'SELECT a.full_name, fc.expires_at AS expiry_date,
                        DATEDIFF(fc.expires_at, CURDATE()) AS days_left,
                        fc.federation
                 FROM federation_cards fc
                 JOIN athletes a ON a.id = fc.athlete_id
                 WHERE a.is_active = 1
                   AND a.deleted_at IS NULL
                   AND fc.tenant_id = :tid
                   AND fc.status = \'active\'
                   AND fc.expires_at IS NOT NULL
                   AND fc.expires_at <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                 ORDER BY fc.expires_at ASC'
            );
            $stmt->execute([':tid' => $tid]);
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                $items[] = [
                    'name' => $row['full_name'],
                    'label' => 'Tessera ' . ($row['federation'] ?? 'FIPAV'),
                    'expiry_date' => $row['expiry_date'],
                    'days_left' => max(0, (int)$row['days_left']),
                    'icon' => 'identification-badge',
                ];
            }
        }
        catch (\Throwable) {
        // Table may not exist in all environments
        }

        // Sort all items by days_left ascending
        usort($items, fn($a, $b) => $a['days_left'] <=> $b['days_left']);

        Response::success($items);
    }
}