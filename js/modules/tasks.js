"use strict";

/**
 * =========================================
 * Tasks — Area Operativa (Fusion ERP)
 * =========================================
 * Replica funzionalità To-Do di MV ERP:
 * - Card view colorata per categoria / stato
 * - Tab "I miei task" / "Team"
 * - Stats row (Totali, Da fare, In corso, Completati, Scaduti)
 * - Chip filter per Categoria + Stato
 * - Detail view inline con aggiornamento rapido
 * - Log con Esito dropdown, Pianifica Richiamata, Allegati (task + log)
 */

const Tasks = (() => {
    let _abort = new AbortController();

    // ─── Config ──────────────────────────────────────────────────────────────

    const CATEGORIES = [
        { value: 'Interno', label: 'Interno', icon: '🔧', color: '#8b5cf6' },
        { value: 'Atleta', label: 'Atleta', icon: '🏃', color: '#3b82f6' },
        { value: 'Evento', label: 'Evento', icon: '🎯', color: '#f59e0b' },
        { value: 'Marketing', label: 'Marketing', icon: '📣', color: '#ec4899' },
        { value: 'Amministrativo', label: 'Amministrativo', icon: '📋', color: '#14b8a6' },
        { value: 'Altro', label: 'Altro', icon: '📌', color: '#6b7280' },
    ];

    const PRIORITIES = [
        { value: 'Alta', label: 'Alta', color: '#ef4444', icon: 'ph-arrow-up' },
        { value: 'Media', label: 'Media', color: '#f59e0b', icon: 'ph-minus' },
        { value: 'Bassa', label: 'Bassa', color: '#6ee7b7', icon: 'ph-arrow-down' },
    ];

    const STATUSES = [
        { value: 'Da fare', label: 'Da fare', color: '#8892a4' },
        { value: 'In corso', label: 'In corso', color: '#3b82f6' },
        { value: 'In attesa', label: 'In attesa', color: '#6b7280' },
        { value: 'Completato', label: 'Completato', color: '#22c55e' },
        { value: 'Annullato', label: 'Annullato', color: '#ef4444' },
    ];

    const ESITI = [
        'Non ha risposto', 'Interessato', 'Richiamare',
        'Confermato', 'Non interessato', 'In attesa', 'Altro'
    ];

    const ESITO_COLORS = {
        'Interessato': '#22c55e',
        'Confermato': '#22c55e',
        'Richiamare': '#f59e0b',
        'Non ha risposto': '#8892a4',
        'Non interessato': '#ef4444',
        'In attesa': '#6b7280',
        'Altro': '#6366f1',
    };

    // ─── State ───────────────────────────────────────────────────────────────

    let _tasks = [];
    let _users = [];
    let _currentUserId = null;
    let _tab = 'mine';   // 'mine' | 'team'
    let _filterCat = '';
    let _filterStat = '';
    let _search = '';
    let _detailId = null;     // null = list view, string = detail view

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function _catInfo(v) { return CATEGORIES.find(c => c.value === v) || CATEGORIES[0]; }
    function _priInfo(v) { return PRIORITIES.find(p => p.value === v) || PRIORITIES[1]; }
    function _statInfo(v) { return STATUSES.find(s => s.value === v) || STATUSES[0]; }

    function _badge(text, color, filled = true) {
        const bg = filled ? color : 'transparent';
        const fg = filled ? '#fff' : color;
        return `<span class="task-badge" style="background:${bg};color:${fg};border:1px solid ${color};">${Utils.escapeHtml(text)}</span>`;
    }

    function _userName(id) {
        if (!id) return '—';
        return _users.find(u => u.id === id)?.full_name || id;
    }

    function _initials(id) {
        const n = _userName(id);
        if (n === '—') return '?';
        return n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    }

    function _isOverdue(task) {
        return task.due_date
            && !['Completato', 'Annullato'].includes(task.status)
            && new Date(task.due_date) < new Date();
    }

    async function _readFileBase64(file) {
        if (file.size > 5 * 1024 * 1024) {
            UI.toast('Il file non può superare i 5 MB', 'warning');
            return null;
        }
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.onerror = () => rej(new Error('Lettura file fallita'));
            r.readAsDataURL(file);
        });
    }

    // ─── Main render ─────────────────────────────────────────────────────────

    function _render(container) {
        if (_detailId) {
            _renderDetail(container);
        } else {
            _renderList(container);
        }
    }

    function _renderList(container) {
        const now = new Date();

        // Tab filtering
        let tasks = [..._tasks];
        if (_tab === 'mine') {
            tasks = tasks.filter(t => t.user_id === _currentUserId || t.assigned_to === _currentUserId);
        } else {
            tasks = tasks.filter(t => t.user_id !== _currentUserId && t.assigned_to !== _currentUserId);
        }

        // Search
        if (_search) {
            const q = _search.toLowerCase();
            tasks = tasks.filter(t =>
                (t.title || '').toLowerCase().includes(q) ||
                (t.category || '').toLowerCase().includes(q) ||
                (t.notes || '').toLowerCase().includes(q) ||
                _userName(t.assigned_to || t.user_id).toLowerCase().includes(q)
            );
        }

        // Filters
        if (_filterCat) tasks = tasks.filter(t => t.category === _filterCat);
        if (_filterStat) tasks = tasks.filter(t => t.status === _filterStat);

        // Sort: In corso → Da fare → altri; poi priorità; poi scadenza
        const statOrder = { 'In corso': 0, 'Da fare': 1, 'In attesa': 2, 'Completato': 3, 'Annullato': 4 };
        const priOrder = { 'Alta': 0, 'Media': 1, 'Bassa': 2 };
        tasks.sort((a, b) => {
            const ds = (statOrder[a.status] ?? 2) - (statOrder[b.status] ?? 2);
            if (ds !== 0) return ds;
            const dp = (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1);
            if (dp !== 0) return dp;
            const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
            const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
            return da - db;
        });

        // Counts for tab badges (on full unfiltered list)
        const myCount = _tasks.filter(t => t.user_id === _currentUserId || t.assigned_to === _currentUserId).length;
        const teamCount = _tasks.filter(t => t.user_id !== _currentUserId && t.assigned_to !== _currentUserId).length;

        // Stats (on tab-filtered, pre-search/category tasks)
        let tabTasks = [..._tasks];
        if (_tab === 'mine') tabTasks = tabTasks.filter(t => t.user_id === _currentUserId || t.assigned_to === _currentUserId);
        else tabTasks = tabTasks.filter(t => t.user_id !== _currentUserId && t.assigned_to !== _currentUserId);

        const statTotal = tabTasks.length;
        const statDaFare = tabTasks.filter(t => t.status === 'Da fare').length;
        const statInCorso = tabTasks.filter(t => t.status === 'In corso').length;
        const statCompletati = tabTasks.filter(t => t.status === 'Completato').length;
        const statScaduti = tabTasks.filter(t => _isOverdue(t)).length;

        // ── Category chips ──
        const catChips = CATEGORIES.map(c => {
            const active = _filterCat === c.value;
            return `<button class="task-filter-chip${active ? ' active' : ''}" data-cat="${c.value}" style="${active ? `--chip-c:${c.color};` : ''}">${c.icon} ${c.label}</button>`;
        }).join('');

        // ── Status chips ──
        const statChips = STATUSES.map(s => {
            const active = _filterStat === s.value;
            return `<button class="task-filter-chip${active ? ' active' : ''}" data-status="${s.value}" style="${active ? `--chip-c:${s.color};` : ''}">${Utils.escapeHtml(s.label)}</button>`;
        }).join('');

        // ── Cards ──
        const cardsHTML = tasks.length > 0 ? tasks.map(task => {
            const cat = _catInfo(task.category);
            const pri = _priInfo(task.priority);
            const stat = _statInfo(task.status);
            const overdue = _isOverdue(task);
            const done = ['Completato', 'Annullato'].includes(task.status);
            const assigneeId = task.assigned_to || task.user_id;
            const initials = _initials(assigneeId);
            const isMe = assigneeId === _currentUserId;
            const dueLabel = task.due_date
                ? new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
                : null;

            return `
                <div class="task-card${done ? ' completed' : ''}${overdue ? ' overdue' : ''}" data-id="${Utils.escapeHtml(task.id)}" style="--card-border:${stat.color};" tabindex="0" role="button" aria-label="Apri task: ${Utils.escapeHtml(task.title)}">
                    <div class="task-card-header">
                        <span class="task-cat-icon" style="background:${cat.color}20;color:${cat.color};">${cat.icon}</span>
                        <div class="task-card-title-wrap">
                            <div class="task-card-title">${Utils.escapeHtml(task.title)}</div>
                            <div class="task-card-badges">
                                ${_badge(cat.label, cat.color, false)}
                                ${_badge(pri.label, pri.color, true)}
                            </div>
                        </div>
                        ${_badge(stat.label, stat.color, true)}
                    </div>
                    <div class="task-card-footer">
                        <div class="task-card-footer-left">
                            ${dueLabel ? `<span class="task-card-due${overdue ? ' overdue' : ''}"><i class="ph ph-calendar-blank"></i> ${dueLabel}${overdue ? ' <i class="ph ph-warning-circle"></i>' : ''}</span>` : ''}
                            ${task.attachment ? '<span class="task-card-att" title="Allegato"><i class="ph ph-paperclip"></i></span>' : ''}
                        </div>
                        <div class="task-card-assignee" title="${Utils.escapeHtml(_userName(assigneeId))}">
                            <span class="task-assignee-avatar${isMe ? ' is-me' : ''}">${initials}</span>
                        </div>
                    </div>
                </div>`;
        }).join('') : `
            <div class="tasks-empty">
                <i class="ph ph-check-square" style="font-size:48px;opacity:0.15;"></i>
                <p>${_tab === 'mine' ? 'Nessun task personale' : 'Nessun task del team'}</p>
            </div>`;

        container.innerHTML = `
            <div class="tasks-page">

                <!-- Tab mine/team -->
                <div class="todo-tabs">
                    <button class="todo-tab${_tab === 'mine' ? ' active' : ''}" data-tab="mine">
                        <i class="ph ph-user"></i> I miei task <span class="todo-tab-count">${myCount}</span>
                    </button>
                    <button class="todo-tab${_tab === 'team' ? ' active' : ''}" data-tab="team">
                        <i class="ph ph-users"></i> Team <span class="todo-tab-count">${teamCount}</span>
                    </button>
                </div>

                <!-- Stats -->
                <div class="todo-stats-row">
                    <div class="todo-stat"><div class="todo-stat-value">${statTotal}</div><div class="todo-stat-label">Totali</div></div>
                    <div class="todo-stat"><div class="todo-stat-value" style="color:#8892a4">${statDaFare}</div><div class="todo-stat-label">Da fare</div></div>
                    <div class="todo-stat"><div class="todo-stat-value" style="color:#3b82f6">${statInCorso}</div><div class="todo-stat-label">In corso</div></div>
                    <div class="todo-stat"><div class="todo-stat-value" style="color:#22c55e">${statCompletati}</div><div class="todo-stat-label">Completati</div></div>
                    ${statScaduti > 0 ? `<div class="todo-stat"><div class="todo-stat-value" style="color:#ef4444">⚠ ${statScaduti}</div><div class="todo-stat-label">Scaduti</div></div>` : ''}
                </div>

                <!-- Toolbar -->
                <div class="tasks-title-row" style="margin-bottom:0;">
                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                        <i class="ph ph-check-square" style="color:var(--color-primary);"></i>
                        Task &amp; Attività
                    </h1>
                    <button class="btn btn-primary" id="btn-new-task" type="button">
                        <i class="ph ph-plus"></i> Nuova Task
                    </button>
                </div>

                <!-- Search -->
                <div class="tasks-filter-row" style="margin-top:var(--sp-2);">
                    <div class="search-input-wrapper" style="flex:1;max-width:340px;">
                        <i class="ph ph-magnifying-glass search-icon"></i>
                        <input type="search" id="tasks-search" class="form-input" placeholder="Cerca task..."
                            value="${Utils.escapeHtml(_search)}" style="padding-left:36px;">
                    </div>
                </div>

                <!-- Chip filters -->
                <div class="todo-filter-group" style="margin-bottom:var(--sp-1);">
                    <span class="todo-filter-label">Categoria:</span>
                    ${catChips}
                </div>
                <div class="todo-filter-group">
                    <span class="todo-filter-label">Stato:</span>
                    ${statChips}
                </div>

                <!-- Cards -->
                <div class="todo-cards-list" id="tasks-cards">
                    ${cardsHTML}
                </div>
            </div>`;

        _bindListEvents(container);
    }

    // ─── Detail view ─────────────────────────────────────────────────────────

    async function _renderDetail(container) {
        const task = _tasks.find(t => t.id === _detailId);
        if (!task) { _detailId = null; _renderList(container); return; }

        const cat = _catInfo(task.category);
        const pri = _priInfo(task.priority);
        const stat = _statInfo(task.status);
        const overdue = _isOverdue(task);

        // Status/Priority/Assignee selects
        const statOpts = STATUSES.map(s =>
            `<option value="${s.value}"${task.status === s.value ? ' selected' : ''}>${s.label}</option>`
        ).join('');
        const priOpts = PRIORITIES.map(p =>
            `<option value="${p.value}"${task.priority === p.value ? ' selected' : ''}>${p.label}</option>`
        ).join('');
        const assignOpts = _users.map(u =>
            `<option value="${u.id}"${task.assigned_to === u.id ? ' selected' : ''}>${Utils.escapeHtml(u.full_name)}</option>`
        ).join('');

        // Fetch logs
        let logs = [];
        try {
            const res = await Store.get('listTaskLogs', 'tasks', { task_id: _detailId });
            logs = res?.logs || [];
        } catch (e) { /* ignore */ }

        // Esito options
        const esitoOpts = ['', ...ESITI].map(e =>
            `<option value="${e}">${e || '— Seleziona esito —'}</option>`
        ).join('');

        // Logs HTML
        const logsHTML = logs.length > 0 ? logs.map(log => {
            const esitoVal = log.esito || log.outcome || '';
            const esitoColor = ESITO_COLORS[esitoVal] || '#6366f1';
            const logDate = new Date(log.interaction_date || log.created_at)
                .toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="task-log-entry">
                    <div class="task-log-dot"></div>
                    <div class="task-log-content">
                        <div class="task-log-header">
                            <span class="task-log-date">${logDate}</span>
                            ${esitoVal ? _badge(esitoVal, esitoColor, true) : ''}
                            <button class="btn btn-ghost btn-xs task-log-delete" data-log-id="${Utils.escapeHtml(log.id)}" title="Elimina" type="button">
                                <i class="ph ph-trash" style="color:var(--color-danger);font-size:13px;"></i>
                            </button>
                        </div>
                        ${log.notes ? `<p class="task-log-notes">${Utils.escapeHtml(log.notes)}</p>` : ''}
                        ${(log.schedule_followup && log.followup_date) ? `<div class="task-log-followup"><i class="ph ph-calendar-check"></i> Richiamata: <strong>${new Date(log.followup_date).toLocaleDateString('it-IT')}</strong></div>` : ''}
                        ${log.attachment ? `
                            <div class="task-log-attachment">
                                <i class="ph ph-paperclip"></i>
                                <button class="btn btn-ghost btn-sm task-log-view-att" data-att="${Utils.escapeHtml(log.id)}" type="button">Visualizza allegato</button>
                            </div>` : ''}
                    </div>
                </div>`;
        }).join('') : `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:var(--sp-2) 0;">Nessun log ancora. Aggiungi il primo aggiornamento.</p>`;

        const dueStr = task.due_date
            ? new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
            : null;

        container.innerHTML = `
            <div class="tasks-page">
                <!-- Back button -->
                <button class="btn btn-ghost btn-sm" id="btn-back-list" type="button" style="margin-bottom:var(--sp-2);">
                    <i class="ph ph-arrow-left"></i> Torna alla lista
                </button>

                <!-- Task card detail -->
                <div class="task-detail-card">
                    <div class="task-detail-header">
                        <span class="task-cat-icon" style="background:${cat.color}20;color:${cat.color};font-size:1.5rem;width:48px;height:48px;">${cat.icon}</span>
                        <div style="flex:1;">
                            <h2 class="task-detail-title">${Utils.escapeHtml(task.title)}</h2>
                            <div class="task-card-badges" style="margin-top:6px;">
                                ${_badge(cat.label, cat.color, false)}
                                ${_badge(pri.label, pri.color, true)}
                                ${_badge(stat.label, stat.color, true)}
                                ${overdue ? _badge('⚠ SCADUTO', '#ef4444', true) : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Meta -->
                    <div class="task-detail-meta">
                        <div class="task-detail-meta-item">
                            <span class="task-detail-meta-label">Creato da</span>
                            <span>${Utils.escapeHtml(_userName(task.user_id))}</span>
                        </div>
                        <div class="task-detail-meta-item">
                            <span class="task-detail-meta-label">Assegnato a</span>
                            <span>${Utils.escapeHtml(_userName(task.assigned_to || task.user_id))}</span>
                        </div>
                        ${dueStr ? `<div class="task-detail-meta-item"><span class="task-detail-meta-label">Scadenza</span><span${overdue ? ' style="color:var(--color-danger);"' : ''}>${dueStr}</span></div>` : ''}
                    </div>

                    ${task.notes ? `<div class="task-detail-notes">${Utils.escapeHtml(task.notes)}</div>` : ''}

                    ${task.attachment ? `
                    <div class="task-detail-attachment">
                        <i class="ph ph-paperclip"></i>
                        <button class="btn btn-ghost btn-sm" id="btn-view-task-att" type="button">Visualizza allegato</button>
                        <button class="btn btn-ghost btn-sm" id="btn-remove-task-att" type="button" style="color:var(--color-danger);">Rimuovi</button>
                    </div>` : ''}

                    <!-- Quick update -->
                    <div class="task-detail-actions">
                        <label class="task-inline-field">
                            <span>Stato</span>
                            <select id="qk-status">${statOpts}</select>
                        </label>
                        <label class="task-inline-field">
                            <span>Priorità</span>
                            <select id="qk-priority">${priOpts}</select>
                        </label>
                        <label class="task-inline-field">
                            <span>Assegnato a</span>
                            <select id="qk-assignee">${assignOpts}</select>
                        </label>
                        <button class="btn btn-secondary btn-sm" id="btn-edit-task" type="button">
                            <i class="ph ph-pencil"></i> Modifica
                        </button>
                        <button class="btn btn-ghost btn-sm" id="btn-delete-task" type="button" style="color:var(--color-danger);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>

                <!-- Add log form -->
                <div class="task-add-log-card">
                    <h3 class="task-section-title"><i class="ph ph-plus-circle"></i> Aggiungi Aggiornamento</h3>
                    <form id="task-log-form">
                        <div class="task-log-form-row">
                            <div class="form-group" style="margin:0;flex:1;">
                                <label class="form-label">Data interazione</label>
                                <input type="datetime-local" id="log-date" class="form-input"
                                    value="${new Date().toISOString().slice(0, 16)}" required>
                            </div>
                            <div class="form-group" style="margin:0;flex:1;">
                                <label class="form-label">Esito</label>
                                <select id="log-esito" class="form-input">${esitoOpts}</select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Note</label>
                            <textarea id="log-notes" class="form-input" rows="3" placeholder="Cosa è stato fatto o detto..."></textarea>
                        </div>
                        <!-- Toggle richiamata -->
                        <div class="task-callback-row">
                            <label class="task-switch-label">
                                <span><i class="ph ph-calendar-check"></i> Pianifica Richiamata</span>
                                <div class="task-switch">
                                    <input type="checkbox" id="log-callback-toggle">
                                    <span class="task-switch-slider"></span>
                                </div>
                            </label>
                            <div id="log-callback-date-wrap" class="hidden">
                                <div class="form-group" style="margin:0;margin-top:var(--sp-1);">
                                    <label class="form-label">Data Richiamata</label>
                                    <input type="datetime-local" id="log-callback-date" class="form-input">
                                </div>
                            </div>
                        </div>
                        <!-- Allegato -->
                        <div class="form-group">
                            <label class="form-label"><i class="ph ph-paperclip"></i> Allegato</label>
                            <input type="file" id="log-file" class="form-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="padding:8px;">
                        </div>
                        <div id="log-error" class="form-error hidden" aria-live="polite"></div>
                        <button type="submit" class="btn btn-primary" id="log-submit-btn">
                            <i class="ph ph-floppy-disk"></i> Salva Aggiornamento
                        </button>
                    </form>
                </div>

                <!-- Log timeline -->
                <div class="task-logs-section">
                    <h3 class="task-section-title"><i class="ph ph-clock-clockwise"></i> Cronologia (${logs.length})</h3>
                    <div class="task-log-timeline" id="task-log-timeline">
                        ${logsHTML}
                    </div>
                </div>
            </div>`;

        _bindDetailEvents(container, task, logs);
    }

    // ─── Task Form (modal) ────────────────────────────────────────────────────

    function _openTaskForm(taskId) {
        const task = taskId ? _tasks.find(t => t.id === taskId) : null;
        const isEdit = !!task;

        const catOpts = CATEGORIES.map(c =>
            `<option value="${c.value}"${(task?.category || 'Interno') === c.value ? ' selected' : ''}>${c.icon} ${c.label}</option>`
        ).join('');
        const priOpts = PRIORITIES.map(p =>
            `<option value="${p.value}"${(task?.priority || 'Media') === p.value ? ' selected' : ''}>${p.label}</option>`
        ).join('');
        const statOpts = STATUSES.map(s =>
            `<option value="${s.value}"${(task?.status || 'Da fare') === s.value ? ' selected' : ''}>${s.label}</option>`
        ).join('');
        const assignOpts = `<option value="">— Nessuno —</option>` + _users.map(u =>
            `<option value="${u.id}"${task?.assigned_to === u.id ? ' selected' : ''}>${Utils.escapeHtml(u.full_name)}</option>`
        ).join('');

        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-2);';
        body.innerHTML = `
            <form id="task-modal-form" style="display:flex;flex-direction:column;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Titolo *</label>
                    <input type="text" id="tf-title" class="form-input" required
                        value="${Utils.escapeHtml(task?.title || '')}" placeholder="Titolo della task">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Categoria</label>
                        <select id="tf-category" class="form-input">${catOpts}</select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Priorità</label>
                        <select id="tf-priority" class="form-input">${priOpts}</select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Stato</label>
                        <select id="tf-status" class="form-input">${statOpts}</select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Assegnata a</label>
                        <select id="tf-assigned" class="form-input">${assignOpts}</select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label class="form-label">Scadenza</label>
                        <input type="date" id="tf-due" class="form-input"
                            value="${task?.due_date ? task.due_date.split('T')[0] : ''}">
                    </div>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Note</label>
                    <textarea id="tf-notes" class="form-input" rows="3" style="resize:vertical;">${Utils.escapeHtml(task?.notes || '')}</textarea>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label"><i class="ph ph-paperclip"></i> Allegato ${task?.attachment ? '<span style="color:var(--color-success);font-size:0.7rem;">✓ già presente</span>' : ''}</label>
                    <input type="file" id="tf-attachment" class="form-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="padding:8px;">
                    ${task?.attachment ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Seleziona file per sostituire, oppure lascia vuoto per mantenere il corrente.</div>' : ''}
                </div>
                <div id="tf-error" class="form-error hidden" aria-live="polite"></div>
                <button type="submit" class="btn btn-primary" id="tf-submit">
                    ${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Crea Task'}
                </button>
            </form>`;

        const modal = UI.modal({ title: isEdit ? `Modifica: ${task.title}` : 'Nuova Task', body, size: 'lg' });

        body.querySelector('#task-modal-form').addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = body.querySelector('#tf-error');
            const submitBtn = body.querySelector('#tf-submit');
            const title = body.querySelector('#tf-title').value.trim();
            if (!title) { errEl.textContent = 'Il titolo è obbligatorio'; errEl.classList.remove('hidden'); return; }

            const data = {
                title,
                category: body.querySelector('#tf-category').value,
                priority: body.querySelector('#tf-priority').value,
                status: body.querySelector('#tf-status').value,
                due_date: body.querySelector('#tf-due').value || null,
                notes: body.querySelector('#tf-notes').value.trim() || null,
                assigned_to: body.querySelector('#tf-assigned').value || null,
            };

            // Attachment
            const fileEl = body.querySelector('#tf-attachment');
            if (fileEl.files.length > 0) {
                data.attachment = await _readFileBase64(fileEl.files[0]);
                if (!data.attachment) return;
            } else if (isEdit && task.attachment) {
                // keep existing — don't send attachment field
            } else {
                data.attachment = null;
            }

            submitBtn.disabled = true;
            errEl.classList.add('hidden');
            try {
                if (isEdit) {
                    await Store.api('updateTask', 'tasks', { id: taskId, ...data });
                    const idx = _tasks.findIndex(t => t.id === taskId);
                    if (idx !== -1) _tasks[idx] = { ..._tasks[idx], ...data };
                    UI.toast('Task aggiornata!', 'success');
                } else {
                    const res = await Store.api('createTask', 'tasks', data);
                    _tasks.unshift({ ...data, id: res.id, user_id: _currentUserId, created_at: new Date().toISOString() });
                    UI.toast('Task creata!', 'success');
                }
                modal.close();
                _render(document.getElementById('app'));
            } catch (err) {
                errEl.textContent = err.message || 'Errore durante il salvataggio';
                errEl.classList.remove('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    // ─── Attachment viewer ────────────────────────────────────────────────────

    function _viewAttachment(dataUri, filename) {
        if (!dataUri) return;
        const match = dataUri.match(/^data:([^;]+);/);
        if (!match) { UI.toast('Formato non supportato', 'error'); return; }
        const mime = match[1];

        let contentHTML = '';
        let blobUrl = null;

        if (mime === 'application/pdf') {
            const bytes = atob(dataUri.split(',')[1]);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            blobUrl = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
            contentHTML = `<iframe src="${blobUrl}" style="width:100%;height:100%;border:none;border-radius:8px;"></iframe>`;
        } else if (mime.startsWith('image/')) {
            contentHTML = `<img src="${dataUri}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">`;
        } else {
            contentHTML = `<div style="text-align:center;padding:60px 30px;">
                <div style="font-size:4rem;margin-bottom:16px;">📄</div>
                <p style="color:#9ca3af;font-size:1rem;margin-bottom:20px;">Anteprima non disponibile per questo formato.</p>
                <button id="att-dl-alt" class="btn btn-primary" style="padding:10px 24px;">⬇️ Scarica File</button>
            </div>`;
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
        overlay.innerHTML = `
            <div style="position:absolute;top:16px;right:20px;display:flex;gap:10px;z-index:10001;">
                <button id="att-dl" style="background:rgba(255,255,255,0.12);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;">⬇️ SCARICA</button>
                <button id="att-close" style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1.2rem;">✕</button>
            </div>
            <div style="width:90%;height:85%;display:flex;align-items:center;justify-content:center;">${contentHTML}</div>`;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.remove(); if (blobUrl) URL.revokeObjectURL(blobUrl); }, 200);
        };

        overlay.querySelector('#att-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        const dl = () => {
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = filename || 'allegato';
            a.click();
        };
        overlay.querySelector('#att-dl').addEventListener('click', dl);
        const dlAlt = overlay.querySelector('#att-dl-alt');
        if (dlAlt) dlAlt.addEventListener('click', dl);

        const esc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
        document.addEventListener('keydown', esc);
    }

    // ─── Event binding ────────────────────────────────────────────────────────

    function _bindListEvents(container) {
        const app = document.getElementById('app');
        if (!app) return;
        const sig = { signal: _abort.signal };

        app.querySelector('#btn-new-task')?.addEventListener('click', () => _openTaskForm(null), sig);

        app.querySelector('#tasks-search')?.addEventListener('input', e => {
            _search = e.target.value.trim().toLowerCase();
            _render(app);
        }, sig);

        // Tab switch
        app.querySelectorAll('.todo-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                _tab = btn.dataset.tab;
                _search = '';
                _filterCat = '';
                _filterStat = '';
                _render(app);
            }, sig);
        });

        // Category chips
        app.querySelectorAll('[data-cat]').forEach(btn => {
            btn.addEventListener('click', () => {
                _filterCat = _filterCat === btn.dataset.cat ? '' : btn.dataset.cat;
                _render(app);
            }, sig);
        });

        // Status chips
        app.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', () => {
                _filterStat = _filterStat === btn.dataset.status ? '' : btn.dataset.status;
                _render(app);
            }, sig);
        });

        // Open detail
        app.querySelector('#tasks-cards')?.addEventListener('click', e => {
            const card = e.target.closest('.task-card');
            if (card) { _detailId = card.dataset.id; _render(app); }
        }, sig);

        app.querySelector('#tasks-cards')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const card = e.target.closest('.task-card');
                if (card) { _detailId = card.dataset.id; _render(app); }
            }
        }, sig);
    }

    function _bindDetailEvents(container, task, logs) {
        const app = document.getElementById('app');
        if (!app) return;
        const sig = { signal: _abort.signal };

        // Back
        app.querySelector('#btn-back-list')?.addEventListener('click', () => {
            _detailId = null;
            _render(app);
        }, sig);

        // Quick update — status
        app.querySelector('#qk-status')?.addEventListener('change', async e => {
            try {
                await Store.api('updateTask', 'tasks', { id: task.id, status: e.target.value });
                const t = _tasks.find(x => x.id === task.id);
                if (t) t.status = e.target.value;
                UI.toast('Stato aggiornato', 'success');
                if (e.target.value === 'Completato') UI.toast('🎉 Task completata!', 'success');
            } catch (err) { UI.toast(err.message || 'Errore', 'error'); }
        }, sig);

        // Quick update — priority
        app.querySelector('#qk-priority')?.addEventListener('change', async e => {
            try {
                await Store.api('updateTask', 'tasks', { id: task.id, priority: e.target.value });
                const t = _tasks.find(x => x.id === task.id);
                if (t) t.priority = e.target.value;
                UI.toast('Priorità aggiornata', 'success');
            } catch (err) { UI.toast(err.message || 'Errore', 'error'); }
        }, sig);

        // Quick update — assignee
        app.querySelector('#qk-assignee')?.addEventListener('change', async e => {
            try {
                await Store.api('updateTask', 'tasks', { id: task.id, assigned_to: e.target.value || null });
                const t = _tasks.find(x => x.id === task.id);
                if (t) t.assigned_to = e.target.value || null;
                UI.toast('Assegnato aggiornato', 'success');
            } catch (err) { UI.toast(err.message || 'Errore', 'error'); }
        }, sig);

        // Edit
        app.querySelector('#btn-edit-task')?.addEventListener('click', () => _openTaskForm(task.id), sig);

        // Delete task
        app.querySelector('#btn-delete-task')?.addEventListener('click', () => {
            UI.confirm(`Eliminare la task "${task.title}"? L'operazione è irreversibile.`, async () => {
                try {
                    await Store.api('deleteTask', 'tasks', { id: task.id });
                    _tasks = _tasks.filter(t => t.id !== task.id);
                    _detailId = null;
                    UI.toast('Task eliminata', 'info');
                    _render(app);
                } catch (err) { UI.toast(err.message || 'Errore', 'error'); }
            });
        }, sig);

        // View task attachment
        app.querySelector('#btn-view-task-att')?.addEventListener('click', () => {
            _viewAttachment(task.attachment, `allegato_${task.title.substring(0, 20)}`);
        }, sig);

        // Remove task attachment
        app.querySelector('#btn-remove-task-att')?.addEventListener('click', () => {
            UI.confirm('Rimuovere l\'allegato dal task?', async () => {
                await Store.api('updateTask', 'tasks', { id: task.id, attachment: null });
                const t = _tasks.find(x => x.id === task.id);
                if (t) t.attachment = null;
                UI.toast('Allegato rimosso', 'info');
                _detailId = task.id;
                _render(app);
            });
        }, sig);

        // Toggle callback date
        app.querySelector('#log-callback-toggle')?.addEventListener('change', e => {
            app.querySelector('#log-callback-date-wrap')?.classList.toggle('hidden', !e.target.checked);
        }, sig);

        // Submit log form
        app.querySelector('#task-log-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const errEl = app.querySelector('#log-error');
            const btn = app.querySelector('#log-submit-btn');
            const dateVal = app.querySelector('#log-date').value;
            if (!dateVal) {
                errEl.textContent = 'La data è obbligatoria';
                errEl.classList.remove('hidden');
                return;
            }

            const callbackOn = app.querySelector('#log-callback-toggle').checked;
            const logData = {
                task_id: task.id,
                interaction_date: dateVal.replace('T', ' ') + ':00',
                notes: app.querySelector('#log-notes').value.trim() || null,
                esito: app.querySelector('#log-esito').value || null,
                outcome: app.querySelector('#log-esito').value || null, // backward compat
                schedule_followup: callbackOn ? 1 : 0,
                followup_date: callbackOn ? (app.querySelector('#log-callback-date').value || null) : null,
            };

            // File
            const fileEl = app.querySelector('#log-file');
            if (fileEl?.files.length > 0) {
                logData.attachment = await _readFileBase64(fileEl.files[0]);
                if (!logData.attachment) return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...';
            errEl.classList.add('hidden');

            try {
                await Store.api('createTaskLog', 'tasks', logData);
                // If callback set, update due_date on task
                if (callbackOn && logData.followup_date) {
                    await Store.api('updateTask', 'tasks', { id: task.id, due_date: logData.followup_date });
                    const t = _tasks.find(x => x.id === task.id);
                    if (t) t.due_date = logData.followup_date;
                }
                UI.toast('Aggiornamento salvato!', 'success');
                _render(app); // refresh detail
            } catch (err) {
                errEl.textContent = err.message || 'Errore';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salva Aggiornamento';
            }
        }, sig);

        // Log delete
        app.querySelectorAll('.task-log-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await Store.api('deleteTaskLog', 'tasks', { id: btn.dataset.logId });
                    UI.toast('Log eliminato', 'info');
                    _render(app);
                } catch (err) { UI.toast(err.message || 'Errore', 'error'); }
            });
        });

        // Log attachment view
        app.querySelectorAll('.task-log-view-att').forEach(btn => {
            btn.addEventListener('click', () => {
                const log = logs.find(l => l.id === btn.dataset.att);
                if (log?.attachment) _viewAttachment(log.attachment, `log_${log.id}`);
            });
        });
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    return {
        async init() {
            _abort = new AbortController();
            _detailId = null;
            _tab = 'mine';
            _search = '';
            _filterCat = '';
            _filterStat = '';

            const app = document.getElementById('app');
            if (!app) return;
            app.innerHTML = UI.skeletonPage();

            try {
                const [tasksRes, usersRes, meRes] = await Promise.all([
                    Store.get('listTasks', 'tasks'),
                    Store.get('listUsers', 'auth').catch(() => ({ users: [] })),
                    Store.get('me', 'auth').catch(() => null),
                ]);

                _tasks = tasksRes?.tasks || [];
                _users = usersRes?.users || usersRes || [];
                _currentUserId = meRes?.user?.id || meRes?.id || null;

                _render(app);
            } catch (err) {
                console.error('[Tasks] Init error:', err);
                app.innerHTML = Utils.emptyState('Errore nel caricamento', err.message, 'Riprova', null, () => this.init());
            }
        },

        destroy() {
            _abort.abort();
            _tasks = [];
            _users = [];
        }
    };
})();

window.Tasks = Tasks;