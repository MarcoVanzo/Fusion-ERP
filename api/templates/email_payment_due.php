<?php
/**
 * Email Template — Payment Due Soon
 * Variables: $athlete_name, $amount, $due_date, $days_until_due
 */

use FusionERP\Shared\NotificationService;

$formattedAmount = number_format((float)($amount ?? 0), 2, ',', '.');
$daysUntilDueStr = (string)($days_until_due ?? '');
$athleteNameStr = (string)($athlete_name ?? '');
$dueDateStr = (string)($due_date ?? '');

return NotificationService::wrapInLayout(<<<HTML
<div style="background:#ffcc00;color:#000;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-weight:600;text-align:center;">
    📋 Rata in scadenza tra {$daysUntilDueStr} giorni
</div>
<p>Una rata di pagamento per l'atleta <strong>{$athleteNameStr}</strong> è in scadenza:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Atleta</td><td style="padding:8px;border-bottom:1px solid #333;">{$athleteNameStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Importo</td><td style="padding:8px;border-bottom:1px solid #333;font-weight:700;">€ {$formattedAmount}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Scadenza</td><td style="padding:8px;border-bottom:1px solid #333;">{$dueDateStr}</td></tr>
</table>
<p>Effettuare il pagamento entro la data indicata.</p>
HTML);