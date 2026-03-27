"use strict";
const AdminLogs = (() => {
  let abortController = new AbortController();

  const o = {
      INSERT: "green",
      UPDATE: "blue",
      DELETE: "red",
      LOGIN: "pink",
      LOGIN_FAILED: "yellow",
      BACKUP: "blue",
      RESTORE: "red",
      IMPORT: "muted",
    },
    i = {
      INSERT: "Inserimento",
      UPDATE: "Modifica",
      DELETE: "Eliminazione",
      LOGIN: "Accesso",
      LOGIN_FAILED: "Accesso fallito",
      BACKUP: "Backup",
      RESTORE: "Ripristino",
      IMPORT: "Importazione",
    },
    s = {
      login: "pink",
      logout: "muted",
      crud: "blue",
      backup: "blue",
      restore: "red",
      error: "red",
      access_denied: "yellow",
      system: "muted",
    },
    l = {
      login: "Accesso",
      logout: "Logout",
      crud: "CRUD",
      backup: "Backup",
      restore: "Restore",
      error: "Errore",
      access_denied: "Accesso negato",
      system: "Sistema",
    };

  let r = 0,
    d = [],
    c = {
      action_filter: "",
      event_type: "",
      table_name: "",
      date_from: "",
      date_to: "",
      search: "",
    };

  async function p(e = !1) {
    if (e) {
      r = 0;
      d = [];
    }
    const n = document.getElementById("logs-table-wrap");
    if (n) {
      n.innerHTML = '<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento log…</div>';
      try {
        const urlParams = new URLSearchParams({
          module: "admin",
          action: "listLogs",
          limit: String(100),
          offset: String(r),
          ...c,
        });
        const a = await fetch(`api/router.php?${urlParams.toString()}`, {
          credentials: "same-origin",
          signal: abortController.signal
        });
        const m = await a.json();
        if (!m.success) throw new Error(m.error || "Errore caricamento log");
        const u = m.data.logs || [];
        d = e ? u : [...d, ...u];
        r += u.length;

        (function (elist, isMore) {
          const aWrap = document.getElementById("logs-table-wrap");
          if (!aWrap) return;
          if (0 === elist.length) {
             aWrap.innerHTML = Utils.emptyState("Nessun log trovato", "Prova a modificare i filtri applicati.");
             return;
          }
          const htmlRows = elist.map((t, idx) => {
            const nColor = o[t.action] || "muted",
              aLabel = i[t.action] || t.action,
              rType = (t.event_type || "crud").toLowerCase(),
              dColor = s[rType] || "muted",
              cLabel = l[rType] || t.event_type || "—",
              hasDetails = t.before_snapshot || t.after_snapshot || t.details,
              detailId = `log-detail-${idx}`,
              httpStatus = t.http_status || "",
              statusColor = httpStatus >= 400 ? "color:#FF00FF;" : httpStatus >= 300 ? "color:#FFD600;" : "color:var(--color-text-muted);",
              roleColor = { admin: "pink", manager: "blue", allenatore: "green", operatore: "muted", atleta: "muted" }[t.role] || "muted";

            return `\n        <tr class="log-row${hasDetails ? " log-row-expandable" : ""}" data-detail="${detailId}" style="cursor:${hasDetails ? "pointer" : "default"};">\n          <td style="font-size:12px;white-space:nowrap;color:var(--color-text-muted);">${Utils.escapeHtml(
              (function (dt) {
                if (!dt) return "—";
                const dObj = new Date(dt);
                return isNaN(dObj) ? dt : dObj.toLocaleDateString("it-IT") + " " + dObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              })(t.created_at)
            )}</td>\n          <td>\n            <span style="font-weight:600;font-size:13px;">${t.user_name ? Utils.escapeHtml(t.user_name) : '<span style="color:var(--color-text-muted);">Sistema</span>'}</span>\n          </td>\n          <td>${t.role ? Utils.badge(t.role, roleColor) : '<span style="color:var(--color-text-muted);">—</span>'}</td>\n          <td style="font-size:11px;color:var(--color-text-muted);font-family:monospace;">${Utils.escapeHtml(t.ip_address || "—")}</td>\n          <td>${Utils.badge(aLabel, nColor)}</td>\n          <td>${Utils.badge(cLabel, dColor)}</td>\n          <td style="font-size:12px;font-family:monospace;">${Utils.escapeHtml(t.table_name)}</td>\n          <td style="font-size:11px;color:var(--color-text-muted);font-family:monospace;">${t.record_id ? Utils.escapeHtml(t.record_id) : "—"}</td>\n          <td style="font-size:11px;font-family:monospace;${statusColor}">${httpStatus || "—"}</td>\n          <td style="text-align:center;font-size:14px;color:var(--color-text-muted);">${hasDetails ? "▸" : ""}</td>\n        </tr>\n        ${hasDetails ? `\n        <tr id="${detailId}" class="log-detail-row" style="display:none;">\n          <td colspan="9" style="padding:0;">\n            <div style="padding:var(--sp-3);background:rgba(255,255,255,0.03);border-left:3px solid var(--color-pink);display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">\n              ${t.details ? `\n              <div style="grid-column:1/-1;">\n                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Dettagli</p>\n                <p style="font-size:12px;color:var(--color-text);margin:0;">${Utils.escapeHtml(t.details)}</p>\n              </div>` : ""}\n              <div>\n                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Prima (before)</p>\n                <pre style="font-size:11px;color:#98c8ff;white-space:pre-wrap;overflow-x:auto;margin:0;background:rgba(0,0,0,0.3);padding:var(--sp-2);">${t.before_snapshot ? Utils.escapeHtml(JSON.stringify(JSON.parse(t.before_snapshot), null, 2)) : "—"}</pre>\n              </div>\n              <div>\n                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Dopo (after)</p>\n                <pre style="font-size:11px;color:#b9f6ca;white-space:pre-wrap;overflow-x:auto;margin:0;background:rgba(0,0,0,0.3);padding:var(--sp-2);">${t.after_snapshot ? Utils.escapeHtml(JSON.stringify(JSON.parse(t.after_snapshot), null, 2)) : "—"}</pre>\n              </div>\n            </div>\n          </td>\n        </tr>` : ""}\n      `;
          }).join("");

          aWrap.innerHTML = `\n      <div class="table-wrapper">\n        <table class="table" id="logs-table">\n          <thead><tr>\n            <th>Data/Ora</th>\n            <th>Utente</th>\n            <th>Ruolo</th>\n            <th>IP</th>\n            <th>Azione</th>\n            <th>Tipo</th>\n            <th>Tabella</th>\n            <th>Record ID</th>\n            <th>Status</th>\n            <th></th>\n          </tr></thead>\n          <tbody>${htmlRows}</tbody>\n        </table>\n      </div>\n      ${isMore ? `\n        <p style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-3);">\n          ${elist.length} ${1 === elist.length ? "evento trovato" : "eventi trovati"}\n        </p>` : '\n        <div style="text-align:center;margin-top:var(--sp-3);">\n          <button class="btn btn-ghost btn-sm" id="log-more-btn" type="button">Carica altri…</button>\n        </div>'}\n    `;

          aWrap.querySelectorAll(".log-row-expandable").forEach((rowEl) => {
            rowEl.addEventListener("click", () => {
              const detailId = rowEl.dataset.detail;
              const detailRow = document.getElementById(detailId);
              if (detailRow) {
                 detailRow.style.display = detailRow.style.display === "none" ? "table-row" : "none";
                 const icon = rowEl.querySelector("td:last-child");
                 if (icon) icon.innerHTML = detailRow.style.display === "none" ? "▸" : "▾";
              }
            }, { signal: abortController.signal });
          });

          if (!isMore) {
            const moreBtn = document.getElementById("log-more-btn");
            if (moreBtn) {
              moreBtn.addEventListener("click", () => p(!1), { signal: abortController.signal });
            }
          }
        })(d, u.length < 100);
      } catch (err) {
        if (err.name === 'AbortError') return;
        n.innerHTML = Utils.emptyState("Errore caricamento log", err.message);
      }
    }
  }

  return {
    init: async function () {
      abortController.abort();
      abortController = new AbortController();
      const mainContent = document.getElementById("app");
      if (mainContent) {
        mainContent.innerHTML = `
          <div class="page-header">
            <div>
              <h1 class="page-title">Amministrazione - Log</h1>
              <p class="page-subtitle">Visualizza e analizza i log di sistema</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3);">
                <p class="section-label" style="margin:0;">Log di Sistema</p>
                <div style="display:flex;gap:var(--sp-2);">
                  <button class="btn btn-ghost btn-sm" id="log-export-btn" type="button" style="display:flex;align-items:center;gap:6px;">
                    <i class="ph ph-download-simple"></i> Esporta CSV
                  </button>
                  <button class="btn btn-ghost btn-sm" id="refresh-logs-btn" type="button" style="display:flex;align-items:center;gap:6px;">
                    <i class="ph ph-arrows-clockwise"></i> AGGIORNA
                  </button>
                </div>
              </div>
              
              <!-- Filter bar -->
              <div class="filter-bar" style="flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3);align-items:flex-end;">
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Azione</label>
                  <select id="log-filter-action" class="form-select" style="min-width:150px;">
                    <option value="">Tutte le azioni</option>
                    <option value="INSERT">Inserimento</option>
                    <option value="UPDATE">Modifica</option>
                    <option value="DELETE">Eliminazione</option>
                    <option value="LOGIN">Accesso</option>
                    <option value="LOGIN_FAILED">Accesso fallito</option>
                    <option value="BACKUP">Backup</option>
                    <option value="RESTORE">Ripristino</option>
                    <option value="IMPORT">Importazione</option>
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Tipo evento</label>
                  <select id="log-filter-event" class="form-select" style="min-width:140px;">
                    <option value="">Tutti i tipi</option>
                    <option value="login">Accesso</option>
                    <option value="logout">Logout</option>
                    <option value="crud">CRUD</option>
                    <option value="backup">Backup</option>
                    <option value="restore">Restore</option>
                    <option value="error">Errore</option>
                    <option value="access_denied">Accesso negato</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Tabella</label>
                  <select id="log-filter-table" class="form-select" style="min-width:150px;">
                    <option value="">Tutte le tabelle</option>
                    <option value="users">users</option>
                    <option value="athletes">athletes</option>
                    <option value="medical_certificates">medical_certificates</option>
                    <option value="contracts">contracts</option>
                    <option value="transport_trips">transport_trips</option>
                    <option value="outseason_verifications">outseason_verifications</option>
                    <option value="documents">documents</option>
                    <option value="backups">backups</option>
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Da</label>
                  <input id="log-filter-from" type="date" class="form-input" style="width:140px;">
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">A</label>
                  <input id="log-filter-to" type="date" class="form-input" style="width:140px;">
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                  <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Cerca</label>
                  <input id="log-filter-search" type="search" class="form-input" placeholder="Utente o Record ID…" style="min-width:200px;">
                </div>
                <button class="btn btn-primary btn-sm" id="log-apply-btn" type="button" style="align-self:flex-end;">FILTRA</button>
                <button class="btn btn-ghost btn-sm" id="log-reset-btn" type="button" style="align-self:flex-end;">Reset</button>
              </div>

              <div id="logs-table-wrap"></div>
            </div>
          </div>`;
          
        document.getElementById("refresh-logs-btn")?.addEventListener("click", () => { p(!0); }, { signal: abortController.signal });
        document.getElementById("log-export-btn")?.addEventListener("click", () => {
          const urlParams = new URLSearchParams({ module: "admin", action: "exportLogs", ...c });
          window.location.href = `api/router.php?${urlParams.toString()}`;
        }, { signal: abortController.signal });
        document.getElementById("log-apply-btn")?.addEventListener("click", () => {
          c = {
            action_filter: document.getElementById("log-filter-action")?.value || "",
            event_type: document.getElementById("log-filter-event")?.value || "",
            table_name: document.getElementById("log-filter-table")?.value || "",
            date_from: document.getElementById("log-filter-from")?.value || "",
            date_to: document.getElementById("log-filter-to")?.value || "",
            search: document.getElementById("log-filter-search")?.value.trim() || "",
          };
          p(!0);
        }, { signal: abortController.signal });
        document.getElementById("log-reset-btn")?.addEventListener("click", () => {
          c = { action_filter: "", event_type: "", table_name: "", date_from: "", date_to: "", search: "" };
          document.getElementById("log-filter-action").value = "";
          document.getElementById("log-filter-event").value = "";
          document.getElementById("log-filter-table").value = "";
          document.getElementById("log-filter-from").value = "";
          document.getElementById("log-filter-to").value = "";
          document.getElementById("log-filter-search").value = "";
          p(!0);
        }, { signal: abortController.signal });
        p(!0);
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    },
  };
})();
window.AdminLogs = AdminLogs;
