<?php
/**
 * Webhooks Controller — Stripe
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Webhooks;

use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Modules\Payments\PaymentsRepository;
use FusionERP\Modules\Payments\PaymentsController;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class StripeWebhookController
{
    private PaymentsRepository $repo;

    public function __construct()
    {
        $this->repo = new PaymentsRepository();
    }

    /**
     * POST /api/webhooks/stripe
     * Handles Stripe checkout.session.completed
     */
    public function stripe(): void
    {
        $payload = @file_get_contents('php://input');
        $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $endpoint_secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';

        if (empty($endpoint_secret)) {
            // Local fallback / logging for dev without strict webhook secrets
            $event = json_decode($payload, true);
        } else {
            // Production strict validation
            try {
                $event = \Stripe\Webhook::constructEvent(
                    $payload, $sig_header, $endpoint_secret
                );
                // Convert back to array for easier handling if it was validated successfully via Stripe SDK
                $event = json_decode($payload, true); 
            } catch(\UnexpectedValueException $e) {
                http_response_code(400);
                echo 'Invalid payload';
                exit();
            } catch(\Stripe\Exception\SignatureVerificationException $e) {
                http_response_code(400);
                echo 'Invalid signature';
                exit();
            }
        }

        // Handle the event
        if ($event['type'] == 'checkout.session.completed') {
            $session = $event['data']['object'];

            $installmentId = $session['metadata']['installment_id'] ?? null;
            $athleteId = $session['metadata']['athlete_id'] ?? null;
            $tenantId = $session['metadata']['tenant_id'] ?? null;

            if ($installmentId) {
                // Fulfill the purchase...
                error_log("[STRIPE] Payment for installment {$installmentId} succeeded.");
                $this->fulfillOrder($installmentId, $athleteId, $session['payment_intent']);
            }
        }

        http_response_code(200);
        exit;
    }

    private function fulfillOrder(string $installmentId, string $athleteId, string $paymentIntent): void
    {
        $installment = $this->repo->getInstallmentById($installmentId);
        if (!$installment || $installment['status'] === 'PAID') {
            return; // Already paid or not found
        }

        $db = Database::getInstance();
        $db->beginTransaction();
        $receiptPath = '';
        try {
            $paidDate = date('Y-m-d');
            $method = 'STRIPE';

            // 1. Mark as Paid
            $this->repo->payInstallment($installmentId, $paidDate, $method, null);

            // 2. Fetch progressive
            $receiptYear = (int)date('Y', strtotime($paidDate));
            $receiptNumber = $this->repo->getNextReceiptNumber($installment['tenant_id'], $receiptYear);

            // 3. Log transaction
            $txId = 'TX_' . bin2hex(random_bytes(4));
            $this->repo->insertTransaction([
                ':id' => $txId,
                ':tenant_id' => $installment['tenant_id'],
                ':athlete_id' => $athleteId,
                ':installment_id' => $installmentId,
                ':amount' => $installment['amount'],
                ':transaction_date' => $paidDate,
                ':payment_method' => $method,
                ':reference' => $paymentIntent,
                ':created_by' => 'STRIPE_WEBHOOK',
                ':receipt_year' => $receiptYear,
                ':receipt_number' => $receiptNumber
            ]);

            // 4. Generate receipt
            $pc = new PaymentsController();
            $receiptPath = $pc->createAndSaveReceipt($installmentId);

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            error_log("[STRIPE] fulfillOrder failed: " . $e->getMessage());
            return;
        }

        // 5. Send Email (outside transaction — non-critical)
        $this->sendEmailWithReceipt($athleteId, $installment, $receiptPath);
    }

    private function sendEmailWithReceipt(string $athleteId, array $installment, string $receiptPath): void
    {
        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT full_name, email FROM athletes WHERE id = :id AND tenant_id = :tid LIMIT 1');
        $stmt->execute([':id' => $athleteId, ':tid' => $installment['tenant_id']]);
        $athlete = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$athlete || empty($athlete['email'])) {
            return;
        }

        $email = $athlete['email'];
        $name = $athlete['full_name'];

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $_ENV['SMTP_HOST'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['SMTP_USER'];
            $mail->Password   = $_ENV['SMTP_PASS'];
            $mail->SMTPSecure = $_ENV['SMTP_ENCRYPTION'];
            $mail->Port       = $_ENV['SMTP_PORT'];
            
            $mail->setFrom($_ENV['SMTP_USER'], $_ENV['SMTP_FROM_NAME']);
            $mail->addAddress($email, $name);
            
            $mail->isHTML(true);
            $mail->Subject = "Conferma Pagamento e Ricevuta Fiscale";
            $mail->Body    = "Ciao {$name},<br><br>Abbiamo ricevuto correttamente il pagamento per <b>{$installment['title']}</b>.<br>In allegato trovi la ricevuta fiscale valida per ASD.<br><br>Grazie,<br>La Direzione.";
            
            $fullPath = dirname(__DIR__, 3) . '/' . $receiptPath;
            if (file_exists($fullPath)) {
                $mail->addAttachment($fullPath);
            }
            
            $mail->send();
        } catch (PHPMailerException $e) {
            error_log("[WEBHOOK] PHP Mailer failed: " . $mail->ErrorInfo);
        }
    }
}
