<?php
/**
 * Email Template — Document Expiry
 * Variables: $athlete_name, $doc_type, $file_name, $expiry_date, $days_until_expiry
 */

use FusionERP\Shared\NotificationService;

$docTypeLabel = match ($doc_type ?? '') {
        'ID_CARD' => 'Carta d\'Identità',
        'PASSPORT' => 'Passaporto',
        'FEDERATION_CARD' => 'Tessera Federale',
        'MEDICAL_CERTIFICATE' => 'Certificato Medico',
        'SPORTS_LICENSE' => 'Licenza Sportiva',
        'CONTRACT' => 'Contratto',
        default => $doc_type ?? 'Documento',
    };

$alertColor = ($days_until_expiry ?? 30) <= 7 ? '#ff4444' : '#ffcc00';

$daysUntilExpiryStr = (string)($days_until_expiry ?? '');
$athleteNameStr = (string)($athlete_name ?? '');
$fileNameStr = (string)($file_name ?? '');
$expiryDateStr = (string)($expiry_date ?? '');
$docTypeLabelStr = (string)$docTypeLabel;

return NotificationService::wrapInLayout(<<<HTML
<div style="background:{$alertColor};color:#000;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-weight:600;text-align:center;">
    📄 Documento in scadenza tra {$daysUntilExpiryStr} giorni
</div>
<p>Un documento dell'atleta <strong>{$athleteNameStr}</strong> è in scadenza:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Atleta</td><td style="padding:8px;border-bottom:1px solid #333;">{$athleteNameStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Tipo Documento</td><td style="padding:8px;border-bottom:1px solid #333;">{$docTypeLabelStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">File</td><td style="padding:8px;border-bottom:1px solid #333;">{$fileNameStr}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #333;color:#999;">Scadenza</td><td style="padding:8px;border-bottom:1px solid #333;">{$expiryDateStr}</td></tr>
</table>
<p>Accedere a Fusion ERP per aggiornare il documento.</p>
HTML);