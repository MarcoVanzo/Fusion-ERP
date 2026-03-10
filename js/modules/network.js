"use strict";

const Network = (() => {
    let _abort = new AbortController();
    let _activeTab = 'collaborazioni';
    let _collaborations = [];
    let _trials = [];
    let _activities = [];
    let _activeColFilter = '';
    let _activeTrialFilter = '';

    const TABS = [
        { id: 'collaborazioni', label: 'Collaborazioni', icon: 'handshake' },
        { id: 'prove', label: 'Atleti in Prova', icon: 'user-check' },
        { id: 'attivita', label: 'Attività', icon: 'activity' },
    ];

    const PARTNER_TYPES = ['club', 'agenzia', 'istituzione', 'sponsor', 'altro'];
    const COL_STATUSES = ['attivo', 'scaduto', 'in_rinnovo'];
    const TRIAL_STATUSES = ['in_valutazione', 'approvato', 'non_idoneo', 'da_ricontattare'];

    const TRIAL_STATUS_LABELS = {
        in_valutazione: 'In Valutazione',
        approvato: 'Approvato',
        non_idoneo: 'Non Idoneo',
        da_ricontattare: 'Da Ricontattare',
    };

    const COL_STATUS_LABELS = {
        attivo: 'Attivo',
        scaduto: 'Scaduto',
        in_rinnovo: 'In Rinnovo',
    };

    /* ─── helpers ─────────────────────────────────────────────────────────── */

    function _sig() { return { signal: _abort.signal }; }

    function _statusBadgeHtml(status, prefix = '') {
        const cls = `status-badge status-badge-${CSS.escape ? CSS.escape(status) : status}`;
        const label = ((prefix === 'col' ? COL_STATUS_LABELS : TRIAL_STATUS_LABELS)[status]) || status;
        return `<span class="${cls}">${Utils.escapeHtml(label)}</span>`;
    }

    function _avgScore(trial) {
        const s = parseFloat(trial.avg_score || 0);
        if (!s) return null;
        return s.toFixed(1);
    }

    function _scoreCircle(avg) {
        if (avg === null) return '';
        const pct = ((parseFloat(avg) / 10) * 100).toFixed(1);
        return `<div class="score-circle" style="--pct:${pct}" title="Media valutazioni">${avg}</div>`;
    }

    /* ─── render shell ────────────────────────────────────────────────────── */

    function _renderShell() {
        const app = document.getElementById('app');
        if (!app) return;

        app.innerHTML = `
            <div class="module-wrapper">
                <div class="page-header" style="border-bottom:1px solid var(--color-border);padding:var(--sp-4);padding-bottom:var(--sp-3);margin-bottom:0">
                    <h1 class="page-title">Network</h1>
                    <p class="page-subtitle">Collaborazioni, atleti in prova e attività di rete</p>
                </div>
                <div class="module-body">
                    <main class="module-content" id="net-tab-content"></main>
                </div>
            </div>`;


        _renderTab();
    }

    function _renderTab() {
        const c = document.getElementById('net-tab-content');
        if (!c) return;
        const fn = {
            collaborazioni: _renderCollaborazioni,
            prove: _renderProve,
            attivita: _renderAttivita,
        }[_activeTab];
        if (fn) fn(c);
    }

    /* ─── TAB: COLLABORAZIONI ─────────────────────────────────────────────── */

    function _renderCollaborazioni(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        const filtered = _activeColFilter
            ? _collaborations.filter(c => c.status === _activeColFilter)
            : _collaborations;

        container.innerHTML = `
            <div>
                <div class="net-filter-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                        <button class="filter-chip ${!_activeColFilter ? 'active' : ''}" data-col-status="" type="button">Tutte</button>
                        ${COL_STATUSES.map(s => `
                            <button class="filter-chip ${_activeColFilter === s ? 'active' : ''}" data-col-status="${Utils.escapeHtml(s)}" type="button">
                                ${Utils.escapeHtml(COL_STATUS_LABELS[s] || s)}
                            </button>`).join('')}
                    </div>
                    ${canWrite ? '<button class="btn btn-primary btn-sm" id="net-add-col" type="button"><i class="ph ph-plus"></i> NUOVA COLLABORAZIONE</button>' : ''}
                </div>
                <div class="net-card-grid">
                    ${filtered.length === 0
                ? Utils.emptyState('Nessuna collaborazione', 'Aggiungi la prima collaborazione con il pulsante in alto.')
                : filtered.map(col => `
                            <div class="net-card" data-open-col="${Utils.escapeHtml(col.id)}">
                                <div class="net-card-header">
                                    <div class="net-card-title">${Utils.escapeHtml(col.partner_name)}</div>
                                    ${_statusBadgeHtml(col.status, 'col')}
                                </div>
                                <div class="net-card-meta">
                                    <i class="ph ph-tag" style="margin-right:4px"></i>${Utils.escapeHtml(col.partner_type || '—')}
                                    ${col.agreement_type ? ` · <em>${Utils.escapeHtml(col.agreement_type)}</em>` : ''}
                                </div>
                                ${col.referent_name ? `<div class="net-card-meta"><i class="ph ph-user" style="margin-right:4px"></i>${Utils.escapeHtml(col.referent_name)}</div>` : ''}
                                ${col.start_date || col.end_date ? `
                                    <div class="net-card-meta">
                                        <i class="ph ph-calendar" style="margin-right:4px"></i>
                                        ${col.start_date || ''} → ${col.end_date || '∞'}
                                    </div>` : ''}
                                ${canWrite ? `<div style="display:flex;gap:4px;margin-top:var(--sp-1)">
                                    <button class="btn btn-default btn-sm" data-edit-col="${Utils.escapeHtml(col.id)}" type="button" onclick="event.stopPropagation()"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn btn-default btn-sm" data-del-col="${Utils.escapeHtml(col.id)}" type="button" style="color:var(--color-pink)" onclick="event.stopPropagation()"><i class="ph ph-trash"></i></button>
                                </div>` : ''}
                            </div>`).join('')}
                </div>
            </div>`;

        // Filter chips
        container.querySelectorAll('[data-col-status]').forEach(chip => {
            chip.addEventListener('click', () => {
                _activeColFilter = chip.dataset.colStatus;
                _renderCollaborazioni(container);
            }, _sig());
        });

        // Open detail on card click
        container.querySelectorAll('[data-open-col]').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('button')) return;
                const col = _collaborations.find(c => c.id === card.dataset.openCol);
                if (col) _openColDetailModal(col);
            }, _sig());
        });

        // Edit/delete
        container.querySelectorAll('[data-edit-col]').forEach(btn =>
            btn.addEventListener('click', e => {
                e.stopPropagation();
                _openColModal(_collaborations.find(c => c.id === btn.dataset.editCol));
            }, _sig()));
        container.querySelectorAll('[data-del-col]').forEach(btn =>
            btn.addEventListener('click', e => {
                e.stopPropagation();
                _deleteCollaboration(btn.dataset.delCol);
            }, _sig()));

        // Add
        document.getElementById('net-add-col')?.addEventListener('click', () => _openColModal(null), _sig());
    }

    function _openColModal(col) {
        const isEdit = !!col;
        const typeOpts = PARTNER_TYPES.map(t => `<option value="${t}" ${col?.partner_type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('');
        const statusOpts = COL_STATUSES.map(s => `<option value="${s}" ${col?.status === s ? 'selected' : ''}>${COL_STATUS_LABELS[s] || s}</option>`).join('');

        const m = UI.modal({
            title: isEdit ? 'Modifica Collaborazione' : 'Nuova Collaborazione',
            body: `
                <div class="form-group">
                    <label class="form-label" for="cl-name">Partner *</label>
                    <input id="cl-name" class="form-input" type="text" value="${Utils.escapeHtml(col?.partner_name || '')}" placeholder="Nome club/agenzia...">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="cl-type">Tipo</label>
                        <select id="cl-type" class="form-select">${typeOpts}</select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="cl-status">Stato</label>
                        <select id="cl-status" class="form-select">${statusOpts}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="cl-agreement">Tipo accordo</label>
                    <input id="cl-agreement" class="form-input" type="text" value="${Utils.escapeHtml(col?.agreement_type || '')}" placeholder="es. Prestito, Affiliazione…">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="cl-start">Data Inizio</label>
                        <input id="cl-start" class="form-input" type="date" value="${col?.start_date?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="cl-end">Data Fine</label>
                        <input id="cl-end" class="form-input" type="date" value="${col?.end_date?.substring(0, 10) || ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="cl-ref-name">Referente</label>
                        <input id="cl-ref-name" class="form-input" type="text" value="${Utils.escapeHtml(col?.referent_name || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="cl-ref-contact">Contatto</label>
                        <input id="cl-ref-contact" class="form-input" type="text" value="${Utils.escapeHtml(col?.referent_contact || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Media & Documenti</label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)">
                        <div>
                            <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Logo Aziendale</label>
                            <input id="cl-logo-file" class="form-input" type="file" accept="image/*">
                        </div>
                        <div>
                            <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Allegato Contratto (PDF)</label>
                            <input id="cl-contract-file" class="form-input" type="file" accept=".pdf">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="cl-notes">Note</label>
                    <textarea id="cl-notes" class="form-input" rows="2">${Utils.escapeHtml(col?.notes || '')}</textarea>
                </div>
                <div id="cl-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="cl-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="cl-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
        });

        document.getElementById('cl-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('cl-save')?.addEventListener('click', async () => {
            const name = document.getElementById('cl-name')?.value.trim();
            const err = document.getElementById('cl-error');
            if (!name) { err.textContent = 'Il nome è obbligatorio'; err.classList.remove('hidden'); return; }
            const btn = document.getElementById('cl-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    partner_name: name,
                    partner_type: document.getElementById('cl-type')?.value || 'altro',
                    status: document.getElementById('cl-status')?.value || 'attivo',
                    agreement_type: document.getElementById('cl-agreement')?.value || null,
                    start_date: document.getElementById('cl-start')?.value || null,
                    end_date: document.getElementById('cl-end')?.value || null,
                    referent_name: document.getElementById('cl-ref-name')?.value || null,
                    referent_contact: document.getElementById('cl-ref-contact')?.value || null,
                    notes: document.getElementById('cl-notes')?.value || null,
                };
                let colId = col?.id;
                if (isEdit) {
                    await Store.api('updateCollaboration', 'network', { id: col.id, ...payload });
                } else {
                    const res = await Store.api('createCollaboration', 'network', payload);
                    colId = res.id;
                }

                // Handle logo upload
                const logoFile = document.getElementById('cl-logo-file')?.files[0];
                if (logoFile) {
                    const fd = new FormData();
                    fd.append('collaboration_id', colId);
                    fd.append('logo', logoFile);
                    await Store.api('uploadColLogo', 'network', fd);
                }

                // Handle contract upload
                const contractFile = document.getElementById('cl-contract-file')?.files[0];
                if (contractFile) {
                    const fd = new FormData();
                    fd.append('collaboration_id', colId);
                    fd.append('doc_type', 'contratto');
                    fd.append('file', contractFile);
                    await Store.api('uploadColDocument', 'network', fd);
                }

                _collaborations = await Store.get('listCollaborations', 'network').catch(() => _collaborations);
                m.close();
                UI.toast(isEdit ? 'Collaborazione aggiornata' : 'Collaborazione creata', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.textContent = isEdit ? 'SALVA' : 'CREA';
            }
        });
    }

    function _openColDetailModal(col) {
        const m = UI.modal({
            title: Utils.escapeHtml(col.partner_name),
            body: `
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
                    <div style="display:flex;gap:var(--sp-2);align-items:center;justify-content:space-between">
                        <div style="display:flex;gap:var(--sp-2);align-items:center">
                            ${_statusBadgeHtml(col.status, 'col')}
                            <span style="font-size:13px;color:var(--color-text-muted)">${Utils.escapeHtml(col.partner_type || '')}</span>
                        </div>
                        ${col.logo_path ? `<img src="${col.logo_path}" style="height:40px;object-fit:contain;border-radius:var(--radius-sm)">` : ''}
                    </div>
                    ${col.agreement_type ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Accordo</span><div style="font-weight:600">${Utils.escapeHtml(col.agreement_type)}</div></div>` : ''}
                    ${col.start_date || col.end_date ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Periodo</span><div>${col.start_date || '?'} → ${col.end_date || '∞'}</div></div>` : ''}
                    ${col.referent_name ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Referente</span><div>${Utils.escapeHtml(col.referent_name)} ${col.referent_contact ? '· ' + Utils.escapeHtml(col.referent_contact) : ''}</div></div>` : ''}
                    ${col.notes ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Note</span><div style="font-size:13px">${Utils.escapeHtml(col.notes)}</div></div>` : ''}
                    <div id="col-docs-area" style="margin-top:var(--sp-3)">
                        <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:var(--sp-1)">Documenti Allegati</span>
                        <div id="col-docs-list" style="font-size:13px;display:flex;flex-direction:column;gap:4px">Caricamento...</div>
                    </div>
                </div>`,
            footer: `<button class="btn btn-ghost btn-sm" id="cod-close" type="button">Chiudi</button>`,
        });

        // Load documents
        Store.get('listColDocuments', 'network', { collaboration_id: col.id }).then(docs => {
            const list = document.getElementById('col-docs-list');
            if (!list) return;
            if (!docs.length) {
                list.innerHTML = '<span style="color:var(--color-text-muted);font-style:italic">Nessun documento</span>';
            } else {
                list.innerHTML = docs.map(d => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px;background:var(--color-bg-alt);border-radius:var(--radius-sm)">
                        <span style="display:flex;align-items:center;gap:6px">
                            <i class="ph ph-file-text" style="color:var(--color-primary)"></i>
                            ${Utils.escapeHtml(d.file_name)}
                            ${d.doc_type ? `<small class="badge badge-sm">${Utils.escapeHtml(d.doc_type)}</small>` : ''}
                        </span>
                        <a href="api/?module=network&action=downloadColDocument&docId=${d.id}" target="_blank" class="btn btn-ghost btn-sm" style="height:24px;width:24px;padding:0"><i class="ph ph-download-simple"></i></a>
                    </div>
                `).join('');
            }
        }).catch(err => {
            const list = document.getElementById('col-docs-list');
            if (list) list.innerHTML = `<span style="color:var(--color-pink)">Errore: ${err.message}</span>`;
        });

        document.getElementById('cod-close')?.addEventListener('click', () => m.close());
    }

    async function _deleteCollaboration(id) {
        const col = _collaborations.find(c => c.id === id);
        if (!col) return;
        const m = UI.modal({
            title: 'Elimina Collaborazione',
            body: `<p>Eliminare la collaborazione con <strong>${Utils.escapeHtml(col.partner_name)}</strong>?</p>`,
            footer: `<button class="btn btn-ghost btn-sm" id="dc-cancel" type="button">Annulla</button>
                     <button class="btn btn-primary btn-sm" id="dc-confirm" type="button" style="background:var(--color-pink)">ELIMINA</button>`,
        });
        document.getElementById('dc-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('dc-confirm')?.addEventListener('click', async () => {
            try {
                await Store.api('deleteCollaboration', 'network', { id });
                _collaborations = await Store.get('listCollaborations', 'network').catch(() => _collaborations);
                m.close();
                UI.toast('Collaborazione eliminata', 'success');
                _renderTab();
            } catch (e) { UI.toast('Errore: ' + e.message, 'error'); }
        });
    }

    /* ─── TAB: ATLETI IN PROVA ────────────────────────────────────────────── */

    function _renderProve(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        const filtered = _activeTrialFilter
            ? _trials.filter(t => t.status === _activeTrialFilter)
            : _trials;

        container.innerHTML = `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                        <button class="filter-chip ${!_activeTrialFilter ? 'active' : ''}" data-tr-status="" type="button">Tutti</button>
                        ${TRIAL_STATUSES.map(s => `
                            <button class="filter-chip ${_activeTrialFilter === s ? 'active' : ''}" data-tr-status="${Utils.escapeHtml(s)}" type="button">
                                ${Utils.escapeHtml(TRIAL_STATUS_LABELS[s] || s)}
                            </button>`).join('')}
                    </div>
                    ${canWrite ? '<button class="btn btn-primary btn-sm" id="net-add-trial" type="button"><i class="ph ph-plus"></i> NUOVO ATLETA</button>' : ''}
                </div>
                <div class="table-wrapper" style="overflow-x:auto">
                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                        <thead>
                            <tr>
                                ${['Nome', 'Provenienza', 'Posizione', 'Prova', 'Stato', 'Score', ''].map(h =>
            `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${h}</th>`
        ).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0
                ? `<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta in prova</td></tr>`
                : filtered.map(tr => {
                    const avg = _avgScore(tr);
                    return `<tr>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(tr.full_name || (tr.athlete_first_name + ' ' + tr.athlete_last_name))}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(tr.origin_club || '—')}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(tr.position || '—')}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${tr.trial_start || '—'} → ${tr.trial_end || '∞'}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${_statusBadgeHtml(tr.status)}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${avg ? _scoreCircle(avg) : '<span style="color:var(--color-text-muted);font-size:12px">—</span>'}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">
                                            ${canWrite ? `
                                            <button class="btn btn-ghost btn-sm" data-eval-trial="${Utils.escapeHtml(tr.id)}" type="button" title="Valuta"><i class="ph ph-star"></i></button>
                                            <button class="btn btn-ghost btn-sm" data-edit-trial="${Utils.escapeHtml(tr.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                                            ${!tr.scouting_profile_id ? `<button class="btn btn-ghost btn-sm btn-convert-scouting" data-convert-trial="${Utils.escapeHtml(tr.id)}" type="button" title="Converti in Scouting"><i class="ph ph-arrow-right"></i></button>` : `<span title="Profilo scouting: ${Utils.escapeHtml(tr.scouting_profile_id)}" style="font-size:12px;color:var(--color-success)"><i class="ph ph-check-circle"></i></span>`}
                                            <button class="btn btn-ghost btn-sm" data-del-trial="${Utils.escapeHtml(tr.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ''}
                                        </td>
                                    </tr>`;
                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        // Filter chips
        container.querySelectorAll('[data-tr-status]').forEach(chip =>
            chip.addEventListener('click', () => {
                _activeTrialFilter = chip.dataset.trStatus;
                _renderProve(container);
            }, _sig()));

        // Add
        document.getElementById('net-add-trial')?.addEventListener('click', () => _openTrialModal(null), _sig());

        // Edit
        container.querySelectorAll('[data-edit-trial]').forEach(btn =>
            btn.addEventListener('click', () => _openTrialModal(_trials.find(t => t.id === btn.dataset.editTrial)), _sig()));

        // Evaluate
        container.querySelectorAll('[data-eval-trial]').forEach(btn =>
            btn.addEventListener('click', () => _openEvalModal(btn.dataset.evalTrial), _sig()));

        // Convert to scouting
        container.querySelectorAll('[data-convert-trial]').forEach(btn =>
            btn.addEventListener('click', () => _convertToScouting(btn.dataset.convertTrial), _sig()));

        // Delete
        container.querySelectorAll('[data-del-trial]').forEach(btn =>
            btn.addEventListener('click', () => _deleteTrial(btn.dataset.delTrial), _sig()));
    }

    function _openTrialModal(trial) {
        const isEdit = !!trial;
        const statusOpts = TRIAL_STATUSES.map(s =>
            `<option value="${s}" ${trial?.status === s ? 'selected' : ''}>${TRIAL_STATUS_LABELS[s] || s}</option>`
        ).join('');

        const m = UI.modal({
            title: isEdit ? 'Modifica Atleta in Prova' : 'Nuovo Atleta in Prova',
            body: `
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="tr-first">Nome *</label>
                        <input id="tr-first" class="form-input" type="text" value="${Utils.escapeHtml(trial?.athlete_first_name || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="tr-last">Cognome *</label>
                        <input id="tr-last" class="form-input" type="text" value="${Utils.escapeHtml(trial?.athlete_last_name || '')}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="tr-dob">Data di nascita</label>
                        <input id="tr-dob" class="form-input" type="date" value="${trial?.birth_date?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="tr-nat">Nazionalità</label>
                        <input id="tr-nat" class="form-input" type="text" value="${Utils.escapeHtml(trial?.nationality || '')}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="tr-pos">Posizione</label>
                        <input id="tr-pos" class="form-input" type="text" value="${Utils.escapeHtml(trial?.position || '')}" placeholder="es. Alzatore">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="tr-club">Club di provenienza</label>
                        <input id="tr-club" class="form-input" type="text" value="${Utils.escapeHtml(trial?.origin_club || '')}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="tr-start">Inizio prova</label>
                        <input id="tr-start" class="form-input" type="date" value="${trial?.trial_start?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="tr-end">Fine prova</label>
                        <input id="tr-end" class="form-input" type="date" value="${trial?.trial_end?.substring(0, 10) || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-status">Stato</label>
                    <select id="tr-status" class="form-select">${statusOpts}</select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="tr-notes">Note</label>
                    <textarea id="tr-notes" class="form-input" rows="2">${Utils.escapeHtml(trial?.notes || '')}</textarea>
                </div>
                <div id="tr-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="tr-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="tr-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
        });

        document.getElementById('tr-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('tr-save')?.addEventListener('click', async () => {
            const first = document.getElementById('tr-first')?.value.trim();
            const last = document.getElementById('tr-last')?.value.trim();
            const err = document.getElementById('tr-error');
            if (!first || !last) { err.textContent = 'Nome e cognome obbligatori'; err.classList.remove('hidden'); return; }
            const btn = document.getElementById('tr-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    athlete_first_name: first,
                    athlete_last_name: last,
                    birth_date: document.getElementById('tr-dob')?.value || null,
                    nationality: document.getElementById('tr-nat')?.value || null,
                    position: document.getElementById('tr-pos')?.value || null,
                    origin_club: document.getElementById('tr-club')?.value || null,
                    trial_start: document.getElementById('tr-start')?.value || null,
                    trial_end: document.getElementById('tr-end')?.value || null,
                    status: document.getElementById('tr-status')?.value || 'in_valutazione',
                    notes: document.getElementById('tr-notes')?.value || null,
                };
                if (isEdit) {
                    await Store.api('updateTrial', 'network', { id: trial.id, ...payload });
                } else {
                    await Store.api('createTrial', 'network', payload);
                }
                _trials = await Store.get('listTrials', 'network').catch(() => _trials);
                m.close();
                UI.toast(isEdit ? 'Atleta aggiornato' : 'Atleta aggiunto', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.textContent = isEdit ? 'SALVA' : 'CREA';
            }
        });
    }

    function _openEvalModal(trialId) {
        const DIMS = [
            { key: 'score_technical', label: 'Tecnica' },
            { key: 'score_tactical', label: 'Tattica' },
            { key: 'score_physical', label: 'Fisico' },
            { key: 'score_mental', label: 'Mental' },
            { key: 'score_potential', label: 'Potenziale' },
        ];

        const m = UI.modal({
            title: 'Scheda di Valutazione',
            body: `
                <div class="form-group">
                    <label class="form-label" for="ev-date">Data Valutazione *</label>
                    <input id="ev-date" class="form-input" type="date" value="${new Date().toISOString().substring(0, 10)}">
                </div>
                <div style="margin:var(--sp-3) 0">
                    ${DIMS.map(d => `
                        <div class="eval-slider-row">
                            <span class="eval-slider-label">${Utils.escapeHtml(d.label)}</span>
                            <input type="range" class="eval-slider" id="ev-${d.key}" min="1" max="10" value="5" data-score-dim="${d.key}">
                            <span class="eval-slider-value" id="ev-${d.key}-val">5</span>
                        </div>`).join('')}
                    <div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2);border-top:1px solid var(--color-border);padding-top:var(--sp-2)">
                        <span style="font-size:13px;color:var(--color-text-muted)">Media:</span>
                        <strong id="ev-avg-display" style="font-size:16px;color:var(--color-pink)">5.0</strong>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="ev-video">URL Video</label>
                    <input id="ev-video" class="form-input" type="url" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label class="form-label" for="ev-notes">Note</label>
                    <textarea id="ev-notes" class="form-input" rows="2"></textarea>
                </div>
                <div id="ev-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="ev-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="ev-save" type="button"><i class="ph ph-star"></i> SALVA VALUTAZIONE</button>`,
        });

        // Live average computation
        const computeAvg = () => {
            const vals = DIMS.map(d => parseInt(document.getElementById('ev-' + d.key)?.value || 5));
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const avgEl = document.getElementById('ev-avg-display');
            if (avgEl) avgEl.textContent = avg.toFixed(1);
        };

        DIMS.forEach(d => {
            const slider = document.getElementById('ev-' + d.key);
            const valEl = document.getElementById('ev-' + d.key + '-val');
            slider?.addEventListener('input', () => {
                if (valEl) valEl.textContent = slider.value;
                computeAvg();
            });
        });

        document.getElementById('ev-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('ev-save')?.addEventListener('click', async () => {
            const date = document.getElementById('ev-date')?.value;
            const err = document.getElementById('ev-error');
            if (!date) { err.textContent = 'Data obbligatoria'; err.classList.remove('hidden'); return; }
            const btn = document.getElementById('ev-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    trial_id: trialId,
                    eval_date: date,
                    video_url: document.getElementById('ev-video')?.value || null,
                    notes: document.getElementById('ev-notes')?.value || null,
                };
                DIMS.forEach(d => { payload[d.key] = parseInt(document.getElementById('ev-' + d.key)?.value || 5); });
                await Store.api('evaluateTrial', 'network', payload);
                _trials = await Store.get('listTrials', 'network').catch(() => _trials);
                m.close();
                UI.toast('Valutazione salvata', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.innerHTML = '<i class="ph ph-star"></i> SALVA VALUTAZIONE';
            }
        });
    }

    async function _convertToScouting(trialId) {
        const trial = _trials.find(t => t.id === trialId);
        if (!trial) return;
        const m = UI.modal({
            title: 'Converti in Scouting',
            body: `<p style="font-size:14px">Convertire <strong>${Utils.escapeHtml((trial.athlete_first_name || '') + ' ' + (trial.athlete_last_name || ''))}</strong> in profilo Scouting?</p>
                   <p style="font-size:12px;color:var(--color-text-muted)">Verrà creato un profilo nel modulo Scouting e la prova verrà aggiornata.</p>`,
            footer: `<button class="btn btn-ghost btn-sm" id="cs-cancel" type="button">Annulla</button>
                     <button class="btn btn-primary btn-sm btn-convert-scouting" id="cs-confirm" type="button"><i class="ph ph-arrow-right"></i> CONVERTI</button>`,
        });
        document.getElementById('cs-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('cs-confirm')?.addEventListener('click', async () => {
            const btn = document.getElementById('cs-confirm');
            btn.disabled = true; btn.textContent = 'Conversione...';
            try {
                const res = await Store.api('convertToScouting', 'network', { trial_id: trialId });
                _trials = await Store.get('listTrials', 'network').catch(() => _trials);
                m.close();
                UI.toast(res.message || 'Atleta convertito in Scouting ✓', 'success');
                _renderTab();
            } catch (e) {
                UI.toast('Errore: ' + e.message, 'error');
                btn.disabled = false; btn.innerHTML = '<i class="ph ph-arrow-right"></i> CONVERTI';
            }
        });
    }

    async function _deleteTrial(id) {
        const trial = _trials.find(t => t.id === id);
        if (!trial) return;
        const m = UI.modal({
            title: 'Rimuovi Atleta in Prova',
            body: `<p>Rimuovere <strong>${Utils.escapeHtml((trial.athlete_first_name || '') + ' ' + (trial.athlete_last_name || ''))}</strong>?</p>`,
            footer: `<button class="btn btn-ghost btn-sm" id="dt-cancel" type="button">Annulla</button>
                     <button class="btn btn-primary btn-sm" id="dt-confirm" type="button" style="background:var(--color-pink)">RIMUOVI</button>`,
        });
        document.getElementById('dt-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('dt-confirm')?.addEventListener('click', async () => {
            try {
                await Store.api('deleteTrial', 'network', { id });
                _trials = await Store.get('listTrials', 'network').catch(() => _trials);
                m.close();
                UI.toast('Atleta rimosso', 'success');
                _renderTab();
            } catch (e) { UI.toast('Errore: ' + e.message, 'error'); }
        });
    }

    /* ─── TAB: ATTIVITÀ ────────────────────────────────────────────────────── */

    function _renderAttivita(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        container.innerHTML = `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                    <div class="input-wrapper" style="position:relative;min-width:220px">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                        <input type="text" id="net-act-search" class="form-input" placeholder="Cerca attività..." style="padding-left:36px;height:40px;font-size:13px">
                    </div>
                    ${canWrite ? '<button class="btn btn-primary btn-sm" id="net-add-act" type="button"><i class="ph ph-plus"></i> NUOVA ATTIVITÀ</button>' : ''}
                </div>
                <div class="net-timeline" id="net-timeline">
                    ${_activities.length === 0
                ? Utils.emptyState('Nessuna attività', 'Registra la prima attività di network.')
                : _activities.map(act => `
                            <div class="net-timeline-item" data-act-title="${Utils.escapeHtml((act.title || '').toLowerCase())}">
                                <div class="net-timeline-dot"></div>
                                <div style="min-width:90px;padding-top:2px">
                                    <span class="net-timeline-date">${act.date || ''}</span>
                                </div>
                                <div class="net-timeline-content">
                                    <div class="net-timeline-title">${Utils.escapeHtml(act.title)}</div>
                                    <div class="net-timeline-meta">
                                        ${act.activity_type ? Utils.escapeHtml(act.activity_type) + (act.location ? ' · ' : '') : ''}
                                        ${act.location ? Utils.escapeHtml(act.location) : ''}
                                    </div>
                                    ${act.outcome ? `<div style="font-size:12px;margin-top:4px;color:var(--color-text-muted)">${Utils.escapeHtml(act.outcome)}</div>` : ''}
                                </div>
                                ${canWrite ? `<div style="display:flex;gap:4px;align-self:flex-start;padding-top:2px">
                                    <button class="btn btn-ghost btn-sm" data-edit-act="${Utils.escapeHtml(act.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn btn-ghost btn-sm" data-del-act="${Utils.escapeHtml(act.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ''}
                            </div>`).join('')}
                </div>
            </div>`;

        // Search filter
        document.getElementById('net-act-search')?.addEventListener('input', e => {
            const q = e.target.value.trim().toLowerCase();
            container.querySelectorAll('[data-act-title]').forEach(row =>
                row.style.display = row.dataset.actTitle.includes(q) ? '' : 'none'
            );
        }, _sig());

        // Add
        document.getElementById('net-add-act')?.addEventListener('click', () => _openActivityModal(null), _sig());

        // Edit
        container.querySelectorAll('[data-edit-act]').forEach(btn =>
            btn.addEventListener('click', () => _openActivityModal(_activities.find(a => a.id === btn.dataset.editAct)), _sig()));

        // Delete
        container.querySelectorAll('[data-del-act]').forEach(btn =>
            btn.addEventListener('click', async () => {
                try {
                    await Store.api('deleteActivity', 'network', { id: btn.dataset.delAct });
                    _activities = await Store.get('listActivities', 'network').catch(() => _activities);
                    UI.toast('Attività eliminata', 'success');
                    _renderTab();
                } catch (e) { UI.toast('Errore: ' + e.message, 'error'); }
            }, _sig()));
    }

    function _openActivityModal(act) {
        const isEdit = !!act;
        const m = UI.modal({
            title: isEdit ? 'Modifica Attività' : 'Nuova Attività',
            body: `
                <div class="form-group">
                    <label class="form-label" for="ac-title">Titolo *</label>
                    <input id="ac-title" class="form-input" type="text" value="${Utils.escapeHtml(act?.title || '')}" placeholder="es. Incontro con Pallavolo Roma">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="ac-date">Data *</label>
                        <input id="ac-date" class="form-input" type="date" value="${act?.date?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="ac-type">Tipo</label>
                        <input id="ac-type" class="form-input" type="text" value="${Utils.escapeHtml(act?.activity_type || '')}" placeholder="es. Riunione, Osservazione…">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="ac-loc">Luogo</label>
                    <input id="ac-loc" class="form-input" type="text" value="${Utils.escapeHtml(act?.location || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="ac-outcome">Esito</label>
                    <input id="ac-outcome" class="form-input" type="text" value="${Utils.escapeHtml(act?.outcome || '')}" placeholder="es. Accordo raggiunto">
                </div>
                <div class="form-group">
                    <label class="form-label" for="ac-notes">Note</label>
                    <textarea id="ac-notes" class="form-input" rows="2">${Utils.escapeHtml(act?.notes || '')}</textarea>
                </div>
                <div id="ac-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="ac-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="ac-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
        });

        document.getElementById('ac-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('ac-save')?.addEventListener('click', async () => {
            const title = document.getElementById('ac-title')?.value.trim();
            const date = document.getElementById('ac-date')?.value;
            const err = document.getElementById('ac-error');
            if (!title || !date) { err.textContent = 'Titolo e data obbligatori'; err.classList.remove('hidden'); return; }
            const btn = document.getElementById('ac-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    title,
                    date,
                    activity_type: document.getElementById('ac-type')?.value || null,
                    location: document.getElementById('ac-loc')?.value || null,
                    outcome: document.getElementById('ac-outcome')?.value || null,
                    notes: document.getElementById('ac-notes')?.value || null,
                };
                if (isEdit) {
                    await Store.api('updateActivity', 'network', { id: act.id, ...payload });
                } else {
                    await Store.api('createActivity', 'network', payload);
                }
                _activities = await Store.get('listActivities', 'network').catch(() => _activities);
                m.close();
                UI.toast(isEdit ? 'Attività aggiornata' : 'Attività registrata', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.textContent = isEdit ? 'SALVA' : 'CREA';
            }
        });
    }

    /* ─── public API ──────────────────────────────────────────────────────── */

    return {
        destroy() {
            _abort.abort();
            _abort = new AbortController();
        },

        async init() {
            const app = document.getElementById('app');
            if (!app) return;
            UI.loading(true);
            app.innerHTML = UI.skeletonPage();

            try {
                [_collaborations, _trials, _activities] = await Promise.all([
                    Store.get('listCollaborations', 'network').catch(() => []),
                    Store.get('listTrials', 'network').catch(() => []),
                    Store.get('listActivities', 'network').catch(() => []),
                ]);

                const route = Router.getCurrentRoute();
                if (route === 'network-prove') _activeTab = 'prove';
                else if (route === 'network-attivita') _activeTab = 'attivita';
                else _activeTab = 'collaborazioni';

                _renderShell();
            } catch (err) {
                if (app) app.innerHTML = Utils.emptyState('Errore caricamento', err.message);
                UI.toast('Errore caricamento Network', 'error');
            } finally {
                UI.loading(false);
            }
        },
    };
})();

window.Network = Network;
