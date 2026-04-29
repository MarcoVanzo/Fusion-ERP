<?php
declare(strict_types=1);

namespace FusionERP\Modules\OutSeason\Services;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\AIService;

class OutSeasonPaymentService
{
    public static function verifyPayments(array $file, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new \Exception('File non caricato o errore upload', 400);
        }

        if ($file['size'] > 10 * 1024 * 1024) {
            throw new \Exception('File troppo grande. Massimo 10 MB.', 413);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if ($mimeType !== 'application/pdf') {
            throw new \Exception('Solo file PDF accettati.', 415);
        }

        $pdo = Database::getInstance();
        $tid = TenantContext::id();
        $stmt = $pdo->prepare(
            "SELECT nome_e_cognome, formula_scelta, order_summary, codice_sconto
             FROM outseason_entries
             WHERE season_key = :sk AND tenant_id = :tid AND come_vuoi_pagare = 'Bonifico Bancario'
               AND is_deleted = 0 AND payment_status NOT IN ('AWAITING_PAYMENT','FAILED')
             ORDER BY nome_e_cognome"
        );
        $stmt->execute([':sk' => $seasonKey, ':tid' => $tid]);
        $bonificoEntries = $stmt->fetchAll();

        if (empty($bonificoEntries)) {
            throw new \Exception('Nessuna iscritta con bonifico trovata nel DB. Esegui prima la sincronizzazione.', 422);
        }

        $entriesText = '';
        $bonificoList = [];
        foreach ($bonificoEntries as $i => $entry) {
            $amount = str_contains((string)$entry['formula_scelta'], 'Full') ? $priceFull : $pricePartial;
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
            throw new \Exception('Errore di connessione a Gemini AI: ' . $e->getMessage(), 502);
        }

        if (empty($rawText)) {
            throw new \Exception('Gemini non ha restituito risultati. Riprovare.', 422);
        }

        $parsed = AIService::extractJson($rawText);

        if (!is_array($parsed)) {
            $repaired = self::repairTruncatedJson($rawText);
            $parsed = AIService::extractJson($repaired) ?? json_decode($repaired, true);
        }

        if (!is_array($parsed)) {
            return [
                'parsed' => false,
                'raw_response' => mb_substr($rawText, 0, 2000),
                'message' => 'L\'AI ha risposto ma il formato JSON era troncato o non valido. Riprovare.',
            ];
        }

        $results = $parsed['results'] ?? $parsed;
        if (!is_array($results) || empty($results)) {
            return [
                'parsed' => false,
                'raw_response' => mb_substr($rawText, 0, 2000),
                'message' => 'Nessun risultato trovato nella risposta AI.',
            ];
        }

        return [
            'parsed' => true,
            'results' => $results,
            'summary' => $parsed['summary'] ?? [
                'total_checked' => count($results),
                'found' => count(array_filter($results, fn($r) => !empty($r['found']))),
                'not_found' => count(array_filter($results, fn($r) => empty($r['found']))),
            ],
            'extra_transactions' => $parsed['extra_transactions'] ?? [],
            'bonifico_entries' => $bonificoList,
        ];
    }

    public static function saveVerification(array $body, array $user, string $seasonKey, int $priceFull, int $pricePartial): array
    {
        $results = $body['results'] ?? [];

        if (empty($seasonKey) || !is_array($results) || empty($results)) {
            throw new \Exception('Parametri mancanti: season_key e results richiesti.', 400);
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
            if (empty($r['name'])) continue;
            
            $conf = strtolower(trim((string)($r['confidence'] ?? '')));
            if (!in_array($conf, ['high', 'medium', 'low'])) {
                if ($conf === 'alta' || $conf === 'alto') $conf = 'high';
                elseif ($conf === 'media' || $conf === 'medio') $conf = 'medium';
                elseif ($conf === 'bassa' || $conf === 'basso') $conf = 'low';
                else $conf = 'low';
            }
            
            $r_found = !empty($r['found']) ? 1 : 0;
            $r_tx_date = isset($r['transaction_date']) ? mb_substr(trim((string)$r['transaction_date']), 0, 20) : null;
            if ($r_tx_date === 'null' || $r_tx_date === '') { $r_tx_date = null; }
            $r_tx_AMOUNT = isset($r['transaction_amount']) ? (float)$r['transaction_amount'] : null;
            $r_tx_desc = isset($r['transaction_description']) ? trim((string)$r['transaction_description']) : null;
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
                $errors[] = "Failed on {$r['name']}: " . $e->getMessage();
                error_log("[OutSeason] Failed to save verification row for {$r['name']}: " . $e->getMessage());
            }
        }

        $saldoStmt = $pdo->prepare(
            'UPDATE outseason_entries SET saldo = :saldo
             WHERE tenant_id = :tid AND season_key = :sk AND LOWER(TRIM(nome_e_cognome)) = LOWER(TRIM(:nome)) AND is_deleted = 0'
        );

        foreach ($results as $r) {
            if (empty($r['name'])) continue;
            $rFound = !empty($r['found']) ? true : false;
            $txAmount = isset($r['transaction_amount']) ? (float)$r['transaction_amount'] : null;

            if ($rFound && $txAmount !== null && $txAmount > 0) {
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

        return ['saved' => $saved, 'season_key' => $seasonKey, 'errors' => $errors];
    }

    public static function getVerification(string $seasonKey): array
    {
        if (empty($seasonKey)) {
            throw new \Exception('Parametro season_key mancante.', 400);
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
        return $stmt->fetchAll();
    }

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
