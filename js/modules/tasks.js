"use strict";

const Tasks = (() => {
  let _abort = new AbortController();
  
  const CATEGORIES = [
    { value: "Interno", label: "Interno", icon: "🔧", color: "#8b5cf6" },
    { value: "Atleta", label: "Atleta", icon: "🏃", color: "#3b82f6" },
    { value: "Evento", label: "Evento", icon: "🎯", color: "#f59e0b" },
    { value: "Marketing", label: "Marketing", icon: "📣", color: "#ec4899" },
    { value: "Amministrativo", label: "Amministrativo", icon: "📋", color: "#14b8a6" },
    { value: "Altro", label: "Altro", icon: "📌", color: "#6b7280" },
  ];

  const PRIORITIES = [
    { value: "Alta", label: "Alta", color: "#ef4444", icon: "ph-arrow-up" },
    { value: "Media", label: "Media", color: "#f59e0b", icon: "ph-minus" },
    { value: "Bassa", label: "Bassa", color: "#6ee7b7", icon: "ph-arrow-down" },
  ];

  const STATUSES = [
    { value: "Da fare", label: "Da fare", color: "#8892a4" },
    { value: "In corso", label: "In corso", color: "#3b82f6" },
    { value: "In attesa", label: "In attesa", color: "#6b7280" },
    { value: "Completato", label: "Completato", color: "#22c55e" },
    { value: "Annullato", label: "Annullato", color: "#ef4444" },
  ];

  const OUTCOMES = [
    "Non ha risposto",
    "Interessato",
    "Richiamare",
    "Confermato",
    "Non interessato",
    "In attesa",
    "Altro",
  ];

  const OUTCOME_COLORS = {
    Interessato: "#22c55e",
    Confermato: "#22c55e",
    Richiamare: "#f59e0b",
    "Non ha risposto": "#8892a4",
    "Non interessato": "#ef4444",
    "In attesa": "#6b7280",
    Altro: "#6366f1",
  };

  let _tasks = [];
  let _users = [];
  let _currentUserId = null;
  let _currentView = "mine"; // "mine" or "team"
  let _filterCategory = "";
  let _filterStatus = "";
  let _searchQuery = "";
  let _currentTaskId = null; // null = list view

  /**
   * HELPERS
   */
  function sig() { return { signal: _abort.signal }; }
  
  function getCategory(val) { return CATEGORIES.find(c => c.value === val) || CATEGORIES[0]; }
  function getPriority(val) { return PRIORITIES.find(p => p.value === val) || PRIORITIES[1]; }
  function getStatus(val) { return STATUSES.find(s => s.value === val) || STATUSES[0]; }
  
  function renderBadge(label, color, fill = true) {
    return `<span class="task-badge" style="background:${fill ? color : "transparent"};color:${fill ? "#fff" : color};border:1px solid ${color};">${Utils.escapeHtml(label)}</span>`;
  }

  function getUserName(id) {
    if (!id) return "—";
    const u = _users.find(u => u.id === id);
    return u?.full_name || id;
  }

  function isOverdue(task) {
    if (!task.due_date) return false;
    if (["Completato", "Annullato"].includes(task.status)) return false;
    return new Date(task.due_date) < new Date();
  }

  async function readFileAsBase64(file) {
    if (file.size > 5 * 1024 * 1024) {
      UI.toast("Il file non può superare i 5 MB", "warning");
      return null;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Lettura file fallita"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * MAIN RENDERER
   */
  function render() {
    const container = document.getElementById("app");
    if (!container) return;

    if (_currentTaskId) {
      renderTaskDetail(container);
    } else {
      renderTaskList(container);
    }
  }

  /**
   * VIEW: TASK DETAIL
   */
  async function renderTaskDetail(container) {
    const task = _tasks.find(t => t.id === _currentTaskId);
    if (!task) {
      _currentTaskId = null;
      renderTaskList(container);
      return;
    }

    const catInfo = getCategory(task.category);
    const prioInfo = getPriority(task.priority);
    const statInfo = getStatus(task.status);
    const overdue = isOverdue(task);
    
    // Preparation for dropdowns
    const statusOpts = STATUSES.map(s => `<option value="${s.value}"${task.status === s.value ? " selected" : ""}>${s.label}</option>`).join("");
    const prioOpts = PRIORITIES.map(p => `<option value="${p.value}"${task.priority === p.value ? " selected" : ""}>${p.label}</option>`).join("");
    const userOpts = _users.map(u => `<option value="${u.id}"${task.assigned_to === u.id ? " selected" : ""}>${Utils.escapeHtml(u.full_name)}</option>`).join("");
    
    // Fetch logs (using cache if possible or fresh fetch)
    let logs = [];
    try {
      const res = await Store.get("listTaskLogs", "tasks", { task_id: _currentTaskId });
      logs = res?.logs || [];
    } catch (err) { console.error("[Tasks] Logs load error:", err); }

    const outcomeOpts = ["", ...OUTCOMES].map(o => `<option value="${o}">${o || "— Seleziona esito —"}</option>`).join("");
    
    const logsHtml = logs.length > 0
      ? logs.map(l => {
          const outcome = l.esito || l.outcome || "";
          const color = OUTCOME_COLORS[outcome] || "#6366f1";
          return `
            <div class="task-log-entry">
                <div class="task-log-dot"></div>
                <div class="task-log-content">
                    <div class="task-log-header">
                        <span class="task-log-date">${new Date(l.interaction_date || l.created_at).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        ${outcome ? renderBadge(outcome, color, true) : ""}
                        <button class="btn btn-ghost btn-xs btn-delete-log" data-id="${Utils.escapeHtml(l.id)}" title="Elimina" type="button">
                            <i class="ph ph-trash" style="color:var(--color-danger);font-size:13px;"></i>
                        </button>
                    </div>
                    ${l.notes ? `<p class="task-log-notes">${Utils.escapeHtml(l.notes)}</p>` : ""}
                    ${l.schedule_followup && l.followup_date ? `<div class="task-log-followup"><i class="ph ph-calendar-check"></i> Richiamata: <strong>${new Date(l.followup_date).toLocaleDateString("it-IT")}</strong></div>` : ""}
                    ${l.attachment ? `
                        <div class="task-log-attachment">
                            <i class="ph ph-paperclip"></i>
                            <button class="btn btn-ghost btn-sm btn-view-log-att" data-id="${Utils.escapeHtml(l.id)}" type="button">Visualizza allegato</button>
                        </div>` : ""}
                </div>
            </div>`;
        }).join("")
      : '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:var(--sp-2) 0;">Nessun log ancora. Aggiungi il primo aggiornamento.</p>';

    const dueDateFormatted = task.due_date ? new Date(task.due_date).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric"}) : null;

    container.innerHTML = `
        <div class="transport-dashboard" style="min-height:100vh;">
            <button class="btn btn-ghost btn-sm" id="btn-back-list" type="button" style="margin-bottom:var(--sp-2);">
                <i class="ph ph-arrow-left"></i> Torna alla lista
            </button>

            <div class="dash-card">
                <div class="task-detail-header">
                    <span class="task-cat-icon" style="background:${catInfo.color}20;color:${catInfo.color};font-size:1.5rem;width:48px;height:48px;">${catInfo.icon}</span>
                    <div style="flex:1;">
                        <h2 class="task-detail-title">${Utils.escapeHtml(task.title)}</h2>
                        <div class="task-card-badges" style="margin-top:6px;">
                            ${renderBadge(catInfo.label, catInfo.color, false)}
                            ${renderBadge(prioInfo.label, prioInfo.color, true)}
                            ${renderBadge(statInfo.label, statInfo.color, true)}
                            ${overdue ? renderBadge("⚠ SCADUTO", "#ef4444", true) : ""}
                        </div>
                    </div>
                </div>

                <div class="task-detail-meta">
                    <div class="task-detail-meta-item">
                        <span class="task-detail-meta-label">Creato da</span>
                        <span>${Utils.escapeHtml(getUserName(task.user_id))}</span>
                    </div>
                    <div class="task-detail-meta-item">
                        <span class="task-detail-meta-label">Assegnato a</span>
                        <span>${Utils.escapeHtml(getUserName(task.assigned_to || task.user_id))}</span>
                    </div>
                    ${dueDateFormatted ? `<div class="task-detail-meta-item"><span class="task-detail-meta-label">Scadenza</span><span${overdue ? ' style="color:var(--color-danger);"' : ""}>${dueDateFormatted}</span></div>` : ""}
                </div>

                ${task.notes ? `<div class="task-detail-notes">${Utils.escapeHtml(task.notes)}</div>` : ""}

                ${task.attachment ? `
                <div class="task-detail-attachment">
                    <i class="ph ph-paperclip"></i>
                    <button class="btn btn-ghost btn-sm" id="btn-view-task-att" type="button">Visualizza allegato</button>
                    <button class="btn btn-ghost btn-sm" id="btn-remove-task-att" type="button" style="color:var(--color-danger);">Rimuovi</button>
                </div>` : ""}

                <div class="task-detail-actions">
                    <label class="task-inline-field">
                        <span>Stato</span>
                        <select id="qk-status">${statusOpts}</select>
                    </label>
                    <label class="task-inline-field">
                        <span>Priorità</span>
                        <select id="qk-priority">${prioOpts}</select>
                    </label>
                    <label class="task-inline-field">
                        <span>Assegnato a</span>
                        <select id="qk-assignee">${userOpts}</select>
                    </label>
                    <button class="btn-dash" id="btn-edit-task" type="button" style="padding:6px 12px;font-size:12px;"><i class="ph ph-pencil"></i> Modifica</button>
                    <button class="btn btn-ghost btn-sm" id="btn-delete-task" type="button" style="color:var(--color-danger);"><i class="ph ph-trash"></i></button>
                </div>
            </div>

            <div class="dash-card" style="margin-top:24px;">
                <h3 class="task-section-title"><i class="ph ph-plus-circle"></i> Aggiungi Aggiornamento</h3>
                <form id="task-log-form">
                    <div class="task-log-form-row">
                        <div class="form-group" style="margin:0;flex:1;">
                            <label class="form-label">Data interazione</label>
                            <input type="datetime-local" id="log-date" class="form-input" value="${new Date().toISOString().slice(0, 16)}" required>
                        </div>
                        <div class="form-group" style="margin:0;flex:1;">
                            <label class="form-label">Esito</label>
                            <select id="log-esito" class="form-input">${outcomeOpts}</select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Note</label>
                        <textarea id="log-notes" class="form-input" rows="3" placeholder="Cosa è stato fatto o detto..."></textarea>
                    </div>
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
                    <div class="form-group">
                        <label class="form-label"><i class="ph ph-paperclip"></i> Allegato</label>
                        <input type="file" id="log-file" class="form-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="padding:8px;">
                    </div>
                    <div id="log-error" class="form-error hidden"></div>
                    <button type="submit" class="btn btn-primary" id="log-submit-btn"><i class="ph ph-floppy-disk"></i> Salva Aggiornamento</button>
                </form>
            </div>

            <div class="task-logs-section">
                <h3 class="task-section-title"><i class="ph ph-clock-clockwise"></i> Cronologia (${logs.length})</h3>
                <div class="task-log-timeline" id="task-log-timeline">${logsHtml}</div>
            </div>
        </div>`;

    // --- Detail Event Handlers ---
    container.querySelector("#btn-back-list")?.addEventListener("click", () => { _currentTaskId = null; render(); }, sig());
    
    container.querySelector("#qk-status")?.addEventListener("change", async (e) => {
      try {
        await Store.api("updateTask", "tasks", { id: task.id, status: e.target.value });
        task.status = e.target.value;
        UI.toast("Stato aggiornato", "success");
        if (task.status === "Completato") UI.toast("🎉 Task completata!", "success");
        render();
      } catch (err) { UI.toast(err.message, "error"); }
    }, sig());

    container.querySelector("#qk-priority")?.addEventListener("change", async (e) => {
      try {
        await Store.api("updateTask", "tasks", { id: task.id, priority: e.target.value });
        task.priority = e.target.value;
        UI.toast("Priorità aggiornata", "success");
        render();
      } catch (err) { UI.toast(err.message, "error"); }
    }, sig());

    container.querySelector("#qk-assignee")?.addEventListener("change", async (e) => {
      try {
        await Store.api("updateTask", "tasks", { id: task.id, assigned_to: e.target.value || null });
        task.assigned_to = e.target.value || null;
        UI.toast("Assegnatario aggiornato", "success");
        render();
      } catch (err) { UI.toast(err.message, "error"); }
    }, sig());

    container.querySelector("#btn-edit-task")?.addEventListener("click", () => openTaskModal(task.id), sig());

    container.querySelector("#btn-delete-task")?.addEventListener("click", () => {
      UI.confirm(`Eliminare la task "${task.title}"?`, async () => {
        try {
          await Store.api("deleteTask", "tasks", { id: task.id });
          _tasks = _tasks.filter(t => t.id !== task.id);
          _currentTaskId = null;
          UI.toast("Task eliminata", "info");
          render();
        } catch (err) { UI.toast(err.message, "error"); }
      });
    }, sig());

    if (task.attachment) {
      container.querySelector("#btn-view-task-att")?.addEventListener("click", () => previewFile(task.attachment, task.title), sig());
      container.querySelector("#btn-remove-task-att")?.addEventListener("click", () => {
        UI.confirm("Rimuovere l'allegato?", async () => {
          try {
            await Store.api("updateTask", "tasks", { id: task.id, attachment: null });
            task.attachment = null;
            UI.toast("Allegato rimosso", "info");
            render();
          } catch (err) { UI.toast(err.message, "error"); }
        });
      }, sig());
    }

    container.querySelector("#log-callback-toggle")?.addEventListener("change", (e) => {
      container.querySelector("#log-callback-date-wrap")?.classList.toggle("hidden", !e.target.checked);
    }, sig());

    container.querySelector("#task-log-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = container.querySelector("#log-error");
      const btn = container.querySelector("#log-submit-btn");
      const date = container.querySelector("#log-date").value;
      if (!date) {
        errEl.textContent = "Data obbligatoria";
        errEl.classList.remove("hidden");
        return;
      }

      const isCallback = container.querySelector("#log-callback-toggle").checked;
      const logData = {
        task_id: task.id,
        interaction_date: date.replace("T", " ") + ":00",
        notes: container.querySelector("#log-notes").value.trim() || null,
        esito: container.querySelector("#log-esito").value || null,
        outcome: container.querySelector("#log-esito").value || null,
        schedule_followup: isCallback ? 1 : 0,
        followup_date: (isCallback && container.querySelector("#log-callback-date").value) || null
      };

      const fileInput = container.querySelector("#log-file");
      if (fileInput?.files.length > 0) {
        logData.attachment = await readFileAsBase64(fileInput.files[0]);
        if (!logData.attachment) return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...';
      errEl.classList.add("hidden");

      try {
        await Store.api("createTaskLog", "tasks", logData);
        if (isCallback && logData.followup_date) {
           await Store.api("updateTask", "tasks", { id: task.id, due_date: logData.followup_date });
           task.due_date = logData.followup_date;
        }
        UI.toast("Aggiornamento salvato!", "success");
        render();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> Salva Aggiornamento';
      }
    }, sig());

    // Event delegation for logs actions
    const timeline = container.querySelector("#task-log-timeline");
    if (timeline) {
      timeline.addEventListener("click", (e) => {
        const delBtn = e.target.closest(".btn-delete-log");
        if (delBtn) {
          const logId = delBtn.dataset.id;
          UI.confirm("Eliminare questo log?", async () => {
             try {
               await Store.api("deleteTaskLog", "tasks", { id: logId });
               UI.toast("Log eliminato", "info");
               render();
             } catch (err) { UI.toast(err.message, "error"); }
          });
          return;
        }

        const viewBtn = e.target.closest(".btn-view-log-att");
        if (viewBtn) {
          const logId = viewBtn.dataset.id;
          const log = logs.find(l => l.id === logId);
          if (log?.attachment) previewFile(log.attachment, `log_${logId}`);
        }
      }, sig());
    }
  }

  /**
   * VIEW: TASK LIST
   */
  function renderTaskList(container) {
    let filtered = _tasks.filter(t => {
      const isMine = t.user_id === _currentUserId || t.assigned_to === _currentUserId;
      return _currentView === "mine" ? isMine : !isMine;
    });

    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.title || "").toLowerCase().includes(q) || 
        (t.category || "").toLowerCase().includes(q) || 
        (t.notes || "").toLowerCase().includes(q) ||
        getUserName(t.assigned_to || t.user_id).toLowerCase().includes(q)
      );
    }

    if (_filterCategory) filtered = filtered.filter(t => t.category === _filterCategory);
    if (_filterStatus) filtered = filtered.filter(t => t.status === _filterStatus);

    // Sorting
    const statusOrder = { "In corso": 0, "Da fare": 1, "In attesa": 2, "Completato": 3, "Annullato": 4 };
    const priorityOrder = { Alta: 0, Media: 1, Bassa: 2 };
    
    filtered.sort((a, b) => {
      const sDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      if (sDiff !== 0) return sDiff;
      const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (pDiff !== 0) return pDiff;
      return (a.due_date ? new Date(a.due_date).getTime() : 1e15) - (b.due_date ? new Date(b.due_date).getTime() : 1e15);
    });

    const totalCount = _tasks.filter(t => {
      const isMine = t.user_id === _currentUserId || t.assigned_to === _currentUserId;
      return _currentView === "mine" ? isMine : !isMine;
    }).length;

    const stats = {
      total: totalCount,
      todo: filtered.filter(t => t.status === "Da fare").length,
      doing: filtered.filter(t => t.status === "In corso").length,
      done: filtered.filter(t => t.status === "Completato").length,
      overdue: filtered.filter(t => isOverdue(t)).length
    };

    const mineCount = _tasks.filter(t => t.user_id === _currentUserId || t.assigned_to === _currentUserId).length;
    const teamCount = _tasks.length - mineCount;

    container.innerHTML = `
        <div class="tasks-page">
            <div class="fusion-tabs-container" style="margin-bottom:var(--sp-4);">
                <button class="fusion-tab ${_currentView === "mine" ? "active" : ""}" data-tab="mine">
                    <i class="ph ph-user"></i> I miei task <span class="todo-tab-count">${mineCount}</span>
                </button>
                <button class="fusion-tab ${_currentView === "team" ? "active" : ""}" data-tab="team">
                    <i class="ph ph-users"></i> Team <span class="todo-tab-count">${teamCount}</span>
                </button>
            </div>

            <div class="todo-stats-row">
                <div class="todo-stat"><div class="todo-stat-value">${stats.total}</div><div class="todo-stat-label">Totali</div></div>
                <div class="todo-stat"><div class="todo-stat-value" style="color:#8892a4">${stats.todo}</div><div class="todo-stat-label">Da fare</div></div>
                <div class="todo-stat"><div class="todo-stat-value" style="color:#3b82f6">${stats.doing}</div><div class="todo-stat-label">In corso</div></div>
                <div class="todo-stat"><div class="todo-stat-value" style="color:#22c55e">${stats.done}</div><div class="todo-stat-label">Completati</div></div>
                ${stats.overdue > 0 ? `<div class="todo-stat"><div class="todo-stat-value" style="color:#ef4444">⚠ ${stats.overdue}</div><div class="todo-stat-label">Scaduti</div></div>` : ""}
            </div>

            <div class="tasks-title-row">
                <h1 class="page-title"><i class="ph ph-check-square"></i> Task & Attività</h1>
                <button class="btn btn-primary" id="btn-new-task" type="button"><i class="ph ph-plus"></i> Nuova Task</button>
            </div>

            <div class="tasks-filter-row">
                <div class="search-input-wrapper" style="flex:1;max-width:340px;">
                    <i class="ph ph-magnifying-glass search-icon"></i>
                    <input type="search" id="tasks-search" class="form-input" placeholder="Cerca task..." value="${Utils.escapeHtml(_searchQuery)}" style="padding-left:36px;">
                </div>
            </div>

            <div class="todo-filter-group">
                <span class="todo-filter-label">Categoria:</span>
                ${CATEGORIES.map(c => {
                    const active = _filterCategory === c.value;
                    return `<button class="dash-filter ${active ? "active" : ""}" data-cat="${c.value}" style="${active ? `color:${c.color};border-color:${c.color};` : ""}">${c.icon} ${c.label}</button>`;
                }).join("")}
            </div>
            <div class="todo-filter-group">
                <span class="todo-filter-label">Stato:</span>
                ${STATUSES.map(s => {
                    const active = _filterStatus === s.value;
                    return `<button class="dash-filter ${active ? "active" : ""}" data-status="${s.value}" style="${active ? `color:${s.color};border-color:${s.color};` : ""}">${Utils.escapeHtml(s.label)}</button>`;
                }).join("")}
            </div>

            <div class="todo-cards-list" id="tasks-cards">
                ${filtered.length > 0 ? filtered.map(t => {
                    const cInfo = getCategory(t.category);
                    const pInfo = getPriority(t.priority);
                    const sInfo = getStatus(t.status);
                    const overdue = isOverdue(t);
                    const isCompleted = ["Completato", "Annullato"].includes(t.status);
                    const assigneeId = t.assigned_to || t.user_id;
                    const initials = getUserName(assigneeId).split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2);
                    const isAssigneeMe = assigneeId === _currentUserId;
                    const dateStr = t.due_date ? new Date(t.due_date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : null;

                    return `
                        <div class="dash-card ${isCompleted ? "completed" : ""} ${overdue ? "overdue" : ""}" data-id="${Utils.escapeHtml(t.id)}" style="--card-border:${pInfo.color}; cursor:pointer;" tabindex="0" role="button">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="background:${cInfo.color}20;color:${cInfo.color}; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px;">${cInfo.icon}</span>
                                    <div>
                                        <div style="font-size:14px; font-weight:600; color:#fff;">${Utils.escapeHtml(t.title)}</div>
                                        <div style="display:flex; gap:6px; margin-top:4px;">
                                            ${renderBadge(cInfo.label, cInfo.color, false)}
                                            ${renderBadge(pInfo.label, pInfo.color, true)}
                                        </div>
                                    </div>
                                </div>
                                ${renderBadge(sInfo.label, sInfo.color, true)}
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:12px;">
                                <div style="display:flex; gap:12px; font-size:12px;">
                                    ${dateStr ? `<span style="color:${overdue ? "var(--color-pink)" : "var(--color-text-muted)"}"><i class="ph ph-calendar-blank"></i> ${dateStr}${overdue ? ' <i class="ph ph-warning-circle"></i>' : ""}</span>` : ""}
                                    ${t.attachment ? '<span title="Allegato" style="color:var(--color-text-muted);"><i class="ph ph-paperclip"></i></span>' : ""}
                                </div>
                                <div title="${Utils.escapeHtml(getUserName(assigneeId))}">
                                    <span style="width:24px; height:24px; border-radius:50%; background:var(--color-bg-alt); color:var(--color-text-muted); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:600; ${isAssigneeMe ? "border:1px solid var(--color-pink); color:var(--color-pink);" : ""}">${initials || "?"}</span>
                                </div>
                            </div>
                        </div>`;
                }).join("") : `
                    <div class="tasks-empty">
                        <i class="ph ph-check-square" style="font-size:48px;opacity:0.15;"></i>
                        <p>${_currentView === "mine" ? "Nessun task personale" : "Nessun task del team"}</p>
                    </div>`}
            </div>
        </div>`;

    // --- List Event Handlers ---
    container.querySelector("#btn-new-task")?.addEventListener("click", () => openTaskModal(null), sig());
    
    container.querySelector("#tasks-search")?.addEventListener("input", (e) => {
      _searchQuery = e.target.value.trim();
      render();
    }, sig());

    container.querySelectorAll(".fusion-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        _currentView = tab.dataset.tab;
        _filterCategory = "";
        _filterStatus = "";
        _searchQuery = "";
        render();
      }, sig());
    });

    container.querySelectorAll("[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        _filterCategory = (_filterCategory === btn.dataset.cat) ? "" : btn.dataset.cat;
        render();
      }, sig());
    });

    container.querySelectorAll("[data-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        _filterStatus = (_filterStatus === btn.dataset.status) ? "" : btn.dataset.status;
        render();
      }, sig());
    });

    const cardsArea = container.querySelector("#tasks-cards");
    if (cardsArea) {
      cardsArea.addEventListener("click", (e) => {
        const card = e.target.closest(".dash-card");
        if (card) {
          _currentTaskId = card.dataset.id;
          render();
        }
      }, sig());
      
      cardsArea.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
           const card = e.target.closest(".dash-card");
           if (card) {
             _currentTaskId = card.dataset.id;
             render();
           }
        }
      }, sig());
    }
  }

  /**
   * MODALS & FILE PREVIEW
   */
  function openTaskModal(id) {
    const task = id ? _tasks.find(t => t.id === id) : null;
    const isEdit = !!task;

    const catOpts = CATEGORIES.map(c => `<option value="${c.value}"${(task?.category || "Interno") === c.value ? " selected" : ""}>${c.icon} ${c.label}</option>`).join("");
    const prioOpts = PRIORITIES.map(p => `<option value="${p.value}"${(task?.priority || "Media") === p.value ? " selected" : ""}>${p.label}</option>`).join("");
    const statOpts = STATUSES.map(s => `<option value="${s.value}"${(task?.status || "Da fare") === s.value ? " selected" : ""}>${s.label}</option>`).join("");
    const userOpts = '<option value="">— Nessuno —</option>' + _users.map(u => `<option value="${u.id}"${task?.assigned_to === u.id ? " selected" : ""}>${Utils.escapeHtml(u.full_name)}</option>`).join("");

    const modalBody = document.createElement("div");
    modalBody.style.cssText = "display:flex;flex-direction:column;gap:var(--sp-2);";
    modalBody.innerHTML = `
        <form id="task-modal-form" style="display:flex;flex-direction:column;gap:var(--sp-2);">
            <div class="form-group" style="margin:0;">
                <label class="form-label">Titolo *</label>
                <input type="text" id="tf-title" class="form-input" required value="${Utils.escapeHtml(task?.title || "")}" placeholder="Titolo della task">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Categoria</label>
                    <select id="tf-category" class="form-input">${catOpts}</select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Priorità</label>
                    <select id="tf-priority" class="form-input">${prioOpts}</select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Stato</label>
                    <select id="tf-status" class="form-input">${statOpts}</select>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Assegnata a</label>
                    <select id="tf-assigned" class="form-input">${userOpts}</select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label">Scadenza</label>
                    <input type="date" id="tf-due" class="form-input" value="${task?.due_date ? task.due_date.split("T")[0] : ""}">
                </div>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label">Note</label>
                <textarea id="tf-notes" class="form-input" rows="3" style="resize:vertical;">${Utils.escapeHtml(task?.notes || "")}</textarea>
            </div>
            <div class="form-group" style="margin:0;">
                <label class="form-label"><i class="ph ph-paperclip"></i> Allegato ${task?.attachment ? '<span style="color:var(--color-success);font-size:0.7rem;">✓ già presente</span>' : ""}</label>
                <input type="file" id="tf-attachment" class="form-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" style="padding:8px;">
                ${task?.attachment ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Seleziona file per sostituire, altrimenti mantieni il corrente.</div>' : ""}
            </div>
            <div id="tf-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary" id="tf-submit">${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Crea Task'}</button>
        </form>`;

    const modal = UI.modal({ title: isEdit ? `Modifica Task` : "Nuova Task", body: modalBody, size: "lg" });

    modalBody.querySelector("#task-modal-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errEl = modalBody.querySelector("#tf-error");
      const btn = modalBody.querySelector("#tf-submit");
      const title = modalBody.querySelector("#tf-title").value.trim();
      if (!title) {
        errEl.textContent = "Il titolo è obbligatorio";
        errEl.classList.remove("hidden");
        return;
      }

      const data = {
        title,
        category: modalBody.querySelector("#tf-category").value,
        priority: modalBody.querySelector("#tf-priority").value,
        status: modalBody.querySelector("#tf-status").value,
        due_date: modalBody.querySelector("#tf-due").value || null,
        notes: modalBody.querySelector("#tf-notes").value.trim() || null,
        assigned_to: modalBody.querySelector("#tf-assigned").value || null
      };

      const fileInput = modalBody.querySelector("#tf-attachment");
      if (fileInput.files.length > 0) {
        data.attachment = await readFileAsBase64(fileInput.files[0]);
        if (!data.attachment) return;
      } else if (isEdit && task.attachment) {
        data.attachment = task.attachment;
      }

      btn.disabled = true;
      errEl.classList.add("hidden");

      try {
        if (isEdit) {
          await Store.api("updateTask", "tasks", { id: task.id, ...data });
          Object.assign(task, data);
          UI.toast("Task aggiornata!", "success");
        } else {
          const res = await Store.api("createTask", "tasks", data);
          _tasks.unshift({ ...data, id: res.id, user_id: _currentUserId, created_at: new Date().toISOString() });
          UI.toast("Task creata!", "success");
        }
        render();
        modal.close();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        btn.disabled = false;
      }
    });
  }

  function previewFile(data, title) {
    if (!data) return;
    const match = data.match(/^data:([^;]+);/);
    if (!match) { UI.toast("Formato non supportato", "error"); return; }
    const mime = match[1];

    let contentHtml
    let blobUrl = null;

    if (mime === "application/pdf") {
      const b64 = data.split(",")[1];
      const binary = atob(b64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      blobUrl = URL.createObjectURL(new Blob([array], { type: "application/pdf" }));
      contentHtml = `<iframe src="${blobUrl}" style="width:100%;height:100%;border:none;border-radius:8px;"></iframe>`;
    } else if (mime.startsWith("image/")) {
      contentHtml = `<img src="${data}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">`;
    } else {
      contentHtml = `
        <div style="text-align:center;padding:60px 30px;">
            <div style="font-size:4rem;margin-bottom:16px;">📄</div>
            <p style="color:#9ca3af;font-size:1rem;margin-bottom:20px;">Anteprima non disponibile per questo formato.</p>
            <button id="att-dl-alt" class="btn btn-primary" style="padding:10px 24px;">⬇️ Scarica File</button>
        </div>`;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;background:rgba(0,0,0,0.88);backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;";
    overlay.innerHTML = `
        <div style="position:absolute;top:16px;right:20px;display:flex;gap:10px;z-index:10001;">
            <button id="att-dl" style="background:rgba(255,255,255,0.12);border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;">⬇️ SCARICA</button>
            <button id="att-close" style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1.2rem;">✕</button>
        </div>
        <div style="width:90%;height:85%;display:flex;align-items:center;justify-content:center;">${contentHtml}</div>`;
    
    document.body.appendChild(overlay);

    const escHandler = (e) => {
      if (e.key === "Escape") { closeOverlay(); }
    };

    const closeOverlay = () => {
      document.removeEventListener("keydown", escHandler);
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.remove(); if (blobUrl) URL.revokeObjectURL(blobUrl); }, 200);
    };

    overlay.querySelector("#att-close").addEventListener("click", closeOverlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });

    const download = () => {
      const a = document.createElement("a");
      a.href = data;
      a.download = title || "allegato";
      a.click();
    };

    overlay.querySelector("#att-dl").addEventListener("click", download);
    overlay.querySelector("#att-dl-alt")?.addEventListener("click", download);
    
    document.addEventListener("keydown", escHandler);
  }

  /**
   * INTERFACE
   */
  return {
    async init() {
      _abort = new AbortController();
      _currentTaskId = null;
      _currentView = "mine";
      _searchQuery = "";
      _filterCategory = "";
      _filterStatus = "";

      const app = document.getElementById("app");
      if (!app) return;

      UI.loading(true);
      app.innerHTML = UI.skeletonPage();

      try {
        const [tasksRes, usersRes, meRes] = await Promise.all([
          Store.get("listTasks", "tasks").catch(() => ({ tasks: [] })),
          Store.get("listUsers", "auth").catch(() => []),
          Store.get("me", "auth").catch(() => null)
        ]);

        _tasks = tasksRes?.tasks || [];
        _users = Array.isArray(usersRes) ? usersRes : (usersRes?.users || []);
        _currentUserId = meRes?.user?.id || meRes?.id || null;

        render();
      } catch (err) {
        console.error("[Tasks] Init error:", err);
        app.innerHTML = Utils.emptyState("Errore nel caricamento", err.message, "Riprova", null, () => this.init());
      } finally {
        UI.loading(false);
      }
    },

    destroy() {
      _abort.abort();
      _tasks = [];
      _users = [];
      _currentTaskId = null;
    }
  };
})();

window.Tasks = Tasks;
