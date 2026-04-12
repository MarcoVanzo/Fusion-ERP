<?php

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments\Services;

require_once dirname(__DIR__, 3) . '/Shared/TenantContext.php';

use Mpdf\Mpdf;
use FusionERP\Shared\TenantContext;

class TournamentsPdfService
{
    private \PDO $db;

    public function __construct(\PDO $db)
    {
        $this->db = $db;
    }

    public function generateRoomingList(array $tournament, array $roster, array $societaProfile): void
    {
        // Setup mPDF - Autoloader is already loaded by router.php
        // Aruba optimization: use a writable temp folder
        $tempDir = dirname(__DIR__, 4) . '/uploads/tmp_pdf/';
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $mpdf = new Mpdf([
            'tempDir' => $tempDir,
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 35, // More space for header
            'margin_bottom' => 20,
            'margin_header' => 10,
            'margin_footer' => 10
        ]);

        // Logo resolution logic
        $rootPath = dirname(__DIR__, 4);
        $logoPath = $rootPath . '/uploads/images/Logo Colorato.png';
        
        // Ensure path is relative for mPDF to avoid some server-side absolute path blocks
        if (file_exists($logoPath)) {
            $logoSrc = $logoPath;
        } else {
            $logoSrc = $rootPath . '/fusion-website/public/assets/logo-colorato.png';
        }

        // Header content
        $headerHtml = '
        <table width="100%" style="border-bottom: 1px solid #eee; padding-bottom: 10px; vertical-align: middle;">
            <tr>
                <td width="50%">
                    <img src="' . $logoSrc . '" style="height: 60px;">
                </td>
                <td width="50%" style="text-align: right; font-size: 9pt; color: #555; line-height: 1.4;">
                    <strong>FUSION TEAM VOLLEY ASD</strong><br>
                    ' . htmlspecialchars($societaProfile['legal_address'] ?? '') . '<br>
                    P.IVA / C.F.: ' . htmlspecialchars($societaProfile['vat_number'] ?? '04515510271') . '<br>
                    fusionteamvolley.it | fusionteamvolley@gmail.com
                </td>
            </tr>
        </table>';

        $mpdf->SetHTMLHeader($headerHtml);

        // Footer content
        $mpdf->SetHTMLFooter('
        <table width="100%" style="font-size: 8pt; color: #999; border-top: 1px solid #eee; padding-top: 5px;">
            <tr>
                <td width="33%">{DATE j/m/Y}</td>
                <td width="33%" style="text-align: center;">Fusion ERP - Rooming List</td>
                <td width="33%" style="text-align: right;">Pagina {PAGENO} di {nbpg}</td>
            </tr>
        </table>');

        // Main HTML
        $html = '
        <style>
            body { font-family: "Inter", sans-serif; color: #333; line-height: 1.5; }
            .title-box { text-align: center; margin: 20px 0 30px 0; }
            .title-box h1 { font-family: "Barlow Condensed", sans-serif; font-size: 24pt; margin: 0; color: #000; text-transform: uppercase; }
            .title-box p { font-size: 11pt; color: #666; margin: 5px 0 0 0; }
            
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.data-table th { background-color: #f8f9fa; border-bottom: 2px solid #ddd; padding: 10px 8px; text-align: left; font-size: 10pt; text-transform: uppercase; color: #666; }
            table.data-table td { border-bottom: 1px solid #eee; padding: 10px 8px; font-size: 10pt; }
            
            .role-badge { font-size: 8pt; background: #eee; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
            .type-staff { color: #e91e63; font-weight: bold; }
            
            .signature-box { margin-top: 50px; }
            .signature-line { border-bottom: 1px solid #333; width: 250px; margin-top: 40px; }
            .signature-label { font-size: 9pt; color: #666; margin-top: 5px; }
        </style>

        <div class="title-box">
            <h1>Rooming List</h1>
            <p>' . htmlspecialchars($tournament['title']) . '</p>
            <p>' . Utils::formatDate($tournament['event_date']) . ' - ' . htmlspecialchars($tournament['location'] ?? '') . '</p>
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th width="30%">Cognome</th>
                    <th width="30%">Nome</th>
                    <th width="25%">Documento</th>
                    <th width="15%">Ruolo</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($roster as $member) {
            // Only confirmed members
            if ($member['attendance_status'] !== 'confirmed') continue;

            $roleClass = ($member['member_type'] === 'staff') ? 'type-staff' : '';
            $roleLabel = ($member['member_type'] === 'staff') ? 'Staff' : 'Atleta';
            
            // Format document string
            $docInfo = $member['identity_document'] ?: '—';

            $html .= '
                <tr>
                    <td><strong>' . mb_strtoupper(htmlspecialchars($member['last_name'] ?? '')) . '</strong></td>
                    <td>' . htmlspecialchars($member['first_name'] ?? '') . '</td>
                    <td>' . htmlspecialchars($docInfo) . '</td>
                    <td><span class="role-badge ' . $roleClass . '">' . $roleLabel . '</span></td>
                </tr>';
        }

        $html .= '
            </tbody>
        </table>

        <div class="signature-box">
            <p style="font-size: 9pt;">Note: Elenco dei partecipanti autorizzati per il soggiorno presso la vostra struttura.</p>
            <table width="100%" style="margin-top: 20px;">
                <tr>
                    <td width="50%">
                        <div class="signature-line"></div>
                        <div class="signature-label">Firma Responsabile Fusion Team Volley</div>
                    </td>
                    <td width="50%" style="text-align: right;">
                        <div style="margin-top: 40px; font-size: 9pt;">Data: ____/____/________</div>
                    </td>
                </tr>
            </table>
        </div>';

        $mpdf->WriteHTML($html);
        
        $filename = 'Rooming_List_' . str_replace(' ', '_', $tournament['title']) . '.pdf';
        $mpdf->Output($filename, 'I'); // Inline view
        exit;
    }
}

/** Helper class for dating */
class Utils {
    public static function formatDate($date) {
        if (!$date) return '';
        return date('d/m/Y', strtotime($date));
    }
}
