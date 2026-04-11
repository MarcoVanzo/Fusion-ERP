<?php
/**
 * Finance Controller - Thin Controller
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Finance;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

class FinanceController
{
    private FinanceRepository $repository;
    private FinanceService $service;

    public function __construct()
    {
        $this->repository = new FinanceRepository();
        $this->service = new FinanceService($this->repository);
    }

    private function handleServiceCall(callable $callback): void
    {
        try {
            Response::success($callback());
        } catch (\Throwable $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code < 600) ? $code : 500;
            error_log("[Finance] API Error ({$httpCode}): " . $e->getMessage());
            Response::error($e->getMessage(), $httpCode);
        }
    }

    public function dashboard(): void
    {
        Auth::requireRead('finance');
        $this->handleServiceCall(fn() => $this->service->getDashboardData());
    }

    public function categories(): void
    {
        Auth::requireRead('finance');
        $this->handleServiceCall(fn() => ['categories' => $this->repository->getCategories()]);
    }

    public function chartOfAccounts(): void
    {
        Auth::requireRead('finance');
        $this->handleServiceCall(fn() => $this->repository->getChartOfAccounts());
    }

    public function listEntries(): void
    {
        Auth::requireRead('finance');
        $this->handleServiceCall(fn() => [
            'entries' => $this->repository->getRecentEntries(50),
            'total' => 50, // Simplified pagination for now
            'page' => 1,
            'pages' => 1
        ]);
    }

    public function getEntry(): void
    {
        Auth::requireRead('finance');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        if (!$id) {
            Response::error('ID registrazione non valido', 400);
        }
        $this->handleServiceCall(fn() => $this->service->getEntryDetail($id));
    }

    public function createEntry(): void
    {
        $user = Auth::requireWrite('finance');
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        
        $this->handleServiceCall(fn() => [
            'id' => $this->service->createEntry($data, $user['id']),
            'message' => 'Registrazione salvata'
        ]);
    }

    public function listInvoices(): void
    {
        Auth::requireRead('finance');
        $this->handleServiceCall(fn() => [
            'invoices' => $this->service->getInvoices()
        ]);
    }

    public function calculateSportTaxes(): void
    {
        Auth::requireRead('finance');
        $amount = (float)filter_input(INPUT_GET, 'amount', FILTER_VALIDATE_FLOAT) ?: 0.0;
        $previousIncome = (float)filter_input(INPUT_GET, 'previous_income', FILTER_VALIDATE_FLOAT) ?: 0.0;

        $this->handleServiceCall(fn() => $this->service->calculateSportTaxes($amount, $previousIncome));
    }
}