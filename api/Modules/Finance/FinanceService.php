<?php
/**
 * Finance Service
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Finance;

class FinanceService
{
    private FinanceRepository $repository;

    public function __construct(FinanceRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get dashboard data
     */
    public function getDashboardData(?string $fiscalYear = null): array
    {
        // ... (Logic to determine date range based on fiscal year if needed)
        $startDate = date('Y-01-01');
        $endDate = date('Y-12-31');
        
        $totals = $this->repository->getDashboardTotals($startDate, $endDate);
        $recent = $this->repository->getRecentEntries(10);
        $trend = $this->repository->getMonthlyTrend($fiscalYear ?? date('Y'));

        return [
            'total_income' => (float)($totals['total_income'] ?? 0),
            'total_expenses' => (float)($totals['total_expenses'] ?? 0),
            'balance' => (float)(($totals['total_income'] ?? 0) - ($totals['total_expenses'] ?? 0)),
            'entry_count' => count($recent),
            'recent_entries' => $recent,
            'monthly_trend' => $trend,
            'fiscal_year' => ['label' => date('Y'), 'start_date' => $startDate, 'end_date' => $endDate]
        ];
    }

    /**
     * Get entry detail
     */
    public function getEntryDetail(string $id): array
    {
        $entry = $this->repository->getEntryById($id);
        if (!$entry) {
            throw new \Exception('Registrazione non trovata', 404);
        }
        return ['entry' => $entry];
    }

    /**
     * Create a new double-entry record
     */
    public function createEntry(array $data, string $userId): string
    {
        // Validation
        if (empty($data['description'])) throw new \Exception('Descrizione obbligatoria');
        if (empty($data['entry_date'])) throw new \Exception('Data obbligatoria');
        if (empty($data['lines']) || count($data['lines']) < 2) throw new \Exception('Registrazione incompleta (min. 2 righe)');

        // Balance check
        $totalDebit = 0;
        $totalCredit = 0;
        foreach ($data['lines'] as $line) {
            $totalDebit += (float)($line['debit'] ?? 0);
            $totalCredit += (float)($line['credit'] ?? 0);
        }

        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \Exception('La registrazione non quadra (Bilancio Dare/Avere sbilanciato)');
        }

        $data['created_by'] = $userId;
        return $this->repository->createEntry($data);
    }

    /**
     * Get invoices
     */
    public function getInvoices(int $limit = 50): array
    {
        $invoices = $this->repository->getInvoices($limit);
        return array_map(function($inv) {
            $inv['total_amount'] = (float)($inv['total_amount'] ?? 0);
            return $inv;
        }, $invoices);
    }

    /**
     * Calculate taxes for sport workers (Riforma dello Sport)
     */
    public function calculateSportTaxes(float $amount, float $previousIncome = 0.0): array
    {
        $totalIncome = $previousIncome + $amount;
        $inpsExemptionThreshold = 5000.00;
        $irpefExemptionThreshold = 15000.00;

        $taxableInps = 0.0;
        $taxableIrpef = 0.0;

        if ($totalIncome > $inpsExemptionThreshold) {
            $taxableInps = min($amount, $totalIncome - $inpsExemptionThreshold);
            if ($previousIncome > $inpsExemptionThreshold) {
                $taxableInps = $amount;
            }
        }

        if ($totalIncome > $irpefExemptionThreshold) {
            $taxableIrpef = min($amount, $totalIncome - $irpefExemptionThreshold);
            if ($previousIncome > $irpefExemptionThreshold) {
                $taxableIrpef = $amount;
            }
        }

        $inpsRate = 0.25;
        $inpsTaxableBase = $taxableInps * 0.5;
        $inpsContribution = $inpsTaxableBase * $inpsRate;

        $irpefRate = 0.23;
        $irpefContribution = $taxableIrpef * $irpefRate;

        $workerInpsShare = $inpsContribution / 3;

        return [
            'amount' => $amount,
            'previous_income' => $previousIncome,
            'total_income' => $totalIncome,
            'taxable_inps' => $taxableInps,
            'inps_contribution' => $inpsContribution,
            'inps_worker_share' => $workerInpsShare,
            'taxable_irpef' => $taxableIrpef,
            'irpef_contribution' => $irpefContribution,
            'net_amount' => $amount - $workerInpsShare - $irpefContribution
        ];
    }
}


