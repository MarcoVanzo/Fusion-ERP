<?php

declare(strict_types=1);

namespace FusionERP\Modules\Finance\Services;

use PDO;
use FusionERP\Shared\TenantContext;

class PdfReportService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function downloadRendicontoPdf(array $data): void
    {
        // Get tenant info
        $tid = TenantContext::id();
        $stmt = $this->db->prepare('SELECT name, cf, piva, address, city FROM tenants WHERE id = :id');
        $stmt->execute([':id' => $tid]);
        $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

        $html = '<style>
            body { font-family: sans-serif; font-size: 11pt; color: #333; }
            h1 { text-align: center; font-size: 16pt; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 12pt; margin-bottom: 20px; font-weight: normal; }
            h3 { font-size: 12pt; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 20px;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { padding: 6px; text-align: left; }
            .amt { text-align: right; }
            .total-row td { border-top: 1px solid #666; font-weight: bold; }
            .grand-total { font-size: 14pt; text-align: center; margin-top: 30px; font-weight: bold; padding: 10px; border: 2px solid #333; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
        </style>';

        $html .= '<h1>' . htmlspecialchars($tenant['name'] ?? 'ASD') . '</h1>';
        $html .= '<h2>Rendiconto per Cassa (Mod. D)<br>Esercizio: ' . htmlspecialchars($data['fiscal_year']['label'] ?? '') . '</h2>';

        foreach ($data['sections'] as $sec) {
            $html .= '<h3>' . htmlspecialchars($sec['label']) . '</h3>';
            $html .= '<table>';
            foreach ($sec['accounts'] as $acc) {
                if ($acc['balance'] == 0) continue;
                $html .= '<tr>';
                $html .= '<td>[' . htmlspecialchars($acc['code']) . '] ' . htmlspecialchars($acc['name']) . '</td>';
                $html .= '<td class="amt">&euro; ' . number_format($acc['balance'], 2, ',', '.') . '</td>';
                $html .= '</tr>';
            }
            $html .= '<tr class="total-row">';
            $html .= '<td>Totale ' . htmlspecialchars($sec['label']) . '</td>';
            $html .= '<td class="amt">&euro; ' . number_format($sec['total'], 2, ',', '.') . '</td>';
            $html .= '</tr>';
            $html .= '</table>';
        }

        $colorClass = $data['avanzo_disavanzo'] >= 0 ? 'positive' : 'negative';
        $html .= '<div class="grand-total ' . $colorClass . '">' . htmlspecialchars($data['avanzo_label']) . ': &euro; ' . number_format($data['avanzo_disavanzo'], 2, ',', '.') . '</div>';

        require_once dirname(__DIR__, 4) . '/vendor/autoload.php';
        $mpdf = new \Mpdf\Mpdf([
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'margin_header' => 9,
            'margin_footer' => 9
        ]);

        $mpdf->SetTitle('Rendiconto ETS');
        $mpdf->WriteHTML($html);
        $mpdf->Output('Rendiconto_' . ($data['fiscal_year']['label'] ?? 'ETS') . '.pdf', 'D');
        exit;
    }
}
