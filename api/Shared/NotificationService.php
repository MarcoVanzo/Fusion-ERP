<?php
/**
 * NotificationService — Unified Multi-channel Notification System
 * Fusion ERP v1.0 — Phase 4
 *
 * Sends templated notifications via Email (PHPMailer) and WhatsApp (Meta Cloud API).
 * Logs all sent notifications to the notification_log table.
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PHPMailer\PHPMailer\PHPMailer;

class NotificationService
{
    /** Notification types */
    public const TYPE_CERT_EXPIRY = 'CERTIFICATE_EXPIRY';
    public const TYPE_PAYMENT_OVERDUE = 'PAYMENT_OVERDUE';
    public const TYPE_PAYMENT_DUE = 'PAYMENT_DUE_SOON';
    public const TYPE_DOC_EXPIRY = 'DOCUMENT_EXPIRY';

    /** Channels */
    public const CHANNEL_EMAIL = 'EMAIL';
    public const CHANNEL_WHATSAPP = 'WHATSAPP';

    /**
     * Send a notification via Email and log it.
     */
    public static function send(array $params): bool
    {
        $type = $params['type'] ?? '';
        $recipientEmail = $params['recipient_email'] ?? '';
        $recipientName = $params['recipient_name'] ?? '';
        $data = $params['data'] ?? [];
        $athleteId = $params['athlete_id'] ?? null;
        $tenantId = $params['tenant_id'] ?? 'TNT_default';

        if (empty($recipientEmail) || empty($type)) {
            error_log("[NotificationService] Missing email or type — skipped");
            return false;
        }

        $subject = self::getSubject($type, $data);
        $body = self::renderTemplate($type, $data);

        $success = false;
        $errorMsg = null;

        try {
            $mail = self::createMailer();
            $mail->addAddress($recipientEmail, $recipientName);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $body;
            $mail->AltBody = strip_tags(str_replace(['<br>', '</p>'], "\n", $body));

            $success = $mail->send();
        }
        catch (\Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[NotificationService] Email failed: {$errorMsg}");
        }

        self::logNotification([
            'tenant_id' => $tenantId,
            'channel' => self::CHANNEL_EMAIL,
            'type' => $type,
            'athlete_id' => $athleteId,
            'recipient_email' => $recipientEmail,
            'subject' => $subject,
            'success' => $success,
            'error' => $errorMsg
        ]);

        return $success;
    }

    /**
     * Send a notification via WhatsApp and log it.
     */
    public static function sendWhatsApp(array $params): bool
    {
        $type = $params['type'] ?? '';
        $phone = $params['recipient_phone'] ?? '';
        $data = $params['data'] ?? [];
        $athleteId = $params['athlete_id'] ?? null;
        $tenantId = $params['tenant_id'] ?? 'TNT_default';

        if (empty($phone) || empty($type)) {
            error_log("[NotificationService] Missing phone or type for WhatsApp — skipped");
            return false;
        }

        // Clean phone number (remove +, spaces, etc.)
        $phone = preg_replace('/[^0-9]/', '', $phone);

        $success = false;
        $errorMsg = null;

        try {
            $wa = new WhatsAppClient();

            // Map ERP internal type to Meta Template names
            $templateName = self::getWhatsAppTemplateName($type);
            $components = self::mapWhatsAppComponents($type, $data);

            $result = $wa->sendTemplate($phone, $templateName, 'it', $components);
            $success = $result['success'];
            if (!$success) {
                $errorMsg = $result['error'] ?? 'WhatsApp API Error';
            }
        }
        catch (\Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[NotificationService] WhatsApp failed: {$errorMsg}");
        }

        self::logNotification([
            'tenant_id' => $tenantId,
            'channel' => self::CHANNEL_WHATSAPP,
            'type' => $type,
            'athlete_id' => $athleteId,
            'recipient_phone' => $phone,
            'subject' => "WhatsApp: " . self::getWhatsAppTemplateName($type),
            'success' => $success,
            'error' => $errorMsg
        ]);

        return $success;
    }

    /**
     * Send to multiple recipients (Email).
     */
    public static function sendToMultiple(string $type, string $athleteId, string $tenantId, array $recipients, array $data): int
    {
        $sent = 0;
        foreach ($recipients as $r) {
            $ok = self::send([
                'type' => $type,
                'athlete_id' => $athleteId,
                'tenant_id' => $tenantId,
                'recipient_email' => $r['email'] ?? '',
                'recipient_name' => $r['name'] ?? '',
                'data' => $data,
            ]);
            if ($ok)
                $sent++;
        }
        return $sent;
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    /**
     * Get Meta Template Name for a notification type.
     */
    private static function getWhatsAppTemplateName(string $type): string
    {
        return match ($type) {
                self::TYPE_CERT_EXPIRY => 'certificato_scadenza',
                self::TYPE_PAYMENT_OVERDUE => 'pagamento_scaduto',
                self::TYPE_PAYMENT_DUE => 'avviso_pagamento',
                self::TYPE_DOC_EXPIRY => 'documento_scadenza',
                default => 'notifica_generica',
            };
    }

    /**
     * Map ERP data to WhatsApp Template components.
     * This depends on how templates are defined in Meta Business Manager.
     */
    private static function mapWhatsAppComponents(string $type, array $data): array
    {
        $athleteName = $data['athlete_name'] ?? 'Atleta';

        // Example mapping for a body with 2 variables: {{1}} = name, {{2}} = detail
        $parameters = [
            ['type' => 'text', 'text' => $athleteName]
        ];

        if ($type === self::TYPE_CERT_EXPIRY && isset($data['expiry_date'])) {
            $parameters[] = ['type' => 'text', 'text' => $data['expiry_date']];
        }
        elseif ($type === self::TYPE_PAYMENT_OVERDUE && isset($data['amount'])) {
            $parameters[] = ['type' => 'text', 'text' => $data['amount'] . "€"];
        }

        return [
            [
                'type' => 'body',
                'parameters' => $parameters
            ]
        ];
    }

    private static function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = getenv('SMTP_USER') ?: '';
        $mail->Password = getenv('SMTP_PASS') ?: '';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int)(getenv('SMTP_PORT') ?: 587);
        $mail->CharSet = 'UTF-8';

        $fromEmail = getenv('MAIL_FROM_ADDRESS') ?: 'noreply@fusionerp.it';
        $fromName = getenv('MAIL_FROM_NAME') ?: 'Fusion ERP';
        $mail->setFrom($fromEmail, $fromName);

        $certPath = __DIR__ . '/cacert.pem';
        if (file_exists($certPath)) {
            $mail->SMTPOptions = ['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'cafile' => $certPath]];
        }
        return $mail;
    }

    private static function getSubject(string $type, array $data): string
    {
        $athleteName = $data['athlete_name'] ?? 'Atleta';
        return match ($type) {
                self::TYPE_CERT_EXPIRY => "⚠️ Certificato medico in scadenza — {$athleteName}",
                self::TYPE_PAYMENT_OVERDUE => "🔴 Pagamento scaduto — {$athleteName}",
                self::TYPE_PAYMENT_DUE => "📋 Pagamento in scadenza — {$athleteName}",
                self::TYPE_DOC_EXPIRY => "📄 Documento in scadenza — {$athleteName}",
                default => "Notifica Fusion ERP — {$athleteName}",
            };
    }

    private static function renderTemplate(string $type, array $data): string
    {
        $templateFile = match ($type) {
                self::TYPE_CERT_EXPIRY => 'email_certificate_expiry.php',
                self::TYPE_PAYMENT_OVERDUE => 'email_payment_overdue.php',
                self::TYPE_PAYMENT_DUE => 'email_payment_due.php',
                self::TYPE_DOC_EXPIRY => 'email_document_expiry.php',
                default => null,
            };

        if ($templateFile) {
            $templatePath = dirname(__DIR__) . '/templates/' . $templateFile;
            if (file_exists($templatePath)) {
                extract($data, EXTR_SKIP);
                ob_start();
                include $templatePath;
                return (string)ob_get_clean();
            }
        }

        $athleteName = $data['athlete_name'] ?? 'Atleta';
        return self::wrapInLayout("<p>Ciao,</p><p>Hai una nuova notifica per {$athleteName}.</p>");
    }

    public static function wrapInLayout(string $content): string
    {
        return <<<HTML
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0a0a0a;font-family:sans-serif;color:#e0e0e0;padding:20px;">
<div style="background:#1a1a1a;border-radius:12px;padding:32px;max-width:600px;margin:auto;">
<h1 style="color:#E6007E;">Fusion ERP</h1>
{$content}
<hr style="border:0;border-top:1px solid #333;margin:20px 0;">
<p style="font-size:11px;color:#666;">Notifica automatica Fusion ERP.</p>
</div></body></html>
HTML;
    }

    private static function logNotification(array $p): void
    {
        try {
            $db = Database::getInstance();
            $id = 'NTF_' . bin2hex(random_bytes(4));
            $stmt = $db->prepare(
                'INSERT INTO notification_log (id, tenant_id, notification_type, channel, athlete_id, recipient_email, recipient_phone, subject, status, error_message)
                 VALUES (:id, :tenant_id, :type, :channel, :athlete_id, :email, :phone, :subject, :status, :error)'
            );
            $stmt->execute([
                ':id' => $id,
                ':tenant_id' => $p['tenant_id'],
                ':type' => $p['type'],
                ':channel' => $p['channel'],
                ':athlete_id' => $p['athlete_id'],
                ':email' => $p['recipient_email'] ?? null,
                ':phone' => $p['recipient_phone'] ?? null,
                ':subject' => $p['subject'],
                ':status' => $p['success'] ? 'sent' : 'failed',
                ':error' => $p['error'] ?? null,
            ]);
        }
        catch (\Throwable $e) {
            error_log("[NotificationService] Log DB failed: " . $e->getMessage());
        }
    }
}