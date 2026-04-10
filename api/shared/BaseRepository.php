<?php
/**
 * BaseRepository — Shared Database Access Patterns
 * Fusion ERP v1.0
 *
 * Provides common CRUD operations, query building helpers, and
 * transaction management for all module repositories.
 *
 * Usage:
 *   class AthletesRepository extends BaseRepository {
 *       protected string $table = 'athletes';
 *       protected string $alias = 'a';
 *       protected bool $softDelete = true;
 *   }
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDO;

abstract class BaseRepository
{
    protected PDO $db;

    /** @var string Primary table name (must be set by child class) */
    protected string $table = '';

    /** @var string Table alias for queries (default: first letter of table name) */
    protected string $alias = '';

    /** @var string Primary key column */
    protected string $primaryKey = 'id';

    /** @var bool Whether this table uses soft-delete via deleted_at column */
    protected bool $softDelete = true;

    /** @var string Column used for default ordering */
    protected string $defaultOrderBy = 'id';

    /** @var string Default sort direction */
    protected string $defaultOrderDir = 'ASC';

    public function __construct()
    {
        $this->db = Database::getInstance();
        if (empty($this->alias) && !empty($this->table)) {
            $this->alias = substr($this->table, 0, 1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUERY HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find a single record by primary key.
     *
     * @param string $id Record ID
     * @param string $columns Columns to select (default: *)
     * @return array|null The record or null if not found
     */
    public function findById(string $id, string $columns = '*'): ?array
    {
        $where = "{$this->primaryKey} = :id";
        if ($this->softDelete) {
            $where .= ' AND deleted_at IS NULL';
        }

        $stmt = $this->db->prepare(
            "SELECT {$columns} FROM {$this->table} WHERE {$where} LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Find all records matching optional conditions.
     *
     * @param array $conditions Key => value pairs for WHERE clause (all ANDed)
     * @param string $columns Columns to select
     * @param string|null $orderBy ORDER BY clause (null = use default)
     * @param int|null $limit Max records (null = unlimited)
     * @return array List of records
     */
    public function findAll(
        array $conditions = [],
        string $columns = '*',
        ?string $orderBy = null,
        ?int $limit = null
    ): array {
        $where = $this->buildWhereClause($conditions);
        $order = $orderBy ?? "{$this->defaultOrderBy} {$this->defaultOrderDir}";
        $limitClause = $limit !== null ? " LIMIT {$limit}" : '';

        $sql = "SELECT {$columns} FROM {$this->table} WHERE {$where} ORDER BY {$order}{$limitClause}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($this->buildParams($conditions));
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count records matching conditions.
     *
     * @param array $conditions Key => value pairs for WHERE clause
     * @return int Total count
     */
    public function count(array $conditions = []): int
    {
        $where = $this->buildWhereClause($conditions);
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE {$where}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($this->buildParams($conditions));
        return (int) $stmt->fetchColumn();
    }

    /**
     * Check if a record exists.
     *
     * @param string $id Record ID
     * @return bool
     */
    public function exists(string $id): bool
    {
        $where = "{$this->primaryKey} = :id";
        if ($this->softDelete) {
            $where .= ' AND deleted_at IS NULL';
        }
        $stmt = $this->db->prepare("SELECT 1 FROM {$this->table} WHERE {$where} LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetchColumn() !== false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WRITE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Insert a new record.
     *
     * @param array $data Column => value pairs to insert
     * @return string The last inserted ID (or the explicit ID from $data)
     */
    public function insert(array $data): string
    {
        $columns = array_keys($data);
        $placeholders = array_map(fn($col) => ":{$col}", $columns);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $this->table,
            '`' . implode('`, `', $columns) . '`',
            implode(', ', $placeholders)
        );

        $params = [];
        foreach ($data as $col => $val) {
            $params[":{$col}"] = $val;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $data[$this->primaryKey] ?? $this->db->lastInsertId();
    }

    /**
     * Update a record by primary key.
     *
     * @param string $id Record ID
     * @param array $data Column => value pairs to update
     * @return int Number of affected rows
     */
    public function update(string $id, array $data): int
    {
        $setClauses = [];
        $params = [':_pk_id' => $id];

        foreach ($data as $col => $val) {
            $cleanCol = ltrim($col, ':');
            $setClauses[] = "`{$cleanCol}` = :{$cleanCol}";
            $params[":{$cleanCol}"] = $val;
        }

        $where = "{$this->primaryKey} = :_pk_id";
        if ($this->softDelete) {
            $where .= ' AND deleted_at IS NULL';
        }

        $sql = 'UPDATE ' . $this->table . ' SET '
            . implode(', ', $setClauses)
            . ' WHERE ' . $where;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * Soft-delete a record by setting deleted_at = NOW().
     *
     * @param string $id Record ID
     * @return int Number of affected rows
     */
    public function softDeleteRecord(string $id): int
    {
        if (!$this->softDelete) {
            throw new \LogicException("Table {$this->table} does not support soft-delete");
        }
        $stmt = $this->db->prepare(
            "UPDATE {$this->table} SET deleted_at = NOW() WHERE {$this->primaryKey} = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount();
    }

    /**
     * Hard-delete a record permanently.
     *
     * @param string $id Record ID
     * @return int Number of affected rows
     */
    public function hardDelete(string $id): int
    {
        $stmt = $this->db->prepare(
            "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSACTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Execute a callback within a database transaction.
     * Automatically commits on success or rolls back on failure.
     *
     * @template T
     * @param callable(): T $callback The work to execute inside the transaction
     * @return T The callback's return value
     * @throws \Throwable Re-throws the caught exception after rollback
     */
    public function transaction(callable $callback): mixed
    {
        $this->db->beginTransaction();
        try {
            $result = $callback();
            $this->db->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCHEMA INTROSPECTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Check if a column exists in a given table.
     *
     * @param string $table Table name
     * @param string $column Column name
     * @return bool
     */
    protected function hasColumn(string $table, string $column): bool
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME   = :tbl
                   AND COLUMN_NAME  = :col"
            );
            $stmt->execute([':tbl' => $table, ':col' => $column]);
            return (int) $stmt->fetchColumn() > 0;
        } catch (\Throwable) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Build a WHERE clause from conditions array.
     * Automatically adds soft-delete filter if enabled.
     *
     * @param array $conditions Column => value pairs
     * @return string SQL WHERE clause (without "WHERE")
     */
    private function buildWhereClause(array $conditions): string
    {
        $clauses = [];

        if ($this->softDelete) {
            $clauses[] = 'deleted_at IS NULL';
        }

        foreach ($conditions as $col => $val) {
            $cleanCol = ltrim($col, ':');
            if ($val === null) {
                $clauses[] = "`{$cleanCol}` IS NULL";
            } else {
                $clauses[] = "`{$cleanCol}` = :{$cleanCol}";
            }
        }

        return empty($clauses) ? '1=1' : implode(' AND ', $clauses);
    }

    /**
     * Build PDO parameters from conditions array.
     *
     * @param array $conditions Column => value pairs
     * @return array Parameterized values (null values are excluded — handled by IS NULL)
     */
    private function buildParams(array $conditions): array
    {
        $params = [];
        foreach ($conditions as $col => $val) {
            if ($val !== null) {
                $cleanCol = ltrim($col, ':');
                $params[":{$cleanCol}"] = $val;
            }
        }
        return $params;
    }
}
