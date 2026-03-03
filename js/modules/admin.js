/**
 * Admin Module — Medical Certs (OCR), Contracts, Documents
 * Fusion ERP v1.0
 */

'use strict';

const Admin = (() => {
  let _ac = new AbortController();

  let _activeTab = 'certs';

  async function init() {
    // Reset AbortController so listeners are always fresh on re-init
    _ac.abort();
    _ac = new AbortController();

    const route = Router.getCurrentRoute();
    if (route === 'admin-backup') _activeTab = 'backup';
    else if (route === 'admin-logs') _activeTab = 'logs';
    else if (route === 'utenti') _activeTab = 'users';
    else if (route === 'admin-settings') _activeTab = 'settings';
    else _activeTab = 'certs';


    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Amministrazione</h1>
          <p class="page-subtitle">Certificati medici, contratti, backup e log</p>
        </div>
      </div>

      <div class="page-body">
        <!-- Tabs -->
        <div class="filter-bar" style="margin-bottom:var(--sp-3);">
          <button class="filter-chip ${_activeTab === 'certs' ? 'active' : ''}" data-tab="certs" type="button">Certificati Medici</button>
          <button class="filter-chip ${_activeTab === 'contracts' ? 'active' : ''}" data-tab="contracts" type="button">Contratti</button>
          <button class="filter-chip ${_activeTab === 'users' ? 'active' : ''}" data-tab="users" type="button">Utenti</button>
          <button class="filter-chip ${_activeTab === 'settings' ? 'active' : ''}" data-tab="settings" type="button">Impostazioni</button>
          <button class="filter-chip ${_activeTab === 'backup' ? 'active' : ''}" data-tab="backup" type="button">Backup</button>
          <button class="filter-chip ${_activeTab === 'logs' ? 'active' : ''}" data-tab="logs" type="button">Log Sistema</button>
          <button class="filter-chip ${_activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks" type="button">Task CRM</button>
        </div>

        <div id="admin-content">
          ${UI.skeletonPage()}
        </div>
      </div>`;

    Utils.qsa('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
      Utils.qsa('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeTab = btn.dataset.tab;
      loadTab(_activeTab);
    }, { signal: _ac.signal }));

    loadTab(_activeTab);
  }

  async function loadTab(tab) {
    const content = document.getElementById('admin-content');
    if (!content) return;
    content.innerHTML = `<div>${UI.skeletonPage()}</div>`;
    if (tab === 'certs') await loadCerts();
    else if (tab === 'contracts') await loadContracts();
    else if (tab === 'users') await loadUsers();
    else if (tab === 'settings') await loadSettings();
    else if (tab === 'backup') await loadBackup();
    else if (tab === 'logs') await loadLogs();
    else if (tab === 'tasks') await loadTasks();
  }

  // ─── IMPOSTAZIONI TENANT  ──────────────────────────────────────────────────
  async function loadSettings() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento impostazioni…</div>`;

    try {
      const res = await fetch('api/router.php?module=admin&action=getTenantSettings', { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore caricamento impostazioni');

      _renderSettingsTab(json.data || {});
    } catch (err) {
      content.innerHTML = Utils.emptyState('Errore caricamento impostazioni', err.message);
    }
  }

  function _renderSettingsTab(settings) {
    const content = document.getElementById('admin-content');

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3);">
        <p class="section-label" style="margin:0;">Impostazioni Generali</p>
        <button class="btn btn-primary btn-sm" id="save-settings-btn" type="button" style="display:flex;align-items:center;gap:6px;">
          <i class="ph ph-floppy-disk"></i> SALVA IMPOSTAZIONI
        </button>
      </div>

      <div class="card" style="margin-bottom:var(--sp-4);">
        <form id="tenant-settings-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
            <div class="form-group" style="grid-column:1/-1;">
              <label class="form-label" for="setting_club_name">Nome Società Sportiva / Ente</label>
              <input type="text" id="setting_club_name" name="club_name" class="form-input" value="${Utils.escapeHtml(settings.club_name || '')}">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="setting_sport_type">Sport Principale</label>
              <input type="text" id="setting_sport_type" name="sport_type" class="form-input" value="${Utils.escapeHtml(settings.sport_type || '')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="setting_federation">Federazione / Ente di Promozione</label>
              <input type="text" id="setting_federation" name="federation" class="form-input" value="${Utils.escapeHtml(settings.federation || '')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="setting_season_format">Stagione Attuale (es. 2025-2026)</label>
              <input type="text" id="setting_season_format" name="season_format" class="form-input" value="${Utils.escapeHtml(settings.season_format || '')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="setting_legal_form">Forma Giuridica (es. ASD, SSD)</label>
              <input type="text" id="setting_legal_form" name="legal_form" class="form-input" value="${Utils.escapeHtml(settings.legal_form || '')}">
            </div>

            <div class="form-group">
              <label class="form-label" for="setting_primary_color">Colore Principale Brand (Hex)</label>
              <div style="display:flex;gap:10px;">
                <input type="color" id="setting_primary_color_picker" class="form-input" style="width:50px;padding:2px;height:42px;cursor:pointer;" value="${Utils.escapeHtml(settings.primary_color || '#FF00FF')}">
                <input type="text" id="setting_primary_color" name="primary_color" class="form-input" value="${Utils.escapeHtml(settings.primary_color || '#FF00FF')}" style="flex:1;font-family:monospace;">
              </div>
            </div>

            <div class="form-group" style="display:flex;flex-direction:column;justify-content:flex-end;">
                <label class="form-label">Piano in Uso</label>
                <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--color-border);border-radius:var(--radius);font-weight:600;display:flex;align-items:center;gap:8px;">
                    <i class="ph ph-crown" style="color:var(--color-warning);"></i>
                    <span style="text-transform:uppercase;">${Utils.escapeHtml(settings.plan_tier || 'PRO')}</span>
                </div>
            </div>

            <div class="form-group">
              <label class="form-label">Limite Squadre</label>
              <input type="text" class="form-input" disabled value="${Utils.escapeHtml(settings.max_teams || '20')}">
            </div>
            
            <div class="form-group">
              <label class="form-label">Limite Atleti</label>
              <input type="text" class="form-input" disabled value="${Utils.escapeHtml(settings.max_athletes || '500')}">
            </div>
          </div>
        </form>
      </div>
    `;

    document.getElementById('setting_primary_color_picker')?.addEventListener('input', (e) => {
      const textInp = document.getElementById('setting_primary_color');
      if (textInp) textInp.value = e.target.value.toUpperCase();
    }, { signal: _ac.signal });

    document.getElementById('setting_primary_color')?.addEventListener('input', (e) => {
      const colorInp = document.getElementById('setting_primary_color_picker');
      if (colorInp && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
        colorInp.value = e.target.value;
      }
    }, { signal: _ac.signal });

    document.getElementById('save-settings-btn')?.addEventListener('click', _doSaveSettings, { signal: _ac.signal });
  }

  async function _doSaveSettings() {
    const btn = document.getElementById('save-settings-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;"></i> SALVATAGGIO...';
    }

    const form = document.getElementById('tenant-settings-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('api/router.php?module=admin&action=saveTenantSettings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore salvataggio impostazioni');

      UI.toast('Impostazioni aggiornate con successo', 'success');

      if (data.primary_color) {
        document.documentElement.style.setProperty('--color-pink', data.primary_color);
      }

    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA IMPOSTAZIONI';
      }
    }
  }

  // ─── BACKUP ───────────────────────────────────────────────────────────────
  async function loadBackup() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento backup…</div>`;

    try {
      const res = await fetch('api/router.php?module=admin&action=listBackups', { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore caricamento backup');

      const { backups, db_stats } = json.data;
      _renderBackupTab(backups, db_stats);
    } catch (err) {
      content.innerHTML = Utils.emptyState('Errore caricamento backup', err.message);
    }
  }

  function _renderBackupTab(backups, dbStats) {
    const content = document.getElementById('admin-content');

    const fmtBytes = (b) => {
      if (!b || b === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(b) / Math.log(1024));
      return (b / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
    };

    const statsHtml = dbStats ? `
      <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-4);">
        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Tabelle DB</span>
          <span style="font-size:22px;font-weight:700;color:var(--color-text);">${dbStats.table_count}</span>
        </div>
        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Record totali</span>
          <span style="font-size:22px;font-weight:700;color:var(--color-text);">${(dbStats.total_rows || 0).toLocaleString('it-IT')}</span>
        </div>
        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Dim. stimata DB</span>
          <span style="font-size:22px;font-weight:700;color:var(--color-text);">${fmtBytes(dbStats.total_bytes)}</span>
        </div>
        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:2px;min-width:130px;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Backup salvati</span>
          <span style="font-size:22px;font-weight:700;color:var(--color-pink);">${backups.length}</span>
        </div>
      </div>
    ` : '';

    const backupRows = backups.length === 0
      ? Utils.emptyState('Nessun backup eseguito', 'Clicca "ESEGUI BACKUP" per creare il primo snapshot del database.')
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
              ${backups.map(b => {
        const d = new Date(b.created_at);
        const dateStr = isNaN(d) ? b.created_at : d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const driveCell = b.drive_file_id
          ? `<td title="Copia su Google Drive — ID: ${Utils.escapeHtml(b.drive_file_id)}"><span style="color:#34A853;font-weight:600;font-size:14px;">☁️</span></td>`
          : `<td><span style="color:var(--color-text-muted);font-size:11px;" title="Non caricato su Drive">—</span></td>`;
        return `<tr>
                  <td style="font-size:12px;white-space:nowrap;color:var(--color-text-muted);">${Utils.escapeHtml(dateStr)}</td>
                  <td style="font-family:monospace;font-size:11px;">${Utils.escapeHtml(b.filename)}</td>
                  <td style="font-size:12px;">${fmtBytes(b.filesize)}</td>
                  <td style="text-align:center;">${b.table_count}</td>
                  <td style="text-align:center;font-size:12px;">${(b.row_count || 0).toLocaleString('it-IT')}</td>
                  <td style="font-size:12px;">${b.created_by_name ? Utils.escapeHtml(b.created_by_name) : '<span style="color:var(--color-text-muted);">Sistema</span>'}</td>
                  <td>${Utils.badge(b.status === 'ok' ? 'OK' : 'Errore', b.status === 'ok' ? 'green' : 'red')}</td>
                  ${driveCell}
                  <td style="text-align:right;">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      <a class="btn btn-ghost btn-sm" href="api/router.php?module=admin&action=downloadBackup&id=${Utils.escapeHtml(b.id)}" title="Scarica backup" style="display:flex;align-items:center;gap:4px;"><i class="ph ph-download-simple"></i> Scarica</a>
                      <button class="btn btn-ghost btn-sm bkp-restore" data-id="${Utils.escapeHtml(b.id)}" data-name="${Utils.escapeHtml(b.filename)}" style="color:#FFD600;display:flex;align-items:center;gap:4px;" title="Ripristina database da questo backup"><i class="ph ph-arrow-counter-clockwise"></i> Ripristina</button>
                      <button class="btn btn-ghost btn-sm bkp-delete" data-id="${Utils.escapeHtml(b.id)}" data-name="${Utils.escapeHtml(b.filename)}" style="color:#FF00FF;" title="Elimina backup"><i class="ph ph-trash"></i></button>
                    </div>
                  </td>
                </tr>`;
      }).join('')}
            </tbody>
          </table>
        </div>`;

    content.innerHTML = `
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
        ${backupRows}
      </div>
    `;

    document.getElementById('bkp-refresh-btn')?.addEventListener('click', () => loadBackup(), { signal: _ac.signal });
    document.getElementById('bkp-run-btn')?.addEventListener('click', () => _doCreateBackup(), { signal: _ac.signal });

    Utils.qsa('.bkp-restore').forEach(btn => btn.addEventListener('click', () => {
      _doRestoreBackup(btn.dataset.id, btn.dataset.name);
    }, { signal: _ac.signal }));

    Utils.qsa('.bkp-delete').forEach(btn => btn.addEventListener('click', () => {
      _doDeleteBackup(btn.dataset.id, btn.dataset.name);
    }, { signal: _ac.signal }));
  }

  async function _doCreateBackup() {
    const btn = document.getElementById('bkp-run-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 1s linear infinite;"></i> Generazione in corso…';

    try {
      const res = await fetch('api/router.php?module=admin&action=createBackup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore durante il backup');

      const d = json.data;
      const driveMsg = d.drive_file_id
        ? ' ☁️ Drive: OK'
        : (d.drive_error ? ` ⚠ Drive: ${String(d.drive_error).substring(0, 60)}` : '');
      UI.toast(`✅ Backup: ${d.filename} (${d.table_count} tabelle, ${(d.row_count || 0).toLocaleString('it-IT')} record)${driveMsg}`, 'success');
      await loadBackup();
    } catch (err) {
      UI.toast('Errore backup: ' + err.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-database"></i> ESEGUI BACKUP';
      }
    }
  }

  async function _doDeleteBackup(id, filename) {
    if (!confirm(`Eliminare definitivamente il backup "${filename}"?\nL'operazione non è reversibile.`)) return;

    try {
      const res = await fetch('api/router.php?module=admin&action=deleteBackup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore eliminazione backup');

      UI.toast('Backup eliminato', 'success');
      await loadBackup();
    } catch (err) {
      UI.toast('Errore: ' + err.message, 'error');
    }
  }


  async function _doRestoreBackup(id, filename) {
    // ── Single confirmation modal: checkbox + text input ──────────────────────
    let confirmed = false;

    await new Promise((resolve) => {
      const bodyEl = document.createElement('div');
      bodyEl.innerHTML = `
        <p style="color:var(--color-text);margin-bottom:var(--sp-2);">
          Stai per ripristinare il database dal backup:
        </p>
        <p style="font-family:monospace;font-size:12px;background:rgba(255,255,255,0.05);padding:var(--sp-2);margin-bottom:var(--sp-3);word-break:break-all;">
          ${Utils.escapeHtml(filename)}
        </p>
        <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255, 0, 255,0.07);border:1px solid rgba(255, 0, 255,0.4);margin-bottom:var(--sp-3);font-size:13px;line-height:1.6;">
          ⚠️ <strong style="color:#FF00FF;">Operazione DISTRUTTIVA</strong><br>
          Tutti i dati correnti (atleti, trasporti, certificati, ecc.) verranno <strong>sovrascritti</strong>.<br>
          La tabella <code>users</code> non verrà toccata — le credenziali di accesso rimangono invariate.
        </div>
        <div style="margin-bottom:var(--sp-3);">
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:13px;">
            <input type="checkbox" id="restore-chk" style="margin-top:3px;accent-color:#FF00FF;">
            <span>Ho letto l'avviso e voglio procedere con il ripristino.</span>
          </label>
        </div>
        <div>
          <label style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);display:block;margin-bottom:6px;">
            Digita <strong style="color:#FF00FF;">RIPRISTINA</strong> per confermare
          </label>
          <input id="restore-code-input" class="form-input" type="text" placeholder="RIPRISTINA" autocomplete="off" spellcheck="false">
        </div>
        <div id="restore-modal-err" class="form-error hidden" style="margin-top:var(--sp-2);"></div>
      `;

      const footerFrag = document.createDocumentFragment();
      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn btn-ghost btn-sm';
      btnCancel.type = 'button';
      btnCancel.textContent = 'Annulla';

      const btnOk = document.createElement('button');
      btnOk.className = 'btn btn-sm';
      btnOk.type = 'button';
      btnOk.id = 'restore-confirm-btn';
      btnOk.style.cssText = 'background:#FF00FF;color:#fff;font-weight:600;';
      btnOk.textContent = 'RIPRISTINA';

      footerFrag.appendChild(btnCancel);
      footerFrag.appendChild(btnOk);

      const m = UI.modal({
        title: '⚠️ Ripristina Database',
        body: bodyEl,
        footer: footerFrag,
        onClose: resolve,          // X button or backdrop → resolve without confirming
      });

      btnCancel.addEventListener('click', () => { m.close(); resolve(); });
      btnOk.addEventListener('click', () => {
        const checked = document.getElementById('restore-chk')?.checked;
        const code = document.getElementById('restore-code-input')?.value.trim();
        const errEl = document.getElementById('restore-modal-err');

        if (!checked) {
          errEl.textContent = 'Seleziona la casella di conferma.';
          errEl.classList.remove('hidden');
          return;
        }
        if (code !== 'RIPRISTINA') {
          errEl.textContent = 'Codice non corretto. Digita esattamente: RIPRISTINA';
          errEl.classList.remove('hidden');
          return;
        }
        confirmed = true;
        m.close();
        resolve();
      });
    });

    if (!confirmed) return;

    // ── Perform restore ───────────────────────────────────────────────────────
    UI.toast('⏳ Ripristino in corso… L\'operazione può richiedere alcuni minuti.', 'info', 8000);

    try {
      const res = await fetch('api/router.php?module=admin&action=restoreBackup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, confirmation: 'RIPRISTINA' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore durante il restore');

      const d = json.data;
      let msg = `✅ Restore completato — ${(d.statements_executed || 0).toLocaleString('it-IT')} istruzioni eseguite`;
      if (d.statements_skipped) msg += `, ${d.statements_skipped} skippate (tabelle protette)`;
      if (d.warnings?.length) msg += ` — ⚠️ ${d.warnings.length} avvisi (vedi console)`;

      UI.toast(msg, d.warnings?.length ? 'info' : 'success', 8000);

      if (d.warnings?.length) {
        console.group('[RESTORE] Avvisi');
        d.warnings.forEach(w => console.warn(w));
        console.groupEnd();
      }
    } catch (err) {
      UI.toast('Errore restore: ' + err.message, 'error', 8000);
    }
  }


  // ─── LOGS ─────────────────────────────────────────────────────────────────

  // Badge colours per action type
  const _LOG_ACTION_COLORS = {
    INSERT: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'pink',
    LOGIN_FAILED: 'yellow',
    BACKUP: 'blue',
    RESTORE: 'red',
    IMPORT: 'muted',
  };

  // Human-readable Italian labels
  const _LOG_ACTION_LABELS = {
    INSERT: 'Inserimento',
    UPDATE: 'Modifica',
    DELETE: 'Eliminazione',
    LOGIN: 'Accesso',
    LOGIN_FAILED: 'Accesso fallito',
    BACKUP: 'Backup',
    RESTORE: 'Ripristino',
    IMPORT: 'Importazione',
  };

  // Badge colours per event_type
  const _LOG_EVENT_COLORS = {
    login: 'pink',
    logout: 'muted',
    crud: 'blue',
    backup: 'blue',
    restore: 'red',
    error: 'red',
    access_denied: 'yellow',
    system: 'muted',
  };

  const _LOG_EVENT_LABELS = {
    login: 'Accesso',
    logout: 'Logout',
    crud: 'CRUD',
    backup: 'Backup',
    restore: 'Restore',
    error: 'Errore',
    access_denied: 'Accesso negato',
    system: 'Sistema',
  };

  // State for current log page
  let _logsOffset = 0;
  const _logsPageSize = 100;
  let _allLogs = [];
  let _logFilters = { action_filter: '', event_type: '', table_name: '', date_from: '', date_to: '', search: '' };

  async function loadLogs() {
    const content = document.getElementById('admin-content');

    content.innerHTML = `
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
    `;

    // Hook up filter buttons
    document.getElementById('refresh-logs-btn')?.addEventListener('click', () => {
      _fetchAndRenderLogs(true);
    }, { signal: _ac.signal });

    document.getElementById('log-export-btn')?.addEventListener('click', () => {
      const qs = new URLSearchParams({
        module: 'admin',
        action: 'exportLogs',
        ..._logFilters,
      });
      window.location.href = `api/router.php?${qs.toString()}`;
    }, { signal: _ac.signal });

    document.getElementById('log-apply-btn')?.addEventListener('click', () => {
      _logFilters = {
        action_filter: document.getElementById('log-filter-action')?.value || '',
        event_type: document.getElementById('log-filter-event')?.value || '',
        table_name: document.getElementById('log-filter-table')?.value || '',
        date_from: document.getElementById('log-filter-from')?.value || '',
        date_to: document.getElementById('log-filter-to')?.value || '',
        search: document.getElementById('log-filter-search')?.value.trim() || '',
      };
      _fetchAndRenderLogs(true);
    }, { signal: _ac.signal });

    document.getElementById('log-reset-btn')?.addEventListener('click', () => {
      _logFilters = { action_filter: '', event_type: '', table_name: '', date_from: '', date_to: '', search: '' };
      document.getElementById('log-filter-action').value = '';
      document.getElementById('log-filter-event').value = '';
      document.getElementById('log-filter-table').value = '';
      document.getElementById('log-filter-from').value = '';
      document.getElementById('log-filter-to').value = '';
      document.getElementById('log-filter-search').value = '';
      _fetchAndRenderLogs(true);
    }, { signal: _ac.signal });

    // Initial fetch
    _fetchAndRenderLogs(true);
  }

  async function _fetchAndRenderLogs(reset = false) {
    if (reset) {
      _logsOffset = 0;
      _allLogs = [];
    }

    const wrap = document.getElementById('logs-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento log…</div>`;

    try {
      const qs = new URLSearchParams({
        module: 'admin',
        action: 'listLogs',
        limit: String(_logsPageSize),
        offset: String(_logsOffset),
        ..._logFilters,
      });

      const res = await fetch(`api/router.php?${qs.toString()}`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore caricamento log');

      const newLogs = json.data.logs || [];
      _allLogs = reset ? newLogs : [..._allLogs, ...newLogs];
      _logsOffset += newLogs.length;

      _renderLogsTable(_allLogs, json.data.count < _logsPageSize);
    } catch (err) {
      wrap.innerHTML = Utils.emptyState('Errore caricamento log', err.message);
    }
  }

  function _renderLogsTable(logs, isLastPage) {
    const wrap = document.getElementById('logs-table-wrap');
    if (!wrap) return;

    if (logs.length === 0) {
      wrap.innerHTML = Utils.emptyState('Nessun log trovato', 'Prova a modificare i filtri applicati.');
      return;
    }

    const rows = logs.map((log, idx) => {
      const actionColor = _LOG_ACTION_COLORS[log.action] || 'muted';
      const actionLabel = _LOG_ACTION_LABELS[log.action] || log.action;
      const eventType = (log.event_type || 'crud').toLowerCase();
      const eventColor = _LOG_EVENT_COLORS[eventType] || 'muted';
      const eventLabel = _LOG_EVENT_LABELS[eventType] || log.event_type || '—';
      const hasDetail = log.before_snapshot || log.after_snapshot || log.details;
      const detailId = `log-detail-${idx}`;
      const httpStatus = log.http_status || '';
      const statusColor = httpStatus >= 400 ? 'color:#FF00FF;' : httpStatus >= 300 ? 'color:#FFD600;' : 'color:var(--color-text-muted);';
      const roleColors = { admin: 'pink', manager: 'blue', allenatore: 'green', operatore: 'muted', atleta: 'muted' };
      const roleColor = roleColors[log.role] || 'muted';

      return `
        <tr class="log-row${hasDetail ? ' log-row-expandable' : ''}" data-detail="${detailId}" style="cursor:${hasDetail ? 'pointer' : 'default'};">
          <td style="font-size:12px;white-space:nowrap;color:var(--color-text-muted);">${Utils.escapeHtml(_formatLogDate(log.created_at))}</td>
          <td>
            <span style="font-weight:600;font-size:13px;">${log.user_name ? Utils.escapeHtml(log.user_name) : '<span style="color:var(--color-text-muted);">Sistema</span>'}</span>
          </td>
          <td>${log.role ? Utils.badge(log.role, roleColor) : '<span style="color:var(--color-text-muted);">—</span>'}</td>
          <td style="font-size:11px;color:var(--color-text-muted);font-family:monospace;">${Utils.escapeHtml(log.ip_address || '—')}</td>
          <td>${Utils.badge(actionLabel, actionColor)}</td>
          <td>${Utils.badge(eventLabel, eventColor)}</td>
          <td style="font-size:12px;font-family:monospace;">${Utils.escapeHtml(log.table_name)}</td>
          <td style="font-size:11px;color:var(--color-text-muted);font-family:monospace;">${log.record_id ? Utils.escapeHtml(log.record_id) : '—'}</td>
          <td style="font-size:11px;font-family:monospace;${statusColor}">${httpStatus || '—'}</td>
          <td style="text-align:center;font-size:14px;color:var(--color-text-muted);">${hasDetail ? '▸' : ''}</td>
        </tr>
        ${hasDetail ? `
        <tr id="${detailId}" class="log-detail-row" style="display:none;">
          <td colspan="9" style="padding:0;">
            <div style="padding:var(--sp-3);background:rgba(255,255,255,0.03);border-left:3px solid var(--color-pink);display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
              ${log.details ? `
              <div style="grid-column:1/-1;">
                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Dettagli</p>
                <p style="font-size:12px;color:var(--color-text);margin:0;">${Utils.escapeHtml(log.details)}</p>
              </div>` : ''}
              <div>
                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Prima (before)</p>
                <pre style="font-size:11px;color:#98c8ff;white-space:pre-wrap;overflow-x:auto;margin:0;background:rgba(0,0,0,0.3);padding:var(--sp-2);">${log.before_snapshot ? Utils.escapeHtml(JSON.stringify(JSON.parse(log.before_snapshot), null, 2)) : '—'}</pre>
              </div>
              <div>
                <p style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);margin-bottom:6px;">Dopo (after)</p>
                <pre style="font-size:11px;color:#b9f6ca;white-space:pre-wrap;overflow-x:auto;margin:0;background:rgba(0,0,0,0.3);padding:var(--sp-2);">${log.after_snapshot ? Utils.escapeHtml(JSON.stringify(JSON.parse(log.after_snapshot), null, 2)) : '—'}</pre>
              </div>
            </div>
          </td>
        </tr>` : ''}
      `;
    }).join('');

    wrap.innerHTML = `
      <div class="table-wrapper">
        <table class="table" id="logs-table">
          <thead><tr>
            <th>Data/Ora</th>
            <th>Utente</th>
            <th>Ruolo</th>
            <th>IP</th>
            <th>Azione</th>
            <th>Tipo</th>
            <th>Tabella</th>
            <th>Record ID</th>
            <th>Status</th>
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${!isLastPage ? `
        <div style="text-align:center;margin-top:var(--sp-3);">
          <button class="btn btn-ghost btn-sm" id="log-more-btn" type="button">Carica altri…</button>
        </div>` : `
        <p style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-3);">
          ${logs.length} ${logs.length === 1 ? 'evento trovato' : 'eventi trovati'}
        </p>`}
    `;

    // Expand/collapse rows
    wrap.querySelectorAll('.log-row-expandable').forEach(row => {
      row.addEventListener('click', () => {
        const detailRow = document.getElementById(row.dataset.detail);
        if (!detailRow) return;
        const isOpen = detailRow.style.display !== 'none';
        detailRow.style.display = isOpen ? 'none' : 'table-row';
        const arrow = row.querySelector('td:last-child');
        if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
      }, { signal: _ac.signal });
    });

    document.getElementById('log-more-btn')?.addEventListener('click', () => {
      _fetchAndRenderLogs(false);
    }, { signal: _ac.signal });
  }

  function _formatLogDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ─── CERTS ────────────────────────────────────────────────────────────────
  async function loadCerts() {
    const content = document.getElementById('admin-content');
    try {
      const [certs, expiring] = await Promise.all([
        Store.get('listCertificates', 'admin'),
        Store.get('expiringCertificates', 'admin'),
      ]);

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
          <p class="section-label" style="margin:0;">Certificati Medici</p>
          <button class="btn btn-primary btn-sm" id="upload-cert-btn" type="button">+ CARICA CERTIFICATO</button>
        </div>

        ${expiring.length > 0 ? `
          <div style="padding:var(--sp-2) var(--sp-3);background:rgba(255,214,0,0.08);border:1px solid #FFD600;margin-bottom:var(--sp-3);">
            <p style="color:#FFD600;font-size:13px;font-weight:600;">⚠ ${expiring.length} certificat${expiring.length === 1 ? 'o' : 'i'} in scadenza entro 30 giorni</p>
          </div>` : ''}

        ${certs.length === 0
          ? Utils.emptyState('Nessun certificato caricato', 'Carica il primo certificato usando il pulsante in alto.')
          : `<div class="table-wrapper">
              <table class="table">
                <thead><tr>
                  <th>Atleta</th><th>Squadra</th><th>Tipo</th>
                  <th>Scadenza</th><th>OCR Estratto</th><th>Stato</th>
                </tr></thead>
                <tbody>
                  ${certs.map(c => {
            const days = Utils.daysUntil(c.expiry_date);
            const statusVariant = days !== null && days <= 0 ? 'red' : days !== null && days <= 30 ? 'yellow' : 'green';
            return `<tr>
                      <td><strong>${Utils.escapeHtml(c.athlete_name)}</strong></td>
                      <td>${Utils.badge(Utils.escapeHtml(c.category + ' — ' + c.team_name), 'muted')}</td>
                      <td>${Utils.escapeHtml(c.type)}</td>
                      <td style="font-weight:${days !== null && days <= 30 ? '600' : '400'};">
                        ${Utils.formatDate(c.expiry_date)}
                        ${days !== null ? `<br><span style="font-size:11px;color:${days <= 0 ? '#FF00FF' : days <= 30 ? '#FFD600' : 'var(--color-text-muted)'};">${days <= 0 ? 'SCADUTO' : days + ' giorni'}</span>` : ''}
                      </td>
                      <td style="font-size:12px;color:var(--color-text-muted);">
                        ${c.ocr_extracted_date ? `${Utils.formatDate(c.ocr_extracted_date)} <span class="badge badge-pink" style="font-size:9px;">OCR</span>` : '—'}
                      </td>
                      <td>${Utils.badge(c.status, statusVariant)}</td>
                    </tr>`;
          }).join('')}
                </tbody>
              </table>
            </div>`}`;

      document.getElementById('upload-cert-btn')?.addEventListener('click', () => showUploadModal(), { signal: _ac.signal }, { signal: _ac.signal });

    } catch (err) {
      content.innerHTML = Utils.emptyState('Errore caricamento certificati', err.message);
    }
  }

  // ─── UPLOAD CERT MODAL (with Drag & Drop) ─────────────────────────────────
  async function showUploadModal() {
    let athleteOptions = '<option value="">Caricamento...</option>';
    try {
      const athletes = await Store.get('list', 'athletes');
      athleteOptions = '<option value="">Seleziona atleta...</option>' + athletes.map(a => `<option value="${a.id}">${Utils.escapeHtml(a.full_name)} — ${Utils.escapeHtml(a.team_name)}</option>`).join('');
    } catch {
      athleteOptions = '<option value="">Nessun atleta trovato</option>';
    }

    const m = UI.modal({
      title: 'Carica Certificato Medico',
      body: `
        <div class="form-group">
          <label class="form-label" for="cert-athlete">Atleta *</label>
          <select id="cert-athlete" class="form-select">${athleteOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label" for="cert-type">Tipo</label>
          <select id="cert-type" class="form-select">
            <option value="agonistico">Agonistico</option>
            <option value="non_agonistico">Non Agonistico</option>
          </select>
        </div>

        <!-- Drag & Drop Upload Zone -->
        <div class="upload-zone" id="cert-drop-zone" role="button" tabindex="0" aria-label="Trascina file o clicca per selezionare">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.4;margin:0 auto;" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>Trascina il certificato qui<br><span style="color:var(--color-pink);text-decoration:underline;cursor:pointer;">oppure fai clic per selezionare</span></p>
          <p style="font-size:11px;margin-top:4px;">JPG, PNG, WEBP o PDF — Max 5MB</p>
        </div>
        <input id="cert-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="sr-only" aria-label="File certificato">
        <div id="cert-file-preview" style="margin-top:8px;font-size:13px;color:var(--color-pink);"></div>

        <!-- Manual fallback date -->
        <div class="form-group">
          <label class="form-label" for="cert-expiry">
            Data scadenza (solo se OCR non disponibile)
            <span style="color:var(--color-text-muted);font-weight:400;text-transform:none;letter-spacing:0;">&nbsp;— opzionale, verrà rilevata automaticamente</span>
          </label>
          <input id="cert-expiry" class="form-input" type="date">
        </div>

        <div id="cert-ocr-result" class="hidden" style="padding:var(--sp-2);background:rgba(0,230,118,0.08);border:1px solid #00E676;font-size:13px;">
          <strong style="color:#00E676;">✓ Data estratta via OCR AI:</strong> <span id="cert-ocr-date"></span>
        </div>

        <div id="cert-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="cert-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="cert-upload" type="button" disabled>CARICA</button>`,
    });

    // Wire drag & drop
    const dropZone = document.getElementById('cert-drop-zone');
    const fileInput = document.getElementById('cert-file');

    dropZone?.addEventListener('click', () => fileInput?.click(), { signal: _ac.signal }, { signal: _ac.signal });
    dropZone?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput?.click(); }, { signal: _ac.signal }, { signal: _ac.signal });
    dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); }, { signal: _ac.signal }, { signal: _ac.signal });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'), { signal: _ac.signal }, { signal: _ac.signal });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) _handleFile(file);
    }, { signal: _ac.signal });
    fileInput?.addEventListener('change', () => {
      if (fileInput.files[0]) _handleFile(fileInput.files[0]);
    }, { signal: _ac.signal });

    function _handleFile(file) {
      document.getElementById('cert-file-preview').textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      document.getElementById('cert-upload').disabled = false;
    }

    document.getElementById('cert-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal }, { signal: _ac.signal });
    document.getElementById('cert-upload')?.addEventListener('click', () => _doUpload(m), { signal: _ac.signal }, { signal: _ac.signal });
  }

  async function _doUpload(modal) {
    const athleteId = document.getElementById('cert-athlete').value.trim();
    const type = document.getElementById('cert-type').value;
    const fileInput = document.getElementById('cert-file');
    const expiryEl = document.getElementById('cert-expiry');
    const errEl = document.getElementById('cert-error');
    const btn = document.getElementById('cert-upload');

    if (!athleteId) { errEl.textContent = 'Inserisci l\'ID atleta'; errEl.classList.remove('hidden'); return; }

    const file = fileInput?.files?.[0];
    if (!file) { errEl.textContent = 'Seleziona un file'; errEl.classList.remove('hidden'); return; }
    if (file.size > 5 * 1024 * 1024) { errEl.textContent = 'File troppo grande (max 5MB)'; errEl.classList.remove('hidden'); return; }

    btn.disabled = true; btn.textContent = 'Analisi OCR...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('athlete_id', athleteId);
    formData.append('type', type);
    if (expiryEl.value) formData.append('expiry_date', expiryEl.value);

    try {
      const res = await fetch('api/router.php?action=uploadCertificate&module=admin', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore upload');

      modal.close();
      UI.toast(`Certificato caricato. Scadenza: ${Utils.formatDate(json.data.expiry_date)}${json.data.ocr_date ? ' (rilevata via OCR AI)' : ''}`, 'success');
      loadCerts();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'CARICA';
    }
  }

  // ─── CONTRACTS ────────────────────────────────────────────────────────────
  async function loadContracts() {
    const content = document.getElementById('admin-content');
    try {
      const contracts = await Store.get('listContracts', 'admin');

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
          <p class="section-label" style="margin:0;">Contratti Collaboratori</p>
          <button class="btn btn-primary btn-sm" id="new-contract-btn" type="button">+ GENERA CONTRATTO</button>
        </div>

        ${contracts.length === 0
          ? Utils.emptyState('Nessun contratto generato', 'Genera il primo contratto per un collaboratore sportivo.')
          : `<div class="table-wrapper">
              <table class="table">
                <thead><tr>
                  <th>Collaboratore</th><th>Ruolo</th><th>Validità</th><th>Compenso</th><th>Stato</th><th>PDF</th>
                </tr></thead>
                <tbody>
                  ${contracts.map(c => `<tr>
                    <td><strong>${Utils.escapeHtml(c.user_name)}</strong><br><span style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(c.user_email)}</span></td>
                    <td style="font-size:12px;">${Utils.escapeHtml(c.role_description || '—')}</td>
                    <td style="font-size:12px;">${Utils.formatDate(c.valid_from)} → ${Utils.formatDate(c.valid_to)}</td>
                    <td>${c.monthly_fee_eur ? Utils.formatCurrency(c.monthly_fee_eur) + '/mese' : 'Gratuito'}</td>
                    <td>${Utils.badge(c.status, c.status === 'signed' ? 'green' : c.status === 'expired' ? 'red' : 'muted')}</td>
                    <td>${c.pdf_path
              ? `<a class="btn btn-ghost btn-sm" href="storage/pdfs/${Utils.escapeHtml(c.pdf_path)}" target="_blank" rel="noopener">↓ PDF</a>`
              : '<span style="color:var(--color-text-muted);font-size:12px;">Generazione...</span>'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`}`;

      document.getElementById('new-contract-btn')?.addEventListener('click', () => showContractModal(), { signal: _ac.signal }, { signal: _ac.signal });
    } catch (err) {
      content.innerHTML = Utils.emptyState('Errore caricamento contratti', err.message);
    }
  }

  function showContractModal() {
    const m = UI.modal({
      title: 'Genera Contratto',
      body: `
        <div class="form-group">
          <label class="form-label" for="ctr-user">ID Utente collaboratore *</label>
          <input id="ctr-user" class="form-input" type="text" placeholder="USR_xxxx">
        </div>
        <div class="form-group">
          <label class="form-label" for="ctr-role">Descrizione ruolo/mansione *</label>
          <textarea id="ctr-role" class="form-textarea" placeholder="Allenatore Settore Giovanile U14..." style="min-height:80px;"></textarea>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ctr-from">Inizio validità *</label>
            <input id="ctr-from" class="form-input" type="date" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ctr-to">Fine validità *</label>
            <input id="ctr-to" class="form-input" type="date" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ctr-fee">Compenso mensile (€) — vuoto = gratuito</label>
          <input id="ctr-fee" class="form-input" type="number" min="0" step="0.01" placeholder="500.00">
        </div>
        <div id="ctr-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="ctr-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="ctr-save" type="button">GENERA & SCARICA PDF</button>`,
    });

    document.getElementById('ctr-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal }, { signal: _ac.signal });
    document.getElementById('ctr-save')?.addEventListener('click', async () => {
      const userId = document.getElementById('ctr-user').value.trim();
      const role = document.getElementById('ctr-role').value.trim();
      const from = document.getElementById('ctr-from').value;
      const to = document.getElementById('ctr-to').value;
      const fee = document.getElementById('ctr-fee').value;
      const errEl = document.getElementById('ctr-error');

      if (!userId || !role || !from || !to) { errEl.textContent = 'Compila tutti i campi obbligatori'; errEl.classList.remove('hidden'); return; }

      const btn = document.getElementById('ctr-save');
      btn.disabled = true; btn.textContent = 'Generazione PDF...';

      try {
        const res = await Store.api('generateContract', 'admin', {
          user_id: userId, role_description: role,
          valid_from: from, valid_to: to,
          monthly_fee_eur: fee || null,
        });
        m.close();
        UI.toast('Contratto generato correttamente', 'success');
        loadContracts();
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'GENERA & SCARICA PDF';
      }
    }, { signal: _ac.signal });
  }

  // ─── USERS ────────────────────────────────────────────────────────────────
  const _ROLES = ['admin', 'manager', 'allenatore', 'operatore', 'atleta'];
  const _ROLE_LABELS = {
    admin: 'Admin',
    manager: 'Manager',
    allenatore: 'Allenatore',
    operatore: 'Operatore',
    atleta: 'Atleta',
  };
  const _ROLE_COLORS = {
    admin: 'pink',
    manager: 'blue',
    allenatore: 'green',
    operatore: 'muted',
    atleta: 'muted',
  };

  async function loadUsers() {
    const content = document.getElementById('admin-content');
    try {
      const users = await Store.get('listUsers', 'auth');

      // Mappa colori per status trilatera (ciclo vita = MV ERP)
      const _STATUS_COLORS = { Attivo: 'green', Invitato: 'yellow', Disattivato: 'red' };

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
          <p class="section-label" style="margin:0;">Gestione Utenze</p>
          <button class="btn btn-primary btn-sm" id="new-user-btn" type="button">+ NUOVO UTENTE</button>
        </div>

        ${users.length === 0
          ? Utils.emptyState('Nessun utente trovato', 'Crea il primo utente usando il pulsante in alto.')
          : `<div class="table-wrapper">
              <table class="table" id="users-table">
                <thead><tr>
                  <th></th><th>Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Ultimo accesso</th><th>Azioni</th>
                </tr></thead>
                <tbody>
                  ${users.map(u => {
            const status = u.status || (u.is_active == 1 ? 'Attivo' : 'Disattivato');
            const isActive = status === 'Attivo';
            const isInvited = status === 'Invitato';
            const lastLogin = u.last_login_at
              ? Utils.formatDate(u.last_login_at)
              : '<span style="color:var(--color-text-muted);font-size:11px;">Mai</span>';
            const avatarHtml = u.avatar_path
              ? `<img src="${Utils.escapeHtml(u.avatar_path)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;">`
              : `<div style="width:32px;height:32px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#6366f1;">${Utils.escapeHtml(u.full_name.charAt(0).toUpperCase())}</div>`;

            return `<tr data-uid="${Utils.escapeHtml(u.id)}">
                      <td style="width:40px;padding:6px 4px 6px 12px;">${avatarHtml}</td>
                      <td><strong>${Utils.escapeHtml(u.full_name)}</strong></td>
                      <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(u.email)}</td>
                      <td>${Utils.badge(_ROLE_LABELS[u.role] ?? u.role, _ROLE_COLORS[u.role] ?? 'muted')}</td>
                      <td>${Utils.badge(status, _STATUS_COLORS[status] ?? 'muted')}</td>
                      <td style="font-size:12px;">${lastLogin}</td>
                      <td>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                          <button class="btn btn-ghost btn-sm user-edit-role"
                            data-uid="${Utils.escapeHtml(u.id)}"
                            data-role="${Utils.escapeHtml(u.role)}"
                            data-name="${Utils.escapeHtml(u.full_name)}"
                            title="Modifica ruolo">✏️ Ruolo</button>

                          ${isInvited
                ? `<button class="btn btn-ghost btn-sm user-resend"
                                data-uid="${Utils.escapeHtml(u.id)}"
                                data-name="${Utils.escapeHtml(u.full_name)}"
                                title="Reinvia email di invito"
                                style="color:#FFD600;">📧 Reinvia invito</button>`
                : `<button class="btn btn-ghost btn-sm user-toggle"
                                data-uid="${Utils.escapeHtml(u.id)}"
                                data-active="${isActive ? '1' : '0'}"
                                data-name="${Utils.escapeHtml(u.full_name)}"
                                title="${isActive ? 'Sospendi' : 'Riattiva'}">
                                ${isActive ? '🔒 Sospendi' : '✅ Riattiva'}</button>`}

                          <button class="btn btn-ghost btn-sm user-reset-pwd"
                            data-uid="${Utils.escapeHtml(u.id)}"
                            data-name="${Utils.escapeHtml(u.full_name)}"
                            title="Reset password">🔑 Reset pw</button>

                           <button class="btn btn-ghost btn-sm user-delete"
                             data-uid="${Utils.escapeHtml(u.id)}"
                             data-name="${Utils.escapeHtml(u.full_name)}"
                             title="Elimina utente"
                             style="color:#FF00FF;">��️</button>
                        </div>
                      </td>
                    </tr>`;
          }).join('')}
                </tbody>
              </table>
            </div>`}
      `;

      document.getElementById('new-user-btn')?.addEventListener('click', () => showCreateUserModal(), { signal: _ac.signal });

      Utils.qsa('.user-edit-role').forEach(btn => btn.addEventListener('click', () => {
        showEditRoleModal({ id: btn.dataset.uid, role: btn.dataset.role, full_name: btn.dataset.name });
      }, { signal: _ac.signal }));

      Utils.qsa('.user-toggle').forEach(btn => btn.addEventListener('click', () => {
        _doToggleActive(btn.dataset.uid, btn.dataset.active === '1', btn.dataset.name);
      }, { signal: _ac.signal }));

      Utils.qsa('.user-resend').forEach(btn => btn.addEventListener('click', () => {
        _doResendVerification(btn.dataset.uid, btn.dataset.name);
      }, { signal: _ac.signal }));

      Utils.qsa('.user-reset-pwd').forEach(btn => btn.addEventListener('click', () => {
        showResetPasswordModal({ id: btn.dataset.uid, full_name: btn.dataset.name });
      }, { signal: _ac.signal }));

      Utils.qsa('.user-delete').forEach(btn => btn.addEventListener('click', () => {
        _doDeleteUser(btn.dataset.uid, btn.dataset.name);
      }, { signal: _ac.signal }));

    } catch (err) {
      content.innerHTML = Utils.emptyState('Errore caricamento utenti', err.message);
    }
  }


  async function _doDeleteUser(uid, name) {
    if (!confirm(`Eliminare l'utente "${name}"?\nL'operazione è reversibile solo dall'amministratore del database.`)) return;
    try {
      const res = await fetch('api/router.php?module=auth&action=deleteUser', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore eliminazione utente');
      UI.toast(`Utente ${name} eliminato.`, 'success');
      await loadUsers();
    } catch (err) {
      UI.toast('Errore: ' + err.message, 'error');
    }
  }

  // ─── CREATE USER MODAL ────────────────────────────────────────────────────
  function showCreateUserModal() {
    const m = UI.modal({
      title: 'Nuovo Utente',
      body: `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="nu-name">Nome completo *</label>
            <input id="nu-name" class="form-input" type="text" placeholder="Mario Rossi" autocomplete="name">
          </div>
          <div class="form-group">
            <label class="form-label" for="nu-email">Email *</label>
            <input id="nu-email" class="form-input" type="email" placeholder="mario@esempio.it" autocomplete="email">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="nu-role">Ruolo *</label>
            <select id="nu-role" class="form-select">
              ${_ROLES.map(r => `<option value="${r}">${_ROLE_LABELS[r]}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="nu-phone">Telefono</label>
            <input id="nu-phone" class="form-input" type="tel" placeholder="+39 333 1234567" autocomplete="tel">
          </div>
        </div>
        <div class="form-group" style="padding:var(--sp-2) var(--sp-3);background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);font-size:12px;color:var(--color-text-muted);">
          ℹ️ Verrà generata automaticamente una password temporanea sicura e inviata via email insieme al link di verifica.
        </div>
        <div id="nu-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="nu-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="nu-save" type="button">📧 CREA E INVIA INVITO</button>`,
    });

    document.getElementById('nu-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('nu-save')?.addEventListener('click', () => _doCreateUser(m), { signal: _ac.signal });
  }

  async function _doCreateUser(modal) {
    const name = document.getElementById('nu-name').value.trim();
    const email = document.getElementById('nu-email').value.trim();
    const role = document.getElementById('nu-role').value;
    const phone = document.getElementById('nu-phone').value.trim();
    const errEl = document.getElementById('nu-error');
    const btn = document.getElementById('nu-save');

    errEl.classList.add('hidden');
    if (!name || !email) { errEl.textContent = 'Compila i campi obbligatori'; errEl.classList.remove('hidden'); return; }

    btn.disabled = true; btn.textContent = 'Invio in corso...';
    try {
      const res = await Store.api('createUser', 'auth', { full_name: name, email, role, phone: phone || null });
      modal.close();
      UI.toast(`✅ Utente creato — Email di invito inviata a ${email}`, 'success', 5000);
      loadUsers();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = '📧 CREA E INVIA INVITO';
    }
  }

  // ─── EDIT ROLE MODAL ──────────────────────────────────────────────────────
  function showEditRoleModal(user) {
    const m = UI.modal({
      title: `Modifica ruolo — ${Utils.escapeHtml(user.full_name)}`,
      body: `
        <div class="form-group">
          <label class="form-label" for="er-role">Nuovo ruolo</label>
          <select id="er-role" class="form-select">
            ${_ROLES.map(r => `<option value="${r}" ${r === user.role ? 'selected' : ''}>${_ROLE_LABELS[r]}</option>`).join('')}
          </select>
        </div>
        <div id="er-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="er-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="er-save" type="button">SALVA</button>`,
    });

    document.getElementById('er-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('er-save')?.addEventListener('click', () => _doUpdateRole(user.id, m), { signal: _ac.signal });
  }

  async function _doUpdateRole(userId, modal) {
    const role = document.getElementById('er-role').value;
    const errEl = document.getElementById('er-error');
    const btn = document.getElementById('er-save');

    btn.disabled = true; btn.textContent = 'Salvataggio...';
    try {
      await Store.api('updateUserRole', 'auth', { userId, role });
      modal.close();
      UI.toast('Ruolo aggiornato', 'success');
      loadUsers();
    } catch (err) {
      errEl.textContent = err.message; errEl.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'SALVA';
    }
  }

  // ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────
  async function _doToggleActive(userId, currentlyActive, name) {
    const action = currentlyActive ? 'sospendere' : 'riattivare';
    if (!confirm(`Vuoi davvero ${action} l'utente "${name}"?`)) return;
    try {
      await Store.api('toggleUserActive', 'auth', { userId, active: !currentlyActive });
      UI.toast(`Utente ${currentlyActive ? 'sospeso' : 'riattivato'}`, 'success');
      loadUsers();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  // ─── RESEND VERIFICATION ──────────────────────────────────────────────────
  async function _doResendVerification(userId, name) {
    if (!confirm(`Reinviare l'email di invito a "${name}"?`)) return;
    try {
      await Store.api('resendVerification', 'auth', { userId });
      UI.toast(`Email di invito reinviata a ${name}`, 'success');
    } catch (err) {
      UI.toast('Errore: ' + err.message, 'error');
    }
  }

  // ─── RESET PASSWORD MODAL ─────────────────────────────────────────────────
  function showResetPasswordModal(user) {
    const m = UI.modal({
      title: `Reset password — ${Utils.escapeHtml(user.full_name)}`,
      body: `
        <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:var(--sp-3);">
          Verrà generata una password temporanea sicura. Comunicala all'utente e invitalo a cambiarla al primo accesso.
        </p>
        <div id="rp-result" class="hidden" style="padding:var(--sp-2) var(--sp-3);background:rgba(0,230,118,0.08);border:1px solid #00E676;font-size:13px;margin-bottom:var(--sp-2);">
          <strong style="color:#00E676;">✓ Password temporanea generata:</strong><br>
          <code id="rp-pwd" style="font-size:16px;letter-spacing:2px;color:#fff;font-weight:700;"></code>
          <button class="btn btn-ghost btn-sm" id="rp-copy" type="button" style="margin-left:8px;">📋 Copia</button>
        </div>
        <div id="rp-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="rp-cancel" type="button">Chiudi</button>
        <button class="btn btn-primary btn-sm" id="rp-reset" type="button">🔑 GENERA PASSWORD</button>`,
    });

    document.getElementById('rp-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('rp-reset')?.addEventListener('click', async () => {
      const btn = document.getElementById('rp-reset');
      const errEl = document.getElementById('rp-error');
      btn.disabled = true; btn.textContent = 'Generazione...';
      try {
        const res = await Store.api('adminResetPassword', 'auth', { userId: user.id });
        document.getElementById('rp-pwd').textContent = res.tempPassword;
        document.getElementById('rp-result').classList.remove('hidden');
        btn.classList.add('hidden');
        UI.toast('Password temporanea generata', 'success');
      } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = '🔑 GENERA PASSWORD';
      }
    }, { signal: _ac.signal });

    document.getElementById('rp-copy')?.addEventListener('click', () => {
      const pwd = document.getElementById('rp-pwd').textContent;
      navigator.clipboard.writeText(pwd).then(() => UI.toast('Password copiata!', 'success'));
    }, { signal: _ac.signal });
  }

  // ─── TASKS CRM ─────────────────────────────────────────────────────────────

  const _TASK_PRIORITY_COLORS = { Urgente: 'red', Alta: 'yellow', Media: 'blue', Bassa: 'muted' };
  const _TASK_STATUS_COLORS = { 'Da fare': 'muted', 'In corso': 'blue', Completato: 'green', Annullato: 'red' };
  const _TASK_OUTCOME_COLORS = { Positivo: 'green', Neutro: 'muted', Negativo: 'red', 'In attesa': 'yellow' };

  async function loadTasks() {
    const content = document.getElementById('admin-content');

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3);">
        <p class="section-label" style="margin:0;">Task CRM</p>
        <button class="btn btn-primary btn-sm" id="task-new-btn" type="button" style="display:flex;align-items:center;gap:6px;">
          <i class="ph ph-plus"></i> NUOVO TASK
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar" style="flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3);align-items:flex-end;">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Stato</label>
          <select id="task-filter-status" class="form-select" style="min-width:140px;">
            <option value="">Tutti gli stati</option>
            <option value="Da fare">Da fare</option>
            <option value="In corso">In corso</option>
            <option value="Completato">Completato</option>
            <option value="Annullato">Annullato</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Priorità</label>
          <select id="task-filter-priority" class="form-select" style="min-width:130px;">
            <option value="">Tutte</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Bassa">Bassa</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Cerca</label>
          <input id="task-filter-search" type="search" class="form-input" placeholder="Titolo o note…" style="min-width:200px;">
        </div>
        <button class="btn btn-primary btn-sm" id="task-apply-btn" type="button" style="align-self:flex-end;">FILTRA</button>
        <button class="btn btn-ghost btn-sm" id="task-reset-btn" type="button" style="align-self:flex-end;">Reset</button>
      </div>

      <div id="tasks-wrap"></div>
    `;

    document.getElementById('task-new-btn')?.addEventListener('click', () => _showTaskModal(null), { signal: _ac.signal });
    document.getElementById('task-apply-btn')?.addEventListener('click', () => _fetchAndRenderTasks(), { signal: _ac.signal });
    document.getElementById('task-reset-btn')?.addEventListener('click', () => {
      document.getElementById('task-filter-status').value = '';
      document.getElementById('task-filter-priority').value = '';
      document.getElementById('task-filter-search').value = '';
      _fetchAndRenderTasks();
    }, { signal: _ac.signal });

    await _fetchAndRenderTasks();
  }

  async function _fetchAndRenderTasks() {
    const wrap = document.getElementById('tasks-wrap');
    if (!wrap) return;
    wrap.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento task…</div>`;

    const qs = new URLSearchParams({
      module: 'tasks', action: 'listTasks',
      status: document.getElementById('task-filter-status')?.value || '',
      priority: document.getElementById('task-filter-priority')?.value || '',
      search: document.getElementById('task-filter-search')?.value || '',
    });

    try {
      const res = await fetch(`api/router.php?${qs}`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore');
      _renderTasksTable(json.data.tasks || []);
    } catch (err) {
      wrap.innerHTML = Utils.emptyState('Errore caricamento task', err.message);
    }
  }

  function _renderTasksTable(tasks) {
    const wrap = document.getElementById('tasks-wrap');
    if (!wrap) return;

    if (tasks.length === 0) {
      wrap.innerHTML = Utils.emptyState('Nessun task trovato', 'Crea il primo task con il pulsante in alto.');
      return;
    }

    const rows = tasks.map((t, idx) => {
      const prioColor = _TASK_PRIORITY_COLORS[t.priority] || 'muted';
      const statusColor = _TASK_STATUS_COLORS[t.status] || 'muted';
      const detailId = `task-detail-${idx}`;
      const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completato' && t.status !== 'Annullato';
      const dueStr = t.due_date ? new Date(t.due_date).toLocaleDateString('it-IT') : '—';

      return `
        <tr class="log-row log-row-expandable" data-task-id="${Utils.escapeHtml(t.id)}" data-detail="${detailId}" style="cursor:pointer;">
          <td style="max-width:280px;">
            <span style="font-weight:600;">${Utils.escapeHtml(t.title)}</span>
            ${t.category ? `<br><span style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(t.category)}</span>` : ''}
          </td>
          <td>${Utils.badge(t.priority, prioColor)}</td>
          <td>${Utils.badge(t.status, statusColor)}</td>
          <td style="font-size:12px;${overdue ? 'color:#FF00FF;font-weight:600;' : 'color:var(--color-text-muted);'}">${dueStr}${overdue ? ' ⚠️' : ''}</td>
          <td style="font-size:12px;color:var(--color-text-muted);">${t.assignee_name ? Utils.escapeHtml(t.assignee_name) : '—'}</td>
          <td style="text-align:right;">
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-sm task-edit-btn" data-idx="${idx}" style="display:flex;align-items:center;gap:4px;" title="Modifica">
                <i class="ph ph-pencil"></i>
              </button>
              <button class="btn btn-ghost btn-sm task-del-btn" data-idx="${idx}" style="color:#FF00FF;" title="Elimina">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </td>
          <td style="text-align:center;font-size:14px;color:var(--color-text-muted);">&#9654;</td>
        </tr>
        <tr id="${detailId}" class="log-detail-row" style="display:none;">
          <td colspan="7" style="padding:0;">
            <div style="padding:var(--sp-3);background:rgba(255,255,255,0.03);border-left:3px solid var(--color-pink);">
              ${t.notes ? `<p style="font-size:12px;color:var(--color-text);margin-bottom:var(--sp-2);"><strong>Note:</strong> ${Utils.escapeHtml(t.notes)}</p>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
                <span style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--color-text-muted);">Log Interazioni</span>
                <button class="btn btn-ghost btn-sm task-log-add-btn" data-task-id="${Utils.escapeHtml(t.id)}" data-detail="${detailId}" style="display:flex;align-items:center;gap:4px;font-size:11px;">
                  <i class="ph ph-plus"></i> Aggiungi interazione
                </button>
              </div>
              <div id="task-logs-${Utils.escapeHtml(t.id)}" style="min-height:30px;">
                <span style="font-size:12px;color:var(--color-text-muted);">Caricamento…</span>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <div class="table-wrapper">
        <table class="table" id="tasks-table">
          <thead><tr>
            <th>Task</th>
            <th>Priorità</th>
            <th>Stato</th>
            <th>Scadenza</th>
            <th>Assegnato a</th>
            <th style="text-align:right;">Azioni</th>
            <th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-3);">${tasks.length} task</p>
    `;

    // Expand/collapse + load logs
    wrap.querySelectorAll('.log-row-expandable').forEach((row, idx) => {
      row.addEventListener('click', async (e) => {
        if (e.target.closest('button')) return;
        const detailRow = document.getElementById(row.dataset.detail);
        if (!detailRow) return;
        const isOpen = detailRow.style.display !== 'none';
        detailRow.style.display = isOpen ? 'none' : 'table-row';
        const arrow = row.querySelector('td:last-child');
        if (arrow) arrow.innerHTML = isOpen ? '&#9654;' : '&#9660;';
        if (!isOpen) await _loadTaskLogs(tasks[idx].id);
      }, { signal: _ac.signal });
    });

    // Edit buttons
    wrap.querySelectorAll('.task-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => _showTaskModal(tasks[+btn.dataset.idx]), { signal: _ac.signal });
    });

    // Delete buttons
    wrap.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', () => _deleteTask(tasks[+btn.dataset.idx]), { signal: _ac.signal });
    });

    // Add-log buttons
    wrap.querySelectorAll('.task-log-add-btn').forEach(btn => {
      btn.addEventListener('click', () => _showTaskLogModal(btn.dataset.taskId, btn.dataset.detail), { signal: _ac.signal });
    });
  }

  async function _loadTaskLogs(taskId) {
    const container = document.getElementById(`task-logs-${taskId}`);
    if (!container) return;

    try {
      const res = await fetch(`api/router.php?module=tasks&action=listTaskLogs&task_id=${encodeURIComponent(taskId)}`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const logs = json.data.logs || [];
      if (logs.length === 0) {
        container.innerHTML = `<span style="font-size:12px;color:var(--color-text-muted);">Nessuna interazione registrata.</span>`;
        return;
      }

      container.innerHTML = `
        <div class="table-wrapper" style="margin-top:var(--sp-1);">
          <table class="table" style="font-size:12px;">
            <thead><tr><th>Data</th><th>Utente</th><th>Note</th><th>Esito</th><th>Richiamata</th><th></th></tr></thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td style="white-space:nowrap;color:var(--color-text-muted);">${new Date(l.interaction_date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>${l.user_name ? Utils.escapeHtml(l.user_name) : '—'}</td>
                  <td>${l.notes ? Utils.escapeHtml(l.notes) : '—'}</td>
                  <td>${l.outcome ? Utils.badge(l.outcome, _TASK_OUTCOME_COLORS[l.outcome] || 'muted') : '—'}</td>
                  <td style="font-size:11px;">${l.schedule_followup && l.followup_date ? '📅 ' + new Date(l.followup_date).toLocaleDateString('it-IT') : (l.schedule_followup ? 'Sì' : '—')}</td>
                  <td><button class="btn btn-ghost btn-sm tlog-del" data-id="${Utils.escapeHtml(l.id)}" data-task="${Utils.escapeHtml(taskId)}" style="color:#FF00FF;"><i class="ph ph-trash"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('.tlog-del').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Eliminare questo log di interazione?')) return;
          try {
            const r = await fetch('api/router.php?module=tasks&action=deleteTaskLog', {
              method: 'POST', credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: btn.dataset.id }),
            });
            const j = await r.json();
            if (!j.success) throw new Error(j.error);
            await _loadTaskLogs(btn.dataset.task);
          } catch (err) { UI.toast('Errore: ' + err.message, 'error'); }
        }, { signal: _ac.signal });
      });
    } catch (err) {
      container.innerHTML = `<span style="font-size:12px;color:#FF00FF;">Errore: ${Utils.escapeHtml(err.message)}</span>`;
    }
  }

  function _showTaskModal(task = null) {
    const isEdit = task !== null;
    const m = UI.modal({
      title: isEdit ? 'Modifica Task' : 'Nuovo Task',
      body: `
        <div class="form-group">
          <label class="form-label" for="task-title">Titolo *</label>
          <input id="task-title" class="form-input" type="text" value="${isEdit ? Utils.escapeHtml(task.title) : ''}">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="task-category">Categoria</label>
            <input id="task-category" class="form-input" type="text" value="${isEdit ? Utils.escapeHtml(task.category || '') : 'Interno'}">
          </div>
          <div class="form-group">
            <label class="form-label" for="task-priority">Priorità</label>
            <select id="task-priority" class="form-select">
              ${['Bassa', 'Media', 'Alta', 'Urgente'].map(p => `<option ${(isEdit ? task.priority : 'Media') === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="task-status">Stato</label>
            <select id="task-status" class="form-select">
              ${['Da fare', 'In corso', 'Completato', 'Annullato'].map(s => `<option ${(isEdit ? task.status : 'Da fare') === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="task-due">Scadenza</label>
            <input id="task-due" class="form-input" type="date" value="${isEdit && task.due_date ? task.due_date.substring(0, 10) : ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="task-notes">Note</label>
          <textarea id="task-notes" class="form-textarea" style="min-height:80px;">${isEdit ? Utils.escapeHtml(task.notes || '') : ''}</textarea>
        </div>
        <div id="task-modal-err" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="task-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="task-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
    });

    document.getElementById('task-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('task-save')?.addEventListener('click', async () => {
      const title = document.getElementById('task-title').value.trim();
      const errEl = document.getElementById('task-modal-err');
      if (!title) { errEl.textContent = 'Il titolo è obbligatorio'; errEl.classList.remove('hidden'); return; }

      const payload = {
        title,
        category: document.getElementById('task-category').value.trim(),
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        due_date: document.getElementById('task-due').value || null,
        notes: document.getElementById('task-notes').value.trim() || null,
      };
      if (isEdit) payload.id = task.id;

      try {
        const action = isEdit ? 'updateTask' : 'createTask';
        const res = await fetch(`api/router.php?module=tasks&action=${action}`, {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Errore');
        m.close();
        UI.toast(isEdit ? 'Task aggiornato' : 'Task creato', 'success');
        await _fetchAndRenderTasks();
      } catch (err) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    }, { signal: _ac.signal });
  }

  function _showTaskLogModal(taskId, detailId) {
    const now = new Date();
    const localNow = now.toISOString().substring(0, 16);

    const m = UI.modal({
      title: 'Registra Interazione',
      body: `
        <div class="form-group">
          <label class="form-label" for="tlog-date">Data/Ora interazione *</label>
          <input id="tlog-date" class="form-input" type="datetime-local" value="${localNow}">
        </div>
        <div class="form-group">
          <label class="form-label" for="tlog-notes">Note</label>
          <textarea id="tlog-notes" class="form-textarea" style="min-height:70px;"></textarea>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="tlog-outcome">Esito</label>
            <select id="tlog-outcome" class="form-select">
              <option value="">Nessuno</option>
              ${['Positivo', 'Neutro', 'Negativo', 'In attesa'].map(o => `<option>${o}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="tlog-followup-date">Data richiamata</label>
            <input id="tlog-followup-date" class="form-input" type="date">
          </div>
        </div>
        <div id="tlog-err" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="tlog-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="tlog-save" type="button">SALVA</button>`,
    });

    document.getElementById('tlog-cancel')?.addEventListener('click', () => m.close(), { signal: _ac.signal });
    document.getElementById('tlog-save')?.addEventListener('click', async () => {
      const date = document.getElementById('tlog-date').value;
      const errEl = document.getElementById('tlog-err');
      if (!date) { errEl.textContent = 'La data è obbligatoria'; errEl.classList.remove('hidden'); return; }

      const fd = document.getElementById('tlog-followup-date').value;
      try {
        const res = await fetch('api/router.php?module=tasks&action=createTaskLog', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            interaction_date: date.replace('T', ' '),
            notes: document.getElementById('tlog-notes').value.trim() || null,
            outcome: document.getElementById('tlog-outcome').value || null,
            schedule_followup: fd ? 1 : 0,
            followup_date: fd || null,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Errore');
        m.close();
        UI.toast('Interazione registrata', 'success');
        await _loadTaskLogs(taskId);
      } catch (err) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    }, { signal: _ac.signal });
  }

  async function _deleteTask(task) {
    if (!confirm(`Eliminare il task "${task.title}"?\nL'operazione non è reversibile e cancellerà anche tutti i log associati.`)) return;
    try {
      const res = await fetch('api/router.php?module=tasks&action=deleteTask', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Errore');
      UI.toast('Task eliminato', 'success');
      await _fetchAndRenderTasks();
    } catch (err) { UI.toast('Errore: ' + err.message, 'error'); }
  }

  function destroy() {
    _ac.abort();
    _ac = new AbortController();
  }

  return { destroy, init };
})();
window.Admin = Admin;
