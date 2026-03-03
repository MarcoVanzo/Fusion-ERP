/**
 * Tasks Module — CRM Task Management
 * Fusion ERP v1.0
 *
 * Displays and manages tasks: list, create, update, delete.
 * Supports status, priority, due date, assigned user, and interaction logs.
 */

'use strict';

const Tasks = (() => {
    let _ac = new AbortController();
    let _tasks = [];
    let _users = [];
    let _filterStatus = '';
    let _filterPriority = '';
    let _search = '';

    const STATUSES = ['Da fare', 'In corso', 'In attesa', 'Completato', 'Annullato'];
    const PRIORITIES = ['Alta', 'Media', 'Bassa'];
    const CATEGORIES = ['Interno', 'Atleta', 'Evento', 'Marketing', 'Amministrativo', 'Altro'];

    const STATUS_COLOR = {
        'Da fare': { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
        'In corso': { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
        'In attesa': { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
        'Completato': { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
        'Annullato': { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
    };
    const PRIORITY_ICON = { 'Alta': 'ph-arrow-up', 'Media': 'ph-minus', 'Bassa': 'ph-arrow-down' };
    const PRIORITY_COLOR = { 'Alta': '#ef4444', 'Media': '#f59e0b', 'Bassa': '#6ee7b7' };

    // ─── INIT ──────────────────────────────────────────────────────────────────

    async function init() {
        _ac = new AbortController();
        _filterStatus = '';
        _filterPriority = '';
        _search = '';

        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = UI.skeletonPage();

        try {
            const [tasksData, usersData] = await Promise.all([
                Store.get('listTasks', 'tasks'),
                Store.get('listUsers', 'auth').catch(() => ({ users: [] }))
            ]);
            _tasks = tasksData?.tasks || [];
            _users = usersData?.users || usersData || [];
            _render(app);
        } catch (err) {
            console.error('[Tasks] Init error:', err);
            app.innerHTML = Utils.emptyState('Errore nel caricamento', err.message, 'Riprova', null, () => init());
        }
    }

    // ─── RENDER ────────────────────────────────────────────────────────────────

    function _render(app) {
        const filtered = _filtered();
        const counts = _countByStatus();

        app.innerHTML = `
        <div class="tasks-page">
            <div class="tasks-header">
                <div class="tasks-title-row">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-check-square" style="color:var(--color-primary);"></i>
                        Task & Attività
                    </h1>
                    <button class="btn btn-primary" id="btn-new-task" type="button">
                        <i class="ph ph-plus"></i> Nuova Task
                    </button>
                </div>

                <!-- Status pills -->
                <div class="tasks-status-bar">
                    <button class="task-pill ${_filterStatus === '' ? 'active' : ''}" data-status="">
                        Tutti <span class="task-pill-count">${_tasks.length}</span>
                    </button>
                    ${STATUSES.map(s => `
                    <button class="task-pill ${_filterStatus === s ? 'active' : ''}" data-status="${Utils.escapeHtml(s)}">
                        ${Utils.escapeHtml(s)} <span class="task-pill-count">${counts[s] || 0}</span>
                    </button>`).join('')}
                </div>

                <!-- Search + Priority filter -->
                <div class="tasks-filter-row">
                    <div class="search-input-wrapper" style="flex:1;max-width:320px;">
                        <i class="ph ph-magnifying-glass search-icon"></i>
                        <input type="search" id="tasks-search" class="form-input" placeholder="Cerca task..."
                            value="${Utils.escapeHtml(_search)}" style="padding-left:36px;">
                    </div>
                    <select id="tasks-priority-filter" class="form-input" style="max-width:160px;">
                        <option value="">Tutte le priorità</option>
                        ${PRIORITIES.map(p => `<option value="${p}" ${_filterPriority === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Task List -->
            <div class="tasks-list" id="tasks-list">
                ${filtered.length === 0 ? `
                <div class="tasks-empty">
                    <i class="ph ph-check-square" style="font-size:48px;opacity:0.2;"></i>
                    <p>Nessuna task trovata</p>
                </div>` : filtered.map(t => _renderTaskRow(t)).join('')}
            </div>
        </div>`;

        _bindListEvents();
    }

    function _renderTaskRow(t) {
        const s = STATUS_COLOR[t.status] || STATUS_COLOR['Da fare'];
        const priorityColor = PRIORITY_COLOR[t.priority] || '#9ca3af';
        const priorityIcon = PRIORITY_ICON[t.priority] || 'ph-minus';

        let isOverdue = false, isToday = false, isTomorrow = false;
        if (t.due_date && t.status !== 'Completato' && t.status !== 'Annullato') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tmrw = new Date(today);
            tmrw.setDate(tmrw.getDate() + 1);

            const due = new Date(t.due_date);
            due.setHours(0, 0, 0, 0);

            if (due < today) isOverdue = true;
            else if (due.getTime() === today.getTime()) isToday = true;
            else if (due.getTime() === tmrw.getTime()) isTomorrow = true;
        }

        const dueStr = t.due_date
            ? new Date(t.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        const assigneeName = _users.find(u => u.id === t.assigned_to)?.full_name || t.assigned_to || '—';

        let highlightClass = '';
        if (isOverdue) highlightClass = 'task-row-overdue';
        else if (isToday) highlightClass = 'task-row-today';
        else if (isTomorrow) highlightClass = 'task-row-tomorrow';

        return `
        <div class="task-row ${highlightClass}" data-id="${Utils.escapeHtml(t.id)}" tabindex="0" role="button" aria-label="Apri task: ${Utils.escapeHtml(t.title)}">
            <div class="task-row-left">
                <div class="task-priority-dot" style="background:${priorityColor};" title="Priorità ${Utils.escapeHtml(t.priority)}">
                    <i class="ph ${priorityIcon}" style="font-size:10px;color:#000;"></i>
                </div>
                <div class="task-info">
                    <span class="task-title">${Utils.escapeHtml(t.title)}</span>
                    <span class="task-meta">
                        ${t.category ? `<span class="task-category">${Utils.escapeHtml(t.category)}</span>` : ''}
                        ${t.notes ? `<span class="task-note-preview">${Utils.escapeHtml(t.notes.substring(0, 60))}${t.notes.length > 60 ? '…' : ''}</span>` : ''}
                    </span>
                </div>
            </div>
            <div class="task-row-right">
                <span class="task-assignee"><i class="ph ph-user-circle"></i> ${Utils.escapeHtml(assigneeName)}</span>
                <span class="task-due ${isOverdue ? 'task-overdue' : (isToday ? 'task-today' : (isTomorrow ? 'task-tomorrow' : ''))}">
                    <i class="ph ph-calendar-blank"></i> ${dueStr}
                    ${isOverdue ? '<i class="ph ph-warning" style="color:var(--color-danger);" title="Scaduto"></i>' : ''}
                    ${isToday ? '<i class="ph ph-clock" style="color:var(--color-pink);" title="Scade oggi"></i>' : ''}
                    ${isTomorrow ? '<i class="ph ph-clock" style="color:var(--color-warning);" title="Scade domani"></i>' : ''}
                </span>
                <span class="task-status-badge" style="background:${s.bg};color:${s.text};border:1px solid ${s.border};">
                    ${Utils.escapeHtml(t.status)}
                </span>
                <button class="btn btn-ghost btn-sm task-delete-btn" data-id="${Utils.escapeHtml(t.id)}" title="Elimina" type="button">
                    <i class="ph ph-trash" style="color:var(--color-danger);"></i>
                </button>
            </div>
        </div>`;
    }

    // ─── EVENT BINDING ─────────────────────────────────────────────────────────

    function _bindListEvents() {
        const app = document.getElementById('app');
        if (!app) return;

        // New task
        app.querySelector('#btn-new-task')?.addEventListener('click', () => _openTaskModal(null), { signal: _ac.signal });

        // Status filter pills
        app.querySelector('.tasks-status-bar')?.addEventListener('click', e => {
            const pill = e.target.closest('[data-status]');
            if (!pill) return;
            _filterStatus = pill.dataset.status;
            _render(app);
        }, { signal: _ac.signal });

        // Search
        app.querySelector('#tasks-search')?.addEventListener('input', e => {
            _search = e.target.value.trim().toLowerCase();
            _render(app);
        }, { signal: _ac.signal });

        // Priority filter
        app.querySelector('#tasks-priority-filter')?.addEventListener('change', e => {
            _filterPriority = e.target.value;
            _render(app);
        }, { signal: _ac.signal });

        // Open task on click
        app.querySelector('#tasks-list')?.addEventListener('click', e => {
            const deleteBtn = e.target.closest('.task-delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                _confirmDelete(deleteBtn.dataset.id);
                return;
            }
            const row = e.target.closest('.task-row');
            if (row) _openTaskModal(row.dataset.id);
        }, { signal: _ac.signal });

        // Keyboard enter on row
        app.querySelector('#tasks-list')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const row = e.target.closest('.task-row');
                if (row) _openTaskModal(row.dataset.id);
            }
        }, { signal: _ac.signal });
    }

    // ─── TASK MODAL (Create / Edit + Logs) ────────────────────────────────────

    function _openTaskModal(taskId) {
        const task = taskId ? _tasks.find(t => t.id === taskId) : null;
        const isNew = !task;

        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-3);';

        body.innerHTML = `
        <!-- Task Form -->
        <form id="task-modal-form" style="display:flex;flex-direction:column;gap:var(--sp-2);">
            <div class="form-group" style="margin:0;">
                <label class="form-label">Titolo *</label>
                <input type="text" id="task-title" class="form-input" required
                    value="${Utils.escapeHtml(task?.title || '')}" placeholder="Titolo della task">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Categoria</label>
                    <select id="task-category" class="form-input">
                        ${CATEGORIES.map(c => `<option value="${c}" ${task?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Priorità</label>
                    <select id="task-priority" class="form-input">
                        ${PRIORITIES.map(p => `<option value="${p}" ${(task?.priority || 'Media') === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Stato</label>
                    <select id="task-status" class="form-input">
                        ${STATUSES.map(s => `<option value="${s}" ${(task?.status || 'Da fare') === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Scadenza</label>
                    <input type="date" id="task-due" class="form-input"
                        value="${task?.due_date ? task.due_date.split('T')[0] : ''}">
                </div>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Assegnata a</label>
                <select id="task-assigned" class="form-input">
                    <option value="">— Nessuno —</option>
                    ${_users.map(u => `<option value="${u.id}" ${task?.assigned_to === u.id ? 'selected' : ''}>${Utils.escapeHtml(u.full_name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Note</label>
                <textarea id="task-notes" class="form-input" rows="3"
                    style="resize:vertical;">${Utils.escapeHtml(task?.notes || '')}</textarea>
            </div>
            <div id="task-modal-error" class="form-error hidden" aria-live="polite"></div>
            <button type="submit" class="btn btn-primary" id="task-save-btn">
                ${isNew ? '<i class="ph ph-plus"></i> Crea Task' : '<i class="ph ph-floppy-disk"></i> Salva Modifiche'}
            </button>
        </form>

        ${!isNew ? `
        <!-- Interaction Logs -->
        <div style="border-top:1px solid var(--color-border);padding-top:var(--sp-3);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-2);">
                <h4 style="margin:0;font-size:14px;"><i class="ph ph-clock-clockwise"></i> Log Interazioni</h4>
                <button class="btn btn-ghost btn-sm" id="btn-add-log" type="button">
                    <i class="ph ph-plus"></i> Aggiungi
                </button>
            </div>
            <div id="task-logs-container">
                <div class="skeleton skeleton-text" style="height:32px;"></div>
            </div>
        </div>` : ''}
        `;

        const modal = UI.modal({
            title: isNew ? 'Nuova Task' : `Task: ${task.title}`,
            body,
            size: 'lg'
        });

        // Submit handler
        body.querySelector('#task-modal-form').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = body.querySelector('#task-modal-error');
            const btn = body.querySelector('#task-save-btn');
            const title = body.querySelector('#task-title').value.trim();
            if (!title) {
                errEl.textContent = 'Il titolo è obbligatorio';
                errEl.classList.remove('hidden');
                return;
            }

            const payload = {
                title,
                category: body.querySelector('#task-category').value,
                priority: body.querySelector('#task-priority').value,
                status: body.querySelector('#task-status').value,
                due_date: body.querySelector('#task-due').value || null,
                assigned_to: body.querySelector('#task-assigned').value || null,
                notes: body.querySelector('#task-notes').value.trim() || null,
            };

            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...';
            errEl.classList.add('hidden');

            try {
                if (isNew) {
                    const res = await Store.api('createTask', 'tasks', payload);
                    payload.id = res.id;
                    _tasks.unshift({ ...payload, created_at: new Date().toISOString() });
                    UI.toast('Task creata!', 'success');
                } else {
                    await Store.api('updateTask', 'tasks', { id: taskId, ...payload });
                    const idx = _tasks.findIndex(t => t.id === taskId);
                    if (idx !== -1) _tasks[idx] = { ..._tasks[idx], ...payload };
                    UI.toast('Task aggiornata!', 'success');
                }
                modal.close();
                _render(document.getElementById('app'));
            } catch (err) {
                errEl.textContent = err.message || 'Errore durante il salvataggio';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = isNew ? '<i class="ph ph-plus"></i> Crea Task' : '<i class="ph ph-floppy-disk"></i> Salva Modifiche';
            }
        });

        // Load logs for existing task
        if (!isNew) {
            _loadLogs(taskId, body.querySelector('#task-logs-container'));

            body.querySelector('#btn-add-log')?.addEventListener('click', () => {
                _openLogModal(taskId, body.querySelector('#task-logs-container'));
            });
        }
    }

    // ─── LOGS ──────────────────────────────────────────────────────────────────

    async function _loadLogs(taskId, container) {
        if (!container) return;
        try {
            const data = await Store.get('listTaskLogs', 'tasks', { task_id: taskId });
            const logs = data?.logs || [];
            if (logs.length === 0) {
                container.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;">Nessun log ancora.</p>`;
                return;
            }
            container.innerHTML = logs.map(l => `
            <div class="task-log-item">
                <div class="task-log-header">
                    <span class="task-log-date">${new Date(l.interaction_date || l.created_at).toLocaleString('it-IT')}</span>
                    <button class="btn btn-ghost btn-xs task-log-delete" data-id="${Utils.escapeHtml(l.id)}" type="button" title="Elimina log">
                        <i class="ph ph-trash" style="color:var(--color-danger);font-size:13px;"></i>
                    </button>
                </div>
                ${l.notes ? `<p class="task-log-notes">${Utils.escapeHtml(l.notes)}</p>` : ''}
                ${l.outcome ? `<span class="task-log-outcome"><i class="ph ph-check-circle"></i> ${Utils.escapeHtml(l.outcome)}</span>` : ''}
                ${l.followup_date ? `<span class="task-log-followup"><i class="ph ph-calendar-check"></i> Follow-up: ${new Date(l.followup_date).toLocaleDateString('it-IT')}</span>` : ''}
            </div>`).join('');

            // Wire delete
            container.querySelectorAll('.task-log-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        await Store.api('deleteTaskLog', 'tasks', { id: btn.dataset.id });
                        UI.toast('Log eliminato', 'info');
                        _loadLogs(taskId, container);
                    } catch (err) {
                        UI.toast(err.message || 'Errore', 'error');
                    }
                });
            });
        } catch (err) {
            container.innerHTML = `<p style="color:var(--color-danger);font-size:13px;">${Utils.escapeHtml(err.message)}</p>`;
        }
    }

    function _openLogModal(taskId, logsContainer) {
        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-2);';
        body.innerHTML = `
        <form id="log-form">
            <div class="form-group">
                <label class="form-label">Data interazione</label>
                <input type="datetime-local" id="log-date" class="form-input"
                    value="${new Date().toISOString().slice(0, 16)}">
            </div>
            <div class="form-group">
                <label class="form-label">Note</label>
                <textarea id="log-notes" class="form-input" rows="3" placeholder="Descrivi l'interazione..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Esito</label>
                <input type="text" id="log-outcome" class="form-input" placeholder="Es. Chiamata effettuata, email inviata...">
            </div>
            <div style="display:flex;align-items:center;gap:var(--sp-2);">
                <input type="checkbox" id="log-followup-check" style="width:auto;">
                <label for="log-followup-check" class="form-label" style="margin:0;">Programma follow-up</label>
            </div>
            <div id="log-followup-date-wrapper" class="hidden">
                <input type="date" id="log-followup-date" class="form-input">
            </div>
            <div id="log-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary" id="log-save-btn">
                <i class="ph ph-plus"></i> Aggiungi Log
            </button>
        </form>`;

        const logModal = UI.modal({ title: 'Aggiungi Interazione', body });

        body.querySelector('#log-followup-check').addEventListener('change', e => {
            body.querySelector('#log-followup-date-wrapper').classList.toggle('hidden', !e.target.checked);
        });

        body.querySelector('#log-form').addEventListener('submit', async e => {
            e.preventDefault();
            const btn = body.querySelector('#log-save-btn');
            const errEl = body.querySelector('#log-error');
            const followupCheck = body.querySelector('#log-followup-check').checked;

            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...';
            errEl.classList.add('hidden');

            try {
                await Store.api('createTaskLog', 'tasks', {
                    task_id: taskId,
                    interaction_date: body.querySelector('#log-date').value.replace('T', ' ') + ':00',
                    notes: body.querySelector('#log-notes').value.trim() || null,
                    outcome: body.querySelector('#log-outcome').value.trim() || null,
                    schedule_followup: followupCheck ? 1 : 0,
                    followup_date: followupCheck ? body.querySelector('#log-followup-date').value || null : null,
                });
                UI.toast('Log aggiunto!', 'success');
                logModal.close();
                _loadLogs(taskId, logsContainer);
            } catch (err) {
                errEl.textContent = err.message || 'Errore';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-plus"></i> Aggiungi Log';
            }
        });
    }

    // ─── DELETE ────────────────────────────────────────────────────────────────

    function _confirmDelete(taskId) {
        const task = _tasks.find(t => t.id === taskId);
        UI.confirm(`Eliminare la task "${task?.title || taskId}"? L'operazione è irreversibile.`, async () => {
            try {
                await Store.api('deleteTask', 'tasks', { id: taskId });
                _tasks = _tasks.filter(t => t.id !== taskId);
                UI.toast('Task eliminata', 'info');
                _render(document.getElementById('app'));
            } catch (err) {
                UI.toast(err.message || 'Errore durante l\'eliminazione', 'error');
            }
        });
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    function _filtered() {
        return _tasks.filter(t => {
            if (_filterStatus && t.status !== _filterStatus) return false;
            if (_filterPriority && t.priority !== _filterPriority) return false;
            if (_search && !t.title?.toLowerCase().includes(_search)
                && !t.notes?.toLowerCase().includes(_search)
                && !t.category?.toLowerCase().includes(_search)) return false;
            return true;
        });
    }

    function _countByStatus() {
        const counts = {};
        _tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
        return counts;
    }

    function destroy() {
        _ac.abort();
        _tasks = [];
        _users = [];
    }

    return { init, destroy };
})();

window.Tasks = Tasks;
