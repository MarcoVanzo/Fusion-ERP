<?php
declare(strict_types=1);

namespace FusionERP\Modules\OutSeason\Services;

use FusionERP\Shared\Database;
use FusionERP\Shared\PayPalService;
use FusionERP\Shared\StripeService;

class OutSeasonRegistrationService
{
    public static function publicStatus(string $seasonKey, string $stripePk): array
    {
        $pdo = Database::getInstance();
        
        $roleMap = [
            'Alzatrice'      => 'Palleggiatrice',
            'Palleggiatrice' => 'Palleggiatrice',
            'Opposto'        => 'Opposta',
            'Opposta'        => 'Opposta',
            'Schiacciatrice' => 'Schiacciatrice',
            'Centrale'       => 'Centrale',
            'Libero'         => 'Libero',
        ];

        $stmt = $pdo->prepare("SELECT settimana_scelta AS week, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') GROUP BY settimana_scelta");
        $stmt->execute([':sk' => $seasonKey]);
        $totals = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt2 = $pdo->prepare("SELECT settimana_scelta AS week, ruolo AS role, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') GROUP BY settimana_scelta, ruolo");
        $stmt2->execute([':sk' => $seasonKey]);
        $byRole = [];
        foreach ($stmt2->fetchAll(\PDO::FETCH_ASSOC) as $r) {
            $canonical = $roleMap[$r['role']] ?? $r['role'];
            $byRole[$r['week']][$canonical] = ($byRole[$r['week']][$canonical] ?? 0) + (int)$r['count'];
        }

        $stmtForesteria = $pdo->prepare("SELECT settimana_scelta AS week, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' GROUP BY settimana_scelta");
        $stmtForesteria->execute([':sk' => $seasonKey]);
        $foresteriaCounts = [];
        foreach ($stmtForesteria->fetchAll(\PDO::FETCH_ASSOC) as $fc) {
            $foresteriaCounts[$fc['week']] = (int)$fc['count'];
        }

        $quotas = [
            'Palleggiatrice' => 4,
            'Opposta'        => 4,
            'Schiacciatrice' => 8,
            'Centrale'       => 8,
            'Libero'         => 4,
        ];

        return [
            'counts' => $totals,
            'by_role' => $byRole,
            'quotas'  => $quotas,
            'foresteria_quota' => 12,
            'foresteria_counts' => $foresteriaCounts,
            'stripe_pk' => $stripePk,
        ];
    }

    public static function validateDiscount(string $code, string $seasonKey): array
    {
        $code = strtoupper(trim($code));
        if (empty($code)) { throw new \Exception('Codice sconto mancante.', 400); }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT id, discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:code AND season_key=:sk AND is_active=1");
        $stmt->execute([':code' => $code, ':sk' => $seasonKey]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) { throw new \Exception('Codice sconto non valido.', 404); }
        if ($row['max_uses'] !== null && (int)$row['current_uses'] >= (int)$row['max_uses']) {
            throw new \Exception('Codice sconto esaurito.', 410);
        }
        return ['discount_percent' => (float)$row['discount_percent']];
    }

    public static function publicRegister(array $data, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        $required = ['nome_e_cognome','email','cellulare','codice_fiscale','data_di_nascita','indirizzo','cap','citta','provincia','ruolo','taglia_kit','settimana_scelta','formula_scelta','come_vuoi_pagare'];
        foreach ($required as $f) {
            if (empty(trim((string)($data[$f] ?? '')))) { throw new \Exception("Il campo {$f} è obbligatorio.", 400); }
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) { throw new \Exception('Email non valida.', 400); }
        
        $dob = trim((string)$data['data_di_nascita']);
        $dobDate = \DateTime::createFromFormat('Y-m-d', $dob);
        if (!$dobDate || $dobDate->format('Y-m-d') !== $dob) {
            throw new \Exception('Data di nascita non valida. Usa il formato GG/MM/AAAA.', 400);
        }
        $dobYear = (int)$dobDate->format('Y');
        if ($dobYear < 1920 || $dobYear > 2025) {
            throw new \Exception('Data di nascita non valida: anno ' . $dobYear . ' fuori range.', 400);
        }
        if (empty($data['privacy_consent'])) { throw new \Exception('Consenso privacy obbligatorio.', 400); }

        $isFullMaster = str_contains((string)$data['formula_scelta'], 'Full');
        $basePrice = $isFullMaster ? $priceFull : $pricePartial;

        $discountPct = 0.0;
        $discountCode = strtoupper(trim((string)($data['codice_sconto'] ?? '')));

        if (!empty($discountCode)) {
            $pdo2 = Database::getInstance();
            $ds = $pdo2->prepare("SELECT id, discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk AND is_active=1");
            $ds->execute([':c' => $discountCode, ':sk' => $seasonKey]);
            $dc = $ds->fetch(\PDO::FETCH_ASSOC);
            if ($dc && ($dc['max_uses'] === null || (int)$dc['current_uses'] < (int)$dc['max_uses'])) {
                $discountPct = (float)$dc['discount_percent'];
            }
        }
        $finalPrice = round($basePrice * (1 - $discountPct / 100), 2);
        $paymentMethod = trim((string)$data['come_vuoi_pagare']);

        $pdo = Database::getInstance();
        $tid = 'TNT_fusion';
        $pdo->beginTransaction();
        try {
            if ($isFullMaster) {
                $fcStmt = $pdo->prepare("SELECT COUNT(*) FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' AND settimana_scelta=:week FOR UPDATE");
                $fcStmt->execute([':sk' => $seasonKey, ':week' => trim((string)$data['settimana_scelta'])]);
                $fullCount = (int)$fcStmt->fetchColumn();
                if ($fullCount >= 12) {
                    $pdo->rollBack();
                    throw new \Exception('I posti in foresteria per questa settimana sono esauriti (massimo 12 Full Camp). Puoi scegliere la formula Daily Master oppure un\'altra settimana.', 409);
                }
            }

            $sql = "INSERT INTO outseason_entries (tenant_id, season_key, nome_e_cognome, email, cellulare, codice_fiscale, data_di_nascita, indirizzo, cap, citta, provincia, club_di_appartenenza, ruolo, taglia_kit, settimana_scelta, formula_scelta, come_vuoi_pagare, codice_sconto, entry_date, entry_status, payment_status, payment_method, synced_at) VALUES (:tid,:sk,:nome,:email,:cell,:cf,:dob,:addr,:cap,:citta,:prov,:club,:ruolo,:kit,:week,:formula,:pagare,:sconto,NOW(),'Submitted',:ps,:pm,NOW())";
            $stmt = $pdo->prepare($sql);
            $ps = ($paymentMethod === 'Bonifico Bancario') ? 'PENDING' : 'AWAITING_PAYMENT';
            $pm = ($paymentMethod === 'Bonifico Bancario') ? 'BONIFICO' : 'PAYPAL';
            $stmt->execute([
                ':tid'=>$tid, ':sk'=>$seasonKey, ':nome'=>trim($data['nome_e_cognome']),
                ':email'=>trim($data['email']), ':cell'=>$data['cellulare']??null,
                ':cf'=>$data['codice_fiscale']??null, ':dob'=>$data['data_di_nascita']??null,
                ':addr'=>$data['indirizzo']??null, ':cap'=>$data['cap']??null,
                ':citta'=>$data['citta']??null, ':prov'=>$data['provincia']??null,
                ':club'=>$data['club_di_appartenenza']??null, ':ruolo'=>$data['ruolo']??null,
                ':kit'=>$data['taglia_kit']??null, ':week'=>$data['settimana_scelta']??null,
                ':formula'=>$data['formula_scelta']??null, ':pagare'=>$paymentMethod,
                ':sconto'=>$discountCode?:null, ':ps'=>$ps, ':pm'=>$pm,
            ]);
            $entryId = (int)$pdo->lastInsertId();

            $pdo->commit();
        } catch (\Throwable $txErr) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            throw $txErr;
        }

        if (!empty($discountCode) && $discountPct > 0) {
            $pdo->prepare("UPDATE outseason_discount_codes SET current_uses=current_uses+1 WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk")->execute([':c'=>$discountCode,':sk'=>$seasonKey]);
        }

        if ($paymentMethod === 'Bonifico Bancario') {
            OutSeasonEmailService::sendBonificoEmail($data, $finalPrice, $entryId, $seasonKey, $priceFull, $pricePartial);
            return ['entry_id'=>$entryId, 'payment_method'=>'BONIFICO', 'amount'=>$finalPrice];
        }

        $pdo->prepare("DELETE FROM outseason_entries WHERE tenant_id='TNT_fusion' AND payment_status='AWAITING_PAYMENT' AND entry_date < DATE_SUB(NOW(), INTERVAL 2 HOUR)")->execute();

        $paypal = new PayPalService();
        $baseUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
        $returnUrl = $baseUrl . '/outseason/paypal-return.html?entry_id=' . $entryId;
        $cancelUrl = $baseUrl . '/outseason/index.html?cancelled=1';
        $order = $paypal->createOrder(
            $finalPrice,
            "OutSeason " . $seasonKey . " — " . trim($data['nome_e_cognome']),
            ['entry_id'=>$entryId, 'season'=>$seasonKey],
            $returnUrl,
            $cancelUrl
        );
        $pdo->prepare("UPDATE outseason_entries SET paypal_order_id=:oid WHERE id=:id")->execute([':oid'=>$order['id'], ':id'=>$entryId]);

        $approveUrl = '';
        foreach ($order['links'] ?? [] as $link) {
            if (($link['rel'] ?? '') === 'approve') {
                $approveUrl = $link['href'];
                break;
            }
        }

        return [
            'entry_id'=>$entryId, 'paypal_order_id'=>$order['id'],
            'paypal_client_id'=>$paypal->getClientId(), 'amount'=>$finalPrice,
            'approve_url'=>$approveUrl,
        ];
    }

    public static function capturePayment(string $orderId, int $entryId, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        if (empty($orderId) || $entryId < 1) { throw new \Exception('Parametri mancanti.', 400); }

        $pdo = Database::getInstance();
        $check = $pdo->prepare("SELECT * FROM outseason_entries WHERE id=:id AND tenant_id='TNT_fusion'");
        $check->execute([':id'=>$entryId]);
        $entry = $check->fetch(\PDO::FETCH_ASSOC);
        if (!$entry) { throw new \Exception('Iscrizione non trovata.', 404); }
        if ($entry['paypal_order_id'] !== $orderId) { throw new \Exception('Order ID non corrispondente.', 403); }
        if ($entry['payment_status'] === 'PAID') { return ['already_paid'=>true]; }

        $paypal = new PayPalService();
        $capture = $paypal->captureOrder($orderId);

        if (($capture['status'] ?? '') !== 'COMPLETED') {
            $pdo->prepare("UPDATE outseason_entries SET payment_status='FAILED' WHERE id=:id")->execute([':id'=>$entryId]);
            throw new \Exception('Pagamento non completato. Status: ' . ($capture['status'] ?? 'unknown'), 422);
        }

        $captureId = $capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
        $payerEmail = $capture['payer']['email_address'] ?? null;
        $paymentSource = array_key_first($capture['payment_source'] ?? []) ?? 'paypal';

        $pdo->prepare("UPDATE outseason_entries SET payment_status='PAID', paypal_capture_id=:cid, payment_method=:pm, paid_at=NOW() WHERE id=:id")
            ->execute([':cid'=>$captureId, ':pm'=>strtoupper($paymentSource), ':id'=>$entryId]);

        OutSeasonEmailService::sendConfirmationEmail($entry, $captureId, $payerEmail, $seasonKey, $priceFull, $pricePartial);

        return ['paid'=>true, 'capture_id'=>$captureId, 'payment_source'=>$paymentSource];
    }

    public static function createStripeIntent(array $data, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        $requiredFields = ['nome_e_cognome','email','cellulare','codice_fiscale','data_di_nascita','settimana_scelta','formula_scelta','come_vuoi_pagare'];
        foreach ($requiredFields as $f) {
            if (empty(trim((string)($data[$f] ?? '')))) {
                throw new \Exception("Campo obbligatorio mancante: {$f}", 422);
            }
        }

        $formula = trim((string)$data['formula_scelta']);
        $isFullMaster = (stripos($formula, 'Full') !== false);
        $basePrice = $isFullMaster ? $priceFull : $pricePartial;

        $discountCode = strtoupper(trim((string)($data['codice_sconto'] ?? '')));
        $discountPct = 0;
        if (!empty($discountCode)) {
            $pdo = Database::getInstance();
            $ds = $pdo->prepare("SELECT discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk AND is_active=1");
            $ds->execute([':c'=>$discountCode, ':sk'=>$seasonKey]);
            $dc = $ds->fetch(\PDO::FETCH_ASSOC);
            if ($dc && ($dc['max_uses'] === null || $dc['current_uses'] < $dc['max_uses'])) {
                $discountPct = (float)$dc['discount_percent'];
            }
        }
        $finalPrice = round($basePrice * (1 - $discountPct / 100), 2);

        $pdo = Database::getInstance();
        $tid = 'TNT_fusion';
        $pdo->beginTransaction();
        try {
            if ($isFullMaster) {
                $fcStmt = $pdo->prepare("SELECT COUNT(*) FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' AND settimana_scelta=:week FOR UPDATE");
                $fcStmt->execute([':sk' => $seasonKey, ':week' => trim((string)$data['settimana_scelta'])]);
                if ((int)$fcStmt->fetchColumn() >= 12) {
                    $pdo->rollBack();
                    throw new \Exception('Posti in foresteria esauriti per questa settimana.', 409);
                }
            }

            $sql = "INSERT INTO outseason_entries (tenant_id, season_key, nome_e_cognome, email, cellulare, codice_fiscale, data_di_nascita, indirizzo, cap, citta, provincia, club_di_appartenenza, ruolo, taglia_kit, settimana_scelta, formula_scelta, come_vuoi_pagare, codice_sconto, entry_date, entry_status, payment_status, payment_method, synced_at) VALUES (:tid,:sk,:nome,:email,:cell,:cf,:dob,:addr,:cap,:citta,:prov,:club,:ruolo,:kit,:week,:formula,:pagare,:sconto,NOW(),'Submitted','AWAITING_PAYMENT','STRIPE',NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':tid'=>$tid, ':sk'=>$seasonKey, ':nome'=>trim($data['nome_e_cognome']),
                ':email'=>trim($data['email']), ':cell'=>$data['cellulare']??null,
                ':cf'=>$data['codice_fiscale']??null, ':dob'=>$data['data_di_nascita']??null,
                ':addr'=>$data['indirizzo']??null, ':cap'=>$data['cap']??null,
                ':citta'=>$data['citta']??null, ':prov'=>$data['provincia']??null,
                ':club'=>$data['club_di_appartenenza']??null, ':ruolo'=>$data['ruolo']??null,
                ':kit'=>$data['taglia_kit']??null, ':week'=>$data['settimana_scelta']??null,
                ':formula'=>$data['formula_scelta']??null, ':pagare'=>'Stripe',
                ':sconto'=>$discountCode?:null,
            ]);
            $entryId = (int)$pdo->lastInsertId();
            $pdo->commit();
        } catch (\Throwable $txErr) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            throw $txErr;
        }

        if (!empty($discountCode) && $discountPct > 0) {
            $pdo->prepare("UPDATE outseason_discount_codes SET current_uses=current_uses+1 WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk")->execute([':c'=>$discountCode,':sk'=>$seasonKey]);
        }

        $pdo->prepare("DELETE FROM outseason_entries WHERE tenant_id='TNT_fusion' AND payment_status='AWAITING_PAYMENT' AND entry_date < DATE_SUB(NOW(), INTERVAL 2 HOUR)")->execute();

        $stripe = new StripeService();
        $intent = $stripe->createPaymentIntent(
            $finalPrice,
            "OutSeason " . $seasonKey . " — " . trim($data['nome_e_cognome']),
            ['entry_id' => $entryId, 'season' => $seasonKey]
        );

        $pdo->prepare("UPDATE outseason_entries SET paypal_order_id=:pid WHERE id=:id")
            ->execute([':pid' => $intent['id'], ':id' => $entryId]);

        return [
            'entry_id'      => $entryId,
            'client_secret' => $intent['client_secret'],
            'stripe_pk'     => $stripe->getPublishableKey(),
            'amount'        => $finalPrice,
        ];
    }

    public static function confirmStripePayment(string $intentId, int $entryId, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        if (empty($intentId) || $entryId < 1) { throw new \Exception('Parametri mancanti.', 400); }

        $pdo = Database::getInstance();
        $check = $pdo->prepare("SELECT * FROM outseason_entries WHERE id=:id AND tenant_id='TNT_fusion'");
        $check->execute([':id'=>$entryId]);
        $entry = $check->fetch(\PDO::FETCH_ASSOC);
        if (!$entry) { throw new \Exception('Iscrizione non trovata.', 404); }
        if ($entry['payment_status'] === 'PAID') { return ['already_paid'=>true]; }

        $stripe = new StripeService();
        $intent = $stripe->getPaymentIntent($intentId);

        if (($intent['status'] ?? '') !== 'succeeded') {
            $pdo->prepare("UPDATE outseason_entries SET payment_status='FAILED' WHERE id=:id")->execute([':id'=>$entryId]);
            throw new \Exception('Pagamento non completato. Status: ' . ($intent['status'] ?? 'unknown'), 422);
        }

        $chargeId = $intent['latest_charge'] ?? null;
        $paymentMethod = $intent['payment_method_types'][0] ?? 'card';

        $pdo->prepare("UPDATE outseason_entries SET payment_status='PAID', paypal_capture_id=:cid, payment_method=:pm, paid_at=NOW() WHERE id=:id")
            ->execute([':cid'=>$chargeId, ':pm'=>'STRIPE_' . strtoupper($paymentMethod), ':id'=>$entryId]);

        OutSeasonEmailService::sendConfirmationEmail($entry, $chargeId, $entry['email'], $seasonKey, $priceFull, $pricePartial);

        return ['paid'=>true, 'charge_id'=>$chargeId, 'payment_method'=>$paymentMethod];
    }
}
