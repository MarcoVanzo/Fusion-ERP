<?php

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments\Services;

require_once dirname(__DIR__, 3) . '/Shared/TenantContext.php';

use Mpdf\Mpdf;
use FusionERP\Shared\TenantContext;

class TournamentsPdfService
{
    public function generateRoomingList(array $tournament, array $roster, array $societaProfile, ?string $savePath = null): void
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
                    <th width="20%">Cognome</th>
                    <th width="20%">Nome</th>
                    <th width="15%">Data Nascita</th>
                    <th width="30%">Documento</th>
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
            $birthDate = !empty($member['birth_date']) ? Utils::formatDate($member['birth_date']) : '—';

            $html .= '
                <tr>
                    <td><strong>' . mb_strtoupper(htmlspecialchars($member['last_name'] ?? '')) . '</strong></td>
                    <td>' . htmlspecialchars($member['first_name'] ?? '') . '</td>
                    <td>' . htmlspecialchars($birthDate) . '</td>
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
        
        $filename = 'Rooming_List_' . Utils::slugify($tournament['title'] ?? 'Evento') . '.pdf';
        
        if ($savePath) {
            $mpdf->Output($savePath, 'F');
        } else {
            $mpdf->Output($filename, 'I');
        }
    }

    public function generateSummaryPdf(array $tournament, array $roster, array $expenses, array $matches, array $transports, array $societaProfile, ?string $savePath = null): void
    {
        $tempDir = dirname(__DIR__, 4) . '/uploads/tmp_pdf/';
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $mpdf = new Mpdf([
            'tempDir' => $tempDir,
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 35,
            'margin_bottom' => 20,
            'margin_header' => 10,
            'margin_footer' => 10
        ]);

        $rootPath = dirname(__DIR__, 4);
        $logoPath = $rootPath . '/uploads/images/Logo Colorato.png';
        $logoSrc = file_exists($logoPath) ? $logoPath : $rootPath . '/fusion-website/public/assets/logo-colorato.png';

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
        $mpdf->SetHTMLFooter('<div style="border-top:1px solid #eee; padding-top:5px; text-align:right; font-size:8pt; color:#888;">Pagina {PAGENO} di {nbpg}</div>');

        // Calculations
        $athletes = array_filter($roster, fn($r) => ($r['member_type'] ?? '') === 'athlete');
        $staff = array_filter($roster, fn($r) => ($r['member_type'] ?? '') === 'staff');
        
        $totalAthletes = count($athletes);
        $totalStaff = count($staff);
        
        $confirmedAthletes = count(array_filter($athletes, fn($r) => ($r['attendance_status'] ?? '') === 'confirmed'));
        $confirmedStaff = count(array_filter($staff, fn($r) => ($r['attendance_status'] ?? '') === 'confirmed'));

        $fee = (float)($tournament['fee_per_athlete'] ?? 0);
        $totalRevenue = $confirmedAthletes * $fee;
        
        $totalExpenses = 0;
        foreach ($expenses as $exp) {
            $totalExpenses += (float)$exp['amount'];
        }
        
        $netProfit = $totalRevenue - $totalExpenses;
        $margin = $totalRevenue > 0 ? ($netProfit / $totalRevenue) * 100 : 0;

        $html = '
        <style>
            body { font-family: "Helvetica", "Arial", sans-serif; color: #333; }
            h1 { color: #E91E63; font-size: 20pt; margin-bottom: 5px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
            h2 { color: #555; font-size: 14pt; margin-top: 0; text-align: center; margin-bottom: 30px; font-weight: normal; }
            h3 { color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; font-size: 14pt; }
            .box { padding: 15px; border: 1px solid #ddd; background: #fdfdfd; width: 30%; float: left; margin-right: 2%; text-align: center; border-radius: 8px; }
            .box-title { font-size: 9pt; text-transform: uppercase; color: #888; margin-bottom: 10px; }
            .box-value { font-size: 18pt; font-weight: bold; color: #333; }
            .box-green .box-value { color: #10b981; }
            .box-red .box-value { color: #ef4444; }
            .box-orange .box-value { color: #f59e0b; }
            table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            table.data-table th { background: #f9f9f9; padding: 12px; text-align: left; font-size: 10pt; color: #666; border-bottom: 2px solid #ddd; text-transform: uppercase; }
            table.data-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 11pt; }
            .amount { text-align: right; font-weight: bold; }
            .info-block { font-size: 11pt; line-height: 1.5; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px; }
            .match-win { color: #10b981; font-weight: bold; }
            .match-loss { color: #ef4444; font-weight: bold; }
            .clear { clear: both; }
        </style>
        
        <h1>DOSSIER TORNEO</h1>
        <h2>' . htmlspecialchars($tournament['title'] ?? 'N/A') . ' &mdash; Dal ' . Utils::formatDate($tournament['event_date']) . ' al ' . Utils::formatDate($tournament['event_end']) . '</h2>
        
        <div class="info-block">
            <strong>Location:</strong> ' . htmlspecialchars($tournament['location_name'] ?? 'Non specificata') . '<br>';
        
        if (!empty($tournament['accommodation_info'])) {
            $html .= '<strong>Info Alloggio:</strong><br>' . nl2br(htmlspecialchars($tournament['accommodation_info'])) . '<br>';
        }
        
        $html .= '
            <strong>Partecipanti Convocati:</strong> ' . $confirmedAthletes . ' atlete (su ' . $totalAthletes . ' a roster) e ' . $confirmedStaff . ' staff (su ' . $totalStaff . ').
        </div>

        <h3>1. Resoconto Economico</h3>
        <div style="width: 100%; margin-bottom: 20px; overflow: hidden;">
            <div class="box box-green">
                <div class="box-title">Totale Entrate</div>
                <div class="box-value">' . number_format($totalRevenue, 2, ',', '.') . ' &euro;</div>
                <div style="font-size: 8pt; color: #888; margin-top: 5px;">' . $confirmedAthletes . ' atlete x ' . number_format($fee, 2, ',', '.') . '&euro;</div>
            </div>
            <div class="box box-red">
                <div class="box-title">Totale Spese</div>
                <div class="box-value">' . number_format($totalExpenses, 2, ',', '.') . ' &euro;</div>
                <div style="font-size: 8pt; color: #888; margin-top: 5px;">' . count($expenses) . ' voci di spesa</div>
            </div>
            <div class="box box-orange" style="margin-right: 0;">
                <div class="box-title">Utile Netto</div>
                <div class="box-value">' . number_format($netProfit, 2, ',', '.') . ' &euro;</div>
                <div style="font-size: 8pt; color: #888; margin-top: 5px;">Margine: ' . number_format($margin, 1, ',', '.') . '%</div>
            </div>
        </div>
        <div class="clear"></div>

        <h3>2. Piano Trasferte e Logistica</h3>';
        
        if (empty($transports)) {
            $html .= '<p style="color:#666; font-style:italic;">Nessun trasporto registrato per il torneo.</p>';
        } else {
            foreach ($transports as $tr) {
                $html .= '<div class="info-block">
                    <strong>Viaggio del ' . Utils::formatDate($tr['transport_date']) . '</strong><br>
                    <strong>Da:</strong> ' . htmlspecialchars($tr['departure_address'] ?? 'Non specificato') . ' &mdash; <em>Partenza:</em> ' . ($tr['departure_time'] ? substr($tr['departure_time'], 0, 5) : 'N/D') . '<br>
                    <strong>A:</strong> ' . htmlspecialchars($tr['destination_name'] ?? '') . ' (' . htmlspecialchars($tr['destination_address'] ?? '') . ') &mdash; <em>Arrivo:</em> ' . substr($tr['arrival_time'], 0, 5) . '
                </div>';
            }
        }

        $html .= '<h3>3. Partite e Scoreboard</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Data & Ora</th>
                    <th>Match</th>
                    <th>Campo</th>
                    <th style="text-align: right;">Risultato</th>
                </tr>
            </thead>
            <tbody>';
            
        if (empty($matches)) {
            $html .= '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Nessuna partita registrata.</td></tr>';
        } else {
            $teamName = $tournament['team_name'] ?? 'Fusion';
            foreach ($matches as $match) {
                $our = (int)$match['our_score'];
                $opp = (int)$match['opponent_score'];
                $scoreHtml = $our > $opp 
                    ? '<span class="match-win">' . $our . ' - ' . $opp . '</span>' 
                    : ($our < $opp ? '<span class="match-loss">' . $our . ' - ' . $opp . '</span>' : $our . ' - ' . $opp);
                    
                $html .= '
                <tr>
                    <td>' . date('d/m/Y H:i', strtotime($match['match_time'])) . '</td>
                    <td><strong>' . htmlspecialchars($teamName) . '</strong> VS ' . htmlspecialchars($match['opponent_name']) . '</td>
                    <td>' . htmlspecialchars($match['court_name'] ?? '-') . '</td>
                    <td style="text-align: right; font-size:14pt;">' . $scoreHtml . '</td>
                </tr>';
            }
        }
            
        $html .= '</tbody></table>';

        $html .= '<h3>4. Dettaglio Spese (Fatturazione)</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Descrizione</th>
                    <th style="text-align: right; width: 30%;">Importo</th>
                </tr>
            </thead>
            <tbody>';
            
        if (empty($expenses)) {
            $html .= '<tr><td colspan="2" style="text-align:center; color:#999; padding:20px;">Nessuna spesa registrata.</td></tr>';
        } else {
            foreach ($expenses as $exp) {
                $html .= '
                <tr>
                    <td>' . htmlspecialchars($exp['description']) . '</td>
                    <td class="amount">' . number_format((float)$exp['amount'], 2, ',', '.') . ' &euro;</td>
                </tr>';
            }
        }
            
        $html .= '
            </tbody>
        </table>';

        // 5. Rooming List (Forced on a new page)
        $html .= '<pagebreak />';
        $html .= '<h3>5. Elenco Partecipanti (Rooming List)</h3>
        <table class="data-table" style="margin-top: 15px;">
            <thead>
                <tr>
                    <th width="20%">Cognome</th>
                    <th width="20%">Nome</th>
                    <th width="15%">Data Nascita</th>
                    <th width="30%">Documento</th>
                    <th width="15%">Ruolo</th>
                </tr>
            </thead>
            <tbody>';

        $hasConfirmedAttendees = false;
        foreach ($roster as $member) {
            if (($member['attendance_status'] ?? '') !== 'confirmed') continue;
            
            $hasConfirmedAttendees = true;
            $roleClass = (($member['member_type'] ?? '') === 'staff') ? 'match-loss' : ''; // Re-using red class for staff
            $roleLabel = (($member['member_type'] ?? '') === 'staff') ? 'Staff' : 'Atleta';
            
            $docInfo = $member['identity_document'] ?: '—';
            $birthDate = !empty($member['birth_date']) ? Utils::formatDate($member['birth_date']) : '—';

            $html .= '
                <tr>
                    <td><strong>' . mb_strtoupper(htmlspecialchars($member['last_name'] ?? '')) . '</strong></td>
                    <td>' . htmlspecialchars($member['first_name'] ?? '') . '</td>
                    <td>' . htmlspecialchars($birthDate) . '</td>
                    <td>' . htmlspecialchars($docInfo) . '</td>
                    <td><span class="' . $roleClass . '">' . $roleLabel . '</span></td>
                </tr>';
        }

        if (!$hasConfirmedAttendees) {
            $html .= '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nessun partecipante confermato.</td></tr>';
        }

        $html .= '
            </tbody>
        </table>

        <div style="margin-top: 40px;">
            <table width="100%">
                <tr>
                    <td width="50%">
                        <div style="border-bottom: 1px solid #333; width: 250px;"></div>
                        <div style="font-size: 9pt; color: #666; margin-top: 5px;">Firma Responsabile Fusion Team Volley</div>
                    </td>
                    <td width="50%" style="text-align: right;">
                        <div style="font-size: 9pt;">Data: ____/____/________</div>
                    </td>
                </tr>
            </table>
        </div>';

        $mpdf->WriteHTML($html);
        
        $filename = 'Riepilogo_Torneo_' . Utils::slugify($tournament['title'] ?? 'Evento') . '.pdf';
        
        if ($savePath) {
            $mpdf->Output($savePath, 'F');
        } else {
            $mpdf->Output($filename, 'I');
        }
    }
}

/** Helper class for dating */
class Utils {
    public static function formatDate($date) {
        if (!$date) return '';
        return date('d/m/Y', strtotime($date));
    }

    public static function slugify($text) {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        if (empty($text)) {
            return 'n-a';
        }
        return $text;
    }
}
