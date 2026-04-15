<?php
/**
 * Cron Alert Job — Daily Notifications (Multi-channel)
 * Fusion ERP v1.0 — Phase 4
 *
 * Runs once daily to send Email and WhatsApp notifications.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\NotificationService;
use FusionERP\Modules\Health\HealthRepository;
use FusionERP\Modules\Documents\DocumentsRepository;
use FusionERP\Modules\Payments\PaymentsRepository;

// Load environment variables
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__, 2));
$dotenv->load();

$timestamp = date('Y-m-d H:i:s');
echo "[{$timestamp}] ═══ Fusion ERP — Cron Alert Job ═══\n";

$emailsSent = 0;
$waSent = 0;

// Fetch all active tenants — each alert section runs per-tenant (Audit P1-06/07/08)
$db = Database::getInstance();
$tenantStmt = $db->prepare('SELECT id FROM tenants WHERE is_active = 1');
$tenantStmt->execute();
$allTenantsArr = $tenantStmt->fetchAll(\PDO::FETCH_COLUMN);
$allTenants = array_map('strval', $allTenantsArr);

// ─── 1. MEDICAL CERTIFICATE EXPIRY ──────────────────────────────────────────

echo "\n[CERT] Checking medical certificate expiry...\n";
$healthRepo = new HealthRepository();
foreach ($allTenants as $tenantId) {
$expiringCerts = $healthRepo->getExpiringCertificates(30, $tenantId);

foreach ($expiringCerts as $cert) {
    $daysUntil = (int)$cert['days_until_expiry'];
    if (!in_array($daysUntil, [0, 1, 7, 15, 30], true) && $daysUntil > 0)
        continue;

    $data = [
        'athlete_name' => $cert['full_name'],
        'cert_type' => $cert['medical_cert_type'] ?? 'Non specificato',
        'expires_at' => $cert['medical_cert_expires_at'],
        'days_until_expiry' => $daysUntil,
    ];

    // Send Email
    if (!empty($cert['email'])) {
        $ok = NotificationService::send([
            'type' => NotificationService::TYPE_CERT_EXPIRY,
            'athlete_id' => $cert['athlete_id'],
            'tenant_id' => $cert['tenant_id'] ?? 'TNT_default',
            'recipient_email' => $cert['email'],
            'recipient_name' => $cert['full_name'],
            'data' => $data
        ]);
        if ($ok)
            $emailsSent++;
    }

    // Send WhatsApp
    $phone = $cert['parent_phone'] ?: $cert['phone'];
    if (!empty($phone)) {
        $ok = NotificationService::sendWhatsApp([
            'type' => NotificationService::TYPE_CERT_EXPIRY,
            'athlete_id' => $cert['athlete_id'],
            'tenant_id' => $cert['tenant_id'] ?? 'TNT_default',
            'recipient_phone' => $phone,
            'data' => $data
        ]);
        if ($ok)
            $waSent++;
    }
}
} // end tenant loop

// ─── 2. DOCUMENT EXPIRY ─────────────────────────────────────────────────────

echo "\n[DOCS] Checking document expiry...\n";
$docsRepo = new DocumentsRepository();
foreach ($allTenants as $tenantId) {
$expiringDocs = $docsRepo->getExpiringDocuments(30, $tenantId);

foreach ($expiringDocs as $doc) {
    $daysUntil = (int)$doc['days_until_expiry'];
    if (!in_array($daysUntil, [0, 1, 7, 15, 30], true) && $daysUntil > 0)
        continue;

    $data = [
        'athlete_name' => $doc['full_name'],
        'doc_type' => $doc['doc_type'],
        'expiry_date' => $doc['expiry_date'],
        'days_until_expiry' => $daysUntil,
    ];

    if (!empty($doc['email'])) {
        $ok = NotificationService::send([
            'type' => NotificationService::TYPE_DOC_EXPIRY,
            'athlete_id' => $doc['athlete_id'],
            'tenant_id' => $doc['tenant_id'] ?? 'TNT_default',
            'recipient_email' => $doc['email'],
            'recipient_name' => $doc['full_name'],
            'data' => $data
        ]);
        if ($ok)
            $emailsSent++;
    }

    $phone = $doc['parent_phone'] ?: $doc['phone'];
    if (!empty($phone)) {
        $ok = NotificationService::sendWhatsApp([
            'type' => NotificationService::TYPE_DOC_EXPIRY,
            'athlete_id' => $doc['athlete_id'],
            'tenant_id' => $doc['tenant_id'] ?? 'TNT_default',
            'recipient_phone' => $phone,
            'data' => $data
        ]);
        if ($ok)
            $waSent++;
    }
}
} // end tenant loop

// ─── 3. OVERDUE INSTALLMENTS ─────────────────────────────────────────────────

echo "\n[PAY] Checking overdue installments...\n";
$payRepo = new PaymentsRepository();
$payRepo->markOverdueInstallments(); // Global cron — marks all PENDING past due
foreach ($allTenants as $tenantId) {
$overdueList = $payRepo->getOverdueInstallments($tenantId);

foreach ($overdueList as $od) {
    if (!in_array((int)$od['days_overdue'], [1, 7], true))
        continue;

    $data = [
        'athlete_name' => $od['full_name'],
        'amount' => $od['amount'],
        'due_date' => $od['due_date'],
    ];

    if (!empty($od['email'])) {
        $ok = NotificationService::send([
            'type' => NotificationService::TYPE_PAYMENT_OVERDUE,
            'athlete_id' => $od['athlete_id'],
            'tenant_id' => $od['tenant_id'] ?? 'TNT_default',
            'recipient_email' => $od['email'],
            'recipient_name' => $od['full_name'],
            'data' => $data
        ]);
        if ($ok)
            $emailsSent++;
    }

    $phone = $od['parent_phone'] ?: $od['phone'];
    if (!empty($phone)) {
        $ok = NotificationService::sendWhatsApp([
            'type' => NotificationService::TYPE_PAYMENT_OVERDUE,
            'athlete_id' => $od['athlete_id'],
            'tenant_id' => $od['tenant_id'] ?? 'TNT_default',
            'recipient_phone' => $phone,
            'data' => $data
        ]);
        if ($ok)
            $waSent++;
    }
}
} // end tenant loop

// ─── 4. UPCOMING PAYMENT REMINDERS ──────────────────────────────────────────

echo "\n[PAY] Sending upcoming payment reminders...\n";
foreach ($allTenants as $tenantId) {
$upcoming = $payRepo->getUpcomingInstallments(7, $tenantId);

foreach ($upcoming as $up) {
    if ((int)$up['days_until_due'] !== 7)
        continue;

    $data = [
        'athlete_name' => $up['full_name'],
        'amount' => $up['amount'],
        'due_date' => $up['due_date'],
    ];

    if (!empty($up['email'])) {
        $ok = NotificationService::send([
            'type' => NotificationService::TYPE_PAYMENT_DUE,
            'athlete_id' => $up['athlete_id'],
            'tenant_id' => $up['tenant_id'] ?? 'TNT_default',
            'recipient_email' => $up['email'],
            'recipient_name' => $up['full_name'],
            'data' => $data
        ]);
        if ($ok)
            $emailsSent++;
    }

    $phone = $up['parent_phone'] ?: $up['phone'];
    if (!empty($phone)) {
        $ok = NotificationService::sendWhatsApp([
            'type' => NotificationService::TYPE_PAYMENT_DUE,
            'athlete_id' => $up['athlete_id'],
            'tenant_id' => $up['tenant_id'] ?? 'TNT_default',
            'recipient_phone' => $phone,
            'data' => $data
        ]);
        if ($ok)
            $waSent++;
    }
}
} // end tenant loop

echo "\n═══ CRON COMPLETE — Emails: " . $emailsSent . ", WhatsApp: " . $waSent . " ═══\n";