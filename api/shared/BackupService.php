<?php
/**
 * BackupService — Standalone database dump + ZIP + metadata persistence
 * Fusion ERP v1.0
 *
 * Extracted from AdminController::_performBackupDump() to allow:
 *   - injection of the repository instead of hard-wiring it
 *   - independent instantiation from CLI/cron without loading a Controller
 *   - testability in isolation
 *
 * @package FusionERP\Shared
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use FusionERP\Modules\Admin\AdminRepository;

class BackupService
{
    private AdminRepository $repo;

    public function __construct(?AdminRepository $repo = null)
    {
        $this->repo = $repo ?? new AdminRepository();
    }

    /**
     * Perform a full database dump, compress to ZIP, persist metadata and emit audit log.
     *
     * @param string|null $createdBy   User ID (null = cron / automated)
     * @param string      $authorName  Display name for the SQL header comment
     *
     * @return array{
     *   success: bool,
     *   error?: string,
     *   id?: string,
     *   filename?: string,
     *   filepath?: string,
     *   filesize?: int,
     *   table_names?: array<string>,
     *   total_rows?: int,
     * }
     */
    public function dump(?string $createdBy, string $authorName = 'System'): array
    {
        // ── 1. Resolve writable storage directory ─────────────────────────────
        $envPath = getenv('BACKUP_STORAGE_PATH') ?: '';
        $candidates = array_filter([
            $envPath ? rtrim($envPath, '/') . '/' : '',
            dirname(__DIR__, 2) . '/uploads/backups/',
            sys_get_temp_dir() . '/fusion_backups/',
        ]);

        $storagePath = null;
        foreach ($candidates as $candidate) {
            // candidate is never empty here due to array_filter
            if (!is_dir($candidate)) {
                @mkdir($candidate, 0750, true);
            }
            if (is_dir($candidate) && is_writable($candidate)) {
                $storagePath = $candidate;
                break;
            }
        }

        if ($storagePath === null) {
            return ['success' => false, 'error' => 'Nessuna directory di backup scrivibile disponibile'];
        }

        // ── 2. List tables ────────────────────────────────────────────────────
        $tables = $this->repo->listDatabaseTables();
        $tables = array_values(array_filter($tables, fn($t) => !str_starts_with($t['table_name'], 'wp_')));
        $tableNames = array_column($tables, 'table_name');
        $totalRows = (int)array_sum(array_column($tables, 'table_rows'));

        if (empty($tableNames)) {
            return ['success' => false, 'error' => 'Nessuna tabella trovata nel database'];
        }

        // ── 3. Open output file ───────────────────────────────────────────────
        $pdo = Database::getInstance();
        $backupId = 'BKP_' . bin2hex(random_bytes(6));
        $date = date('Ymd_His');
        $sqlFile = "backup_{$date}_{$backupId}.sql";
        $zipFile = "backup_{$date}_{$backupId}.zip";
        $sqlPath = $storagePath . $sqlFile;
        $zipPath = $storagePath . $zipFile;

        $fh = fopen($sqlPath, 'w');
        if ($fh === false) {
            return ['success' => false, 'error' => 'Impossibile scrivere il file di backup'];
        }

        // ── 4. Write SQL header ───────────────────────────────────────────────
        fwrite($fh, "-- Fusion ERP \xe2\x80\x94 Database Backup\n");
        fwrite($fh, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
        fwrite($fh, "-- By: {$authorName}\n");
        fwrite($fh, "-- Tables: " . implode(', ', $tableNames) . "\n\n");
        fwrite($fh, "SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\nSET NAMES utf8mb4;\n\n");

        // ── 5. Dump each table ────────────────────────────────────────────────
        foreach ($tableNames as $table) {
            // Whitelist validation — table names come from INFORMATION_SCHEMA but validated defensively
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
                fwrite($fh, "-- SKIPPED unsafe table name: {$table}\n");
                continue;
            }

            try {
                $row = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_NUM);
                $createSql = $row[1] ?? '';
            }
            catch (\Throwable $e) {
                $createSql = "-- Could not retrieve CREATE for {$table}: " . $e->getMessage();
            }

            fwrite($fh, "-- \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80 TABLE: {$table} \xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\n");
            fwrite($fh, "DROP TABLE IF EXISTS `{$table}`;\n");
            fwrite($fh, $createSql . ";\n\n");

            $offset = 0;
            $chunkSize = 500;
            do {
                try {
                    $stmt = $pdo->prepare(
                        "SELECT * FROM `{$table}` LIMIT " . (string)$chunkSize . " OFFSET " . (string)$offset
                    );
                    $stmt->execute();
                    $rows = $stmt->fetchAll(\PDO::FETCH_NUM);
                }
                catch (\Throwable $e) {
                    fwrite($fh, "-- Error reading {$table}: " . $e->getMessage() . "\n");
                    break;
                }
                if (empty($rows)) {
                    break;
                }

                fwrite($fh, "INSERT INTO `{$table}` VALUES\n");
                $rowStrings = [];
                foreach ($rows as $row) {
                    $vals = array_map(fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), $row);
                    $rowStrings[] = '(' . implode(',', $vals) . ')';
                }
                fwrite($fh, implode(",\n", $rowStrings) . ";\n");
                $offset += $chunkSize;
            } while (count($rows) === $chunkSize);

            fwrite($fh, "\n");
        }

        fwrite($fh, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($fh);

        // ── 6. Compress to ZIP ────────────────────────────────────────────────
        $filesize = 0;
        $finalFile = $zipFile;
        $finalPath = $zipPath;

        if (class_exists('ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE) === true) {
                $zip->addFile($sqlPath, $sqlFile);
                $zip->close();
                unlink($sqlPath);
                $filesize = file_exists($zipPath) ? filesize($zipPath) : 0;
            }
            else {
                $finalFile = $sqlFile;
                $finalPath = $sqlPath;
                $filesize = file_exists($sqlPath) ? filesize($sqlPath) : 0;
            }
        }
        else {
            $finalFile = $sqlFile;
            $finalPath = $sqlPath;
            $filesize = file_exists($sqlPath) ? filesize($sqlPath) : 0;
        }

        // ── 7. Persist metadata ───────────────────────────────────────────────
        try {
            $this->repo->saveBackupRecord([
                ':id' => $backupId,
                ':filename' => $finalFile,
                ':filesize' => $filesize,
                ':tables_list' => json_encode($tableNames),
                ':table_count' => count($tableNames),
                ':row_count' => $totalRows,
                ':created_by' => $createdBy,
                ':status' => 'ok',
                ':notes' => $createdBy === null ? 'Cron automatico' : null,
                ':drive_file_id' => null,
                ':drive_uploaded_at' => null,
            ]);
        }
        catch (\Throwable $e) {
            error_log('[BACKUP] DB saveBackupRecord failed: ' . $e->getMessage());
        }

        // ── 8. Audit log ──────────────────────────────────────────────────────
        Audit::log('BACKUP', 'backups', $backupId, null, [
            'filename' => $finalFile,
            'filesize' => $filesize,
            'table_count' => count($tableNames),
            'row_count' => $totalRows,
            'source' => $createdBy === null ? 'cron' : 'manual',
        ]);

        return [
            'success' => true,
            'id' => $backupId,
            'filename' => $finalFile,
            'filepath' => $finalPath,
            'filesize' => $filesize,
            'table_names' => $tableNames,
            'total_rows' => $totalRows,
        ];
    }
}