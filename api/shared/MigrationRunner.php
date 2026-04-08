<?php
/**
 * MigrationRunner — Automated database migrations for Fusion ERP
 * v1.0
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
     * @return array List of executed migrations.
     */
    public function run(): array
    {
        $this->ensureMigrationsTable();
        $executed = $this->getExecutedMigrations();
        $files = $this->getMigrationFiles();

        $applied = [];

        foreach ($files as $file) {
            if (in_array($file, $executed)) {
                continue;
            }

            $this->executeMigration($file);
            $applied[] = $file;
        }

        return $applied;
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
     * Get all migration files from the directory, sorted by name.
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

        // Get basenames and sort
        $basenames = array_map('basename', $files);
        sort($basenames);
        return $basenames;
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

                if (!empty($stmt) && !preg_match('/^\s*--/', $stmt)) {
                    $this->db->exec($stmt);
                }
                $buffer = '';
            }
        }

        // Execute anything remaining in the buffer
        $remaining = trim($buffer);
        if (!empty($remaining) && !preg_match('/^\s*--/', $remaining)) {
            // Remove trailing semicolon if present
            $remaining = rtrim($remaining, "; \n\r\t");
            if (!empty($remaining)) {
                $this->db->exec($remaining);
            }
        }
    }
}
