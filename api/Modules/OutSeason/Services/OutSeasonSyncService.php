<?php
declare(strict_types=1);

namespace FusionERP\Modules\OutSeason\Services;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class OutSeasonSyncService
{
    public static function sync(string $seasonKey, int $formId, int $viewId): array
    {
        $apiKey = $_ENV['COGNITO_API_KEY'] ?? getenv('COGNITO_API_KEY');
        if (empty($apiKey)) {
            return ['success' => false, 'error' => 'COGNITO_API_KEY non configurata.'];
        }

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
                $errorMsg = 'Token Cognito scaduto o non valido (HTTP 401). Rinnova il token e aggiorna COGNITO_API_KEY.';
            } elseif ($httpCode === 404) {
                $errorMsg = 'Form o View Cognito non trovato (HTTP 404). Verifica formId e viewId.';
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
                ':estatus' => $e['Entry_Status'] ?? $e['Entry.Status'] ?? null,
                ':osummary' => $e['Order_OrderSummary'] ?? $e['Order.OrderSummary'] ?? null,
            ]);
            $upserted++;
        }

        return ['success' => true, 'upserted' => $upserted];
    }
}
