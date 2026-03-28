"use strict";

const Network = (() => {
  let _abort = new AbortController();
  let _currentTab = "collaborazioni";
  let _collaborations = [];
  let _trials = [];
  let _activities = [];
  let _hubConfig = { text: "", logo_path: "" };
  let _colFilterStatus = "";
  let _trialFilterStatus = "";

  const PARTNER_TYPES = ["club", "agenzia", "istituzione", "sponsor", "altro"];
  const COL_STATUSES = ["attivo", "scaduto", "in_rinnovo"];
  const TRIAL_STATUSES = ["in_valutazione", "approvato", "non_idoneo", "da_ricontattare"];

  const TRIAL_STATUS_MAP = {
    in_valutazione: "In Valutazione",
    approvato: "Approvato",
    non_idoneo: "Non Idoneo",
    da_ricontattare: "Da Ricontattare",
  };
  const COL_STATUS_MAP = { attivo: "Attivo", scaduto: "Scaduto", in_rinnovo: "In Rinnovo" };

  /**
   * Helper per ottenere il segnale dell'AbortController corrente.
   */
  function sig() {
    return { signal: _abort.signal };
  }

  /**
   * Renderizza un badge di stato con classi stilizzate.
   */
  function renderStatusBadge(status, context = "trial") {
    const safeStatus = CSS.escape ? CSS.escape(status) : status;
    const label = (context === "col" ? COL_STATUS_MAP : TRIAL_STATUS_MAP)[status] || status;
    return `<span class="status-badge status-badge-${safeStatus}">${Utils.escapeHtml(label)}</span>`;
  }

  /**
   * Renderizza il tab attualmente selezionato.
   */
  async function renderActiveTab() {
    const container = document.getElementById("net-tab-content");
    if (!container) return;

    const renderMap = {
      collaborazioni: renderCollaborations,
      prove: renderTrials,
      attivita: renderActivities
    };

    const renderFn = renderMap[_currentTab];
    if (renderFn) {
      container.innerHTML = ""; // Pulizia immediata
      renderFn(container);
    }
  }

  /**
   * TAB: COLLABORAZIONI
   */
  function renderCollaborations(container) {
    const isSpecialUser = ["admin", "manager"].includes(App.getUser()?.role);
    const filteredCols = _colFilterStatus 
      ? _collaborations.filter(c => c.status === _colFilterStatus) 
      : _collaborations;

    const hubBanner = `
        <div style="background:var(--color-bg-alt);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:var(--sp-4);margin-bottom:var(--sp-3);">
            <div style="display:flex;align-items:flex-start;gap:var(--sp-4)">
                ${_hubConfig.logo_path 
                  ? `<img src="${Utils.escapeHtml(_hubConfig.logo_path)}" style="height:100px;width:100px;object-fit:contain;border-radius:var(--radius-sm);background:#fff;padding:8px;flex-shrink:0;box-shadow:0 2px 4px rgba(0,0,0,0.05);">` 
                  : `<div style="height:100px;width:100px;border-radius:var(--radius-sm);background:var(--color-border);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)"><i class="ph ph-image" style="font-size:32px;"></i></div>`}
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                        <h3 style="margin:0;font-size:20px;font-weight:600;">Savino del bene volley HUB</h3>
                        ${isSpecialUser ? `<button class="btn-dash" id="net-edit-hub" type="button"><i class="ph ph-pencil-simple"></i> Modifica</button>` : ""}
                    </div>
                    <div style="margin:0;font-size:14px;color:var(--color-text-muted);line-height:1.6;">${_hubConfig.text ? Utils.escapeHtml(_hubConfig.text).replace(/\\n/g, "<br>") : "Nessun testo inserito."}</div>
                </div>
            </div>
        </div>`;

    container.innerHTML = `
        <div>
            ${hubBanner}
            <div class="net-filter-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                    <button class="dash-filter ${!_colFilterStatus ? "active" : ""}" data-col-status="" type="button">Tutte</button>
                    ${COL_STATUSES.map(s => `
                        <button class="dash-filter ${_colFilterStatus === s ? "active" : ""}" data-col-status="${Utils.escapeHtml(s)}" type="button">
                            ${Utils.escapeHtml(COL_STATUS_MAP[s] || s)}
                        </button>`).join("")}
                </div>
                ${isSpecialUser ? '<button class="btn-dash pink" id="net-add-col" type="button"><i class="ph ph-plus"></i> NUOVA COLLABORAZIONE</button>' : ""}
            </div>
            <div class="net-card-grid">
                ${filteredCols.length === 0 
                  ? Utils.emptyState("Nessuna collaborazione", "Aggiungi la prima collaborazione con il pulsante in alto.") 
                  : filteredCols.map(c => `
                        <div class="dash-card collab-card" data-open-col="${Utils.escapeHtml(c.id)}" style="cursor:pointer">
                            <div class="net-card-header">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    ${c.logo_path 
                                      ? `<img src="${Utils.escapeHtml(c.logo_path)}" style="height:40px; width:40px; object-fit:contain; border-radius:var(--radius-sm); background:#fff; padding:2px; flex-shrink:0;">` 
                                      : ""}
                                    <div class="net-card-title" style="margin:0;">${Utils.escapeHtml(c.partner_name)}</div>
                                </div>
                                ${renderStatusBadge(c.status, "col")}
                            </div>
                            <div class="net-card-meta">
                                <i class="ph ph-tag" style="margin-right:4px"></i>${Utils.escapeHtml(c.partner_type || "—")}
                                ${c.agreement_type ? ` · <em>${Utils.escapeHtml(c.agreement_type)}</em>` : ""}
                            </div>
                            ${c.referent_name ? `<div class="net-card-meta"><i class="ph ph-user" style="margin-right:4px"></i>${Utils.escapeHtml(c.referent_name)}</div>` : ""}
                            ${c.start_date || c.end_date ? `
                                <div class="net-card-meta">
                                    <i class="ph ph-calendar" style="margin-right:4px"></i>
                                    ${c.start_date || ""} → ${c.end_date || "∞"}
                                </div>` : ""}
                            ${isSpecialUser ? `
                                <div style="display:flex;gap:4px;margin-top:var(--sp-1)">
                                    <button class="btn-dash btn-edit-col" data-id="${Utils.escapeHtml(c.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn-dash btn-del-col" data-id="${Utils.escapeHtml(c.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ""}
                        </div>`).join("")}
            </div>
        </div>`;

    // --- EVENT LISTENERS (DELEGATION) ---
    const grid = container.querySelector(".net-card-grid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-col");
        if (editBtn) {
          e.stopPropagation();
          const id = editBtn.dataset.id;
          renderCollaborationModal(_collaborations.find(c => c.id === id));
          return;
        }

        const delBtn = e.target.closest(".btn-del-col");
        if (delBtn) {
          e.stopPropagation();
          const id = delBtn.dataset.id;
          handleDeleteCollaboration(id);
          return;
        }

        const card = e.target.closest(".collab-card");
        if (card) {
          const id = card.dataset.openCol;
          showCollaborationDetail(id);
        }
      }, sig());
    }

    container.querySelectorAll("[data-col-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        _colFilterStatus = btn.dataset.colStatus;
        renderCollaborations(container);
      }, sig());
    });

    container.querySelector("#net-add-col")?.addEventListener("click", () => renderCollaborationModal(null), sig());
    container.querySelector("#net-edit-hub")?.addEventListener("click", renderHubEditModal, sig());
  }

  /**
   * TAB: PROVE (ATLETI)
   */
  function renderTrials(container) {
    const isSpecialUser = ["admin", "manager"].includes(App.getUser()?.role);
    const filteredTrials = _trialFilterStatus 
      ? _trials.filter(t => t.status === _trialFilterStatus) 
      : _trials;

    container.innerHTML = `
        <div>
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">
                    <button class="dash-filter ${!_trialFilterStatus ? "active" : ""}" data-tr-status="" type="button">Tutti</button>
                    ${TRIAL_STATUSES.map(s => `
                        <button class="dash-filter ${_trialFilterStatus === s ? "active" : ""}" data-tr-status="${Utils.escapeHtml(s)}" type="button">
                            ${Utils.escapeHtml(TRIAL_STATUS_MAP[s] || s)}
                        </button>`).join("")}
                </div>
                ${isSpecialUser ? '<button class="btn-dash pink" id="net-add-trial" type="button"><i class="ph ph-plus"></i> NUOVO ATLETA</button>' : ""}
            </div>
            <div class="table-wrapper" style="overflow-x:auto">
                <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                    <thead>
                        <tr>
                            ${["Nome", "Provenienza", "Posizione", "Prova", "Stato", "Score", ""].map(h => `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${h}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody id="trial-tbody">
                        ${filteredTrials.length === 0 
                          ? '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta in prova</td></tr>' 
                          : filteredTrials.map(t => {
                              const score = t.avg_score ? parseFloat(t.avg_score).toFixed(1) : null;
                              return `
                                <tr>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(t.full_name || (t.athlete_first_name + " " + t.athlete_last_name))}</td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(t.origin_club || "—")}</td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(t.position || "—")}</td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${t.trial_start || "—"} → ${t.trial_end || "∞"}</td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${renderStatusBadge(t.status)}</td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                                        ${score ? `<div class="score-circle" style="--pct:${(score / 10 * 100).toFixed(1)}" title="Media valutazioni">${score}</div>` : '<span style="color:var(--color-text-muted);font-size:12px">—</span>'}
                                    </td>
                                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;text-align:right">
                                        ${isSpecialUser ? `
                                            <button class="btn-dash btn-eval-trial" data-id="${Utils.escapeHtml(t.id)}" type="button" title="Valuta"><i class="ph ph-star"></i></button>
                                            <button class="btn-dash btn-edit-trial" data-id="${Utils.escapeHtml(t.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                                            ${t.scouting_profile_id 
                                              ? `<span title="Profilo scouting: ${Utils.escapeHtml(t.scouting_profile_id)}" style="font-size:12px;color:var(--color-success);display:inline-block;margin:0 8px;"><i class="ph ph-check-circle"></i></span>` 
                                              : `<button class="btn btn-ghost btn-sm btn-convert-trial" data-id="${Utils.escapeHtml(t.id)}" type="button" title="Converti in Scouting"><i class="ph ph-arrow-right"></i></button>`}
                                            <button class="btn-dash btn-del-trial" data-id="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)" title="Elimina"><i class="ph ph-trash"></i></button>` : ""}
                                    </td>
                                </tr>`;
                          }).join("")}
                    </tbody>
                </table>
            </div>
        </div>`;

    // --- EVENT LISTENERS ---
    container.querySelectorAll("[data-tr-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        _trialFilterStatus = btn.dataset.trStatus;
        renderTrials(container);
      }, sig());
    });

    const tbody = container.querySelector("#trial-tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const id = e.target.closest("button")?.dataset.id;
        if (!id) return;

        if (e.target.closest(".btn-eval-trial")) showEvaluationModal(id);
        else if (e.target.closest(".btn-edit-trial")) renderTrialModal(_trials.find(t => t.id === id));
        else if (e.target.closest(".btn-convert-trial")) handleConvertToScouting(id);
        else if (e.target.closest(".btn-del-trial")) handleDeleteTrial(id);
      }, sig());
    }

    container.querySelector("#net-add-trial")?.addEventListener("click", () => renderTrialModal(null), sig());
  }

  /**
   * TAB: ATTIVITÀ
   */
  function renderActivities(container) {
    const isSpecialUser = ["admin", "manager"].includes(App.getUser()?.role);

    container.innerHTML = `
        <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
                <div class="input-wrapper" style="position:relative;min-width:220px">
                    <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                    <input type="text" id="net-act-search" class="form-input" placeholder="Cerca attività..." style="padding-left:36px;height:40px;font-size:13px">
                </div>
                ${isSpecialUser ? '<button class="btn-dash pink" id="net-add-act" type="button"><i class="ph ph-plus"></i> NUOVA ATTIVITÀ</button>' : ""}
            </div>
            <div class="net-timeline" id="net-timeline">
                ${_activities.length === 0 
                  ? Utils.emptyState("Nessuna attività", "Registra la prima attività di network.") 
                  : _activities.map(a => `
                        <div class="net-timeline-item" data-act-title="${Utils.escapeHtml((a.title || "").toLowerCase())}">
                            <div class="net-timeline-dot"></div>
                            <div style="min-width:90px;padding-top:2px">
                                <span class="net-timeline-date">${a.date || ""}</span>
                            </div>
                            <div class="net-timeline-content">
                                <div class="net-timeline-title">${Utils.escapeHtml(a.title)}</div>
                                <div class="net-timeline-meta">
                                    ${a.activity_type ? Utils.escapeHtml(a.activity_type) + (a.location ? " · " : "") : ""}
                                    ${a.location ? Utils.escapeHtml(a.location) : ""}
                                </div>
                                ${a.outcome ? `<div style="font-size:12px;margin-top:4px;color:var(--color-text-muted)">${Utils.escapeHtml(a.outcome)}</div>` : ""}
                            </div>
                            ${isSpecialUser ? `
                                <div style="display:flex;gap:4px;align-self:flex-start;padding-top:2px">
                                    <button class="btn-dash btn-edit-act" data-id="${Utils.escapeHtml(a.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="btn-dash btn-del-act" data-id="${Utils.escapeHtml(a.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                                </div>` : ""}
                        </div>`).join("")}
            </div>
        </div>`;

    container.querySelector("#net-act-search")?.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      container.querySelectorAll("[data-act-title]").forEach(item => {
        item.style.display = item.dataset.actTitle.includes(q) ? "" : "none";
      });
    }, sig());

    const timeline = container.querySelector("#net-timeline");
    if (timeline) {
      timeline.addEventListener("click", (e) => {
        const id = e.target.closest("button")?.dataset.id;
        if (!id) return;
        if (e.target.closest(".btn-edit-act")) renderActivityModal(_activities.find(a => a.id === id));
        else if (e.target.closest(".btn-del-act")) handleDeleteActivity(id);
      }, sig());
    }

    container.querySelector("#net-add-act")?.addEventListener("click", () => renderActivityModal(null), sig());
  }

  /**
   * MODALS & OPERATIONS
   */

  function showCollaborationDetail(id) {
    const col = _collaborations.find(c => c.id === id);
    if (!col) return;

    const modal = UI.modal({
      title: Utils.escapeHtml(col.partner_name),
      body: `
        <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
            <div style="display:flex;gap:var(--sp-2);align-items:center;justify-content:space-between">
                <div style="display:flex;gap:var(--sp-2);align-items:center">
                    ${renderStatusBadge(col.status, "col")}
                    <span style="font-size:13px;color:var(--color-text-muted)">${Utils.escapeHtml(col.partner_type || "")}</span>
                </div>
                ${col.logo_path ? `<img src="${col.logo_path}" style="height:40px;object-fit:contain;border-radius:var(--radius-sm)">` : ""}
            </div>
            ${col.agreement_type ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Accordo</span><div style="font-weight:600">${Utils.escapeHtml(col.agreement_type)}</div></div>` : ""}
            ${col.start_date || col.end_date ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Periodo</span><div>${col.start_date || "?"} → ${col.end_date || "∞"}</div></div>` : ""}
            ${col.referent_name ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Referente</span><div>${Utils.escapeHtml(col.referent_name)} ${col.referent_contact ? "· " + Utils.escapeHtml(col.referent_contact) : ""}</div></div>` : ""}
            ${col.description ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Descrizione</span><div style="font-size:13px">${Utils.escapeHtml(col.description).replace(/\n/g, "<br>")}</div></div>` : ""}
            ${col.notes ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Note interne</span><div style="font-size:13px">${Utils.escapeHtml(col.notes)}</div></div>` : ""}
            ${col.website || col.instagram || col.facebook || col.youtube ? `<div style="display:flex;gap:12px;align-items:center;padding-top:var(--sp-2);border-top:1px solid var(--color-border)">
                ${col.website ? `<a href="${Utils.escapeHtml(col.website.startsWith("http") ? col.website : "https://" + col.website)}" target="_blank" style="color:var(--color-text-muted);font-size:22px"><i class="ph ph-globe"></i></a>` : ""}
                ${col.instagram ? `<a href="${Utils.escapeHtml(col.instagram.startsWith("http") ? col.instagram : "https://instagram.com/" + col.instagram.replace("@", ""))}" target="_blank" style="color:var(--color-pink);font-size:22px"><i class="ph ph-instagram-logo"></i></a>` : ""}
                ${col.facebook ? `<a href="${Utils.escapeHtml(col.facebook.startsWith("http") ? col.facebook : "https://" + col.facebook)}" target="_blank" style="color:#1877F2;font-size:22px"><i class="ph ph-facebook-logo"></i></a>` : ""}
                ${col.youtube ? `<a href="${Utils.escapeHtml(col.youtube.startsWith("http") ? col.youtube : "https://youtube.com/" + col.youtube)}" target="_blank" style="color:#FF0000;font-size:22px"><i class="ph ph-youtube-logo"></i></a>` : ""}
            </div>` : ""}
            <div id="col-docs-area" style="margin-top:var(--sp-3)">
                <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:var(--sp-1)">Documenti Allegati</span>
                <div id="col-docs-list" style="font-size:13px;display:flex;flex-direction:column;gap:4px">Caricamento...</div>
            </div>
        </div>`,
      footer: '<button class="btn-dash" id="cod-close" type="button">Chiudi</button>'
    });

    document.getElementById("cod-close")?.addEventListener("click", () => modal.close());

    // Carica documenti
    Store.get("listColDocuments", "network", { collaboration_id: col.id })
      .then(docs => {
        const el = document.getElementById("col-docs-list");
        if (!el) return;
        if (docs.length === 0) {
          el.innerHTML = '<span style="color:var(--color-text-muted);font-style:italic">Nessun documento</span>';
          return;
        }
        el.innerHTML = docs.map(d => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px;background:var(--color-bg-alt);border-radius:var(--radius-sm)">
            <span style="display:flex;align-items:center;gap:6px">
              <i class="ph ph-file-text" style="color:var(--color-primary)"></i>
              ${Utils.escapeHtml(d.file_name)}
              ${d.doc_type ? `<small class="badge badge-sm">${Utils.escapeHtml(d.doc_type)}</small>` : ""}
            </span>
            <a href="api/?module=network&action=downloadColDocument&docId=${d.id}" target="_blank" class="btn-dash" style="height:24px;width:24px;padding:0;display:flex;align-items:center;justify-content:center"><i class="ph ph-download-simple"></i></a>
          </div>`).join("");
      }).catch(err => {
        const el = document.getElementById("col-docs-list");
        if (el) el.innerHTML = `<span style="color:var(--color-pink)">Errore: ${err.message}</span>`;
      });
  }

  async function handleDeleteCollaboration(id) {
    const col = _collaborations.find(c => c.id === id);
    if (!col) return;
    UI.confirm(`Eliminare la collaborazione con <strong>${Utils.escapeHtml(col.partner_name)}</strong>?`, async () => {
      try {
        await Store.api("deleteCollaboration", "network", { id });
        _collaborations = _collaborations.filter(c => c.id !== id);
        UI.toast("Collaborazione eliminata", "success");
        renderActiveTab();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
      }
    });
  }

  function renderHubEditModal() {
    const modal = UI.modal({
      title: "Modifica HUB Savino del Bene",
      body: `
        <div class="form-group">
            <label class="form-label" for="hub-text">Testo HUB</label>
            <textarea id="hub-text" class="form-input" rows="5">${Utils.escapeHtml(_hubConfig.text || "")}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label">Nuovo Logo</label>
            <input type="file" id="hub-logo-input" class="form-input" accept="image/*">
        </div>
        <div id="hub-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="hub-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="hub-save" type="button">SALVA</button>`
    });

    document.getElementById("hub-cancel")?.addEventListener("click", () => modal.close());
    document.getElementById("hub-save")?.addEventListener("click", async () => {
      const btn = document.getElementById("hub-save");
      btn.disabled = true;
      btn.textContent = "Salvataggio...";
      try {
        const text = document.getElementById("hub-text").value;
        await Store.api("updateHubText", "network", { text });
        
        const file = document.getElementById("hub-logo-input").files[0];
        if (file) {
          const fd = new FormData();
          fd.append("logo", file);
          await Store.api("uploadHubLogo", "network", fd);
        }

        _hubConfig = await Store.get("getHubConfig", "network");
        UI.toast("HUB aggiornato", "success");
        renderActiveTab();
        modal.close();
      } catch (err) {
        const errEl = document.getElementById("hub-error");
        if (errEl) {
          errEl.textContent = err.message;
          errEl.classList.remove("hidden");
        }
        btn.disabled = false;
        btn.textContent = "SALVA";
      }
    });
  }

  function renderCollaborationModal(col) {
    const isEdit = !!col;
    const typeOpts = PARTNER_TYPES.map(t => `<option value="${t}" ${col?.partner_type === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("");
    const statusOpts = COL_STATUSES.map(s => `<option value="${s}" ${col?.status === s ? "selected" : ""}>${COL_STATUS_MAP[s] || s}</option>`).join("");

    const modal = UI.modal({
      title: isEdit ? "Modifica Collaborazione" : "Nuova Collaborazione",
      body: `
        <div class="form-group">
            <label class="form-label" for="cl-name">Partner *</label>
            <input id="cl-name" class="form-input" type="text" value="${Utils.escapeHtml(col?.partner_name || "")}" placeholder="Nome club/agenzia...">
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="cl-type">Tipo</label>
                <select id="cl-type" class="form-select">${typeOpts}</select>
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-status">Stato</label>
                <select id="cl-status" class="form-select">${statusOpts}</select>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="cl-agreement">Tipo accordo</label>
            <input id="cl-agreement" class="form-input" type="text" value="${Utils.escapeHtml(col?.agreement_type || "")}" placeholder="es. Prestito, Affiliazione…">
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="cl-start">Data Inizio</label>
                <input id="cl-start" class="form-input" type="date" value="${col?.start_date?.substring(0, 10) || ""}">
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-end">Data Fine</label>
                <input id="cl-end" class="form-input" type="date" value="${col?.end_date?.substring(0, 10) || ""}">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="cl-ref-name">Referente</label>
                <input id="cl-ref-name" class="form-input" type="text" value="${Utils.escapeHtml(col?.referent_name || "")}">
            </div>
            <div class="form-group">
                <label class="form-label" for="cl-ref-contact">Contatto</label>
                <input id="cl-ref-contact" class="form-input" type="text" value="${Utils.escapeHtml(col?.referent_contact || "")}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Media & Documenti</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)">
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Logo Aziendale</label>
                    <input id="cl-logo-file" class="form-input" type="file" accept="image/*">
                </div>
                <div>
                    <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Allegato Contratto (PDF)</label>
                    <input id="cl-contract-file" class="form-input" type="file" accept=".pdf">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Social & Web</label>
            <div class="form-grid">
                <div class="input-wrapper" style="position:relative">
                    <i class="ph ph-globe" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--color-text-muted)"></i>
                    <input id="cl-website" class="form-input" style="padding-left:32px" type="text" value="${Utils.escapeHtml(col?.website || "")}" placeholder="Sito Web">
                </div>
                <div class="input-wrapper" style="position:relative">
                    <i class="ph ph-instagram-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--color-pink)"></i>
                    <input id="cl-instagram" class="form-input" style="padding-left:32px" type="text" value="${Utils.escapeHtml(col?.instagram || "")}" placeholder="Instagram URL o @handle">
                </div>
                <div class="input-wrapper" style="position:relative">
                    <i class="ph ph-facebook-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#1877F2"></i>
                    <input id="cl-facebook" class="form-input" style="padding-left:32px" type="text" value="${Utils.escapeHtml(col?.facebook || "")}" placeholder="Facebook URL">
                </div>
                <div class="input-wrapper" style="position:relative">
                    <i class="ph ph-youtube-logo" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#FF0000"></i>
                    <input id="cl-youtube" class="form-input" style="padding-left:32px" type="text" value="${Utils.escapeHtml(col?.youtube || "")}" placeholder="YouTube URL">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="cl-description">Descrizione Attività</label>
            <textarea id="cl-description" class="form-input" rows="4" placeholder="Descrivi il partner e le attività svolte...">${Utils.escapeHtml(col?.description || "")}</textarea>
        </div>
        <div class="form-group">
            <label class="form-label" for="cl-notes">Note Interne</label>
            <textarea id="cl-notes" class="form-input" rows="2">${Utils.escapeHtml(col?.notes || "")}</textarea>
        </div>
        <div id="cl-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="cl-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="cl-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`
    });

    document.getElementById("cl-cancel")?.addEventListener("click", () => modal.close());
    document.getElementById("cl-save")?.addEventListener("click", async () => {
      const name = document.getElementById("cl-name").value.trim();
      const errEl = document.getElementById("cl-error");
      if (!name) {
        errEl.textContent = "Il nome è obbligatorio";
        errEl.classList.remove("hidden");
        return;
      }

      const saveBtn = document.getElementById("cl-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvataggio...";

      try {
        const data = {
          partner_name: name,
          partner_type: document.getElementById("cl-type").value,
          status: document.getElementById("cl-status").value,
          agreement_type: document.getElementById("cl-agreement").value || null,
          start_date: document.getElementById("cl-start").value || null,
          end_date: document.getElementById("cl-end").value || null,
          referent_name: document.getElementById("cl-ref-name").value || null,
          referent_contact: document.getElementById("cl-ref-contact").value || null,
          notes: document.getElementById("cl-notes").value || null,
          website: document.getElementById("cl-website").value || null,
          instagram: document.getElementById("cl-instagram").value || null,
          facebook: document.getElementById("cl-facebook").value || null,
          youtube: document.getElementById("cl-youtube").value || null,
          description: document.getElementById("cl-description").value || null
        };

        let colId = col?.id;
        if (isEdit) {
          await Store.api("updateCollaboration", "network", { id: colId, ...data });
        } else {
          const res = await Store.api("createCollaboration", "network", data);
          colId = res.id;
        }

        // Upload files
        const logo = document.getElementById("cl-logo-file").files[0];
        if (logo) {
          const fd = new FormData();
          fd.append("collaboration_id", colId);
          fd.append("logo", logo);
          await Store.api("uploadColLogo", "network", fd);
        }

        const contract = document.getElementById("cl-contract-file").files[0];
        if (contract) {
          const fd = new FormData();
          fd.append("collaboration_id", colId);
          fd.append("doc_type", "contratto");
          fd.append("file", contract);
          await Store.api("uploadColDocument", "network", fd);
        }

        _collaborations = await Store.get("listCollaborations", "network");
        UI.toast(isEdit ? "Aggiornato" : "Creato", "success");
        renderActiveTab();
        modal.close();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "SALVA" : "CREA";
      }
    });
  }

  function renderTrialModal(trial) {
    const isEdit = !!trial;
    const statusOpts = TRIAL_STATUSES.map(s => `<option value="${s}" ${trial?.status === s ? "selected" : ""}>${TRIAL_STATUS_MAP[s] || s}</option>`).join("");

    const modal = UI.modal({
      title: isEdit ? "Modifica Atleta in Prova" : "Nuovo Atleta in Prova",
      body: `
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="tr-first">Nome *</label>
                <input id="tr-first" class="form-input" type="text" value="${Utils.escapeHtml(trial?.athlete_first_name || "")}">
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-last">Cognome *</label>
                <input id="tr-last" class="form-input" type="text" value="${Utils.escapeHtml(trial?.athlete_last_name || "")}">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="tr-dob">Data di nascita</label>
                <input id="tr-dob" class="form-input" type="date" value="${trial?.birth_date?.substring(0, 10) || ""}">
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-nat">Nazionalità</label>
                <input id="tr-nat" class="form-input" type="text" value="${Utils.escapeHtml(trial?.nationality || "")}">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="tr-pos">Posizione</label>
                <input id="tr-pos" class="form-input" type="text" value="${Utils.escapeHtml(trial?.position || "")}" placeholder="es. Alzatore">
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-club">Club di provenienza</label>
                <input id="tr-club" class="form-input" type="text" value="${Utils.escapeHtml(trial?.origin_club || "")}">
            </div>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="tr-start">Inizio prova</label>
                <input id="tr-start" class="form-input" type="date" value="${trial?.trial_start?.substring(0, 10) || ""}">
            </div>
            <div class="form-group">
                <label class="form-label" for="tr-end">Fine prova</label>
                <input id="tr-end" class="form-input" type="date" value="${trial?.trial_end?.substring(0, 10) || ""}">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="tr-status">Stato</label>
            <select id="tr-status" class="form-select">${statusOpts}</select>
        </div>
        <div class="form-group">
            <label class="form-label" for="tr-notes">Note</label>
            <textarea id="tr-notes" class="form-input" rows="2">${Utils.escapeHtml(trial?.notes || "")}</textarea>
        </div>
        <div id="tr-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="tr-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="tr-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`
    });

    document.getElementById("tr-cancel")?.addEventListener("click", () => modal.close());
    document.getElementById("tr-save")?.addEventListener("click", async () => {
      const first = document.getElementById("tr-first").value.trim();
      const last = document.getElementById("tr-last").value.trim();
      const errEl = document.getElementById("tr-error");
      if (!first || !last) {
        errEl.textContent = "Nome e cognome obbligatori";
        errEl.classList.remove("hidden");
        return;
      }

      const saveBtn = document.getElementById("tr-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvataggio...";

      try {
        const data = {
          athlete_first_name: first,
          athlete_last_name: last,
          birth_date: document.getElementById("tr-dob").value || null,
          nationality: document.getElementById("tr-nat").value || null,
          position: document.getElementById("tr-pos").value || null,
          origin_club: document.getElementById("tr-club").value || null,
          trial_start: document.getElementById("tr-start").value || null,
          trial_end: document.getElementById("tr-end").value || null,
          status: document.getElementById("tr-status").value || "in_valutazione",
          notes: document.getElementById("tr-notes").value || null
        };

        if (isEdit) {
          await Store.api("updateTrial", "network", { id: trial.id, ...data });
        } else {
          await Store.api("createTrial", "network", data);
        }

        _trials = await Store.get("listTrials", "network");
        UI.toast(isEdit ? "Atleta aggiornato" : "Atleta aggiunto", "success");
        renderActiveTab();
        modal.close();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "SALVA" : "CREA";
      }
    });
  }

  function showEvaluationModal(trialId) {
    const dimensions = [
      { key: "score_technical", label: "Tecnica" },
      { key: "score_tactical", label: "Tattica" },
      { key: "score_physical", label: "Fisico" },
      { key: "score_mental", label: "Mental" },
      { key: "score_potential", label: "Potenziale" }
    ];

    const modal = UI.modal({
      title: "Scheda di Valutazione",
      body: `
        <div class="form-group">
            <label class="form-label" for="ev-date">Data Valutazione *</label>
            <input id="ev-date" class="form-input" type="date" value="${new Date().toISOString().substring(0, 10)}">
        </div>
        <div style="margin:var(--sp-3) 0">
            ${dimensions.map(d => `
                <div class="eval-slider-row">
                    <span class="eval-slider-label">${Utils.escapeHtml(d.label)}</span>
                    <input type="range" class="eval-slider" id="ev-${d.key}" min="1" max="10" value="5">
                    <span class="eval-slider-value" id="ev-${d.key}-val">5</span>
                </div>`).join("")}
            <div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2);border-top:1px solid var(--color-border);padding-top:var(--sp-2)">
                <span style="font-size:13px;color:var(--color-text-muted)">Media:</span>
                <strong id="ev-avg-display" style="font-size:16px;color:var(--color-pink)">5.0</strong>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="ev-video">URL Video</label>
            <input id="ev-video" class="form-input" type="url" placeholder="https://...">
        </div>
        <div class="form-group">
            <label class="form-label" for="ev-notes">Note</label>
            <textarea id="ev-notes" class="form-input" rows="2"></textarea>
        </div>
        <div id="ev-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="ev-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="ev-save" type="button"><i class="ph ph-star"></i> SALVA</button>`
    });

    dimensions.forEach(d => {
      const input = document.getElementById("ev-" + d.key);
      const val = document.getElementById("ev-" + d.key + "-val");
      input?.addEventListener("input", () => {
        if (val) val.textContent = input.value;
        const total = dimensions.reduce((acc, dim) => acc + parseInt(document.getElementById("ev-" + dim.key).value), 0);
        const avg = total / dimensions.length;
        const disp = document.getElementById("ev-avg-display");
        if (disp) disp.textContent = avg.toFixed(1);
      });
    });

    document.getElementById("ev-cancel")?.addEventListener("click", () => modal.close());
    document.getElementById("ev-save")?.addEventListener("click", async () => {
      const date = document.getElementById("ev-date").value;
      if (!date) {
        const errEl = document.getElementById("ev-error");
        errEl.textContent = "Data obbligatoria";
        errEl.classList.remove("hidden");
        return;
      }

      const saveBtn = document.getElementById("ev-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvataggio...";

      try {
        const evData = {
          trial_id: trialId,
          eval_date: date,
          video_url: document.getElementById("ev-video").value || null,
          notes: document.getElementById("ev-notes").value || null
        };
        dimensions.forEach(d => {
          evData[d.key] = parseInt(document.getElementById("ev-" + d.key).value);
        });

        await Store.api("evaluateTrial", "network", evData);
        _trials = await Store.get("listTrials", "network");
        UI.toast("Valutazione salvata", "success");
        renderActiveTab();
        modal.close();
      } catch (err) {
        const errEl = document.getElementById("ev-error");
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = "SALVA";
      }
    });
  }

  async function handleConvertToScouting(id) {
    const trial = _trials.find(t => t.id === id);
    if (!trial) return;
    UI.confirm(`Convertire <strong>${Utils.escapeHtml(trial.full_name || (trial.athlete_first_name + " " + trial.athlete_last_name))}</strong> in scouting?`, async () => {
      try {
        await Store.api("convertToScouting", "network", { trial_id: id });
        _trials = await Store.get("listTrials", "network");
        UI.toast("Convertito in Scouting ✓", "success");
        renderActiveTab();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
      }
    });
  }

  async function handleDeleteTrial(id) {
    UI.confirm("Rimuovere definitivamente l'atleta in prova?", async () => {
      try {
        await Store.api("deleteTrial", "network", { id });
        _trials = _trials.filter(t => t.id !== id);
        UI.toast("Atleta rimosso", "success");
        renderActiveTab();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
      }
    });
  }

  function renderActivityModal(act) {
    const isEdit = !!act;
    const modal = UI.modal({
      title: isEdit ? "Modifica Attività" : "Nuova Attività",
      body: `
        <div class="form-group">
            <label class="form-label" for="ac-title">Titolo *</label>
            <input id="ac-title" class="form-input" type="text" value="${Utils.escapeHtml(act?.title || "")}" placeholder="es. Incontro con club...">
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label" for="ac-date">Data *</label>
                <input id="ac-date" class="form-input" type="date" value="${act?.date?.substring(0, 10) || ""}">
            </div>
            <div class="form-group">
                <label class="form-label" for="ac-type">Tipo</label>
                <input id="ac-type" class="form-input" type="text" value="${Utils.escapeHtml(act?.activity_type || "")}" placeholder="es. Riunione...">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="ac-loc">Luogo</label>
            <input id="ac-loc" class="form-input" type="text" value="${Utils.escapeHtml(act?.location || "")}">
        </div>
        <div class="form-group">
            <label class="form-label" for="ac-outcome">Esito</label>
            <input id="ac-outcome" class="form-input" type="text" value="${Utils.escapeHtml(act?.outcome || "")}" placeholder="es. Accordo raggiunto">
        </div>
        <div class="form-group">
            <label class="form-label" for="ac-notes">Note</label>
            <textarea id="ac-notes" class="form-input" rows="2">${Utils.escapeHtml(act?.notes || "")}</textarea>
        </div>
        <div id="ac-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="ac-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="ac-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`
    });

    document.getElementById("ac-cancel")?.addEventListener("click", () => modal.close());
    document.getElementById("ac-save")?.addEventListener("click", async () => {
      const title = document.getElementById("ac-title").value.trim();
      const date = document.getElementById("ac-date").value;
      if (!title || !date) {
        const errEl = document.getElementById("ac-error");
        errEl.textContent = "Titolo e data obbligatori";
        errEl.classList.remove("hidden");
        return;
      }
      const saveBtn = document.getElementById("ac-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvataggio...";

      try {
        const data = {
          title,
          date,
          activity_type: document.getElementById("ac-type").value || null,
          location: document.getElementById("ac-loc").value || null,
          outcome: document.getElementById("ac-outcome").value || null,
          notes: document.getElementById("ac-notes").value || null
        };

        if (isEdit) {
          await Store.api("updateActivity", "network", { id: act.id, ...data });
        } else {
          await Store.api("createActivity", "network", data);
        }

        _activities = await Store.get("listActivities", "network");
        UI.toast("Attività salvata", "success");
        renderActiveTab();
        modal.close();
      } catch (err) {
        const errEl = document.getElementById("ac-error");
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? "SALVA" : "CREA";
      }
    });
  }

  async function handleDeleteActivity(id) {
    UI.confirm("Eliminare questa attività?", async () => {
      try {
        await Store.api("deleteActivity", "network", { id });
        _activities = _activities.filter(a => a.id !== id);
        UI.toast("Attività eliminata", "success");
        renderActiveTab();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
      }
    });
  }

  return {
    destroy() {
      _abort.abort();
      _abort = new AbortController();
      _collaborations = [];
      _trials = [];
      _activities = [];
    },

    async init() {
      const app = document.getElementById("app");
      if (!app) return;

      UI.loading(true);
      app.innerHTML = UI.skeletonPage();

      try {
        [_collaborations, _trials, _activities, _hubConfig] = await Promise.all([
          Store.get("listCollaborations", "network").catch(() => []),
          Store.get("listTrials", "network").catch(() => []),
          Store.get("listActivities", "network").catch(() => []),
          Store.get("getHubConfig", "network").catch(() => ({ text: "", logo_path: "" }))
        ]);

        const currentRoute = Router.getCurrentRoute();
        _currentTab = currentRoute === "network-prove" ? "prove" : (currentRoute === "network-attivita" ? "attivita" : "collaborazioni");

        app.innerHTML = `
            <div class="transport-dashboard" style="min-height:100vh;">
                <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                    <div>
                        <h1 class="dash-title">Network</h1>
                        <p class="dash-subtitle" style="margin-top:4px;">Collaborazioni, atleti in prova e attività di rete</p>
                    </div>
                    <div class="dash-filters" style="margin-top: 16px;">
                        <button class="dash-filter net-main-tab" data-net-main-tab="collaborazioni" type="button">Collaborazioni</button>
                        <button class="dash-filter net-main-tab" data-net-main-tab="prove" type="button">Prove</button>
                        <button class="dash-filter net-main-tab" data-net-main-tab="attivita" type="button">Attività</button>
                    </div>
                </div>
                <main id="net-tab-content"></main>
            </div>`;

        app.querySelectorAll(".net-main-tab").forEach(btn => {
          if (btn.dataset.netMainTab === _currentTab) btn.classList.add("active");
          btn.addEventListener("click", () => {
            _currentTab = btn.dataset.netMainTab;
            app.querySelectorAll(".net-main-tab").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderActiveTab();
          }, sig());
        });

        renderActiveTab();
      } catch (err) {
        console.error("[Network] Init error:", err);
        app.innerHTML = Utils.emptyState("Errore caricamento", err.message);
      } finally {
        UI.loading(false);
      }
    }
  };
})();

window.Network = Network;
