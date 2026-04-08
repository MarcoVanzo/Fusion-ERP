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
                fetch(\`api/?module=Health&action=getAnamnesi&athlete_id=\${athlete.id}\`).then(r => r.json()),
                fetch(\`api/?module=Health&action=getInjuries&athlete_id=\${athlete.id}\`).then(r => r.json())
            ]);

            const anamnesi = anamnesiRes.success ? (anamnesiRes.data || {}) : {};
            const injuries = injuriesRes.success ? (injuriesRes.data || []) : [];

            this._renderUi(container, athlete, anamnesi, injuries);
        } catch (e) {
            console.error("Errore _loadData:", e);
            container.innerHTML = \`<div class="error-box">Errore caricamento dati medici: \${e.message}</div>\`;
        }
    },

    _renderUi(container, athlete, anamnesi, injuries) {
        let activeInjuries = injuries.filter(i => i.rtp_cleared !== 1);
        let pastInjuries = injuries.filter(i => i.rtp_cleared === 1);

        container.innerHTML = \`
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
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Malattie Croniche</div>
                            <div style="font-size:14px; color:#fff;">\${anamnesi.chronic_diseases || '—'}</div>
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Interventi Chirurgici Pregressi</div>
                            <div style="font-size:14px; color:#fff;">\${anamnesi.past_surgeries || '—'}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Infortuni Passati (Generici)</div>
                            <div style="font-size:14px; color:#fff;">\${anamnesi.past_injuries || '—'}</div>
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size:12px; font-weight:900; color:#3b82f6; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Ortopedica</h4>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Problemi Ortopedici Cronici</div>
                            <div style="font-size:14px; color:#fff;">\${anamnesi.chronic_orthopedic_issues || '—'}</div>
                        </div>
                        <div>
                            <div style="font-size:11px; opacity:0.5; margin-bottom:4px; text-transform:uppercase;">Ausili Ortopedici (es. Plantari)</div>
                            <div style="font-size:14px; color:#fff;">\${anamnesi.orthopedic_aids || '—'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Infortuni Attivi -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <h3 style="font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin:0;">Infortuni Attivi</h3>
                    \${activeInjuries.length > 0 ? \`<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.4);">\${activeInjuries.length}</span>\` : ''}
                </div>
                <button class="btn btn-primary btn-sm add-injury-btn" style="background:#ef4444;">
                    <i class="ph ph-plus"></i> Nuovo Infortunio
                </button>
            </div>

            \${activeInjuries.length === 0 ? \`
                <div class="card glass-card" style="padding:40px; text-align:center; border:1px dashed rgba(255,255,255,0.1); background:rgba(255,255,255,0.01); margin-bottom:32px;">
                    <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; color:rgba(255,255,255,0.1);">
                        <i class="ph ph-check-circle" style="font-size:32px;"></i>
                    </div>
                    <p style="color:var(--color-text-muted); font-size:14px;">Nessun infortunio attualmente in corso.</p>
                </div>
            \` : \`
                <div style="display:grid; gap:16px; margin-bottom:32px;">
                    \${activeInjuries.map(i => this._renderInjuryCard(i)).join('')}
                </div>
            \`}

            <!-- Storico Infortuni -->
            \${pastInjuries.length > 0 ? \`
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                    <h3 style="font-family:var(--font-display); font-size:18px; font-weight:800; color:var(--color-text-muted); margin:0;">Storico Risolti</h3>
                </div>
                <div style="display:grid; gap:12px;">
                    \${pastInjuries.map(i => this._renderInjuryCard(i, true)).join('')}
                </div>
            \` : ''}
        \`;

        this._addListeners(container, athlete, anamnesi, injuries);
    },

    _renderInjuryCard(injury, isPast = false) {
        const dDate = new Date(injury.injury_date).toLocaleDateString('it-IT');
        let rtpDate = injury.rtp_date ? new Date(injury.rtp_date).toLocaleDateString('it-IT') : '—';
        let statusBadge = '';
        if (isPast) {
            statusBadge = \`<span class="badge" style="background:rgba(16, 185, 129, 0.1); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3);">RTP OK (\${rtpDate})</span>\`;
        } else {
            const now = new Date();
            const exp = injury.expected_rtp_date ? new Date(injury.expected_rtp_date) : null;
            let estStr = exp ? \`Previsto RTP: \${exp.toLocaleDateString('it-IT')}\` : 'RTP Indefinito';
            statusBadge = \`<span class="badge" style="background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3);">\${estStr}</span>\`;
        }

        return \`
            <div class="card glass-card injury-card" data-id="\${injury.id}" style="padding:20px; border-left:4px solid \${isPast ? '#10b981' : '#ef4444'}; cursor:pointer; transition:all 0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <span style="font-weight:800; color:#fff; font-size:16px;">\${Utils.escapeHtml(injury.description || 'Non specificato')}</span>
                            \${statusBadge}
                        </div>
                        <div style="font-size:13px; color:var(--color-text-muted); display:flex; gap:16px;">
                            <span><i class="ph ph-calendar"></i> Data Infortunio: \${dDate}</span>
                            <span><i class="ph ph-activity"></i> Gravità: \${injury.severity || '—'}</span>
                            <span><i class="ph ph-first-aid"></i> Tipo: \${injury.injury_type || '—'}</span>
                        </div>
                        \${injury.diagnosis ? \`<div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:8px;"><strong>Diagnosi:</strong> \${Utils.escapeHtml(injury.diagnosis)}</div>\` : ''}
                    </div>
                    <button class="btn btn-ghost btn-xs edit-injury-btn" data-id="\${injury.id}" style="background:rgba(255,255,255,0.05);">
                        <i class="ph ph-pencil-simple"></i> Dettagli
                    </button>
                </div>
            </div>
        \`;
    },

    _addListeners(container, athlete, anamnesi, injuries) {
        const editAnamnesiBtn = container.querySelector('.edit-anamnesi-btn');
        if (editAnamnesiBtn) {
            editAnamnesiBtn.addEventListener('click', () => {
                this._openAnamnesiModal(container, athlete, anamnesi);
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

    _openAnamnesiModal(container, athlete, anamnesi) {
        const theModal = Utils.createModal(\`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:24px;">Anamnesi: \${Utils.escapeHtml(athlete.full_name)}</h2>
            <form id="anamnesi-form">
                <input type="hidden" name="athlete_id" value="\${athlete.id}">
                
                <h3 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:16px;">Sezione Generale</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Malattie Croniche</label>
                    <textarea name="chronic_diseases" class="input" style="width:100%; height:60px;">\${Utils.escapeHtml(anamnesi.chronic_diseases || '')}</textarea>
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Interventi Chirurgici Pregressi</label>
                    <textarea name="past_surgeries" class="input" style="width:100%; height:60px;">\${Utils.escapeHtml(anamnesi.past_surgeries || '')}</textarea>
                </div>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Infortuni Passati (Generici)</label>
                    <textarea name="past_injuries" class="input" style="width:100%; height:60px;">\${Utils.escapeHtml(anamnesi.past_injuries || '')}</textarea>
                </div>

                <h3 style="font-size:12px; font-weight:900; color:#3b82f6; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:24px;">Sezione Ortopedica</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Problemi Ortopedici Cronici</label>
                    <textarea name="chronic_orthopedic_issues" class="input" style="width:100%; height:60px;">\${Utils.escapeHtml(anamnesi.chronic_orthopedic_issues || '')}</textarea>
                </div>
                <div class="form-group" style="margin-bottom:24px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Ausili Ortopedici (es. Plantari)</label>
                    <textarea name="orthopedic_aids" class="input" style="width:100%; height:60px;">\${Utils.escapeHtml(anamnesi.orthopedic_aids || '')}</textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px;">
                    <button type="button" class="btn btn-default" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Annulla</button>
                    <button type="submit" class="btn btn-primary" style="background:#ef4444;"><i class="ph ph-floppy-disk"></i> Salva</button>
                </div>
            </form>
        \`);
        
        document.body.appendChild(theModal);

        document.getElementById('anamnesi-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                UI.loading(true);
                const res = await fetch('api/?module=Health&action=updateAnamnesi', {
                    method: 'POST',
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
        const rtpDate = injury?.rtp_date ? injury.rtp_date.substring(0, 10) : '';

        const theModal = Utils.createModal(\`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:24px;">\${isEdit ? 'Modifica Infortunio' : 'Nuovo Infortunio'}</h2>
            <form id="injury-form">
                \${isEdit ? \`<input type="hidden" name="id" value="\${injury.id}">\` : ''}
                <input type="hidden" name="athlete_id" value="\${athlete.id}">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data Infortunio <span style="color:#ef4444">*</span></label>
                        <input type="date" name="injury_date" class="input" style="width:100%;" required value="\${dDate}">
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Tipo Infortunio</label>
                        <select name="injury_type" class="input" style="width:100%;">
                            <option value="">Seleziona...</option>
                            <option value="Muscolare" \${injury?.injury_type === 'Muscolare' ? 'selected' : ''}>Muscolare</option>
                            <option value="Articolare/Legamentoso" \${injury?.injury_type === 'Articolare/Legamentoso' ? 'selected' : ''}>Articolare/Legamentoso</option>
                            <option value="Osseo (Frattura/Infrazione)" \${injury?.injury_type === 'Osseo (Frattura/Infrazione)' ? 'selected' : ''}>Osseo (Frattura/Infrazione)</option>
                            <option value="Contusione" \${injury?.injury_type === 'Contusione' ? 'selected' : ''}>Contusione</option>
                            <option value="Altro" \${injury?.injury_type === 'Altro' ? 'selected' : ''}>Altro</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Descrizione / Sede anatomica <span style="color:#ef4444">*</span></label>
                    <input type="text" name="description" class="input" style="width:100%;" required placeholder="Es. Lesione II grado bicipite femorale dx" value="\${Utils.escapeHtml(injury?.description || '')}">
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Meccanismo (Contatto/No Contatto)</label>
                        <select name="mechanism" class="input" style="width:100%;">
                            <option value="">-</option>
                            <option value="Da Contatto" \${injury?.mechanism === 'Da Contatto' ? 'selected' : ''}>Da Contatto</option>
                            <option value="Non da Contatto" \${injury?.mechanism === 'Non da Contatto' ? 'selected' : ''}>Non da Contatto</option>
                            <option value="Overuse/Sovraccarico" \${injury?.mechanism === 'Overuse/Sovraccarico' ? 'selected' : ''}>Overuse/Sovraccarico</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Gravità / Grado</label>
                        <input type="text" name="severity" class="input" style="width:100%;" placeholder="Es. G1, G2, Severo" value="\${Utils.escapeHtml(injury?.severity || '')}">
                    </div>
                </div>

                <h3 style="font-size:12px; font-weight:900; color:#ef4444; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:24px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px;">Diagnosi Strumentali</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <textarea name="diagnosis" class="input" style="width:100%; height:60px;" placeholder="Ecografia / Risonanza (Referto sintesi)">\${Utils.escapeHtml(injury?.diagnosis || '')}</textarea>
                </div>

                <h3 style="font-size:12px; font-weight:900; color:#10b981; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; margin-top:24px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px;">Terapia e Recupero</h3>
                <div class="form-group" style="margin-bottom:16px;">
                    <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Trattamento in corso</label>
                    <textarea name="treatment" class="input" style="width:100%; height:60px;" placeholder="Es. Fisioterapia TECAR, Riposo">\${Utils.escapeHtml(injury?.treatment || '')}</textarea>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px; padding:16px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                    <div class="form-group">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">RTP Previsto (Data)</label>
                        <input type="date" name="expected_rtp_date" class="input" style="width:100%;" value="\${expDate}">
                    </div>
                    <div class="form-group">
                        <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#fff; cursor:pointer; margin-top:24px;">
                            <input type="checkbox" name="rtp_cleared" value="1" \${injury?.rtp_cleared === 1 ? 'checked' : ''} id="rtp-clear-cb">
                            <strong>Cleared for RTP (Infortunio Risolto)</strong>
                        </label>
                    </div>
                    <div class="form-group rtp-actual-date" style="\${injury?.rtp_cleared === 1 ? 'display:block;' : 'display:none;'}">
                        <label style="display:block; font-size:11px; opacity:0.6; text-transform:uppercase; margin-bottom:4px;">Data Effettiva RTP</label>
                        <input type="date" name="rtp_date" class="input" style="width:100%;" value="\${rtpDate}">
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; gap:12px;">
                    <button type="button" class="btn btn-default" onclick="document.body.removeChild(this.closest('.modal-backdrop'))">Annulla</button>
                    <button type="submit" class="btn btn-primary" style="background:\${isEdit ? '#3b82f6' : '#ef4444'};">
                        \${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Inserisci Infortunio'}
                    </button>
                </div>
            </form>
        \`);
        
        document.body.appendChild(theModal);

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

        document.getElementById('injury-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            // Default checkbox false behavior
            if(!formData.has('rtp_cleared')) {
                formData.append('rtp_cleared', 0);
            }
            
            try {
                UI.loading(true);
                const action = isEdit ? 'updateInjury' : 'addInjury';
                const res = await fetch(\`api/?module=Health&action=\${action}\`, {
                    method: 'POST',
                    body: formData
                }).then(r => r.json());
                
                if(res.success) {
                    UI.toast(\`Infortunio \${isEdit ? 'aggiornato' : 'inserito'}\`);
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
    }
};
