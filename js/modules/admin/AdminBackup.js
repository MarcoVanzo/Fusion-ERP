"use strict";

const AdminBackup = (() => {
  let abortController = new AbortController();

  async function loadBackups() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    container.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento backup…</div>`;

    try {
      const res = await Store.get("listBackups", "admin");
      const { backups, db_stats } = res;

      const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)) + " " + ["B", "KB", "MB", "GB"][i];
      };

      let statsHtml = "";
      if (db_stats) {
        statsHtml = `
          <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-4);">
            <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Tabelle DB</span>
              <span style="font-size:22px;font-weight:700;color:var(--color-text);">${db_stats.table_count}</span>
            </div>
            <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Record totali</span>
              <span style="font-size:22px;font-weight:700;color:var(--color-text);">${(db_stats.total_rows || 0).toLocaleString("it-IT")}</span>
            </div>
            <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Dim. stimata DB</span>
              <span style="font-size:22px;font-weight:700;color:var(--color-text);">${formatSize(db_stats.total_bytes)}</span>
            </div>
            <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Backup salvati</span>
              <span style="font-size:22px;font-weight:700;color:var(--color-pink);">${backups.length}</span>
            </div>
          </div>`;
      }

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3);">
          <p class="section-label" style="margin:0;">Backup del Database</p>
          <div style="display:flex;gap:var(--sp-2);">
            <button class="btn btn-ghost btn-sm" id="bkp-refresh-btn" type="button" style="display:flex;align-items:center;gap:6px;"><i class="ph ph-arrows-clockwise"></i> Aggiorna</button>
            <button class="btn btn-primary btn-sm" id="bkp-run-btn" type="button" style="display:flex;align-items:center;gap:6px;"><i class="ph ph-database"></i> ESEGUI BACKUP</button>
          </div>
        </div>

        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255, 0, 255,0.06);border:1px solid rgba(255, 0, 255,0.2);margin-bottom:var(--sp-4);font-size:12px;color:var(--color-text-muted);">
          <strong style="color:var(--color-pink);">ℹ Backup completo</strong> — Esporta uno snapshot SQL di tutte le tabelle, compresso in formato ZIP. Solo gli amministratori possono eseguire, scaricare ed eliminare backup.
        </div>

        ${statsHtml}

        <div id="bkp-table-wrap">
          ${backups.length === 0
            ? Utils.emptyState("Nessun backup eseguito", 'Clicca "ESEGUI BACKUP" per creare il primo snapshot del database.')
            : `<div class="table-wrapper">
                <table class="table" id="backups-table">
                  <thead><tr>
                    <th>Data</th>
                    <th>File</th>
                    <th>Dimensione</th>
                    <th>Tabelle</th>
                    <th>Record</th>
                    <th>Eseguito da</th>
                    <th>Stato</th>
                    <th>Drive</th>
                    <th style="text-align:right;">Azioni</th>
                  </tr></thead>
                  <tbody>
                    ${backups.map((bkp) => {
                      const date = new Date(bkp.created_at);
                      const dateStr = isNaN(date) ? bkp.created_at : Utils.formatDate(bkp.created_at) + " " + date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
                      const driveIcon = bkp.drive_file_id 
                        ? `<td title="Copia su Google Drive — ID: ${Utils.escapeHtml(bkp.drive_file_id)}"><span style="color:#34A853;font-weight:600;font-size:14px;">☁️</span></td>` 
                        : '<td><span style="color:var(--color-text-muted);font-size:11px;" title="Non caricato su Drive">—</span></td>';
                      
                      return `
                        <tr>
                          <td style="font-size:12px;white-space:nowrap;color:var(--color-text-muted);">${Utils.escapeHtml(dateStr)}</td>
                          <td style="font-family:monospace;font-size:11px;">${Utils.escapeHtml(bkp.filename)}</td>
                          <td style="font-size:12px;">${formatSize(bkp.filesize)}</td>
                          <td style="text-align:center;">${bkp.table_count}</td>
                          <td style="text-align:center;font-size:12px;">${(bkp.row_count || 0).toLocaleString("it-IT")}</td>
                          <td style="font-size:12px;">${bkp.created_by_name ? Utils.escapeHtml(bkp.created_by_name) : '<span style="color:var(--color-text-muted);">Sistema</span>'}</td>
                          <td>${Utils.badge(bkp.status === "ok" ? "OK" : "Errore", bkp.status === "ok" ? "green" : "red")}</td>
                          ${driveIcon}
                          <td style="text-align:right;">
                            <div style="display:flex;gap:6px;justify-content:flex-end;">
                              <a class="btn btn-ghost btn-sm" href="api/router.php?module=admin&action=downloadBackup&id=${Utils.escapeHtml(bkp.id)}" title="Scarica backup" style="display:flex;align-items:center;gap:4px;"><i class="ph ph-download-simple"></i> Scarica</a>
                              <button class="btn btn-ghost btn-sm bkp-restore" data-id="${Utils.escapeHtml(bkp.id)}" data-name="${Utils.escapeHtml(bkp.filename)}" style="color:var(--color-warning);display:flex;align-items:center;gap:4px;" title="Ripristina database da questo backup"><i class="ph ph-arrow-counter-clockwise"></i> Ripristina</button>
                              <button class="btn btn-ghost btn-sm bkp-delete" data-id="${Utils.escapeHtml(bkp.id)}" data-name="${Utils.escapeHtml(bkp.filename)}" style="color:var(--color-error);" title="Elimina backup"><i class="ph ph-trash"></i></button>
                            </div>
                          </td>
                        </tr>`;
                    }).join("")}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      `;

      bindEvents();
    } catch (_err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento backup", err.message);
    }
  }

  function bindEvents() {
    document.getElementById("bkp-refresh-btn")?.addEventListener("click", loadBackups, { signal: abortController.signal });
    
    document.getElementById("bkp-run-btn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> GENERAZIONE BACKUP...';
      
      try {
        const _res = await Store.api("runBackup", "admin", { on_drive: true });
        UI.toast("Backup eseguito con successo", "success");
        Store.invalidate("admin", "listBackups");
        await loadBackups();
      } catch (_err) {
        UI.toast("Errore backup: " + err.message, "error");
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }, { signal: abortController.signal });

    Utils.qsa(".bkp-restore").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!confirm(`ATTENZIONE! Stai per ripristinare il database dal backup "${name}".\nTutti i dati inseriti dopo questo backup verranno persi PER SEMPRE. Procedere con cautela.`)) return;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> RIPRISTINO...';
        
        try {
          const _res = await Store.api("restoreBackup", "admin", { id: id });
          UI.toast("Ripristino completato con successo!", "success");
          alert("Sistema ripristinato. Si consiglia di ricaricare l'applicazione.");
          window.location.reload();
        } catch (_err) {
          UI.toast("Errore ripristino: " + err.message, "error");
          btn.disabled = false;
          btn.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Ripristina';
        }
      }, { signal: abortController.signal });
    });

    Utils.qsa(".bkp-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!confirm(`Vuoi davvero eliminare il backup "${name}"?`)) return;
        
        try {
          await Store.api("deleteBackup", "admin", { id: id });
          UI.toast("Backup eliminato", "success");
          Store.invalidate("admin", "listBackups");
          await loadBackups();
        } catch (_err) {
          UI.toast("Errore: " + err.message, "error");
        }
      }, { signal: abortController.signal });
    });
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
              <h1 class="page-title">Amministrazione - Backup</h1>
              <p class="page-subtitle">Sicurezza e ripristino del database</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadBackups();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminBackup = AdminBackup;
