import { ModalUtils } from './ModalUtils.js';
import { AthleteHealth } from '../AthleteHealth.js';
import { DocViewerModal } from './DocViewerModal.js';

export const InjuryModal = {
    open(container, athlete, injury = null) {
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
                    <button type="button" class="btn btn-default close-modal-btn" style="padding:12px 24px; border-radius:8px; font-weight:600;">Chiudi</button>
                    <button type="submit" class="btn btn-primary" style="padding:12px 24px; border-radius:8px; font-weight:600; background:${isEdit ? '#3b82f6' : '#ef4444'}; box-shadow: 0 4px 12px ${isEdit ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">
                        ${isEdit ? '<i class="ph ph-floppy-disk"></i> Salva Modifiche' : '<i class="ph ph-plus"></i> Inserisci Infortunio'}
                    </button>
                </div>
            </form>
        `;

        const checkupsHtml = isEdit ? `
             <div style="display:flex; flex-direction:column; gap:24px; height:60vh; overflow:hidden;">
                <div style="flex:1; overflow-y:auto; padding-right:12px; margin-right:-12px;">
                    <div id="checkups-container">
                        <div style="text-align:center; padding:40px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin" style="font-size:24px;"></i><p style="margin-top:12px; font-size:13px;">Caricamento storico...</p></div>
                    </div>
                </div>
                
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
                <div style="flex:1; overflow-y:auto; padding-right:12px; margin-right:-12px;">
                    <div id="docs-container">
                        <div style="text-align:center; padding:40px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin" style="font-size:24px;"></i><p style="margin-top:12px; font-size:13px;">Caricamento documenti...</p></div>
                    </div>
                </div>

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

        const theModal = ModalUtils.createModal(`
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

        const tabBtns = theModal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const b = e.currentTarget;
                if (b.disabled) return;

                const target = b.getAttribute('data-tab');
                
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
                
                b.classList.add('active');
                b.style.fontWeight = '700';
                b.style.background = 'rgba(255,255,255,0.1)';
                b.style.color = '#fff';
                b.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                
                const showContent = theModal.querySelector('#' + target);
                showContent.style.display = 'block';
                showContent.style.animation = 'fadeIn 0.3s ease forwards';
            });
        });

        if(isEdit) {
            this._loadCheckups(injury.id, theModal);
            this._loadDocs(injury.id, theModal);
        }

        const rtpCb = document.getElementById('rtp-clear-cb');
        if(rtpCb) {
            rtpCb.addEventListener('change', (e) => {
                const el = theModal.querySelector('.rtp-actual-date');
                el.style.display = e.target.checked ? 'block' : 'none';
                
                const labelStrong = e.target.nextElementSibling;
                if(labelStrong) {
                    labelStrong.style.color = e.target.checked ? '#10b981' : '#fff';
                }

                if(e.target.checked && !el.querySelector('input').value) {
                    el.querySelector('input').value = new Date().toISOString().substring(0, 10);
                }
            });
        }

        const detailsForm = theModal.querySelector('#injury-form');
        if (detailsForm) {
            detailsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                if(!formData.has('rtp_cleared')) {
                    formData.append('rtp_cleared', 0);
                }
                
                try {
                    UI.loading(true);
                    const action = isEdit ? 'updateInjury' : 'addInjury';
                    const res = await fetch(`api/?module=health&action=${action}`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                        signal: ModalUtils.getSignal()
                    }).then(r => r.json());
                    
                    if(res.success) {
                        UI.toast(`Infortunio ${isEdit ? 'aggiornato' : 'inserito'}`);
                        
                        if (!isEdit && res.id) {
                            ModalUtils.closeModal(theModal);
                            await AthleteHealth._loadData(container, athlete);
                            const injuries = await fetch(`api/?module=health&action=getInjuries&athlete_id=${athlete.id}`).then(r => r.json());
                            const newInj = injuries.data?.find(i => i.id === res.id);
                            if (newInj) this.open(container, athlete, newInj);
                        } else {
                            ModalUtils.closeModal(theModal);
                            await AthleteHealth._loadData(container, athlete);
                        }
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }

        const checkupForm = theModal.querySelector('#checkup-form');
        if (checkupForm) {
            checkupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    UI.loading(true);
                    const res = await fetch(`api/?module=health&action=addFollowup`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                        signal: ModalUtils.getSignal()
                    }).then(r => r.json());
                    
                    if (res.success) {
                        UI.toast('Visita aggiunta correttamente');
                        checkupForm.reset();
                        this._loadCheckups(injury.id, theModal);
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            });
        }

        const docForm = theModal.querySelector('#doc-form');
        if (docForm) {
            docForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    UI.loading(true);
                    const res = await fetch(`api/?module=health&action=uploadDocument`, {
                        method: 'POST',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                        signal: ModalUtils.getSignal()
                    }).then(r => r.json());
                    
                    if (res.success) {
                        UI.toast('Documento caricato correttamente');
                        docForm.reset();
                        this._loadDocs(injury.id, theModal);
                    } else {
                        throw new Error(res.error || "Errore sconosciuto");
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return;
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
            const res = await fetch(`api/?module=health&action=getFollowups&injury_id=${injuryId}`, {
                signal: ModalUtils.getSignal()
            }).then(r => r.json());
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
                                                ${Utils.escapeHtml(c.outcome || c.notes || '(Nessuna nota registrata)').replace(/\\n|\n/g, '<br>')}
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
            if (e.name === 'AbortError') return;
            container.innerHTML = `<div style="color:#ef4444; padding:16px;">Errore caricamento visite: ${Utils.escapeHtml(e.message)}</div>`;
        }
    },

    async _loadDocs(injuryId, theModal) {
        const container = theModal.querySelector('#docs-container');
        try {
            const res = await fetch(`api/?module=health&action=getDocuments&injury_id=${injuryId}`, {
                signal: ModalUtils.getSignal()
            }).then(r => r.json());
            if (res.success) {
                const list = res.data || [];
                if (list.length === 0) {
                    container.innerHTML = '<div style="padding:24px; text-align:center; color:var(--color-text-muted); background:rgba(255,255,255,0.02); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">Nessun documento caricato.</div>';
                } else {
                    container.innerHTML = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:16px; padding-top:8px;">' + list.map(d => {
                        const cleanPath = d.file_path.split('?')[0].split('#')[0].toLowerCase();
                        const isPdf = cleanPath.endsWith('.pdf');
                        const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(cleanPath);
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

                    container.querySelectorAll('.doc-preview-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const url = btn.getAttribute('data-url');
                            const title = btn.getAttribute('data-title');
                            const type = btn.getAttribute('data-type');
                            DocViewerModal.open(url, title, type);
                        });
                    });
                }
            } else {
                throw new Error(res.error);
            }
        } catch (e) {
            if (e.name === 'AbortError') return;
            container.innerHTML = `<div style="color:#ef4444; padding:16px;">Errore caricamento documenti: ${Utils.escapeHtml(e.message)}</div>`;
        }
    }
};
