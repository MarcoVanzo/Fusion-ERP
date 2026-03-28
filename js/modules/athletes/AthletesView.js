/**
 * AthletesView — Template e Rendering del modulo Atleti
 */

export const AthletesView = {
    /**
     * Template principale della Dashboard Atleti
     */
    dashboard: (teams) => `
        <div class="module-header">
            <div class="header-content">
                <h1 class="module-title"><i class="ph ph-users-three"></i> Anagrafica Atleti</h1>
                <p class="module-subtitle">Gestione dei tesserati, documenti e dati biometrici</p>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary btn-sm" id="new-athlete-btn">
                    <i class="ph ph-user-plus"></i> Nuovo Atleta
                </button>
            </div>
        </div>

        <div class="module-controls card">
            <div class="search-box">
                <i class="ph ph-magnifying-glass search-icon"></i>
                <input type="text" id="athlete-search" class="search-input" placeholder="Cerca per nome, ruolo o maglia...">
            </div>
            <div class="filter-group">
                <select id="team-filter" class="form-input select-filter">
                    <option value="">Tutte le squadre/stagioni</option>
                    ${teams.map(t => `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.season)} — ${Utils.escapeHtml(t.name)} (${Utils.escapeHtml(t.category)})</option>`).join('')}
                </select>
                <button class="btn btn-ghost btn-sm" id="reset-filters" title="Reset filtri">
                    <i class="ph ph-arrow-counter-clockwise"></i>
                </button>
            </div>
        </div>

        <div class="table-wrapper" style="background:var(--color-black);border:1px solid rgba(255,255,255,0.05);border-radius:12px;overflow:hidden;margin-top:24px;">
            <table class="table" style="width:100%;text-align:left;border-collapse:collapse;">
                <thead style="background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);">
                    <tr>
                        <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Atleta</th>
                        <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Ruolo</th>
                        <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Squadra</th>
                        <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Data Nascita</th>
                        <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Certificato Medico</th>
                    </tr>
                </thead>
                <tbody id="athletes-grid"></tbody>
            </table>
        </div>
        <div id="athlete-bulk-bar" class="bulk-action-bar" style="display:none;"></div>
    `,

    /**
     * Template per singola card atleta nella griglia
     */
    athleteCard: (athlete, isSelected = false) => {
        const initials = Utils.initials(athlete.full_name);
        const color = `hsl(${Array.from(athlete.full_name).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)`;
        const photo = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" alt="${Utils.escapeHtml(athlete.full_name)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
            : `<div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#fff;flex-shrink:0;">${initials}</div>`;
        
        let medicalStatusHtml = '<span style="color:var(--color-text-muted)">—</span>';
        if (athlete.medical_cert_expires_at) {
            const days = Utils.daysUntil(athlete.medical_cert_expires_at);
            const dateStr = Utils.formatDate(athlete.medical_cert_expires_at);
            if (days > 30) {
                medicalStatusHtml = `<span style="color:var(--color-success)">${dateStr} <i class="ph ph-check-circle"></i></span>`;
            } else if (days >= 0) {
                medicalStatusHtml = `<span style="color:var(--color-warning)">${dateStr} <i class="ph ph-warning"></i></span>`;
            } else {
                medicalStatusHtml = `<span style="color:var(--color-pink)">${dateStr} <i class="ph ph-x-circle"></i></span>`;
            }
        }

        return `
            <tr class="athlete-card ${isSelected ? 'selected' : ''}" data-id="${athlete.id}" style="cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s;">
                <td style="padding:12px 16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        ${isSelected ? '<div style="color:var(--color-primary);"><i class="ph ph-check-circle" style="font-size:18px;"></i></div>' : ''}
                        ${photo}
                        <div>
                            <div style="font-weight:600;font-size:14px;color:var(--color-white);">${Utils.escapeHtml(athlete.full_name)}</div>
                            <div style="font-size:11px;color:var(--color-text-muted);"><i class="ph ph-hashtag"></i> ${athlete.jersey_number || '—'}</div>
                        </div>
                    </div>
                </td>
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);">${Utils.escapeHtml(athlete.role || '—')}</td>
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);">${athlete.birth_date ? Utils.formatDate(athlete.birth_date) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
                <td style="padding:12px 16px;font-size:13px;">${medicalStatusHtml}</td>
            </tr>
        `;
    },

    /**
     * Layout del profilo atleta (Header + Tabs)
     */
    profileLayout: (athlete, currentTab = 'anagrafica') => {
        const photo = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" alt="${athlete.full_name}" style="width:100%;height:100%;object-fit:cover;object-position:center;">`
            : `<span style="font-family:var(--font-display);font-size:3.5rem;font-weight:700;color:#000;">${Utils.initials(athlete.full_name)}</span>`;

        return `
            <div class="profile-header card">
                <button class="btn-back" id="back-to-list"><i class="ph ph-arrow-left"></i> Torna alla lista</button>
                <div class="profile-hero">
                    <div class="profile-photo" id="athlete-photo-preview">${photo}</div>
                    <div class="profile-main-info">
                        <h1 class="profile-name">${Utils.escapeHtml(athlete.full_name)}</h1>
                        <div class="profile-badges">
                            <span class="badge"><i class="ph ph-hashtag"></i> Maglia #${athlete.jersey_number || '—'}</span>
                            <span class="badge"><i class="ph ph-shield"></i> ${Utils.escapeHtml(athlete.role || '—')}</span>
                            <span class="badge"><i class="ph ph-users"></i> ${Utils.escapeHtml(athlete.team_name)}</span>
                        </div>
                    </div>
                </div>
                <div class="profile-tabs" id="athlete-tab-bar">
                    <button class="athlete-tab-btn" data-tab="anagrafica">Anagrafica</button>
                    <button class="athlete-tab-btn" data-tab="pagamenti">Pagamenti</button>
                    <button class="athlete-tab-btn" data-tab="metrics" style="color:var(--color-pink)">Performance (VALD)</button>
                    <button class="athlete-tab-btn" data-tab="documenti">Documenti</button>
                    <div id="tab-scroll-indicator" class="scroll-indicator"><i class="ph ph-caret-right"></i></div>
                </div>
            </div>

            <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:none;"></div>
            <div id="tab-panel-pagamenti" class="athlete-tab-panel" style="display:none;"></div>
            <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;"></div>
            <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;"></div>
        `;
    },

    /**
     * Tab: Anagrafica
     */
    tabAnagrafica: (athlete) => `
        <div class="profile-grid">
            <div class="profile-col">
                <div class="card glass-card h-full">
                    <h3 class="section-title"><i class="ph ph-info"></i> Informazioni Personali</h3>
                    <div class="info-list">
                        <div class="info-item"><span class="label">Nato il:</span> <span class="value">${Utils.formatDate(athlete.birth_date)} a ${Utils.escapeHtml(athlete.birth_place || '—')}</span></div>
                        <div class="info-item"><span class="label">Codice Fiscale:</span> <span class="value">${Utils.escapeHtml(athlete.fiscal_code || '—')}</span></div>
                        <div class="info-item"><span class="label">Indirizzo:</span> <span class="value">${Utils.escapeHtml(athlete.residence_address || '—')}, ${Utils.escapeHtml(athlete.residence_city || '—')}</span></div>
                        <div class="info-item"><span class="label">Email:</span> <span class="value">${Utils.escapeHtml(athlete.email || '—')}</span></div>
                        <div class="info-item"><span class="label">Cellulare:</span> <span class="value">${Utils.escapeHtml(athlete.phone || '—')}</span></div>
                    </div>
                </div>
            </div>
            <div class="profile-col">
                <div class="card glass-card h-full">
                    <h3 class="section-title"><i class="ph ph-users-four"></i> Contatti Genitori</h3>
                    <div class="info-list">
                        <div class="info-item"><span class="label">Referente:</span> <span class="value">${Utils.escapeHtml(athlete.parent_contact || '—')}</span></div>
                        <div class="info-item"><span class="label">Cellulare:</span> <span class="value">${Utils.escapeHtml(athlete.parent_phone || '—')}</span></div>
                    </div>
                    <div class="medical-info-box" style="margin-top:var(--sp-4);">
                        <h4 style="font-size:11px;text-transform:uppercase;color:var(--color-text-muted);margin-bottom:8px;">Stato Medico</h4>
                        <div class="medical-cert-card" style="background:rgba(255,255,255,0.03);padding:12px;border-radius:var(--radius);border:1px solid var(--color-border);">
                            <div style="font-size:13px;font-weight:600;margin-bottom:4px;">Certificato: ${Utils.escapeHtml(athlete.medical_cert_type || 'Agonistico')}</div>
                            <div style="font-size:12px;color:var(--color-pink);">Scadenza: ${Utils.formatDate(athlete.medical_cert_expires_at) || '—'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    /**
     * Tab: Pagamenti
     */
    tabPagamenti: (athlete) => `
        <div class="card p-6" style="text-align:center;color:var(--color-text-muted);">
            <i class="ph ph-currency-eur" style="font-size:3rem;margin-bottom:1rem;color:var(--color-text-muted);"></i>
            <h3>Modulo Pagamenti in arrivo</h3>
            <p>Lo storico dei pagamenti e delle rate sarà disponibile prossimamente.</p>
        </div>
    `,

    /**
     * Tab: Documenti
     */
    tabDocumenti: (athlete, canUpload = false) => {
        const docs = [
            { id: 'contract-file', label: 'Contratto / Iscrizione', path: athlete.contract_file_path },
            { id: 'id-doc-front', label: 'Documento ID (Fronte)', path: athlete.id_doc_front_file_path },
            { id: 'id-doc-back', label: 'Documento ID (Retro)', path: athlete.id_doc_back_file_path },
            { id: 'cf-doc-front', label: 'Codice Fiscale (Fronte)', path: athlete.cf_doc_front_file_path },
            { id: 'cf-doc-back', label: 'Codice Fiscale (Retro)', path: athlete.cf_doc_back_file_path },
            { id: 'med-cert', label: 'Certificato Medico', path: athlete.medical_cert_file_path }
        ];

        return `
            <div class="docs-grid">
                ${docs.map(doc => `
                    <div class="doc-card card">
                        <div class="doc-icon"><i class="ph ph-file-pdf"></i></div>
                        <div class="doc-info">
                            <span class="doc-label">${doc.label}</span>
                            <span class="doc-status">${doc.path ? '✅ Caricato' : '❌ Mancante'}</span>
                        </div>
                        <div class="doc-actions">
                            ${doc.path ? `<button class="btn btn-ghost btn-xs" onclick="window.open('api/?module=athletes&action=downloadDoc&id=${athlete.id}&field=${doc.id.replace(/-/g,'_')}_path', '_blank')"><i class="ph ph-eye"></i></button>` : ''}
                            ${canUpload ? `<button class="btn btn-ghost btn-xs" id="upload-${doc.id}-btn"><i class="ph ph-upload-simple"></i></button><input type="file" id="upload-${doc.id}-input" style="display:none;" accept=".pdf,image/*">` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
