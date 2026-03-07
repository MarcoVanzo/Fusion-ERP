<?php
/**
 * Tasks Repository — CRM Task Management
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tasks;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;
use PDO;

class TasksRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── TASKS ────────────────────────────────────────────────────────────────

    public function listTasks(
        string $status = '',
        string $priority = '',
        string $assignedTo = '',
        string $search = '',
        int $limit = 100,
        int $offset = 0
        ): array
    {
        $sql = '
            SELECT
                t.id, t.title, t.category, t.priority, t.status,
                t.due_date, t.notes, t.assigned_to, t.created_at, t.updated_at,
                uc.full_name AS creator_name,
                ua.full_name AS assignee_name
            FROM tasks t
            LEFT JOIN users uc ON uc.id = t.user_id
            LEFT JOIN users ua ON ua.id = t.assigned_to
            WHERE 1=1';

        $params = [];

        if ($status !== '') {
            $sql .= ' AND t.status = :status';
            $params[':status'] = $status;
        }
        if ($priority !== '') {
            $sql .= ' AND t.priority = :priority';
            $params[':priority'] = $priority;
        }
        if ($assignedTo !== '') {
            $sql .= ' AND t.assigned_to = :assigned_to';
            $params[':assigned_to'] = $assignedTo;
        }
        if ($search !== '') {
            $sql .= ' AND (t.title LIKE :search OR t.notes LIKE :search2)';
            $params[':search'] = '%' . $search . '%';
            $params[':search2'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY
            CASE t.priority
                WHEN \'Urgente\' THEN 1
                WHEN \'Alta\'    THEN 2
                WHEN \'Media\'   THEN 3
                ELSE 4
            END,
            COALESCE(t.due_date, \'9999-12-31\') ASC,
            t.created_at DESC
            LIMIT ' . $limit . ' OFFSET ' . $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getTask(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createTask(
        string $title,
        string $category,
        string $priority,
        string $status,
        ?string $dueDate,
        ?string $notes,
        ?string $assignedTo
        ): string
    {
        $id = 'TSK_' . bin2hex(random_bytes(4));
        $userId = Auth::user()['id'] ?? null;

        $stmt = $this->db->prepare('
            INSERT INTO tasks (id, user_id, title, category, priority, status, due_date, notes, assigned_to)
            VALUES (:id, :user_id, :title, :category, :priority, :status, :due_date, :notes, :assigned_to)
        ');
        $stmt->execute([
            ':id' => $id,
            ':user_id' => $userId,
            ':title' => $title,
            ':category' => $category,
            ':priority' => $priority,
            ':status' => $status,
            ':due_date' => $dueDate,
            ':notes' => $notes,
            ':assigned_to' => $assignedTo,
        ]);

        return $id;
    }

    public function updateTask(string $id, array $data): void
    {
        $allowed = ['title', 'category', 'priority', 'status', 'due_date', 'notes', 'assigned_to'];
        $sets = [];
        $params = [':id' => $id];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[] = "`{$field}` = :{$field}";
                $params[":{$field}"] = $data[$field] !== '' ? $data[$field] : null;
            }
        }

        if (empty($sets))
            return;

        $sql = 'UPDATE tasks SET ' . implode(', ', $sets) . ' WHERE id = :id';
        $this->db->prepare($sql)->execute($params);
    }

    public function deleteTask(string $id): void
    {
        $this->db->prepare('DELETE FROM tasks WHERE id = ?')->execute([$id]);
    }

    // ─── TASK LOGS ────────────────────────────────────────────────────────────

    public function listTaskLogs(string $taskId): array
    {
        $stmt = $this->db->prepare('
            SELECT tl.*, u.full_name AS user_name
            FROM task_logs tl
            LEFT JOIN users u ON u.id = tl.user_id
            WHERE tl.task_id = ?
            ORDER BY tl.interaction_date DESC
        ');
        $stmt->execute([$taskId]);
        return $stmt->fetchAll();
    }

    public function createTaskLog(
        string $taskId,
        string $interactionDate,
        ?string $notes,
        ?string $outcome,
        int $scheduleFollowup,
        ?string $followupDate
        ): string
    {
        $id = 'TKL_' . bin2hex(random_bytes(4));
        $userId = Auth::user()['id'] ?? null;

        $stmt = $this->db->prepare('
            INSERT INTO task_logs
                (id, task_id, user_id, interaction_date, notes, outcome, schedule_followup, followup_date)
            VALUES
                (:id, :task_id, :user_id, :interaction_date, :notes, :outcome, :schedule_followup, :followup_date)
        ');
        $stmt->execute([
            ':id' => $id,
            ':task_id' => $taskId,
            ':user_id' => $userId,
            ':interaction_date' => $interactionDate,
            ':notes' => $notes,
            ':outcome' => $outcome,
            ':schedule_followup' => $scheduleFollowup,
            ':followup_date' => $followupDate,
        ]);

        return $id;
    }

    public function deleteTaskLog(string $id): void
    {
        $this->db->prepare('DELETE FROM task_logs WHERE id = ?')->execute([$id]);
    }
}