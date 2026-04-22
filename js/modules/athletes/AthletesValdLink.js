export const AthletesValdLink = (() => {
    
    function modalTemplate() {
        return `
            <div id="vald-link-modal" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:9999; justify-content:center; align-items:center;">
                <div class="modal-content card glass-card" style="display:flex; flex-direction:column; overflow:hidden; width:100%; max-width:800px; max-height:90vh; background:var(--color-bg-card); border-radius:24px; padding:32px; border:1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                        <div>
                            <h2 style="font-family:var(--font-display); font-size:24px; color:var(--color-white); margin:0;">
                                <i class="ph ph-link" style="color:var(--color-pink);"></i> Gestione Link VALD
                            </h2>
                            <p style="color:var(--color-text-muted); font-size:14px; margin-top:4px;">
                                Collega gli atleti provenienti da VALD Hub con l'anagrafica di sistema per abilitare la sincronizzazione dei dati.
                            </p>
                        </div>
                        <button class="btn btn-ghost" id="close-vald-link-modal" style="padding:10px;"><i class="ph ph-x" style="font-size:24px;"></i></button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <input type="text" id="vald-link-search" placeholder="Cerca atleta..." class="form-input" style="max-width:300px; font-size:14px; background:rgba(255,255,255,0.03);">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button id="sync-vald-btn" class="btn btn-default btn-sm" style="padding:6px 12px; font-weight:600; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff;"><i class="ph ph-arrows-clockwise"></i> Avvia Sync</button>
                            <button id="accept-all-suggestions-btn" class="btn btn-primary btn-sm" style="display:none; padding:6px 12px; font-weight:600;"><i class="ph ph-magic-wand"></i> Accetta <span id="suggestions-count">0</span> suggerimenti</button>
                            <span class="badge badge-success" id="vald-link-count" style="display:none;"></span>
                        </div>
                    </div>

                    <div id="vald-link-loader" style="display:flex; justify-content:center; padding:40px;">
                        <div class="loader-spinner"></div>
                    </div>

                    <div id="vald-link-container" style="flex:1; overflow-y:auto; min-height:0; display:none; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
                        <table class="table" style="width:100%; border-collapse:collapse; text-align:left;">
                            <thead style="background:rgba(255,255,255,0.05); position:sticky; top:0; z-index:10;">
                                <tr>
                                    <th style="padding:16px; font-size:12px; color:rgba(255,255,255,0.4); text-transform:uppercase;">Atleta VALD Hub</th>
                                    <th style="padding:16px; font-size:12px; color:rgba(255,255,255,0.4); text-transform:uppercase;">Atleta Sistema (Fusion ERP)</th>
                                </tr>
                            </thead>
                            <tbody id="vald-link-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async function openModal(onClose) {
        if (!document.getElementById("vald-link-modal")) {
            document.body.insertAdjacentHTML("beforeend", modalTemplate());
            
            document.getElementById("close-vald-link-modal").addEventListener("click", () => {
                document.getElementById("vald-link-modal").style.display = "none";
                if(onClose) onClose();
            });
            
            document.getElementById("sync-vald-btn").addEventListener("click", async (e) => {
                const btn = e.currentTarget;
                btn.innerHTML = '<i class="ph ph-circle-notch animate-spin"></i> In corso...';
                btn.disabled = true;
                try {
                    UI.toast("Sincronizzazione in corso. Attendere, potrebbe richiedere del tempo...", "info", 5000);
                    const res = await Store.api("sync", "vald");
                    UI.toast(res?.message || "Sincronizzazione VALD completata con successo", "success", 6000);
                } catch (err) {
                    UI.toast(err.message || "Errore durante la sincronizzazione.", "error", 8000);
                } finally {
                    btn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Avvia Sync';
                    btn.disabled = false;
                }
            });
            
            document.getElementById("vald-link-search").addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll(".vald-link-row").forEach(row => {
                    const text = row.dataset.search.toLowerCase();
                    row.style.display = text.includes(term) ? "table-row" : "none";
                });
            });
        }

        const modal = document.getElementById("vald-link-modal");
        const loader = document.getElementById("vald-link-loader");
        const container = document.getElementById("vald-link-container");
        const tbody = document.getElementById("vald-link-tbody");
        const countSpan = document.getElementById("vald-link-count");

        modal.style.display = "flex";
        loader.style.display = "flex";
        container.style.display = "none";
        countSpan.style.display = "none";
        
        try {
            const data = await Store.api("valdAthletes", "vald");
            
            const valdAthletes = data.valdAthletes || [];
            const erpAthletes = data.erpAthletes || [];

            if(valdAthletes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="2" style="padding:30px; text-align:center; color:rgba(255,255,255,0.5);">Nessun atleta trovato su VALD Hub.</td></tr>`;
            } else {
                let suggestedCount = 0;
                let autoLinksPayload = [];

                tbody.innerHTML = valdAthletes.map(va => {
                    // Pre-select the linked athlete, or fallback to the suggested one
                    const mappedId = va.linked_erp_id || va.suggested_erp_id || "";
                    const searchStr = `${va.vald_name} ${va.vald_category || ''}`;
                    
                    if (va.suggested_erp_id && !va.linked_erp_id) {
                        suggestedCount++;
                        autoLinksPayload.push({ athlete_id: va.suggested_erp_id, vald_profile_id: va.vald_id });
                    }
                    
                    const optionsHtml = erpAthletes.map(erp => {
                        const isSelected = String(erp.id) === String(mappedId) ? "selected" : "";
                        return `<option value="${erp.id}" ${isSelected}>${Utils.escapeHtml(erp.name || erp.full_name || '')}</option>`;
                    }).join("");

                    return `
                        <tr class="vald-link-row" data-search="${searchStr.replace(/"/g, '')}" style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="padding:16px;">
                                <div style="font-weight:600; color:var(--color-white);">${Utils.escapeHtml(va.vald_name)}</div>
                                <div style="font-size:12px; color:rgba(255,255,255,0.4);"><i class="ph ph-shield-star"></i> ${Utils.escapeHtml(va.vald_category || 'Nessuna Categoria / Team')}</div>
                            </td>
                            <td style="padding:16px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <select class="form-input vald-erp-select" data-vald-id="${Utils.escapeHtml(va.vald_id)}" style="flex:1; background:rgba(0,0,0,0.2); font-size:14px; border:1px solid rgba(255,255,255,0.1);">
                                        <option value="">-- Nessun atleta collegato --</option>
                                        ${optionsHtml}
                                    </select>
                                    <button class="btn ${va.linked_erp_id ? 'btn-ghost' : 'btn-primary'} btn-sm save-link-btn" title="Salva Collegamento" style="${va.linked_erp_id ? 'display:none; color:var(--color-success);' : 'display:flex; padding:6px 12px;'}">${va.linked_erp_id ? '<i class="ph ph-check" style="font-size:18px;"></i>' : 'Collega'}</button>
                                </div>
                                ${va.suggested_erp_id && !va.linked_erp_id ? '<div style="font-size:11px; color:var(--color-warning); margin-top:4px;">Suggerimento automatico rilevato</div>' : ''}
                            </td>
                        </tr>
                    `;
                }).join("");
                
                countSpan.textContent = `${valdAthletes.length} su Hub`;
                countSpan.style.display = "inline-flex";

                const acceptBtn = document.getElementById("accept-all-suggestions-btn");
                if (suggestedCount > 0) {
                    let suggSpan = document.getElementById("suggestions-count");
                    if (!suggSpan) {
                        acceptBtn.innerHTML = '<i class="ph ph-magic-wand"></i> Accetta <span id="suggestions-count">0</span> suggerimenti';
                        suggSpan = document.getElementById("suggestions-count");
                    }
                    suggSpan.textContent = suggestedCount;
                    acceptBtn.style.display = "inline-flex";
                    
                    acceptBtn.onclick = async () => {
                        acceptBtn.innerHTML = '<div class="loader-spinner" style="width:14px;height:14px;"></div>';
                        try {
                            // Manda i dati direttamente come array piatto per matchare l'API PHP cachata
                            let totalSaved = 0;
                            const chunkSize = 10;
                            for (let i = 0; i < autoLinksPayload.length; i += chunkSize) {
                                const chunk = autoLinksPayload.slice(i, i + chunkSize);
                                // The backend expects an array of objects: [{athlete_id: "...", vald_profile_id: "..."}]
                                const result = await Store.api("linkAthlete", "vald", chunk);
                                if (result?.saved > 0) totalSaved += result.saved;
                            }
                            
                            if (totalSaved === 0) {
                                UI.toast(`Errore di collegamento. Controlla la diagnostica o i log.`, "error", 8000);
                            } else {
                                UI.toast(`✔ ${totalSaved} atleti collegati in automatico!`, "success", 2000);
                            }
                            acceptBtn.style.display = "none";
                            // Reload modal
                            openModal(onClose);
                        } catch (e) {
                            UI.toast(e.message, "error");
                            acceptBtn.innerHTML = `<i class="ph ph-magic-wand"></i> Accetta <span id="suggestions-count">${suggestedCount}</span> suggerimenti`;
                        }
                    };
                } else {
                    acceptBtn.style.display = "none";
                }

                // Add listeners to selects
                document.querySelectorAll(".vald-erp-select").forEach(sel => {
                    const originalValue = sel.value;
                    const row = sel.closest('tr');
                    const saveBtn = row.querySelector('.save-link-btn');
                    
                    sel.addEventListener("change", () => {
                        if(sel.value !== originalValue) {
                            saveBtn.style.display = "flex";
                        } else {
                            saveBtn.style.display = "none";
                        }
                    });

                    saveBtn.addEventListener("click", async () => {
                        const erpId = sel.value;
                        const valdId = sel.dataset.valdId;
                        
                        saveBtn.innerHTML = '<div class="loader-spinner" style="width:14px;height:14px;"></div>';
                        try {
                            const payload = [{ athlete_id: erpId, vald_profile_id: valdId }]; // Array piatto!
                            const result = await Store.api("linkAthlete", "vald", payload);
                            if (result?.saved > 0) {
                                UI.toast("Collegamento salvato con successo!", "success", 2000);
                                saveBtn.innerHTML = '<i class="ph ph-check" style="font-size:18px;"></i>';
                                saveBtn.style.display = "none";
                            } else {
                                UI.toast("Errore salvataggio: l'API ha restituito 0", "warning", 3000);
                                saveBtn.innerHTML = 'Riprova';
                            }
                        } catch (e) {
                            UI.toast(e.message, "error");
                            saveBtn.innerHTML = '<i class="ph ph-check" style="font-size:18px;"></i>';
                        }
                    });
                });
            }

            loader.style.display = "none";
            container.style.display = "block";
            
        } catch (e) {
            loader.style.display = "none";
            container.style.display = "block";
            tbody.innerHTML = `<tr><td colspan="2" style="padding:30px; text-align:center; color:#ef4444;">Errore: ${Utils.escapeHtml(e.message)}</td></tr>`;
        }
    }

    return {
        openModal
    };

})();
