<?php
/**
 * Tasks Controller — CRM Task Management
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tasks;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class TasksController
{
    private TasksRepository $repo;

    public function __construct()
    {
        require_once __DIR__ . '/TasksRepository.php';
        $this->repo = new TasksRepository();
    }

    // ─── TASKS ────────────────────────────────────────────────────────────────

    /**
     * GET ?module=tasks&action=listTasks
     * Params: status, priority, assigned_to, search, limit, offset
     */
    public function listTasks(): void
    {
        Auth::requireAuth();

        $status = filter_input(INPUT_GET, 'status', FILTER_DEFAULT) ?? '';
        $priority = filter_input(INPUT_GET, 'priority', FILTER_DEFAULT) ?? '';
        $assignedTo = filter_input(INPUT_GET, 'assigned_to', FILTER_DEFAULT) ?? '';
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $limit = max(1, min(500, (int)(filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 100)));
        $offset = max(0, (int)(filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT) ?: 0));

        $tasks = $this->repo->listTasks($status, $priority, $assignedTo, $search, $limit, $offset);
        Response::success(['tasks' => $tasks, 'count' => count($tasks)]);
    }

    /**
     * POST ?module=tasks&action=createTask
     */
    public function createTask(): void
    {
        Auth::requireAuth();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($body['title'] ?? '');
        $category = trim($body['category'] ?? 'Interno');
        $priority = trim($body['priority'] ?? 'Media');
        $status = trim($body['status'] ?? 'Da fare');
        $dueDate = trim($body['due_date'] ?? '');
        $notes = trim($body['notes'] ?? '');
        $assignedTo = trim($body['assigned_to'] ?? '');
        $attachment = $body['attachment'] ?? null; // base64 data-URI

        if ($title === '') {
            Response::error('Il titolo è obbligatorio', 422);
        }

        $id = $this->repo->createTask(
            $title, $category, $priority, $status,
            $dueDate ?: null, $notes ?: null, $assignedTo ?: null,
            $attachment ?: null
        );

        Audit::log('INSERT', 'tasks', $id, null, ['title' => $title, 'status' => $status]);
        Response::success(['id' => $id], 201);
    }

    /**
     * POST ?module=tasks&action=updateTask
     */
    public function updateTask(): void
    {
        Auth::requireAuth();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = trim($body['id'] ?? '');

        if ($id === '')
            Response::error('ID obbligatorio', 422);

        $before = $this->repo->getTask($id);
        if ($before === null)
            Response::error('Task non trovato', 404);

        $this->repo->updateTask($id, $body);

        Audit::log('UPDATE', 'tasks', $id, $before, $this->repo->getTask($id));
        Response::success(['id' => $id]);
    }

    /**
     * POST ?module=tasks&action=deleteTask
     */
    public function deleteTask(): void
    {
        Auth::requireAuth();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = trim($body['id'] ?? '');

        if ($id === '')
            Response::error('ID obbligatorio', 422);

        $before = $this->repo->getTask($id);
        if ($before === null)
            Response::error('Task non trovato', 404);

        $this->repo->deleteTask($id);

        Audit::log('DELETE', 'tasks', $id, $before, null);
        Response::success(['deleted' => true]);
    }

    // ─── TASK LOGS ────────────────────────────────────────────────────────────

    /**
     * GET ?module=tasks&action=listTaskLogs&task_id=TSK_xxx
     */
    public function listTaskLogs(): void
    {
        Auth::requireAuth();

        $taskId = filter_input(INPUT_GET, 'task_id', FILTER_DEFAULT) ?? '';
        if ($taskId === '')
            Response::error('task_id obbligatorio', 422);

        $logs = $this->repo->listTaskLogs($taskId);
        Response::success(['logs' => $logs]);
    }

    /**
     * POST ?module=tasks&action=createTaskLog
     */
    public function createTaskLog(): void
    {
        Auth::requireAuth();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $taskId = trim($body['task_id'] ?? '');
        $date = trim($body['interaction_date'] ?? date('Y-m-d H:i:s'));
        $notes = trim($body['notes'] ?? '');
        $outcome = trim($body['outcome'] ?? '');
        $esito = trim($body['esito'] ?? '');
        $attachment = $body['attachment'] ?? null; // base64 data-URI
        $scheduleFollowup = (int)($body['schedule_followup'] ?? 0);
        $followupDate = trim($body['followup_date'] ?? '');

        if ($taskId === '')
            Response::error('task_id obbligatorio', 422);

        $id = $this->repo->createTaskLog(
            $taskId, $date, $notes ?: null, $outcome ?: null,
            $esito ?: null, $attachment ?: null,
            $scheduleFollowup, $followupDate ?: null
        );

        Response::success(['id' => $id], 201);
    }

    /**
     * POST ?module=tasks&action=deleteTaskLog
     */
    public function deleteTaskLog(): void
    {
        Auth::requireAuth();

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = trim($body['id'] ?? '');

        if ($id === '')
            Response::error('ID obbligatorio', 422);

        $this->repo->deleteTaskLog($id);
        Response::success(['deleted' => true]);
    }
}