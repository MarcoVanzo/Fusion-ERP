<?php
/**
 * Database — PDO Singleton
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    private function __construct()
    {
    }

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
            $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
            $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fusion_erp';
            $user = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: '';
            $pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            try {
                $opts = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];

                // PHP 8.5+ deprecates PDO::MYSQL_ATTR_INIT_COMMAND → use Pdo\Mysql constant
                $initCmd = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";
                if (class_exists('Pdo\\Mysql') && defined('Pdo\\Mysql::ATTR_INIT_COMMAND')) {
                    /** @phpstan-ignore-next-line */
                    $opts[constant('Pdo\\Mysql::ATTR_INIT_COMMAND')] = $initCmd;
                }
                else {
                    $opts[PDO::MYSQL_ATTR_INIT_COMMAND] = $initCmd;
                }

                self::$instance = new PDO($dsn, $user, $pass, $opts);
            }
            catch (PDOException $e) {
                // Never expose DB credentials or stack trace to output
                error_log('[DB] Connection failed: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Database unavailable']);
                exit;
            }
        }

        return self::$instance;
    }

    // Prevent cloning and unserialization
    public function __clone()
    {
    }
    public function __wakeup()
    {
    }
}