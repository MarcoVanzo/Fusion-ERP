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

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get chart of accounts
     */
    public function getChartOfAccounts(): array
    {
        $stmt = $this->db->query("SELECT id, code, name, type, is_system FROM finance_accounts ORDER BY code ASC");
        return $stmt->fetchAll();
    }

    /**
     * Get account by ID
     */
    public function getAccountById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM finance_accounts WHERE id = ?");
        $stmt->execute([$id]);
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
            FROM finance_entries e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.entry_date DESC, e.id DESC
            LIMIT ?
        ");
        $stmt->bindValue(1, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Get entry by ID
     */
    public function getEntryById(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT e.*, u.display_name as created_by_name
            FROM finance_entries e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.id = ?
        ");
        $stmt->execute([$id]);
        $entry = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;

        if ($entry) {
            $lineStmt = $this->db->prepare("
                SELECT l.*, a.code, a.name as account_name
                FROM finance_entry_lines l
                JOIN finance_accounts a ON l.account_id = a.id
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
        // Simplified logic: calculate totals from entries
        $stmt = $this->db->prepare("
            SELECT 
                SUM(CASE WHEN a.type = 'entrata' THEN l.credit - l.debit ELSE 0 END) as total_income,
                SUM(CASE WHEN a.type = 'uscita' THEN l.debit - l.credit ELSE 0 END) as total_expenses
            FROM finance_entry_lines l
            JOIN finance_entries e ON l.entry_id = e.id
            JOIN finance_accounts a ON l.account_id = a.id
            WHERE e.entry_date BETWEEN ? AND ?
        ");
        $stmt->execute([$startDate, $endDate]);
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
            FROM finance_entry_lines l
            JOIN finance_entries e ON l.entry_id = e.id
            JOIN finance_accounts a ON l.account_id = a.id
            WHERE YEAR(e.entry_date) = ?
            GROUP BY month
            ORDER BY month ASC
        ");
        $stmt->execute([$year]);
        return $stmt->fetchAll();
    }

    /**
     * Create entry
     */
    public function createEntry(array $data): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("
                INSERT INTO finance_entries (entry_date, description, category, payment_method, reference, entry_number, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            // Get next entry number
            $year = date('Y', strtotime($data['entry_date']));
            $numStmt = $this->db->prepare("SELECT MAX(entry_number) FROM finance_entries WHERE YEAR(entry_date) = ?");
            $numStmt->execute([$year]);
            $nextNum = ($numStmt->fetchColumn() ?: 0) + 1;

            $stmt->execute([
                $data['entry_date'],
                $data['description'],
                $data['category'] ?? null,
                $data['payment_method'] ?? null,
                $data['reference'] ?? null,
                $nextNum,
                $data['created_by']
            ]);
            $entryId = (int)$this->db->lastInsertId();

            $lineStmt = $this->db->prepare("
                INSERT INTO finance_entry_lines (entry_id, account_id, debit, credit, description)
                VALUES (?, ?, ?, ?, ?)
            ");

            foreach ($data['lines'] as $line) {
                $lineStmt->execute([
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
            $this->db->rollBack();
            throw $e;
        }
    }
}
