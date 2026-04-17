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
        string $textBody = '',
        ?string $fromOverride = null,
        ?string $fromNameOverride = null
    ): bool {
        $host       = $_ENV['SMTP_HOST'] ?? $_SERVER['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: '';
        $port       = (int)($_ENV['SMTP_PORT'] ?? $_SERVER['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 587);
        $user       = $_ENV['SMTP_USER'] ?? $_SERVER['SMTP_USER'] ?? getenv('SMTP_USER') ?: '';
        $pass       = $_ENV['SMTP_PASS'] ?? $_SERVER['SMTP_PASS'] ?? getenv('SMTP_PASS') ?: '';
        $encryption = strtolower($_ENV['SMTP_ENCRYPTION'] ?? $_SERVER['SMTP_ENCRYPTION'] ?? getenv('SMTP_ENCRYPTION') ?: 'tls');
        $fromName   = $fromNameOverride ?: ($_ENV['SMTP_FROM_NAME'] ?? $_SERVER['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?: 'Fusion ERP');
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
                if ($fromOverride) {
                    $mail->addReplyTo($fromOverride, $fromName);
                }
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

    /**
     * Invia un'email HTML con allegati opzionali.
     *
     * @param string   $toEmail     Indirizzo del destinatario
     * @param string   $toName      Nome del destinatario
     * @param string   $subject     Oggetto dell'email
     * @param string   $htmlBody    Corpo HTML
     * @param string   $textBody    Corpo plain-text (fallback)
     * @param array    $attachments Array di path assoluti ai file da allegare
     * @param string[] $cc          Array di indirizzi CC
     * @return bool
     */
    public static function sendWithAttachments(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = '',
        array  $attachments = [],
        array  $cc = [],
        ?string $fromOverride = null,
        ?string $fromNameOverride = null
    ): bool {
        $host       = $_ENV['SMTP_HOST'] ?? $_SERVER['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: '';
        $port       = (int)($_ENV['SMTP_PORT'] ?? $_SERVER['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 587);
        $user       = $_ENV['SMTP_USER'] ?? $_SERVER['SMTP_USER'] ?? getenv('SMTP_USER') ?: '';
        $pass       = $_ENV['SMTP_PASS'] ?? $_SERVER['SMTP_PASS'] ?? getenv('SMTP_PASS') ?: '';
        $encryption = strtolower($_ENV['SMTP_ENCRYPTION'] ?? $_SERVER['SMTP_ENCRYPTION'] ?? getenv('SMTP_ENCRYPTION') ?: 'tls');
        $fromName   = $fromNameOverride ?: ($_ENV['SMTP_FROM_NAME'] ?? $_SERVER['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?: 'Fusion ERP');
        $from       = $user ?: 'noreply@localhost';

        if (empty($host) || empty($user) || empty($pass)) {
            error_log('[Mailer] SMTP not configured – cannot send with attachments');
            return false;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host     = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->SMTPSecure = ($encryption === 'ssl') ? 'ssl' : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $port ?: ($encryption === 'ssl' ? 465 : 587);
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom($from, $fromName);
            if ($fromOverride) {
                $mail->addReplyTo($fromOverride, $fromName);
            }
            $mail->addAddress($toEmail, $toName);

            foreach ($cc as $ccAddr) {
                $mail->addCC($ccAddr);
            }

            foreach ($attachments as $filePath) {
                if (is_file($filePath)) {
                    $mail->addAttachment($filePath);
                } else {
                    error_log("[Mailer] Attachment not found: {$filePath}");
                }
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody ?: strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (MailerException $e) {
            error_log('[Mailer] sendWithAttachments failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Invia un'email HTML con immagini inline (CID) e allegati opzionali.
     * Le immagini inline vengono incorporate dentro la mail stessa,
     * garantendo rendering stabile indipendentemente dal client.
     *
     * @param string   $toEmail        Indirizzo del destinatario
     * @param string   $toName         Nome del destinatario
     * @param string   $subject        Oggetto dell'email
     * @param string   $htmlBody       Corpo HTML (usa cid:NOME per le immagini inline)
     * @param string   $textBody       Corpo plain-text (fallback)
     * @param array    $attachments    Array di path assoluti ai file da allegare
     * @param array    $embeddedImages Array associativo ['cid_name' => '/path/to/image.png']
     * @param string[] $cc             Array di indirizzi CC
     * @param string|null $fromOverride
     * @param string|null $fromNameOverride
     * @return bool
     */
    public static function sendWithEmbeddedImages(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = '',
        array  $attachments = [],
        array  $embeddedImages = [],
        array  $cc = [],
        ?string $fromOverride = null,
        ?string $fromNameOverride = null
    ): bool {
        $host       = $_ENV['SMTP_HOST'] ?? $_SERVER['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: '';
        $port       = (int)($_ENV['SMTP_PORT'] ?? $_SERVER['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 587);
        $user       = $_ENV['SMTP_USER'] ?? $_SERVER['SMTP_USER'] ?? getenv('SMTP_USER') ?: '';
        $pass       = $_ENV['SMTP_PASS'] ?? $_SERVER['SMTP_PASS'] ?? getenv('SMTP_PASS') ?: '';
        $encryption = strtolower($_ENV['SMTP_ENCRYPTION'] ?? $_SERVER['SMTP_ENCRYPTION'] ?? getenv('SMTP_ENCRYPTION') ?: 'tls');
        $fromName   = $fromNameOverride ?: ($_ENV['SMTP_FROM_NAME'] ?? $_SERVER['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?: 'Fusion ERP');
        $from       = $user ?: 'noreply@localhost';

        if (empty($host) || empty($user) || empty($pass)) {
            error_log('[Mailer] SMTP not configured – cannot send with embedded images');
            return false;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host     = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->SMTPSecure = ($encryption === 'ssl') ? 'ssl' : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $port ?: ($encryption === 'ssl' ? 465 : 587);
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom($from, $fromName);
            if ($fromOverride) {
                $mail->addReplyTo($fromOverride, $fromName);
            }
            $mail->addAddress($toEmail, $toName);

            foreach ($cc as $ccAddr) {
                $mail->addCC($ccAddr);
            }

            // Immagini inline (CID) — incorporate direttamente nella mail
            foreach ($embeddedImages as $cid => $imagePath) {
                if (is_file($imagePath)) {
                    $mail->addEmbeddedImage($imagePath, $cid, basename($imagePath));
                } else {
                    error_log("[Mailer] Embedded image not found: {$imagePath}");
                }
            }

            // Allegati normali
            foreach ($attachments as $filePath) {
                if (is_file($filePath)) {
                    $mail->addAttachment($filePath);
                } else {
                    error_log("[Mailer] Attachment not found: {$filePath}");
                }
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody ?: strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (MailerException $e) {
            error_log('[Mailer] sendWithEmbeddedImages failed: ' . $e->getMessage());
            return false;
        }
    }
}