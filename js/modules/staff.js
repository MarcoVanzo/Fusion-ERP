'use strict';

/**
 * Staff — Anagrafica Personale Tecnico
 * Fusion ERP v1.0
 * Replica la struttura dell'anagrafica atleti per lo staff.
 */
const Staff = (() => {
    let _ac = new AbortController();
    let _list = [];
    let _currentId = null;

    // ─── Colour avatar ────────────────────────────────────────────────────────
    const COLORS = ['#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];
    function _avatarColor(name) {
        if (!name) return COLORS[0];
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        return COLORS[Math.abs(h) % COLORS.length];
    }

    // ─── Field display helper ─────────────────────────────────────────────────
    function _field(label, value, color) {
        const c = color || 'var(--color-white)';
        return `
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">${Utils.escapeHtml(label)}</span>
          <span style="font-size:14px;font-weight:500;color:${c};">${value ? Utils.escapeHtml(String(value)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>
        </div>`;
    }

    // ─── Render: list view ────────────────────────────────────────────────────
    function _renderList() {
        const app = document.getElementById('app');
        if (!app) return;

        const user = App.getUser();
        const canWrite = ['admin', 'manager', 'operator'].includes(user?.role);

        // Unique roles for filter chips
        const roles = [...new Set(_list.map(m => m.role).filter(Boolean))].sort();

        app.innerHTML = `
            <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:var(--sp-3);margin-bottom:var(--sp-3);">
                <div>
                    <h1 class="page-title">Staff</h1>
                    <p class="page-subtitle">${_list.length} membro${_list.length !== 1 ? 'i' : ''} nel sistema</p>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;">
                <div class="input-wrapper" style="position:relative;min-width:220px;">
                    <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>
                    <input type="text" id="staff-search" class="form-input" placeholder="Cerca membro staff..." style="padding-left:36px;height:42px;font-size:13px;">
                </div>
                ${canWrite ? '<button class="btn btn-primary" id="new-staff-btn" type="button">+ NUOVO MEMBRO</button>' : ''}
            </div>

            <div class="filter-bar" id="staff-role-filter" style="margin-bottom:var(--sp-3);">
                <button class="filter-chip active" data-role="" type="button">Tutti</button>
                ${roles.map(r => `<button class="filter-chip" data-role="${Utils.escapeHtml(r.toLowerCase())}" type="button">${Utils.escapeHtml(r)}</button>`).join('')}
            </div>

            <div class="grid-3" id="staff-grid">
                ${_list.length === 0
                ? Utils.emptyState('Nessun membro staff', 'Aggiungi il primo membro con il pulsante in alto.')
                : _list.map(m => _staffCard(m)).join('')}
            </div>
        `;

        // Search
        document.getElementById('staff-search')?.addEventListener('input', e => {
            const q = e.target.value.trim().toLowerCase();
            document.querySelectorAll('[data-staff-id]').forEach(el => {
                const match = (el.dataset.name || '').includes(q) || (el.dataset.role || '').includes(q);
                el.style.display = match ? '' : 'none';
            });
        }, { signal: _ac.signal });

        // Role filter
        document.querySelectorAll('#staff-role-filter [data-role]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#staff-role-filter [data-role]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const role = btn.dataset.role;
                document.querySelectorAll('[data-staff-id]').forEach(el => {
                    el.style.display = (!role || el.dataset.role === role) ? '' : 'none';
                });
            }, { signal: _ac.signal });
        });

        // Card clicks
        document.querySelectorAll('[data-staff-id]').forEach(el => {
            el.addEventListener('click', () => _openProfile(el.dataset.staffId), { signal: _ac.signal });
        });

        // New button
        document.getElementById('new-staff-btn')?.addEventListener('click', () => _openNewWizard(), { signal: _ac.signal });
    }

    function _staffCard(m) {
        const bg = _avatarColor(m.full_name);
        const initials = Utils.initials(m.full_name);
        const now = new Date();
        const certExpired = m.medical_cert_expires_at && new Date(m.medical_cert_expires_at) < now;
        return `
        <div class="card" style="cursor:pointer;position:relative;overflow:hidden;"
             data-staff-id="${Utils.escapeHtml(m.id)}"
             data-name="${Utils.escapeHtml((m.full_name || '').toLowerCase())}"
             data-role="${Utils.escapeHtml((m.role || '').toLowerCase())}">
            ${certExpired ? `<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:8px;height:8px;border-radius:50%;background:var(--color-pink);box-shadow:0 0 6px var(--color-pink);"></div>` : ''}
            <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">
                <div style="width:48px;height:48px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;">
                    ${Utils.escapeHtml(initials)}
                </div>
                <div style="overflow:hidden;flex:1;">
                    <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(m.full_name)}</div>
                    <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(m.role || '—')}</div>
                    ${m.phone ? `<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;"><i class="ph ph-phone" style="font-size:11px;"></i> ${Utils.escapeHtml(m.phone)}</div>` : ''}
                </div>
            </div>
        </div>`;
    }

    // ─── Render: single profile ───────────────────────────────────────────────
    async function _openProfile(id) {
        _currentId = id;
        const app = document.getElementById('app');
        app.innerHTML = UI.skeletonPage();

        try {
            const member = await Store.get('get', 'staff', { id });

            const user = App.getUser();
            const canWrite = ['admin', 'manager', 'operator'].includes(user?.role);
            const bg = _avatarColor(member.full_name);
            const now = new Date();
            const certExpired = member.medical_cert_expires_at && new Date(member.medical_cert_expires_at) < now;

            app.innerHTML = `
                <!-- BREADCRUMB -->
                <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);border-bottom:1px solid var(--color-border);background:var(--color-bg);position:sticky;top:72px;z-index:50;">
                    <button class="btn btn-ghost btn-sm" id="staff-back" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">
                        <i class="ph ph-arrow-left" style="font-size:16px;"></i> Staff
                    </button>
                    <i class="ph ph-caret-right" style="font-size:12px;color:var(--color-text-muted);opacity:0.5;"></i>
                    <span style="font-size:12px;font-weight:600;color:var(--color-white);text-transform:uppercase;letter-spacing:0.06em;">${Utils.escapeHtml(member.full_name)}</span>
                    <div style="flex:1;"></div>
                    ${canWrite ? `<button class="btn btn-primary btn-sm" id="staff-edit-btn" type="button"><i class="ph ph-pencil-simple"></i> MODIFICA</button>` : ''}
                    ${canWrite ? `<button class="btn btn-default btn-sm" id="staff-delete-btn" type="button" style="margin-left:8px;color:var(--color-pink);border-color:rgba(255,0,122,0.3);"><i class="ph ph-trash"></i></button>` : ''}
                </div>

                <!-- HERO -->
                <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:var(--sp-4);">
                    <div style="display:flex;align-items:center;gap:var(--sp-3);">
                        <div style="width:80px;height:80px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:2rem;color:#000;border-radius:12px;">
                            ${Utils.escapeHtml(Utils.initials(member.full_name))}
                        </div>
                        <div>
                            <div style="font-family:var(--font-display);font-size:2rem;font-weight:700;text-transform:uppercase;line-height:1;">${Utils.escapeHtml(member.full_name)}</div>
                            <div style="font-size:14px;color:var(--color-text-muted);margin-top:4px;">${Utils.escapeHtml(member.role || '—')}</div>
                        </div>
                    </div>
                </div>

                <!-- TAB BAR -->
                <div style="display:flex;gap:0;border-bottom:1px solid var(--color-border);overflow-x:auto;scrollbar-width:none;" id="staff-tab-bar">
                    <button class="athlete-tab-btn" data-stab="anagrafica" type="button"
                        style="flex-shrink:0;padding:12px 20px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:none;background:none;cursor:pointer;color:var(--color-white);border-bottom:2px solid var(--color-white);transition:all 0.2s;white-space:nowrap;">
                        <i class="ph ph-identification-card"></i> Anagrafica
                    </button>
                    <button class="athlete-tab-btn" data-stab="documenti" type="button"
                        style="flex-shrink:0;padding:12px 20px;font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;border:none;background:none;cursor:pointer;color:var(--color-text-muted);border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;">
                        <i class="ph ph-file-text"></i> Documenti
                    </button>
                </div>

                <!-- TAB: ANAGRAFICA -->
                <div id="stab-panel-anagrafica" style="padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-4);">
                    <div>
                        <p class="section-label">Dati Anagrafici e Contatti</p>
                        <div class="card" style="padding:var(--sp-3);">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
                                ${_field('Nome', member.first_name)}
                                ${_field('Cognome', member.last_name)}
                                ${_field('Ruolo / Qualifica', member.role)}
                                ${_field('Data di Nascita', member.birth_date ? Utils.formatDate(member.birth_date) : null)}
                                ${_field('Luogo di Nascita', member.birth_place)}
                                ${_field('Città di Residenza', member.residence_city)}
                                ${_field('Via di Residenza', member.residence_address)}
                                ${_field('Cellulare', member.phone)}
                                ${_field('E-Mail', member.email)}
                            </div>
                            ${member.notes ? `<div style="margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--color-border);"><span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;">Note</span><p style="font-size:14px;margin-top:4px;line-height:1.6;">${Utils.escapeHtml(member.notes)}</p></div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- TAB: DOCUMENTI -->
                <div id="stab-panel-documenti" style="padding:var(--sp-4);display:none;flex-direction:column;gap:var(--sp-4);">
                    <div>
                        <p class="section-label">Documenti</p>
                        <div class="card" style="padding:var(--sp-3);">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">
                                ${_field('Codice Fiscale', member.fiscal_code)}
                                ${_field("Documento d'Identità", member.identity_document)}
                                ${_field('Scadenza Cert. Medico',
                member.medical_cert_expires_at ? Utils.formatDate(member.medical_cert_expires_at) : null,
                certExpired ? 'var(--color-pink)' : null)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Tab switching
            document.querySelectorAll('[data-stab]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.stab;
                    document.querySelectorAll('[data-stab]').forEach(b => {
                        const active = b.dataset.stab === tab;
                        b.style.borderBottomColor = active ? 'var(--color-white)' : 'transparent';
                        b.style.color = active ? 'var(--color-white)' : 'var(--color-text-muted)';
                    });
                    document.getElementById('stab-panel-anagrafica').style.display = tab === 'anagrafica' ? 'flex' : 'none';
                    document.getElementById('stab-panel-documenti').style.display = tab === 'documenti' ? 'flex' : 'none';
                }, { signal: _ac.signal });
            });

            document.getElementById('staff-back')?.addEventListener('click', () => {
                _currentId = null;
                _renderList();
            }, { signal: _ac.signal });

            document.getElementById('staff-edit-btn')?.addEventListener('click', () => _openEditModal(member), { signal: _ac.signal });
            document.getElementById('staff-delete-btn')?.addEventListener('click', () => _confirmDelete(member), { signal: _ac.signal });

        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore caricamento', err.message);
        }
    }

    // ─── New member wizard ────────────────────────────────────────────────────
    function _openNewWizard() {
        const steps = ['Dati Personali', 'Contatti & Documenti'];
        let step = 1;
        const data = {};

        const stepContent = [
            `<div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-fname">Nome *</label><input id="ns-fname" class="form-input" type="text" placeholder="Marco" required></div>
                <div class="form-group"><label class="form-label" for="ns-lname">Cognome *</label><input id="ns-lname" class="form-input" type="text" placeholder="Rossi" required></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-role">Ruolo / Qualifica</label>
                    <select id="ns-role" class="form-select">
                        <option value="">Seleziona...</option>
                        <option>Allenatore</option><option>Vice Allenatore</option><option>Preparatore Atletico</option>
                        <option>Medico</option><option>Fisioterapista</option><option>Segreteria</option><option>Dirigente</option><option>Altro</option>
                    </select>
                </div>
                <div class="form-group"><label class="form-label" for="ns-birth">Data di Nascita</label><input id="ns-birth" class="form-input" type="date"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-birthplace">Luogo di Nascita</label><input id="ns-birthplace" class="form-input" type="text" placeholder="Roma"></div>
                <div class="form-group"><label class="form-label" for="ns-rescity">Città di Residenza</label><input id="ns-rescity" class="form-input" type="text" placeholder="Milano"></div>
            </div>`,
            `<div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-phone">Cellulare</label><input id="ns-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>
                <div class="form-group"><label class="form-label" for="ns-email">E-Mail</label><input id="ns-email" class="form-input" type="email" placeholder="nome@email.com"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-fiscal">Codice Fiscale</label><input id="ns-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>
                <div class="form-group"><label class="form-label" for="ns-doc">Documento d'Identità</label><input id="ns-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>
            </div>
            <div class="form-grid">
                <div class="form-group"><label class="form-label" for="ns-medcert">Scadenza Cert. Medico</label><input id="ns-medcert" class="form-input" type="date"></div>
            </div>
            <div class="form-group"><label class="form-label" for="ns-notes">Note</label><textarea id="ns-notes" class="form-input" rows="2" placeholder="Note aggiuntive..." style="resize:vertical;"></textarea></div>`
        ];

        const saveToData = () => {
            document.querySelectorAll('#staff-wizard-body input, #staff-wizard-body select, #staff-wizard-body textarea').forEach(el => {
                data[el.id] = el.value;
            });
        };

        const renderStep = () => {
            const body = document.getElementById('staff-wizard-body');
            if (!body) return;
            body.innerHTML = `
                <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">
                    ${[1, 2].map(i => `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
                                ${i < step ? 'background:var(--color-success);color:#000;' : i === step ? 'background:var(--color-pink);color:#fff;' : 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);'}">
                                ${i < step ? '✓' : i}
                            </div>
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${i === step ? 'var(--color-white)' : 'rgba(255,255,255,0.35)'};">${steps[i - 1]}</div>
                        </div>
                        ${i < 2 ? `<div style="flex:0.5;height:2px;background:${i < step ? 'var(--color-success)' : 'rgba(255,255,255,0.1)'};margin-bottom:20px;"></div>` : ''}
                    `).join('')}
                </div>
                <div id="ns-step-content">${stepContent[step - 1]}</div>
                <div id="ns-error" class="form-error hidden"></div>
            `;
            // Restore values
            requestAnimationFrame(() => {
                Object.entries(data).forEach(([id, val]) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                });
            });
            const prevBtn = document.getElementById('ns-prev');
            const nextBtn = document.getElementById('ns-next');
            const saveBtn = document.getElementById('ns-save');
            if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : '';
            if (nextBtn) nextBtn.style.display = step === 2 ? 'none' : '';
            if (saveBtn) saveBtn.style.display = step === 2 ? '' : 'none';
        };

        const modal = UI.modal({
            title: 'Nuovo Membro Staff',
            body: '<div id="staff-wizard-body"></div>',
            footer: `
                <button class="btn btn-ghost btn-sm" id="ns-cancel" type="button">Annulla</button>
                <button class="btn btn-default btn-sm" id="ns-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>
                <button class="btn btn-primary btn-sm" id="ns-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>
                <button class="btn btn-primary btn-sm" id="ns-save" type="button" style="display:none;">CREA MEMBRO</button>
            `
        });

        renderStep();

        document.getElementById('ns-cancel')?.addEventListener('click', () => modal.close(), { signal: _ac.signal });

        document.getElementById('ns-prev')?.addEventListener('click', () => {
            saveToData();
            if (step > 1) { step--; renderStep(); }
        }, { signal: _ac.signal });

        document.getElementById('ns-next')?.addEventListener('click', () => {
            if (step === 1) {
                const fn = document.getElementById('ns-fname')?.value.trim();
                const ln = document.getElementById('ns-lname')?.value.trim();
                const errEl = document.getElementById('ns-error');
                if (!fn || !ln) {
                    errEl.textContent = 'Nome e cognome sono obbligatori';
                    errEl.classList.remove('hidden');
                    return;
                }
            }
            saveToData();
            if (step < 2) { step++; renderStep(); }
        }, { signal: _ac.signal });

        document.getElementById('ns-save')?.addEventListener('click', async () => {
            saveToData();
            const errEl = document.getElementById('ns-error');
            const saveBtn = document.getElementById('ns-save');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Creazione...';
            try {
                await Store.api('create', 'staff', {
                    first_name: data['ns-fname'] || '',
                    last_name: data['ns-lname'] || '',
                    role: data['ns-role'] || null,
                    birth_date: data['ns-birth'] || null,
                    birth_place: data['ns-birthplace'] || null,
                    residence_city: data['ns-rescity'] || null,
                    phone: data['ns-phone'] || null,
                    email: data['ns-email'] || null,
                    fiscal_code: (data['ns-fiscal'] || '').toUpperCase() || null,
                    identity_document: data['ns-doc'] || null,
                    medical_cert_expires_at: data['ns-medcert'] || null,
                    notes: data['ns-notes'] || null,
                });
                modal.close();
                UI.toast('Membro staff creato', 'success');
                _list = await Store.get('list', 'staff').catch(() => _list);
                _renderList();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                saveBtn.disabled = false;
                saveBtn.textContent = 'CREA MEMBRO';
            }
        }, { signal: _ac.signal });
    }

    // ─── Edit modal ───────────────────────────────────────────────────────────
    function _openEditModal(m) {
        const modal = UI.modal({
            title: 'Modifica Membro Staff',
            body: `
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-fname">Nome *</label><input id="es-fname" class="form-input" type="text" value="${Utils.escapeHtml(m.first_name || '')}" required></div>
                    <div class="form-group"><label class="form-label" for="es-lname">Cognome *</label><input id="es-lname" class="form-input" type="text" value="${Utils.escapeHtml(m.last_name || '')}" required></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-role">Ruolo / Qualifica</label>
                        <select id="es-role" class="form-select">
                            <option value="">Seleziona...</option>
                            ${['Primo Allenatore', 'Secondo Allenatore', 'Allenatore', 'Vice Allenatore', 'Preparatore Atletico', 'Medico', 'Fisioterapista', 'Segreteria', 'Dirigente', 'Addetta Stampa', 'Altro'].map(r => `<option ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label class="form-label" for="es-birth">Data di Nascita</label><input id="es-birth" class="form-input" type="date" value="${m.birth_date ? m.birth_date.substring(0, 10) : ''}"></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-birthplace">Luogo di Nascita</label><input id="es-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(m.birth_place || '')}"></div>
                    <div class="form-group"><label class="form-label" for="es-rescity">Città di Residenza</label><input id="es-rescity" class="form-input" type="text" value="${Utils.escapeHtml(m.residence_city || '')}"></div>
                </div>
                <div class="form-group"><label class="form-label" for="es-resaddr">Via di Residenza</label><input id="es-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(m.residence_address || '')}"></div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-phone">Cellulare</label><input id="es-phone" class="form-input" type="tel" value="${Utils.escapeHtml(m.phone || '')}"></div>
                    <div class="form-group"><label class="form-label" for="es-email">E-Mail</label><input id="es-email" class="form-input" type="email" value="${Utils.escapeHtml(m.email || '')}"></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-fiscal">Codice Fiscale</label><input id="es-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(m.fiscal_code || '')}" maxlength="16" style="text-transform:uppercase;"></div>
                    <div class="form-group"><label class="form-label" for="es-doc">Documento d'Identità</label><input id="es-doc" class="form-input" type="text" value="${Utils.escapeHtml(m.identity_document || '')}"></div>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label" for="es-medcert">Scadenza Cert. Medico</label><input id="es-medcert" class="form-input" type="date" value="${m.medical_cert_expires_at ? m.medical_cert_expires_at.substring(0, 10) : ''}"></div>
                </div>
                <div class="form-group"><label class="form-label" for="es-notes">Note</label><textarea id="es-notes" class="form-input" rows="2" style="resize:vertical;">${Utils.escapeHtml(m.notes || '')}</textarea></div>
                <div id="es-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="es-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="es-save" type="button">SALVA MODIFICHE</button>
            `
        });

        document.getElementById('es-cancel')?.addEventListener('click', () => modal.close());
        document.getElementById('es-save')?.addEventListener('click', async () => {
            const fn = document.getElementById('es-fname').value.trim();
            const ln = document.getElementById('es-lname').value.trim();
            const errEl = document.getElementById('es-error');
            if (!fn || !ln) {
                errEl.textContent = 'Nome e cognome sono obbligatori';
                errEl.classList.remove('hidden');
                return;
            }
            const saveBtn = document.getElementById('es-save');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvataggio...';
            try {
                await Store.api('update', 'staff', {
                    id: m.id,
                    first_name: fn,
                    last_name: ln,
                    role: document.getElementById('es-role').value || null,
                    birth_date: document.getElementById('es-birth').value || null,
                    birth_place: document.getElementById('es-birthplace').value || null,
                    residence_address: document.getElementById('es-resaddr').value || null,
                    residence_city: document.getElementById('es-rescity').value || null,
                    phone: document.getElementById('es-phone').value || null,
                    email: document.getElementById('es-email').value || null,
                    fiscal_code: document.getElementById('es-fiscal').value?.toUpperCase() || null,
                    identity_document: document.getElementById('es-doc').value || null,
                    medical_cert_expires_at: document.getElementById('es-medcert').value || null,
                    notes: document.getElementById('es-notes').value || null,
                });
                modal.close();
                UI.toast('Membro staff aggiornato', 'success');
                // Invalida la cache sia della lista che del profilo specifico
                Store.invalidate('list/staff');
                Store.invalidate('get/staff');
                _list = await Store.get('list', 'staff').catch(() => _list);
                _openProfile(m.id);
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove('hidden');
                saveBtn.disabled = false;
                saveBtn.textContent = 'SALVA MODIFICHE';
            }
        });
    }

    // ─── Delete confirmation ──────────────────────────────────────────────────
    function _confirmDelete(m) {
        const modal = UI.modal({
            title: 'Elimina Membro Staff',
            body: `<p style="font-size:14px;line-height:1.6;">Sei sicuro di voler eliminare <strong>${Utils.escapeHtml(m.full_name)}</strong>? L'operazione non è reversibile.</p>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="del-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="del-confirm" type="button" style="background:var(--color-pink);border-color:var(--color-pink);">ELIMINA</button>
            `
        });
        document.getElementById('del-cancel')?.addEventListener('click', () => modal.close());
        document.getElementById('del-confirm')?.addEventListener('click', async () => {
            try {
                await Store.api('delete', 'staff', { id: m.id });
                modal.close();
                UI.toast('Membro staff eliminato', 'success');
                _currentId = null;
                _list = await Store.get('list', 'staff').catch(() => _list);
                _renderList();
            } catch (err) {
                UI.toast('Errore: ' + err.message, 'error');
            }
        });
    }

    // ─── Router wiring ────────────────────────────────────────────────────────
    return {
        destroy() {
            _ac.abort();
            _ac = new AbortController();
        },

        async init() {
            const app = document.getElementById('app');
            if (!app) return;
            UI.loading(true);
            app.innerHTML = UI.skeletonPage();

            try {
                _list = await Store.get('list', 'staff');
                _currentId = null;
                _renderList();
            } catch (err) {
                app.innerHTML = Utils.emptyState('Errore caricamento staff', err.message);
                UI.toast('Errore caricamento staff', 'error');
            } finally {
                UI.loading(false);
            }
        }
    };
})();

window.Staff = Staff;
