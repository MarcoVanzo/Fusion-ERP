/**
 * AthletesView — Template e Rendering del modulo Atleti
 */

export const AthletesView = {
    /**
     * Template principale della Dashboard Atleti
     */
    dashboard: (teams, variant = 'anagrafica') => {
        let title = "Anagrafica Atleti";
        let subtitle = "Gestione dei tesserati, documenti e dati biometrici";
        let thRow = ``;

        if (variant === 'documenti') {
            title = "Documenti Atlete";
            subtitle = "Stato dei documenti, contratti d'iscrizione e certificati medici";
            thRow = `
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Atleta</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Squadra</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Doc. Identità</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Codice Fiscale</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Contratto Iscr.</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Certificato Medico</th>
            `;
        } else if (variant === 'metrics') {
            title = "Performance e Metriche";
            subtitle = "Altezza, peso, IMC e integrazione con test VALD";
            thRow = `
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Atleta</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Squadra</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Jump Height (cm)</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">RSImod</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Braking Imp.</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;text-align:center;">Ultimo Test VALD</th>
            `;
        } else {
            thRow = `
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Atleta</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Ruolo</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Squadra</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Data Nascita</th>
                <th style="padding:16px;color:var(--color-silver);font-weight:600;font-size:12px;text-transform:uppercase;">Certificato Medico</th>
            `;
        }

        return `
        <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h1 class="dash-title"><i class="ph ph-users-three"></i> ${title}</h1>
                    <p class="dash-subtitle" style="margin-top:4px;">${subtitle}</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-primary btn-sm" id="new-athlete-btn">
                        <i class="ph ph-user-plus"></i> Nuovo Atleta
                    </button>
                </div>
            </div>
            <div class="dash-filters" style="margin-top: 16px;">
                <button class="dash-filter athlete-main-tab ${variant === 'anagrafica' ? 'active' : ''}" onclick="Router.navigate('athletes')" type="button">Anagrafica</button>
                <button class="dash-filter athlete-main-tab ${variant === 'documenti' ? 'active' : ''}" onclick="Router.navigate('athlete-documents')" type="button">Documenti</button>
                <button class="dash-filter athlete-main-tab ${variant === 'metrics' ? 'active' : ''}" onclick="Router.navigate('athlete-metrics')" type="button">Performance (VALD)</button>
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
                    \${teams.map(t => \`<option value="\${Utils.escapeHtml(t.id)}">\${Utils.escapeHtml(t.season)} — \${Utils.escapeHtml(t.name)} (\${Utils.escapeHtml(t.category)})\</option>\`).join('')}
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
                        ${thRow}
                    </tr>
                </thead>
                <tbody id="athletes-grid"></tbody>
            </table>
        </div>
        <div id="athlete-bulk-bar" class="bulk-action-bar" style="display:none;"></div>
    `;
    },

    /**
     * Template per singola card atleta nella griglia
     */
    athleteCard: (athlete, isSelected = false, variant = 'anagrafica') => {
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

        let cellsHtml = ``;
        if (variant === 'documenti') {
            const renderDocCell = (hasDocFront, hasDocBack = false) => {
                const complete = hasDocFront && (hasDocBack !== null ? hasDocBack : true);
                if (complete) return `<span style="color:var(--color-success);font-size:18px;"><i class="ph ph-check-circle"></i></span>`;
                return `<span style="color:var(--color-pink);font-size:18px;"><i class="ph ph-warning-circle"></i></span>`;
            };
            cellsHtml = `
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);">${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="padding:12px 16px;text-align:center;">${renderDocCell(athlete.id_doc_front_file_path, athlete.id_doc_back_file_path !== undefined ? athlete.id_doc_back_file_path : athlete.id_doc_front_file_path)}</td>
                <td style="padding:12px 16px;text-align:center;">${renderDocCell(athlete.cf_doc_front_file_path, athlete.cf_doc_back_file_path !== undefined ? athlete.cf_doc_back_file_path : athlete.cf_doc_front_file_path)}</td>
                <td style="padding:12px 16px;text-align:center;">${renderDocCell(athlete.contract_file_path)}</td>
                <td style="padding:12px 16px;font-size:13px;">${medicalStatusHtml}</td>
            `;
        } else if (variant === 'metrics') {
            // Parsing metrics from backend
            let valdMetrics = {};
            try {
                if (athlete.latest_vald_metrics) {
                    valdMetrics = JSON.parse(athlete.latest_vald_metrics);
                }
            } catch(e) {}

            const jumpHeight = valdMetrics.JumpHeight?.Value ?? valdMetrics.JumpHeightTotal?.Value ?? null;
            const rsimod = valdMetrics.RSIModified?.Value ?? null;
            const brakingImp = valdMetrics.BrakingImpulse?.Value ?? valdMetrics.EccentricBrakingImpulse?.Value ?? null;
            const testDate = athlete.latest_vald_date ? Utils.formatDate(athlete.latest_vald_date) : null;

            cellsHtml = `
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="padding:12px 16px;text-align:center;font-size:13px;color:var(--color-white);font-weight:600;">${jumpHeight ? jumpHeight.toFixed(1) : '—'}</td>
                <td style="padding:12px 16px;text-align:center;font-size:13px;color:var(--color-white);font-weight:600;">${rsimod ? rsimod.toFixed(3) : '—'}</td>
                <td style="padding:12px 16px;text-align:center;font-size:13px;color:var(--color-white);">${brakingImp ? brakingImp.toFixed(0) : '—'}</td>
                <td style="padding:12px 16px;text-align:center;">
                    ${testDate 
                        ? `<span style="color:var(--color-success);font-size:12px;font-weight:600;"><i class="ph ph-calendar-check"></i> ${testDate}</span>`
                        : `<span style="color:var(--color-text-muted);font-size:10px;text-transform:uppercase;"><i class="ph ph-link-break"></i> Mai sinc.</span>`
                    }
                </td>
            `;
        } else {
            cellsHtml = `
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);">${Utils.escapeHtml(athlete.role || '—')}</td>
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(athlete.team_name)}</td>
                <td style="padding:12px 16px;font-size:13px;color:var(--color-silver);">${athlete.birth_date ? Utils.formatDate(athlete.birth_date) : '<span style="color:var(--color-text-muted)">—</span>'}</td>
                <td style="padding:12px 16px;font-size:13px;">${medicalStatusHtml}</td>
            `;
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
                ${cellsHtml}
            </tr>
        `;
    },

    /**
     * Layout del profilo atleta (Header + Tabs)
     */
    profileLayout: (athlete, currentTab = 'anagrafica') => {
        const photoHtml = athlete.photo_path 
            ? `<img src="${Utils.escapeHtml(athlete.photo_path)}" class="athlete-hero-photo" alt="${athlete.full_name}">`
            : `<div class="athlete-hero-photo" style="display:flex;align-items:center;justify-content:center;background:var(--color-bg-card);"><span style="font-family:var(--font-display);font-size:5rem;font-weight:700;color:rgba(255,255,255,0.1);">${Utils.initials(athlete.full_name)}</span></div>`;

        return `
            <div class="athlete-hero">
                ${photoHtml}
                <div class="athlete-hero-overlay">
                    <button class="btn btn-default btn-sm" id="back-to-list" style="margin-bottom:var(--sp-4);background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.1);">
                        <i class="ph ph-arrow-left"></i> Torna alla lista
                    </button>
                    <div class="profile-main-info">
                        <h1 class="profile-name" style="font-size:clamp(2.5rem, 6vw, 4.5rem);line-height:1;margin-bottom:var(--sp-2);color:var(--color-white);font-family:var(--font-display);font-weight:800;text-transform:uppercase;letter-spacing:-0.03em;">
                            ${Utils.escapeHtml(athlete.full_name)}
                        </h1>
                        <div class="profile-badges" style="display:flex;gap:8px;flex-wrap:wrap;">
                            <span class="badge badge-pink" style="border-radius:20px;padding:6px 14px;font-size:11px;"><i class="ph ph-hashtag"></i> Maglia #${athlete.jersey_number || '—'}</span>
                            <span class="badge badge-white" style="border-radius:20px;padding:6px 14px;font-size:11px;background:rgba(255,255,255,0.05);"><i class="ph ph-shield"></i> ${Utils.escapeHtml(athlete.role || '—')}</span>
                            <span class="badge badge-white" style="border-radius:20px;padding:6px 14px;font-size:11px;background:rgba(255,255,255,0.05);"><i class="ph ph-users"></i> ${Utils.escapeHtml(athlete.team_name)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin: -40px 16px 0; border-radius: 24px; position:relative; z-index: 10; padding: 4px; background: rgba(20,20,20,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);">
                <div class="fusion-tabs-container" id="athlete-tab-bar" style="border:none;background:transparent;width:100%;justify-content:flex-start;padding:8px 16px;">
                    <button class="fusion-tab" data-tab="anagrafica">Anagrafica</button>
                    <button class="fusion-tab" data-tab="pagamenti">Pagamenti</button>
                    <button class="fusion-tab" data-tab="metrics" style="color:var(--color-pink)">Performance (VALD)</button>
                    <button class="fusion-tab" data-tab="documenti">Documenti</button>
                </div>
            </div>

            <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-pagamenti" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
            <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;padding:24px 16px;"></div>
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
