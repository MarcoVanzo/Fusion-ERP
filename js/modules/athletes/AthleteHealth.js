/**
 * AthleteHealth — Gestione Anamnesi e Infortuni Atleti
 */

export const AthleteHealth = {
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
            // Fetch Anamnesi and Injuries concurrently
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

    _createModal(htmlContent) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop';
        overlay.style = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;';
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style = 'background:var(--color-bg); padding:32px; border-radius:16px; border:1px solid rgba(255,255,255,0.1); width:100%; max-width:600px; max-height:90vh; overflow-y:auto; position:relative;';
        modal.innerHTML = htmlContent;
        
        overlay.appendChild(modal);
        // click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        });
        
        return overlay;
    },

    _renderUi(container, athlete, anamnesi, injuries) {
        let activeInjuries = injuries.filter(i => i.rtp_cleared !== 1);
        let pastInjuries = injuries.filter(i => i.rtp_cleared === 1);

        container.innerHTML = `
            <!-- Anamnesi Medica -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin:0;">Anamnesi</h3>
                <div style="display:flex; gap:12px;">
                    <button class="btn btn-default btn-xs ai-diagnosis-btn" style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); color:#10b981;">
                        <i class="ph ph-magic-wand"></i> AI Analisi Clinica
                    </button>
                    <button class="btn btn-default btn-xs edit-anamnesi-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">
                        <i class="ph ph-pencil-simple"></i> Modifica Anamnesi
                    </button>
                </div>
            </div>

            <div class="card glass-card" style="padding:24px; margin-bottom:32px;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">
                    <div>
                        <h4 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Generale</h4>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Gruppo Sanguigno</div>
                            <div style="font-size:14px; color:#fff;">${Utils.escapeHtml(anamnesi.blood_type || '—')}</div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Malattie Croniche</div>
                            <div style="font-size:14px; color:#fff;">${Utils.escapeHtml(anamnesi.chronic_conditions || '—')}</div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Farmaci Assunti</div>
                            <div style="font-size:14px; color:#fff;">${Utils.escapeHtml(anamnesi.regular_medications || '—')}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Interventi Chirurgici Pregressi</div>
                            <div style="font-size:14px; color:#fff;">${Utils.escapeHtml(anamnesi.past_surgeries || '—')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Infortuni Attivi -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin:0;">Infortuni Attivi</h3>
                    ${activeInjuries.length > 0 ? `<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4);">${activeInjuries.length}</span>` : ''}
                </div>
                <button class="btn btn-primary btn-sm add-injury-btn" style="background:#ef4444;">
                    <i class="ph ph-plus"></i> Nuovo Infortunio
                </button>
            </div>

            ${activeInjuries.length === 0 ? `
                <div class="card glass-card" style="padding:40px; text-align:center; border:1px dashed rgba(255,255,255,0.1); background:rgba(255,255,255,0.01); margin-bottom:32px;">
                    <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:rgba(255,255,255,0.1);">
                        <i class="ph ph-check-circle" style="font-size:32px;"></i>
                    </div>
                    <p style="color:var(--color-text-muted); font-size:14px;">Nessun infortunio attualmente in corso.</p>
                </div>
            ` : `
                <div style="display:grid; gap:16px; margin-bottom:32px;">
                    ${activeInjuries.map(i => this._renderInjuryCard(i)).join('')}
                </div>
            `}

            <!-- Storico Infortuni -->
            ${pastInjuries.length > 0 ? `
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                    <h3 style="font-family:var(--font-display); font-size:18px; font-weight:800; color:var(--color-text-muted); margin:0;">Storico Risolti</h3>
                </div>
                <div style="display:grid; gap:12px;">
                    ${pastInjuries.map(i => this._renderInjuryCard(i, true)).join('')}
                </div>
            ` : ''}
        `;

        this._addListeners(container, athlete, anamnesi, injuries);
    },

    _renderInjuryCard(injury, isPast = false) {
        const dDate = new Date(injury.injury_date).toLocaleDateString('it-IT');
        let rDate = injury.estimated_return_date ? new Date(injury.estimated_return_date).toLocaleDateString('it-IT') : '—';
        let statusBadge = '';
        if (isPast) {
            statusBadge = `<span class="badge" style="background:rgba(16, 185, 129, 0.1); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3);">RTP OK (${rDate})</span>`;
        } else {
            const exp = injury.expected_rtp_date ? new Date(injury.expected_rtp_date) : null;
            let estStr = exp ? `Previsto RTP: ${exp.toLocaleDateString('it-IT')}` : 'RTP Indefinito';
            statusBadge = `<span class="badge" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3);">${estStr}</span>`;
        }

        const visitCount = injury.visit_count || 0;
        const docCount = injury.doc_count || 0;

        return `
            <div class="card glass-card injury-card" data-id="${injury.id}" style="padding:20px; border-left:4px solid ${isPast ? '#10b981' : '#ef4444'}; cursor:pointer; transition:all 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <span style="font-weight:800; color:#fff; font-size:16px;">${Utils.escapeHtml(injury.description || 'Non specificato')}</span>
                            ${statusBadge}
                        </div>
                        <div style="font-size:13px; color:var(--color-text-muted); display:flex; gap:16px; flex-wrap:wrap;">
                            <span><i class="ph ph-calendar"></i> ${dDate}</span>
                            <span><i class="ph ph-first-aid"></i> ${Utils.escapeHtml(injury.injury_type || '—')}</span>
                            <span><i class="ph ph-activity"></i> ${Utils.escapeHtml(injury.status || '—')}</span>
                        </div>
                        ${injury.diagnosis ? `<div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:8px;"><strong>Diagnosi:</strong> ${Utils.escapeHtml(injury.diagnosis)}</div>` : ''}
                        
                        <div style="margin-top:12px; display:flex; gap:16px; align-items:center;">
                            <div style="font-size:11px; color:#10b981; background:rgba(16, 185, 129, 0.1); padding:4px 8px; border-radius:6px; font-weight:700;">
                                <i class="ph ph-stethoscope"></i> ${visitCount} VISITE / DECORSO
                            </div>
                            <div style="font-size:11px; color:#3b82f6; background:rgba(59, 130, 246, 0.1); padding:4px 8px; border-radius:6px; font-weight:700;">
                                <i class="ph ph-file-text"></i> ${docCount} DOCUMENTI / REFERTI
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-ghost btn-xs edit-injury-btn" data-id="${injury.id}" style="background:rgba(255,255,255,0.05);">
                        <i class="ph ph-pencil-simple"></i> Dettagli
                    </button>
                </div>
            </div>
        `;
    },

    _addListeners(container, athlete, anamnesi, injuries) {
        const editAnamnesiBtn = container.querySelector('.edit-anamnesi-btn');
        if (editAnamnesiBtn) {
            editAnamnesiBtn.addEventListener('click', () => {
                this._openAnamnesiModal(container, athlete, anamnesi);
            });
        }

        const aiDiagnosisBtn = container.querySelector('.ai-diagnosis-btn');
        if (aiDiagnosisBtn) {
            aiDiagnosisBtn.addEventListener('click', () => {
                this._openAiDiagnosisModal(container, athlete, anamnesi, injuries);
            });
        }

        const addInjuryBtn = container.querySelector('.add-injury-btn');
        if (addInjuryBtn) {
            addInjuryBtn.addEventListener('click', () => {
                this._openInjuryModal(container, athlete, null);
            });
        }

        const editBtns = container.querySelectorAll('.edit-injury-btn, .injury-card');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('injury-card') && e.target.closest('.edit-injury-btn')) return; // handled by btn
                const id = btn.dataset.id;
                const injury = injuries.find(i => String(i.id) === String(id));
                if (injury) {
                    this._openInjuryModal(container, athlete, injury);
                }
            });
        });
    },

    _openAiDiagnosisModal(container, athlete, anamnesi, injuries) {
        let chatHistory = [];
        
        const theModal = this._createModal(`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:8px; display:flex; align-items:center; gap:12px;">
                <i class="ph ph-magic-wand" style="color:#10b981;"></i> 
                AI Assistente Medico
            </h2>
            <p style="color:var(--color-text-muted); font-size:14px; margin-bottom:24px;">Analisi diagnostica per ${Utils.escapeHtml(athlete.full_name)}</p>
            
            <div id="ai-chat-container" style="background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); height:400px; display:flex; flex-direction:column; overflow:hidden; margin-bottom:16px;">
                <div id="ai-chat-messages" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
                    <div style="text-align:center; padding:20px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin"></i> Generazione quadro clinico in corso...</div>
                </div>
                <div style="padding:16px; background:rgba(255,255,255,0.02); border-top:1px solid rgba(255,255,255,0.05);">
                    <form id="ai-chat-form" style="display:flex; gap:12px;">
                        <input type="text" name="message" class="input" style="flex:1;" placeholder="Fai una domanda all'AI..." autocomplete="off">
                        <button type="submit" class="btn btn-primary" style="background:#10b981;"><i class="ph ph-paper-plane-right"></i> Invia</button>
                    </form>
                </div>
            </div>
            
            <div style="display:flex; justify-content:flex-end;">
                <button type="button" class="btn btn-default" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Chiudi</button>
            </div>
        `);
        
        document.body.appendChild(theModal);
        
        const messagesContainer = theModal.querySelector('#ai-chat-messages');
        const form = theModal.querySelector('#ai-chat-form');
        const input = form.querySelector('input');
        const submitBtn = form.querySelector('button');

        const appendMessage = (role, content) => {
            const isAi = role === 'AI';
            // Render markdown conceptually (we will just convert some basic markdown later if needed)
            // But simple replace of \n is robust enough. Also handle basic bold **.
            let formattedContent = Utils.escapeHtml(content)
                .replace(/\\n/g, '<br>')
                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');

            const html = \`
                <div style="display:flex; gap:12px; align-self: \${isAi ? 'flex-start' : 'flex-end'}; max-width:85%;">
                    \${isAi ? '<div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot"></i></div>' : ''}
                    <div style="background:\${isAi ? 'rgba(255,255,255,0.05)' : '#3b82f6'}; color:#fff; padding:12px 16px; border-radius:12px; \${isAi ? 'border-top-left-radius:2px;' : 'border-top-right-radius:2px;'} font-size:14px; line-height:1.5;">
                        \${formattedContent}
                    </div>
                </div>
            \`;
            messagesContainer.insertAdjacentHTML('beforeend', html);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const askAI = async (message = '') => {
            try {
                input.disabled = true;
                submitBtn.disabled = true;
                
                if (message) {
                    appendMessage('USER', message);
                } else {
                    // Initial load clear
                    messagesContainer.innerHTML = '';
                }

                // Temporary loading indicator
                const loadingId = 'loading-' + Date.now();
                messagesContainer.insertAdjacentHTML('beforeend', \`
                    <div id="\${loadingId}" style="display:flex; gap:12px; align-self:flex-start;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot animate-spin"></i></div>
                        <div style="background:rgba(255,255,255,0.05); color:var(--color-text-muted); padding:12px 16px; border-radius:12px; border-top-left-radius:2px; font-size:14px;">Elaborazione...</div>
                    </div>
                \`);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                const res = await fetch('api/?module=health&action=askAI', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        athlete_id: athlete.id,
                        message: message,
                        history: chatHistory
                    })
                }).then(r => r.json());

                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                if (res.success && res.data && res.data.reply) {
                    if (message) chatHistory.push({role: 'user', content: message});
                    chatHistory.push({role: 'ai', content: res.data.reply});
                    appendMessage('AI', res.data.reply);
                } else {
                    throw new Error(res.error || "Errore AI");
                }
            } catch (err) {
                // Remove loading fallback
                const loadingEl = messagesContainer.lastElementChild;
                if(loadingEl && loadingEl.querySelector('.animate-spin')) {
                     loadingEl.remove();
                }
                appendMessage('AI', 'Errore: ' + err.message);
            } finally {
                input.disabled = false;
                submitBtn.disabled = false;
                input.focus();
            }
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if(!msg) return;
            input.value = '';
            askAI(msg);
        });

        // Trigger initial diagnosis
        askAI();
    },

    _openAnamnesiModal(container, athlete, anamnesi) {
        const theModal = this._createModal(`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:24px;">Anamnesi: ${Utils.escapeHtml(athlete.full_name)}</h2>
            <form id="anamnesi-form">
                <input type="hidden" name="athlete_id" value="${athlete.id}">
                
                <h3 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:16px;">Sezione Generale</h3>
                
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Gruppo Sanguigno</label>
                    <select name="blood_type" class="input" style="width:100%;">
                        <option value="Unknown" ${anamnesi.blood_type === 'Unknown' ? 'selected' : ''}>Non specificato</option>
                        <option value="A+" ${anamnesi.blood_type === 'A+' ? 'selected' : ''}>A+</option>
                        <option value="A-" ${anamnesi.blood_type === 'A-' ? 'selected' : ''}>A-</option>
                        <option value="B+" ${anamnesi.blood_type === 'B+' ? 'selected' : ''}>B+</option>
                        <option value="B-" ${anamnesi.blood_type === 'B-' ? 'selected' : ''}>B-</option>
                        <option value="AB+" ${anamnesi.blood_type === 'AB+' ? 'selected' : ''}>AB+</option>
                        <option value="AB-" ${anamnesi.blood_type === 'AB-' ? 'selected' : ''}>AB-</option>
                        <option value="O+" ${anamnesi.blood_type === 'O+' ? 'selected' : ''}>0+</option>
                        <option value="O-" ${anamnesi.blood_type === 'O-' ? 'selected' : ''}>0-</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Malattie Croniche (Es. Asma, Diabete)</label>
                    <textarea name="chronic_conditions" class="input" style="width:100%; height:60px;">${Utils.escapeHtml(anamnesi.chronic_conditions || '')}</textarea>
                </div>
                
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Farmaci Assunti Regolarmente</label>
                    <textarea name="regular_medications" class="input" style="width:100%; height:60px;">${Utils.escapeHtml(anamnesi.regular_medications || '')}</textarea>
                </div>
                
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Interventi Chirurgici Pregressi</label>
                    <textarea name="past_surgeries" class="input" style="width:100%; height:60px;">${Utils.escapeHtml(anamnesi.past_surgeries || '')}</textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
                    <button type="button" class="btn btn-default" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Annulla</button>
                    <button type="submit" class="btn btn-primary" style="background:#ef4444;"><i class="ph ph-floppy-disk"></i> Salva</button>
                </div>
            </form>
        `);
        
        document.body.appendChild(theModal);

        document.getElementById('anamnesi-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                UI.loading(true);
                const res = await fetch('api/?module=health&action=updateAnamnesi', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData
                }).then(r => r.json());
                
                if(res.success) {
                    UI.toast("Anamnesi aggiornata");
                    document.body.removeChild(theModal);
                    this._loadData(container, athlete);
                } else {
                    throw new Error(res.error || "Errore sconosciuto");
                }
            } catch(err) {
                UI.toast(err.message, "error");
            } finally {
                UI.loading(false);
            }
        });
    },

    _openInjuryModal(container, athlete, injury = null) {
        const isEdit = !!injury;
        const dDate = injury?.injury_date ? injury.injury_date.substring(0, 10) : new Date().toISOString().substring(0, 10);
        const expDate = injury?.expected_rtp_date ? injury.expected_rtp_date.substring(0, 10) : '';
        const rtpDate = injury?.estimated_return_date ? injury.estimated_return_date.substring(0, 10) : '';

        const tabsHtml = `
            <div class="injury-tabs" style="display:flex; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:24px; gap:16px;">
                <button type="button" class="tab-btn active" data-tab="tab-details" style="padding:12px 16px; background:transparent; border:none; color:#fff; font-weight:800; border-bottom:2px solid #ef4444; cursor:pointer; font-size:14px;">Dettagli Caso</button>
                <button type="button" class="tab-btn" data-tab="tab-checkups" ${!isEdit ? 'disabled title="Salva infortunio per gestire il decorso"' : ''} style="padding:12px 16px; background:transparent; border:none; color:var(--color-text-muted); cursor:pointer; font-size:14px; transition:all 0.2s; opacity:${!isEdit ? '0.3' : '1'};">Decorso / Visite</button>
                <button type="button" class="tab-btn" data-tab="tab-docs" ${!isEdit ? 'disabled title="Salva infortunio per allegare referti"' : ''} style="padding:12px 16px; background:transparent; border:none; color:var(--color-text-muted); cursor:pointer; font-size:14px; transition:all 0.2s; opacity:${!isEdit ? '0.3' : '1'};">Doc / Referti</button>
            </div>
        `;

        const detailsHtml = `
            <form id="injury-form">
                ${isEdit ? `<input type="hidden" name="injury_id" value="${injury.id}">` : ''}
                <input type="hidden" name="athlete_id" value="${athlete.id}">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data Infortunio <span style="color:#ef4444">*</span></label>
                        <input type="date" name="injury_date" class="input" style="width:100%;" required value="${dDate}">
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Tipo Infortunio</label>
                        <select name="injury_type" class="input" style="width:100%;">
                            <option value="">Seleziona...</option>
                            <option value="Muscolare" ${injury?.injury_type === 'Muscolare' ? 'selected' : ''}>Muscolare</option>
                            <option value="Articolare/Legamentoso" ${injury?.injury_type === 'Articolare/Legamentoso' ? 'selected' : ''}>Articolare/Legamentoso</option>
                            <option value="Osseo (Frattura/Infrazione)" ${injury?.injury_type === 'Osseo (Frattura/Infrazione)' ? 'selected' : ''}>Osseo (Frattura/Infrazione)</option>
                            <option value="Contusione" ${injury?.injury_type === 'Contusione' ? 'selected' : ''}>Contusione</option>
                            <option value="Altro" ${injury?.injury_type === 'Altro' ? 'selected' : ''}>Altro</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Descrizione / Sede anatomica <span style="color:#ef4444">*</span></label>
                    <input type="text" name="description" class="input" style="width:100%;" required placeholder="Es. Lesione II grado bicipite femorale dx" value="${Utils.escapeHtml(injury?.description || '')}">
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Meccanismo (Contatto/No Contatto)</label>
                        <select name="mechanism" class="input" style="width:100%;">
                            <option value="">-</option>
                            <option value="Da Contatto" ${injury?.mechanism === 'Da Contatto' ? 'selected' : ''}>Da Contatto</option>
                            <option value="Non da Contatto" ${injury?.mechanism === 'Non da Contatto' ? 'selected' : ''}>Non da Contatto</option>
                            <option value="Overuse/Sovraccarico" ${injury?.mechanism === 'Overuse/Sovraccarico' ? 'selected' : ''}>Overuse/Sovraccarico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Parte del Corpo</label>
                        <input type="text" name="body_part" class="input" style="width:100%;" placeholder="Es. Ginocchio destro" value="${Utils.escapeHtml(injury?.body_part || '')}">
                    </div>
                </div>

                <h3 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:24px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px;">Diagnosi Strumentali</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <textarea name="diagnosis" class="input" style="width:100%; height:60px;" placeholder="Ecografia / Risonanza (Referto sintesi)">${Utils.escapeHtml(injury?.diagnosis || '')}</textarea>
                </div>

                <h3 style="font-size:12px; font-weight:900; color:#10b981; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:24px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px;">Terapia e Recupero</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Trattamento in corso</label>
                    <textarea name="treatment" class="input" style="width:100%; height:60px;" placeholder="Es. Fisioterapia TECAR, Riposo">${Utils.escapeHtml(injury?.treatment || '')}</textarea>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px; padding:16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">RTP Previsto (Data)</label>
                        <input type="date" name="expected_rtp_date" class="input" style="width:100%;" value="${expDate}">
                    </div>
                    <div class="form-group">
                        <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#fff; cursor:pointer; margin-top:24px;">
                            <input type="checkbox" name="rtp_cleared" value="1" ${injury?.rtp_cleared === 1 ? 'checked' : ''} id="rtp-clear-cb">
                            <strong>Cleared for RTP (Infortunio Risolto)</strong>
                        </label>
                    </div>
                    <div class="form-group rtp-actual-date" style="${injury?.rtp_cleared === 1 ? 'display:block;' : 'display:none;'}">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data Effettiva RTP</label>
                        <input type="date" name="estimated_return_date" class="input" style="width:100%;" value="${rtpDate}">
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; gap:12px;">
                    <button type="button" class="btn btn-default" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Chiudi</button>
                    <button type="submit" class="btn btn-primary" style="background:${isEdit ? '#3b82f6' : '#ef4444'};">
                        ${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Inserisci Infortunio'}
                    </button>
                </div>
            </form>
        `;

        const checkupsHtml = isEdit ? `
            <div id="checkups-container">
                <div style="text-align:center; padding:20px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin"></i> Caricamento storico visite...</div>
            </div>
            
            <form id="checkup-form" style="margin-top:24px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.1);">
                <h4 style="font-size:14px; font-weight:800; color:#fff; margin-bottom:16px;">Aggiungi Visita</h4>
                <input type="hidden" name="injury_id" value="${injury.id}">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data Visita <span style="color:#ef4444">*</span></label>
                        <input type="date" name="visit_date" class="input" style="width:100%;" required value="${new Date().toISOString().substring(0, 10)}">
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Specialista</label>
                        <input type="text" name="practitioner" class="input" style="width:100%;" placeholder="Es. Dott. Rossi">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:12px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Esito / Note</label>
                    <textarea name="outcome" class="input" style="width:100%; height:60px;" placeholder="Risultati della visita"></textarea>
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button type="submit" class="btn btn-primary" style="background:#10b981;"><i class="ph ph-plus"></i> Aggiungi Visita</button>
                </div>
            </form>
        ` : '';

        const docsHtml = isEdit ? `
            <div id="docs-container">
                <div style="text-align:center; padding:20px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin"></i> Caricamento documenti...</div>
            </div>

            <form id="doc-form" style="margin-top:24px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.1);">
                <h4 style="font-size:14px; font-weight:800; color:#fff; margin-bottom:16px;">Carica Referto/Immagine</h4>
                <input type="hidden" name="injury_id" value="${injury.id}">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Agomento / Titolo <span style="color:#ef4444">*</span></label>
                        <input type="text" name="document_title" class="input" style="width:100%;" required placeholder="Es. Referto Risonanza">
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Tipo</label>
                        <select name="document_type" class="input" style="width:100%;">
                            <option value="Referto">Referto</option>
                            <option value="Immagini (Rx, Eco, MRI)">Immagini (Rx, Eco, MRI)</option>
                            <option value="Certificato">Certificato di Rientro</option>
                            <option value="Altro">Altro</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">File <span style="color:#ef4444">*</span></label>
                    <input type="file" name="document_file" class="input" style="width:100%; padding:10px; border: 1px dashed rgba(255,255,255,0.2); background:rgba(255,255,255,0.02);" required accept=".pdf,.jpg,.jpeg,.png">
                </div>
                <div style="display:flex; justify-content:flex-end;">
                    <button type="submit" class="btn btn-primary" style="background:#3b82f6;"><i class="ph ph-upload-simple"></i> Carica Documento</button>
                </div>
            </form>
        ` : '';

        const theModal = this._createModal(`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:24px;">${isEdit ? 'Gestione Infortunio' : 'Nuovo Infortunio'}</h2>
            ${tabsHtml}
            
            <div id="tab-details" class="tab-content" style="display:block;">
                ${detailsHtml}
            </div>
            
            <div id="tab-checkups" class="tab-content" style="display:none;">
                ${checkupsHtml}
            </div>
            
            <div id="tab-docs" class="tab-content" style="display:none;">
                ${docsHtml}
            </div>
        `);
        
        document.body.appendChild(theModal);

        // Tab Switching Logic
        const tabBtns = theModal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const b = e.currentTarget;
                if (b.disabled) return;

                const target = b.getAttribute('data-tab');
                
                // Reset states
                tabBtns.forEach(other => {
                    other.classList.remove('active');
                    other.style.fontWeight = 'normal';
                    other.style.borderBottom = 'none';
                    other.style.color = 'var(--color-text-muted)';
                });
                theModal.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                
                // Set active
                b.classList.add('active');
                b.style.fontWeight = '800';
                b.style.borderBottom = '2px solid #ef4444';
                b.style.color = '#fff';
                theModal.querySelector('#' + target).style.display = 'block';
            });
        });

        // Initialize Checkups & Docs Data
        if(isEdit) {
            this._loadCheckups(injury.id, theModal);
            this._loadDocs(injury.id, theModal);
        }

        // Toggle visibility of actual RTP date
        const rtpCb = document.getElementById('rtp-clear-cb');
        if(rtpCb) {
            rtpCb.addEventListener('change', (e) => {
                const el = theModal.querySelector('.rtp-actual-date');
                el.style.display = e.target.checked ? 'block' : 'none';
                if(e.target.checked && !el.querySelector('input').value) {
                    el.querySelector('input').value = new Date().toISOString().substring(0, 10);
                }
            });
        }

        // Details Form Submission
        const detailsForm = document.getElementById('injury-form');
        if (detailsForm) {
            detailsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                // Default checkbox false behavior
                if(!formData.has('rtp_cleared')) {
                    formData.append('rtp_cleared', 0);
                }
                
                try {
                    UI.loading(true);
                    const action = isEdit ? 'updateInjury' : 'addInjury';
                    const res = await fetch(`api/?module=health&action=${action}`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    }).then(r => r.json());
                    
                    if(res.success) {
                        UI.toast(`Infortunio ${isEdit ? 'aggiornato' : 'inserito'}`);
                        
                        if (!isEdit && res.id) {
                            // Transition from New to Edit mode without closing
                            document.body.removeChild(theModal);
                            await this._loadData(container, athlete);
                            // Auto-open in edit mode
                            const injuries = await fetch(`api/?module=health&action=getInjuries&id=${athlete.id}`).then(r => r.json());
                            const newInj = injuries.data?.find(i => i.id === res.id);
                            if (newInj) this._openInjuryModal(container, athlete, newInj);
                        } else {
                            document.body.removeChild(theModal);
                            await this._loadData(container, athlete);
                        }
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch(err) {
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }

        // Checkup Form Submission
        const checkupForm = document.getElementById('checkup-form');
        if (checkupForm) {
            checkupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    UI.loading(true);
                    const res = await fetch(`api/?module=health&action=addFollowup`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    }).then(r => r.json());
                    
                    if (res.success) {
                        UI.toast('Visita aggiunta correttamente');
                        checkupForm.reset();
                        // reload checkups
                        this._loadCheckups(injury.id, theModal);
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch(err) {
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }

        // Doc Form Submission
        const docForm = document.getElementById('doc-form');
        if (docForm) {
            docForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    UI.loading(true);
                    const res = await fetch(`api/?module=health&action=uploadDocument`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    }).then(r => r.json());
                    
                    if (res.success) {
                        UI.toast('Documento caricato correttamente');
                        docForm.reset();
                        // reload docs
                        this._loadDocs(injury.id, theModal);
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch(err) {
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }
    },

    async _loadCheckups(injuryId, theModal) {
        const container = theModal.querySelector('#checkups-container');
        try {
            const res = await fetch(`api/?module=health&action=getFollowups&injury_id=${injuryId}`).then(r => r.json());
            if (res.success) {
                const list = res.data || [];
                if (list.length === 0) {
                    container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--color-text-muted); background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">Nessuna visita/check-up registrata.</div>';
                } else {
                    container.innerHTML = `
                        <div class="timeline-container" style="position:relative; padding-left:32px;">
                            <div style="position:absolute; left:7px; top:8px; bottom:8px; width:2px; background:rgba(255,255,255,0.1);"></div>
                            <div style="display:grid; gap:24px;">
                                ${list.map(c => `
                                    <div class="timeline-item" style="position:relative;">
                                        <div style="position:absolute; left:-30px; top:4px; width:12px; height:12px; border-radius:50%; background:#10b981; border:3px solid var(--color-bg-panel); z-index:2;"></div>
                                        <div class="card glass-card" style="padding:16px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02);">
                                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                                <div>
                                                    <div style="font-weight:900; color:#fff; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">${new Date(c.visit_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                    <div style="font-size:12px; color:var(--color-text-muted); margin-top:2px;">
                                                        <i class="ph ph-stethoscope"></i> ${Utils.escapeHtml(c.practitioner || 'Specialista non specificato')}
                                                    </div>
                                                </div>
                                                <div style="font-size:10px; background:rgba(16, 185, 129, 0.1); color:#10b981; padding:2px 8px; border-radius:100px; font-weight:700;">VISITA</div>
                                            </div>
                                            <div style="font-size:14px; color:rgba(255,255,255,0.9); line-height:1.5; background:rgba(0,0,0,0.2); padding:12px; border-radius:8px;">
                                                ${Utils.escapeHtml(c.outcome || c.notes || '(Nessuna nota registrata)')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            } else {
                throw new Error(res.error);
            }
        } catch (e) {
            container.innerHTML = `<div style="color:#ef4444; padding:16px;">Errore caricamento visite: ${Utils.escapeHtml(e.message)}</div>`;
        }
    },

    async _loadDocs(injuryId, theModal) {
        const container = theModal.querySelector('#docs-container');
        try {
            const res = await fetch(`api/?module=health&action=getDocuments&injury_id=${injuryId}`).then(r => r.json());
            if (res.success) {
                const list = res.data || [];
                if (list.length === 0) {
                    container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--color-text-muted); background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">Nessun documento caricato.</div>';
                } else {
                    container.innerHTML = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:16px;">' + list.map(d => {
                        const isPdf = d.file_path.toLowerCase().endsWith('.pdf');
                        const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.file_path);
                        const iconClass = isPdf ? 'ph ph-file-pdf' : (isImg ? 'ph ph-file-image' : 'ph ph-file-text');
                        const iconColor = isPdf ? '#ef4444' : (isImg ? '#10b981' : '#3b82f6');
                        
                        return `
                        <div class="card glass-card" style="padding:16px; display:flex; flex-direction:column; gap:12px; border:1px solid rgba(255,255,255,0.05); position:relative; overflow:hidden;">
                            <div style="position:absolute; top:0; right:0; padding:12px; opacity:0.05; font-size:40px; pointer-events:none;">
                                <i class="${iconClass}"></i>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:${iconColor};">
                                    <i class="${iconClass}" style="font-size:18px;"></i>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <div style="font-weight:800; color:#fff; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(d.document_title)}">
                                        ${Utils.escapeHtml(d.document_title)}
                                    </div>
                                    <div style="font-size:10px; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.5px;">
                                        ${Utils.escapeHtml(d.document_type || 'Referto')}
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                                <div style="font-size:11px; opacity:0.5;">
                                    ${new Date(d.uploaded_at || d.created_at).toLocaleDateString('it-IT')}
                                </div>
                                <a href="${d.file_path}" target="_blank" class="btn btn-ghost btn-xs" style="color:#fff; background:rgba(255,255,255,0.1); padding:4px 8px; font-size:10px; font-weight:700;">
                                    <i class="ph ph-eye"></i> APRI
                                </a>
                            </div>
                        </div>
                    `}).join('') + '</div>';
                }
            } else {
                throw new Error(res.error);
            }
        } catch (e) {
            container.innerHTML = `<div style="color:#ef4444; padding:16px;">Errore caricamento documenti: ${Utils.escapeHtml(e.message)}</div>`;
        }
    }
};
