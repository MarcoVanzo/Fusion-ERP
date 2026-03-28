<?php

declare(strict_types=1);

namespace FusionERP\Modules\Finance\Services;

use FusionERP\Shared\TenantContext;
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use PDO;

class ETSReportService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getRendicontoData(?string $fyId = null): array
    {
        $tid = TenantContext::id();

        if ($fyId) {
            $fyStmt = $this->db->prepare(
                'SELECT * FROM fiscal_years WHERE id = :id AND tenant_id = :tid'
            );
            $fyStmt->execute([':id' => $fyId, ':tid' => $tid]);
        } else {
            $fyStmt = $this->db->prepare(
                'SELECT * FROM fiscal_years WHERE tenant_id = :tid AND is_current = 1 LIMIT 1'
            );
            $fyStmt->execute([':tid' => $tid]);
        }
        
        $fy = $fyStmt->fetch(PDO::FETCH_ASSOC);

        if (!$fy) {
            Response::error('Anno fiscale non trovato', 404);
        }

        // Get all account balances
        $balanceStmt = $this->db->prepare(
            'SELECT coa.id, coa.code, coa.name, coa.type,
                    COALESCE(SUM(jl.debit), 0) AS total_debit,
                    COALESCE(SUM(jl.credit), 0) AS total_credit
             FROM chart_of_accounts coa
             LEFT JOIN journal_lines jl ON jl.account_id = coa.id
             LEFT JOIN journal_entries je ON je.id = jl.entry_id
                   AND je.deleted_at IS NULL
                   AND je.entry_date BETWEEN :start AND :end
             WHERE coa.tenant_id = :tid
             GROUP BY coa.id, coa.code, coa.name, coa.type
             ORDER BY coa.sort_order, coa.code'
        );
        $balanceStmt->execute([
            ':tid' => $tid,
            ':start' => $fy['start_date'],
            ':end' => $fy['end_date'],
        ]);
        $accounts = $balanceStmt->fetchAll(PDO::FETCH_ASSOC);

        // Organize by type
        $sections = [
            'entrata' => ['label' => 'A) Proventi e ricavi', 'accounts' => [], 'total' => 0],
            'uscita' => ['label' => 'B) Costi e oneri', 'accounts' => [], 'total' => 0],
            'patrimoniale_attivo' => ['label' => 'Attività', 'accounts' => [], 'total' => 0],
            'patrimoniale_passivo' => ['label' => 'Passività', 'accounts' => [], 'total' => 0],
        ];

        foreach ($accounts as $acc) {
            $balance = 0;
            if ($acc['type'] === 'entrata') {
                $balance = (float)$acc['total_credit'] - (float)$acc['total_debit'];
            } elseif ($acc['type'] === 'uscita') {
                $balance = (float)$acc['total_debit'] - (float)$acc['total_credit'];
            } elseif ($acc['type'] === 'patrimoniale_attivo') {
                $balance = (float)$acc['total_debit'] - (float)$acc['total_credit'];
            } else {
                $balance = (float)$acc['total_credit'] - (float)$acc['total_debit'];
            }

            if (isset($sections[$acc['type']])) {
                $sections[$acc['type']]['accounts'][] = [
                    'code' => $acc['code'],
                    'name' => $acc['name'],
                    'balance' => $balance,
                ];
                $sections[$acc['type']]['total'] += $balance;
            }
        }

        $avanzo = $sections['entrata']['total'] - $sections['uscita']['total'];

        return [
            'fiscal_year' => $fy,
            'sections' => $sections,
            'avanzo_disavanzo' => $avanzo,
            'avanzo_label' => $avanzo >= 0 ? 'Avanzo di gestione' : 'Disavanzo di gestione',
        ];
    }
}
