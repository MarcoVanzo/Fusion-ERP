<?php
/**
 * Payments Controller — Payment Plans, Installments, Receipts
 * Fusion ERP v1.0 — Module E
 *
 * Endpoints:
 *   POST ?module=payments&action=createPlan              — create payment plan + installments
 *   GET  ?module=payments&action=getPlan&id=ATH_xxx      — plan + installments
 *   POST ?module=payments&action=payInstallment          — mark installment as paid
 *   POST ?module=payments&action=generateReceipt         — generate PDF receipt
 *   GET  ?module=payments&action=dashboard               — admin payment dashboard
 *   GET  ?module=payments&action=overdueList              — athletes with overdue
 */

declare(strict_types=1);

namespace FusionERP\Modules\Payments;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class PaymentsController
{
    private PaymentsRepository $repo;

    public function __construct()
    {
        $this->repo = new PaymentsRepository();
    }

    // ─── POST ?module=payments&action=createPlan ─────────────────────────────

    /**
     * Create a payment plan and auto-generate installments.
     */
    public function createPlan(): void
    {
        Auth::requireWrite('payments');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'total_amount', 'frequency', 'start_date']);

        $validFreqs = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM'];
        $frequency = strtoupper($body['frequency']);
        if (!in_array($frequency, $validFreqs, true)) {
            Response::error("Frequenza non valida: {$frequency}", 400);
        }

        $totalAmount = (float)$body['total_amount'];
        if ($totalAmount <= 0) {
            Response::error('Importo totale deve essere positivo', 400);
        }

        $planId = 'PP_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        // Deactivate any existing active plan for this athlete
        $existingPlan = $this->repo->getActivePlan($body['athlete_id']);
        if ($existingPlan) {
            $this->repo->updatePlanStatus($existingPlan['id'], 'cancelled');
        }

        $this->repo->createPlan([
            ':id' => $planId,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $body['athlete_id'],
            ':total_amount' => $totalAmount,
            ':frequency' => $frequency,
            ':start_date' => $body['start_date'],
            ':season' => $body['season'] ?? null,
            ':status' => 'active',
            ':notes' => $body['notes'] ?? null,
            ':created_by' => $user['id'] ?? null,
        ]);

        // Auto-generate installments
        $installments = $this->generateInstallments($planId, $totalAmount, $frequency, $body['start_date']);

        Audit::log('INSERT', 'payment_plans', $planId, null, $body);
        Response::success([
            'plan_id' => $planId,
            'installments' => $installments,
        ], 201);
    }

    // ─── POST ?module=payments&action=addCustomInstallment ───────────────────

    public function addCustomInstallment(): void
    {
        Auth::requireWrite('payments');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'title', 'amount', 'due_date']);
        
        $plan = $this->repo->getActivePlan($body['athlete_id']);
        if (!$plan) {
            $planId = 'PP_' . bin2hex(random_bytes(4));
            $this->repo->createPlan([
                ':id' => $planId,
                ':tenant_id' => TenantContext::id(),
                ':athlete_id' => $body['athlete_id'],
                ':total_amount' => 0,
                ':frequency' => 'CUSTOM',
                ':start_date' => date('Y-m-d'),
                ':season' => null,
                ':status' => 'active',
                ':notes' => 'Piano generato automaticamente per quote',
                ':created_by' => $user['id'] ?? null,
            ]);
        } else {
            $planId = $plan['id'];
        }

        $instId = 'INST_' . bin2hex(random_bytes(4));
        $this->repo->insertInstallment([
            ':id' => $instId,
            ':plan_id' => $planId,
            ':title' => $body['title'],
            ':due_date' => $body['due_date'],
            ':amount' => (float)$body['amount'],
            ':status' => 'PENDING',
        ]);

        Audit::log('INSERT', 'installments', $instId, null, [
            'plan_id' => $planId,
            'title' => $body['title'],
            'amount' => (float)$body['amount']
        ]);

        Response::success(['message' => 'Quota aggiunta con successo', 'installment_id' => $instId]);
    }

    // ─── GET ?module=payments&action=getPlan&id=ATH_xxx ──────────────────────

    /**
     * Get payment plan with installment statuses for an athlete.
     */
    public function getPlan(): void
    {
        $user = Auth::requireRead('payments');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        if ($user['role'] === 'atleta') {
            // Must check if athleteId matches their linked account (fetch it if needed)
            $db = \FusionERP\Shared\Database::getInstance();
            $stmt = $db->prepare('SELECT id FROM athletes WHERE user_id = :uid LIMIT 1');
            $stmt->execute([':uid' => $user['id']]);
            $linked = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$linked || $linked['id'] !== $athleteId) {
                Response::error('Non hai i permessi per visualizzare questi pagamenti.', 403);
            }
        }

        $plan = $this->repo->getActivePlan($athleteId);
        if (!$plan) {
            Response::success(['plan' => null, 'installments' => []]);
        }

        $installments = $this->repo->getInstallments($plan['id']);

        // Calculate stats
        $totalPaid = 0;
        $totalOverdue = 0;
        foreach ($installments as $inst) {
            if ($inst['status'] === 'PAID')
                $totalPaid += (float)$inst['amount'];
            if ($inst['status'] === 'OVERDUE')
                $totalOverdue += (float)$inst['amount'];
        }

        Response::success([
            'plan' => $plan,
            'installments' => $installments,
            'stats' => [
                'total_paid' => $totalPaid,
                'total_overdue' => $totalOverdue,
                'total_remaining' => (float)$plan['total_amount'] - $totalPaid,
            ],
        ]);
    }

    // ─── POST ?module=payments&action=payInstallment ─────────────────────────

    /**
     * Mark an installment as paid and log the transaction.
     */
    public function payInstallment(): void
    {
        Auth::requireWrite('payments');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['installment_id', 'payment_method']);

        $validMethods = ['BANK_TRANSFER', 'CARD', 'CASH', 'SEPA', 'STRIPE', 'OTHER'];
        $method = strtoupper($body['payment_method']);
        if (!in_array($method, $validMethods, true)) {
            Response::error("Metodo di pagamento non valido: {$method}", 400);
        }

        $installment = $this->repo->getInstallmentById($body['installment_id']);
        if (!$installment) {
            Response::error('Rata non trovata', 404);
        }

        if ($installment['status'] === 'PAID') {
            Response::error('Questa rata è già stata pagata', 400);
        }

        $paidDate = $body['paid_date'] ?? date('Y-m-d');
        $this->repo->payInstallment($body['installment_id'], $paidDate, $method, null);

        // Log transaction
        $txId = 'TX_' . bin2hex(random_bytes(4));
        $this->repo->insertTransaction([
            ':id' => $txId,
            ':tenant_id' => $installment['tenant_id'],
            ':athlete_id' => $installment['athlete_id'],
            ':installment_id' => $body['installment_id'],
            ':amount' => $installment['amount'],
            ':transaction_date' => $paidDate,
            ':payment_method' => $method,
            ':reference' => $body['reference'] ?? null,
            ':created_by' => $user['id'] ?? null,
        ]);

        Audit::log('UPDATE', 'installments', $body['installment_id'], $installment, [
            'status' => 'PAID',
            'payment_method' => $method,
            'paid_date' => $paidDate,
        ]);

        // Auto-generate receipt 
        $receiptPath = $this->createAndSaveReceipt($body['installment_id']);

        // Simulate sending generic notification
        error_log("[Payments] Ricevuta fiscale generata e pronta per invio: " . $receiptPath);

        Response::success([
            'message' => 'Rata pagata e ricevuta generata', 
            'transaction_id' => $txId,
            'receipt_path' => $receiptPath
        ]);
    }

    // ─── POST ?module=payments&action=generateReceipt ────────────────────────

    /**
     * Generate a PDF receipt for a paid installment using mPDF.
     */
    public function generateReceipt(): void
    {
        Auth::requireRead('payments');
        $body = Response::jsonBody();
        Response::requireFields($body, ['installment_id']);

        $installment = $this->repo->getInstallmentById($body['installment_id']);
        if (!$installment) {
            Response::error('Rata non trovata', 404);
        }

        if ($installment['status'] !== 'PAID') {
            Response::error('Ricevuta disponibile solo per rate pagate', 400);
        }

        $relPath = $this->createAndSaveReceipt($body['installment_id']);

        Response::success(['receipt_path' => $relPath, 'message' => 'Ricevuta ri-generata con successo']);
    }

    /**
     * Helper to create and save the PDF receipt
     */
    private function createAndSaveReceipt(string $installmentId): string
    {
        $installment = $this->repo->getInstallmentById($installmentId);
        if (!$installment) return '';

        $db = \FusionERP\Shared\Database::getInstance();
        $stmt = $db->prepare('SELECT full_name, fiscal_code, email FROM athletes WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $installment['athlete_id']]);
        $athlete = $stmt->fetch(\PDO::FETCH_ASSOC);

        $html = $this->buildReceiptHtml($installment, $athlete ?: []);

        $mpdf = new \Mpdf\Mpdf([
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'format' => 'A4',
        ]);
        $mpdf->WriteHTML($html);

        $receiptDir = dirname(__DIR__, 3) . '/uploads/receipts/' . $installment['athlete_id'];
        if (!is_dir($receiptDir)) {
            mkdir($receiptDir, 0755, true);
        }
        $filename = 'ricevuta_' . $installmentId . '_' . date('Ymd_His') . '.pdf';
        $filepath = $receiptDir . '/' . $filename;
        $mpdf->Output($filepath, \Mpdf\Output\Destination::FILE);

        $relPath = 'uploads/receipts/' . $installment['athlete_id'] . '/' . $filename;
        $stmt = $db->prepare('UPDATE installments SET receipt_path = :path WHERE id = :id');
        $stmt->execute([':path' => $relPath, ':id' => $installmentId]);

        return $relPath;
    }

    // ─── GET ?module=payments&action=dashboard ───────────────────────────────

    /**
     * Admin payment dashboard: aggregated overview.
     */
    public function dashboard(): void
    {
        Auth::requireRead('payments');
        $tenantId = TenantContext::id();
        $data = $this->repo->getDashboardData($tenantId);
        Response::success($data);
    }

    // ─── GET ?module=payments&action=overdueList ─────────────────────────────

    /**
     * List all athletes with overdue installments.
     */
    public function overdueList(): void
    {
        Auth::requireRead('payments');
        $overdue = $this->repo->getOverdueInstallments();
        Response::success($overdue);
    }

    // ─── GET ?module=payments&action=squadSummary&team_id=optional ────────────

    /**
     * Aggregated squad-level payment data in a single query.
     * Replaces the N parallel getPlan() calls fired by the frontend tab.
     */
    public function squadSummary(): void
    {
        Auth::requireRead('payments');
        $tenantId = TenantContext::id();
        $teamId = filter_input(INPUT_GET, 'team_id', FILTER_DEFAULT) ?: null;
        $data = $this->repo->getSquadSummary($tenantId, $teamId);
        Response::success($data);
    }

    // ─── PRIVATE: Generate Installments ──────────────────────────────────────

    /**
     * Auto-generate installment records based on plan frequency.
     * @return array Generated installment summaries
     */
    private function generateInstallments(string $planId, float $totalAmount, string $frequency, string $startDate): array
    {
        $numInstallments = match ($frequency) {
                'MONTHLY' => 10, // Typical sports season ~10 months
                'QUARTERLY' => 4,
                'SEMI_ANNUAL' => 2,
                'ANNUAL' => 1,
                default => 1,
            };

        $installmentAmount = round($totalAmount / $numInstallments, 2);
        $remainder = round($totalAmount - ($installmentAmount * $numInstallments), 2);

        $result = [];
        $date = new \DateTime($startDate);

        $interval = match ($frequency) {
                'MONTHLY' => new \DateInterval('P1M'),
                'QUARTERLY' => new \DateInterval('P3M'),
                'SEMI_ANNUAL' => new \DateInterval('P6M'),
                'ANNUAL' => new \DateInterval('P1Y'),
                default => new \DateInterval('P1M'),
            };

        for ($i = 0; $i < $numInstallments; $i++) {
            $amount = $installmentAmount;
            // Add remainder to last installment
            if ($i === $numInstallments - 1) {
                $amount += $remainder;
            }

            $instId = 'INST_' . bin2hex(random_bytes(4));
            $dueDate = $date->format('Y-m-d');
            $title = "Rata " . ($i + 1);

            $this->repo->insertInstallment([
                ':id' => $instId,
                ':plan_id' => $planId,
                ':title' => $title,
                ':due_date' => $dueDate,
                ':amount' => $amount,
                ':status' => 'PENDING',
            ]);

            $result[] = [
                'id' => $instId,
                'title' => $title,
                'due_date' => $dueDate,
                'amount' => $amount,
                'status' => 'PENDING',
            ];

            $date->add($interval);
        }

        return $result;
    }

    // ─── PRIVATE: Receipt HTML Template ──────────────────────────────────────

    /**
     * Build a clean HTML receipt for PDF generation.
     */
    private function buildReceiptHtml(array $installment, ?array $athlete): string
    {
        $athleteName = $athlete['full_name'] ?? 'N/A';
        $fiscalCode = $athlete['fiscal_code'] ?? 'N/A';
        $amount = number_format((float)$installment['amount'], 2, ',', '.');
        $paidDate = $installment['paid_date'] ?? date('Y-m-d');
        $method = $installment['payment_method'] ?? 'N/A';
        $instId = $installment['id'];

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 40px; }
.header { text-align: center; border-bottom: 2px solid #E6007E; padding-bottom: 20px; margin-bottom: 30px; }
.header h1 { font-size: 24px; color: #E6007E; margin: 0; }
.header p { color: #666; margin: 5px 0 0; }
.details { margin-bottom: 30px; }
.details table { width: 100%; border-collapse: collapse; }
.details td { padding: 8px 12px; border-bottom: 1px solid #eee; }
.details td:first-child { font-weight: 600; width: 40%; color: #555; }
.amount { text-align: center; margin: 30px 0; padding: 20px; background: #f8f8f8; border-radius: 8px; }
.amount .value { font-size: 36px; font-weight: 700; color: #E6007E; }
.footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
</style></head>
<body>
<div class="header">
    <h1>RICEVUTA DI PAGAMENTO</h1>
    <p>Ricevuta Fiscale per Erogazione Sportiva o Quota Associativa</p>
</div>
<div class="details">
    <table>
        <tr><td>Atleta</td><td>{$athleteName}</td></tr>
        <tr><td>Codice Fiscale</td><td>{$fiscalCode}</td></tr>
        <tr><td>Quota/Rata</td><td>{$installment['title']}</td></tr>
        <tr><td>Rif. Pagamento</td><td>{$instId}</td></tr>
        <tr><td>Data Pagamento</td><td>{$paidDate}</td></tr>
        <tr><td>Metodo</td><td>{$method}</td></tr>
    </table>
</div>
<div class="amount">
    <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Importo pagato</div>
    <div class="value">€ {$amount}</div>
    <div style="font-size: 11px; color: #666; margin-top: 5px;">
    Quota istituzionale esente IVA art. 4 DPR 633/72.
    </div>
</div>
<div class="footer">
    <p>Generata automaticamente da Fusion ERP — {$paidDate}</p>
</div>
</body>
</html>
HTML;
    }
}