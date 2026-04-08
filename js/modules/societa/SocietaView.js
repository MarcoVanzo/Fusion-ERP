/**
 * Societa View Module
 * Pattern: ogni view è self-contained con transport-dashboard + dash-top-bar (ref: Spese Foresteria)
 */
const SocietaView = {

    /**
     * Shell helper — genera il wrapper transport-dashboard con header uniformato
     * @param {object} opts — { icon, title, subtitle, actionHtml }
     * @param {string} contentHtml
     */
    _shell: (opts, contentHtml) => {
        const action = opts.actionHtml || '';
        return `
            <div class="transport-dashboard" style="min-height:100vh; padding:24px;">
                <div class="dash-top-bar" style="border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:24px; margin-bottom:24px;">
                    <div style="display:flex;justify-content:space-between;width:100%;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h1 class="dash-title" style="display:flex;align-items:center;gap:10px;">
                                <i class="ph ph-${opts.icon}" style="color:var(--accent-pink);"></i>
                                ${opts.title}
                            </h1>
                            <p style="color:var(--text-muted);font-size:13px;margin-top:4px;">${opts.subtitle}</p>
                        </div>
                        ${action}
                    </div>
                </div>
                ${contentHtml}
            </div>`;
    },

    skeleton: () => `
        <div class="transport-dashboard" style="min-height:100vh; padding:24px;">
            <div style="height:72px; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:24px; border:1px solid rgba(255,255,255,0.05);"></div>
            <div class="skeleton-shimmer" style="height:400px; border-radius:12px;"></div>
        </div>`,

    identity: (profile, companies, isAdmin) => {
        const contentHtml = `
            <div style="max-width:1100px;">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--sp-4); align-items: stretch;">
                    <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
                        <div class="dash-card" style="padding:var(--sp-4);">
                            <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Identità Visiva</p>
                            <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
                                ${profile.logo_path ? `<img src="${Utils.escapeHtml(profile.logo_path)}" alt="Logo" class="soc-logo-preview">` : '<div style="width:90px;height:60px;border:2px dashed var(--color-border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:12px">Logo</div>'}
                                ${isAdmin ? '<div><input type="file" id="soc-logo-input" accept="image/*" style="display:none"><button class="btn-dash" id="soc-logo-btn" type="button"><i class="ph ph-upload-simple"></i> Carica Logo</button></div>' : ""}
                            </div>
                            <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-3)">
                                <div class="form-group" style="flex:1;min-width:200px">
                                    <label class="form-label">Colore Primario</label>
                                    <div class="soc-color-row">
                                        <input type="color" id="soc-color-primary" class="soc-color-swatch" value="${Utils.escapeHtml(profile.primary_color || "#FF007A")}">
                                        <input type="text" id="soc-color-primary-txt" class="form-input" value="${Utils.escapeHtml(profile.primary_color || "#FF007A")}" maxlength="7" style="font-size:13px;font-family:monospace">
                                    </div>
                                </div>
                                <div class="form-group" style="flex:1;min-width:200px">
                                    <label class="form-label">Colore Secondario</label>
                                    <div class="soc-color-row">
                                        <input type="color" id="soc-color-secondary" class="soc-color-swatch" value="${Utils.escapeHtml(profile.secondary_color || "#000000")}">
                                        <input type="text" id="soc-color-secondary-txt" class="form-input" value="${Utils.escapeHtml(profile.secondary_color || "#000000")}" maxlength="7" style="font-size:13px;font-family:monospace">
                                    </div>
                                </div>
                                <div class="form-group" style="min-width:160px">
                                    <label class="form-label">Anno Fondazione</label>
                                    <input type="number" id="soc-founded" class="form-input" value="${Utils.escapeHtml(String(profile.founded_year || ""))}" min="1800" max="2099" placeholder="es. 1985">
                                </div>
                            </div>
                        </div>
                        <div class="dash-card" style="padding:var(--sp-4);">
                            <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Indirizzi</p>
                            <div class="form-group">
                                <label class="form-label" for="soc-legal-addr">Sede Legale</label>
                                <input id="soc-legal-addr" class="form-input" type="text" value="${Utils.escapeHtml(profile.legal_address || "")}" placeholder="Via Roma 1, 00100 Roma">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="soc-op-addr">Sede Operativa</label>
                                <input id="soc-op-addr" class="form-input" type="text" value="${Utils.escapeHtml(profile.operative_address || "")}" placeholder="Palestra Centrale, Via Sport 5">
                            </div>
                        </div>
                    </div>
                    <div class="dash-card" style="padding:var(--sp-4); display:flex; flex-direction:column; height:100%; box-sizing:border-box;">
                        <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Mission &amp; Vision</p>
                        <div class="form-group" style="display:flex; flex-direction:column; flex:1;">
                            <label class="form-label" for="soc-mission">Mission</label>
                            <textarea id="soc-mission" class="form-input" placeholder="La missione della nostra società..." style="resize:vertical; flex:1; min-height:80px;">${Utils.escapeHtml(profile.mission || "")}</textarea>
                        </div>
                        <div class="form-group" style="display:flex; flex-direction:column; flex:1;">
                            <label class="form-label" for="soc-vision">Vision</label>
                            <textarea id="soc-vision" class="form-input" placeholder="La nostra visione per il futuro..." style="resize:vertical; flex:1; min-height:80px;">${Utils.escapeHtml(profile.vision || "")}</textarea>
                        </div>
                        <div class="form-group" style="display:flex; flex-direction:column; flex:1; margin-bottom:0;">
                            <label class="form-label" for="soc-values">Valori</label>
                            <textarea id="soc-values" class="form-input" placeholder="Rispetto, fairplay, crescita..." style="resize:vertical; flex:1; min-height:60px;">${Utils.escapeHtml(profile.values || "")}</textarea>
                        </div>
                    </div>
                </div>
                <div id="soc-profile-err" class="form-error hidden" style="margin-top:var(--sp-2)"></div>
                
                <div style="margin-top: 40px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-size: 18px; font-weight: 600; margin: 0;">Società del Gruppo</h2>
                            <p style="color: var(--text-muted); font-size: 13px; margin: 4px 0 0 0;">Gestisci le società e associazioni appartenenti o collegate al gruppo</p>
                        </div>
                        ${isAdmin ? '<button class="btn-dash pink" id="soc-add-company" type="button"><i class="ph ph-plus"></i> AGGIUNGI SOCIETÀ</button>' : ''}
                    </div>
                    
                    <div id="soc-companies-grid">
                        ${SocietaView.renderCompaniesList(companies, isAdmin)}
                    </div>
                </div>
            </div>`;
        return SocietaView._shell({
            icon: 'identification-card',
            title: 'Identità Club',
            subtitle: 'Gestione colori, loghi e informazioni societarie',
            actionHtml: isAdmin ? `<button class="btn-dash pink" id="soc-save-profile" type="button"><i class="ph ph-floppy-disk"></i> SALVA PROFILO</button>` : ''
        }, contentHtml);
    },

    renderCompaniesList: (companies, isAdmin) => {
        if (!companies || companies.length === 0) {
            return `
                <div style="text-align:center; padding:var(--sp-6) var(--sp-4); background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
                    <i class="ph ph-buildings" style="font-size:32px; color:var(--text-muted); opacity:0.5; margin-bottom:var(--sp-3)"></i>
                    <p style="color:var(--text-muted); font-size:14px; margin:0;">Nessuna società inserita.<br>Clicca su "Aggiungi Società" per iniziare.</p>
                </div>
            `;
        }

        const cards = companies.map(c => `
            <div class="dash-card net-card" style="position:relative; display:flex; flex-direction:column; gap:16px;">
                ${isAdmin ? `
                <div style="position:absolute; top:12px; right:12px; display:flex; gap:4px">
                    <button class="btn-icon small soc-edit-company" data-id="${c.id}" title="Modifica" style="width:28px;height:28px"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-icon small soc-delete-company" data-id="${c.id}" title="Elimina" style="width:28px;height:28px;color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                </div>
                ` : ''}
                
                <div style="display:flex; align-items:center; gap:16px;">
                    ${c.logo_path 
                        ? `<img src="${Utils.escapeHtml(c.logo_path)}" alt="Logo" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">`
                        : `<div style="width:50px;height:50px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--text-muted)"><i class="ph ph-buildings"></i></div>`
                    }
                    <div>
                        <h3 style="margin:0; font-size:16px; font-weight:600; color:#fff;">${Utils.escapeHtml(c.name)}</h3>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
                    <div>
                        <div style="color:var(--text-muted); font-size:11px; text-transform:uppercase; margin-bottom:2px">Partita IVA / CF</div>
                        <div style="color:#ddd;">${Utils.escapeHtml(c.vat_number || '—')}</div>
                    </div>
                    <div>
                        <div style="color:var(--text-muted); font-size:11px; text-transform:uppercase; margin-bottom:2px">Referente</div>
                        <div style="color:#ddd;">${Utils.escapeHtml(c.referent_name || '—')}</div>
                    </div>
                </div>
                
                <div style="font-size:13px; color:#aaa; line-height:1.4">
                    <div style="display:flex; gap:6px; margin-bottom:4px;">
                        <i class="ph ph-map-pin" style="margin-top:2px; flex-shrink:0;"></i>
                        <span>${Utils.escapeHtml(c.legal_address || '—')}</span>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="net-card-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:24px;">
                ${cards}
            </div>
        `;
    },

    modalCompany: (company = null) => {
        const isEdit = !!company;
        const c = company || {};
        
        return `
        <div style="display:flex; flex-direction:column; gap:20px;">
            <div style="display:flex; gap:16px; align-items:flex-start;">
                ${!isEdit ? `
                <div style="flex-shrink:0;">
                    <div style="width:80px;height:80px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--text-muted)"><i class="ph ph-buildings"></i></div>
                    <div style="margin-top:8px; text-align:center;">
                        <input type="file" id="comp-modal-logo-input" accept="image/*" style="display:none">
                        <button class="btn-dash btn-xs" id="comp-modal-logo-btn" type="button" style="width:100%">Carica</button>
                    </div>
                </div>
                ` : `
                <div style="flex-shrink:0;">
                    ${c.logo_path 
                        ? `<img src="${Utils.escapeHtml(c.logo_path)}" alt="Logo" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">`
                        : `<div style="width:80px;height:80px;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--text-muted)"><i class="ph ph-buildings"></i></div>`
                    }
                    <div style="margin-top:8px; text-align:center;">
                        <input type="file" id="comp-modal-logo-input" accept="image/*" style="display:none">
                        <button class="btn-dash btn-xs" id="comp-modal-logo-btn" type="button" style="width:100%">Cambia</button>
                    </div>
                </div>
                `}
                
                <div style="flex-grow:1; display:flex; flex-direction:column; gap:12px;">
                    <div class="form-group" style="margin:0">
                        <label class="form-label">Ragione Sociale <span style="color:var(--color-pink)">*</span></label>
                        <input type="text" id="comp-name" class="form-input" value="${Utils.escapeHtml(c.name || '')}" placeholder="Nome azienda...">
                    </div>
                    <div class="form-group" style="margin:0">
                        <label class="form-label">Partita IVA / CF</label>
                        <input type="text" id="comp-vat" class="form-input" value="${Utils.escapeHtml(c.vat_number || '')}" placeholder="P.IVA O CF">
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Sede Legale</label>
                <input type="text" id="comp-legal-addr" class="form-input" value="${Utils.escapeHtml(c.legal_address || '')}" placeholder="Indirizzo legale completo...">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group" style="margin:0">
                    <label class="form-label">Sito Web</label>
                    <input type="text" id="comp-website" class="form-input" value="${Utils.escapeHtml(c.website || '')}" placeholder="https://...">
                </div>
                <div class="form-group" style="margin:0; grid-column: span 2;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="form-group" style="margin:0">
                            <label class="form-label">Facebook</label>
                            <input type="text" id="comp-facebook" class="form-input" value="${Utils.escapeHtml(c.facebook || '')}" placeholder="URL Pagina FB...">
                        </div>
                        <div class="form-group" style="margin:0">
                            <label class="form-label">Instagram</label>
                            <input type="text" id="comp-instagram" class="form-input" value="${Utils.escapeHtml(c.instagram || '')}" placeholder="URL Pagina IG...">
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="form-group" style="margin:0">
                    <label class="form-label">Referente</label>
                    <input type="text" id="comp-ref-name" class="form-input" value="${Utils.escapeHtml(c.referent_name || '')}" placeholder="Nome del referente...">
                </div>
                <div class="form-group" style="margin:0">
                    <label class="form-label">Contatto Referente</label>
                    <input type="text" id="comp-ref-contact" class="form-input" value="${Utils.escapeHtml(c.referent_contact || '')}" placeholder="Email o Telefono...">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Descrizione</label>
                <textarea id="comp-desc" class="form-input" rows="2" placeholder="Note interne opzionali...">${Utils.escapeHtml(c.description || '')}</textarea>
            </div>
            
            <div id="comp-modal-err" class="form-error hidden"></div>
        </div>
        `;
    },

    orgChart: (roles, isAdmin) => {
        const roots = roles.filter(r => !r.parent_role_id);
        const renderNode = (role, level = 0) => {
            const children = roles.filter(r => r.parent_role_id === role.id);
            const paddingLeft = level * 20;
            return `
                <tr class="soc-tree-node" draggable="${isAdmin}" data-role-id="${Utils.escapeHtml(role.id)}">
                    ${isAdmin ? '<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:center;width:50px"><i class="ph ph-dots-six-vertical soc-tree-drag-handle" style="cursor:grab;color:var(--color-text-muted);font-size:16px"></i></td>' : ""}
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);padding-left:${paddingLeft + 12}px">
                        <div style="display:flex;align-items:center;gap:8px">
                            ${level > 0 ? '<i class="ph ph-arrow-elbow-down-right" style="color:var(--color-text-muted);opacity:0.5"></i>' : ''}
                            <span class="soc-tree-node-name" style="font-weight:600">${Utils.escapeHtml(role.name)}</span>
                        </div>
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);color:var(--color-text-muted)">
                        <span class="soc-tree-node-desc">${Utils.escapeHtml(role.description || "—")}</span>
                    </td>
                    ${isAdmin ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;text-align:right">
                        <button class="btn-dash btn-xs" data-edit-role="${Utils.escapeHtml(role.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-dash btn-xs" data-del-role="${Utils.escapeHtml(role.id)}" type="button" title="Elimina" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                    </td>` : ""}
                </tr>
                ${children.map(c => renderNode(c, level + 1)).join("")}`;
        };
        const contentHtml = `
            <div>
                <div class="dash-card" style="padding:0;overflow:hidden;">
                    <div class="table-wrapper" style="overflow-x:auto">
                        <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px" id="soc-tree">
                            <thead>
                                <tr>
                                    ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border);width:50px"></th>' : ""}
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Ruolo</th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Descrizione</th>
                                    ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border)"></th>' : ""}
                                </tr>
                            </thead>
                            <tbody>
                                ${roles.length === 0 ? `<tr><td colspan="${isAdmin ? 4 : 2}" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun ruolo</td></tr>` : roots.map(r => renderNode(r, 0)).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        return SocietaView._shell({
            icon: 'tree-structure',
            title: 'Organigramma',
            subtitle: 'Struttura gerarchica e ruoli della società',
            actionHtml: isAdmin ? `<button class="btn-dash pink" id="soc-add-role" type="button"><i class="ph ph-plus"></i> NUOVO RUOLO</button>` : ''
        }, contentHtml);
    },

    membersTable: (members, isAdmin) => {
        const contentHtml = `
            <div>
                <div style="margin-bottom:var(--sp-3)">
                    <div class="input-wrapper" style="position:relative;max-width:320px">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                        <input type="text" id="soc-members-search" class="form-input" placeholder="Cerca membro..." style="padding-left:36px;height:40px;font-size:13px">
                    </div>
                </div>
                <div class="dash-card" style="padding:0;overflow:hidden;">
                    <div class="table-wrapper" style="overflow-x:auto">
                        <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                            <thead>
                                <tr>
                                    <th style="padding:10px 12px;border-bottom:1px solid var(--color-border);width:50px"></th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Nome</th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Ruolo</th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Inizio</th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Fine</th>
                                    <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Stato</th>
                                    ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border)"></th>' : ""}
                                </tr>
                            </thead>
                            <tbody id="soc-members-tbody">
                                ${members.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun membro</td></tr>' : members.map((m) => `
                                    <tr class="${m.is_active ? "" : "soc-member-inactive"}" data-member-name="${Utils.escapeHtml((m.full_name || "").toLowerCase())}">
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:center">
                                            ${m.photo_path ? `<img src="${Utils.escapeHtml(m.photo_path)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;margin:0 auto">` : `<div style="width:32px;height:32px;border-radius:50%;background:var(--color-surface-elevated);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;margin:0 auto"><i class="ph ph-user"></i></div>`}
                                        </td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(m.full_name)}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(m.role_name || "—")}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.start_date ? Utils.formatDate(m.start_date) : "—"}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.end_date ? Utils.formatDate(m.end_date) : "—"}</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                                            <span style="color:${m.is_active ? "var(--color-success)" : "var(--color-text-muted)"}">${m.is_active ? "Attivo" : "Inattivo"}</span>
                                        </td>
                                        ${isAdmin ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">
                                            <button class="btn-dash btn-xs" data-edit-member="${Utils.escapeHtml(m.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                            <button class="btn-dash btn-xs" data-del-member="${Utils.escapeHtml(m.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                        </td>` : ""}
                                    </tr>`).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        return SocietaView._shell({
            icon: 'users-three',
            title: 'Direttivo',
            subtitle: 'Membri e staff assegnato ai ruoli societari',
            actionHtml: isAdmin ? `<button class="btn-dash pink" id="soc-add-member" type="button"><i class="ph ph-plus"></i> AGGIUNGI MEMBRO</button>` : ''
        }, contentHtml);
    },

    documentsGrid: (documents, isAdmin) => {
        const categories = { statuto: "Statuto", affiliazione: "Affiliazione", licenza: "Licenza", assicururazione: "Assicurazione", altro: "Altro" };
        const icons = { statuto: "scroll", affiliazione: "handshake", licenza: "certificate", assicurazione: "shield-check", altro: "file-pdf" };
        return `
            <div>
                ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-upload-doc" type="button"><i class="ph ph-upload-simple"></i> CARICA DOCUMENTO</button></div>' : ""}
                <div class="soc-doc-grid">
                    ${documents.length === 0 ? Utils.emptyState("Nessun documento", "Carica il primo documento societario.") : documents.map((doc) => {
                        const isExpired = doc.expiry_date && (new Date(doc.expiry_date) - new Date()) / 864e5 < 0;
                        const isExpiring = doc.expiry_date && (new Date(doc.expiry_date) - new Date()) / 864e5 < 30;
                        return `
                            <div class="soc-doc-card">
                                <div style="display:flex;align-items:flex-start;justify-content:space-between">
                                    <i class="ph ph-${icons[doc.category] || "file"} soc-doc-icon"></i>
                                    ${isAdmin ? `<button class="btn-dash btn-xs" data-del-doc="${Utils.escapeHtml(doc.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ""}
                                </div>
                                <div class="soc-doc-name" title="${Utils.escapeHtml(doc.file_name)}">${Utils.escapeHtml(doc.file_name)}</div>
                                <div class="soc-doc-meta">${Utils.escapeHtml(categories[doc.category] || doc.category)}</div>
                                ${doc.expiry_date ? `<div class="soc-doc-meta">Scad. ${Utils.formatDate(doc.expiry_date)}</div>` : ""}
                                <div style="margin-top:4px">
                                    ${doc.expiry_date ? (isExpired ? '<span class="badge-expired"><i class="ph ph-warning"></i> Scaduto</span>' : isExpiring ? '<span class="badge-expiring"><i class="ph ph-clock"></i> In scadenza</span>' : '<span class="badge-ok"><i class="ph ph-check-circle"></i> Valido</span>') : ""}
                                </div>
                                <a href="api/?module=societa&action=downloadDocument&docId=${Utils.escapeHtml(doc.id)}" target="_blank" class="btn-dash" style="margin-top:var(--sp-1)">
                                    <i class="ph ph-download-simple"></i> Scarica
                                </a>
                            </div>`;
                    }).join("")}
                </div>
            </div>`;
    },

    deadlines: (deadlines, isAdmin) => {
        const statusMap = { aperto: "Aperto", completato: "Completato", scaduto: "Scaduto", annullato: "Annullato" };
        const iconMap = { aperto: "clock", completato: "check-circle", scaduto: "warning-circle", annullato: "x-circle" };
        const getStatusColor = (s) => ({ aperto: "#60a5fa", completato: "#10b981", scaduto: "#ff007a", annullato: "#9ca3af" }[s] || "#9ca3af");
        return `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                    <div class="dash-filters" id="soc-deadline-filter">
                        <button class="dash-filter active" data-dl-status="" type="button">Tutte</button>
                        <button class="dash-filter" data-dl-status="aperto" type="button">Aperte</button>
                        <button class="dash-filter" data-dl-status="completato" type="button">Completate</button>
                        <button class="dash-filter" data-dl-status="scaduto" type="button">Scadute</button>
                    </div>
                    ${isAdmin ? '<button class="btn-dash pink" id="soc-add-deadline" type="button"><i class="ph ph-plus"></i> NUOVA SCADENZA</button>' : ""}
                </div>
                <div style="display:flex;flex-direction:column;gap:var(--sp-2)" id="soc-deadlines-list">
                    ${deadlines.length === 0 ? Utils.emptyState("Nessuna scadenza", "Aggiungi la prima scadenza federale.") : deadlines.map((dl) => `
                        <div class="dash-card" style="padding:var(--sp-3);display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap" data-dl-status="${Utils.escapeHtml(dl.status)}">
                            <i class="ph ph-${iconMap[dl.status] || "dot"}" style="font-size:22px;color:${getStatusColor(dl.status)};flex-shrink:0"></i>
                            <div style="flex:1;min-width:180px">
                                <div style="font-weight:600;font-size:14px">${Utils.escapeHtml(dl.title)}</div>
                                <div style="font-size:12px;color:var(--color-text-muted)">${dl.category ? Utils.escapeHtml(dl.category) + " · " : ""}Scad. ${dl.due_date}</div>
                            </div>
                            <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:${getStatusColor(dl.status)}">${Utils.escapeHtml(statusMap[dl.status] || dl.status)}</span>
                            ${isAdmin ? `
                                <div class="soc-actions-wrap">
                                    <button class="btn-dash btn-xs" data-edit-dl="${Utils.escapeHtml(dl.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn-dash btn-xs" data-del-dl="${Utils.escapeHtml(dl.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ""}
                        </div>`).join("")}
                </div>
            </div>`;
    },

    sponsorsGrid: (sponsors, isAdmin) => {
        const contentHtml = `
            <div>
                ${sponsors.length === 0 ? Utils.emptyState("Nessuno sponsor", "Aggiungi il primo sponsor con il pulsante in alto.") : `
                    <div class="soc-sponsor-grid">
                        ${sponsors.map((sp) => `
                            <div class="soc-sponsor-card ${sp.is_active ? "" : "soc-sponsor-inactive"}">
                                <div class="soc-sponsor-card-header">
                                    ${sp.logo_path ? `<img src="${Utils.escapeHtml(sp.logo_path)}" alt="Logo" class="soc-sponsor-logo">` : '<div class="soc-sponsor-logo-placeholder"><i class="ph ph-image"></i></div>'}
                                    ${isAdmin ? `
                                        <div class="soc-actions-wrap">
                                            <button class="btn-dash btn-xs" data-sp-logo="${Utils.escapeHtml(sp.id)}" type="button" title="Carica logo"><i class="ph ph-camera"></i></button>
                                            <button class="btn-dash btn-xs" data-sp-edit="${Utils.escapeHtml(sp.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                                            <button class="btn-dash btn-xs" data-sp-del="${Utils.escapeHtml(sp.id)}" type="button" style="color:var(--color-pink)" title="Elimina"><i class="ph ph-trash"></i></button>
                                        </div>
                                    ` : ""}
                                </div>
                                <div class="soc-sponsor-name">${Utils.escapeHtml(sp.name)}</div>
                                <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.05em">${Utils.escapeHtml(sp.tipo || "Sponsor")} ${sp.stagione ? `· ${Utils.escapeHtml(sp.stagione)}` : ""}</div>
                                ${sp.importo ? `<div style="font-size:12px; font-weight:800; color:var(--color-pink); margin-top:4px;">€ ${parseFloat(sp.importo).toLocaleString('it-IT', {minimumFractionDigits:2})}</div>` : ""}
                                ${sp.description ? `<div class="soc-sponsor-desc">${Utils.escapeHtml(sp.description)}</div>` : ""}
                                ${sp.rapporto ? `<div style="font-size:11px; color:rgba(255,255,255,0.5); margin-top:4px; font-style:italic;">${Utils.escapeHtml(sp.rapporto)}</div>` : ""}
                                <div class="soc-sponsor-links">
                                    ${sp.website_url ? `<a href="${Utils.escapeHtml(sp.website_url)}" target="_blank" class="soc-sponsor-link" title="Sito web"><i class="ph ph-globe-simple"></i></a>` : ""}
                                    ${sp.instagram_url ? `<a href="${Utils.escapeHtml(sp.instagram_url)}" target="_blank" class="soc-sponsor-link" title="Instagram"><i class="ph ph-instagram-logo"></i></a>` : ""}
                                    ${sp.facebook_url ? `<a href="${Utils.escapeHtml(sp.facebook_url)}" target="_blank" class="soc-sponsor-link" title="Facebook"><i class="ph ph-facebook-logo"></i></a>` : ""}
                                    ${sp.linkedin_url ? `<a href="${Utils.escapeHtml(sp.linkedin_url)}" target="_blank" class="soc-sponsor-link" title="LinkedIn"><i class="ph ph-linkedin-logo"></i></a>` : ""}
                                    ${sp.tiktok_url ? `<a href="${Utils.escapeHtml(sp.tiktok_url)}" target="_blank" class="soc-sponsor-link" title="TikTok"><i class="ph ph-tiktok-logo"></i></a>` : ""}
                                </div>
                            </div>`).join("")}
                    </div>`}
            </div>`;
        return SocietaView._shell({
            icon: 'storefront',
            title: 'Partner &amp; Sponsor',
            subtitle: 'Partnership e sponsorizzazioni attive del club',
            actionHtml: isAdmin ? `<button class="btn-dash pink" id="soc-add-sponsor" type="button"><i class="ph ph-plus"></i> NUOVO SPONSOR</button>` : ''
        }, contentHtml);
    },

    titoli: (titoli, isAdmin) => {
        const contentHtml = `
            <div class="soc-titoli-grid">
                ${titoli.length === 0 ? Utils.emptyState("Palmarès vuoto", "Aggiungi i trofei e i successi della società.") : titoli.map(t => `
                    <div class="soc-titolo-card ${t.piazzamento === 1 ? "win" : ""}">
                        <div class="soc-titolo-icon"><i class="ph ph-trophy"></i></div>
                        <div class="soc-titolo-place">#${t.piazzamento}</div>
                        <div class="soc-titolo-main">${Utils.escapeHtml(t.categoria)}</div>
                        <div class="soc-titolo-sub">${Utils.escapeHtml(t.campionato)} · ${Utils.escapeHtml(t.stagione)}</div>
                        ${t.finali_nazionali ? '<div class="soc-titolo-national"><i class="ph ph-flag"></i> Finali Nazionali</div>' : ""}
                        ${isAdmin ? `
                            <div class="soc-titolo-actions">
                                <button class="btn-dash btn-xs" data-edit-titolo="${Utils.escapeHtml(t.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                <button class="btn-dash btn-xs" data-del-titolo="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                            </div>
                        ` : ""}
                    </div>`).join("")}
            </div>`;
        return SocietaView._shell({
            icon: 'trophy',
            title: 'Palmarès',
            subtitle: 'Trofei e successi storici della società',
            actionHtml: isAdmin ? `<button class="btn-dash pink" id="soc-add-titolo" type="button"><i class="ph ph-plus"></i> NUOVO TITOLO</button>` : ''
        }, contentHtml);
    },

    foresteriaInfo: (info, media, isAdmin) => {
        const safeInfo = info || { address: '', description: '' };
        const safeMedia = Array.isArray(media) ? media : [];
        const videoMedia = safeMedia.filter(m => m.type === 'youtube' || m.type === 'video');
        const photoMedia = safeMedia.filter(m => m.type !== 'youtube' && m.type !== 'video');

        const getYoutubeEmbed = (url) => {
            if (!url) return '';
            const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
            return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
        };

        const contentHtml = `
            <div style="max-width:1400px">
                <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
                    <div class="dash-card" style="padding:var(--sp-4)">
                        ${safeInfo.address ? `<p style="font-size:13px; color:var(--color-text-muted); margin-bottom:var(--sp-3)"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(safeInfo.address)}</p>` : ''}
                        <div style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.8)">
                            ${safeInfo.description ? safeInfo.description.replace(/\n/g, '<br>') : 'Nessuna descrizione impostata.'}
                        </div>
                    </div>

                    ${(videoMedia.length > 0) ? `
                    <div class="dash-card" style="padding:var(--sp-4)">
                        <h3 class="dash-card-title" style="margin-bottom:var(--sp-3)">Video</h3>
                        <div class="forest-media-grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
                            ${videoMedia.map(m => `
                                <div class="forest-media-item" data-id="${m.id}" style="aspect-ratio: 16/9; width:100%; position:relative;">
                                    ${m.type === 'youtube' ? `<iframe src="${getYoutubeEmbed(m.file_path)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; position:absolute; top:0; left:0; border-radius:8px;"></iframe>` : `<video src="${Utils.escapeHtml(m.file_path)}" controls style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:8px;"></video>`}
                                    ${isAdmin ? `<button class="forest-media-del" data-id="${m.id}" style="z-index: 10"><i class="ph ph-trash"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div class="dash-card" style="padding:var(--sp-4)">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-3); flex-wrap:wrap; gap:12px;">
                            <h3 class="dash-card-title" style="margin-bottom:0">Galleria Fotografica</h3>
                            ${isAdmin ? `
                            <div style="display:flex; gap:10px;">
                                <button class="btn-dash" id="forest-upload-media"><i class="ph ph-image"></i> Carica Foto/Video</button>
                                <button class="btn-dash" id="forest-add-youtube"><i class="ph ph-youtube-logo"></i> Link YT</button>
                            </div>
                            ` : ''}
                        </div>
                        <div class="forest-media-grid" id="forest-media-list">
                            ${photoMedia.length === 0 ? '<p style="color:var(--color-text-muted); font-size:13px;">Nessuna foto presente.</p>' : photoMedia.map(m => `
                                <div class="forest-media-item" data-id="${m.id}">
                                    <img src="${Utils.escapeHtml(m.file_path)}" alt="">
                                    ${isAdmin ? `<button class="forest-media-del" data-id="${m.id}"><i class="ph ph-trash"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        return SocietaView._shell({
            icon: 'house-line',
            title: 'La Foresteria',
            subtitle: 'Struttura, mappa e galleria multimediale',
            actionHtml: isAdmin ? `<button class="btn-dash" id="forest-edit-info"><i class="ph ph-pencil-simple"></i> Modifica Info</button>` : ''
        }, contentHtml);
    },

    foresteriaExpenses: (expenses, isAdmin) => {
        const safeExpenses = Array.isArray(expenses) ? expenses : [];
        const totalAmount = safeExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

        const catTotals = {};
        let topCat = "—";
        let topCatVal = 0;
        safeExpenses.forEach(e => {
            const c = e.category || 'altro';
            catTotals[c] = (catTotals[c] || 0) + parseFloat(e.amount || 0);
            if (catTotals[c] > topCatVal) { topCatVal = catTotals[c]; topCat = c.replace('_', ' ').toUpperCase(); }
        });

        const now = new Date();
        const thisMonthTotal = safeExpenses.reduce((acc, e) => {
            const d = new Date(e.expense_date);
            return (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) ? acc + parseFloat(e.amount || 0) : acc;
        }, 0);

        return `
        <div style="max-width:1200px; margin: 0 auto; display:flex; flex-direction:column; gap:var(--sp-4)">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:var(--sp-4)">
                <div class="dash-card" style="padding:var(--sp-4); display:flex; align-items:center; gap:var(--sp-3)">
                    <div style="width:48px; height:48px; border-radius:12px; background:rgba(255,0,122,0.1); display:flex; align-items:center; justify-content:center; color:var(--color-pink)">
                        <i class="ph ph-wallet" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:12px; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.05em">Totale Storico</div>
                        <div style="font-size:20px; font-weight:800; color:var(--color-pink)">€ ${totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div class="dash-card" style="padding:var(--sp-4); display:flex; align-items:center; gap:var(--sp-3)">
                    <div style="width:48px; height:48px; border-radius:12px; background:rgba(0,183,255,0.1); display:flex; align-items:center; justify-content:center; color:var(--color-cyan)">
                        <i class="ph ph-calendar-check" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:12px; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.05em">Mese Corrente</div>
                        <div style="font-size:20px; font-weight:800; color:var(--color-cyan)">€ ${thisMonthTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div class="dash-card" style="padding:var(--sp-4); display:flex; align-items:center; gap:var(--sp-3)">
                    <div style="width:48px; height:48px; border-radius:12px; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; color:var(--color-success)">
                        <i class="ph ph-chart-pie-slice" style="font-size:24px;"></i>
                    </div>
                    <div>
                        <div style="font-size:12px; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.05em">Top Categoria</div>
                        <div style="font-size:18px; font-weight:800; color:rgba(255,255,255,0.9)">${topCat}</div>
                    </div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 350px 1fr; gap:var(--sp-4); align-items:start">
                <div class="dash-card" style="padding:var(--sp-4); position:sticky; top:var(--sp-4)">
                    <h3 class="dash-card-title" style="margin-bottom:var(--sp-4)">Ripartizione Spese</h3>
                    <div style="position:relative; height:280px; width:100%">
                        <canvas id="forest-expenses-chart"></canvas>
                    </div>
                    <div id="chart-legend" style="margin-top:var(--sp-4); display:flex; flex-direction:column; gap:8px"></div>
                </div>
                <div class="dash-card" style="padding:var(--sp-4)">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-4)">
                        <div>
                            <h3 class="dash-card-title">Dettaglio Movimenti</h3>
                            <p style="font-size:13px; color:var(--color-text-muted)">Ultime spese registrate</p>
                        </div>
                        ${isAdmin ? '<button class="btn-dash pink" id="forest-add-expense"><i class="ph ph-plus"></i> AGGIUNGI</button>' : ''}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:12px">
                        ${safeExpenses.length === 0 ? Utils.emptyState("Nessuna spesa", "Non sono ancora state registrate spese per la foresteria.") : safeExpenses.map(e => {
                            const amountFloat = parseFloat(e.amount || 0);
                            const amountStr = isNaN(amountFloat) ? '0.00' : amountFloat.toFixed(2);
                            const catIcons = { manutenzione: 'ph-wrench', pulizie: 'ph-sparkle', utenze: 'ph-lightning', cibo: 'ph-bowl-food', frutta_verdura: 'ph-leaf', abbigliamento: 'ph-t-shirt', affitto: 'ph-house', altro: 'ph-receipt' };
                            const catLabels = { cibo: 'Cibo/Spesa', utenze: 'Utenze', pulizie: 'Pulizie', manutenzione: 'Manutenzione', affitto: 'Affitto', frutta_verdura: 'Frutta e Verdura', abbigliamento: 'Abbigliamento', altro: 'Altro' };
                            const catIcon = catIcons[e.category] || 'ph-receipt';
                            const catLabel = (catLabels[e.category || 'altro'] || 'Altro').toUpperCase();
                            return `
                                <div class="forest-expense-item" style="display:flex; align-items:center; gap:16px; padding:12px 16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                                    <div style="width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:var(--color-text-muted)">
                                        <i class="${catIcon}" style="font-size:18px;"></i>
                                    </div>
                                    <div style="flex:1; min-width:0">
                                        <div style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${Utils.escapeHtml(e.description)}">${Utils.escapeHtml(e.description)}</div>
                                        <div style="font-size:11px; color:var(--color-text-muted); display:flex; gap:6px; align-items:center; margin-top:2px">
                                            <span>${Utils.formatDate(e.expense_date)}</span>
                                            <span style="opacity:0.3">•</span>
                                            <span style="color:var(--color-pink); font-weight:700; font-size:10px; letter-spacing:0.5px">${catLabel}</span>
                                        </div>
                                    </div>
                                    <div style="text-align:right">
                                        <div style="font-weight:700; color:var(--color-pink); font-size:15px">€ ${amountStr}</div>
                                        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:4px">
                                            ${e.receipt_path ? `<a href="${Utils.escapeHtml(e.receipt_path)}" target="_blank" class="btn-dash btn-xs" style=" color:var(--color-cyan); border-color:var(--color-cyan)" title="Ricevuta"><i class="ph ph-file-text"></i></a>` : ''}
                                            ${isAdmin ? `<button class="btn-dash btn-xs" style=" border-color:rgba(255,255,255,0.1)" data-del-expense="${e.id}" title="Elimina"><i class="ph ph-trash"></i></button>` : ''}
                                        </div>
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    },

    sponsorModal: (sp = null) => {
        const isEdit = !!sp;
        const s = sp || {};
        return `
            <div style="padding:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Nome Sponsor *</label>
                    <input type="text" id="sp-name" class="form-input" value="${Utils.escapeHtml(s.name || "")}" placeholder="Nome azienda o partner" required>
                </div>
                <div style="display:flex; gap:var(--sp-3); flex-wrap:wrap">
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Tipologia</label>
                        <select id="sp-tipo" class="form-input">
                            <option value="Main Sponsor" ${s.tipo === "Main Sponsor" ? "selected" : ""}>Main Sponsor</option>
                            <option value="Sponsor Tecnico" ${s.tipo === "Sponsor Tecnico" ? "selected" : ""}>Sponsor Tecnico</option>
                            <option value="Partner" ${s.tipo === "Partner" ? "selected" : ""}>Partner</option>
                            <option value="Sponsor" ${!s.tipo || s.tipo === "Sponsor" ? "selected" : ""}>Sponsor Base</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Stagione</label>
                        <input type="text" id="sp-stagione" class="form-input" value="${Utils.escapeHtml(s.stagione || "")}" placeholder="es. 2024/2025">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Stato</label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer">
                        <input type="checkbox" id="sp-active" ${(!isEdit || s.is_active) ? "checked" : ""}>
                        <span style="font-size:14px">Sponsor Attivo</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">Descrizione Breve</label>
                    <textarea id="sp-desc" class="form-input" rows="2" placeholder="Di cosa si occupa l'azienda...">${Utils.escapeHtml(s.description || "")}</textarea>
                </div>
                <div style="display:flex; gap:var(--sp-3); flex-wrap:wrap">
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Importo (€)</label>
                        <input type="number" id="sp-importo" class="form-input" value="${Utils.escapeHtml(String(s.importo || ""))}" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Rapporto / Note collab.</label>
                        <input type="text" id="sp-rapporto" class="form-input" value="${Utils.escapeHtml(s.rapporto || "")}" placeholder="es. Contratto triennale">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Dettagli Sponsorizzazione</label>
                    <textarea id="sp-sponsorizzazione" class="form-input" rows="2" placeholder="Dettagli tecnici o accordi specifici...">${Utils.escapeHtml(s.sponsorizzazione || "")}</textarea>
                </div>
                <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:16px 0">
                <p style="font-size:13px; color:var(--color-text-muted); margin-bottom:8px">Contatti e Link (Opzionali)</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:var(--sp-2)">
                    <div class="form-group">
                        <div class="input-wrapper" style="position:relative">
                            <i class="ph ph-globe" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                            <input type="url" id="sp-website" class="form-input" value="${Utils.escapeHtml(s.website_url || "")}" placeholder="Sito web" style="padding-left:36px">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-wrapper" style="position:relative">
                            <i class="ph ph-instagram-logo" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                            <input type="url" id="sp-instagram" class="form-input" value="${Utils.escapeHtml(s.instagram_url || "")}" placeholder="Instagram URL" style="padding-left:36px">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-wrapper" style="position:relative">
                            <i class="ph ph-facebook-logo" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                            <input type="url" id="sp-facebook" class="form-input" value="${Utils.escapeHtml(s.facebook_url || "")}" placeholder="Facebook URL" style="padding-left:36px">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-wrapper" style="position:relative">
                            <i class="ph ph-linkedin-logo" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                            <input type="url" id="sp-linkedin" class="form-input" value="${Utils.escapeHtml(s.linkedin_url || "")}" placeholder="LinkedIn URL" style="padding-left:36px">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-wrapper" style="position:relative">
                            <i class="ph ph-tiktok-logo" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                            <input type="url" id="sp-tiktok" class="form-input" value="${Utils.escapeHtml(s.tiktok_url || "")}" placeholder="TikTok URL" style="padding-left:36px">
                        </div>
                    </div>
                </div>
                <div id="sp-modal-err" class="form-error hidden" style="margin-top:12px"></div>
            </div>`;
    },

    roleModal: (role, allRoles) => {
        const isEdit = !!role;
        const r = role || {};
        const availableParents = allRoles.filter(x => x.id != r.id);
        return `
            <div style="padding:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Nome Ruolo *</label>
                    <input type="text" id="role-name" class="form-input" value="${Utils.escapeHtml(r.name || "")}" placeholder="es. Presidente" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Riporta a (Ruolo Superiore)</label>
                    <select id="role-parent" class="form-input">
                        <option value="">Nessuno (Ruolo Apicale)</option>
                        ${availableParents.map(p => `<option value="${p.id}" ${r.parent_role_id == p.id ? "selected" : ""}>${Utils.escapeHtml(p.name)}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Descrizione / Responsabilità</label>
                    <textarea id="role-desc" class="form-input" rows="3" placeholder="Mansioni e responsabilità...">${Utils.escapeHtml(r.description || "")}</textarea>
                </div>
                <div id="role-modal-err" class="form-error hidden" style="margin-top:12px"></div>
            </div>`;
    },

    memberModal: (member, roles) => {
        const m = member || {};
        const isEdit = !!member;
        return `
            <div style="padding:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" id="mem-name" class="form-input" value="${Utils.escapeHtml(m.full_name || "")}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Ruolo</label>
                    <select id="mem-role" class="form-input">
                        <option value="">Nessun ruolo specifico</option>
                        ${roles.map(r => `<option value="${r.id}" ${m.role_id == r.id ? "selected" : ""}>${Utils.escapeHtml(r.name)}</option>`).join("")}
                    </select>
                </div>
                <div style="display:flex; gap:var(--sp-3); flex-wrap:wrap">
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Data Inizio</label>
                        <input type="date" id="mem-start-date" class="form-input" value="${Utils.escapeHtml(m.start_date || "")}">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Data Fine (Opzionale)</label>
                        <input type="date" id="mem-end-date" class="form-input" value="${Utils.escapeHtml(m.end_date || "")}">
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer">
                        <input type="checkbox" id="mem-active" ${(!isEdit || m.is_active) ? "checked" : ""}>
                        <span style="font-size:14px">Membro Attivo</span>
                    </label>
                </div>
                <div id="mem-modal-err" class="form-error hidden" style="margin-top:12px"></div>
            </div>`;
    },

    deadlineModal: (dl) => {
        const d = dl || {};
        return `
            <div style="padding:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Titolo *</label>
                    <input type="text" id="dl-title" class="form-input" value="${Utils.escapeHtml(d.title || "")}" required>
                </div>
                <div style="display:flex; gap:var(--sp-3); flex-wrap:wrap">
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Categoria</label>
                        <input type="text" id="dl-category" class="form-input" value="${Utils.escapeHtml(d.category || "")}" placeholder="Es. Fiscale, Federale">
                    </div>
                    <div class="form-group" style="flex:1">
                        <label class="form-label">Scadenza *</label>
                        <input type="date" id="dl-due-date" class="form-input" value="${Utils.escapeHtml(d.due_date || "")}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Stato</label>
                    <select id="dl-status" class="form-input">
                        <option value="aperto" ${d.status === 'aperto' ? 'selected' : ''}>Aperto</option>
                        <option value="completato" ${d.status === 'completato' ? 'selected' : ''}>Completato</option>
                        <option value="scaduto" ${d.status === 'scaduto' ? 'selected' : ''}>Scaduto</option>
                        <option value="annullato" ${d.status === 'annullato' ? 'selected' : ''}>Annullato</option>
                    </select>
                </div>
                <div id="dl-modal-err" class="form-error hidden" style="margin-top:12px"></div>
            </div>`;
    },

    titoloModal: (titolo) => {
        const t = titolo || {};
        return `
            <div style="padding:var(--sp-4);">
                <div class="form-group">
                    <label class="form-label">Stagione *</label>
                    <input type="text" id="tit-stagione" class="form-input" value="${Utils.escapeHtml(t.stagione || "")}" placeholder="Es. 2023/2024" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Campionato *</label>
                    <input type="text" id="tit-campionato" class="form-input" value="${Utils.escapeHtml(t.campionato || "")}" placeholder="Es. Serie D, Under 17, ecc." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <input type="text" id="tit-categoria" class="form-input" value="${Utils.escapeHtml(t.categoria || "")}" placeholder="Es. Maschile, Femminile">
                </div>
                <div class="form-group">
                    <label class="form-label">Piazzamento</label>
                    <input type="number" id="tit-piazzamento" class="form-input" value="${Utils.escapeHtml(t.piazzamento || 1)}" min="1">
                </div>
                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer">
                        <input type="checkbox" id="tit-finali" ${t.finali_nazionali ? "checked" : ""}>
                        <span style="font-size:14px">Partecipazione Finali Nazionali</span>
                    </label>
                </div>
                <div id="tit-modal-err" class="form-error hidden" style="margin-top:12px"></div>
            </div>`;
    }

};

export default SocietaView;
