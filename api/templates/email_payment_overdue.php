<?php
/**
 * Email Template — Payment Overdue
 * Variables: $athlete_name, $amount, $due_date, $days_overdue
 */

use FusionERP\Shared\NotificationService;

$formattedAmount = number_format((float)($amount ?? 0), 2, ',', '.');
$daysOverdueStr = (string)($days_overdue ?? '');
$athleteNameStr = (string)($athlete_name ?? '');
$dueDateStr = (string)($due_date ?? '');

return NotificationService::wrapInLayout(<<<HTML
<div style="background:#ff4444;color:#fff;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-weight:600;text-align:center;">
    🔴 PAGAMENTO SCADUTO — {$daysOverdueStr} giorni di ritardo
</div>
<p>Una rata di pagamento per l'atleta <strong>{$athleteNameStr}</strong> risulta scaduta:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Atleta</td><td style="padding:8px;border-bottom:1px solid #333;">{$athleteNameStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Importo</td><td style="padding:8px;border-bottom:1px solid #333;font-weight:700;color:#ff4444;">€ {$formattedAmount}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Scadenza</td><td style="padding:8px;border-bottom:1px solid #333;">{$dueDateStr}</td></tr>
</table>
<p>Contattare l'atleta o il genitore per sollecitare il pagamento.</p>
HTML);