"use strict";

const AdminDashboard = (() => {
  let abortController = new AbortController();

  const actionColors = {
    INSERT: "#22c55e",
    UPDATE: "#f59e0b",
    DELETE: "#ef4444",
    IMPORT: "#6366f1",
    system: "#94a3b8",
  };

  const roleLabels = {
    admin: "Admin",
    "social media manager": "Social Media Manager",
    allenatore: "Allenatore",
    operatore: "Operatore",
    atleta: "Atleta",
  };

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + ["B", "KB", "MB", "GB"][i];
  }

  function renderActionBadge(action) {
    const color = actionColors[action] || "#94a3b8";
    return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:1px 7px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.5px;">${action}</span>`;
  }

  function renderCard(title, icon, color, content) {
    return `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:20px 22px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-size:20px;">${icon}</span>
          <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:${color};">${title}</span>
        </div>
        ${content}
      </div>`;
  }

  async function loadDashboard() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    container.innerHTML = `<div>${UI.skeletonPage()}</div>`;

    try {
      const response = await fetch("api/router.php?module=admin&action=adminSummary", {
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: abortController.signal,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Errore caricamento dashboard");

      const data = result.data;
      const users = data.users ?? {};
      const backups = data.backups ?? {};
      const logs = data.logs ?? {};

      // Users by role visualization
      const roleBars = (users.by_role ?? [])
        .map((r) => {
          const pct = users.total > 0 ? Math.round((r.cnt / users.total) * 100) : 0;
          const barColor = {
            admin: "#ec4899",
            manager: "#6366f1",
            allenatore: "#22c55e",
            operatore: "#94a3b8",
            atleta: "#f59e0b",
          }[r.role] ?? "#64748b";
          return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="width:90px;font-size:11px;color:var(--color-text-muted);text-align:right;">${roleLabels[r.role] ?? r.role}</span>
              <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:10px;">
                <div style="width:${pct}%;background:${barColor};border-radius:4px;height:10px;transition:width .4s;"></div>
              </div>
              <span style="width:28px;font-size:11px;font-weight:600;color:var(--color-text);">${r.cnt}</span>
            </div>`;
        })
        .join("");

      // Last backup info
      const lastB = backups.last;
      const lastBackupHtml = lastB
        ? `<div style="font-size:13px;font-weight:600;margin-bottom:2px;">${Utils.escapeHtml(lastB.filename)}</div>
           <div style="font-size:11px;color:var(--color-text-muted);">${Utils.formatDate(lastB.created_at)} — da <strong>${Utils.escapeHtml(lastB.created_by_name ?? "Sistema")}</strong></div>
           <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
             <span style="font-size:11px;background:rgba(99,102,241,0.12);color:#818cf8;border-radius:10px;padding:2px 9px;">${formatBytes(lastB.filesize)}</span>
             <span style="font-size:11px;background:rgba(34,197,94,0.12);color:#4ade80;border-radius:10px;padding:2px 9px;">${lastB.table_count ?? 0} tabelle</span>
             <span style="font-size:11px;background:rgba(245,158,11,0.12);color:#fbbf24;border-radius:10px;padding:2px 9px;">${(lastB.row_count ?? 0).toLocaleString("it-IT")} righe</span>
             ${lastB.drive_file_id ? '<span style="font-size:11px;background:rgba(34,197,94,0.12);color:#4ade80;border-radius:10px;padding:2px 9px;">☁️ Drive</span>' : ""}
           </div>`
        : '<div style="font-size:13px;color:var(--color-text-muted);">Nessun backup ancora eseguito</div>';

      // Activities today
      const activityDistribution = (logs.by_action ?? []).length === 0
        ? '<span style="font-size:12px;color:var(--color-text-muted);">Nessuna attività oggi</span>'
        : (logs.by_action ?? [])
            .map((t) => {
              const color = actionColors[t.action] || "#94a3b8";
              const pct = logs.total_today > 0 ? Math.round((t.cnt / logs.total_today) * 100) : 0;
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                ${renderActionBadge(t.action)}
                <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:8px;">
                  <div style="width:${pct}%;background:${color};border-radius:4px;height:8px;"></div>
                </div>
                <span style="font-size:12px;font-weight:600;">${t.cnt}</span>
              </div>`;
            })
            .join("");

      // Recent logs table
      const recentLogsHtml = (logs.recent ?? []).length === 0
        ? Utils.emptyState("Nessun log disponibile", "")
        : `<div class="table-wrapper" style="max-height:300px;overflow-y:auto;">
            <table class="table" style="font-size:12px;">
              <thead><tr>
                <th>Azione</th><th>Tabella</th><th>Utente</th><th>Ora</th>
              </tr></thead>
              <tbody>
                ${(logs.recent ?? []).map((t) => `
                  <tr>
                    <td>${renderActionBadge(t.action)}</td>
                    <td style="font-family:monospace;font-size:11px;">${Utils.escapeHtml(t.table_name ?? "")}</td>
                    <td>${Utils.escapeHtml(t.user_name ?? "—")}</td>
                    <td style="color:var(--color-text-muted);white-space:nowrap;">${Utils.formatDate(t.created_at)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>`;

      container.innerHTML = `
      <div style="display:grid;gap:18px;">

        <!-- KPI pills -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
          <div style="background:linear-gradient(135deg,#6366f122,#6366f108);border:1px solid #6366f133;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#818cf8;">${users.total ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Utenti totali</div>
          </div>
          <div style="background:linear-gradient(135deg,#22c55e22,#22c55e08);border:1px solid #22c55e33;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#4ade80;">${users.active ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Attivi</div>
          </div>
          <div style="background:linear-gradient(135deg,#f59e0b22,#f59e0b08);border:1px solid #f59e0b33;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#fbbf24;">${users.invited ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Invitati</div>
          </div>
          <div style="background:linear-gradient(135deg,#ef444422,#ef444408);border:1px solid #ef444433;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#f87171;">${users.disabled ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Sospesi</div>
          </div>
          <div style="background:linear-gradient(135deg,#0ea5e922,#0ea5e908);border:1px solid #0ea5e933;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#38bdf8;">${backups.total ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Backup totali</div>
          </div>
          <div style="background:linear-gradient(135deg,#8b5cf622,#8b5cf608);border:1px solid #8b5cf633;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#a78bfa;">${logs.total_today ?? 0}</div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Log oggi</div>
          </div>
        </div>

        <!-- Strumenti Rapidi -->
        ${renderCard("Strumenti di Amministrazione", "🛠️", "var(--color-pink)", `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="users" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-users" style="font-size:18px;"></i> Gestione Utenti</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="settings" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-gear" style="font-size:18px;"></i> Impostazioni Tenant</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="certs" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-shield-check" style="font-size:18px;"></i> Certificati Medici</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="contracts" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-file-text" style="font-size:18px;"></i> Contratti Collaboratori</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="backup" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-database" style="font-size:18px;"></i> Backup & Ripristino</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="logs" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-list-numbers" style="font-size:18px;"></i> Log di Sistema</button>
            <button class="btn btn-ghost btn-sm admin-tab-link" data-tab="tasks" style="justify-content:flex-start;padding:12px;display:flex;align-items:center;gap:8px;"><i class="ph ph-check-square" style="font-size:18px;"></i> Task Amministrativi</button>
          </div>
        `)}

        <!-- Utenti + Backup -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
          ${renderCard("Utenti per Ruolo", "👥", "#818cf8", `
            <div style="margin-bottom:12px;">${roleBars || '<span style="font-size:12px;color:var(--color-text-muted);">Nessun utente</span>'}</div>
            <a href="#" class="admin-tab-link" data-tab="users" style="font-size:11px;color:#818cf8;text-decoration:none;">→ Gestisci utenti</a>
          `)}
          ${renderCard("Backup Database", "💾", "#38bdf8", `
            ${lastBackupHtml}
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--color-border);display:flex;gap:16px;flex-wrap:wrap;">
              <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#38bdf8;">${backups.db_table_count ?? 0}</div>
                <div style="font-size:10px;color:var(--color-text-muted);">Tabelle DB</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#38bdf8;">${(backups.db_total_rows ?? 0).toLocaleString("it-IT")}</div>
                <div style="font-size:10px;color:var(--color-text-muted);">Righe totali</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#38bdf8;">${formatBytes(backups.db_total_bytes)}</div>
                <div style="font-size:10px;color:var(--color-text-muted);">Dimensione DB</div>
              </div>
            </div>
            <div style="margin-top:12px;">
              <a href="#" class="admin-tab-link" data-tab="backup" style="font-size:11px;color:#38bdf8;text-decoration:none;">→ Gestisci backup</a>
            </div>
          `)}
        </div>

        <!-- Attività oggi + Log recenti -->
        <div style="display:grid;grid-template-columns:280px 1fr;gap:18px;">
          ${renderCard("Attività Oggi", "📊", "#a78bfa", `
            <div style="margin-bottom:10px;">${activityDistribution}</div>
            <a href="#" class="admin-tab-link" data-tab="logs" style="font-size:11px;color:#a78bfa;text-decoration:none;">→ Vedi tutti i log</a>
          `)}
          ${renderCard("Log Recenti", "📋", "#a78bfa", recentLogsHtml)}
        </div>

      </div>`;

      container.querySelectorAll(".admin-tab-link").forEach(link => {
        link.addEventListener("click", ev => {
          ev.preventDefault();
          const tab = ev.currentTarget.dataset.tab;
          const routes = {
            users: "utenti",
            logs: "admin-logs",
            backup: "admin-backup",
            settings: "admin-settings",
            certs: "admin-certs",
            contracts: "admin-contracts",
            tasks: "admin-tasks"
          };
          if (routes[tab]) Router.navigate(routes[tab]);
        });
      });

    } catch (err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento dashboard", err.message);
    }
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
              <h1 class="page-title">Amministrazione</h1>
              <p class="page-subtitle">Dashboard, certificati medici, contratti, backup e log</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadDashboard();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminDashboard = AdminDashboard;
