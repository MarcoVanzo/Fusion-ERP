<?php
/**
 * Mailer — Wrapper PHPMailer per Fusion ERP
 * Legge la configurazione SMTP dall'ambiente (.env).
 * Fallback a mail() nativo se SMTP non è configurato o fallisce.
 *
 * SMTP_ENCRYPTION: 'ssl' (porta 465, Aruba) | 'tls' (porta 587, default)
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

class Mailer
{
    /**
     * Invia un'email HTML.
     *
     * @param string $toEmail  Indirizzo del destinatario
     * @param string $toName   Nome del destinatario
     * @param string $subject  Oggetto dell'email
     * @param string $htmlBody Corpo HTML
     * @param string $textBody Corpo plain-text (fallback)
     * @return bool  true se inviata, false se entrambi i tentativi falliscono
     */
    public static function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = ''
    ): bool {
        $host       = getenv('SMTP_HOST') ?: '';
        $port       = (int)(getenv('SMTP_PORT') ?: 587);
        $user       = getenv('SMTP_USER') ?: '';
        $pass       = getenv('SMTP_PASS') ?: '';
        $encryption = strtolower(getenv('SMTP_ENCRYPTION') ?: 'tls');
        $fromName   = getenv('SMTP_FROM_NAME') ?: 'Fusion ERP';
        $from       = $user ?: 'noreply@localhost';

        // ── Tentativo SMTP ────────────────────────────────────────────────────
        if (!empty($host) && !empty($user) && !empty($pass)) {
            try {
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host     = $host;
                $mail->SMTPAuth = true;
                $mail->Username = $user;
                $mail->Password = $pass;

                // 'ssl' = porta 465 (Aruba, AOL, …), 'tls' = STARTTLS porta 587
                $mail->SMTPSecure = ($encryption === 'ssl') ? 'ssl' : PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = $port ?: ($encryption === 'ssl' ? 465 : 587);
                $mail->CharSet    = 'UTF-8';

                $mail->setFrom($from, $fromName);
                $mail->addAddress($toEmail, $toName);

                $mail->isHTML(true);
                $mail->Subject = $subject;
                $mail->Body    = $htmlBody;
                $mail->AltBody = $textBody ?: strip_tags($htmlBody);

                $mail->send();
                return true;
            } catch (MailerException $e) {
                error_log('[Mailer] SMTP failed: ' . $e->getMessage() . ' — trying native mail()');
            }
        }

        // ── Fallback: mail() nativo ────────────────────────────────────────────
        $headers  = "From: {$fromName} <{$from}>\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

        $sent = @mail($toEmail, $subject, $htmlBody, $headers);
        if (!$sent) {
            error_log('[Mailer] Fallback mail() also failed for: ' . $toEmail);
        }
        return $sent;
    }
}