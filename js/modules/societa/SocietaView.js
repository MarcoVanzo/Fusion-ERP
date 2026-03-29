/**
 * Societa View Module
 */
const SocietaView = {
    skeleton: () => `
        <div class="soc-container">
            <div id="soc-tab-header" style="padding:var(--sp-4) var(--sp-4) 0 var(--sp-4)"></div>
            <div id="soc-tab-content" style="padding:var(--sp-4)">
                <div class="skeleton-shimmer" style="height:400px; border-radius:12px"></div>
            </div>
        </div>`,

    identity: (profile, isAdmin) => `
        <div style="max-width:1200px">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--sp-4); align-items: start; margin-bottom: var(--sp-4)">
                <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
                    <div class="dash-card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
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
                    <div class="dash-card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
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
                <div class="dash-card" style="padding:var(--sp-4); height:100%;margin-bottom:var(--sp-3)">
                    <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Mission &amp; Vision</p>
                    <div class="form-group">
                        <label class="form-label" for="soc-mission">Mission</label>
                        <textarea id="soc-mission" class="form-input" rows="3" placeholder="La missione della nostra società..." style="resize:vertical">${Utils.escapeHtml(profile.mission || "")}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="soc-vision">Vision</label>
                        <textarea id="soc-vision" class="form-input" rows="3" placeholder="La nostra visione per il futuro..." style="resize:vertical">${Utils.escapeHtml(profile.vision || "")}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="soc-values">Valori</label>
                        <textarea id="soc-values" class="form-input" rows="2" placeholder="Rispetto, fairplay, crescita..." style="resize:vertical">${Utils.escapeHtml(profile.values || "")}</textarea>
                    </div>
                </div>
            </div>
            ${isAdmin ? `<div style="display:flex;justify-content:flex-end;margin-top:var(--sp-2)"><div id="soc-profile-err" class="form-error hidden"></div><button class="btn-dash pink" id="soc-save-profile" type="button"><i class="ph ph-floppy-disk"></i> SALVA PROFILO</button></div>` : ""}
        </div>`,

    orgChart: (roles, isAdmin) => {
        const roots = roles.filter(r => !r.parent_role_id);
        const renderNode = (role) => {
            const children = roles.filter(r => r.parent_role_id === role.id);
            return `
                <div style="margin-bottom:var(--sp-2)">
                    <div class="soc-tree-node" draggable="${isAdmin}" data-role-id="${Utils.escapeHtml(role.id)}">
                        ${isAdmin ? '<i class="ph ph-dots-six-vertical soc-tree-drag-handle"></i>' : ""}
                        <div style="flex:1">
                            <div class="soc-tree-node-name">${Utils.escapeHtml(role.name)}</div>
                            ${role.description ? `<div class="soc-tree-node-desc">${Utils.escapeHtml(role.description)}</div>` : ""}
                        </div>
                        ${isAdmin ? `
                            <button class="btn-dash" data-edit-role="${Utils.escapeHtml(role.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                            <button class="btn-dash" data-del-role="${Utils.escapeHtml(role.id)}" type="button" title="Elimina" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                        ` : ""}
                    </div>
                    ${children.length ? `<div class="soc-tree-level">${children.map(renderNode).join("")}</div>` : ""}
                </div>`;
        };

        return `
            <div>
                ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-role" type="button"><i class="ph ph-plus"></i> NUOVO RUOLO</button></div>' : ""}
                <div class="soc-tree" id="soc-tree">
                    ${roles.length === 0 ? Utils.emptyState("Nessun ruolo", "Aggiungi il primo ruolo con il pulsante in alto.") : roots.map(renderNode).join("")}
                </div>
            </div>`;
    },

    membersTable: (members, isAdmin) => `
        <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                <div class="input-wrapper" style="position:relative;min-width:220px">
                    <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                    <input type="text" id="soc-members-search" class="form-input" placeholder="Cerca membro..." style="padding-left:36px;height:40px;font-size:13px">
                </div>
                ${isAdmin ? '<button class="btn-dash pink" id="soc-add-member" type="button"><i class="ph ph-plus"></i> AGGIUNGI MEMBRO</button>' : ""}
            </div>
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
                                    <button class="btn-dash" data-edit-member="${Utils.escapeHtml(m.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn-dash" data-del-member="${Utils.escapeHtml(m.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </td>` : ""}
                            </tr>`).join("")}
                    </tbody>
                </table>
            </div>
        </div>`,

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
                                    ${isAdmin ? `<button class="btn-dash" data-del-doc="${Utils.escapeHtml(doc.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ""}
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
                                <div style="display:flex;gap:4px">
                                    <button class="btn-dash" data-edit-dl="${Utils.escapeHtml(dl.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn-dash" data-del-dl="${Utils.escapeHtml(dl.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ""}
                        </div>`).join("")}
                </div>
            </div>`;
    },

    sponsorsGrid: (sponsors, isAdmin) => `
        <div>
            ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-sponsor" type="button"><i class="ph ph-plus"></i> NUOVO SPONSOR</button></div>' : ""}
            ${sponsors.length === 0 ? Utils.emptyState("Nessuno sponsor", "Aggiungi il primo sponsor con il pulsante in alto.") : `
                <div class="soc-sponsor-grid">
                    ${sponsors.map((sp) => `
                        <div class="soc-sponsor-card ${sp.is_active ? "" : "soc-sponsor-inactive"}">
                            <div class="soc-sponsor-card-header">
                                ${sp.logo_path ? `<img src="${Utils.escapeHtml(sp.logo_path)}" alt="Logo" class="soc-sponsor-logo">` : '<div class="soc-sponsor-logo-placeholder"><i class="ph ph-image"></i></div>'}
                                ${isAdmin ? `
                                    <div style="display:flex;gap:4px">
                                        <button class="btn-dash" data-sp-logo="${Utils.escapeHtml(sp.id)}" type="button" title="Carica logo"><i class="ph ph-camera"></i></button>
                                        <button class="btn-dash" data-sp-edit="${Utils.escapeHtml(sp.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                                        <button class="btn-dash" data-sp-del="${Utils.escapeHtml(sp.id)}" type="button" style="color:var(--color-pink)" title="Elimina"><i class="ph ph-trash"></i></button>
                                    </div>
                                ` : ""}
                            </div>
                            <div class="soc-sponsor-name">${Utils.escapeHtml(sp.name)}</div>
                            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.05em">${Utils.escapeHtml(sp.tipo || "Sponsor")}</div>
                            ${sp.description ? `<div class="soc-sponsor-desc">${Utils.escapeHtml(sp.description)}</div>` : ""}
                            <div class="soc-sponsor-links">
                                ${sp.website_url ? `<a href="${Utils.escapeHtml(sp.website_url)}" target="_blank" class="soc-sponsor-link" title="Sito web"><i class="ph ph-globe-simple"></i></a>` : ""}
                                ${sp.instagram_url ? `<a href="${Utils.escapeHtml(sp.instagram_url)}" target="_blank" class="soc-sponsor-link" title="Instagram"><i class="ph ph-instagram-logo"></i></a>` : ""}
                                ${sp.facebook_url ? `<a href="${Utils.escapeHtml(sp.facebook_url)}" target="_blank" class="soc-sponsor-link" title="Facebook"><i class="ph ph-facebook-logo"></i></a>` : ""}
                                ${sp.linkedin_url ? `<a href="${Utils.escapeHtml(sp.linkedin_url)}" target="_blank" class="soc-sponsor-link" title="LinkedIn"><i class="ph ph-linkedin-logo"></i></a>` : ""}
                                ${sp.tiktok_url ? `<a href="${Utils.escapeHtml(sp.tiktok_url)}" target="_blank" class="soc-sponsor-link" title="TikTok"><i class="ph ph-tiktok-logo"></i></a>` : ""}
                            </div>
                        </div>`).join("")}
                </div>`}
        </div>`,

    titoli: (titoli, isAdmin) => `
        <div>
            ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-titolo" type="button"><i class="ph ph-plus"></i> NUOVO TITOLO</button></div>' : ""}
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
                                <button class="btn-dash" data-edit-titolo="${Utils.escapeHtml(t.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                <button class="btn-dash" data-del-titolo="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                            </div>
                        ` : ""}
                    </div>`).join("")}
            </div>
        </div>`,

    foresteriaInfo: (info, media, isAdmin) => {
        const safeInfo = info || { address: '', description: '' };
        const safeMedia = Array.isArray(media) ? media : [];

        return `
        <div style="max-width:1400px">
            <div style="display:grid; grid-template-columns: 1fr 400px; gap:var(--sp-4); align-items:start">
                <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
                    <div class="dash-card" style="padding:var(--sp-4)">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-3)">
                            <div>
                                <h3 class="dash-card-title">Informazioni Foresteria</h3>
                                <p style="font-size:13px; color:var(--color-text-muted)">${Utils.escapeHtml(safeInfo.address || '')}</p>
                            </div>
                            ${isAdmin ? '<button class="btn-dash" id="forest-edit-info"><i class="ph ph-pencil-simple"></i> Modifica</button>' : ''}
                        </div>
                        <div style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.8)">
                            ${safeInfo.description ? safeInfo.description.replace(/\n/g, '<br>') : 'Nessuna descrizione impostata.'}
                        </div>
                    </div>
                    
                    <div class="dash-card" style="padding:var(--sp-4)">
                        <h3 class="dash-card-title" style="margin-bottom:var(--sp-3)">Galleria Multimedia</h3>
                        ${isAdmin ? `
                        <div style="display:flex; gap:10px; margin-bottom:var(--sp-3)">
                            <button class="btn-dash" id="forest-upload-media"><i class="ph ph-upload"></i> Carica Foto/Video</button>
                            <button class="btn-dash" id="forest-add-youtube"><i class="ph ph-youtube-logo"></i> Aggiungi Link YT</button>
                        </div>
                        ` : ''}
                        <div class="forest-media-grid" id="forest-media-list">
                            ${safeMedia.map(m => `
                                <div class="forest-media-item" data-id="${m.id}">
                                    ${m.type === 'youtube' ? `<iframe src="${Utils.escapeHtml(m.file_path.replace('watch?v=', 'embed/'))}" frameborder="0" allowfullscreen style="width:100%; height:100%;"></iframe>` : m.type === 'video' ? `<video src="${Utils.escapeHtml(m.file_path)}" controls style="width:100%; height:100%; object-fit:cover;"></video>` : `<img src="${Utils.escapeHtml(m.file_path)}" alt="">`}
                                    ${isAdmin ? `<button class="forest-media-del" data-id="${m.id}"><i class="ph ph-trash"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="dash-card" style="padding:0; overflow:hidden; border:1px solid var(--color-border); aspect-ratio: 1/1">
                    <div id="forest-map-container" style="width:100%; height:100%;"></div>
                </div>
            </div>
        </div>`;
    },

    foresteriaExpenses: (expenses, isAdmin) => {
        const safeExpenses = Array.isArray(expenses) ? expenses : [];
        const totalAmount = safeExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
        
        // Group by category for KPIs
        const catTotals = {};
        let topCat = "—";
        let topCatVal = 0;
        
        safeExpenses.forEach(e => {
            const c = e.category || 'altro';
            catTotals[c] = (catTotals[c] || 0) + parseFloat(e.amount || 0);
            if (catTotals[c] > topCatVal) {
                topCatVal = catTotals[c];
                topCat = c.replace('_', ' ').toUpperCase();
            }
        });

        // Current month total
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();
        const thisMonthTotal = safeExpenses.reduce((acc, e) => {
            const d = new Date(e.expense_date);
            return (d.getMonth() === curMonth && d.getFullYear() === curYear) ? acc + parseFloat(e.amount || 0) : acc;
        }, 0);

        return `
        <div style="max-width:1200px; margin: 0 auto; display:flex; flex-direction:column; gap:var(--sp-4)">
            
            <!-- KPI Section -->
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

            <!-- Chart & List Section -->
            <div style="display:grid; grid-template-columns: 350px 1fr; gap:var(--sp-4); align-items:start">
                
                <!-- Chart Card -->
                <div class="dash-card" style="padding:var(--sp-4); position:sticky; top:var(--sp-4)">
                    <h3 class="dash-card-title" style="margin-bottom:var(--sp-4)">Ripartizione Spese</h3>
                    <div style="position:relative; height:280px; width:100%">
                        <canvas id="forest-expenses-chart"></canvas>
                    </div>
                    <div id="chart-legend" style="margin-top:var(--sp-4); display:flex; flex-direction:column; gap:8px"></div>
                </div>

                <!-- Expenses List -->
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
                            
                            const catIcons = {
                                'manutenzione': 'ph-wrench',
                                'pulizie': 'ph-sparkle',
                                'utenze': 'ph-lightning',
                                'cibo': 'ph-bowl-food',
                                'frutta_verdura': 'ph-leaf',
                                'abbigliamento': 'ph-t-shirt',
                                'affitto': 'ph-house',
                                'altro': 'ph-receipt'
                            };
                            const catLabels = {
                                'cibo': 'Cibo/Spesa',
                                'utenze': 'Utenze',
                                'pulizie': 'Pulizie',
                                'manutenzione': 'Manutenzione',
                                'affitto': 'Affitto',
                                'frutta_verdura': 'Frutta e Verdura',
                                'abbigliamento': 'Abbigliamento',
                                'altro': 'Altro'
                            };
                            const catIcon = catIcons[e.category] || 'ph-receipt';
                            const catLabel = (catLabels[e.category || 'altro'] || 'Altro').toUpperCase();

                            return `
                                <div class="forest-expense-item" style="display:flex; align-items:center; gap:16px; padding:12px 16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
                                    <div style="width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:var(--color-text-muted)">
                                        <i class="${catIcon}" style="font-size:18px;"></i>
                                    </div>
                                    <div style="flex:1; min-width:0">
                                        <div style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${Utils.escapeHtml(e.description)}">
                                            ${Utils.escapeHtml(e.description)}
                                        </div>
                                        <div style="font-size:11px; color:var(--color-text-muted); display:flex; gap:6px; align-items:center; margin-top:2px">
                                            <span>${Utils.formatDate(e.expense_date)}</span>
                                            <span style="opacity:0.3">•</span>
                                            <span style="color:var(--color-pink); font-weight:700; font-size:10px; letter-spacing:0.5px">${catLabel}</span>
                                        </div>
                                    </div>
                                    <div style="text-align:right">
                                        <div style="font-weight:700; color:var(--color-pink); font-size:15px">€ ${amountStr}</div>
                                        <div style="display:flex; gap:6px; justify-content:flex-end; margin-top:4px">
                                            ${e.receipt_path ? `
                                                <a href="${Utils.escapeHtml(e.receipt_path)}" target="_blank" class="btn-dash" style="padding:2px 6px; font-size:10px; height:auto; color:var(--color-cyan); border-color:var(--color-cyan)" title="Ricevuta">
                                                    <i class="ph ph-file-text"></i>
                                                </a>
                                            ` : ''}
                                            ${isAdmin ? `
                                                <button class="btn-dash" style="padding:2px 6px; font-size:10px; height:auto; border-color:rgba(255,255,255,0.1)" data-del-expense="${e.id}" title="Elimina">
                                                    <i class="ph ph-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>`;
    }

};

export default SocietaView;
