"use strict";

const Societa = (() => {
    let _abort = new AbortController();
    let _activeTab = 'identita';
    let _profile = null;
    let _roles = [];
    let _members = [];
    let _documents = [];
    let _deadlines = [];

    const TABS = [
        { id: 'identita', label: 'Identità', icon: 'identification-card' },
        { id: 'organigramma', label: 'Organigramma', icon: 'tree-structure' },
        { id: 'membri', label: 'Membri', icon: 'users-three' },
        { id: 'documenti', label: 'Documenti', icon: 'files' },
        { id: 'scadenze', label: 'Scadenze', icon: 'calendar-check' },
    ];

    /* ─── helpers ─────────────────────────────────────────────────────────── */

    function _sig() { return { signal: _abort.signal }; }

    function _docBadge(expiryDate) {
        if (!expiryDate) return '';
        const d = new Date(expiryDate);
        const now = new Date();
        const diff = (d - now) / 86400000;
        if (diff < 0) return '<span class="badge-expired"><i class="ph ph-warning"></i> Scaduto</span>';
        if (diff < 30) return '<span class="badge-expiring"><i class="ph ph-clock"></i> In scadenza</span>';
        return '<span class="badge-ok"><i class="ph ph-check-circle"></i> Valido</span>';
    }

    function _deadlineColor(status) {
        const map = {
            aperto: 'var(--color-info, #60a5fa)',
            completato: 'var(--color-success)',
            scaduto: 'var(--color-pink)',
            annullato: 'var(--color-text-muted)',
        };
        return map[status] || 'var(--color-text-muted)';
    }

    function _deadlineIcon(status) {
        const map = {
            aperto: 'clock',
            completato: 'check-circle',
            scaduto: 'warning-circle',
            annullato: 'x-circle',
        };
        return map[status] || 'dot';
    }

    /* ─── render shell ────────────────────────────────────────────────────── */

    function _renderShell() {
        const app = document.getElementById('app');
        if (!app) return;

        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        app.innerHTML = `
            <div style="padding:var(--sp-4)">
                <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:var(--sp-3);margin-bottom:var(--sp-4)">
                    <h1 class="page-title">Società</h1>
                    <p class="page-subtitle">Identità, organigramma e documenti societari</p>
                </div>
                <div class="soc-tabs" id="soc-tab-bar">
                    ${TABS.map(t => `
                        <button class="soc-tab ${t.id === _activeTab ? 'active' : ''}" data-soc-tab="${t.id}" type="button">
                            <i class="ph ph-${t.icon}"></i> ${Utils.escapeHtml(t.label)}
                        </button>`).join('')}
                </div>
                <div id="soc-tab-content"></div>
            </div>`;

        document.querySelectorAll('[data-soc-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                _activeTab = btn.dataset.socTab;
                document.querySelectorAll('[data-soc-tab]').forEach(b =>
                    b.classList.toggle('active', b.dataset.socTab === _activeTab));
                _renderTab();
            }, _sig());
        });

        _renderTab();
    }

    function _renderTab() {
        const c = document.getElementById('soc-tab-content');
        if (!c) return;
        const fn = {
            identita: _renderIdentita,
            organigramma: _renderOrganigramma,
            membri: _renderMembri,
            documenti: _renderDocumenti,
            scadenze: _renderScadenze,
        }[_activeTab];
        if (fn) fn(c);
    }

    /* ─── TAB: IDENTITÀ ───────────────────────────────────────────────────── */

    function _renderIdentita(container) {
        const p = _profile || {};
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        container.innerHTML = `
            <div style="max-width:760px">
                <div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
                    <p class="section-label" style="margin-bottom:var(--sp-3)">Identità Visiva</p>
                    <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
                        ${p.logo_path
                ? `<img src="${Utils.escapeHtml(p.logo_path)}" alt="Logo" class="soc-logo-preview">`
                : `<div style="width:90px;height:60px;border:2px dashed var(--color-border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:12px">Logo</div>`}
                        ${canWrite ? `<div>
                            <input type="file" id="soc-logo-input" accept="image/*" style="display:none">
                            <button class="btn btn-default btn-sm" id="soc-logo-btn" type="button"><i class="ph ph-upload-simple"></i> Carica Logo</button>
                        </div>` : ''}
                    </div>
                    <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-3)">
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">Colore Primario</label>
                            <div class="soc-color-row">
                                <input type="color" id="soc-color-primary" class="soc-color-swatch" value="${Utils.escapeHtml(p.primary_color || '#FF007A')}">
                                <input type="text" id="soc-color-primary-txt" class="form-input" value="${Utils.escapeHtml(p.primary_color || '#FF007A')}" maxlength="7" style="font-size:13px;font-family:monospace">
                            </div>
                        </div>
                        <div class="form-group" style="flex:1;min-width:200px">
                            <label class="form-label">Colore Secondario</label>
                            <div class="soc-color-row">
                                <input type="color" id="soc-color-secondary" class="soc-color-swatch" value="${Utils.escapeHtml(p.secondary_color || '#000000')}">
                                <input type="text" id="soc-color-secondary-txt" class="form-input" value="${Utils.escapeHtml(p.secondary_color || '#000000')}" maxlength="7" style="font-size:13px;font-family:monospace">
                            </div>
                        </div>
                        <div class="form-group" style="min-width:160px">
                            <label class="form-label">Anno Fondazione</label>
                            <input type="number" id="soc-founded" class="form-input" value="${Utils.escapeHtml(String(p.founded_year || ''))}" min="1800" max="2099" placeholder="es. 1985">
                        </div>
                    </div>
                </div>
                <div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
                    <p class="section-label" style="margin-bottom:var(--sp-3)">Mission &amp; Vision</p>
                    <div class="form-group">
                        <label class="form-label" for="soc-mission">Mission</label>
                        <textarea id="soc-mission" class="form-input" rows="3" placeholder="La missione della nostra società..." style="resize:vertical">${Utils.escapeHtml(p.mission || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="soc-vision">Vision</label>
                        <textarea id="soc-vision" class="form-input" rows="3" placeholder="La nostra visione per il futuro..." style="resize:vertical">${Utils.escapeHtml(p.vision || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="soc-values">Valori</label>
                        <textarea id="soc-values" class="form-input" rows="2" placeholder="Rispetto, fairplay, crescita..." style="resize:vertical">${Utils.escapeHtml(p.values || '')}</textarea>
                    </div>
                </div>
                <div class="card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
                    <p class="section-label" style="margin-bottom:var(--sp-3)">Indirizzi</p>
                    <div class="form-group">
                        <label class="form-label" for="soc-legal-addr">Sede Legale</label>
                        <input id="soc-legal-addr" class="form-input" type="text" value="${Utils.escapeHtml(p.legal_address || '')}" placeholder="Via Roma 1, 00100 Roma">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="soc-op-addr">Sede Operativa</label>
                        <input id="soc-op-addr" class="form-input" type="text" value="${Utils.escapeHtml(p.operative_address || '')}" placeholder="Palestra Centrale, Via Sport 5">
                    </div>
                </div>
                ${canWrite ? `
                <div style="display:flex;justify-content:flex-end;margin-top:var(--sp-2)">
                    <div id="soc-profile-err" class="form-error hidden"></div>
                    <button class="btn btn-primary" id="soc-save-profile" type="button"><i class="ph ph-floppy-disk"></i> SALVA PROFILO</button>
                </div>` : ''}
            </div>`;

        // Color picker sync
        const syncColor = (pickerEl, textEl) => {
            pickerEl?.addEventListener('input', () => { if (textEl) textEl.value = pickerEl.value; }, _sig());
            textEl?.addEventListener('input', () => {
                const v = textEl.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v) && pickerEl) pickerEl.value = v;
            }, _sig());
        };
        syncColor(document.getElementById('soc-color-primary'), document.getElementById('soc-color-primary-txt'));
        syncColor(document.getElementById('soc-color-secondary'), document.getElementById('soc-color-secondary-txt'));

        // Logo upload
        const logoInput = document.getElementById('soc-logo-input');
        document.getElementById('soc-logo-btn')?.addEventListener('click', () => logoInput?.click(), _sig());
        logoInput?.addEventListener('change', async () => {
            if (!logoInput.files?.length) return;
            const fd = new FormData();
            fd.append('logo', logoInput.files[0]);
            const btn = document.getElementById('soc-logo-btn');
            if (btn) { btn.disabled = true; btn.textContent = 'Upload...'; }
            try {
                const res = await Store.api('uploadLogo', 'societa', fd);
                if (_profile) _profile.logo_path = res.logo_path;
                else _profile = { logo_path: res.logo_path };
                UI.toast('Logo caricato', 'success');
                _renderIdentita(container);
            } catch (e) {
                UI.toast('Errore upload logo: ' + e.message, 'error');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-upload-simple"></i> Carica Logo'; }
            }
        }, _sig());

        // Save profile
        document.getElementById('soc-save-profile')?.addEventListener('click', async () => {
            const btn = document.getElementById('soc-save-profile');
            const err = document.getElementById('soc-profile-err');
            if (err) err.classList.add('hidden');
            if (btn) { btn.disabled = true; btn.textContent = 'Salvataggio...'; }
            try {
                await Store.api('saveProfile', 'societa', {
                    mission: document.getElementById('soc-mission')?.value || null,
                    vision: document.getElementById('soc-vision')?.value || null,
                    values: document.getElementById('soc-values')?.value || null,
                    founded_year: document.getElementById('soc-founded')?.value || null,
                    primary_color: document.getElementById('soc-color-primary-txt')?.value || null,
                    secondary_color: document.getElementById('soc-color-secondary-txt')?.value || null,
                    logo_path: _profile?.logo_path || null,
                    legal_address: document.getElementById('soc-legal-addr')?.value || null,
                    operative_address: document.getElementById('soc-op-addr')?.value || null,
                });
                _profile = await Store.get('getProfile', 'societa').catch(() => null);
                UI.toast('Profilo salvato', 'success');
            } catch (e) {
                if (err) { err.textContent = e.message; err.classList.remove('hidden'); }
                UI.toast('Errore: ' + e.message, 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA PROFILO'; }
            }
        }, _sig());
    }

    /* ─── TAB: ORGANIGRAMMA ───────────────────────────────────────────────── */

    function _renderOrganigramma(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        // Build tree: root nodes (no parent) first
        const roots = _roles.filter(r => !r.parent_role_id);
        const children = (parentId) => _roles.filter(r => r.parent_role_id === parentId);

        function _nodeHtml(role) {
            const kids = children(role.id);
            return `
                <div style="margin-bottom:var(--sp-2)">
                    <div class="soc-tree-node" draggable="true" data-role-id="${Utils.escapeHtml(role.id)}">
                        <i class="ph ph-dots-six-vertical soc-tree-drag-handle"></i>
                        <div style="flex:1">
                            <div class="soc-tree-node-name">${Utils.escapeHtml(role.name)}</div>
                            ${role.description ? `<div class="soc-tree-node-desc">${Utils.escapeHtml(role.description)}</div>` : ''}
                        </div>
                        ${canWrite ? `
                        <button class="btn btn-ghost btn-sm" data-edit-role="${Utils.escapeHtml(role.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn btn-ghost btn-sm" data-del-role="${Utils.escapeHtml(role.id)}" type="button" title="Elimina" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                        ` : ''}
                    </div>
                    ${kids.length ? `<div class="soc-tree-level">${kids.map(_nodeHtml).join('')}</div>` : ''}
                </div>`;
        }

        container.innerHTML = `
            <div>
                ${canWrite ? `<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)">
                    <button class="btn btn-primary btn-sm" id="soc-add-role" type="button"><i class="ph ph-plus"></i> NUOVO RUOLO</button>
                </div>` : ''}
                <div class="soc-tree" id="soc-tree">
                    ${_roles.length === 0
                ? Utils.emptyState('Nessun ruolo', 'Aggiungi il primo ruolo con il pulsante in alto.')
                : roots.map(_nodeHtml).join('')}
                </div>
            </div>`;

        // Edit buttons
        container.querySelectorAll('[data-edit-role]').forEach(btn => {
            btn.addEventListener('click', () => _openRoleModal(_roles.find(r => r.id === btn.dataset.editRole)), _sig());
        });
        // Delete buttons
        container.querySelectorAll('[data-del-role]').forEach(btn => {
            btn.addEventListener('click', () => _deleteRole(btn.dataset.delRole), _sig());
        });
        // Add role button
        document.getElementById('soc-add-role')?.addEventListener('click', () => _openRoleModal(null), _sig());

        // Drag-and-drop to re-parent
        let _dragId = null;
        container.querySelectorAll('.soc-tree-node').forEach(node => {
            node.addEventListener('dragstart', () => {
                _dragId = node.dataset.roleId;
                node.classList.add('dragging');
            }, _sig());
            node.addEventListener('dragend', () => node.classList.remove('dragging'), _sig());
            node.addEventListener('dragover', e => { e.preventDefault(); node.classList.add('drag-over'); }, _sig());
            node.addEventListener('dragleave', () => node.classList.remove('drag-over'), _sig());
            node.addEventListener('drop', async e => {
                e.preventDefault();
                node.classList.remove('drag-over');
                const targetId = node.dataset.roleId;
                if (_dragId && _dragId !== targetId) {
                    const dragged = _roles.find(r => r.id === _dragId);
                    if (!dragged) return;
                    try {
                        await Store.api('updateRole', 'societa', { ...dragged, parent_role_id: targetId });
                        _roles = await Store.get('listRoles', 'societa').catch(() => _roles);
                        _renderOrganigramma(container);
                        UI.toast('Gerarchia aggiornata', 'success');
                    } catch (err) {
                        UI.toast('Errore: ' + err.message, 'error');
                    }
                }
            }, _sig());
        });
    }

    function _openRoleModal(role) {
        const isEdit = !!role;
        const parentOptions = _roles
            .filter(r => !role || r.id !== role.id)
            .map(r => `<option value="${Utils.escapeHtml(r.id)}" ${role?.parent_role_id === r.id ? 'selected' : ''}>${Utils.escapeHtml(r.name)}</option>`)
            .join('');

        const m = UI.modal({
            title: isEdit ? 'Modifica Ruolo' : 'Nuovo Ruolo',
            body: `
                <div class="form-group">
                    <label class="form-label" for="rl-name">Nome Ruolo *</label>
                    <input id="rl-name" class="form-input" type="text" value="${Utils.escapeHtml(role?.name || '')}" placeholder="es. Presidente">
                </div>
                <div class="form-group">
                    <label class="form-label" for="rl-desc">Descrizione</label>
                    <textarea id="rl-desc" class="form-input" rows="2" placeholder="Descrizione del ruolo...">${Utils.escapeHtml(role?.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="rl-parent">Ruolo Padre (gerarchia)</label>
                    <select id="rl-parent" class="form-select">
                        <option value="">— Nessuno (root) —</option>
                        ${parentOptions}
                    </select>
                </div>
                <div id="rl-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="rl-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="rl-save" type="button">${isEdit ? 'SALVA' : 'CREA RUOLO'}</button>`,
        });

        document.getElementById('rl-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('rl-save')?.addEventListener('click', async () => {
            const name = document.getElementById('rl-name')?.value.trim();
            const err = document.getElementById('rl-error');
            if (!name) {
                err.textContent = 'Il nome è obbligatorio';
                err.classList.remove('hidden');
                return;
            }
            const btn = document.getElementById('rl-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                if (isEdit) {
                    await Store.api('updateRole', 'societa', {
                        id: role.id, name,
                        description: document.getElementById('rl-desc')?.value || null,
                        parent_role_id: document.getElementById('rl-parent')?.value || null,
                        sort_order: role.sort_order || 0,
                    });
                } else {
                    await Store.api('createRole', 'societa', {
                        name,
                        description: document.getElementById('rl-desc')?.value || null,
                        parent_role_id: document.getElementById('rl-parent')?.value || null,
                    });
                }
                _roles = await Store.get('listRoles', 'societa').catch(() => _roles);
                m.close();
                UI.toast(isEdit ? 'Ruolo aggiornato' : 'Ruolo creato', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.textContent = isEdit ? 'SALVA' : 'CREA RUOLO';
            }
        });
    }

    async function _deleteRole(id) {
        const role = _roles.find(r => r.id === id);
        if (!role) return;
        const m = UI.modal({
            title: 'Elimina Ruolo',
            body: `<p style="font-size:14px">Sei sicuro di voler eliminare il ruolo <strong>${Utils.escapeHtml(role.name)}</strong>?</p>`,
            footer: `<button class="btn btn-ghost btn-sm" id="dr-cancel" type="button">Annulla</button>
                     <button class="btn btn-primary btn-sm" id="dr-confirm" type="button" style="background:var(--color-pink)">ELIMINA</button>`,
        });
        document.getElementById('dr-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('dr-confirm')?.addEventListener('click', async () => {
            try {
                await Store.api('deleteRole', 'societa', { id });
                _roles = await Store.get('listRoles', 'societa').catch(() => _roles);
                m.close();
                UI.toast('Ruolo eliminato', 'success');
                _renderTab();
            } catch (e) {
                UI.toast('Errore: ' + e.message, 'error');
            }
        });
    }

    /* ─── TAB: MEMBRI ─────────────────────────────────────────────────────── */

    function _renderMembri(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);

        container.innerHTML = `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                    <div class="input-wrapper" style="position:relative;min-width:220px">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                        <input type="text" id="soc-members-search" class="form-input" placeholder="Cerca membro..." style="padding-left:36px;height:40px;font-size:13px">
                    </div>
                    ${canWrite ? '<button class="btn btn-primary btn-sm" id="soc-add-member" type="button"><i class="ph ph-plus"></i> AGGIUNGI MEMBRO</button>' : ''}
                </div>
                <div class="table-wrapper" style="overflow-x:auto">
                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Nome</th>
                                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Ruolo</th>
                                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Inizio</th>
                                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Fine</th>
                                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Stato</th>
                                ${canWrite ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border)"></th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="soc-members-tbody">
                            ${_members.length === 0
                ? `<tr><td colspan="6" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun membro</td></tr>`
                : _members.map(m => `
                                    <tr class="${m.is_active ? '' : 'soc-member-inactive'}" data-member-name="${Utils.escapeHtml((m.full_name || '').toLowerCase())}">
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(m.full_name)}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(m.role_name || '—')}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.start_date ? Utils.formatDate(m.start_date) : '—'}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.end_date ? Utils.formatDate(m.end_date) : '—'}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                                            <span style="color:${m.is_active ? 'var(--color-success)' : 'var(--color-text-muted)'}">
                                                ${m.is_active ? 'Attivo' : 'Inattivo'}
                                            </span>
                                        </td>
                                        ${canWrite ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">
                                            <button class="btn btn-ghost btn-sm" data-edit-member="${Utils.escapeHtml(m.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                            <button class="btn btn-ghost btn-sm" data-del-member="${Utils.escapeHtml(m.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                        </td>` : ''}
                                    </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        // Search filter
        document.getElementById('soc-members-search')?.addEventListener('input', e => {
            const q = e.target.value.trim().toLowerCase();
            document.querySelectorAll('[data-member-name]').forEach(row => {
                row.style.display = row.dataset.memberName.includes(q) ? '' : 'none';
            });
        }, _sig());

        // Add member
        document.getElementById('soc-add-member')?.addEventListener('click', () => _openMemberModal(null), _sig());

        // Edit/delete
        container.querySelectorAll('[data-edit-member]').forEach(btn =>
            btn.addEventListener('click', () => _openMemberModal(_members.find(m => m.id === btn.dataset.editMember)), _sig()));
        container.querySelectorAll('[data-del-member]').forEach(btn =>
            btn.addEventListener('click', () => _deleteMember(btn.dataset.delMember), _sig()));
    }

    function _openMemberModal(member) {
        const isEdit = !!member;
        const roleOptions = _roles.map(r =>
            `<option value="${Utils.escapeHtml(r.id)}" ${member?.role_id === r.id ? 'selected' : ''}>${Utils.escapeHtml(r.name)}</option>`
        ).join('');

        const m = UI.modal({
            title: isEdit ? 'Modifica Membro' : 'Nuovo Membro',
            body: `
                <div class="form-group">
                    <label class="form-label" for="mb-name">Nome Completo *</label>
                    <input id="mb-name" class="form-input" type="text" value="${Utils.escapeHtml(member?.full_name || '')}" placeholder="Mario Rossi">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="mb-role">Ruolo *</label>
                        <select id="mb-role" class="form-select">
                            <option value="">Seleziona...</option>
                            ${roleOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stato</label>
                        <select id="mb-active" class="form-select">
                            <option value="1" ${member?.is_active !== 0 ? 'selected' : ''}>Attivo</option>
                            <option value="0" ${member?.is_active === 0 ? 'selected' : ''}>Inattivo</option>
                        </select>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="mb-start">Data Inizio</label>
                        <input id="mb-start" class="form-input" type="date" value="${member?.start_date?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="mb-end">Data Fine</label>
                        <input id="mb-end" class="form-input" type="date" value="${member?.end_date?.substring(0, 10) || ''}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="mb-email">Email</label>
                        <input id="mb-email" class="form-input" type="email" value="${Utils.escapeHtml(member?.email || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="mb-phone">Telefono</label>
                        <input id="mb-phone" class="form-input" type="tel" value="${Utils.escapeHtml(member?.phone || '')}">
                    </div>
                </div>
                <div id="mb-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="mb-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="mb-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
        });

        document.getElementById('mb-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('mb-save')?.addEventListener('click', async () => {
            const name = document.getElementById('mb-name')?.value.trim();
            const roleId = document.getElementById('mb-role')?.value;
            const err = document.getElementById('mb-error');
            if (!name || !roleId) {
                err.textContent = 'Nome e ruolo sono obbligatori';
                err.classList.remove('hidden');
                return;
            }
            const btn = document.getElementById('mb-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    full_name: name,
                    role_id: roleId,
                    email: document.getElementById('mb-email')?.value || null,
                    phone: document.getElementById('mb-phone')?.value || null,
                    start_date: document.getElementById('mb-start')?.value || null,
                    end_date: document.getElementById('mb-end')?.value || null,
                    is_active: parseInt(document.getElementById('mb-active')?.value || '1'),
                };
                if (isEdit) {
                    await Store.api('updateMember', 'societa', { id: member.id, ...payload });
                } else {
                    await Store.api('createMember', 'societa', payload);
                }
                _members = await Store.get('listMembers', 'societa').catch(() => _members);
                m.close();
                UI.toast(isEdit ? 'Membro aggiornato' : 'Membro aggiunto', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.textContent = isEdit ? 'SALVA' : 'CREA';
            }
        });
    }

    async function _deleteMember(id) {
        const mbr = _members.find(m => m.id === id);
        if (!mbr) return;
        const m = UI.modal({
            title: 'Rimuovi Membro',
            body: `<p>Rimuovere <strong>${Utils.escapeHtml(mbr.full_name)}</strong> dall'organigramma?</p>`,
            footer: `<button class="btn btn-ghost btn-sm" id="dm-cancel" type="button">Annulla</button>
                     <button class="btn btn-primary btn-sm" id="dm-confirm" type="button" style="background:var(--color-pink)">RIMUOVI</button>`,
        });
        document.getElementById('dm-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('dm-confirm')?.addEventListener('click', async () => {
            try {
                await Store.api('deleteMember', 'societa', { id });
                _members = await Store.get('listMembers', 'societa').catch(() => _members);
                m.close();
                UI.toast('Membro rimosso', 'success');
                _renderTab();
            } catch (e) {
                UI.toast('Errore: ' + e.message, 'error');
            }
        });
    }

    /* ─── TAB: DOCUMENTI ──────────────────────────────────────────────────── */

    function _renderDocumenti(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);
        const catLabels = { statuto: 'Statuto', affiliazione: 'Affiliazione', licenza: 'Licenza', assicurazione: 'Assicurazione', altro: 'Altro' };
        const catIcons = { statuto: 'scroll', affiliazione: 'handshake', licenza: 'certificate', assicurazione: 'shield-check', altro: 'file-pdf' };

        container.innerHTML = `
            <div>
                ${canWrite ? `<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)">
                    <button class="btn btn-primary btn-sm" id="soc-upload-doc" type="button"><i class="ph ph-upload-simple"></i> CARICA DOCUMENTO</button>
                </div>` : ''}
                <div class="soc-doc-grid">
                    ${_documents.length === 0
                ? Utils.emptyState('Nessun documento', 'Carica il primo documento societario.')
                : _documents.map(doc => `
                            <div class="soc-doc-card">
                                <div style="display:flex;align-items:flex-start;justify-content:space-between">
                                    <i class="ph ph-${catIcons[doc.category] || 'file'} soc-doc-icon"></i>
                                    ${canWrite ? `<button class="btn btn-ghost btn-sm" data-del-doc="${Utils.escapeHtml(doc.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ''}
                                </div>
                                <div class="soc-doc-name" title="${Utils.escapeHtml(doc.file_name)}">${Utils.escapeHtml(doc.file_name)}</div>
                                <div class="soc-doc-meta">${Utils.escapeHtml(catLabels[doc.category] || doc.category)}</div>
                                ${doc.expiry_date ? `<div class="soc-doc-meta">Scad. ${Utils.escapeHtml(Utils.formatDate ? Utils.formatDate(doc.expiry_date) : doc.expiry_date)}</div>` : ''}
                                <div style="margin-top:4px">${_docBadge(doc.expiry_date)}</div>
                                <a href="api/?module=societa&action=downloadDocument&docId=${Utils.escapeHtml(doc.id)}" target="_blank" class="btn btn-default btn-sm" style="margin-top:var(--sp-1)">
                                    <i class="ph ph-download-simple"></i> Scarica
                                </a>
                            </div>`).join('')}
                </div>
            </div>`;

        // Upload doc
        document.getElementById('soc-upload-doc')?.addEventListener('click', () => _openDocUploadModal(), _sig());

        // Delete doc buttons
        container.querySelectorAll('[data-del-doc]').forEach(btn =>
            btn.addEventListener('click', async () => {
                try {
                    await Store.api('deleteDocument', 'societa', { id: btn.dataset.delDoc });
                    _documents = await Store.get('listDocuments', 'societa').catch(() => _documents);
                    UI.toast('Documento eliminato', 'success');
                    _renderTab();
                } catch (e) {
                    UI.toast('Errore: ' + e.message, 'error');
                }
            }, _sig()));
    }

    function _openDocUploadModal() {
        const m = UI.modal({
            title: 'Carica Documento Societario',
            body: `
                <div class="form-group">
                    <label class="form-label" for="sd-category">Categoria *</label>
                    <select id="sd-category" class="form-select">
                        <option value="statuto">Statuto</option>
                        <option value="affiliazione">Affiliazione</option>
                        <option value="licenza">Licenza</option>
                        <option value="assicurazione">Assicurazione</option>
                        <option value="altro" selected>Altro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="sd-expiry">Data Scadenza</label>
                    <input id="sd-expiry" class="form-input" type="date">
                </div>
                <div class="form-group">
                    <label class="form-label" for="sd-file">File (PDF, DOC, immagine — max 10 MB) *</label>
                    <input id="sd-file" type="file" class="form-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp">
                </div>
                <div id="sd-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="sd-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="sd-upload" type="button"><i class="ph ph-upload-simple"></i> CARICA</button>`,
        });

        document.getElementById('sd-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('sd-upload')?.addEventListener('click', async () => {
            const fileInput = document.getElementById('sd-file');
            const err = document.getElementById('sd-error');
            if (!fileInput?.files?.length) {
                err.textContent = 'Seleziona un file';
                err.classList.remove('hidden');
                return;
            }
            const fd = new FormData();
            fd.append('file', fileInput.files[0]);
            fd.append('category', document.getElementById('sd-category')?.value || 'altro');
            const expiry = document.getElementById('sd-expiry')?.value;
            if (expiry) fd.append('expiry_date', expiry);
            const btn = document.getElementById('sd-upload');
            btn.disabled = true; btn.textContent = 'Upload...';
            try {
                await Store.api('uploadDocument', 'societa', fd);
                _documents = await Store.get('listDocuments', 'societa').catch(() => _documents);
                m.close();
                UI.toast('Documento caricato', 'success');
                _renderTab();
            } catch (e) {
                err.textContent = e.message; err.classList.remove('hidden');
                btn.disabled = false; btn.innerHTML = '<i class="ph ph-upload-simple"></i> CARICA';
            }
        });
    }

    /* ─── TAB: SCADENZE ───────────────────────────────────────────────────── */

    function _renderScadenze(container) {
        const canWrite = ['admin', 'manager'].includes(App.getUser()?.role);
        const statusLabel = { aperto: 'Aperto', completato: 'Completato', scaduto: 'Scaduto', annullato: 'Annullato' };

        container.innerHTML = `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                    <div class="filter-bar" id="soc-deadline-filter">
                        <button class="filter-chip active" data-dl-status="" type="button">Tutte</button>
                        <button class="filter-chip" data-dl-status="aperto" type="button">Aperte</button>
                        <button class="filter-chip" data-dl-status="completato" type="button">Completate</button>
                        <button class="filter-chip" data-dl-status="scaduto" type="button">Scadute</button>
                    </div>
                    ${canWrite ? '<button class="btn btn-primary btn-sm" id="soc-add-deadline" type="button"><i class="ph ph-plus"></i> NUOVA SCADENZA</button>' : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)" id="soc-deadlines-list">
                    ${_deadlines.length === 0
                ? Utils.emptyState('Nessuna scadenza', 'Aggiungi la prima scadenza federale.')
                : _deadlines.map(dl => `
                            <div class="card" style="padding:var(--sp-3);display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap" data-dl-status="${Utils.escapeHtml(dl.status)}">
                                <i class="ph ph-${_deadlineIcon(dl.status)}" style="font-size:22px;color:${_deadlineColor(dl.status)};flex-shrink:0"></i>
                                <div style="flex:1;min-width:180px">
                                    <div style="font-weight:600;font-size:14px">${Utils.escapeHtml(dl.title)}</div>
                                    <div style="font-size:12px;color:var(--color-text-muted)">${dl.category ? Utils.escapeHtml(dl.category) + ' · ' : ''}Scad. ${dl.due_date}</div>
                                </div>
                                <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:${_deadlineColor(dl.status)}">${Utils.escapeHtml(statusLabel[dl.status] || dl.status)}</span>
                                ${canWrite ? `
                                <div style="display:flex;gap:4px">
                                    <button class="btn btn-ghost btn-sm" data-edit-dl="${Utils.escapeHtml(dl.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn btn-ghost btn-sm" data-del-dl="${Utils.escapeHtml(dl.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ''}
                            </div>`).join('')}
                </div>
            </div>`;

        // Filter chips
        container.querySelectorAll('[data-dl-status]').forEach(chip => {
            if (!chip.classList.contains('filter-chip')) return;
            chip.addEventListener('click', () => {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const status = chip.dataset.dlStatus;
                container.querySelectorAll('[data-dl-status].card').forEach(row => {
                    row.style.display = !status || row.dataset.dlStatus === status ? '' : 'none';
                });
            }, _sig());
        });

        // Add deadline
        document.getElementById('soc-add-deadline')?.addEventListener('click', () => _openDeadlineModal(null), _sig());

        // Edit/delete
        container.querySelectorAll('[data-edit-dl]').forEach(btn =>
            btn.addEventListener('click', () => _openDeadlineModal(_deadlines.find(d => d.id === btn.dataset.editDl)), _sig()));
        container.querySelectorAll('[data-del-dl]').forEach(btn =>
            btn.addEventListener('click', async () => {
                try {
                    await Store.api('deleteDeadline', 'societa', { id: btn.dataset.delDl });
                    _deadlines = await Store.get('listDeadlines', 'societa').catch(() => _deadlines);
                    UI.toast('Scadenza eliminata', 'success');
                    _renderTab();
                } catch (e) {
                    UI.toast('Errore: ' + e.message, 'error');
                }
            }, _sig()));
    }

    function _openDeadlineModal(dl) {
        const isEdit = !!dl;
        const m = UI.modal({
            title: isEdit ? 'Modifica Scadenza' : 'Nuova Scadenza',
            body: `
                <div class="form-group">
                    <label class="form-label" for="dl-title">Titolo *</label>
                    <input id="dl-title" class="form-input" type="text" value="${Utils.escapeHtml(dl?.title || '')}" placeholder="es. Rinnovo affiliazione FIPAV">
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="dl-due">Data Scadenza *</label>
                        <input id="dl-due" class="form-input" type="date" value="${dl?.due_date?.substring(0, 10) || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="dl-status">Stato</label>
                        <select id="dl-status" class="form-select">
                            ${['aperto', 'completato', 'scaduto', 'annullato'].map(s =>
                `<option value="${s}" ${dl?.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="dl-cat">Categoria</label>
                    <input id="dl-cat" class="form-input" type="text" value="${Utils.escapeHtml(dl?.category || '')}" placeholder="es. Federale, Fiscale…">
                </div>
                <div class="form-group">
                    <label class="form-label" for="dl-notes">Note</label>
                    <textarea id="dl-notes" class="form-input" rows="2">${Utils.escapeHtml(dl?.notes || '')}</textarea>
                </div>
                <div id="dl-error" class="form-error hidden"></div>`,
            footer: `
                <button class="btn btn-ghost btn-sm" id="dl-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="dl-save" type="button">${isEdit ? 'SALVA' : 'CREA'}</button>`,
        });

        document.getElementById('dl-cancel')?.addEventListener('click', () => m.close());
        document.getElementById('dl-save')?.addEventListener('click', async () => {
            const title = document.getElementById('dl-title')?.value.trim();
            const due = document.getElementById('dl-due')?.value;
            const err = document.getElementById('dl-error');
            if (!title || !due) {
                err.textContent = 'Titolo e data scadenza sono obbligatori';
                err.classList.remove('hidden');
                return;
            }
            const btn = document.getElementById('dl-save');
            btn.disabled = true; btn.textContent = 'Salvataggio...';
            try {
                const payload = {
                    title, due_date: due,
                    status: document.getElementById('dl-status')?.value || 'aperto',
                    category: document.getElementById('dl-cat')?.value || null,
                    notes: document.getElementById('dl-notes')?.value || null,
                };
                if (isEdit) {
                    await Store.api('updateDeadline', 'societa', { id: dl.id, ...payload });
                } else {
                    await Store.api('createDeadline', 'societa', payload);
                }
                _deadlines = await Store.get('listDeadlines', 'societa').catch(() => _deadlines);
                m.close();
                UI.toast(isEdit ? 'Scadenza aggiornata' : 'Scadenza creata', 'success');
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
                [_profile, _roles, _members, _documents, _deadlines] = await Promise.all([
                    Store.get('getProfile', 'societa').catch(() => null),
                    Store.get('listRoles', 'societa').catch(() => []),
                    Store.get('listMembers', 'societa').catch(() => []),
                    Store.get('listDocuments', 'societa').catch(() => []),
                    Store.get('listDeadlines', 'societa').catch(() => []),
                ]);

                // Respect hash sub-routes
                const route = Router.getCurrentRoute();
                if (route === 'societa-organigramma') _activeTab = 'organigramma';
                else if (route === 'societa-membri') _activeTab = 'membri';
                else if (route === 'societa-documenti') _activeTab = 'documenti';
                else if (route === 'societa-scadenze') _activeTab = 'scadenze';
                else _activeTab = 'identita';

                _renderShell();
            } catch (err) {
                app.innerHTML = Utils.emptyState('Errore caricamento', err.message);
                UI.toast('Errore caricamento Società', 'error');
            } finally {
                UI.loading(false);
            }
        },
    };
})();

window.Societa = Societa;
