<?php
/**
 * Email Template — Certificate Expiry
 * Variables: $athlete_name, $cert_type, $expires_at, $days_until_expiry, $alert_level
 */

use FusionERP\Shared\NotificationService;

$alertColor = match ($alert_level ?? 'INFO') {
        'URGENT_7', 'EXPIRED' => '#ff4444',
        'WARNING_15' => '#ff8800',
        'WARNING_30' => '#ffcc00',
        default => '#4CAF50',
    };

$alertLabel = match ($alert_level ?? 'INFO') {
        'EXPIRED' => '❌ SCADUTO',
        'URGENT_7' => '🔴 URGENTE — scade tra ' . ($days_until_expiry ?? 0) . ' giorni',
        'WARNING_15' => '🟡 ATTENZIONE — scade tra ' . ($days_until_expiry ?? 0) . ' giorni',
        'WARNING_30' => '🟢 AVVISO — scade tra ' . ($days_until_expiry ?? 0) . ' giorni',
        default => 'INFO',
    };

$athleteNameStr = (string)($athlete_name ?? '');
$certTypeStr = (string)($cert_type ?? '');
$expiresAtStr = (string)($expires_at ?? '');

return NotificationService::wrapInLayout(<<<HTML
<div style="background:{$alertColor};color:#fff;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-weight:600;text-align:center;">
    {$alertLabel}
</div>
<p>Il certificato medico dell'atleta <strong>{$athleteNameStr}</strong> richiede attenzione:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Atleta</td><td style="padding:8px;border-bottom:1px solid #333;">{$athleteNameStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Tipo Certificato</td><td style="padding:8px;border-bottom:1px solid #333;">{$certTypeStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Data Scadenza</td><td style="padding:8px;border-bottom:1px solid #333;">{$expiresAtStr}</td></tr>
</table>
<p>Accedere a Fusion ERP per aggiornare il certificato medico.</p>
HTML);