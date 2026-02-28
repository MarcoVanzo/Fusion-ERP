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

class DashboardController
{
    // ─── GET /api/?module=dashboard&action=stats ──────────────────────────────
    public function stats(): void
    {
        Auth::requireAuth();
        $db = Database::getInstance();

        // Total active athletes
        $stmt = $db->prepare('SELECT COUNT(*) FROM athletes WHERE is_active = 1 AND deleted_at IS NULL');
        $stmt->execute();
        $totalAthletes = (int)$stmt->fetchColumn();

        // Upcoming events (next 14 days)
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM events
             WHERE status NOT IN (\'cancelled\') AND event_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 14 DAY)
               AND deleted_at IS NULL'
        );
        $stmt->execute();
        $upcomingEvents = (int)$stmt->fetchColumn();

        // Expiring certs (30 days)
        $stmt = $db->prepare(
            'SELECT COUNT(*) FROM medical_certificates
             WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
               AND status = \'active\' AND deleted_at IS NULL'
        );
        $stmt->execute();
        $expiringCerts = (int)$stmt->fetchColumn();

        // High-risk ACWR athletes
        $stmt = $db->prepare(
            'SELECT COUNT(DISTINCT athlete_id) FROM acwr_alerts
             WHERE log_date = CURDATE() AND risk_level IN (\'high\',\'extreme\') AND ack_at IS NULL'
        );
        $stmt->execute();
        $atRisk = (int)$stmt->fetchColumn();

        Response::success([
            'total_athletes' => $totalAthletes,
            'upcoming_events' => $upcomingEvents,
            'expiring_certs' => $expiringCerts,
            'athletes_at_risk' => $atRisk,
        ]);
    }
}