<?php
/**
 * Finance Repository
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Finance;

use FusionERP\Shared\Database;

class FinanceRepository
{
    private \PDO $db;
    private string $tid;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->tid = \FusionERP\Shared\TenantContext::id();
    }

    /**
     * Get chart of accounts
     */
    public function getChartOfAccounts(): array
    {
        $stmt = $this->db->prepare("SELECT id, code, name, type, is_system FROM chart_of_accounts WHERE tenant_id = ? AND is_active = 1 ORDER BY code ASC");
        $stmt->execute([$this->tid]);
        return $stmt->fetchAll();
    }

    /**
     * Get account by ID
     */
    public function getAccountById(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM chart_of_accounts WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $this->tid]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Get financial categories
     */
    public function getCategories(): array
    {
        // For simplicity, we use predefined categories or from a dedicated table if exists
        // Current implementation uses a mapping in the frontend, but we can store it in DB
        return [
            'quote' => 'Quote Associative',
            'sponsor' => 'Sponsorizzazioni',
            'contributi' => 'Contributi Pubblici',
            'donazioni' => 'Donazioni Liberali',
            'eventi' => 'Eventi e Tornei',
            'spese_generali' => 'Spese Generali',
            'trasporto' => 'Trasporti e Trasferte',
            'foresteria' => 'Spese Foresteria',
            'personale' => 'Collaboratori e Personale',
            'materiale' => 'Materiale Sportivo'
        ];
    }

    /**
     * Get recent entries
     */
    public function getRecentEntries(int $limit = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, 
                   u.display_name as created_by_name
            FROM journal_entries e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.tenant_id = ? AND e.deleted_at IS NULL
            ORDER BY e.entry_date DESC, e.id DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $this->tid, \PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Get entry by ID
     */
    public function getEntryById(string $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, u.display_name as created_by_name
            FROM journal_entries e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = ? AND e.tenant_id = ?
        ");
        $stmt->execute([$id, $this->tid]);
        $entry = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;

        if ($entry) {
            $lineStmt = $this->db->prepare("
                SELECT l.*, a.code, a.name as account_name
                FROM journal_lines l
                JOIN chart_of_accounts a ON l.account_id = a.id
                WHERE l.entry_id = ?
            ");
            $lineStmt->execute([$id]);
            $entry['lines'] = $lineStmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        return $entry;
    }

    /**
     * Get totals for dashboard
     */
    public function getDashboardTotals(string $startDate, string $endDate): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                SUM(CASE WHEN a.type = 'entrata' THEN l.credit - l.debit ELSE 0 END) as total_income,
                SUM(CASE WHEN a.type = 'uscita' THEN l.debit - l.credit ELSE 0 END) as total_expenses
            FROM journal_lines l
            JOIN journal_entries e ON l.entry_id = e.id
            JOIN chart_of_accounts a ON l.account_id = a.id
            WHERE e.tenant_id = ? AND e.deleted_at IS NULL AND e.entry_date BETWEEN ? AND ?
        ");
        $stmt->execute([$this->tid, $startDate, $endDate]);
        return $stmt->fetch() ?: ['total_income' => 0, 'total_expenses' => 0];
    }

    /**
     * Get monthly trend
     */
    public function getMonthlyTrend(string $year): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                DATE_FORMAT(e.entry_date, '%Y-%m') as month,
                SUM(CASE WHEN a.type = 'entrata' THEN l.credit - l.debit ELSE 0 END) as income,
                SUM(CASE WHEN a.type = 'uscita' THEN l.debit - l.credit ELSE 0 END) as expenses
            FROM journal_lines l
            JOIN journal_entries e ON l.entry_id = e.id
            JOIN chart_of_accounts a ON l.account_id = a.id
            WHERE e.tenant_id = ? AND e.deleted_at IS NULL AND YEAR(e.entry_date) = ?
            GROUP BY month
            ORDER BY month ASC
        ");
        $stmt->execute([$this->tid, $year]);
        return $stmt->fetchAll();
    }

    /**
     * Create entry
     */
    public function createEntry(array $data): string
    {
        $this->db->beginTransaction();
        try {
            $entryId = $data['id'] ?? 'JE_' . bin2hex(random_bytes(8));
            
            $stmt = $this->db->prepare("
                INSERT INTO journal_entries (id, tenant_id, entry_date, description, category, payment_method, reference, entry_number, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            // Get next entry number
            $year = date('Y', strtotime($data['entry_date']));
            $numStmt = $this->db->prepare("SELECT MAX(entry_number) FROM journal_entries WHERE tenant_id = ? AND YEAR(entry_date) = ?");
            $numStmt->execute([$this->tid, $year]);
            $nextNum = ($numStmt->fetchColumn() ?: 0) + 1;

            $stmt->execute([
                $entryId,
                $this->tid,
                $data['entry_date'],
                $data['description'],
                $data['category'] ?? null,
                $data['payment_method'] ?? null,
                $data['reference'] ?? null,
                $nextNum,
                $data['created_by']
            ]);

            $lineStmt = $this->db->prepare("
                INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($data['lines'] as $i => $line) {
                $lineId = 'JL_' . bin2hex(random_bytes(8)) . '_' . $i;
                $lineStmt->execute([
                    $lineId,
                    $entryId,
                    $line['account_id'],
                    $line['debit'] ?? 0,
                    $line['credit'] ?? 0,
                    $line['description'] ?? $data['description']
                ]);
            }

            $this->db->commit();
            return $entryId;
        } catch (\Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /**

     * Get invoices
     */
    public function getInvoices(int $limit = 50): array
    {
        $stmt = $this->db->prepare("
            SELECT i.*, 
                   i.recipient_name as client_name,
                   i.created_at as invoice_date
            FROM invoices i
            WHERE i.tenant_id = ? AND i.deleted_at IS NULL
            ORDER BY i.created_at DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $this->tid, \PDO::PARAM_STR);
        $stmt->bindValue(2, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
