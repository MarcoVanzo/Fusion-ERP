import { ModalUtils } from './ModalUtils.js';
import { AthleteHealth } from '../AthleteHealth.js';

export const AnamnesiModal = {
    open(container, athlete, anamnesi) {
        const theModal = ModalUtils.createModal(`
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
                    <button type="button" class="btn btn-default close-modal-btn">Annulla</button>
                    <button type="submit" class="btn btn-primary" style="background:#ef4444;"><i class="ph ph-floppy-disk"></i> Salva</button>
                </div>
            </form>
        `);
        
        document.body.appendChild(theModal);

        theModal.querySelector('#anamnesi-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                UI.loading(true);
                const res = await fetch('api/?module=health&action=updateAnamnesi', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData,
                    signal: ModalUtils.getSignal()
                }).then(r => r.json());
                
                if(res.success) {
                    UI.toast("Anamnesi aggiornata");
                    ModalUtils.closeModal(theModal);
                    AthleteHealth._loadData(container, athlete);
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
};
