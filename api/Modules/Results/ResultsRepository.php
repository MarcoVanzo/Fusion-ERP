<?php
/**
 * Results Repository
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Results;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use PDO;
use Exception;

class ResultsRepository
{
    private PDO $pdo;
    private string $tenantId;

    public function __construct()
    {
        $this->pdo = Database::getInstance();
        $this->tenantId = TenantContext::id();
    }

    public function getActiveChampionshipsWithTeamFlags(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                fc.*,
                CASE WHEN (
                    EXISTS (
                        SELECT 1 FROM federation_standings fs
                        WHERE fs.championship_id = fc.id
                          AND (
                            LOWER(fs.team) LIKE '%fusion%'
                            OR LOWER(fs.team) LIKE '%team volley%'
                            OR LOWER(fs.team) LIKE '%fusionteam%'
                          )
                    )
                    OR EXISTS (
                        SELECT 1 FROM federation_matches fm
                        WHERE fm.championship_id = fc.id
                          AND (
                            LOWER(fm.home_team) LIKE '%fusion%'
                            OR LOWER(fm.away_team) LIKE '%fusion%'
                            OR LOWER(fm.home_team) LIKE '%team volley%'
                            OR LOWER(fm.away_team) LIKE '%team volley%'
                            OR LOWER(fm.home_team) LIKE '%fusionteam%'
                            OR LOWER(fm.away_team) LIKE '%fusionteam%'
                          )
                    )
                ) THEN 1 ELSE 0 END AS has_our_team
            FROM federation_championships fc
            WHERE fc.tenant_id = :tid AND fc.is_active = 1
            ORDER BY fc.label ASC
        ");
        $stmt->execute([':tid' => $this->tenantId]);
        $campionati = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fallback: Se il tenant corrente è vuoto, prova a recuperare quelli globali/fusion
        if (empty($campionati) && $this->tenantId !== 'TNT_fusion') {
            $stmt->execute([':tid' => 'TNT_fusion']);
            $campionati = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        foreach ($campionati as &$c) {
            $c['has_our_team'] = (bool)($c['has_our_team'] ?? false);
        }
        return $campionati;
    }

    public function getMatchesByChampionship(string $campionatoId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT m.*, c.url as source_url, c.last_synced_at
            FROM federation_matches m
            JOIN federation_championships c ON m.championship_id = c.id
            WHERE c.id = :cid AND c.is_active = 1
            ORDER BY m.match_date ASC
        ");
        $stmt->execute([':cid' => $campionatoId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStandingsByChampionship(string $campionatoId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT s.*, c.last_synced_at
            FROM federation_standings s
            JOIN federation_championships c ON s.championship_id = c.id
            WHERE c.id = :cid AND c.is_active = 1
            ORDER BY s.position ASC
        ");
        $stmt->execute([':cid' => $campionatoId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getChampionshipLastSyncedAt(string $campionatoId): ?string
    {
        $stmt = $this->pdo->prepare("SELECT last_synced_at FROM federation_championships WHERE id = :cid AND is_active = 1");
        $stmt->execute([':cid' => $campionatoId]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ? $res['last_synced_at'] : null;
    }

    public function getChampionshipById(string $campionatoId): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM federation_championships WHERE id = :cid AND is_active = 1");
        $stmt->execute([':cid' => $campionatoId]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    public function deleteChampionship(string $id): int
    {
        $stmt = $this->pdo->prepare("DELETE FROM federation_championships WHERE id = :id AND tenant_id = :tid");
        $stmt->execute([':id' => $id, ':tid' => $this->tenantId]);
        return $stmt->rowCount();
    }

    public function upsertChampionship(?string $id, string $label, string $url, string $standingsUrl): string
    {
        if (!$id) {
            $id = 'fed_' . substr(md5($url . $this->tenantId), 0, 8);
        }
        $stmt = $this->pdo->prepare("
            INSERT INTO federation_championships (id, tenant_id, label, url, standings_url)
            VALUES (:id, :tid, :label, :url, :surl)
            ON DUPLICATE KEY UPDATE label=VALUES(label), url=VALUES(url), standings_url=VALUES(standings_url)
        ");
        $stmt->execute([':id' => $id, ':tid' => $this->tenantId, ':label' => $label, ':url' => $url, ':surl' => $standingsUrl]);
        return $id;
    }

    public function getRecentMatchesAllChampionships(int $limit = 10): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                m.id, m.home_team AS home, m.away_team AS away,
                m.home_score AS sets_home, m.away_score AS sets_away,
                CONCAT(COALESCE(m.home_score,'?'),' - ',COALESCE(m.away_score,'?')) AS score,
                DATE_FORMAT(m.match_date, '%d/%m/%Y') AS date,
                DATE_FORMAT(m.match_date, '%H:%i')    AS time,
                m.match_date,
                m.status,
                m.round,
                c.label AS championship_label,
                c.id    AS championship_id
            FROM federation_matches m
            JOIN federation_championships c
                ON m.championship_id = c.id
               AND c.tenant_id = :tid
               AND c.is_active  = 1
            WHERE m.status = 'played'
              AND m.home_score IS NOT NULL
              AND m.away_score IS NOT NULL
              AND m.match_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND m.match_date <= NOW()
              AND (
                LOWER(m.home_team) LIKE '%fusion%'
                OR LOWER(m.away_team) LIKE '%fusion%'
              )
            ORDER BY m.match_date DESC
            LIMIT :lim
        ");
        $stmt->bindValue(':tid', $this->tenantId);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fallback: Se il tenant corrente è vuoto, prova a recuperare quelli globali/fusion
        if (empty($results) && $this->tenantId !== 'TNT_fusion') {
            $stmt->bindValue(':tid', 'TNT_fusion');
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $results;
    }

    public function countMatchesByChampionship(string $campionatoId): int
    {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM federation_matches WHERE championship_id = :cid");
        $stmt->execute([':cid' => $campionatoId]);
        return (int)$stmt->fetchColumn();
    }

    public function replaceMatchesAndStandings(string $campionatoId, array $matches, array $standings, ?string $standingsUrlUsed): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("DELETE FROM federation_matches WHERE championship_id = :cid")->execute([':cid' => $campionatoId]);
            $insM = $this->pdo->prepare("INSERT INTO federation_matches (id, championship_id, match_number, match_date, home_team, away_team, home_logo, away_logo, home_score, away_score, status, round) VALUES (:id, :cid, :num, :date, :home, :away, :hl, :al, :hs, :as, :status, :round)");
            
            foreach ($matches as $m) {
                $sqlDate = null;
                if (!empty($m['date'])) {
                    $dateStr = $m['date'];
                    $parts = explode('/', $dateStr);

                    if (count($parts) === 3) {
                        if (strlen($parts[2]) === 2) {
                            $y = (int)$parts[2] < 50 ? 2000 + (int)$parts[2] : 1900 + (int)$parts[2];
                            $dateStr = sprintf('%02d/%02d/%04d', $parts[0], $parts[1], $y);
                        } else {
                            $dateStr = sprintf('%02d/%02d/%04d', $parts[0], $parts[1], $parts[2]);
                        }
                    }
                    else if (count($parts) === 2) {
                        $currMonth = (int)date('n');
                        $currYear = (int)date('Y');
                        $matchMonth = (int)$parts[1];

                        $targetYear = $currYear;
                        if ($currMonth >= 8 && $matchMonth <= 7) {
                            $targetYear++;
                        }
                        else if ($currMonth <= 7 && $matchMonth >= 8) {
                            $targetYear--;
                        }
                        $dateStr = sprintf('%02d/%02d/%04d', $parts[0], $parts[1], $targetYear);
                    }

                    $d = str_replace('/', '-', $dateStr) . (empty($m['time']) ? '' : ' ' . $m['time']);
                    $ts = strtotime($d);
                    if ($ts) {
                        $sqlDate = date('Y-m-d H:i:s', $ts);
                    }
                }
                $insM->execute([
                    ':id' => 'm_' . substr(md5($campionatoId . ($m['id'] ?? uniqid())), 0, 10), 
                    ':cid' => $campionatoId, 
                    ':num' => $m['id'] ?? null, 
                    ':date' => $sqlDate, 
                    ':home' => $m['home'], 
                    ':away' => $m['away'], 
                    ':hl' => $m['home_logo'] ?? null, 
                    ':al' => $m['away_logo'] ?? null, 
                    ':hs' => $m['sets_home'], 
                    ':as' => $m['sets_away'], 
                    ':status' => $m['status'], 
                    ':round' => $m['round'] ?? null
                ]);
            }

            $this->pdo->prepare("DELETE FROM federation_standings WHERE championship_id = :cid")->execute([':cid' => $campionatoId]);
            $insS = $this->pdo->prepare("INSERT INTO federation_standings (id, championship_id, position, team, logo, points, played, won, lost) VALUES (:id, :cid, :pos, :team, :logo, :pts, :p, :w, :l)");
            foreach ($standings as $s) {
                $insS->execute([
                    ':id' => 's_' . substr(md5($campionatoId . $s['team']), 0, 10), 
                    ':cid' => $campionatoId, 
                    ':pos' => $s['position'], 
                    ':team' => $s['team'], 
                    ':logo' => $s['logo'] ?? null, 
                    ':pts' => $s['points'] ?? 0, 
                    ':p' => $s['played'] ?? 0, 
                    ':w' => $s['won'] ?? 0, 
                    ':l' => $s['lost'] ?? 0
                ]);
            }

            $upd = $this->pdo->prepare("UPDATE federation_championships SET last_synced_at = NOW(), standings_url = COALESCE(:surl, standings_url) WHERE id = :id");
            $upd->execute([':id' => $campionatoId, ':surl' => $standingsUrlUsed]);
            
            $this->pdo->commit();
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function getPublicRecentMatchesAllChampionships(int $limit = 10): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                m.id, m.home_team AS home, m.away_team AS away,
                m.home_score AS sets_home, m.away_score AS sets_away,
                CONCAT(COALESCE(m.home_score,'?'),' - ',COALESCE(m.away_score,'?')) AS score,
                DATE_FORMAT(m.match_date, '%d/%m/%Y') AS date,
                DATE_FORMAT(m.match_date, '%H:%i')    AS time,
                m.match_date,
                m.status,
                m.round,
                c.label AS championship_label,
                c.id    AS championship_id
            FROM federation_matches m
            JOIN federation_championships c
                ON m.championship_id = c.id
               AND c.is_active  = 1
            WHERE m.status = 'played'
              AND m.home_score IS NOT NULL
              AND m.away_score IS NOT NULL
              AND m.match_date <= NOW()
              AND (
                LOWER(m.home_team) LIKE '%fusion%'
                OR LOWER(m.away_team) LIKE '%fusion%'
              )
            ORDER BY m.match_date DESC
            LIMIT :lim
        ");
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPublicMatchesCenter(): array
    {
        $stmtMatches = $this->pdo->prepare("
            SELECT
                m.id, m.home_team AS home, m.away_team AS away,
                m.home_score AS sets_home, m.away_score AS sets_away,
                m.home_logo  AS home_logo,
                m.away_logo  AS away_logo,
                DATE_FORMAT(m.match_date, '%d/%m/%Y') AS date,
                DATE_FORMAT(m.match_date, '%H:%i')    AS time,
                m.match_date,
                m.status,
                m.round,
                c.label AS championship_label,
                c.id    AS championship_id
            FROM federation_matches m
            JOIN federation_championships c
                ON m.championship_id = c.id
               AND c.is_active  = 1
            WHERE (
                LOWER(m.home_team) LIKE '%fusion%'
                OR LOWER(m.away_team) LIKE '%fusion%'
              )
            ORDER BY m.match_date DESC
        ");
        $stmtMatches->execute();
        return $stmtMatches->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPublicStandingsCenter(): array
    {
        $stmtStandings = $this->pdo->prepare("
            SELECT
                s.championship_id,
                s.position,
                s.team,
                s.points,
                s.played,
                s.won,
                s.lost,
                s.sets_won,
                s.sets_lost,
                c.label AS championship_label
            FROM federation_standings s
            JOIN federation_championships c
                ON s.championship_id = c.id
               AND c.is_active = 1
            ORDER BY c.label ASC, s.position ASC
        ");
        $stmtStandings->execute();
        return $stmtStandings->fetchAll(PDO::FETCH_ASSOC);
    }

    public function applyMigrationsSelfHeal(): void
    {
        $sql = file_get_contents(dirname(__DIR__, 3) . '/db/migrations/V037__federation_sync.sql');
        if ($sql === false) {
            error_log('[Results] V037 migration SQL file not found.');
            return;
        }
        $errors = 0;
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
            try {
                $this->pdo->exec($statement);
            } catch (\PDOException $e) {
                $errors++;
            }
        }
    }
}
