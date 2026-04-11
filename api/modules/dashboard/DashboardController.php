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
            'SELECT COUNT(*) FROM teams WHERE deleted_at IS NULL'
        );
        $stmtTeams->execute();
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

    // ─── GET /api/?module=dashboard&action=weeklyKpis ───────────────────────
    public function weeklyKpis(): void
    {
        Auth::requireAuth();
        $db = Database::getInstance();
        $tid = TenantContext::id();

        // 1. Trasporti della settimana — try multiple query strategies for tenant scoping
        $weeklyTransports = 0;
        try {
            // Try direct tenant_id on events first
            $stmt = $db->prepare("SELECT COUNT(e.id) FROM events e WHERE e.tenant_id = :tid AND e.deleted_at IS NULL AND e.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
            $stmt->execute([':tid' => $tid]);
            $weeklyTransports = (int)$stmt->fetchColumn();
        }
        catch (\Throwable) {
            // Fallback: events may not have tenant_id — count all non-deleted events
            try {
                $stmt = $db->prepare("SELECT COUNT(id) FROM events WHERE deleted_at IS NULL AND event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
                $stmt->execute();
                $weeklyTransports = (int)$stmt->fetchColumn();
            }
            catch (\Throwable) {
                $weeklyTransports = 0;
            }
        }

        // 2. Nuovi ordini eCommerce — scoped to tenant
        $newOrders = 0;
        try {
            $stmt = $db->prepare("SELECT COUNT(id) FROM ec_orders WHERE tenant_id = :tid AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
            $stmt->execute([':tid' => $tid]);
            $newOrders = (int)$stmt->fetchColumn();
        }
        catch (\Throwable) {
            // Fallback without tenant_id
            try {
                $stmt = $db->prepare("SELECT COUNT(id) FROM ec_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
                $stmt->execute();
                $newOrders = (int)$stmt->fetchColumn();
            }
            catch (\Throwable) {
                $newOrders = 0;
            }
        }

        // 3. Messaggi WA da leggere
        $unreadWhatsapp = 0;
        try {
            $stmt = $db->prepare("SELECT COUNT(id) FROM whatsapp_messages WHERE tenant_id = :tid AND status = 'received'");
            $stmt->execute([':tid' => $tid]);
            $unreadWhatsapp = (int)$stmt->fetchColumn();
        }
        catch (\Throwable) {
            $unreadWhatsapp = 0;
        }

        // 4. Nuovi iscritti Out Season
        try {
            $stmt = $db->prepare("SELECT COUNT(id) FROM outseason_entries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
            $stmt->execute();
            $newOutseason = (int)$stmt->fetchColumn();
        }
        catch (\Throwable $e) {
            $newOutseason = 0;
        }

        // 5. Pagamenti in sospeso
        try {
            $stmt = $db->prepare("SELECT COUNT(i.id) FROM installments i JOIN payment_plans p ON i.plan_id = p.id WHERE p.tenant_id = :tid AND i.status IN ('PENDING', 'OVERDUE') AND i.due_date <= CURDATE()");
            $stmt->execute([':tid' => $tid]);
            $pendingPayments = (int)$stmt->fetchColumn();
        }
        catch (\Throwable $e) {
            $pendingPayments = 0;
        }

        Response::success([
            'weekly_transports' => $weeklyTransports,
            'new_orders'        => $newOrders,
            'unread_whatsapp'   => $unreadWhatsapp,
            'new_outseason'     => $newOutseason,
            'pending_payments'  => $pendingPayments
        ]);
    }

    // ─── GET /api/?module=dashboard&action=weeklyFull ────────────────────────
    // Aggregato completo per la nuova dashboard: partite settimana, risultati
    // settimana scorsa, KPI rapidi, alert urgenti (cert + contratti ≤30gg).
    public function weeklyFull(): void
    {
        Auth::requireAuth();
        $db  = Database::getInstance();
        $tid = TenantContext::id();

        // ── 1. KPI rapidi ────────────────────────────────────────────────────
        $totalAthletes = 0;
        $totalTeams    = 0;
        $newOrders     = 0;
        $newOutseason  = 0;

        try {
            $s = $db->prepare('SELECT COUNT(*) FROM athletes WHERE is_active=1 AND deleted_at IS NULL AND tenant_id=:t');
            $s->execute([':t' => $tid]);
            $totalAthletes = (int)$s->fetchColumn();
        } catch (\Throwable) {}

        try {
            $s = $db->prepare('SELECT COUNT(*) FROM teams WHERE deleted_at IS NULL');
            $s->execute();
            $totalTeams = (int)$s->fetchColumn();
        } catch (\Throwable) {}

        try {
            $s = $db->prepare("SELECT COUNT(*) FROM ec_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
            $s->execute();
            $newOrders = (int)$s->fetchColumn();
        } catch (\Throwable) {}

        try {
            $s = $db->prepare("SELECT COUNT(*) FROM outseason_entries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
            $s->execute();
            $newOutseason = (int)$s->fetchColumn();
        } catch (\Throwable) {}

        // ── 2. Partite questa settimana ──────────────────────────────────────
        $upcomingMatches = [];
        try {
            $s = $db->prepare(
                "SELECT fm.id, fm.match_date, fm.location,
                        th.name AS home_team, ta.name AS away_team,
                        fm.home_score, fm.away_score
                 FROM federation_matches fm
                 LEFT JOIN teams th ON th.id = fm.home_team_id
                 LEFT JOIN teams ta ON ta.id = fm.away_team_id
                 WHERE fm.match_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                   AND fm.tenant_id = :t
                 ORDER BY fm.match_date ASC
                 LIMIT 10"
            );
            $s->execute([':t' => $tid]);
            $upcomingMatches = $s->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Throwable) {}

        // ── 3. Risultati settimana scorsa ───────────────────────────────────
        $lastWeekResults = [];
        try {
            $s = $db->prepare(
                "SELECT fm.id, fm.match_date, fm.location,
                        th.name AS home_team, ta.name AS away_team,
                        fm.home_score, fm.away_score,
                        fm.home_team_id
                 FROM federation_matches fm
                 LEFT JOIN teams th ON th.id = fm.home_team_id
                 LEFT JOIN teams ta ON ta.id = fm.away_team_id
                 WHERE fm.match_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
                   AND fm.home_score IS NOT NULL
                   AND fm.tenant_id = :t
                 ORDER BY fm.match_date DESC
                 LIMIT 10"
            );
            $s->execute([':t' => $tid]);
            $rows = $s->fetchAll(\PDO::FETCH_ASSOC);

            // Determina esito W/L/P per ogni partita (dal punto di vista della squadra di casa)
            foreach ($rows as $row) {
                $h = (int)$row['home_score'];
                $a = (int)$row['away_score'];
                $row['outcome'] = $h > $a ? 'W' : ($h < $a ? 'L' : 'P');
                $lastWeekResults[] = $row;
            }
        } catch (\Throwable) {}

        // ── 4. Alert urgenti (≤30 giorni) ───────────────────────────────────
        $alerts = [];

        // Certificati medici in scadenza
        try {
            $s = $db->prepare(
                "SELECT full_name, medical_cert_expires_at AS expiry_date,
                        DATEDIFF(medical_cert_expires_at, CURDATE()) AS days_left
                 FROM athletes
                 WHERE is_active=1 AND deleted_at IS NULL AND tenant_id=:t
                   AND medical_cert_expires_at IS NOT NULL
                   AND medical_cert_expires_at <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                 ORDER BY medical_cert_expires_at ASC
                 LIMIT 10"
            );
            $s->execute([':t' => $tid]);
            foreach ($s->fetchAll(\PDO::FETCH_ASSOC) as $r) {
                $alerts[] = [
                    'type'        => 'cert',
                    'name'        => $r['full_name'],
                    'label'       => 'Certificato Medico',
                    'expiry_date' => $r['expiry_date'],
                    'days_left'   => max(0, (int)$r['days_left']),
                    'icon'        => 'first-aid-kit',
                ];
            }
        } catch (\Throwable) {}

        // Contratti staff in scadenza
        try {
            $s = $db->prepare(
                "SELECT sm.first_name, sm.last_name,
                        sm.contract_valid_to AS expiry_date,
                        DATEDIFF(sm.contract_valid_to, CURDATE()) AS days_left
                 FROM staff_members sm
                 WHERE sm.tenant_id = :t
                   AND sm.deleted_at IS NULL
                   AND sm.contract_status IN ('inviato','generato','firmato')
                   AND sm.contract_valid_to IS NOT NULL
                   AND sm.contract_valid_to <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                 ORDER BY sm.contract_valid_to ASC
                 LIMIT 10"
            );
            $s->execute([':t' => $tid]);
            foreach ($s->fetchAll(\PDO::FETCH_ASSOC) as $r) {
                $alerts[] = [
                    'type'        => 'contract',
                    'name'        => $r['first_name'] . ' ' . $r['last_name'],
                    'label'       => 'Contratto Staff',
                    'expiry_date' => $r['expiry_date'],
                    'days_left'   => max(0, (int)$r['days_left']),
                    'icon'        => 'file-text',
                ];
            }
        } catch (\Throwable) {}

        usort($alerts, fn($a, $b) => $a['days_left'] <=> $b['days_left']);

        Response::success([
            'kpi' => [
                'total_athletes' => $totalAthletes,
                'total_teams'    => $totalTeams,
                'new_orders'     => $newOrders,
                'new_outseason'  => $newOutseason,
            ],
            'upcoming_matches'  => $upcomingMatches,
            'last_week_results' => $lastWeekResults,
            'alerts'            => $alerts,
        ]);
    }

    // ─── GET /api/?module=dashboard&action=matrixData ─────────────────────────
    // Aggrega dati e variazioni reali delle ultime 2 settimane filtrando per tenant
    // ed estraendole dinamicamente.
    public function matrixData(): void
    {
        Auth::requireAuth();
        $db  = Database::getInstance();
        $tid = TenantContext::id();

        // Helper per estrarre velocemente array di oggetti "Notifica" strutturati
        $queryNodes = function(string $sql, array $params, string $icon, string $badge, string $color) use ($db) {
            $nodes = [];
            try {
                $s = $db->prepare($sql);
                $s->execute($params);
                foreach ($s->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                    $nodes[] = [
                        'icon'  => $icon,
                        'text'  => $row['text'],
                        'badge' => $badge,
                        'color' => $color,
                        'date'  => $row['date'] ?? date('Y-m-d H:i:s'),
                    ];
                }
            } catch (\Throwable $e) { 
                $nodes[] = [
                    'icon' => 'warning',
                    'text' => 'ERR: ' . $e->getMessage(),
                    'badge' => 'DEBUG SQL',
                    'color' => '#FF0000',
                    'date' => date('Y-m-d H:i:s')
                ];
            }
            return $nodes;
        };

        // --- 1. AREA SPORTIVA ---
        $sportiva = [];
        $sportiva = array_merge($sportiva, $queryNodes(
            "SELECT CONCAT('Nuovo Tesseramento: ', full_name) as text, created_at as date FROM athletes WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", 
            [':t' => $tid], 'user', 'Nuovo Atleta', '#A78BFA'
        ));
        $sportiva = array_merge($sportiva, $queryNodes(
            "SELECT CONCAT('Alert ACWR: ', a.full_name) as text, al.log_date as date FROM acwr_alerts al JOIN athletes a ON a.id = al.athlete_id WHERE a.tenant_id=:t AND al.log_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 3", 
            [':t' => $tid], 'heart', 'Fermo Medico', '#EF4444'
        ));
        $sportiva = array_merge($sportiva, $queryNodes(
            "SELECT CONCAT('Risultato: ', IFNULL(fm.home_team,'[N/D]'), ' vs ', IFNULL(fm.away_team,'[N/D]'), ' (', fm.home_score, '-', fm.away_score, ')') as text, fm.match_date as date 
             FROM federation_matches fm 
             JOIN federation_championships c ON fm.championship_id = c.id 
             WHERE c.tenant_id=:t AND fm.match_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND fm.home_score IS NOT NULL LIMIT 4", 
            [':t' => $tid], 'trophy', 'Match Giocato', '#10B981'
        ));

        // --- 2. OPERATIVITÀ ---
        $operativita = [];
        $operativita = array_merge($operativita, $queryNodes(
            "SELECT CONCAT('Aggiornato Evento: ', COALESCE(title, location_name)) as text, event_date as date 
             FROM events 
             WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 4", 
            [], 'calendar-plus', 'Eventi', '#60A5FA'
        ));
        $operativita = array_merge($operativita, $queryNodes(
            "SELECT CONCAT('Nuova Task: ', title) as text, created_at as date FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", 
            [], 'list-checks', 'Task', '#10B981'
        ));
        $operativita = array_merge($operativita, $queryNodes(
            "SELECT CONCAT('Trasferta per: ', destination_name) as text, transport_date as date 
             FROM transports 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", 
            [], 'van', 'Flotta', '#FCD34D'
        ));

        // --- 3. COMUNICAZIONE ---
        $comunicazione = [];
        $comunicazione = array_merge($comunicazione, $queryNodes(
            "SELECT CONCAT('WhatsApp da: ', from_phone) as text, FROM_UNIXTIME(timestamp) as date FROM whatsapp_messages WHERE FROM_UNIXTIME(timestamp) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 5", 
            [], 'whatsapp-logo', 'WhatsApp', '#10B981'
        ));
        $comunicazione = array_merge($comunicazione, $queryNodes(
            "SELECT CONCAT('Email a: ', recipient) as text, sent_at as date FROM email_logs WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", 
            [], 'envelope-simple', 'Mail', '#A78BFA'
        ));
        $comunicazione = array_merge($comunicazione, $queryNodes(
            "SELECT CONCAT('Nuova News: ', title) as text, created_at as date FROM website_news WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", 
            [':t' => $tid], 'instagram-logo', 'Sito', '#EC4899'
        ));

        // --- 4. AMMINISTRAZIONE ---
        $admin = [];
        $admin = array_merge($admin, $queryNodes(
            "SELECT CONCAT('Fattura a: ', recipient_name) as text, created_at as date FROM invoices WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", 
            [':t' => $tid], 'file-pdf', 'Fatture', '#60A5FA'
        ));
        $admin = array_merge($admin, $queryNodes(
            "SELECT CONCAT('Rata incassata: ', amount, ' €') as text, paid_date as date 
             FROM installments i JOIN payment_plans pp ON pp.id=i.plan_id 
             WHERE pp.tenant_id=:t AND i.status='PAID' AND i.paid_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 4", 
            [':t' => $tid], 'bank', 'Cassa', '#10B981'
        ));
        $admin = array_merge($admin, $queryNodes(
            "SELECT CONCAT('Doc Archiviato: ', file_name) as text, uploaded_at as date FROM societa_documents WHERE tenant_id=:t AND uploaded_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", 
            [':t' => $tid], 'receipt', 'Archivio', '#F59E0B'
        ));

        // --- 5. IL CLUB ---
        $club = [];
        $club = array_merge($club, $queryNodes(
            "SELECT CONCAT('Network/Sponsor: ', name) as text, created_at as date FROM societa_companies WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", 
            [':t' => $tid], 'handshake', 'Sponsor', '#FCD34D'
        ));
        $club = array_merge($club, $queryNodes(
            "SELECT CONCAT('Integrazione Staff: ', full_name) as text, start_date as date FROM societa_members WHERE tenant_id=:t AND start_date >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", 
            [':t' => $tid], 'users-three', 'Governance', '#F59E0B'
        ));

        // --- 6. ECOMMERCE & OUTSEASON ---
        $ecommerce = [];
        $ecommerce = array_merge($ecommerce, $queryNodes(
            "SELECT CONCAT('Acquisto eShop di ', totale, ' €') as text, data_ordine as date FROM ec_orders WHERE data_ordine >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", 
            [], 'shopping-bag', 'eCommerce', '#F472B6'
        ));
        $ecommerce = array_merge($ecommerce, $queryNodes(
            "SELECT 'Nuova iscrizione OutSeason ricevuta' as text, entry_date as date FROM outseason_entries WHERE entry_date >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", 
            [], 'tent', 'Camp', '#10B981'
        ));

        // Funzione di sorting per data Decrescente
        $sortFn = fn($a, $b) => strtotime($b['date']) <=> strtotime($a['date']);
        
        usort($sportiva, $sortFn);
        usort($operativita, $sortFn);
        usort($comunicazione, $sortFn);
        usort($admin, $sortFn);
        usort($club, $sortFn);
        usort($ecommerce, $sortFn);

        Response::success([
            'sportiva'      => array_slice($sportiva, 0, 10),
            'operativita'   => array_slice($operativita, 0, 10),
            'comunicazione' => array_slice($comunicazione, 0, 10),
            'admin'         => array_slice($admin, 0, 10),
            'club'          => array_slice($club, 0, 10),
            'ecommerce'     => array_slice($ecommerce, 0, 10),
        ]);
    }

    public function debugDashboard(): void
    {
        $db  = Database::getInstance();
        $tid = 'TNT_fusion';
        $res = [];
        $queryNodes = function(string $sql, array $params, string $name) use ($db, &$res) {
            try {
                $s = $db->prepare($sql);
                $s->execute($params);
                $count = $s->rowCount();
                $res[$name] = "OK ($count rows)";
            } catch (\Throwable $e) {
                $res[$name] = "ERR: " . $e->getMessage();
            }
        };

        $queryNodes("SELECT CONCAT('Nuovo Tesseramento: ', full_name) as text, created_at as date FROM athletes WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", [':t' => $tid], 'athletes');
        $queryNodes("SELECT CONCAT('Alert ACWR: ', a.full_name) as text, al.log_date as date FROM acwr_alerts al JOIN athletes a ON a.id = al.athlete_id WHERE a.tenant_id=:t AND al.log_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'acwr');
        $queryNodes("SELECT fm.home_score as text, fm.match_date as date FROM federation_matches fm WHERE fm.tenant_id=:t AND fm.match_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND CURDATE() LIMIT 4", [':t' => $tid], 'matches');
        $queryNodes("SELECT location as text, event_date as date FROM events WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", [':t' => $tid], 'events');
        $queryNodes("SELECT title as text, created_at as date FROM tasks WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", [':t' => $tid], 'tasks');
        $queryNodes("SELECT vehicle_id as text, created_at as date FROM vehicle_logs WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", [':t' => $tid], 'vehicle_logs');
        $queryNodes("SELECT recipient as text, created_at as date FROM whatsapp_messages WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", [':t' => $tid], 'whatsapp');
        $queryNodes("SELECT subject as text, sent_at as date FROM newsletter_campaigns WHERE tenant_id=:t AND sent_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'newsletter');
        $queryNodes("SELECT title as text, created_at as date FROM website_news WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'website_news');
        $queryNodes("SELECT amount as text, payment_date as date FROM staff_payments WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 4", [':t' => $tid], 'staff_payments');

        $queryNodes("SELECT file_name as text, uploaded_at as date FROM documents WHERE tenant_id=:t AND uploaded_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'documents');
        $queryNodes("SELECT company_name as text, created_at as date FROM sponsors WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'sponsors');
        $queryNodes("SELECT first_name as text, created_at as date FROM staff_members WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 3", [':t' => $tid], 'staff');
        $queryNodes("SELECT order_number as text, created_at as date FROM ec_orders WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", [':t' => $tid], 'ec_orders');
        $queryNodes("SELECT full_name as text, created_at as date FROM outseason_entries WHERE tenant_id=:t AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5", [':t' => $tid], 'outseason');

        Response::success($res);
    }
}