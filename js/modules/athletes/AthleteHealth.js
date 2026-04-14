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
                <button class="btn btn-default btn-xs edit-anamnesi-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">
                    <i class="ph ph-pencil-simple"></i> Modifica Anamnesi
                </button>
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
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button class="btn btn-default btn-xs ai-diagnosis-btn" data-id="${injury.id}" style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); color:#10b981; width:100%; justify-content:center;">
                            <i class="ph ph-magic-wand"></i> AI Analisi
                        </button>
                        <button class="btn btn-ghost btn-xs edit-injury-btn" data-id="${injury.id}" style="background:rgba(255,255,255,0.05); width:100%; justify-content:center;">
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
                this._openAnamnesiModal(container, athlete, anamnesi);
            });
        }

        const aiDiagnosisBtns = container.querySelectorAll('.ai-diagnosis-btn');
        aiDiagnosisBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const injuryId = btn.getAttribute('data-id');
                this._openAiDiagnosisModal(container, athlete, anamnesi, injuries, injuryId);
            });
        });

        const addInjuryBtn = container.querySelector('.add-injury-btn');
        if (addInjuryBtn) {
            addInjuryBtn.addEventListener('click', () => {
                this._openInjuryModal(container, athlete, null);
            });
        }

        const editBtns = container.querySelectorAll('.edit-injury-btn, .injury-card');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('injury-card') && (e.target.closest('.edit-injury-btn') || e.target.closest('.ai-diagnosis-btn'))) return; // handled by btn
                const id = btn.dataset.id;
                const injury = injuries.find(i => String(i.id) === String(id));
                if (injury) {
                    this._openInjuryModal(container, athlete, injury);
                }
            });
        });
    },

    _openAiDiagnosisModal(container, athlete, anamnesi, injuries, focusedInjuryId = null) {
        let chatHistory = [];
        
        const theModal = this._createModal(`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:8px; display:flex; align-items:center; gap:12px;">
                <i class="ph ph-magic-wand" style="color:#10b981;"></i> 
                AI Assistente Medico
            </h2>
            <p style="color:var(--color-text-muted); font-size:14px; margin-bottom:24px;">Analisi diagnostica per ${Utils.escapeHtml(athlete.full_name)}</p>
            
            <div id="ai-chat-container" style="background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); height:65vh; max-height:800px; display:flex; flex-direction:column; overflow:hidden; margin-bottom:16px;">
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
        
        // Espandi la modale il più largo possibile (senza esagerare)
        const modalContent = theModal.querySelector('.modal-content');
        if (modalContent) modalContent.style.maxWidth = '1200px';
        if (modalContent) modalContent.style.width = '95%';
        
        const messagesContainer = theModal.querySelector('#ai-chat-messages');
        const form = theModal.querySelector('#ai-chat-form');
        const input = form.querySelector('input');
        const submitBtn = form.querySelector('button');

        const formatMarkdown = (text) => {
            if (!text) return '';
            let html = String(text);
            
            // Decodifica le entità HTML (es. &#x27; -> ') e sicurezza di base
            const temp = document.createElement('textarea');
            temp.innerHTML = html;
            html = temp.value; // Questo decodifica le entità
            
            // Sicurezza: Re-escape HTML tag
            html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Intestazioni
            html = html.replace(/^### (.*$)/gim, '<h4 style="font-size:16px; font-weight:800; color:#fff; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-top:20px; margin-bottom:12px;">$1</h4>');
            html = html.replace(/^## (.*$)/gim, '<h3 style="font-size:18px; font-weight:800; color:#10b981; margin-top:24px; margin-bottom:16px;">$1</h3>');
            html = html.replace(/^# (.*$)/gim, '<h2 style="font-size:20px; font-weight:800; color:#10b981; margin-top:24px; margin-bottom:16px;">$1</h2>');
            
            // Liste
            html = html.replace(/^\* (.*$)/gim, '<div style="display:flex; gap:8px; margin-bottom:8px; padding-left:8px;"><i class="ph ph-check-circle" style="color:#10b981; margin-top:4px;"></i><span style="flex:1;">$1</span></div>');
            html = html.replace(/^\d+\. (.*$)/gim, '<div style="display:flex; gap:8px; margin-bottom:8px; padding-left:8px;"><i class="ph ph-caret-right" style="color:#3b82f6; margin-top:4px;"></i><span style="flex:1;">$1</span></div>');
            
            // Separatori orizzontali
            html = html.replace(/^---/gim, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:24px 0;">');
            
            // Grassetto e corsivo
            html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>');
            html = html.replace(/\*(.*?)\*/gim, '<em style="opacity:0.8;">$1</em>');
            
            // A capo
            html = html.replace(/\n\n/g, '<div style="height:12px;"></div>');
            html = html.replace(/\n/g, '<br>');
            
            return html;
        };

        const appendMessage = (role, content) => {
            const isAi = role === 'AI';
            const formattedContent = isAi ? formatMarkdown(content) : Utils.escapeHtml(content);

            const html = `
                <div style="display:flex; gap:12px; align-self: ${isAi ? 'flex-start' : 'flex-end'}; max-width:${isAi ? '100%' : '85%'}; width:${isAi ? '100%' : 'auto'};">
                    ${isAi ? '<div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot"></i></div>' : ''}
                    <div style="background:${isAi ? 'rgba(255,255,255,0.02)' : '#3b82f6'}; border:${isAi ? '1px solid rgba(255,255,255,0.05)' : 'none'}; color:#fff; padding:16px 20px; border-radius:12px; ${isAi ? 'border-top-left-radius:2px;' : 'border-top-right-radius:2px;'} font-size:14px; line-height:1.6; flex:1;">
                        ${formattedContent}
                    </div>
                </div>
            `;
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
                messagesContainer.insertAdjacentHTML('beforeend', `
                    <div id="${loadingId}" style="display:flex; gap:12px; align-self:flex-start;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot animate-spin"></i></div>
                        <div style="background:rgba(255,255,255,0.05); color:var(--color-text-muted); padding:12px 16px; border-radius:12px; border-top-left-radius:2px; font-size:14px;">Elaborazione...</div>
                    </div>
                `);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                const res = await fetch('api/?module=health&action=askAI', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        athlete_id: athlete.id,
                        focused_injury_id: focusedInjuryId,
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
            <div class="injury-tabs" style="display:flex; background:rgba(255,255,255,0.02); border-radius:12px; padding:4px; margin-bottom:24px; gap:4px; border:1px solid rgba(255,255,255,0.05);">
                <button type="button" class="tab-btn active" data-tab="tab-details" style="flex:1; padding:10px 16px; background:rgba(255,255,255,0.1); border-radius:8px; border:none; color:#fff; font-weight:700; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <i class="ph ph-file-text" style="font-size:16px;"></i> Dettagli Caso
                </button>
                <button type="button" class="tab-btn" data-tab="tab-checkups" ${!isEdit ? 'disabled title="Salva infortunio per gestire il decorso"' : ''} style="flex:1; padding:10px 16px; background:transparent; border-radius:8px; border:none; color:var(--color-text-muted); font-weight:600; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.3s; opacity:${!isEdit ? '0.4' : '1'};">
                    <i class="ph ph-stethoscope" style="font-size:16px;"></i> Decorso / Visite
                </button>
                <button type="button" class="tab-btn" data-tab="tab-docs" ${!isEdit ? 'disabled title="Salva infortunio per allegare referti"' : ''} style="flex:1; padding:10px 16px; background:transparent; border-radius:8px; border:none; color:var(--color-text-muted); font-weight:600; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.3s; opacity:${!isEdit ? '0.4' : '1'};">
                    <i class="ph ph-files" style="font-size:16px;"></i> Doc / Referti
                </button>
            </div>
        `;

        const detailsHtml = `
            <form id="injury-form" style="display:flex; flex-direction:column; gap:20px;">
                ${isEdit ? `<input type="hidden" name="injury_id" value="${injury.id}">` : ''}
                <input type="hidden" name="athlete_id" value="${athlete.id}">
                
                <div class="section-card" style="background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:20px;">
                    <h3 style="font-size:12px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="ph ph-info" style="color:#3b82f6; font-size:16px;"></i> Informazioni Generali</h3>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Data Infortunio <span style="color:#ef4444">*</span></label>
                            <input type="date" name="injury_date" class="input" style="width:100%; border-radius:8px;" required value="${dDate}">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Tipo Infortunio</label>
                            <select name="injury_type" class="input" style="width:100%; border-radius:8px;">
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
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Descrizione / Sede anatomica <span style="color:#ef4444">*</span></label>
                        <input type="text" name="description" class="input" style="width:100%; border-radius:8px;" required placeholder="Es. Lesione II grado bicipite femorale dx" value="${Utils.escapeHtml(injury?.description || '')}">
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Meccanismo (Contatto/No Contatto)</label>
                            <select name="mechanism" class="input" style="width:100%; border-radius:8px;">
                                <option value="">-</option>
                                <option value="Da Contatto" ${injury?.mechanism === 'Da Contatto' ? 'selected' : ''}>Da Contatto</option>
                                <option value="Non da Contatto" ${injury?.mechanism === 'Non da Contatto' ? 'selected' : ''}>Non da Contatto</option>
                                <option value="Overuse/Sovraccarico" ${injury?.mechanism === 'Overuse/Sovraccarico' ? 'selected' : ''}>Overuse/Sovraccarico</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Parte del Corpo</label>
                            <input type="text" name="body_part" class="input" style="width:100%; border-radius:8px;" placeholder="Es. Ginocchio destro" value="${Utils.escapeHtml(injury?.body_part || '')}">
                        </div>
                    </div>
                </div>

                <div class="section-card" style="background:rgba(255,255,255,0.01); border:1px solid rgba(16, 185, 129, 0.1); border-radius:12px; padding:20px; border-left:4px solid #10b981;">
                    <h3 style="font-size:12px; font-weight:900; color:#10b981; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="ph ph-heartbeat" style="font-size:16px;"></i> Diagnosi & Terapia</h3>
                    <div class="form-group" style="margin-bottom:16px;">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Diagnosi Strumentali</label>
                        <textarea name="diagnosis" class="input" style="width:100%; height:70px; border-radius:8px;" placeholder="Ecografia / Risonanza (Referto sintesi)">${Utils.escapeHtml(injury?.diagnosis || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Trattamento in corso</label>
                        <textarea name="treatment" class="input" style="width:100%; height:70px; border-radius:8px;" placeholder="Es. Fisioterapia TECAR, Riposo">${Utils.escapeHtml(injury?.treatment || '')}</textarea>
                    </div>
                </div>

                <div class="section-card" style="background:rgba(239, 68, 68, 0.02); border:1px solid rgba(239, 68, 68, 0.1); border-radius:12px; padding:20px;">
                    <h3 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="ph ph-calendar-check" style="font-size:16px;"></i> Rientro e RTP</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; align-items:start;">
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">RTP Previsto (Data)</label>
                            <input type="date" name="expected_rtp_date" class="input" style="width:100%; border-radius:8px;" value="${expDate}">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:16px;">
                            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#fff; cursor:pointer; background:rgba(0,0,0,0.2); padding:10px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); transition:all 0.2s;">
                                <input type="checkbox" name="rtp_cleared" value="1" ${injury?.rtp_cleared === 1 ? 'checked' : ''} id="rtp-clear-cb" style="width:16px; height:16px; accent-color:#10b981;">
                                <strong style="color:${injury?.rtp_cleared === 1 ? '#10b981' : '#fff'}">Cleared for RTP (Infortunio Risolto)</strong>
                            </label>
                            <div class="form-group rtp-actual-date" style="${injury?.rtp_cleared === 1 ? 'display:block;' : 'display:none;'} animation: fadeIn 0.3s ease;">
                                <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600; color:#10b981;">Data Effettiva RTP <span style="color:#ef4444">*</span></label>
                                <input type="date" name="estimated_return_date" class="input" style="width:100%; border-radius:8px; border-color:rgba(16, 185, 129, 0.3);" value="${rtpDate}">
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; gap:12px; margin-top:8px;">
                    <button type="button" class="btn btn-default" style="padding:12px 24px; border-radius:8px; font-weight:600;" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Chiudi</button>
                    <button type="submit" class="btn btn-primary" style="padding:12px 24px; border-radius:8px; font-weight:600; background:${isEdit ? '#3b82f6' : '#ef4444'}; box-shadow: 0 4px 12px ${isEdit ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                        ${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Inserisci Infortunio'}
                    </button>
                </div>
            </form>
        `;

        const checkupsHtml = isEdit ? `
             <div style="display:flex; flex-direction:column; gap:24px; height:60vh; overflow:hidden;">
                <!-- Storico Visite Scrollable -->
                <div style="flex:1; overflow-y:auto; padding-right:12px; margin-right:-12px;">
                    <div id="checkups-container">
                        <div style="text-align:center; padding:40px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin" style="font-size:24px;"></i><p style="margin-top:12px; font-size:13px;">Caricamento storico...</p></div>
                    </div>
                </div>
                
                <!-- Aggiungi Visita Fixed a Bottom -->
                <form id="checkup-form" style="background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid rgba(16, 185, 129, 0.1); box-shadow: 0 -4px 20px rgba(0,0,0,0.1); flex-shrink:0;">
                    <h4 style="font-size:13px; font-weight:800; color:#10b981; margin-bottom:16px; display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.5px;"><i class="ph ph-plus-circle" style="font-size:16px;"></i> Nuova Visita / Check-up</h4>
                    <input type="hidden" name="injury_id" value="${injury.id}">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Data Visita <span style="color:#ef4444">*</span></label>
                            <input type="date" name="visit_date" class="input" style="width:100%; border-radius:8px;" required value="${new Date().toISOString().substring(0, 10)}">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Specialista</label>
                            <input type="text" name="practitioner" class="input" style="width:100%; border-radius:8px;" placeholder="Es. Dott. Rossi">
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:16px;">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Esito / Note</label>
                        <textarea name="outcome" class="input" style="width:100%; height:60px; border-radius:8px; resize:none;" placeholder="Risultati ed esito della visita"></textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                        <button type="submit" class="btn btn-primary" style="background:#10b981; border-radius:8px; padding:10px 20px; font-weight:600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);"><i class="ph ph-paper-plane-right"></i> Registra Visita</button>
                    </div>
                </form>
            </div>
        ` : '';

        const docsHtml = isEdit ? `
             <div style="display:flex; flex-direction:column; gap:24px; height:60vh; overflow:hidden;">
                <!-- Lista Documenti Scrollabile -->
                <div style="flex:1; overflow-y:auto; padding-right:12px; margin-right:-12px;">
                    <div id="docs-container">
                        <div style="text-align:center; padding:40px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin" style="font-size:24px;"></i><p style="margin-top:12px; font-size:13px;">Caricamento documenti...</p></div>
                    </div>
                </div>

                <!-- Form Caricamento Fixed a Bottom -->
                <form id="doc-form" style="background:rgba(255,255,255,0.02); padding:20px; border-radius:12px; border:1px solid rgba(59, 130, 246, 0.1); box-shadow: 0 -4px 20px rgba(0,0,0,0.1); flex-shrink:0;">
                    <h4 style="font-size:13px; font-weight:800; color:#3b82f6; margin-bottom:16px; display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.5px;"><i class="ph ph-upload-simple" style="font-size:16px;"></i> Carica Referto / Immagine</h4>
                    <input type="hidden" name="injury_id" value="${injury.id}">
                    
                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom:16px;">
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Argomento / Titolo <span style="color:#ef4444">*</span></label>
                            <input type="text" name="document_title" class="input" style="width:100%; border-radius:8px;" required placeholder="Es. Referto Risonanza">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">Tipo</label>
                            <select name="document_type" class="input" style="width:100%; border-radius:8px;">
                                <option value="Referto">Referto</option>
                                <option value="Immagini (Rx, Eco, MRI)">Immagini (Rx, Eco, MRI)</option>
                                <option value="Certificato">Certificato di Rientro</option>
                                <option value="Altro">Altro</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex; gap:16px; align-items:flex-end;">
                        <div class="form-group" style="flex:1;">
                            <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:6px; font-weight:600;">File (PDF, JPG, PNG) <span style="color:#ef4444">*</span></label>
                            <div style="position:relative;">
                                <input type="file" name="document_file" class="input" style="width:100%; padding:10px; border: 1px dashed rgba(59, 130, 246, 0.4); background:rgba(59, 130, 246, 0.05); border-radius:8px; color:#fff; cursor:pointer;" required accept=".pdf,.jpg,.jpeg,.png">
                                <i class="ph ph-folder-open" style="position:absolute; right:16px; top:50%; transform:translateY(-50%); opacity:0.5; pointer-events:none;"></i>
                            </div>
                        </div>
                        <div style="flex-shrink:0;">
                            <button type="submit" class="btn btn-primary" style="background:#3b82f6; border-radius:8px; padding:10px 24px; font-weight:600; height:42px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);"><i class="ph ph-upload-simple"></i> Carica</button>
                        </div>
                    </div>
                </form>
            </div>
        ` : '';

        const theModal = this._createModal(`
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <h2 style="font-family:var(--font-display); font-size:24px; font-weight:900; color:#fff; margin-bottom:24px; letter-spacing:-0.5px; display:flex; align-items:center; gap:12px;">
                <i class="ph ph-bandaids" style="color:#ef4444;"></i> ${isEdit ? 'Gestione Infortunio' : 'Nuovo Infortunio'}
            </h2>
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
                    other.style.fontWeight = '600';
                    other.style.background = 'transparent';
                    other.style.color = 'var(--color-text-muted)';
                    other.style.boxShadow = 'none';
                });
                theModal.querySelectorAll('.tab-content').forEach(c => {
                    c.style.display = 'none';
                    c.style.animation = 'none';
                });
                
                // Set active
                b.classList.add('active');
                b.style.fontWeight = '700';
                b.style.background = 'rgba(255,255,255,0.1)';
                b.style.color = '#fff';
                b.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                
                const showContent = theModal.querySelector('#' + target);
                showContent.style.display = 'block';
                // Trigger a small animation
                showContent.style.animation = 'fadeIn 0.3s ease forwards';
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
                
                // Color toggle for the label
                const labelStrong = e.target.nextElementSibling;
                if(labelStrong) {
                    labelStrong.style.color = e.target.checked ? '#10b981' : '#fff';
                }

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
                        <div class="timeline-container" style="position:relative; padding-left:32px; padding-top:8px;">
                            <div style="position:absolute; left:7px; top:8px; bottom:8px; width:2px; background:linear-gradient(to bottom, rgba(16, 185, 129, 0.5), rgba(16, 185, 129, 0));"></div>
                            <div style="display:grid; gap:24px;">
                                ${list.map(c => `
                                    <div class="timeline-item" style="position:relative; animation: fadeIn 0.3s ease forwards;">
                                        <div style="position:absolute; left:-31px; top:4px; width:14px; height:14px; border-radius:50%; background:#10b981; border:3px solid var(--color-bg-panel); z-index:2; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);"></div>
                                        <div class="card glass-card" style="padding:16px 20px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); border-radius:12px; transition:all 0.2s;">
                                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                                <div>
                                                    <div style="font-weight:900; color:#fff; font-size:14px; letter-spacing:0.5px;">${new Date(c.visit_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                                    <div style="font-size:12px; color:var(--color-text-muted); margin-top:4px; display:flex; align-items:center; gap:4px;">
                                                        <i class="ph ph-stethoscope" style="color:#10b981;"></i> ${Utils.escapeHtml(c.practitioner || 'Specialista non specificato')}
                                                    </div>
                                                </div>
                                                <div style="font-size:10px; background:rgba(16, 185, 129, 0.1); color:#10b981; padding:4px 10px; border-radius:100px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; border:1px solid rgba(16, 185, 129, 0.2);">VISITA</div>
                                            </div>
                                            <div style="font-size:13px; color:rgba(255,255,255,0.85); line-height:1.6; background:rgba(0,0,0,0.2); padding:16px; border-radius:8px; border:1px solid rgba(255,255,255,0.02);">
                                                ${Utils.escapeHtml(c.outcome || c.notes || '(Nessuna nota registrata)').replace(/\\n/g, '<br>')}
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
                    container.innerHTML = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:16px; padding-top:8px;">' + list.map(d => {
                        const isPdf = d.file_path.toLowerCase().endsWith('.pdf');
                        const isImg = /\\.(jpg|jpeg|png|gif|webp)$/i.test(d.file_path);
                        const iconClass = isPdf ? 'ph ph-file-pdf' : (isImg ? 'ph ph-file-image' : 'ph ph-file-text');
                        const iconColor = isPdf ? '#ef4444' : (isImg ? '#10b981' : '#3b82f6');
                        const bgColor = isPdf ? 'rgba(239, 68, 68, 0.05)' : (isImg ? 'rgba(16, 185, 129, 0.05)' : 'rgba(59, 130, 246, 0.05)');
                        
                        return `
                        <div class="card glass-card" style="padding:16px; display:flex; flex-direction:column; gap:12px; border:1px solid rgba(255,255,255,0.05); border-radius:12px; position:relative; overflow:hidden; transition:all 0.2s; cursor:pointer;" onmouseover="this.style.borderColor='rgba(255,255,255,0.2)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='translateY(0)';">
                            <div style="position:absolute; top:-10px; right:-10px; opacity:0.03; font-size:80px; pointer-events:none; color:${iconColor};">
                                <i class="${iconClass}"></i>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px; z-index:1;">
                                <div style="width:40px; height:40px; border-radius:10px; background:${bgColor}; border:1px solid rgba(255,255,255,0.02); display:flex; align-items:center; justify-content:center; color:${iconColor}; flex-shrink:0;">
                                    <i class="${iconClass}" style="font-size:24px;"></i>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <div style="font-weight:800; color:#fff; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(d.document_title)}">
                                        ${Utils.escapeHtml(d.document_title)}
                                    </div>
                                    <div style="font-size:11px; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; display:flex; align-items:center; gap:4px;">
                                        ${Utils.escapeHtml(d.document_type || 'Referto')}
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; z-index:1; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05);">
                                <div style="font-size:11px; opacity:0.6; display:flex; align-items:center; gap:4px;">
                                    <i class="ph ph-calendar"></i> ${new Date(d.uploaded_at || d.created_at).toLocaleDateString('it-IT')}
                                </div>
                                <button type="button" class="btn btn-primary btn-xs doc-preview-btn" data-url="${Utils.escapeHtml(d.file_path)}" data-title="${Utils.escapeHtml(d.document_title)}" data-type="${isPdf ? 'pdf' : (isImg ? 'img' : 'other')}" style="padding:4px 12px; font-size:11px; font-weight:700; border-radius:6px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.1);">
                                    <i class="ph ph-eye"></i> APRI
                                </button>
                            </div>
                        </div>
                    `}).join('') + '</div>';

                    // Attach listener to open doc
                    container.querySelectorAll('.doc-preview-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const url = btn.getAttribute('data-url');
                            const title = btn.getAttribute('data-title');
                            const type = btn.getAttribute('data-type');
                            this._openDocViewer(url, title, type);
                        });
                    });
                }
            } else {
                throw new Error(res.error);
            }
        } catch (e) {
            container.innerHTML = `<div style="color:#ef4444; padding:16px;">Errore caricamento documenti: ${Utils.escapeHtml(e.message)}</div>`;
        }
    },

    _openDocViewer(url, title, type) {
        let contentHtml = '';
        if (type === 'img') {
            contentHtml = `<img src="${url}" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px; display:block; margin:0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">`;
        } else if (type === 'pdf') {
            contentHtml = `<iframe src="${url}" style="width:100%; height:80vh; border:none; border-radius:8px; background:#fff; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"></iframe>`;
        } else {
            // Use Google Docs Viewer for Office files. Resolve the correct absolute URL using new URL()
            // In case url has some special encoding, we pass the fully resolved absolute url back.
            // If the environment requires a public URL, we reconstruct it properly.
            const base = window.location.href; // e.g. https://www.fusionteamvolley.it/ERP/...
            const fullUrl = new URL(url, base).href;
            
            // To ensure Google can reach it, we encode the full URL
            const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
            
            contentHtml = `
                <div style="width:100%; display:flex; flex-direction:column; gap:8px;">
                    <iframe src="${viewerUrl}" style="width:100%; height:75vh; border:none; border-radius:8px; background:#fff; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"></iframe>
                    <div style="text-align:center; padding:8px;">
                        <a href="${url}" target="_blank" class="btn" style="background:rgba(255,255,255,0.05); color:#fff; border-radius:8px; padding:10px 24px; font-size:13px; font-weight:700; border:1px solid rgba(255,255,255,0.1); display:inline-flex; align-items:center; gap:8px; transition:all 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'; this.style.borderColor='rgba(59, 130, 246, 0.5)';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.borderColor='rgba(255,255,255,0.1)';">
                            <i class="ph ph-download-simple" style="font-size:18px;"></i> Se l'anteprima non si carica, clicca qui per scaricare
                        </a>
                    </div>
                </div>
            `;
        }

        const theModal = this._createModal(`
            <style>
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .doc-viewer-modal { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            </style>
            <div class="doc-viewer-modal" style="display:flex; flex-direction:column; gap:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:16px; min-width:0;">
                        <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;">
                            <i class="${type === 'pdf' ? 'ph ph-file-pdf' : (type === 'img' ? 'ph ph-file-image' : 'ph ph-file-text')}" style="font-size:20px;"></i>
                        </div>
                        <h3 style="color:#fff; font-size:20px; font-weight:900; margin:0; letter-spacing:-0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(title)}">${Utils.escapeHtml(title)}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost" style="background:rgba(255,255,255,0.05); color:#fff; border-radius:50%; width:44px; height:44px; padding:0; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; flex-shrink:0; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">
                        <i class="ph ph-x" style="font-size:20px;"></i>
                    </button>
                </div>
                
                <div style="background:var(--color-bg); border-radius:16px; padding:0; display:flex; justify-content:center; align-items:center; overflow:hidden; position:relative; min-height:200px;">
                    ${contentHtml}
                </div>
            </div>
        `);
        
        const modalContent = theModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = type === 'pdf' || type === 'img' ? '1200px' : '500px';
            modalContent.style.width = '95%';
            modalContent.style.padding = '24px';
        }

        document.body.appendChild(theModal);
    }
};
