import { AiDiagnosisModal } from './modals/AiDiagnosisModal.js';
import { AnamnesiModal } from './modals/AnamnesiModal.js';
import { InjuryModal } from './modals/InjuryModal.js';

export const AthleteHealth = {
    _uiAc: null,
    
    async render(container, athlete) {
        container.innerHTML = `
            <div class="health-dashboard">
                <div class="section-loader" style="padding:40px; text-align:center;">
                    <i class="ph ph-circle-notch animate-spin" style="font-size:32px; color:#ef4444; opacity:0.5;"></i>
                    <p style="margin-top:16px; font-size:13px; opacity:0.4; letter-spacing:1px;">CARICAMENTO DATI MEDICI...</p>
                </div>
            </div>
        `;

        await this._loadData(container, athlete);
    },

    async _loadData(container, athlete) {
        try {
            const [anamnesiRes, injuriesRes] = await Promise.all([
                fetch(`api/?module=health&action=getAnamnesi&athlete_id=${athlete.id}`).then(r => r.json()),
                fetch(`api/?module=health&action=getInjuries&athlete_id=${athlete.id}`).then(r => r.json())
            ]);

            const anamnesi = anamnesiRes.success ? (anamnesiRes.data || {}) : {};
            const injuries = injuriesRes.success ? (injuriesRes.data || []) : [];

            this._renderUi(container, athlete, anamnesi, injuries);
        } catch (e) {
            console.error("Errore _loadData:", e);
            container.innerHTML = `<div class="error-box">Errore caricamento dati medici: ${Utils.escapeHtml(e.message)}</div>`;
        }
    },

    _renderUi(container, athlete, anamnesi, injuries) {
        if (this._uiAc) { this._uiAc.abort(); }
        this._uiAc = new AbortController();

        let activeInjuries = injuries.filter(i => i.rtp_cleared !== 1);
        let pastInjuries = injuries.filter(i => i.rtp_cleared === 1);

        const totalInjuries = injuries.length;
        const bloodType = anamnesi.blood_type || '—';
        const hasMedicalData = !!(anamnesi.blood_type || anamnesi.chronic_conditions || anamnesi.regular_medications || anamnesi.past_surgeries);

        container.innerHTML = `
            <div class="health-dashboard">
                <!-- KPI Summary Row -->
                <div class="health-kpi-row">
                    <div class="health-kpi-card" style="--kpi-color: rgba(239, 68, 68, 0.3);">
                        <div class="health-kpi-icon health-kpi-icon--danger">
                            <i class="ph ph-warning-diamond"></i>
                        </div>
                        <div class="health-kpi-body">
                            <div class="health-kpi-value">${activeInjuries.length}</div>
                            <div class="health-kpi-label">Infortuni Attivi</div>
                        </div>
                    </div>
                    <div class="health-kpi-card" style="--kpi-color: rgba(16, 185, 129, 0.3);">
                        <div class="health-kpi-icon health-kpi-icon--success">
                            <i class="ph ph-check-circle"></i>
                        </div>
                        <div class="health-kpi-body">
                            <div class="health-kpi-value">${pastInjuries.length}</div>
                            <div class="health-kpi-label">Risolti</div>
                        </div>
                    </div>
                    <div class="health-kpi-card" style="--kpi-color: rgba(59, 130, 246, 0.3);">
                        <div class="health-kpi-icon health-kpi-icon--info">
                            <i class="ph ph-drop"></i>
                        </div>
                        <div class="health-kpi-body">
                            <div class="health-kpi-value">${Utils.escapeHtml(bloodType)}</div>
                            <div class="health-kpi-label">Gruppo Sanguigno</div>
                        </div>
                    </div>
                    <div class="health-kpi-card" style="--kpi-color: rgba(255, 0, 122, 0.3);">
                        <div class="health-kpi-icon health-kpi-icon--pink">
                            <i class="ph ph-clipboard-text"></i>
                        </div>
                        <div class="health-kpi-body">
                            <div class="health-kpi-value">${totalInjuries}</div>
                            <div class="health-kpi-label">Storico Totale</div>
                        </div>
                    </div>
                </div>

                <!-- Anamnesi Medica -->
                <div class="health-section-header">
                    <div class="health-section-title">
                        <h3>Anamnesi Medica</h3>
                        ${hasMedicalData
                            ? '<span class="health-count-badge health-count-badge--muted"><i class="ph ph-check"></i></span>'
                            : '<span class="health-count-badge health-count-badge--danger">!</span>'}
                    </div>
                    <button class="health-edit-anamnesi-btn edit-anamnesi-btn">
                        <i class="ph ph-pencil-simple"></i> Modifica
                    </button>
                </div>

                <div class="health-anamnesi-card">
                    <div class="health-anamnesi-grid">
                        <div class="health-anamnesi-item">
                            <div class="health-anamnesi-item__label"><i class="ph ph-drop"></i> Gruppo Sanguigno</div>
                            <div class="health-anamnesi-item__value ${!anamnesi.blood_type ? 'health-anamnesi-item__value--empty' : ''}">${Utils.escapeHtml(anamnesi.blood_type || 'Non specificato')}</div>
                        </div>
                        <div class="health-anamnesi-item">
                            <div class="health-anamnesi-item__label"><i class="ph ph-heartbeat"></i> Malattie Croniche</div>
                            <div class="health-anamnesi-item__value ${!anamnesi.chronic_conditions ? 'health-anamnesi-item__value--empty' : ''}">${Utils.escapeHtml(anamnesi.chronic_conditions || 'Nessuna segnalata')}</div>
                        </div>
                        <div class="health-anamnesi-item">
                            <div class="health-anamnesi-item__label"><i class="ph ph-pill"></i> Farmaci Assunti</div>
                            <div class="health-anamnesi-item__value ${!anamnesi.regular_medications ? 'health-anamnesi-item__value--empty' : ''}">${Utils.escapeHtml(anamnesi.regular_medications || 'Nessuno')}</div>
                        </div>
                        <div class="health-anamnesi-item">
                            <div class="health-anamnesi-item__label"><i class="ph ph-knife"></i> Interventi Chirurgici</div>
                            <div class="health-anamnesi-item__value ${!anamnesi.past_surgeries ? 'health-anamnesi-item__value--empty' : ''}">${Utils.escapeHtml(anamnesi.past_surgeries || 'Nessuno pregresso')}</div>
                        </div>
                    </div>
                </div>

                <!-- Infortuni Attivi -->
                <div class="health-section-header">
                    <div class="health-section-title">
                        <h3>Infortuni Attivi</h3>
                        ${activeInjuries.length > 0
                            ? `<span class="health-count-badge health-count-badge--danger">${activeInjuries.length}</span>`
                            : ''}
                    </div>
                    <button class="health-add-injury-btn add-injury-btn">
                        <i class="ph ph-plus"></i> Nuovo Infortunio
                    </button>
                </div>

                ${activeInjuries.length === 0 ? `
                    <div class="health-empty-state">
                        <div class="health-empty-state__icon">
                            <i class="ph ph-shield-check"></i>
                        </div>
                        <h4 class="health-empty-state__title">Nessun Infortunio Attivo</h4>
                        <p class="health-empty-state__subtitle">Ottimo! L'atleta è al completo e disponibile per allenamenti e gare.</p>
                    </div>
                ` : `
                    <div class="health-injuries-grid">
                        ${activeInjuries.map(i => this._renderInjuryCard(i)).join('')}
                    </div>
                `}

                <!-- Storico Risolti -->
                ${pastInjuries.length > 0 ? `
                    <div class="health-storico-header health-storico-header--open" id="storico-toggle">
                        <i class="ph ph-clock-counter-clockwise" style="font-size:20px; color:#10b981; opacity:0.6;"></i>
                        <h3>Storico Risolti <span style="font-size:13px; font-weight:400; opacity:0.5;">(${pastInjuries.length})</span></h3>
                        <i class="ph ph-caret-down health-storico-header__icon"></i>
                    </div>
                    <div class="health-storico-body health-storico-body--expanded" id="storico-body">
                        <div class="health-injuries-grid">
                            ${pastInjuries.map(i => this._renderInjuryCard(i, true)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        const storicoToggle = container.querySelector('#storico-toggle');
        if (storicoToggle) {
            storicoToggle.addEventListener('click', () => {
                const body = container.querySelector('#storico-body');
                const isOpen = storicoToggle.classList.contains('health-storico-header--open');
                if (isOpen) {
                    storicoToggle.classList.remove('health-storico-header--open');
                    body.classList.remove('health-storico-body--expanded');
                    body.classList.add('health-storico-body--collapsed');
                } else {
                    storicoToggle.classList.add('health-storico-header--open');
                    body.classList.remove('health-storico-body--collapsed');
                    body.classList.add('health-storico-body--expanded');
                }
            }, { signal: this._uiAc ? this._uiAc.signal : undefined });
        }

        this._addListeners(container, athlete, anamnesi, injuries);
    },

    _renderInjuryCard(injury, isPast = false) {
        const dDate = injury.injury_date ? new Date(injury.injury_date).toLocaleDateString('it-IT') : '—';
        let rDate = injury.estimated_return_date ? new Date(injury.estimated_return_date).toLocaleDateString('it-IT') : '—';
        let statusBadge;
        if (isPast) {
            statusBadge = `<span class="health-injury-card__badge health-injury-card__badge--success"><i class="ph ph-check-circle"></i> RTP OK (${rDate})</span>`;
        } else {
            const exp = injury.expected_rtp_date ? new Date(injury.expected_rtp_date) : null;
            let estStr = exp ? `RTP: ${exp.toLocaleDateString('it-IT')}` : 'RTP Indefinito';
            statusBadge = `<span class="health-injury-card__badge health-injury-card__badge--danger"><i class="ph ph-clock"></i> ${estStr}</span>`;
        }

        const visitCount = injury.visit_count || 0;
        const docCount = injury.doc_count || 0;

        let progressHtml = '';
        if (!isPast && injury.injury_date) {
            const start = new Date(injury.injury_date).getTime();
            const now = Date.now();
            const exp = injury.expected_rtp_date ? new Date(injury.expected_rtp_date).getTime() : null;
            if (exp && exp > start) {
                const total = exp - start;
                const elapsed = now - start;
                const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                const daysLeft = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
                progressHtml = `
                    <div class="health-injury-card__progress">
                        <div class="health-injury-card__progress-bar-bg">
                            <div class="health-injury-card__progress-bar-fill" style="width:${pct}%;"></div>
                        </div>
                        <div class="health-injury-card__progress-labels">
                            <span>Recovery ${pct}%</span>
                            <span>${daysLeft > 0 ? daysLeft + ' gg al rientro' : 'Rientro previsto oggi'}</span>
                        </div>
                    </div>
                `;
            }
        }

        return `
            <div class="health-injury-card ${isPast ? 'health-injury-card--resolved' : ''} injury-card" data-id="${injury.id}">
                <div class="health-injury-card__header">
                    <div class="health-injury-card__main">
                        <div class="health-injury-card__title-row">
                            <span class="health-injury-card__title">${Utils.escapeHtml(injury.description || 'Non specificato')}</span>
                            ${statusBadge}
                        </div>
                        <div class="health-injury-card__meta">
                            <span><i class="ph ph-calendar"></i> ${dDate}</span>
                            <span><i class="ph ph-first-aid"></i> ${Utils.escapeHtml(injury.injury_type || '—')}</span>
                            <span><i class="ph ph-activity"></i> ${Utils.escapeHtml(injury.status || '—')}</span>
                            ${injury.body_part ? `<span><i class="ph ph-person-arms-spread"></i> ${Utils.escapeHtml(injury.body_part)}</span>` : ''}
                        </div>
                        ${injury.diagnosis ? `<div class="health-injury-card__diagnosis"><strong>Diagnosi:</strong> ${Utils.escapeHtml(injury.diagnosis)}</div>` : ''}
                        ${progressHtml}
                        <div class="health-injury-card__counters">
                            <span class="health-injury-counter health-injury-counter--visits">
                                <i class="ph ph-stethoscope"></i> ${visitCount} Visite
                            </span>
                            <span class="health-injury-counter health-injury-counter--docs">
                                <i class="ph ph-file-text"></i> ${docCount} Referti
                            </span>
                        </div>
                    </div>
                    <div class="health-injury-card__actions">
                        <button class="health-injury-action-btn health-injury-action-btn--ai ai-diagnosis-btn" data-id="${injury.id}">
                            <i class="ph ph-magic-wand"></i> AI Analisi
                        </button>
                        <button class="health-injury-action-btn health-injury-action-btn--detail edit-injury-btn" data-id="${injury.id}">
                            <i class="ph ph-pencil-simple"></i> Dettagli
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    _addListeners(container, athlete, anamnesi, injuries) {
        const editAnamnesiBtn = container.querySelector('.edit-anamnesi-btn');
        if (editAnamnesiBtn) {
            editAnamnesiBtn.addEventListener('click', () => {
                AnamnesiModal.open(container, athlete, anamnesi);
            }, { signal: this._uiAc ? this._uiAc.signal : undefined });
        }

        const aiDiagnosisBtns = container.querySelectorAll('.ai-diagnosis-btn');
        aiDiagnosisBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const injuryId = btn.getAttribute('data-id');
                AiDiagnosisModal.open(container, athlete, anamnesi, injuries, injuryId);
            }, { signal: this._uiAc ? this._uiAc.signal : undefined });
        });

        const addInjuryBtn = container.querySelector('.add-injury-btn');
        if (addInjuryBtn) {
            addInjuryBtn.addEventListener('click', () => {
                InjuryModal.open(container, athlete, null);
            }, { signal: this._uiAc ? this._uiAc.signal : undefined });
        }

        const editBtns = container.querySelectorAll('.edit-injury-btn, .injury-card');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('injury-card') && (e.target.closest('.edit-injury-btn') || e.target.closest('.ai-diagnosis-btn'))) return;
                const id = btn.dataset.id;
                const injury = injuries.find(i => String(i.id) === String(id));
                if (injury) {
                    InjuryModal.open(container, athlete, injury);
                }
            }, { signal: this._uiAc ? this._uiAc.signal : undefined });
        });
    }
};
