/**
 * Admin Module — Medical Certs (OCR), Contracts, Documents
 * Fusion ERP v1.0
 */

'use strict';

const Admin = (() => {
  let _activeTab = 'certs';

  async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Amministrazione</h1>
          <p class="page-subtitle">Certificati medici, contratti e documenti</p>
        </div>
      </div>

      <div class="page-body">
        <!-- Tabs -->
        <div class="filter-bar" style="margin-bottom:var(--sp-3);">
          <button class="filter-chip active" data-tab="certs" type="button">Certificati Medici</button>
          <button class="filter-chip" data-tab="contracts" type="button">Contratti</button>
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
    }));

    loadTab('certs');
  }

  async function loadTab(tab) {
    const content = document.getElementById('admin-content');
    if (!content) return;
    content.innerHTML = `<div>${UI.skeletonPage()}</div>`;
    tab === 'certs' ? await loadCerts() : await loadContracts();
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
                        ${days !== null ? `<br><span style="font-size:11px;color:${days <= 0 ? '#E6007E' : days <= 30 ? '#FFD600' : 'var(--color-text-muted)'};">${days <= 0 ? 'SCADUTO' : days + ' giorni'}</span>` : ''}
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

      document.getElementById('upload-cert-btn')?.addEventListener('click', () => showUploadModal());

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

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput?.click(); });
    dropZone?.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) _handleFile(file);
    });
    fileInput?.addEventListener('change', () => {
      if (fileInput.files[0]) _handleFile(fileInput.files[0]);
    });

    function _handleFile(file) {
      document.getElementById('cert-file-preview').textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
      document.getElementById('cert-upload').disabled = false;
    }

    document.getElementById('cert-cancel')?.addEventListener('click', () => m.close());
    document.getElementById('cert-upload')?.addEventListener('click', () => _doUpload(m));
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

      document.getElementById('new-contract-btn')?.addEventListener('click', () => showContractModal());
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

    document.getElementById('ctr-cancel')?.addEventListener('click', () => m.close());
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
    });
  }

  return { init };
})();
window.Admin = Admin;
