<?php
declare(strict_types=1);

namespace FusionERP\Modules\OutSeason\Services;

use FusionERP\Shared\Mailer;

class OutSeasonEmailService
{
    private const EMAIL_SENDER_NAME = 'FTV Out Season';
    private const LOGO_URL = 'https://www.fusionteamvolley.it/ERP/outseason/logo-outseason.png';

    public static function sendConfirmationEmail(array $entry, ?string $captureId, ?string $payerEmail, string $seasonKey, int $priceFull, int $pricePartial): void
    {
        $nome = htmlspecialchars(trim($entry['nome_e_cognome'] ?? ''));
        $email = trim($entry['email'] ?? '');
        $html = self::buildOutSeasonEmail($entry, $captureId, 'PayPal/Carta', $seasonKey, $priceFull, $pricePartial);
        Mailer::send(
            $email, $nome,
            'Conferma Iscrizione OutSeason ' . $seasonKey . ' — Fusion Team Volley',
            $html, '', null, self::EMAIL_SENDER_NAME
        );
    }

    public static function sendBonificoEmail(array $data, float $amount, int $entryId, string $seasonKey, int $priceFull, int $pricePartial): void
    {
        $nome = htmlspecialchars(trim($data['nome_e_cognome'] ?? ''));
        $email = trim($data['email'] ?? '');
        $data['_finalPrice'] = $amount;
        $html = self::buildOutSeasonEmail($data, "BON-{$entryId}", 'Bonifico Bancario', $seasonKey, $priceFull, $pricePartial);
        Mailer::send(
            $email, $nome,
            'Iscrizione OutSeason ' . $seasonKey . ' — Istruzioni Bonifico',
            $html, '', null, self::EMAIL_SENDER_NAME
        );
    }

    private static function buildOutSeasonEmail(array $entry, ?string $txId, string $metodo, string $seasonKey, int $priceFull, int $pricePartial): string
    {
        $isBonifico = ($metodo === 'Bonifico Bancario');
        $logoUrl    = self::LOGO_URL;

        $nome       = htmlspecialchars(trim($entry['nome_e_cognome'] ?? ''));
        $email      = htmlspecialchars(trim($entry['email'] ?? ''));
        $cellulare  = htmlspecialchars(trim($entry['cellulare'] ?? ''));
        $cf         = htmlspecialchars(strtoupper(trim($entry['codice_fiscale'] ?? '')));
        $dob        = htmlspecialchars(trim($entry['data_di_nascita'] ?? ''));
        $indirizzo  = htmlspecialchars(trim($entry['indirizzo'] ?? ''));
        $cap        = htmlspecialchars(trim($entry['cap'] ?? ''));
        $citta      = htmlspecialchars(trim($entry['citta'] ?? ''));
        $provincia  = htmlspecialchars(strtoupper(trim($entry['provincia'] ?? '')));
        $club       = htmlspecialchars(trim($entry['club_di_appartenenza'] ?? '')) ?: '—';
        $ruolo      = htmlspecialchars(trim($entry['ruolo'] ?? ''));
        $taglia     = htmlspecialchars(trim($entry['taglia_kit'] ?? ''));
        $formula    = htmlspecialchars(trim($entry['formula_scelta'] ?? ''));
        $settimana  = htmlspecialchars(trim($entry['settimana_scelta'] ?? ''));
        $sconto     = htmlspecialchars(trim($entry['codice_sconto'] ?? ''));

        if (!empty($dob) && strtotime($dob) !== false) {
            $dob = date('d/m/Y', strtotime($dob));
        }

        $addressLine = $indirizzo;
        if ($cap || $citta || $provincia) {
            $addressLine .= ' — ' . implode(' ', array_filter([$cap, $citta, $provincia ? "({$provincia})" : '']));
        }

        $statusBadge = $isBonifico
            ? '<td style="padding:12px 24px;background:#f39c12;border-radius:6px;text-align:center;"><span style="color:#ffffff;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">⏳ In Attesa Bonifico</span></td>'
            : '<td style="padding:12px 24px;background:#27ae60;border-radius:6px;text-align:center;"><span style="color:#ffffff;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">✓ Pagamento Confermato</span></td>';

        $isFullMaster = str_contains($formula, 'Full');
        $basePrice = $isFullMaster ? $priceFull : $pricePartial;
        $finalPrice = $entry['_finalPrice'] ?? $basePrice;
        $priceFormatted = '€' . number_format((float)$finalPrice, 2, ',', '.');

        $scontoRow = '';
        if (!empty($sconto)) {
            $scontoRow = '<tr><td style="padding:10px 20px;border-bottom:1px solid #f0f0f0;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Codice Sconto</td><td style="padding:10px 20px;border-bottom:1px solid #f0f0f0;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#27ae60;">' . $sconto . '</td></tr>';
        }

        $bonificoBlock = '';
        if ($isBonifico) {
            $bonificoBlock = <<<BONIF
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-collapse:collapse;">
<tr><td style="padding:20px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:8px;border-left:4px solid #f39c12;">
<p style="margin:0 0 12px;font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:700;color:#f39c12;text-transform:uppercase;letter-spacing:0.06em;">📋 Istruzioni Bonifico</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">Importo</td><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">{$priceFormatted}</td></tr>
<tr><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">Intestatario</td><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;">FUSION TEAM VOLLEY A.S.D.</td></tr>
<tr><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">IBAN</td><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.04em;">IT19R0874936320000000039906</td></tr>
<tr><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">Causale</td><td style="padding:6px 0;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#D9317F;">OutSeason {$seasonKey} — {$nome}</td></tr>
</table>
</td></tr>
</table>
BONIF;
        }

        return <<<HTML
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;"><tr><td align="center" style="padding:32px 16px;">
<!-- Main Card -->
<table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4);">
<!-- Header with Logo -->
<tr><td style="background:linear-gradient(135deg,#0d0d0d 0%,#1a1a2e 50%,#0d0d0d 100%);padding:36px 24px 28px;text-align:center;border-bottom:2px solid #D9317F;">
<img src="{$logoUrl}" alt="Fusion Out Season" width="160" style="width:160px;height:auto;margin-bottom:16px;" />
<p style="margin:0;font-family:Poppins,Arial,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.2em;">Master di Alta Specializzazione · {$seasonKey}</p>
</td></tr>
<!-- Greeting -->
<tr><td style="padding:32px 32px 16px;">
<p style="margin:0 0 6px;font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">Ciao {$nome}! 🏐</p>
<p style="margin:0;font-family:Roboto,Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;">La tua iscrizione all'<strong style="color:#D9317F;">OutSeason {$seasonKey}</strong> è stata registrata con successo.</p>
</td></tr>
<!-- Status Badge -->
<tr><td style="padding:8px 32px 20px;">
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>{$statusBadge}</tr></table>
</td></tr>
<!-- Registration Summary -->
<tr><td style="padding:0 32px 8px;">
<p style="margin:0 0 12px;font-family:Poppins,Arial,sans-serif;font-size:11px;font-weight:700;color:#D9317F;text-transform:uppercase;letter-spacing:0.15em;">📋 Riepilogo Iscrizione</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:8px;border:1px solid rgba(217,49,127,0.15);border-collapse:collapse;overflow:hidden;">
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Formula</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:700;color:#D9317F;">{$formula}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Settimana</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;">{$settimana}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Importo</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Poppins,Arial,sans-serif;font-size:15px;font-weight:800;color:#ffffff;">{$priceFormatted}</td></tr>
{$scontoRow}
<tr><td style="padding:10px 20px;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Pagamento</td><td style="padding:10px 20px;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#ffffff;">{$metodo}</td></tr>
</table>
</td></tr>
<!-- Personal Data -->
<tr><td style="padding:20px 32px 8px;">
<p style="margin:0 0 12px;font-family:Poppins,Arial,sans-serif;font-size:11px;font-weight:700;color:#D9317F;text-transform:uppercase;letter-spacing:0.15em;">👤 Dati Personali</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:8px;border:1px solid rgba(255,255,255,0.06);border-collapse:collapse;overflow:hidden;">
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Email</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$email}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Cellulare</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$cellulare}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Codice Fiscale</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;letter-spacing:0.04em;">{$cf}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Data di Nascita</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$dob}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Indirizzo</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$addressLine}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Club</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$club}</td></tr>
<tr><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Ruolo</td><td style="padding:10px 20px;border-bottom:1px solid #1e1e1e;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$ruolo}</td></tr>
<tr><td style="padding:10px 20px;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Taglia KIT</td><td style="padding:10px 20px;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#ffffff;">{$taglia}</td></tr>
</table>
</td></tr>
<!-- Bonifico Info -->
<tr><td style="padding:0 32px;">{$bonificoBlock}</td></tr>
<!-- Transaction ID -->
<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-family:Roboto,Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);">ID Transazione: {$txId}</p>
</td></tr>
<!-- Footer -->
<tr><td style="padding:20px 24px;background:linear-gradient(90deg,#D9317F,#751450);text-align:center;">
<p style="margin:0;font-family:Poppins,Arial,sans-serif;font-size:11px;font-weight:500;color:rgba(255,255,255,0.9);">Fusion Team Volley ASD · Via Vicentino 1, Trivignano (VE)</p>
<p style="margin:4px 0 0;font-family:Roboto,Arial,sans-serif;font-size:11px;"><a href="mailto:outseason@fusionteamvolley.it" style="color:#ffffff;text-decoration:none;">outseason@fusionteamvolley.it</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>
HTML;
    }
}
