"use strict";

const AdminTasks = (() => {
  let abortController = new AbortController();
  let currentFilters = { status: "", priority: "", search: "" };

  async function loadTasks() {
    const wrap = document.getElementById("tasks-wrap");
    if (!wrap) return;

    wrap.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento task…</div>`;

    try {
      const tasks = await Store.get("listTasks", "admin", currentFilters);
      
      if (tasks.length === 0) {
        wrap.innerHTML = Utils.emptyState("Nessun task trovato", "Modifica i filtri o crea un nuovo task.");
        return;
      }

      wrap.innerHTML = `
        <div class="table-wrapper">
          <table class="table" id="tasks-table">
            <thead><tr>
              <th>Stato</th><th>Priorità</th><th>Titolo</th><th>Scadenza</th><th>Assegnato a</th><th>Azioni</th>
            </tr></thead>
            <tbody>
              ${tasks.map((t) => {
                const priorityClass = t.priority === "Urgente" ? "red" : t.priority === "Alta" ? "pink" : t.priority === "Media" ? "yellow" : "muted";
                const statusClass = t.status === "Completato" ? "green" : t.status === "Annullato" ? "red" : t.status === "In corso" ? "blue" : "muted";
                
                return `
                  <tr>
                    <td>${Utils.badge(t.status, statusClass)}</td>
                    <td>${Utils.badge(t.priority, priorityClass)}</td>
                    <td><strong>${Utils.escapeHtml(t.title)}</strong></td>
                    <td style="font-size:12px;">${t.due_date ? Utils.formatDate(t.due_date) : "—"}</td>
                    <td style="font-size:12px;">${Utils.escapeHtml(t.assigned_to_name || "Non assegnato")}</td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-ghost btn-sm task-edit" data-id="${Utils.escapeHtml(t.id)}"><i class="ph ph-note-pencil"></i></button>
                        <button class="btn btn-ghost btn-sm task-delete" data-id="${Utils.escapeHtml(t.id)}" style="color:var(--color-error);"><i class="ph ph-trash"></i></button>
                      </div>
                    </td>
                  </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>`;

      bindRowEvents();
    } catch (err) {
      if (err.name === 'AbortError') return;
      wrap.innerHTML = Utils.emptyState("Errore caricamento task", err.message);
    }
  }

  function bindRowEvents() {
    Utils.qsa(".task-edit").forEach(btn => {
      btn.addEventListener("click", () => openTaskModal(btn.dataset.id), { signal: abortController.signal });
    });
    
    Utils.qsa(".task-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminare definitivamente questo task?")) return;
        try {
          await Store.api("deleteTask", "admin", { id: btn.dataset.id });
          UI.toast("Task eliminato", "success");
          Store.invalidate("admin", "listTasks");
          await loadTasks();
        } catch (err) {
          UI.toast("Errore: " + err.message, "error");
        }
      }, { signal: abortController.signal });
    });
  }

  function bindFilterEvents() {
    document.getElementById("task-new-btn")?.addEventListener("click", () => openTaskModal(null), { signal: abortController.signal });
    
    document.getElementById("task-apply-btn")?.addEventListener("click", () => {
      currentFilters = {
        status: document.getElementById("task-filter-status").value,
        priority: document.getElementById("task-filter-priority").value,
        search: document.getElementById("task-filter-search").value.trim()
      };
      loadTasks();
    }, { signal: abortController.signal });

    document.getElementById("task-reset-btn")?.addEventListener("click", () => {
      document.getElementById("task-filter-status").value = "";
      document.getElementById("task-filter-priority").value = "";
      document.getElementById("task-filter-search").value = "";
      currentFilters = { status: "", priority: "", search: "" };
      loadTasks();
    }, { signal: abortController.signal });
  }

  async function openTaskModal(_taskId) {
    // This would typically fetch task details if taskId is present
    // For now, let's just show a simple "nuovo task" modal as per legacy logic
    UI.toast("Funzionalità in fase di migrazione", "info");
  }

  return {
    init: async function () {
      abortController.abort();
      abortController = new AbortController();
      const i = document.getElementById("app");
      if (i) {
        i.innerHTML = `
          <div class="page-header">
            <div>
              <h1 class="page-title">Amministrazione - Task CRM</h1>
              <p class="page-subtitle">Gestione attività e follow-up amministrativi</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);">
                <p class="section-label" style="margin:0;">Task CRM</p>
                <button class="btn btn-primary btn-sm" id="task-new-btn" type="button" style="display:flex;align-items:center;gap:8px;">
                  <i class="ph ph-plus"></i> NUOVO TASK
                </button>
              </div>

              <div class="filter-bar" style="flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-4);align-items:flex-end;">
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label class="form-label" style="font-size:10px;">Stato</label>
                  <select id="task-filter-status" class="form-select" style="min-width:140px;">
                    <option value="">Tutti</option>
                    <option value="Da fare">Da fare</option>
                    <option value="In corso">In corso</option>
                    <option value="Completato">Completato</option>
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label class="form-label" style="font-size:10px;">Priorità</label>
                  <select id="task-filter-priority" class="form-select" style="min-width:130px;">
                    <option value="">Tutte</option>
                    <option value="Urgente">Urgente</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Bassa">Bassa</option>
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;flex:1;">
                  <label class="form-label" style="font-size:10px;">Cerca</label>
                  <input id="task-filter-search" type="search" class="form-input" placeholder="Titolo o note…">
                </div>
                <button class="btn btn-primary btn-sm" id="task-apply-btn" type="button">FILTRA</button>
                <button class="btn btn-ghost btn-sm" id="task-reset-btn" type="button">Reset</button>
              </div>

              <div id="tasks-wrap">
                ${UI.skeletonPage()}
              </div>
            </div>
          </div>`;
        
        bindFilterEvents();
        await loadTasks();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminTasks = AdminTasks;
