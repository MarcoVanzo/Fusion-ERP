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
            "SELECT nome_e_cognome, formula_scelta, order_summary
             FROM outseason_entries
             WHERE season_key = :sk AND tenant_id = :tid AND come_vuoi_pagare = 'Bonifico Bancario'
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
        $priceFull = (int)(($_ENV['OUTSEASON_PRICE_FULL'] ?? getenv('OUTSEASON_PRICE_FULL')) ?: 250);
        $pricePartial = (int)(($_ENV['OUTSEASON_PRICE_PARTIAL'] ?? getenv('OUTSEASON_PRICE_PARTIAL')) ?: 150);

        $entriesText = '';
        $bonificoList = [];
        foreach ($bonificoEntries as $i => $entry) {
            $amount = str_contains((string)$entry['formula_scelta'], 'Full') ? $priceFull : $pricePartial;
            $n = $i + 1;
            $entriesText .= $n . '. ' . $entry['nome_e_cognome'] . ' — ' . (string)$amount . ",00 €\n";
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