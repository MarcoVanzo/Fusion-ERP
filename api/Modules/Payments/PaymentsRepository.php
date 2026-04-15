<?php
/**
 * Payments Repository — Payment Plans, Installments, Transactions
 * Fusion ERP v1.0 — Module E
 */

declare(strict_types=1);

namespace FusionERP\Modules\Payments;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class PaymentsRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── PAYMENT PLANS ───────────────────────────────────────────────────────

    /**
     * Create a new payment plan.
     */
    public function createPlan(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO payment_plans (id, tenant_id, athlete_id, total_amount, frequency, start_date, season, status, notes, created_by)
             VALUES (:id, :tenant_id, :athlete_id, :total_amount, :frequency, :start_date, :season, :status, :notes, :created_by)'
        );
        $stmt->execute($data);
    }

    /**
     * Get the active payment plan for an athlete.
     */
    public function getActivePlan(string $athleteId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, total_amount, frequency, start_date, season, status, notes, created_at
             FROM payment_plans
             WHERE athlete_id = :athlete_id AND tenant_id = :tid AND status = \'active\'
             ORDER BY created_at DESC
             LIMIT 1'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':tid' => TenantContext::id()]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Get all payment plans for an athlete.
     */
    public function getPlans(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, total_amount, frequency, start_date, season, status, notes, created_at
             FROM payment_plans
             WHERE athlete_id = :athlete_id AND tenant_id = :tid
             ORDER BY created_at DESC'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':tid' => TenantContext::id()]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Update plan status.
     */
    public function updatePlanStatus(string $planId, string $status): void
    {
        $stmt = $this->db->prepare(
            'UPDATE payment_plans SET status = :status WHERE id = :id AND tenant_id = :tid'
        );
        $stmt->execute([':status' => $status, ':id' => $planId, ':tid' => TenantContext::id()]);
    }

    // ─── INSTALLMENTS ────────────────────────────────────────────────────────

    /**
     * Insert a batch of installments for a plan.
     */
    public function insertInstallment(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO installments (id, tenant_id, plan_id, title, due_date, amount, status)
             VALUES (:id, :tenant_id, :plan_id, :title, :due_date, :amount, :status)'
        );
        $stmt->execute($data);
    }

    /**
     * Get installments for a plan.
     */
    public function getInstallments(string $planId): array
    {
        $stmt = $this->db->prepare(
            'SELECT i.id, i.title, i.due_date, i.amount, i.status, i.paid_date, i.payment_method, i.receipt_path, i.notes
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE i.plan_id = :plan_id AND pp.tenant_id = :tid
             ORDER BY i.due_date ASC'
        );
        $stmt->execute([':plan_id' => $planId, ':tid' => TenantContext::id()]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get a single installment.
     */
    public function getInstallmentById(string $installmentId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT i.id, i.plan_id, i.title, i.due_date, i.amount, i.status, i.paid_date,
                    i.payment_method, i.receipt_path, i.notes,
                    pp.athlete_id, pp.tenant_id
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE i.id = :id AND pp.tenant_id = :tid
             LIMIT 1'
        );
        $stmt->execute([':id' => $installmentId, ':tid' => TenantContext::id()]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Mark an installment as paid.
     */
    public function payInstallment(string $installmentId, string $paidDate, string $method, ?string $receiptPath): void
    {
        $stmt = $this->db->prepare(
            'UPDATE installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             SET i.status = \'PAID\',
                 i.paid_date = :paid_date,
                 i.payment_method = :method,
                 i.receipt_path = :receipt_path
             WHERE i.id = :id AND pp.tenant_id = :tid'
        );
        $stmt->execute([
            ':paid_date' => $paidDate,
            ':method' => $method,
            ':receipt_path' => $receiptPath,
            ':id' => $installmentId,
            ':tid' => TenantContext::id(),
        ]);
    }

    /**
     * Mark overdue installments (past due date, still PENDING).
     * Called by cron job.
     */
    /**
     * Mark overdue installments (past due date, still PENDING).
     * Scoped per-tenant to prevent cross-tenant modifications (Audit P2-09).
     *
     * @param string|null $tenantId Scope to specific tenant. If null, uses current context.
     */
    public function markOverdueInstallments(?string $tenantId = null): int
    {
        $tid = $tenantId ?? TenantContext::id();
        $stmt = $this->db->prepare(
            "UPDATE installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             SET i.status = 'OVERDUE'
             WHERE i.status = 'PENDING' AND i.due_date < CURDATE() AND pp.tenant_id = :tid"
        );
        $stmt->execute([':tid' => $tid]);
        return $stmt->rowCount();
    }

    /**
     * Get overdue installments across all athletes.
     * 
     * @param string|null $tenantId The tenant ID scope
     * @return array
     */
    public function getOverdueInstallments(?string $tenantId = null): array
    {
        $tid = $tenantId ?? TenantContext::id();
        $stmt = $this->db->prepare(
            "SELECT i.id, i.title, i.due_date, i.amount, i.status,
                    pp.athlete_id, pp.tenant_id,
                    a.full_name, a.email, a.phone, a.parent_phone,
                    DATEDIFF(CURDATE(), i.due_date) AS days_overdue
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             JOIN athletes a ON a.id = pp.athlete_id
             WHERE i.status = 'OVERDUE'
               AND pp.tenant_id = :tid
               AND a.deleted_at IS NULL
             ORDER BY i.due_date ASC"
        );
        $stmt->execute([':tid' => $tid]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get installments due within N days (for reminder notifications).
     * 
     * @param int $days Number of days
     * @param string|null $tenantId The tenant ID scope
     * @return array
     */
    public function getUpcomingInstallments(int $days = 7, ?string $tenantId = null): array
    {
        $tid = $tenantId ?? TenantContext::id();
        $stmt = $this->db->prepare(
            "SELECT i.id, i.title, i.due_date, i.amount,
                    pp.athlete_id, pp.tenant_id,
                    a.full_name, a.email, a.phone, a.parent_phone,
                    DATEDIFF(i.due_date, CURDATE()) AS days_until_due
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             JOIN athletes a ON a.id = pp.athlete_id
             WHERE i.status = 'PENDING'
               AND pp.tenant_id = :tid
               AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
               AND a.deleted_at IS NULL
             ORDER BY i.due_date ASC"
        );
        $stmt->bindValue(':tid', $tid);
        $stmt->bindValue(':days', $days, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // ─── TRANSACTIONS ────────────────────────────────────────────────────────

    public function insertTransaction(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO transactions (id, tenant_id, athlete_id, installment_id, amount, transaction_date, payment_method, reference, created_by, receipt_year, receipt_number)
             VALUES (:id, :tenant_id, :athlete_id, :installment_id, :amount, :transaction_date, :payment_method, :reference, :created_by, :receipt_year, :receipt_number)'
        );
        $stmt->execute($data);
    }

    /**
     * Get the next progressive receipt number for a specific year in a tenant context.
     * Uses table lock internally per InnoDB to ensure no collision.
     * 
     * @param int $year Format YYYY
     * @return int Next progressive number
     */
    public function getNextReceiptNumber(string $tenantId, int $year): int
    {
        // Use FOR UPDATE to prevent race conditions: two concurrent payments
        // must never receive the same progressive receipt number (legal requirement for ASD).
        // The caller (payInstallment) should wrap this in a transaction.
        $stmt = $this->db->prepare(
            "SELECT COALESCE(MAX(receipt_number), 0) + 1 
             FROM transactions 
             WHERE tenant_id = :tenant_id AND receipt_year = :year
             FOR UPDATE"
        );
        $stmt->execute([':tenant_id' => $tenantId, ':year' => $year]);
        return (int)$stmt->fetchColumn();
    }

    // ─── DASHBOARD ───────────────────────────────────────────────────────────

    /**
     * Get aggregated dashboard data for admin payment overview.
     */
    public function getDashboardData(string $tenantId): array
    {
        $db = $this->db;

        // Total outstanding (PENDING + OVERDUE installments)
        $stmt = $db->prepare(
            "SELECT COALESCE(SUM(i.amount), 0)
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE pp.tenant_id = :tid AND i.status IN ('PENDING', 'OVERDUE')"
        );
        $stmt->execute([':tid' => $tenantId]);
        $totalOutstanding = (float)$stmt->fetchColumn();

        // Total overdue count
        $stmt = $db->prepare(
            "SELECT COUNT(*)
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE pp.tenant_id = :tid AND i.status = 'OVERDUE'"
        );
        $stmt->execute([':tid' => $tenantId]);
        $overdueCount = (int)$stmt->fetchColumn();

        // Total collected this month
        $stmt = $db->prepare(
            "SELECT COALESCE(SUM(i.amount), 0)
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE pp.tenant_id = :tid
               AND i.status = 'PAID'
               AND i.paid_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')"
        );
        $stmt->execute([':tid' => $tenantId]);
        $monthlyIncome = (float)$stmt->fetchColumn();

        // Monthly income trend (last 6 months)
        $stmt = $db->prepare(
            "SELECT DATE_FORMAT(i.paid_date, '%Y-%m') AS month,
                    SUM(i.amount) AS total
             FROM installments i
             JOIN payment_plans pp ON pp.id = i.plan_id
             WHERE pp.tenant_id = :tid
               AND i.status = 'PAID'
               AND i.paid_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(i.paid_date, '%Y-%m')
             ORDER BY month ASC"
        );
        $stmt->execute([':tid' => $tenantId]);
        $monthlyTrend = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return [
            'total_outstanding' => $totalOutstanding,
            'overdue_count' => $overdueCount,
            'monthly_income' => $monthlyIncome,
            'monthly_trend' => $monthlyTrend,
        ];
    }

    /**
     * Get global payment status for the Athletes Dashboard.
     * Scoped to the current tenant to prevent cross-tenant data leaks.
     *
     * @param string $tenantId  The tenant to scope results to
     */
    public function getGlobalStatus(string $tenantId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                SUM(CASE WHEN i.status = 'PAID'    THEN i.amount ELSE 0 END) AS total_paid,
                SUM(CASE WHEN i.status = 'OVERDUE' THEN i.amount ELSE 0 END) AS total_overdue,
                SUM(CASE WHEN i.status = 'PENDING' THEN i.amount ELSE 0 END) AS total_pending
            FROM installments i
            JOIN payment_plans pp ON pp.id = i.plan_id
            WHERE pp.status = 'active'
              AND pp.tenant_id = :tid
        ");
        $stmt->execute([':tid' => $tenantId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        $paid = (float)($row['total_paid'] ?? 0);
        $overdue = (float)($row['total_overdue'] ?? 0);
        $pending = (float)($row['total_pending'] ?? 0);

        return [
            'total_paid' => $paid,
            'total_overdue' => $overdue,
            'total_pending' => $pending,
            'total_expected' => $paid + $overdue + $pending,
        ];
    }

    // ─── SQUAD SUMMARY ────────────────────────────────────────────────────────

    /**
     * Get all installments for a squad in a single aggregated query.
     * Replaces the N parallel getPlan() calls previously fired by the frontend.
     *
     * @param string      $tenantId  Tenant scope (mandatory — prevents cross-tenant leaks)
     * @param string|null $teamId    Optional team filter (athletes.team_id)
     * @return array{installments: array, stats: array}
     */
    public function getSquadSummary(string $tenantId, ?string $teamId = null): array
    {
        $teamFilter = $teamId ? 'AND a.team_id = :team_id' : '';

        $sql = "
            SELECT
                i.id            AS installment_id,
                i.title,
                i.due_date,
                i.amount,
                i.status,
                i.paid_date,
                i.payment_method,
                pp.athlete_id,
                pp.frequency,
                pp.season,
                a.full_name     AS athlete_name,
                a.team_id,
                t.name          AS team_name,
                t.category      AS team_category
            FROM installments i
            JOIN payment_plans pp ON pp.id = i.plan_id
            JOIN athletes a       ON a.id  = pp.athlete_id
            LEFT JOIN teams t     ON t.id  = a.team_id
            WHERE pp.tenant_id = :tid
              AND pp.status    = 'active'
              AND a.deleted_at IS NULL
              {$teamFilter}
            ORDER BY a.full_name ASC, i.due_date ASC
        ";

        $params = [':tid' => $tenantId];
        if ($teamId) {
            $params[':team_id'] = $teamId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $installments = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Compute aggregate stats server-side so frontend gets plain numbers
        $totalPaid = 0.0;
        $totalOverdue = 0.0;
        $totalPending = 0.0;

        foreach ($installments as $row) {
            $amount = (float)$row['amount'];
            match (strtoupper($row['status'])) {
                    'PAID' => $totalPaid += $amount,
                    'OVERDUE' => $totalOverdue += $amount,
                    default => $totalPending += $amount,
                };
        }

        return [
            'installments' => $installments,
            'stats' => [
                'total_paid' => round($totalPaid, 2),
                'total_overdue' => round($totalOverdue, 2),
                'total_pending' => round($totalPending, 2),
                'total_expected' => round($totalPaid + $totalOverdue + $totalPending, 2),
            ],
        ];
    }
}