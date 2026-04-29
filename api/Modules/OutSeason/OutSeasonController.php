<?php
/**
 * OutSeason Controller — Orchestrator for OutSeason actions.
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\OutSeason;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\OutSeason\Services\OutSeasonSyncService;
use FusionERP\Modules\OutSeason\Services\OutSeasonPaymentService;
use FusionERP\Modules\OutSeason\Services\OutSeasonRegistrationService;

class OutSeasonController
{
    private static function cognitoFormId(): int
    {
        return (int)(($_ENV['COGNITO_FORM_ID'] ?? getenv('COGNITO_FORM_ID')) ?: 20);
    }

    private static function cognitoViewId(): int
    {
        return (int)(($_ENV['COGNITO_VIEW_ID'] ?? getenv('COGNITO_VIEW_ID')) ?: 1);
    }

    private static function seasonKey(): string
    {
        return trim((string)(($_ENV['OUTSEASON_SEASON_KEY'] ?? getenv('OUTSEASON_SEASON_KEY')) ?: '2026'));
    }

    private static function priceFull(): int
    {
        return (int)(($_ENV['OUTSEASON_PRICE_FULL'] ?? getenv('OUTSEASON_PRICE_FULL')) ?: 650);
    }

    private static function pricePartial(): int
    {
        return (int)(($_ENV['OUTSEASON_PRICE_PARTIAL'] ?? getenv('OUTSEASON_PRICE_PARTIAL')) ?: 400);
    }

    public function getEntries(): void
    {
        Auth::requireRead('outseason');

        $seasonKey = trim((string)(
            filter_input(INPUT_GET, 'season_key', FILTER_DEFAULT)
            ?? self::seasonKey()
        ));

        $pdo = Database::getInstance();
        $tid = TenantContext::id();
        $stmt = $pdo->prepare(
            'SELECT * FROM outseason_entries
             WHERE season_key = :season_key AND tenant_id = :tid AND is_deleted = 0
             AND payment_status NOT IN (\'AWAITING_PAYMENT\', \'FAILED\')
             ORDER BY entry_date ASC LIMIT 500'
        );
        $stmt->execute([':season_key' => $seasonKey, ':tid' => $tid]);
        $rows = $stmt->fetchAll();

        $syncStmt = $pdo->prepare(
            'SELECT MAX(synced_at) AS last_sync FROM outseason_entries WHERE season_key = :sk AND tenant_id = :tid'
        );
        $syncStmt->execute([':sk' => $seasonKey, ':tid' => $tid]);
        $lastSync = $syncStmt->fetchColumn();

        Response::success([
            'season_key' => $seasonKey,
            'entries' => $rows,
            'last_sync' => $lastSync,
            'count' => count($rows),
        ]);
    }

    public function syncFromCognito(): void
    {
        Auth::requireWrite('outseason');

        $result = OutSeasonSyncService::sync(self::seasonKey(), self::cognitoFormId(), self::cognitoViewId());

        if (!$result['success']) {
            Response::error($result['error'], 502);
        }

        Response::success([
            'upserted' => $result['upserted'],
            'season_key' => self::seasonKey(),
            'synced_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function deleteEntry(): void
    {
        Auth::requireWrite('outseason');
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            Response::error('ID non valido.', 400);
        }

        $pdo = Database::getInstance();
        $tid = TenantContext::id();

        $stmt = $pdo->prepare('UPDATE outseason_entries SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid');
        $stmt->execute([':id' => $id, ':tid' => $tid]);

        if ($stmt->rowCount() === 0) {
            Response::error('Record non trovato o già eliminato.', 404);
        }

        Response::success(['deleted' => true, 'id' => $id]);
    }

    public function verifyPayments(): void
    {
        Auth::requireWrite('outseason');
        
        try {
            $result = OutSeasonPaymentService::verifyPayments(
                $_FILES['file'] ?? [], 
                self::seasonKey(), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $code);
        }
    }

    public function saveVerification(): void
    {
        $user = Auth::requireWrite('outseason');
        $body = Response::jsonBody();
        
        try {
            $result = OutSeasonPaymentService::saveVerification(
                $body, 
                $user, 
                trim((string)($body['season_key'] ?? '')), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $code);
        }
    }

    public function getVerification(): void
    {
        Auth::requireRead('outseason');
        
        try {
            $seasonKey = trim((string)filter_input(INPUT_GET, 'season_key', FILTER_DEFAULT));
            $results = OutSeasonPaymentService::getVerification($seasonKey);
            Response::success(['season_key' => $seasonKey, 'results' => $results]);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $code);
        }
    }

    private static function setCorsPublic(): void
    {
        $allowed = ['https://www.fusionteamvolley.it', 'https://fusionteamvolley.it'];
        $appUrl = getenv('APP_URL') ?: '';
        if ($appUrl) $allowed[] = rtrim($appUrl, '/');
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        foreach ($allowed as $ao) {
            $p = parse_url($ao);
            $base = ($p['scheme'] ?? 'https') . '://' . ($p['host'] ?? '');
            if (!empty($p['port'])) $base .= ':' . $p['port'];
            if ($origin === $base) { header("Access-Control-Allow-Origin: {$origin}"); header('Vary: Origin'); break; }
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    }

    public function publicStatus(): void
    {
        self::setCorsPublic();
        header('Cache-Control: no-cache, no-store, must-revalidate');
        
        $stripePk = $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? getenv('STRIPE_PUBLISHABLE_KEY');
        $result = OutSeasonRegistrationService::publicStatus(self::seasonKey(), $stripePk ?: '');
        Response::success($result);
    }

    public function validateDiscount(): void
    {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        
        try {
            $result = OutSeasonRegistrationService::validateDiscount($body['code'] ?? '', self::seasonKey());
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $code);
        }
    }

    public function publicRegister(): void
    {
        self::setCorsPublic();
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            if (!$data) { throw new \Exception('Dati non validi.', 400); }
            $result = OutSeasonRegistrationService::publicRegister(
                $data, 
                self::seasonKey(), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error('Errore: ' . $e->getMessage(), $code);
        }
    }

    public function capturePayment(): void
    {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        
        try {
            $result = OutSeasonRegistrationService::capturePayment(
                trim((string)($body['paypal_order_id'] ?? '')), 
                (int)($body['entry_id'] ?? 0), 
                self::seasonKey(), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error('Errore cattura pagamento: ' . $e->getMessage(), $code);
        }
    }

    public function createStripeIntent(): void
    {
        self::setCorsPublic();
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            if (!$data) { throw new \Exception('Dati non validi.', 400); }
            $result = OutSeasonRegistrationService::createStripeIntent(
                $data, 
                self::seasonKey(), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error('Errore: ' . $e->getMessage(), $code);
        }
    }

    public function confirmStripePayment(): void
    {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        
        try {
            $result = OutSeasonRegistrationService::confirmStripePayment(
                trim((string)($body['payment_intent_id'] ?? '')), 
                (int)($body['entry_id'] ?? 0), 
                self::seasonKey(), 
                self::priceFull(), 
                self::pricePartial()
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = (int)$e->getCode();
            $code = ($code >= 400 && $code <= 599) ? $code : 500;
            Response::error('Errore conferma pagamento Stripe: ' . $e->getMessage(), $code);
        }
    }
}