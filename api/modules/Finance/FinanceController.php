<?php
/**
 * Finance Controller - Thin Controller
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Finance;

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
            error_log("[Finance] API Error: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }

    public function dashboard(): void
    {
        $this->handleServiceCall(fn() => $this->service->getDashboardData());
    }

    public function categories(): void
    {
        $this->handleServiceCall(fn() => ['categories' => $this->repository->getCategories()]);
    }

    public function chartOfAccounts(): void
    {
        $this->handleServiceCall(fn() => $this->repository->getChartOfAccounts());
    }

    public function listEntries(): void
    {
        $this->handleServiceCall(fn() => [
            'entries' => $this->repository->getRecentEntries(50),
            'total' => 50, // Simplified pagination for now
            'page' => 1,
            'pages' => 1
        ]);
    }

    public function getEntry(): void
    {
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        if (!$id) {
            Response::error('ID registrazione non valido', 400);
        }
        $this->handleServiceCall(fn() => $this->service->getEntryDetail($id));
    }

    public function createEntry(): void
    {
        $user = \FusionERP\Shared\Auth::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        
        $this->handleServiceCall(fn() => [
            'id' => $this->service->createEntry($data, $user['id']),
            'message' => 'Registrazione salvata'
        ]);
    }

    public function listInvoices(): void
    {
        $this->handleServiceCall(fn() => [
            'invoices' => $this->service->getInvoices()
        ]);
    }
}