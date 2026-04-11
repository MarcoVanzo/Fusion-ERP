<?php
/**
 * MigrationRunner — Automated database migrations for Fusion ERP
 * v2.0 — Enhanced with: natural sorting, advisory locks, dry-run, status.
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDO;
use Exception;

class MigrationRunner
{
    private PDO $db;
    private string $migrationsDir;
    private string $tableName = 'migrations';

    public function __construct(PDO $db, string $migrationsDir)
    {
        $this->db = $db;
        $this->migrationsDir = rtrim($migrationsDir, DIRECTORY_SEPARATOR);
    }

    /**
     * Run all pending migrations.
     * @param bool $dryRun If true, list pending migrations without executing.
     * @return array List of executed (or pending, if dry-run) migrations.
     */
    public function run(bool $dryRun = false): array
    {
        $this->ensureMigrationsTable();

        if (!$dryRun) {
            $this->acquireLock();
        }

        try {
            // Pre-step: normalize old "b" suffix naming in the tracking table
            // to prevent re-execution of renamed migration files.
            if (!$dryRun) {
                $this->normalizeHistoricNames();
            }

            $executed = $this->getExecutedMigrations();
            $files = $this->getMigrationFiles();

            $applied = [];

            foreach ($files as $file) {
                if (in_array($file, $executed)) {
                    continue;
                }

                if ($dryRun) {
                    $applied[] = '[PENDING] ' . $file;
                    continue;
                }

                $this->executeMigration($file);
                $applied[] = $file;
            }

            return $applied;
        } finally {
            if (!$dryRun) {
                $this->releaseLock();
            }
        }
    }

    /**
     * Normalize historic migration names in the tracking table.
     * This handles the P0 rename from "Vxxxb" → "Vxxx_1" and the
     * V026__website_cms.sql → V026_1__website_cms.sql rename.
     *
     * Runs as a pre-step before scanning for pending migrations to
     * prevent re-execution of renamed files. Each UPDATE is idempotent
     * (WHERE clause won't match if already renamed).
     */
    private function normalizeHistoricNames(): void
    {
        $renames = [
            'V013b__backup_drive.sql'            => 'V013_1__backup_drive.sql',
            'V026__website_cms.sql'              => 'V026_1__website_cms.sql',
            'V033b__vehicles.sql'                => 'V033_1__vehicles.sql',
            'V037b__whatsapp_inbox.sql'          => 'V037_1__whatsapp_inbox.sql',
            'V039b__contacts.sql'                => 'V039_1__contacts.sql',
            'V040b__ec_orders.sql'               => 'V040_1__ec_orders.sql',
            'V042b__tasks_collation_fix.sql'     => 'V042_1__tasks_collation_fix.sql',
            'V046b__meta_logs.sql'               => 'V046_1__meta_logs.sql',
            'V047b__staff_teams.sql'             => 'V047_1__staff_teams.sql',
            'V050b__network_collab_logo.sql'     => 'V050_1__network_collab_logo.sql',
            'V062b__teams_gender.sql'            => 'V062_1__teams_gender.sql',
            'V063b__scouting_add_cognito_id.sql' => 'V063_1__scouting_add_cognito_id.sql',
            'V065b__societa_sponsors_add_fields.sql' => 'V065_1__societa_sponsors_add_fields.sql',
            // Fix duplicate V086/V087 prefixes → renumbered to V095-V099
            'V086__quota_tornei.sql'              => 'V095__quota_tornei.sql',
            'V086__fix_remaining_discrepancies.sql' => 'V096__fix_remaining_discrepancies.sql',
            'V086__add_receipt_numbers.sql'       => 'V097__add_receipt_numbers.sql',
            'V087__tornei_pagamenti.sql'          => 'V098__tornei_pagamenti.sql',
            'V087__fix_transport_schema.sql'      => 'V099__fix_transport_schema.sql',
        ];

        $stmt = $this->db->prepare(
            "UPDATE `{$this->tableName}` SET filename = :new WHERE filename = :old"
        );

        foreach ($renames as $old => $new) {
            $stmt->execute([':old' => $old, ':new' => $new]);
        }
    }

    /**
     * Get status of all migrations.
     * @return array Each entry has: filename, status ('executed'|'pending'), executed_at.
     */
    public function status(): array
    {
        $this->ensureMigrationsTable();
        $executed = $this->getExecutedMigrationsWithDates();
        $files = $this->getMigrationFiles();

        $result = [];
        foreach ($files as $file) {
            $result[] = [
                'filename' => $file,
                'status' => isset($executed[$file]) ? 'executed' : 'pending',
                'executed_at' => $executed[$file] ?? null,
            ];
        }
        return $result;
    }

    /**
     * Ensure the tracking table exists.
     */
    private function ensureMigrationsTable(): void
    {
        $sql = "CREATE TABLE IF NOT EXISTS `{$this->tableName}` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `filename` VARCHAR(255) NOT NULL UNIQUE,
            `executed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        $this->db->exec($sql);
    }

    /**
     * Get list of already executed migrations.
     */
    private function getExecutedMigrations(): array
    {
        $stmt = $this->db->query("SELECT filename FROM `{$this->tableName}`");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Get executed migrations with their execution dates.
     */
    private function getExecutedMigrationsWithDates(): array
    {
        $stmt = $this->db->query("SELECT filename, executed_at FROM `{$this->tableName}`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $map = [];
        foreach ($rows as $row) {
            $map[$row['filename']] = $row['executed_at'];
        }
        return $map;
    }

    /**
     * Get all migration files from the directory, sorted by version number.
     * Uses natural sorting so V10 comes after V9 (not after V1).
     */
    private function getMigrationFiles(): array
    {
        if (!is_dir($this->migrationsDir)) {
            throw new Exception("Migrations directory not found: {$this->migrationsDir}");
        }

        $files = glob($this->migrationsDir . DIRECTORY_SEPARATOR . 'V*__*.sql');
        if ($files === false) {
            return [];
        }

        // Get basenames and sort naturally (V2 < V10, not alphabetically)
        $basenames = array_map('basename', $files);
        usort($basenames, function (string $a, string $b): int {
            // Extract version parts: V026_1 → [26, 1], V026 → [26, 0]
            $va = $this->parseVersion($a);
            $vb = $this->parseVersion($b);
            
            // Compare major version first
            if ($va[0] !== $vb[0]) {
                return $va[0] <=> $vb[0];
            }
            // Then sub-version (0 for main, 1+ for patches)
            return $va[1] <=> $vb[1];
        });

        return $basenames;
    }

    /**
     * Parse version from filename: V026_1__name.sql → [26, 1]
     */
    private function parseVersion(string $filename): array
    {
        // Match V followed by digits, optionally _digits
        if (preg_match('/^V(\d+)(?:_(\d+))?__/', $filename, $m)) {
            return [(int)$m[1], (int)($m[2] ?? 0)];
        }
        return [0, 0];
    }

    /**
     * Execute a single migration file.
     */
    private function executeMigration(string $filename): void
    {
        $path = $this->migrationsDir . DIRECTORY_SEPARATOR . $filename;
        $sql = file_get_contents($path);

        if ($sql === false) {
            throw new Exception("Could not read migration file: {$filename}");
        }

        // PDO::exec() does NOT support DELIMITER — we must parse it manually.
        // Strategy: split the SQL into blocks by DELIMITER markers and execute
        // each block with the correct statement terminator.
        try {
            $this->db->beginTransaction();

            if (stripos($sql, 'DELIMITER') !== false) {
                $this->executeWithDelimiter($sql);
            } else {
                $this->db->exec($sql);
            }

            // Record success
            $stmt = $this->db->prepare("INSERT INTO `{$this->tableName}` (filename) VALUES (?)");
            $stmt->execute([$filename]);

            if ($this->db->inTransaction()) {
                $this->db->commit();
            }
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw new Exception("Error executing migration {$filename}: " . $e->getMessage());
        }
    }

    /**
     * Parse and execute SQL that contains DELIMITER directives.
     * Splits the file into blocks using DELIMITER markers and executes each separately.
     */
    private function executeWithDelimiter(string $sql): void
    {
        $delimiter = ';';
        $lines = explode("\n", $sql);
        $buffer = '';

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Handle DELIMITER change (e.g., "DELIMITER //" or "DELIMITER ;")
            if (preg_match('/^DELIMITER\s+(\S+)\s*$/i', $trimmed, $m)) {
                // Execute anything accumulated in buffer before delimiter change
                $pending = trim($buffer);
                if (!empty($pending)) {
                    $cleaned = $this->stripLeadingComments($pending);
                    if (!empty($cleaned)) {
                        $this->db->exec($cleaned);
                    }
                }
                $buffer = '';
                $delimiter = $m[1];
                continue;
            }

            $buffer .= $line . "\n";

            // Check if the buffer ends with the current delimiter
            if (str_ends_with(rtrim($buffer), $delimiter)) {
                // Remove the trailing delimiter
                $stmt = rtrim($buffer);
                $stmt = substr($stmt, 0, -strlen($delimiter));
                $stmt = trim($stmt);

                if (!empty($stmt)) {
                    $cleaned = $this->stripLeadingComments($stmt);
                    if (!empty($cleaned)) {
                        $this->db->exec($cleaned);
                    }
                }
                $buffer = '';
            }
        }

        // Execute anything remaining in the buffer
        $remaining = trim($buffer);
        if (!empty($remaining)) {
            $cleaned = $this->stripLeadingComments($remaining);
            $cleaned = rtrim($cleaned, "; \n\r\t");
            if (!empty($cleaned)) {
                $this->db->exec($cleaned);
            }
        }
    }

    /**
     * Strip leading SQL comment lines from a statement block.
     * Returns the remaining non-comment SQL, or empty string if all comments.
     */
    private function stripLeadingComments(string $sql): string
    {
        $lines = explode("\n", $sql);
        $result = [];
        $foundCode = false;

        foreach ($lines as $line) {
            $t = trim($line);
            if (!$foundCode && (str_starts_with($t, '--') || $t === '')) {
                continue; // skip leading comments and blank lines
            }
            $foundCode = true;
            $result[] = $line;
        }

        return trim(implode("\n", $result));
    }

    // ─── Advisory Lock (MySQL) ──────────────────────────────────────────────

    /**
     * Acquire a MySQL advisory lock to prevent concurrent migration runs.
     * Timeout: 10 seconds.
     */
    private function acquireLock(): void
    {
        $stmt = $this->db->query('SELECT GET_LOCK("fusion_migrations", 10) AS acquired');
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || (int)$row['acquired'] !== 1) {
            throw new Exception('Could not acquire migration lock. Another migration may be running.');
        }
    }

    /**
     * Release the advisory lock.
     */
    private function releaseLock(): void
    {
        $this->db->query('SELECT RELEASE_LOCK("fusion_migrations")');
    }
}
