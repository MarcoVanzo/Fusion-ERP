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

        // We use a transaction if possible, but some DDL (CREATE/ALTER) 
        // in MySQL commit automatically anyway.
        try {
            $this->db->beginTransaction();
            
            // Execute the script (might contain multiple queries)
            // Note: PDO::exec doesn't support multiple queries easily with emulated prepares off.
            // But for simple migrations it's often okay. 
            // Better: split by semicolon if needed, or use the raw PDO connection.
            $this->db->exec($sql);

            // Record success
            $stmt = $this->db->prepare("INSERT INTO `{$this->tableName}` (filename) VALUES (?)");
            $stmt->execute([$filename]);

            $this->db->commit();
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw new Exception("Error executing migration {$filename}: " . $e->getMessage());
        }
    }
}
