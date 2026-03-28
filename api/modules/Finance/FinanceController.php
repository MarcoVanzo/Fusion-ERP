<?php
/**
 * Finance Controller — ASD/SSD Accounting + Invoicing
 * Fusion ERP v1.0
 *
 * Handles: chart of accounts, journal entries (prima nota), rendiconto ETS,
 *          invoices (draft/preview), fiscal years.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Finance;

use FusionERP\Modules\Finance\Services\ETSReportService;
use FusionERP\Modules\Finance\Services\PdfReportService;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Database;
use PDO;

class FinanceController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── DASHBOARD ────────────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=dashboard
     * Returns KPIs: total income, expenses, balance, recent entries, fiscal year info
     */
    public function dashboard(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        // Current fiscal year
        $fyStmt = $this->db->prepare(
            'SELECT * FROM fiscal_years WHERE tenant_id = :tid AND is_current = 1 LIMIT 1'
        );
        $fyStmt->execute([':tid' => $tid]);
        $fy = $fyStmt->fetch(PDO::FETCH_ASSOC);

        $startDate = $fy['start_date'] ?? date('Y') . '-01-01';
        $endDate = $fy['end_date'] ?? date('Y') . '-12-31';

        // Income vs Expenses
        $kpiStmt = $this->db->prepare(
            'SELECT
                COALESCE(SUM(CASE WHEN coa.type = \'entrata\' THEN jl.credit - jl.debit ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN coa.type = \'uscita\' THEN jl.debit - jl.credit ELSE 0 END), 0) AS total_expenses
             FROM journal_entries je
             JOIN journal_lines jl ON jl.entry_id = je.id
             JOIN chart_of_accounts coa ON coa.id = jl.account_id
             WHERE je.tenant_id = :tid AND je.deleted_at IS NULL
               AND je.entry_date BETWEEN :start AND :end'
        );
        $kpiStmt->execute([':tid' => $tid, ':start' => $startDate, ':end' => $endDate]);
        $kpi = $kpiStmt->fetch(PDO::FETCH_ASSOC);

        $totalIncome = (float)($kpi['total_income'] ?? 0);
        $totalExpenses = (float)($kpi['total_expenses'] ?? 0);

        // Recent entries
        $recentStmt = $this->db->prepare(
            'SELECT je.id, je.entry_number, je.entry_date, je.description,
                    je.total_amount, je.category, je.payment_method, je.created_at
             FROM journal_entries je
             WHERE je.tenant_id = :tid AND je.deleted_at IS NULL
             ORDER BY je.entry_date DESC, je.created_at DESC
             LIMIT 10'
        );
        $recentStmt->execute([':tid' => $tid]);
        $recent = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

        // Monthly trend (last 6 months)
        $trendStmt = $this->db->prepare(
            'SELECT DATE_FORMAT(je.entry_date, \'%Y-%m\') AS month,
                    COALESCE(SUM(CASE WHEN coa.type = \'entrata\' THEN jl.credit ELSE 0 END), 0) AS income,
                    COALESCE(SUM(CASE WHEN coa.type = \'uscita\' THEN jl.debit ELSE 0 END), 0) AS expenses
             FROM journal_entries je
             JOIN journal_lines jl ON jl.entry_id = je.id
             JOIN chart_of_accounts coa ON coa.id = jl.account_id
             WHERE je.tenant_id = :tid AND je.deleted_at IS NULL
               AND je.entry_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY month ORDER BY month'
        );
        $trendStmt->execute([':tid' => $tid]);
        $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

        // Entry count
        $countStmt = $this->db->prepare(
            'SELECT COUNT(*) AS cnt FROM journal_entries WHERE tenant_id = :tid AND deleted_at IS NULL'
        );
        $countStmt->execute([':tid' => $tid]);
        $count = (int)$countStmt->fetchColumn();

        Response::success([
            'fiscal_year' => $fy,
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'balance' => $totalIncome - $totalExpenses,
            'entry_count' => $count,
            'recent_entries' => $recent,
            'monthly_trend' => $trend,
        ]);
    }

    // ─── CHART OF ACCOUNTS ────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=chartOfAccounts
     */
    public function chartOfAccounts(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT id, code, name, type, parent_id, is_system, is_active, sort_order
             FROM chart_of_accounts
             WHERE tenant_id = :tid
             ORDER BY sort_order, code'
        );
        $stmt->execute([':tid' => $tid]);

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * POST /api/?module=finance&action=createAccount
     */
    public function createAccount(): void
    {
        Auth::requireWrite('finance');
        $body = Response::jsonBody();
        Response::requireFields($body, ['code', 'name', 'type']);

        $tid = TenantContext::id();
        $id = 'COA_' . bin2hex(random_bytes(4));
        $type = in_array($body['type'], ['entrata', 'uscita', 'patrimoniale_attivo', 'patrimoniale_passivo'])
            ? $body['type'] : 'entrata';

        $stmt = $this->db->prepare(
            'INSERT INTO chart_of_accounts (id, tenant_id, code, name, type, parent_id, sort_order)
             VALUES (:id, :tid, :code, :name, :type, :pid, :sort)'
        );
        $stmt->execute([
            ':id' => $id,
            ':tid' => $tid,
            ':code' => trim($body['code']),
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':type' => $type,
            ':pid' => $body['parent_id'] ?? null,
            ':sort' => (int)($body['sort_order'] ?? 999),
        ]);

        Audit::log('INSERT', 'chart_of_accounts', $id, null, ['code' => $body['code'], 'name' => $body['name']]);
        Response::success(['id' => $id], 201);
    }

    // ─── JOURNAL ENTRIES (Prima Nota) ─────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=listEntries
     */
    public function listEntries(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        $from = filter_input(INPUT_GET, 'from', FILTER_DEFAULT) ?: null;
        $to = filter_input(INPUT_GET, 'to', FILTER_DEFAULT) ?: null;
        $cat = filter_input(INPUT_GET, 'category', FILTER_DEFAULT) ?: null;
        $page = max(1, (int)(filter_input(INPUT_GET, 'page') ?? '1'));
        $limit = 30;
        $offset = ($page - 1) * $limit;

        // ── Build parameterised WHERE ─────────────────────────────────────────
        // Using array-of-clauses pattern: each clause is paired with its binding
        // in $params at definition time, making it structurally impossible to
        // add a clause without also binding its value.
        $clauses = ['je.tenant_id = :tid', 'je.deleted_at IS NULL'];
        $params = [':tid' => $tid];

        if ($from) {
            $clauses[] = 'je.entry_date >= :from';
            $params[':from'] = $from;
        }
        if ($to) {
            $clauses[] = 'je.entry_date <= :to';
            $params[':to'] = $to;
        }
        if ($cat) {
            $clauses[] = 'je.category = :cat';
            $params[':cat'] = $cat;
        }

        $whereSQL = implode(' AND ', $clauses);

        // Count
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM journal_entries je WHERE {$whereSQL}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Fetch
        $stmt = $this->db->prepare(
            "SELECT je.*, u.full_name AS created_by_name
             FROM journal_entries je
             LEFT JOIN users u ON u.id = je.created_by
             WHERE {$whereSQL}
             ORDER BY je.entry_date DESC, je.entry_number DESC
             LIMIT " . (string)$limit . " OFFSET " . (string)$offset . ""
        );
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'entries' => $entries,
            'total' => $total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit),
        ]);
    }

    /**
     * GET /api/?module=finance&action=getEntry&id=JE_xxx
     */
    public function getEntry(): void
    {
        Auth::requireRead('finance');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT je.*, u.full_name AS created_by_name
             FROM journal_entries je
             LEFT JOIN users u ON u.id = je.created_by
             WHERE je.id = :id AND je.tenant_id = :tid AND je.deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id, ':tid' => $tid]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$entry) {
            Response::error('Registrazione non trovata', 404);
        }

        // Fetch lines
        $linesStmt = $this->db->prepare(
            'SELECT jl.*, coa.code AS account_code, coa.name AS account_name, coa.type AS account_type
             FROM journal_lines jl
             JOIN chart_of_accounts coa ON coa.id = jl.account_id
             WHERE jl.entry_id = :eid
             ORDER BY jl.sort_order'
        );
        $linesStmt->execute([':eid' => $id]);
        $entry['lines'] = $linesStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($entry);
    }

    /**
     * POST /api/?module=finance&action=createEntry
     * Body: { description, entry_date, category, payment_method, lines: [{account_id, debit, credit, notes}] }
     */
    public function createEntry(): void
    {
        $user = Auth::requireWrite('finance');
        $body = Response::jsonBody();
        Response::requireFields($body, ['description', 'entry_date', 'lines']);

        if (!is_array($body['lines']) || count($body['lines']) < 1) {
            Response::error('Almeno una riga è obbligatoria', 400);
        }

        $tid = TenantContext::id();
        $entryId = 'JE_' . bin2hex(random_bytes(4));

        // Get next entry number
        $numStmt = $this->db->prepare(
            'SELECT COALESCE(MAX(entry_number), 0) + 1 FROM journal_entries
             WHERE tenant_id = :tid AND YEAR(entry_date) = YEAR(:dt)'
        );
        $numStmt->execute([':tid' => $tid, ':dt' => $body['entry_date']]);
        $entryNumber = (int)$numStmt->fetchColumn();

        // Calculate total
        $totalDebit = 0;
        $totalCredit = 0;
        foreach ($body['lines'] as $line) {
            $totalDebit += (float)($line['debit'] ?? 0);
            $totalCredit += (float)($line['credit'] ?? 0);
        }

        $this->db->beginTransaction();
        try {
            // Insert entry
            $stmt = $this->db->prepare(
                'INSERT INTO journal_entries
                 (id, tenant_id, entry_number, entry_date, description, reference,
                  total_amount, payment_method, category, created_by)
                 VALUES (:id, :tid, :num, :dt, :desc, :ref, :total, :pm, :cat, :uid)'
            );
            $stmt->execute([
                ':id' => $entryId,
                ':tid' => $tid,
                ':num' => $entryNumber,
                ':dt' => $body['entry_date'],
                ':desc' => htmlspecialchars(trim($body['description']), ENT_QUOTES, 'UTF-8'),
                ':ref' => $body['reference'] ?? null,
                ':total' => max($totalDebit, $totalCredit),
                ':pm' => $body['payment_method'] ?? null,
                ':cat' => $body['category'] ?? null,
                ':uid' => $user['id'],
            ]);

            // Insert lines
            $lineStmt = $this->db->prepare(
                'INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, notes, sort_order)
                 VALUES (:id, :eid, :aid, :debit, :credit, :notes, :sort)'
            );

            foreach ($body['lines'] as $i => $line) {
                $lineStmt->execute([
                    ':id' => 'JL_' . bin2hex(random_bytes(4)),
                    ':eid' => $entryId,
                    ':aid' => $line['account_id'],
                    ':debit' => (float)($line['debit'] ?? 0),
                    ':credit' => (float)($line['credit'] ?? 0),
                    ':notes' => $line['notes'] ?? null,
                    ':sort' => $i,
                ]);
            }

            $this->db->commit();
        }
        catch (\Exception $e) {
            $this->db->rollBack();
            Response::error('Errore durante il salvataggio: ' . $e->getMessage(), 500);
        }

        Audit::log('INSERT', 'journal_entries', $entryId, null, [
            'description' => $body['description'],
            'amount' => max($totalDebit, $totalCredit),
        ]);

        Response::success(['id' => $entryId, 'entry_number' => $entryNumber], 201);
    }

    /**
     * POST /api/?module=finance&action=updateEntry
     */
    public function updateEntry(): void
    {
        $user = Auth::requireWrite('finance');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $tid = TenantContext::id();
        $id = $body['id'];

        // Verify exists
        $check = $this->db->prepare(
            'SELECT id FROM journal_entries WHERE id = :id AND tenant_id = :tid AND deleted_at IS NULL'
        );
        $check->execute([':id' => $id, ':tid' => $tid]);
        if (!$check->fetch()) {
            Response::error('Registrazione non trovata', 404);
        }

        $this->db->beginTransaction();
        try {
            // Update entry
            $sets = [];
            $params = [':id' => $id];

            foreach (['description', 'entry_date', 'reference', 'payment_method', 'category'] as $field) {
                if (isset($body[$field])) {
                    $sets[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $field === 'description'
                        ? htmlspecialchars(trim($body[$field]), ENT_QUOTES, 'UTF-8')
                        : $body[$field];
                }
            }

            if (!empty($sets)) {
                $sql = 'UPDATE journal_entries SET ' . implode(', ', $sets) . ' WHERE id = :id';
                $this->db->prepare($sql)->execute($params);
            }

            // Replace lines if provided
            if (isset($body['lines']) && is_array($body['lines'])) {
                $this->db->prepare('DELETE FROM journal_lines WHERE entry_id = :eid')->execute([':eid' => $id]);

                $totalDebit = 0;
                $totalCredit = 0;
                $lineStmt = $this->db->prepare(
                    'INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, notes, sort_order)
                     VALUES (:id, :eid, :aid, :debit, :credit, :notes, :sort)'
                );

                foreach ($body['lines'] as $i => $line) {
                    $d = (float)($line['debit'] ?? 0);
                    $c = (float)($line['credit'] ?? 0);
                    $totalDebit += $d;
                    $totalCredit += $c;

                    $lineStmt->execute([
                        ':id' => 'JL_' . bin2hex(random_bytes(4)),
                        ':eid' => $id,
                        ':aid' => $line['account_id'],
                        ':debit' => $d,
                        ':credit' => $c,
                        ':notes' => $line['notes'] ?? null,
                        ':sort' => $i,
                    ]);
                }

                // Update total
                $this->db->prepare('UPDATE journal_entries SET total_amount = :total WHERE id = :id')
                    ->execute([':total' => max($totalDebit, $totalCredit), ':id' => $id]);
            }

            $this->db->commit();
        }
        catch (\Exception $e) {
            $this->db->rollBack();
            Response::error('Errore durante l\'aggiornamento: ' . $e->getMessage(), 500);
        }

        Audit::log('UPDATE', 'journal_entries', $id);
        Response::success(['id' => $id]);
    }

    /**
     * POST /api/?module=finance&action=deleteEntry
     */
    public function deleteEntry(): void
    {
        Auth::requireWrite('finance');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'UPDATE journal_entries SET deleted_at = NOW() WHERE id = :id AND tenant_id = :tid AND deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id, ':tid' => $tid]);

        if ($stmt->rowCount() === 0) {
            Response::error('Registrazione non trovata', 404);
        }

        Audit::log('DELETE', 'journal_entries', $id);
        Response::success(['message' => 'Registrazione eliminata']);
    }

    // ─── RENDICONTO ETS ───────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=rendiconto
     * Generates the ETS-format financial report (Rendiconto Gestionale)
     */
    public function rendiconto(): void
    {
        Auth::requireRead('finance');
        $etsService = new ETSReportService($this->db);
        $data = $etsService->getRendicontoData();
        Response::success($data);
    }

    /**
     * GET /api/?module=finance&action=exportRendicontoPdf
     */
    public function exportRendicontoPdf(): void
    {
        Auth::requireRead('finance');
        $etsService = new ETSReportService($this->db);
        $data = $etsService->getRendicontoData();

        $pdfService = new PdfReportService($this->db);
        $pdfService->downloadRendicontoPdf($data);
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=listInvoices
     */
    public function listInvoices(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?: null;
        $page = max(1, (int)(filter_input(INPUT_GET, 'page') ?? '1'));
        $limit = 30;
        $offset = ($page - 1) * $limit;

        // ── Build parameterised WHERE ─────────────────────────────────────────
        $clauses = ['tenant_id = :tid', 'deleted_at IS NULL'];
        $params = [':tid' => $tid];

        if ($status) {
            $clauses[] = 'status = :status';
            $params[':status'] = $status;
        }

        $whereSQL = implode(' AND ', $clauses);

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM invoices WHERE {$whereSQL}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT * FROM invoices WHERE {$whereSQL}
             ORDER BY created_at DESC LIMIT " . (string)$limit . " OFFSET " . (string)$offset . ""
        );
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON line_items
        foreach ($invoices as &$inv) {
            $inv['line_items'] = $inv['line_items'] ? json_decode($inv['line_items'], true) : [];
        }

        Response::success([
            'invoices' => $invoices,
            'total' => $total,
            'page' => $page,
            'pages' => (int)ceil($total / $limit),
        ]);
    }

    /**
     * POST /api/?module=finance&action=createInvoice
     */
    public function createInvoice(): void
    {
        $user = Auth::requireWrite('finance');
        $body = Response::jsonBody();
        Response::requireFields($body, ['type', 'recipient_name', 'line_items']);

        $tid = TenantContext::id();
        $id = 'INV_' . bin2hex(random_bytes(4));
        $type = in_array($body['type'], ['fattura', 'ricevuta', 'nota_credito', 'proforma'])
            ? $body['type'] : 'ricevuta';

        // Get next invoice number
        $year = (int)date('Y');
        $seqStmt = $this->db->prepare(
            'INSERT INTO invoice_sequences (tenant_id, year, type, last_number)
             VALUES (:tid, :yr, :type, 1)
             ON DUPLICATE KEY UPDATE last_number = last_number + 1'
        );
        $seqStmt->execute([':tid' => $tid, ':yr' => $year, ':type' => $type]);

        $numStmt = $this->db->prepare(
            'SELECT last_number, prefix FROM invoice_sequences
             WHERE tenant_id = :tid AND year = :yr AND type = :type'
        );
        $numStmt->execute([':tid' => $tid, ':yr' => $year, ':type' => $type]);
        $seq = $numStmt->fetch(PDO::FETCH_ASSOC);

        $prefix = $seq['prefix'] ?? strtoupper(substr($type, 0, 2));
        $invoiceNumber = $prefix . '-' . $year . '/' . str_pad((string)$seq['last_number'], 4, '0', STR_PAD_LEFT);

        // Calculate totals
        $lineItems = $body['line_items'];
        $subtotal = 0;
        foreach ($lineItems as &$item) {
            $item['amount'] = (float)($item['qty'] ?? 1) * (float)($item['unit_price'] ?? 0);
            $subtotal += $item['amount'];
        }
        $taxRate = (float)($body['tax_rate'] ?? 0);
        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $total = $subtotal + $taxAmount;

        $stmt = $this->db->prepare(
            'INSERT INTO invoices
             (id, tenant_id, invoice_number, type, direction, recipient_name, recipient_cf,
              recipient_piva, recipient_address, sdi_code, pec, subtotal, tax_rate, tax_amount,
              total_amount, line_items, notes, created_by)
             VALUES (:id, :tid, :num, :type, :dir, :rname, :rcf, :rpiva, :raddr, :sdi, :pec,
                     :sub, :tax_rate, :tax_amt, :total, :items, :notes, :uid)'
        );
        $stmt->execute([
            ':id' => $id,
            ':tid' => $tid,
            ':num' => $invoiceNumber,
            ':type' => $type,
            ':dir' => $body['direction'] ?? 'out',
            ':rname' => htmlspecialchars(trim($body['recipient_name']), ENT_QUOTES, 'UTF-8'),
            ':rcf' => $body['recipient_cf'] ?? null,
            ':rpiva' => $body['recipient_piva'] ?? null,
            ':raddr' => $body['recipient_address'] ?? null,
            ':sdi' => $body['sdi_code'] ?? null,
            ':pec' => $body['pec'] ?? null,
            ':sub' => $subtotal,
            ':tax_rate' => $taxRate,
            ':tax_amt' => $taxAmount,
            ':total' => $total,
            ':items' => json_encode($lineItems),
            ':notes' => $body['notes'] ?? null,
            ':uid' => $user['id'],
        ]);

        Audit::log('INSERT', 'invoices', $id, null, ['number' => $invoiceNumber, 'total' => $total]);
        Response::success(['id' => $id, 'invoice_number' => $invoiceNumber], 201);
    }

    /**
     * GET /api/?module=finance&action=getInvoice&id=INV_xxx
     */
    public function getInvoice(): void
    {
        Auth::requireRead('finance');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT * FROM invoices WHERE id = :id AND tenant_id = :tid AND deleted_at IS NULL'
        );
        $stmt->execute([':id' => $id, ':tid' => $tid]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$inv) {
            Response::error('Documento non trovato', 404);
        }

        $inv['line_items'] = $inv['line_items'] ? json_decode($inv['line_items'], true) : [];
        Response::success($inv);
    }

    // ─── FISCAL YEARS ─────────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=fiscalYears
     */
    public function fiscalYears(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        $stmt = $this->db->prepare(
            'SELECT * FROM fiscal_years WHERE tenant_id = :tid ORDER BY start_date DESC'
        );
        $stmt->execute([':tid' => $tid]);

        Response::success($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * GET /api/?module=finance&action=getFiscal74ter
     * Calculates 74-ter specific data (margins and VAT) based on journal entries.
     */
    public function getFiscal74ter(): void
    {
        Auth::requireRead('finance');
        $tid = TenantContext::id();

        // Current fiscal year
        $fyStmt = $this->db->prepare(
            'SELECT * FROM fiscal_years WHERE tenant_id = :tid AND is_current = 1 LIMIT 1'
        );
        $fyStmt->execute([':tid' => $tid]);
        $fy = $fyStmt->fetch(PDO::FETCH_ASSOC);

        $startDate = $fy['start_date'] ?? date('Y') . '-01-01';
        $endDate = $fy['end_date'] ?? date('Y') . '-12-31';

        $stmt = $this->db->prepare(
            'SELECT
                DATE_FORMAT(je.entry_date, \'%Y-%m\') AS month,
                COALESCE(SUM(CASE WHEN coa.type = \'entrata\' THEN jl.credit - jl.debit ELSE 0 END), 0) AS sales,
                COALESCE(SUM(CASE WHEN coa.type = \'uscita\' AND (je.category = \'74ter\' OR je.description LIKE \'%74-ter%\') THEN jl.debit - jl.credit ELSE 0 END), 0) AS acquisitions
             FROM journal_entries je
             JOIN journal_lines jl ON jl.entry_id = je.id
             JOIN chart_of_accounts coa ON coa.id = jl.account_id
             WHERE je.tenant_id = :tid AND je.deleted_at IS NULL
               AND je.entry_date BETWEEN :start AND :end
             GROUP BY month ORDER BY month'
        );
        $stmt->execute([':tid' => $tid, ':start' => $startDate, ':end' => $endDate]);
        $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $totalSales = 0;
        $totalAcq = 0;

        foreach ($trend as &$m) {
            $m['sales'] = (float)$m['sales'];
            $m['acquisitions'] = (float)$m['acquisitions'];
            $m['margin'] = max(0, $m['sales'] - $m['acquisitions']);
            $totalSales += $m['sales'];
            $totalAcq += $m['acquisitions'];
        }

        $totalMargin = max(0, $totalSales - $totalAcq);
        $vatDue = ($totalMargin / 1.22) * 0.22;

        Response::success([
            'total_billed' => $totalSales,
            'margin_74ter' => $totalMargin,
            'vat_due' => $vatDue,
            'monthly_trend' => $trend
        ]);
    }

    // ─── CATEGORIES ENUM ──────────────────────────────────────────────────────

    /**
     * GET /api/?module=finance&action=categories
     * Returns available entry categories for the UI dropdown
     */
    public function categories(): void
    {
        Auth::requireRead('finance');

        Response::success([
            'categories' => [
                'quote_soci' => 'Quote associative',
                'iscrizioni' => 'Iscrizioni corsi',
                'sponsor' => 'Sponsorizzazioni',
                '74ter' => 'Servizi 74-ter',
                'contributi' => 'Contributi pubblici',
                'eventi' => 'Eventi / Manifestazioni',
                'donazioni' => 'Donazioni',
                'compensi' => 'Compensi collaboratori',
                'rimborsi' => 'Rimborsi spese',
                'affitto' => 'Affitto impianti',
                'utenze' => 'Utenze',
                'attrezzatura' => 'Attrezzatura sportiva',
                'tesseramenti' => 'Tesseramenti / Affiliazioni',
                'assicurazioni' => 'Assicurazioni',
                'trasferte' => 'Trasferte',
                'amministrativo' => 'Spese amministrative',
                'altro' => 'Altro',
            ],
        ]);
    }
}