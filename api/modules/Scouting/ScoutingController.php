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

    public function listDatabase(): void
    {
        Auth::requireRole('allenatore');

        $stmt = $this->db->prepare("
            SELECT * FROM scouting_athletes
            ORDER BY created_at DESC
        ");
        $stmt->execute();
        $athletes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success($athletes);
    }

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

    public function webhookCognito(): void
    {
        // Public endpoint for incoming webhooks
        $rawPayload = file_get_contents('php://input');
        $data = json_decode($rawPayload, true);

        if (!$data) {
            http_response_code(400);
            exit;
        }

        // Determine source based on form name or payload structure. 
        // We will fallback to a generic 'cognito' if not identifiable.
        $source = 'cognito_fusion';
        if (isset($data['Form']['Name']) && stripos($data['Form']['Name'], 'network') !== false) {
            $source = 'cognito_network';
        }

        // Map Cognito fields based on standard names or likely names
        $nome = $data['Nome'] ?? $data['Name']['First'] ?? 'Sconosciuto';
        $cognome = $data['Cognome'] ?? $data['Name']['Last'] ?? 'Sconosciuto';
        $societa = $data['Societa'] ?? $data['SocietaDiAppartenenza'] ?? null;
        $anno = $data['AnnoDiNascita'] ?? $data['Anno'] ?? null;
        $note = $data['Note'] ?? null;
        $rilevatore = $data['Rilevatore'] ?? 'Cognito Form';
        $dataRil = date('Y-m-d');

        $stmt = $this->db->prepare("
            INSERT INTO scouting_athletes (nome, cognome, societa_appartenenza, anno_nascita, note, rilevatore, data_rilevazione, source)
            VALUES (:nome, :cognome, :societa, :anno, :note, :rilevatore, :data_ril, :source)
        ");

        $stmt->execute([
            ':nome' => $nome,
            ':cognome' => $cognome,
            ':societa' => $societa,
            ':anno' => $anno ? (int)$anno : null,
            ':note' => $note,
            ':rilevatore' => $rilevatore,
            ':data_ril' => $dataRil,
            ':source' => $source
        ]);

        // Cognito expects a 200 OK response
        http_response_code(200);
        echo json_encode(['status' => 'received']);
        exit;
    }
}
