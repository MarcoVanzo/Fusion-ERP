<?php
namespace FusionERP\Modules\Scouting;

use PDO;
use Exception;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\Database;

class ScoutingController
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Config — Cognito Form IDs from .env (Bypass Dotenv caching)
     * ───────────────────────────────────────────────────────────────────── */
    private static function getEnvVar(string $key): ?string
    {
        // Force manual generic parse of .env to bypass ANY caching (Dotenv immutability, OPcache, etc.)
        // __DIR__ is api/Modules/Scouting -> level 3 is root
        $envFile = dirname(__DIR__, 3) . '/.env';
        if (!file_exists($envFile)) {
            error_log("ScoutingController getEnvVar: Missing .env at: $envFile");
            return null;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $foundKeys = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $foundKeys[] = trim($parts[0]);
                if (trim($parts[0]) === $key) {
                    return trim($parts[1]);
                }
            }
        }
        error_log("ScoutingController getEnvVar: Key '$key' not found in " . count($foundKeys) . " parsed keys.");
        return null;
    }

    private static function fusionFormId(): int
    {
        return (int)(self::getEnvVar('SCOUTING_FUSION_FORM_ID') ?: 0);
    }

    private static function fusionViewId(): int
    {
        return (int)(self::getEnvVar('SCOUTING_FUSION_VIEW_ID') ?: 1);
    }

    private static function networkFormId(): int
    {
        return (int)(self::getEnvVar('SCOUTING_NETWORK_FORM_ID') ?: 0);
    }

    private static function networkViewId(): int
    {
        return (int)(self::getEnvVar('SCOUTING_NETWORK_VIEW_ID') ?: 1);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * listDatabase — GET entries from local DB
     * GET /api?module=scouting&action=listDatabase
     * ───────────────────────────────────────────────────────────────────── */
    public function listDatabase(): void
    {
        Auth::requireRole('allenatore');

        $stmt = $this->db->prepare("
            SELECT * FROM scouting_athletes
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $athletes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Last sync time
        $syncStmt = $this->db->query("SELECT MAX(synced_at) FROM scouting_athletes WHERE cognito_id IS NOT NULL");
        $lastSync = $syncStmt->fetchColumn();

        Response::success([
            'entries' => $athletes,
            'last_sync' => $lastSync,
            'count' => count($athletes),
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * addManualEntry — POST manual record
     * POST /api?module=scouting&action=addManualEntry
     * ───────────────────────────────────────────────────────────────────── */
    public function addManualEntry(): void
    {
        Auth::requireRole('allenatore');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['nome']) || empty($data['cognome'])) {
            Response::error('Nome e cognome obbligatori', 400);
        }

        $stmt = $this->db->prepare("
            INSERT INTO scouting_athletes (nome, cognome, societa_appartenenza, anno_nascita, note, rilevatore, data_rilevazione, source)
            VALUES (:nome, :cognome, :societa, :anno, :note, :rilevatore, :data_ril, 'manual')
        ");
        
        $stmt->execute([
            ':nome' => $data['nome'] ?? '',
            ':cognome' => $data['cognome'] ?? '',
            ':societa' => $data['societa_appartenenza'] ?? null,
            ':anno' => !empty($data['anno_nascita']) ? (int)$data['anno_nascita'] : null,
            ':note' => $data['note'] ?? null,
            ':rilevatore' => $data['rilevatore'] ?? null,
            ':data_ril' => $data['data_rilevazione'] ?? date('Y-m-d')
        ]);

        Response::success(['success' => true, 'id' => $this->db->lastInsertId()]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * syncFromCognito — Manual sync trigger via API
     * POST /api?module=scouting&action=syncFromCognito
     * ───────────────────────────────────────────────────────────────────── */
    public function syncFromCognito(): void
    {
        Auth::requireRole('allenatore');

        $result = self::_doSync();

        if (!$result['success']) {
            Response::error($result['error'], 502);
        }

        Response::success([
            'fusion_upserted' => $result['fusion_upserted'],
            'network_upserted' => $result['network_upserted'],
            'total' => $result['fusion_upserted'] + $result['network_upserted'],
            'synced_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * _doSync — shared sync logic (used by API + cron)
     * ───────────────────────────────────────────────────────────────────── */
    public static function _doSync(): array
    {
        $fusionFormId = self::fusionFormId();
        $networkFormId = self::networkFormId();

        if ($fusionFormId === 0 && $networkFormId === 0) {
            return ['success' => false, 'error' => 'Nessun Form ID configurato. Impostare SCOUTING_FUSION_FORM_ID e/o SCOUTING_NETWORK_FORM_ID in .env'];
        }

        $fusionUpserted = 0;
        $networkUpserted = 0;
        $errors = [];

        // Sync Fusion form (uses its own API key)
        if ($fusionFormId > 0) {
            $fusionKey = self::getEnvVar('SCOUTING_FUSION_API_KEY') ?: self::getEnvVar('COGNITO_API_KEY');
            if (empty($fusionKey)) {
                $errors[] = 'Fusion: SCOUTING_FUSION_API_KEY non configurata.';
            } else {
                $result = self::_syncForm($fusionKey, $fusionFormId, self::fusionViewId(), 'cognito_fusion');
                if ($result['success']) {
                    $fusionUpserted = $result['upserted'];
                } else {
                    $errors[] = "Fusion: " . $result['error'];
                }
            }
        }

        // Sync Network form (uses its own API key)
        if ($networkFormId > 0) {
            $networkKey = self::getEnvVar('SCOUTING_NETWORK_API_KEY') ?: self::getEnvVar('COGNITO_API_KEY');
            if (empty($networkKey)) {
                $errors[] = 'Network: SCOUTING_NETWORK_API_KEY non configurata.';
            } else {
                $result = self::_syncForm($networkKey, $networkFormId, self::networkViewId(), 'cognito_network');
                if ($result['success']) {
                    $networkUpserted = $result['upserted'];
                } else {
                    $errors[] = "Network: " . $result['error'];
                }
            }
        }

        if (!empty($errors) && $fusionUpserted === 0 && $networkUpserted === 0) {
            return ['success' => false, 'error' => implode(' | ', $errors)];
        }

        return [
            'success' => true,
            'fusion_upserted' => $fusionUpserted,
            'network_upserted' => $networkUpserted,
            'warnings' => $errors,
        ];
    }

    /* ─────────────────────────────────────────────────────────────────────
     * _syncForm — fetch entries from a single Cognito form and upsert
     * ───────────────────────────────────────────────────────────────────── */
    private static function _syncForm(string $apiKey, int $formId, int $viewId, string $source): array
    {
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
        curl_close($ch);

        if ($response === false || !empty($curlError)) {
            return ['success' => false, 'error' => 'Errore cURL Cognito: ' . $curlError];
        }

        if ($httpCode !== 200) {
            error_log('[Scouting Sync] Cognito API HTTP ' . $httpCode . ' for form ' . $formId . ': ' . $response);
            $errorMsg = 'Cognito API ha risposto HTTP ' . $httpCode;
            if ($httpCode === 401) {
                $errorMsg = 'Token Cognito scaduto o non valido (HTTP 401). '
                    . 'Rinnova il token su cognitoforms.com → Account → API Keys '
                    . 'e aggiorna COGNITO_API_KEY nel file .env.';
            } elseif ($httpCode === 404) {
                $errorMsg = 'Form ' . $formId . ' / View ' . $viewId . ' non trovato (HTTP 404).';
            }
            return ['success' => false, 'error' => $errorMsg];
        }

        $decoded = json_decode((string)$response, true);
        $entries = $decoded['value'] ?? ($decoded ?: []);

        if (!is_array($entries) || empty($entries)) {
            return ['success' => true, 'upserted' => 0]; // No entries is not an error
        }

        $pdo = Database::getInstance();

        $sql = "
            INSERT INTO scouting_athletes
                (cognito_id, cognito_form, nome, cognome, societa_appartenenza, anno_nascita,
                 note, rilevatore, data_rilevazione, source, synced_at)
            VALUES
                (:cog_id, :cog_form, :nome, :cognome, :societa, :anno,
                 :note, :rilevatore, :data_ril, :source, NOW())
            ON DUPLICATE KEY UPDATE
                nome                  = VALUES(nome),
                cognome               = VALUES(cognome),
                societa_appartenenza  = VALUES(societa_appartenenza),
                anno_nascita          = VALUES(anno_nascita),
                note                  = VALUES(note),
                rilevatore            = VALUES(rilevatore),
                data_rilevazione      = VALUES(data_rilevazione),
                synced_at             = NOW()
        ";

        $stmt = $pdo->prepare($sql);
        $upserted = 0;

        foreach ($entries as $e) {
            // Map Cognito fields — support multiple naming conventions
            $nome = $e['Nome'] ?? $e['Name']['First'] ?? $e['nome'] ?? 'Sconosciuto';
            $cognome = $e['Cognome'] ?? $e['Name']['Last'] ?? $e['cognome'] ?? 'Sconosciuto';
            $societa = $e['Societa'] ?? $e['SocietaDiAppartenenza'] ?? $e['societa_appartenenza'] ?? null;
            $anno = $e['AnnoDiNascita'] ?? $e['Anno'] ?? $e['anno_nascita'] ?? null;
            $note = $e['Note'] ?? $e['note'] ?? null;
            $rilevatore = $e['Rilevatore'] ?? $e['rilevatore'] ?? 'Cognito Form';

            // Date: use the entry submission date from Cognito
            $rawDate = $e['Entry_DateSubmitted'] ?? $e['Entry.DateSubmitted'] ?? null;
            $dataRil = !empty($rawDate) ? date('Y-m-d', (int)strtotime((string)$rawDate)) : date('Y-m-d');

            $stmt->execute([
                ':cog_id' => (int)$e['Id'],
                ':cog_form' => $source,
                ':nome' => (string)$nome,
                ':cognome' => (string)$cognome,
                ':societa' => $societa,
                ':anno' => $anno ? (int)$anno : null,
                ':note' => $note,
                ':rilevatore' => (string)$rilevatore,
                ':data_ril' => $dataRil,
                ':source' => $source,
            ]);
            $upserted++;
        }

        return ['success' => true, 'upserted' => $upserted];
    }
}
