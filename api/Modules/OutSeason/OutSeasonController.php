<?php
/**
 * OutSeason Controller — Cognito Sync + Bank Statement Verification via Gemini AI
 * Fusion ERP v1.0
 *
 * Actions:
 *   GET  getEntries       — restituisce le iscritte dalla tabella DB
 *   POST syncFromCognito  — sincronizza i dati Cognito nel DB (manuale)
 *   POST verifyPayments   — verifica bonifici tramite Gemini AI
 *   POST saveVerification — salva i risultati AI
 *   GET  getVerification  — legge i risultati AI salvati
 */

declare(strict_types=1);

namespace FusionERP\Modules\OutSeason;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\AIService;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\PayPalService;
use FusionERP\Shared\StripeService;
use FusionERP\Shared\Mailer;

class OutSeasonController
{
    // ── Configuration ──────────────────────────────────────────────────────────────────────────────
    // Values are read from .env to avoid hard-coding season-specific data.
    // Defaults are kept as fallback so the system works without .env changes.
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

    /* ─────────────────────────────────────────────────────────────────────
     * getEntries — legge iscritte dal DB (sincronizzate da Cognito)
     * GET /api?module=outseason&action=getEntries[&season_key=2026]
     * ───────────────────────────────────────────────────────────────────── */
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

        // Last sync time
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

    /* ─────────────────────────────────────────────────────────────────────
     * syncFromCognito — chiama Cognito OData API e aggiorna il DB
     * POST /api?module=outseason&action=syncFromCognito
     * ───────────────────────────────────────────────────────────────────── */
    public function syncFromCognito(): void
    {
        Auth::requireWrite('outseason');

        $result = self::_doSync(self::seasonKey());

        if (!$result['success']) {
            Response::error($result['error'], 502);
        }

        Response::success([
            'upserted' => $result['upserted'],
            'season_key' => self::seasonKey(),
            'synced_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * deleteEntry — marca l'entry come is_deleted = 1
     * POST /api?module=outseason&action=deleteEntry&id=123
     * ───────────────────────────────────────────────────────────────────── */
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

    /* ─────────────────────────────────────────────────────────────────────
     * _doSync — logica di sync condivisa (usata anche dal cron CLI)
     * ───────────────────────────────────────────────────────────────────── */
    public static function _doSync(string $seasonKey): array
    {
        $apiKey = $_ENV['COGNITO_API_KEY'] ?? getenv('COGNITO_API_KEY');
        if (empty($apiKey)) {
            return ['success' => false, 'error' => 'COGNITO_API_KEY non configurata.'];
        }

        $formId = self::cognitoFormId();
        $viewId = self::cognitoViewId();

        // Cognito OData API: richiediamo tutti i campi (senza $select) perché
        // la notazione OData per i campi annidati (Entry_DateSubmitted ecc.)
        // nel parametro $select causa HTTP 400 su alcune versioni dell'API.
        $url = 'https://www.cognitoforms.com/api/odata/Forms(' . $formId . ')/Views(' . $viewId . ')/Entries';


        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);

        if ($response === false || !empty($curlError)) {
            return ['success' => false, 'error' => 'Errore cURL Cognito: ' . $curlError];
        }

        if ($httpCode !== 200) {
            error_log('[OutSeason Sync] Cognito API HTTP ' . $httpCode . ': ' . $response);
            $errorMsg = 'Cognito API ha risposto HTTP ' . $httpCode;
            if ($httpCode === 401) {
                $errorMsg = 'Token Cognito scaduto o non valido (HTTP 401). '
                    . 'Rinnova il token su cognitoforms.com → Account → API Keys '
                    . 'e aggiorna la variabile COGNITO_API_KEY nel file .env del server.';
            }
            elseif ($httpCode === 404) {
                $errorMsg = 'Form o View Cognito non trovato (HTTP 404). '
                    . 'Verifica COGNITO_FORM_ID=' . self::cognitoFormId()
                    . ' e COGNITO_VIEW_ID=' . self::cognitoViewId() . '.';
            }
            return ['success' => false, 'error' => $errorMsg];
        }

        $decoded = json_decode((string)$response, true);
        $entries = $decoded['value'] ?? ($decoded ?: []);

        if (!is_array($entries) || empty($entries)) {
            return ['success' => false, 'error' => 'Nessun dato ricevuto da Cognito.'];
        }

        $pdo = Database::getInstance();
        $tid = TenantContext::id();

        $sql = "
            INSERT INTO outseason_entries
                (tenant_id, cognito_id, season_key, nome_e_cognome, email, cellulare, codice_fiscale,
                 data_di_nascita, indirizzo, cap, citta, provincia, club_di_appartenenza,
                 ruolo, taglia_kit, settimana_scelta, formula_scelta, come_vuoi_pagare,
                 codice_sconto, entry_date, entry_status, order_summary, synced_at)
            VALUES
                (:tid, :cog_id, :sk, :nome, :email, :cell, :cf,
                 :dob, :addr, :cap, :citta, :prov, :club,
                 :ruolo, :kit, :week, :formula, :pagare,
                 :sconto, :edate, :estatus, :osummary, NOW())
            ON DUPLICATE KEY UPDATE
                tenant_id            = VALUES(tenant_id),
                season_key           = VALUES(season_key),
                nome_e_cognome       = VALUES(nome_e_cognome),
                email                = VALUES(email),
                cellulare            = VALUES(cellulare),
                codice_fiscale       = VALUES(codice_fiscale),
                data_di_nascita      = VALUES(data_di_nascita),
                indirizzo            = VALUES(indirizzo),
                cap                  = VALUES(cap),
                citta                = VALUES(citta),
                provincia            = VALUES(provincia),
                club_di_appartenenza = VALUES(club_di_appartenenza),
                ruolo                = VALUES(ruolo),
                taglia_kit           = VALUES(taglia_kit),
                settimana_scelta     = VALUES(settimana_scelta),
                formula_scelta       = VALUES(formula_scelta),
                come_vuoi_pagare     = VALUES(come_vuoi_pagare),
                codice_sconto        = VALUES(codice_sconto),
                entry_date           = VALUES(entry_date),
                entry_status         = VALUES(entry_status),
                order_summary        = VALUES(order_summary),
                synced_at            = NOW()
        ";

        $stmt = $pdo->prepare($sql);
        $upserted = 0;

        foreach ($entries as $e) {
            // Parse date (ISO 8601 from Cognito, may have .ms)
            // Cognito OData restituisce i campi annidati con underscore: Entry_DateSubmitted
            $dob = !empty($e['DataDiNascita']) ? substr((string)$e['DataDiNascita'], 0, 10) : null;
            $rawDate = $e['Entry_DateSubmitted'] ?? $e['Entry.DateSubmitted'] ?? null;
            $edate = !empty($rawDate) ? date('Y-m-d H:i:s', (int)strtotime((string)$rawDate)) : null;

            $stmt->execute([
                ':tid' => $tid,
                ':cog_id' => (int)$e['Id'],
                ':sk' => $seasonKey,
                ':nome' => (string)($e['NomeECognome'] ?? ''),
                ':email' => $e['Email'] ?? null,
                ':cell' => $e['Cellulare'] ?? null,
                ':cf' => $e['CodiceFiscale'] ?? null,
                ':dob' => $dob,
                ':addr' => $e['IndirizzoDiResidenza'] ?? null,
                ':cap' => $e['CAP'] ?? null,
                ':citta' => $e['Citta'] ?? null,
                ':prov' => $e['Provincia'] ?? null,
                ':club' => $e['ClubDiAppartenenza'] ?? null,
                ':ruolo' => $e['Ruolo'] ?? null,
                ':kit' => $e['TagliaKIT'] ?? null,
                ':week' => $e['SettimanaScelta'] ?? null,
                ':formula' => $e['FormulaScelta'] ?? null,
                ':pagare' => $e['ComeVuoiPagare'] ?? null,
                ':sconto' => $e['CodiceSconto'] ?? null,
                ':edate' => $edate,
                // Supporto sia underscore (API reale) che punto (legacy fallback)
                ':estatus' => $e['Entry_Status'] ?? $e['Entry.Status'] ?? null,
                ':osummary' => $e['Order_OrderSummary'] ?? $e['Order.OrderSummary'] ?? null,
            ]);
            $upserted++;
        }

        return ['success' => true, 'upserted' => $upserted];
    }

    /* ─────────────────────────────────────────────────────────────────────
     * verifyPayments — Bank Statement PDF → Gemini AI verification
     * POST /api?module=outseason&action=verifyPayments
     * ───────────────────────────────────────────────────────────────────── */
    public function verifyPayments(): void
    {
        $user = Auth::requireWrite('outseason');

        // ── Validate upload ──────────────────────────────────────────────
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File non caricato o errore upload', 400);
        }

        $file = $_FILES['file'];

        if ($file['size'] > 10 * 1024 * 1024) {
            Response::error('File troppo grande. Massimo 10 MB.', 413);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if ($mimeType !== 'application/pdf') {
            Response::error('Solo file PDF accettati.', 415);
        }

        // ── Load bonifico entries from DB ────────────────────────────────
        $pdo = Database::getInstance();
        $tid = TenantContext::id();
        $stmt = $pdo->prepare(
            "SELECT nome_e_cognome, formula_scelta, order_summary, codice_sconto
             FROM outseason_entries
             WHERE season_key = :sk AND tenant_id = :tid AND come_vuoi_pagare = 'Bonifico Bancario'
               AND is_deleted = 0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED')
             ORDER BY nome_e_cognome"
        );
        $stmt->execute([':sk' => self::seasonKey(), ':tid' => $tid]);
        $bonificoEntries = $stmt->fetchAll();

        if (empty($bonificoEntries)) {
            Response::error('Nessuna iscritta con bonifico trovata nel DB. Esegui prima la sincronizzazione.', 422);
        }



        // ── Build prompt with dynamic entries ────────────────────────────
        // ── Determine amount per formula ──────────────────────────────────────────────────
        // Prices are read from env vars to avoid hard-coding financial values.
        // OUTSEASON_PRICE_FULL and OUTSEASON_PRICE_PARTIAL can be set in .env.
        $priceFull = (int)(($_ENV['OUTSEASON_PRICE_FULL'] ?? getenv('OUTSEASON_PRICE_FULL')) ?: 650);
        $pricePartial = (int)(($_ENV['OUTSEASON_PRICE_PARTIAL'] ?? getenv('OUTSEASON_PRICE_PARTIAL')) ?: 400);

        $entriesText = '';
        $bonificoList = [];
        foreach ($bonificoEntries as $i => $entry) {
            $amount = str_contains((string)$entry['formula_scelta'], 'Full') ? $priceFull : $pricePartial;
            // If a discount code was applied, reduce by 10%
            if (!empty(trim((string)($entry['codice_sconto'] ?? '')))) {
                $amount = round($amount * 0.9, 2);
            }
            $n = $i + 1;
            $entriesText .= $n . '. ' . $entry['nome_e_cognome'] . ' — ' . number_format($amount, 2, ',', '.') . " €\n";
            $bonificoList[] = ['name' => $entry['nome_e_cognome'], 'amount' => $amount];
        }

        $total = count($bonificoList);
        $totalStr = (string)$total;
        $prompt = <<<PROMPT
Sei un assistente finanziario esperto nell'analisi di estratti conto bancari italiani.

Ti viene fornito un PDF di un estratto conto bancario. Il documento contiene una tabella con diverse colonne, tra cui tipicamente: Data, Valuta, Descrizione (o Causale), Dare, Avere.

COMPITO: Devi verificare se le seguenti persone hanno effettuato un BONIFICO in ENTRATA (accredito) cercando il loro COGNOME nella colonna DESCRIZIONE/CAUSALE di ogni transazione.

ELENCO PERSONE DA VERIFICARE (nome, cognome e importo atteso):
{$entriesText}

COME CERCARE:
1. Leggi TUTTE le righe/transazioni dell'estratto conto
2. Per ogni transazione, analizza il testo nella colonna DESCRIZIONE o CAUSALE
3. Cerca il COGNOME di ciascuna persona dell'elenco dentro la descrizione della transazione
4. Il cognome potrebbe apparire parzialmente, in maiuscolo, o essere il cognome di un genitore che ha fatto il bonifico per conto del figlio
5. Controlla anche che l'importo (nella colonna Avere/Entrata) corrisponda a quello atteso (150 o 250 euro)
6. Se il cognome viene trovato nella descrizione E l'importo corrisponde, segna la persona come "found": true

Rispondi con un JSON con questa struttura esatta:
{
  "results": [
    {
      "name": "Nome Cognome della persona cercata",
      "expected_amount": 250,
      "found": true,
      "transaction_date": "DD/MM/YYYY o null",
      "transaction_amount": 250.00,
      "transaction_description": "testo della descrizione/causale trovata",
      "confidence": "high",
      "notes": "es: cognome trovato nella causale, bonifico da genitore"
    }
  ],
  "summary": {
    "total_checked": {$totalStr},
    "found": 0,
    "not_found": 0
  },
  "extra_transactions": []
}

REGOLE IMPORTANTI:
- Devi restituire ESATTAMENTE una entry in "results" per OGNI persona dell'elenco (tutte e {$totalStr})
- confidence: "high" se cognome e importo matchano, "medium" se solo cognome o solo importo, "low" se match incerto
- extra_transactions: inserisci bonifici con importo 150 o 250 che non matchano nessun cognome dell'elenco
PROMPT;

        // ── Send to Gemini API ──────────────────────────────────────────
        $pdfData = base64_encode((string)file_get_contents($file['tmp_name']));
        
        $promptParts = [
            ['text' => $prompt],
            ['inline_data' => ['mime_type' => 'application/pdf', 'data' => $pdfData]],
        ];

        try {
            $rawText = AIService::generateContent($promptParts, [
                'maxOutputTokens' => 65536,
                'temperature' => 0.0,
                'responseMimeType' => 'application/json',
                'thinkingConfig' => ['thinkingBudget' => 1024],
            ]);
        } catch (\Exception $e) {
            Response::error('Errore di connessione a Gemini AI: ' . $e->getMessage(), 502);
        }

        if (empty($rawText)) {
            Response::error('Gemini non ha restituito risultati. Riprovare.', 422);
        }

        $parsed = AIService::extractJson($rawText);

        if (!is_array($parsed)) {
            $repaired = self::repairTruncatedJson($rawText);
            $parsed = AIService::extractJson($repaired) ?? json_decode($repaired, true);
        }

        if (!is_array($parsed)) {
            Response::success([
                'parsed' => false,
                'raw_response' => mb_substr($rawText, 0, 2000),
                'message' => 'L\'AI ha risposto ma il formato JSON era troncato o non valido. Riprovare.',
            ]);
        }

        $results = $parsed['results'] ?? $parsed;
        if (!is_array($results) || empty($results)) {
            Response::success([
                'parsed' => false,
                'raw_response' => mb_substr($rawText, 0, 2000),
                'message' => 'Nessun risultato trovato nella risposta AI.',
            ]);
        }

        Response::success([
            'parsed' => true,
            'results' => $results,
            'summary' => $parsed['summary'] ?? [
                'total_checked' => count($results),
                'found' => count(array_filter($results, fn($r) => !empty($r['found']))),
                'not_found' => count(array_filter($results, fn($r) => empty($r['found']))),
            ],
            'extra_transactions' => $parsed['extra_transactions'] ?? [],
            'bonifico_entries' => $bonificoList,
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * saveVerification
     * POST /api?module=outseason&action=saveVerification
     * ───────────────────────────────────────────────────────────────────── */
    public function saveVerification(): void
    {
        $user = Auth::requireWrite('outseason');
        $body = Response::jsonBody();
        $seasonKey = trim((string)($body['season_key'] ?? ''));
        $results = $body['results'] ?? [];

        if (empty($seasonKey) || !is_array($results) || empty($results)) {
            Response::error('Parametri mancanti: season_key e results richiesti.', 400);
        }

        $pdo = Database::getInstance();
        $tid = TenantContext::id();
        $sql = "
            INSERT INTO outseason_verifications
                (tenant_id, season_key, entry_name, found, confidence, transaction_date,
                 transaction_amount, transaction_description, notes, verified_by)
            VALUES
                (:tid, :season_key, :name, :found, :confidence, :tx_date,
                 :tx_amount, :tx_desc, :notes, :verified_by)
            ON DUPLICATE KEY UPDATE
                confidence              = IF(VALUES(found) = 1 OR found = 0, VALUES(confidence), confidence),
                transaction_date        = IF(VALUES(found) = 1 OR found = 0, VALUES(transaction_date), transaction_date),
                transaction_amount      = IF(VALUES(found) = 1 OR found = 0, VALUES(transaction_amount), transaction_amount),
                transaction_description = IF(VALUES(found) = 1 OR found = 0, VALUES(transaction_description), transaction_description),
                notes                   = IF(VALUES(found) = 1 OR found = 0, VALUES(notes), notes),
                verified_by             = IF(VALUES(found) = 1 OR found = 0, VALUES(verified_by), verified_by),
                verified_at             = IF(VALUES(found) = 1 OR found = 0, CURRENT_TIMESTAMP, verified_at),
                found                   = GREATEST(found, VALUES(found))
        ";

        $stmt = $pdo->prepare($sql);
        $saved = 0;

        $errors = [];
        foreach ($results as $r) {
            if (empty($r['name'])) {
                continue;
            }
            
            $conf = strtolower(trim((string)($r['confidence'] ?? '')));
            if (!in_array($conf, ['high', 'medium', 'low'])) {
                if ($conf === 'alta' || $conf === 'alto') $conf = 'high';
                elseif ($conf === 'media' || $conf === 'medio') $conf = 'medium';
                elseif ($conf === 'bassa' || $conf === 'basso') $conf = 'low';
                else $conf = 'low';
            }
            
            $r_found = !empty($r['found']) ? 1 : 0;
            
            // Fix transaction date length to max 20 chars
            $r_tx_date = isset($r['transaction_date']) ? mb_substr(trim((string)$r['transaction_date']), 0, 20) : null;
            if ($r_tx_date === 'null' || $r_tx_date === '') {
                $r_tx_date = null;
            }

            // Fix transaction amount to float
            $r_tx_AMOUNT = isset($r['transaction_amount']) ? (float)$r['transaction_amount'] : null;
            
            // Transaction description max length is TEXT (65535 chars), so it's safe
            $r_tx_desc = isset($r['transaction_description']) ? trim((string)$r['transaction_description']) : null;
            
            // Notes max length is TEXT
            $r_notes = isset($r['notes']) ? trim((string)$r['notes']) : null;
            
            $r_verified_by = $user['id'] ?? null;

            try {
                $stmt->execute([
                    ':tid' => $tid,
                    ':season_key' => $seasonKey,
                    ':name' => $r['name'],
                    ':found' => $r_found,
                    ':confidence' => $conf,
                    ':tx_date' => $r_tx_date,
                    ':tx_amount' => $r_tx_AMOUNT,
                    ':tx_desc' => $r_tx_desc,
                    ':notes' => $r_notes,
                    ':verified_by' => $r_verified_by,
                ]);
                $saved++;
            } catch (\PDOException $e) {
                // Return errors in JSON so we can debug exactly what happened
                $errors[] = "Failed on {$r['name']}: " . $e->getMessage();
                error_log("[OutSeason] Failed to save verification row for {$r['name']}: " . $e->getMessage());
            }
        }

        // ── Compute and update saldo on outseason_entries ──────────────────────
        // For each verified entry (found=true), calculate:
        //   saldo = prezzo_totale - importo_caparra_verificato
        $priceFull = (int)(($_ENV['OUTSEASON_PRICE_FULL'] ?? getenv('OUTSEASON_PRICE_FULL')) ?: 650);
        $pricePartial = (int)(($_ENV['OUTSEASON_PRICE_PARTIAL'] ?? getenv('OUTSEASON_PRICE_PARTIAL')) ?: 400);

        $saldoStmt = $pdo->prepare(
            'UPDATE outseason_entries SET saldo = :saldo
             WHERE tenant_id = :tid AND season_key = :sk AND LOWER(TRIM(nome_e_cognome)) = LOWER(TRIM(:nome)) AND is_deleted = 0'
        );

        foreach ($results as $r) {
            if (empty($r['name'])) continue;
            $rFound = !empty($r['found']) ? true : false;
            $txAmount = isset($r['transaction_amount']) ? (float)$r['transaction_amount'] : null;

            if ($rFound && $txAmount !== null && $txAmount > 0) {
                // Look up the entry's formula and discount code to determine the full price
                $lookupStmt = $pdo->prepare(
                    'SELECT formula_scelta, codice_sconto FROM outseason_entries
                     WHERE tenant_id = :tid AND season_key = :sk AND LOWER(TRIM(nome_e_cognome)) = LOWER(TRIM(:nome)) AND is_deleted = 0
                     LIMIT 1'
                );
                $lookupStmt->execute([':tid' => $tid, ':sk' => $seasonKey, ':nome' => $r['name']]);
                $entryRow = $lookupStmt->fetch(\PDO::FETCH_ASSOC);

                if ($entryRow !== false) {
                    $formula = $entryRow['formula_scelta'];
                    $totalPrice = str_contains((string)$formula, 'Full') ? $priceFull : $pricePartial;
                    // Apply 10% discount if a discount code was used
                    if (!empty(trim((string)($entryRow['codice_sconto'] ?? '')))) {
                        $totalPrice = round($totalPrice * 0.9, 2);
                    }
                    $saldo = round($totalPrice - $txAmount, 2);

                    try {
                        $saldoStmt->execute([
                            ':saldo' => $saldo,
                            ':tid' => $tid,
                            ':sk' => $seasonKey,
                            ':nome' => $r['name'],
                        ]);
                    } catch (\PDOException $e) {
                        $errors[] = "Saldo update failed for {$r['name']}: " . $e->getMessage();
                        error_log("[OutSeason] Saldo update failed for {$r['name']}: " . $e->getMessage());
                    }
                }
            }
        }

        Response::success(['saved' => $saved, 'season_key' => $seasonKey, 'errors' => $errors]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * getVerification
     * GET /api?module=outseason&action=getVerification&season_key=2026
     * ───────────────────────────────────────────────────────────────────── */
    public function getVerification(): void
    {
        Auth::requireRead('outseason');

        $seasonKey = trim((string)filter_input(INPUT_GET, 'season_key', FILTER_DEFAULT));

        if (empty($seasonKey)) {
            Response::error('Parametro season_key mancante.', 400);
        }

        $pdo = Database::getInstance();
        $tid = TenantContext::id();
        $stmt = $pdo->prepare(
            'SELECT entry_name, found, confidence, transaction_date,
                    transaction_amount, transaction_description, notes, verified_at
             FROM outseason_verifications
             WHERE season_key = :season_key AND tenant_id = :tid
             ORDER BY entry_name'
        );
        $stmt->execute([':season_key' => $seasonKey, ':tid' => $tid]);
        $rows = $stmt->fetchAll();

        Response::success(['season_key' => $seasonKey, 'results' => $rows]);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth — used by standalone registration form)
    // ══════════════════════════════════════════════════════════════════════════════

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

    private static function priceFull(): int  { return (int)(($_ENV['OUTSEASON_PRICE_FULL'] ?? getenv('OUTSEASON_PRICE_FULL')) ?: 650); }
    private static function pricePartial(): int { return (int)(($_ENV['OUTSEASON_PRICE_PARTIAL'] ?? getenv('OUTSEASON_PRICE_PARTIAL')) ?: 400); }

    /* publicStatus — GET registration counts per week + per role */
    public function publicStatus(): void
    {
        self::setCorsPublic();
        header('Cache-Control: no-cache, no-store, must-revalidate');
        $pdo = Database::getInstance();
        $sk = self::seasonKey();

        // Normalize legacy Cognito role names → canonical names
        $roleMap = [
            'Alzatrice'      => 'Palleggiatrice',
            'Palleggiatrice' => 'Palleggiatrice',
            'Opposto'        => 'Opposta',
            'Opposta'        => 'Opposta',
            'Schiacciatrice' => 'Schiacciatrice',
            'Centrale'       => 'Centrale',
            'Libero'         => 'Libero',
        ];

        // Total per week
        $stmt = $pdo->prepare("SELECT settimana_scelta AS week, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') GROUP BY settimana_scelta");
        $stmt->execute([':sk' => $sk]);
        $totals = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Per week + ruolo breakdown (with normalization)
        $stmt2 = $pdo->prepare("SELECT settimana_scelta AS week, ruolo AS role, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') GROUP BY settimana_scelta, ruolo");
        $stmt2->execute([':sk' => $sk]);
        $byRole = [];
        foreach ($stmt2->fetchAll(\PDO::FETCH_ASSOC) as $r) {
            $canonical = $roleMap[$r['role']] ?? $r['role'];
            $byRole[$r['week']][$canonical] = ($byRole[$r['week']][$canonical] ?? 0) + (int)$r['count'];
        }

        // Foresteria: count Full Master entries per week (max 12 beds per week)
        $stmtForesteria = $pdo->prepare("SELECT settimana_scelta AS week, COUNT(*) AS count FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' GROUP BY settimana_scelta");
        $stmtForesteria->execute([':sk' => $sk]);
        $foresteriaCounts = [];
        foreach ($stmtForesteria->fetchAll(\PDO::FETCH_ASSOC) as $fc) {
            $foresteriaCounts[$fc['week']] = (int)$fc['count'];
        }

        // Quota per role
        $quotas = [
            'Palleggiatrice' => 4,
            'Opposta'        => 4,
            'Schiacciatrice' => 8,
            'Centrale'       => 8,
            'Libero'         => 4,
        ];

        Response::success([
            'counts' => $totals,
            'by_role' => $byRole,
            'quotas'  => $quotas,
            'foresteria_quota' => 12,
            'foresteria_counts' => $foresteriaCounts,
        ]);
    }

    /* validateDiscount — POST validate a discount code */
    public function validateDiscount(): void
    {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        $code = strtoupper(trim((string)($body['code'] ?? '')));
        if (empty($code)) { Response::error('Codice sconto mancante.', 400); }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("SELECT id, discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:code AND season_key=:sk AND is_active=1");
        $stmt->execute([':code' => $code, ':sk' => self::seasonKey()]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) { Response::error('Codice sconto non valido.', 404); }
        if ($row['max_uses'] !== null && (int)$row['current_uses'] >= (int)$row['max_uses']) {
            Response::error('Codice sconto esaurito.', 410);
        }
        Response::success(['discount_percent' => (float)$row['discount_percent']]);
    }

    /* publicRegister — POST save entry + create PayPal order (or bonifico) */
    public function publicRegister(): void
    {
        try {
        self::setCorsPublic();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { Response::error('Dati non validi.', 400); }

        // Validation
        $required = ['nome_e_cognome','email','cellulare','codice_fiscale','data_di_nascita','indirizzo','cap','citta','provincia','ruolo','taglia_kit','settimana_scelta','formula_scelta','come_vuoi_pagare'];
        foreach ($required as $f) {
            if (empty(trim((string)($data[$f] ?? '')))) { Response::error("Il campo {$f} è obbligatorio.", 400); }
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) { Response::error('Email non valida.', 400); }
        // Date validation: must be valid YYYY-MM-DD with year between 1920-2025
        $dob = trim((string)$data['data_di_nascita']);
        $dobDate = \DateTime::createFromFormat('Y-m-d', $dob);
        if (!$dobDate || $dobDate->format('Y-m-d') !== $dob) {
            Response::error('Data di nascita non valida. Usa il formato GG/MM/AAAA.', 400);
        }
        $dobYear = (int)$dobDate->format('Y');
        if ($dobYear < 1920 || $dobYear > 2025) {
            Response::error('Data di nascita non valida: anno ' . $dobYear . ' fuori range.', 400);
        }
        if (empty($data['privacy_consent'])) { Response::error('Consenso privacy obbligatorio.', 400); }

        // Price calculation
        $isFullMaster = str_contains((string)$data['formula_scelta'], 'Full');
        $basePrice = $isFullMaster ? self::priceFull() : self::pricePartial();

        // Discount code lookup (outside transaction — read-only)
        $discountPct = 0.0;
        $discountCode = strtoupper(trim((string)($data['codice_sconto'] ?? '')));

        if (!empty($discountCode)) {
            $pdo2 = Database::getInstance();
            $ds = $pdo2->prepare("SELECT id, discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk AND is_active=1");
            $ds->execute([':c' => $discountCode, ':sk' => self::seasonKey()]);
            $dc = $ds->fetch(\PDO::FETCH_ASSOC);
            if ($dc && ($dc['max_uses'] === null || (int)$dc['current_uses'] < (int)$dc['max_uses'])) {
                $discountPct = (float)$dc['discount_percent'];
            }
        }
        $finalPrice = round($basePrice * (1 - $discountPct / 100), 2);
        $paymentMethod = trim((string)$data['come_vuoi_pagare']);

        // ── Atomic capacity check + INSERT (transaction with row-level lock) ──
        $pdo = Database::getInstance();
        $tid = 'TNT_fusion';
        $pdo->beginTransaction();
        try {
            // Foresteria capacity check: max 12 Full Master per week (locked read)
            if ($isFullMaster) {
                $fcStmt = $pdo->prepare("SELECT COUNT(*) FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' AND settimana_scelta=:week FOR UPDATE");
                $fcStmt->execute([':sk' => self::seasonKey(), ':week' => trim((string)$data['settimana_scelta'])]);
                $fullCount = (int)$fcStmt->fetchColumn();
                if ($fullCount >= 12) {
                    $pdo->rollBack();
                    Response::error('I posti in foresteria per questa settimana sono esauriti (massimo 12 Full Camp). Puoi scegliere la formula Daily Master oppure un\'altra settimana.', 409);
                }
            }

            // Insert entry
            $sql = "INSERT INTO outseason_entries (tenant_id, season_key, nome_e_cognome, email, cellulare, codice_fiscale, data_di_nascita, indirizzo, cap, citta, provincia, club_di_appartenenza, ruolo, taglia_kit, settimana_scelta, formula_scelta, come_vuoi_pagare, codice_sconto, entry_date, entry_status, payment_status, payment_method, synced_at) VALUES (:tid,:sk,:nome,:email,:cell,:cf,:dob,:addr,:cap,:citta,:prov,:club,:ruolo,:kit,:week,:formula,:pagare,:sconto,NOW(),'Submitted',:ps,:pm,NOW())";
            $stmt = $pdo->prepare($sql);
            $ps = ($paymentMethod === 'Bonifico Bancario') ? 'PENDING' : 'AWAITING_PAYMENT';
            $pm = ($paymentMethod === 'Bonifico Bancario') ? 'BONIFICO' : 'PAYPAL';
            $stmt->execute([
                ':tid'=>$tid, ':sk'=>self::seasonKey(), ':nome'=>trim($data['nome_e_cognome']),
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

        // Increment discount code usage
        if (!empty($discountCode) && $discountPct > 0) {
            $pdo->prepare("UPDATE outseason_discount_codes SET current_uses=current_uses+1 WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk")->execute([':c'=>$discountCode,':sk'=>self::seasonKey()]);
        }

        // Bonifico: no PayPal, send info email
        if ($paymentMethod === 'Bonifico Bancario') {
            $this->sendBonificoEmail($data, $finalPrice, $entryId);
            Response::success(['entry_id'=>$entryId, 'payment_method'=>'BONIFICO', 'amount'=>$finalPrice]);
            return;
        }

        // Cleanup stale AWAITING_PAYMENT entries (older than 2 hours)
        $pdo->prepare("DELETE FROM outseason_entries WHERE tenant_id='TNT_fusion' AND payment_status='AWAITING_PAYMENT' AND entry_date < DATE_SUB(NOW(), INTERVAL 2 HOUR)")->execute();

        // PayPal: create order with redirect flow
        $paypal = new PayPalService();
        $baseUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
        $returnUrl = $baseUrl . '/outseason/paypal-return.html?entry_id=' . $entryId;
        $cancelUrl = $baseUrl . '/outseason/index.html?cancelled=1';
        $order = $paypal->createOrder(
            $finalPrice,
            "OutSeason " . self::seasonKey() . " — " . trim($data['nome_e_cognome']),
            ['entry_id'=>$entryId, 'season'=>self::seasonKey()],
            $returnUrl,
            $cancelUrl
        );
        $pdo->prepare("UPDATE outseason_entries SET paypal_order_id=:oid WHERE id=:id")->execute([':oid'=>$order['id'], ':id'=>$entryId]);

        // Extract the PayPal approval URL for redirect
        $approveUrl = '';
        foreach ($order['links'] ?? [] as $link) {
            if (($link['rel'] ?? '') === 'approve') {
                $approveUrl = $link['href'];
                break;
            }
        }

        Response::success([
            'entry_id'=>$entryId, 'paypal_order_id'=>$order['id'],
            'paypal_client_id'=>$paypal->getClientId(), 'amount'=>$finalPrice,
            'approve_url'=>$approveUrl,
        ]);
        } catch (\Throwable $e) {
            Response::error('Errore: ' . $e->getMessage(), 500);
        }
    }

    /* capturePayment — POST capture PayPal payment after buyer approval */
    public function capturePayment(): void
    {
        try {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        $orderId = trim((string)($body['paypal_order_id'] ?? ''));
        $entryId = (int)($body['entry_id'] ?? 0);
        if (empty($orderId) || $entryId < 1) { Response::error('Parametri mancanti.', 400); }

        $pdo = Database::getInstance();
        $check = $pdo->prepare("SELECT * FROM outseason_entries WHERE id=:id AND tenant_id='TNT_fusion'");
        $check->execute([':id'=>$entryId]);
        $entry = $check->fetch(\PDO::FETCH_ASSOC);
        if (!$entry) { Response::error('Iscrizione non trovata.', 404); }
        if ($entry['paypal_order_id'] !== $orderId) { Response::error('Order ID non corrispondente.', 403); }
        if ($entry['payment_status'] === 'PAID') { Response::success(['already_paid'=>true]); return; }

        $paypal = new PayPalService();
        $capture = $paypal->captureOrder($orderId);

        if (($capture['status'] ?? '') !== 'COMPLETED') {
            $pdo->prepare("UPDATE outseason_entries SET payment_status='FAILED' WHERE id=:id")->execute([':id'=>$entryId]);
            Response::error('Pagamento non completato. Status: ' . ($capture['status'] ?? 'unknown'), 422);
        }

        $captureId = $capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
        $payerEmail = $capture['payer']['email_address'] ?? null;
        $paymentSource = array_key_first($capture['payment_source'] ?? []) ?? 'paypal';

        $pdo->prepare("UPDATE outseason_entries SET payment_status='PAID', paypal_capture_id=:cid, payment_method=:pm, paid_at=NOW() WHERE id=:id")
            ->execute([':cid'=>$captureId, ':pm'=>strtoupper($paymentSource), ':id'=>$entryId]);

        // Send confirmation email
        $this->sendConfirmationEmail($entry, $captureId, $payerEmail);

        Response::success(['paid'=>true, 'capture_id'=>$captureId, 'payment_source'=>$paymentSource]);
        } catch (\Throwable $e) {
            Response::error('Errore cattura pagamento: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Stripe: Create PaymentIntent ─────────────────────────────────────── */
    public function createStripeIntent(): void
    {
        try {
        self::setCorsPublic();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { Response::error('Dati non validi.', 400); }

        // Reuse same validation & pricing logic from publicRegister
        $requiredFields = ['nome_e_cognome','email','cellulare','codice_fiscale','data_di_nascita','settimana_scelta','formula_scelta','come_vuoi_pagare'];
        foreach ($requiredFields as $f) {
            if (empty(trim((string)($data[$f] ?? '')))) {
                Response::error("Campo obbligatorio mancante: {$f}", 422);
            }
        }

        // Price calculation
        $formula = trim((string)$data['formula_scelta']);
        $isFullMaster = (stripos($formula, 'Full') !== false);
        $basePrice = $isFullMaster
            ? (float)(getenv('OUTSEASON_PRICE_FULL') ?: 650)
            : (float)(getenv('OUTSEASON_PRICE_PARTIAL') ?: 400);

        $discountCode = strtoupper(trim((string)($data['codice_sconto'] ?? '')));
        $discountPct = 0;
        if (!empty($discountCode)) {
            $pdo = Database::getInstance();
            $ds = $pdo->prepare("SELECT discount_percent, max_uses, current_uses FROM outseason_discount_codes WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk AND is_active=1");
            $ds->execute([':c'=>$discountCode, ':sk'=>self::seasonKey()]);
            $dc = $ds->fetch(\PDO::FETCH_ASSOC);
            if ($dc && ($dc['max_uses'] === null || $dc['current_uses'] < $dc['max_uses'])) {
                $discountPct = (float)$dc['discount_percent'];
            }
        }
        $finalPrice = round($basePrice * (1 - $discountPct / 100), 2);

        // Insert entry as AWAITING_PAYMENT
        $pdo = Database::getInstance();
        $tid = 'TNT_fusion';
        $pdo->beginTransaction();
        try {
            if ($isFullMaster) {
                $fcStmt = $pdo->prepare("SELECT COUNT(*) FROM outseason_entries WHERE tenant_id='TNT_fusion' AND season_key=:sk AND is_deleted=0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED') AND formula_scelta LIKE '%Full%' AND settimana_scelta=:week FOR UPDATE");
                $fcStmt->execute([':sk' => self::seasonKey(), ':week' => trim((string)$data['settimana_scelta'])]);
                if ((int)$fcStmt->fetchColumn() >= 12) {
                    $pdo->rollBack();
                    Response::error('Posti in foresteria esauriti per questa settimana.', 409);
                }
            }

            $sql = "INSERT INTO outseason_entries (tenant_id, season_key, nome_e_cognome, email, cellulare, codice_fiscale, data_di_nascita, indirizzo, cap, citta, provincia, club_di_appartenenza, ruolo, taglia_kit, settimana_scelta, formula_scelta, come_vuoi_pagare, codice_sconto, entry_date, entry_status, payment_status, payment_method, synced_at) VALUES (:tid,:sk,:nome,:email,:cell,:cf,:dob,:addr,:cap,:citta,:prov,:club,:ruolo,:kit,:week,:formula,:pagare,:sconto,NOW(),'Submitted','AWAITING_PAYMENT','STRIPE',NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':tid'=>$tid, ':sk'=>self::seasonKey(), ':nome'=>trim($data['nome_e_cognome']),
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

        // Increment discount code usage
        if (!empty($discountCode) && $discountPct > 0) {
            $pdo->prepare("UPDATE outseason_discount_codes SET current_uses=current_uses+1 WHERE tenant_id='TNT_fusion' AND code=:c AND season_key=:sk")->execute([':c'=>$discountCode,':sk'=>self::seasonKey()]);
        }

        // Cleanup stale AWAITING_PAYMENT entries
        $pdo->prepare("DELETE FROM outseason_entries WHERE tenant_id='TNT_fusion' AND payment_status='AWAITING_PAYMENT' AND entry_date < DATE_SUB(NOW(), INTERVAL 2 HOUR)")->execute();

        // Create Stripe PaymentIntent
        $stripe = new StripeService();
        $intent = $stripe->createPaymentIntent(
            $finalPrice,
            "OutSeason " . self::seasonKey() . " — " . trim($data['nome_e_cognome']),
            ['entry_id' => $entryId, 'season' => self::seasonKey()]
        );

        // Save Stripe PaymentIntent ID
        $pdo->prepare("UPDATE outseason_entries SET paypal_order_id=:pid WHERE id=:id")
            ->execute([':pid' => $intent['id'], ':id' => $entryId]);

        Response::success([
            'entry_id'      => $entryId,
            'client_secret' => $intent['client_secret'],
            'stripe_pk'     => $stripe->getPublishableKey(),
            'amount'        => $finalPrice,
        ]);
        } catch (\Throwable $e) {
            Response::error('Errore: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Stripe: Confirm Payment ──────────────────────────────────────── */
    public function confirmStripePayment(): void
    {
        try {
        self::setCorsPublic();
        $body = json_decode(file_get_contents('php://input'), true);
        $intentId = trim((string)($body['payment_intent_id'] ?? ''));
        $entryId = (int)($body['entry_id'] ?? 0);
        if (empty($intentId) || $entryId < 1) { Response::error('Parametri mancanti.', 400); }

        $pdo = Database::getInstance();
        $check = $pdo->prepare("SELECT * FROM outseason_entries WHERE id=:id AND tenant_id='TNT_fusion'");
        $check->execute([':id'=>$entryId]);
        $entry = $check->fetch(\PDO::FETCH_ASSOC);
        if (!$entry) { Response::error('Iscrizione non trovata.', 404); }
        if ($entry['payment_status'] === 'PAID') { Response::success(['already_paid'=>true]); return; }

        // Verify with Stripe API
        $stripe = new StripeService();
        $intent = $stripe->getPaymentIntent($intentId);

        if (($intent['status'] ?? '') !== 'succeeded') {
            $pdo->prepare("UPDATE outseason_entries SET payment_status='FAILED' WHERE id=:id")->execute([':id'=>$entryId]);
            Response::error('Pagamento non completato. Status: ' . ($intent['status'] ?? 'unknown'), 422);
        }

        $chargeId = $intent['latest_charge'] ?? null;
        $paymentMethod = $intent['payment_method_types'][0] ?? 'card';

        $pdo->prepare("UPDATE outseason_entries SET payment_status='PAID', paypal_capture_id=:cid, payment_method=:pm, paid_at=NOW() WHERE id=:id")
            ->execute([':cid'=>$chargeId, ':pm'=>'STRIPE_' . strtoupper($paymentMethod), ':id'=>$entryId]);

        // Send confirmation email
        $this->sendConfirmationEmail($entry, $chargeId, $entry['email']);

        Response::success(['paid'=>true, 'charge_id'=>$chargeId, 'payment_method'=>$paymentMethod]);
        } catch (\Throwable $e) {
            Response::error('Errore conferma pagamento Stripe: ' . $e->getMessage(), 500);
        }
    }

    /* ─── Email helpers ───────────────────────────────────────────────── */

    private const EMAIL_SENDER_NAME = 'FTV Out Season';
    private const LOGO_URL = 'https://www.fusionteamvolley.it/ERP/outseason/logo-outseason.png';

    private function sendConfirmationEmail(array $entry, ?string $captureId, ?string $payerEmail): void
    {
        $nome = htmlspecialchars(trim($entry['nome_e_cognome'] ?? ''));
        $email = trim($entry['email'] ?? '');
        $html = $this->buildOutSeasonEmail($entry, $captureId, 'PayPal/Carta');
        Mailer::send(
            $email, $nome,
            'Conferma Iscrizione OutSeason ' . self::seasonKey() . ' — Fusion Team Volley',
            $html, '', null, self::EMAIL_SENDER_NAME
        );
    }

    private function sendBonificoEmail(array $data, float $amount, int $entryId): void
    {
        $nome = htmlspecialchars(trim($data['nome_e_cognome'] ?? ''));
        $email = trim($data['email'] ?? '');
        $data['_finalPrice'] = $amount;
        $html = $this->buildOutSeasonEmail($data, "BON-{$entryId}", 'Bonifico Bancario');
        Mailer::send(
            $email, $nome,
            'Iscrizione OutSeason ' . self::seasonKey() . ' — Istruzioni Bonifico',
            $html, '', null, self::EMAIL_SENDER_NAME
        );
    }

    private function buildOutSeasonEmail(array $entry, ?string $txId, string $metodo): string
    {
        $isBonifico = ($metodo === 'Bonifico Bancario');
        $seasonKey  = self::seasonKey();
        $logoUrl    = self::LOGO_URL;

        // Sanitize all fields
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

        // Format date
        if (!empty($dob) && strtotime($dob) !== false) {
            $dob = date('d/m/Y', strtotime($dob));
        }

        // Address line
        $addressLine = $indirizzo;
        if ($cap || $citta || $provincia) {
            $addressLine .= ' — ' . implode(' ', array_filter([$cap, $citta, $provincia ? "({$provincia})" : '']));
        }

        // Status badge
        $statusBadge = $isBonifico
            ? '<td style="padding:12px 24px;background:#f39c12;border-radius:6px;text-align:center;"><span style="color:#ffffff;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">⏳ In Attesa Bonifico</span></td>'
            : '<td style="padding:12px 24px;background:#27ae60;border-radius:6px;text-align:center;"><span style="color:#ffffff;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">✓ Pagamento Confermato</span></td>';

        // Price info
        $isFullMaster = str_contains($formula, 'Full');
        $basePrice = $isFullMaster ? self::priceFull() : self::pricePartial();
        $finalPrice = $entry['_finalPrice'] ?? $basePrice;
        $priceFormatted = '€' . number_format((float)$finalPrice, 2, ',', '.');

        // Discount row
        $scontoRow = '';
        if (!empty($sconto)) {
            $scontoRow = '<tr><td style="padding:10px 20px;border-bottom:1px solid #f0f0f0;font-family:Roboto,Arial,sans-serif;font-size:13px;color:#999;">Codice Sconto</td><td style="padding:10px 20px;border-bottom:1px solid #f0f0f0;font-family:Roboto,Arial,sans-serif;font-size:13px;font-weight:600;color:#27ae60;">' . $sconto . '</td></tr>';
        }

        // Bonifico instructions block
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

<!-- Bonifico Info (if applicable) -->
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

    /* ─────────────────────────────────────────────────────────────────────
     * repairTruncatedJson — try to repair a truncated JSON string
     * ───────────────────────────────────────────────────────────────────── */
    private static function repairTruncatedJson(string $json): string
    {
        $lastCompleteObj = strrpos($json, '}');
        if ($lastCompleteObj === false) {
            return $json;
        }
        $truncated = substr($json, 0, $lastCompleteObj + 1);
        $openBraces = substr_count($truncated, '{') - substr_count($truncated, '}');
        $openBrackets = substr_count($truncated, '[') - substr_count($truncated, ']');
        $truncated .= str_repeat(']', max(0, $openBrackets));
        $truncated .= str_repeat('}', max(0, $openBraces));
        return $truncated;
    }
}