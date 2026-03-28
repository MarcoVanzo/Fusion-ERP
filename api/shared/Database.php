<?php
/**
 * Database — PDO Singleton with Retry & Keepalive
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;
    /** @var bool Prevents running the keepalive ping more than once per request */
    private static bool $pingChecked = false;
    private static int $maxRetries = 2;
    private static int $retryDelayMs = 500;
    private static int $connectTimeout = 5; // seconds

    private function __construct()
    {
    }

    /**
     * Get the PDO instance, creating it if necessary.
     * Automatically retries on transient connection failures and
     * verifies the connection is still alive (keepalive ping).
     */
    public static function getInstance(): PDO
    {
        if (self::$instance !== null) {
            // Keepalive: verify the connection is still alive, but only once per PHP request.
            // On short-lived HTTP requests the connection cannot go stale mid-request;
            // the ping is really useful only in long-running processes (CLI, workers).
            if (!self::$pingChecked) {
                self::$pingChecked = true;
                if (!self::ping()) {
                    error_log('[DB] Stale connection detected, reconnecting...');
                    self::$instance = null;
                }
            }
        }

        if (self::$instance === null) {
            self::$instance = self::connect();
        }

        return self::$instance;
    }

    /**
     * Create a new PDO connection with retry logic.
     */
    private static function connect(): PDO
    {
        $host   = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
        $port   = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
        $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fusion_erp';
        $user   = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: '';
        $pass   = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $opts = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => self::$connectTimeout,
        ];

        // PHP 8.5+ deprecates PDO::MYSQL_ATTR_INIT_COMMAND → use Pdo\Mysql constant
        $initCmd = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";
        if (class_exists('Pdo\\Mysql') && defined('Pdo\\Mysql::ATTR_INIT_COMMAND')) {
            /** @phpstan-ignore-next-line */
            $opts[constant('Pdo\\Mysql::ATTR_INIT_COMMAND')] = $initCmd;
        } else {
            $opts[PDO::MYSQL_ATTR_INIT_COMMAND] = $initCmd;
        }

        $lastException = null;

        for ($attempt = 1; $attempt <= self::$maxRetries; $attempt++) {
            try {
                return new PDO($dsn, $user, $pass, $opts);
            } catch (PDOException $e) {
                $lastException = $e;
                error_log("[DB] Connection attempt " . (string)$attempt . "/" . (string)self::$maxRetries . " failed: " . $e->getMessage());

                if ($attempt < self::$maxRetries) {
                    usleep((int)(self::$retryDelayMs * 1000)); // ms → μs
                }
            }
        }

        // All retries exhausted — return structured JSON error
        error_log('[DB] All connection attempts failed. Database unavailable.');
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => false, 'error' => 'Database temporaneamente non disponibile. Riprova tra qualche istante.']);
        exit;
    }

    /**
     * Keepalive ping: verify the connection is still alive.
     * Returns false if the connection is stale/broken.
     */
    private static function ping(): bool
    {
        if (self::$instance === null) {
            return false;
        }
        try {
            $stmt = self::$instance->query('SELECT 1');
            if ($stmt) {
                $stmt->closeCursor();
            }
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Force a reconnection on the next getInstance() call.
     */
    public static function reconnect(): void
    {
        self::$instance = null;
        self::$pingChecked = false;
    }

    /**
     * Explicitly close the database connection.
     */
    public static function disconnect(): void
    {
        self::$instance = null;
        self::$pingChecked = false;
    }

    // Prevent cloning and unserialization
    public function __clone()
    {
    }
    public function __wakeup()
    {
    }
}