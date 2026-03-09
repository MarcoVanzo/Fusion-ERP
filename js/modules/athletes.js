"use strict";
const Athletes = (() => {
  let moduleAbortController = new AbortController(),
    globalAthletesList = [],
    globalTeamsList = [],
    globalTeamFilter = "",
    globalActiveTab = "anagrafica",
    globalSelectedId = null;

  function formatTeamLabel(category, name) {
    let cat = (category || "").toUpperCase();
    return cat.match(/^U\d+$/)
      ? cat.replace("U", "Under ")
      : cat
        ? category + " — " + name
        : name || "";
  }

  function renderAthleteList() {
    const listContentEl = document.getElementById("main-tab-content");
    if (!listContentEl) return;
    const teamsList = Array.isArray(globalTeamsList) ? globalTeamsList : [];

    // Filter athletes by team if filter is active
    const filteredAthletes = globalTeamFilter
      ? globalAthletesList.filter(
        (ath) => String(ath.team_id) === String(globalTeamFilter),
      )
      : globalAthletesList;

    ((listContentEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;">
        <p class="page-subtitle">${filteredAthletes.length} atleti${globalTeamFilter ? " in squadra selezionata" : " totali"}</p>
        <div style="display:flex;align-items:center;gap:var(--sp-2);">
          <div class="input-wrapper" style="position:relative;min-width:220px;">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>
            <input type="text" id="athlete-search" class="form-input" placeholder="Cerca atleta..." style="padding-left:36px;height:42px;font-size:13px;">
          </div>
          <button class="btn btn-primary" id="new-athlete-btn" type="button">+ NUOVO ATLETA</button>
        </div>
      </div>
      <div class="filter-bar" id="team-filter">
        <button class="filter-chip ${globalTeamFilter ? "" : "active"}" data-team="" type="button">Tutti</button>
        ${teamsList.map((tm) => `<button class="filter-chip ${globalTeamFilter === tm.id ? "active" : ""}" data-team="${Utils.escapeHtml(tm.id)}" type="button">${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</button>`).join("")}
      </div>
      ${0 === filteredAthletes.length
        ? Utils.emptyState(
          "Nessun atleta trovato",
          "Aggiungi il primo atleta con il pulsante in alto.",
        )
        : `<div class="grid-3" id="athletes-grid">${filteredAthletes
          .map((ath) =>
            (function (ath) {
              const riskColor = ath.acwr_risk
                ? Utils.acwrRiskColor(ath.acwr_risk)
                : "transparent",
                initialsColor = getAthleteColor(ath.full_name);
              return `
      <div class="card" style="cursor:pointer;position:relative;overflow:hidden;" data-athlete-id="${Utils.escapeHtml(ath.id)}" data-name="${Utils.escapeHtml((ath.full_name || "").toLowerCase())}" data-role="${Utils.escapeHtml((ath.role || "").toLowerCase())}" data-team="${Utils.escapeHtml((ath.team_name || "").toLowerCase())}">
        ${ath.acwr_risk && "moderate" !== ath.acwr_risk && "low" !== ath.acwr_risk ? `<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:24px;height:24px;border-radius:50%;background:${riskColor};display:flex;align-items:center;justify-content:center;font-size:14px;color:#000;box-shadow:0 0 8px ${riskColor};"><i class="ph-fill ph-warning-circle"></i></div>` : ""}
        <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">
          <div style="width:48px;height:48px;background:${initialsColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;">${ath.photo_path
                  ? `<img src="${Utils.escapeHtml(ath.photo_path)}" style="width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block;border-radius:8px;">`
                  : `
            ${null != ath.jersey_number ? Utils.escapeHtml(String(ath.jersey_number)) : Utils.initials(ath.full_name)}`
                }
          </div>
          <div style="overflow:hidden;flex:1;">
            <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(ath.full_name)}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(ath.role || "—")}</div>
            <div style="margin-top:4px;">${Utils.badge(formatTeamLabel(ath.category, ath.team_name), "muted")}</div>
          </div>
        </div>
      </div>`;
            })(ath),
          )
          .join("")}</div>`
      }
    `),
      listContentEl.querySelectorAll("[data-team]").forEach((btn) =>
        btn.addEventListener(
          "click",
          () => {
            ((globalTeamFilter = btn.dataset.team), renderAthleteList());
          },
          { signal: moduleAbortController.signal },
        ),
      ),
      listContentEl.querySelectorAll("[data-athlete-id]").forEach((card) =>
        card.addEventListener(
          "click",
          () => {
            showAthleteProfile(card.dataset.athleteId);
          },
          { signal: moduleAbortController.signal },
        ),
      ),
      document.getElementById("new-athlete-btn")?.addEventListener(
        "click",
        () =>
          (function () {
            const teamOptions = globalTeamsList
              .map(
                (tm) =>
                  `<option value="${Utils.escapeHtml(tm.id)}">${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</option>`,
              )
              .join("");
            let wizardStep = 1;
            const wizardLabels = [
              "Dati Obbligatori",
              "Dati Sportivi",
              "Contatti",
              "Documenti",
            ],
              wizardHtmls = [
                `
  <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-fname">Nome *</label><input id="na-fname" class="form-input" type="text" placeholder="Marco" required></div>
        <div class="form-group"><label class="form-label" for="na-lname">Cognome *</label><input id="na-lname" class="form-input" type="text" placeholder="Rossi" required></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-team">Squadra *</label><select id="na-team" class="form-select"><option value="">Seleziona...</option>${teamOptions}</select></div>
        <div class="form-group"><label class="form-label" for="na-birth">Data di Nascita</label><input id="na-birth" class="form-input" type="date"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-birthplace">Luogo di Nascita</label><input id="na-birthplace" class="form-input" type="text" placeholder="Roma"></div>
        <div class="form-group"><label class="form-label" for="na-rescity">Città di Residenza</label><input id="na-rescity" class="form-input" type="text" placeholder="Milano"></div>
      </div>`,
                `
  <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-role">Ruolo</label><input id="na-role" class="form-input" type="text" placeholder="Palleggiatrice"></div>
        <div class="form-group"><label class="form-label" for="na-jersey">N° Maglia</label><input id="na-jersey" class="form-input" type="number" min="1" max="99" placeholder="10"></div>
      </div>
  <div class="form-grid">
    <div class="form-group"><label class="form-label" for="na-height">Altezza (cm)</label><input id="na-height" class="form-input" type="number" placeholder="180"></div>
    <div class="form-group"><label class="form-label" for="na-weight">Peso (kg)</label><input id="na-weight" class="form-input" type="number" placeholder="75"></div>
  </div>`,
                `
    <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-phone">Cellulare</label><input id="na-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>
        <div class="form-group"><label class="form-label" for="na-email">E-Mail</label><input id="na-email" class="form-input" type="email" placeholder="atleta@email.com"></div>
      </div>
  <div class="form-group">
    <label class="form-label" for="na-resaddr" style="display:flex;align-items:center;gap:8px;">
      Via di Residenza
      <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">
        <i class="ph ph-google-logo"></i> Google Maps
      </span>
    </label>
    <div style="position:relative;">
      <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
      <input id="na-resaddr" class="form-input" type="text" placeholder="Via Roma 1, Milano" autocomplete="off" style="padding-left:40px;">
    </div>
  </div>`,
                `
    <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-fiscal">Codice Fiscale</label><input id="na-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>
        <div class="form-group"><label class="form-label" for="na-doc">Documento d'Identità</label><input id="na-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="na-medcert">Scadenza Cert. Medico</label><input id="na-medcert" class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label" for="na-fipav">Matricola FIPAV</label><input id="na-fipav" class="form-input" type="text" placeholder="FI-123456"></div>
      </div>
      <div class="form-group"><label class="form-label" for="na-parent">Contatto genitore (per minori)</label><input id="na-parent" class="form-input" type="text" placeholder="Nome cognome genitore"></div>`,
              ],
              wizardData = {},
              collectWizardData = () => {
                document
                  .querySelectorAll(
                    "#wizard-step-content input, #wizard-step-content select",
                  )
                  .forEach((el) => {
                    wizardData[el.id] = el.value;
                  });
              },
              renderWizardStep = () => {
                const wizardBodyEl = document.getElementById("wizard-body");
                if (!wizardBodyEl) return;
                ((wizardBodyEl.innerHTML = `
  <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">
    ${[1, 2, 3, 4]
                    .map(
                      (sNum) => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
              ${sNum < wizardStep ? "background:var(--color-success);color:#000;" : sNum === wizardStep ? "background:var(--color-pink);color:#fff;" : "background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);"}">${sNum < wizardStep ? "✓" : sNum}</div>
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${sNum === wizardStep ? "var(--color-white)" : "rgba(255,255,255,0.35)"};">${wizardLabels[sNum - 1]}</div>
          </div>
          ${sNum < 4 ? `<div style="flex:0.5;height:2px;background:${sNum < wizardStep ? "var(--color-success)" : "rgba(255,255,255,0.1)"};margin-bottom:20px;"></div>` : ""}
        `,
                    )
                    .join("")}
      </div><div id="wizard-step-content">${wizardHtmls[wizardStep - 1]}</div><div id="na-error" class="form-error hidden"></div>`),
                  requestAnimationFrame(() => {
                    Object.entries(wizardData).forEach(([key, val]) => {
                      const input = document.getElementById(key);
                      input && (input.value = val);
                    });
                  }));
                const prevWizardBtn = document.getElementById("na-prev"),
                  nextWizardBtn = document.getElementById("na-next"),
                  saveWizardBtn = document.getElementById("na-save");
                (prevWizardBtn &&
                  (prevWizardBtn.style.display =
                    1 === wizardStep ? "none" : ""),
                  nextWizardBtn &&
                  (nextWizardBtn.style.display =
                    4 === wizardStep ? "none" : ""),
                  saveWizardBtn &&
                  (saveWizardBtn.style.display =
                    4 === wizardStep ? "" : "none"),
                  3 === wizardStep &&
                  loadGoogleMaps(() =>
                    initGoogleMapsAutocomplete(
                      document.getElementById("na-resaddr"),
                      ({ address, city }) => {
                        if (city) {
                          const cityInputEl =
                            document.getElementById("na-rescity");
                          cityInputEl &&
                            ((cityInputEl.value = city),
                              (wizardData["na-rescity"] = city));
                        }
                      },
                    ),
                  ));
              },
              newAthleteModal = UI.modal({
                title: "Nuovo Atleta",
                body: '<div id="wizard-body"></div>',
                footer: `
  <button class="btn btn-ghost btn-sm" id="na-cancel" type="button">Annulla</button>
        <button class="btn btn-default btn-sm" id="na-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>
        <button class="btn btn-primary btn-sm" id="na-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>
        <button class="btn btn-primary btn-sm" id="na-save" type="button" style="display:none;">CREA ATLETA</button>`,
              });
            (renderWizardStep(),
              document
                .getElementById("na-cancel")
                ?.addEventListener("click", () => newAthleteModal.close(), {
                  signal: moduleAbortController.signal,
                }),
              document.getElementById("na-prev")?.addEventListener(
                "click",
                () => {
                  (collectWizardData(),
                    wizardStep > 1 && (wizardStep--, renderWizardStep()));
                },
                { signal: moduleAbortController.signal },
              ),
              document.getElementById("na-next")?.addEventListener(
                "click",
                () => {
                  if (1 === wizardStep) {
                    const fnameVal = document
                      .getElementById("na-fname")
                      ?.value.trim(),
                      lnameVal = document
                        .getElementById("na-lname")
                        ?.value.trim(),
                      teamIdVal = document.getElementById("na-team")?.value,
                      errEl = document.getElementById("na-error");
                    if (!fnameVal || !lnameVal || !teamIdVal)
                      return (
                        (errEl.textContent =
                          "Nome, cognome e squadra sono obbligatori"),
                        void errEl.classList.remove("hidden")
                      );
                  }
                  (collectWizardData(),
                    wizardStep < 4 && (wizardStep++, renderWizardStep()));
                },
                { signal: moduleAbortController.signal },
              ),
              document.getElementById("na-save")?.addEventListener(
                "click",
                async () => {
                  collectWizardData();
                  const wizardErrEl = document.getElementById("na-error"),
                    wizardSaveBtn = document.getElementById("na-save");
                  ((wizardSaveBtn.disabled = !0),
                    (wizardSaveBtn.textContent = "Creazione..."));
                  try {
                    (await Store.api("create", "athletes", {
                      first_name: wizardData["na-fname"] || "",
                      last_name: wizardData["na-lname"] || "",
                      team_id: wizardData["na-team"] || "",
                      jersey_number: wizardData["na-jersey"] || null,
                      role: wizardData["na-role"] || null,
                      birth_date: wizardData["na-birth"] || null,
                      birth_place: wizardData["na-birthplace"] || null,
                      residence_address: wizardData["na-resaddr"] || null,
                      residence_city: wizardData["na-rescity"] || null,
                      phone: wizardData["na-phone"] || null,
                      email: wizardData["na-email"] || null,
                      identity_document: wizardData["na-doc"] || null,
                      fiscal_code:
                        (wizardData["na-fiscal"] || "").toUpperCase() || null,
                      medical_cert_expires_at: wizardData["na-medcert"] || null,
                      federal_id: wizardData["na-fipav"] || null,
                      height_cm: wizardData["na-height"] || null,
                      weight_kg: wizardData["na-weight"] || null,
                      parent_contact: wizardData["na-parent"] || null,
                    }),
                      newAthleteModal.close(),
                      UI.toast("Atleta creato", "success"),
                      (globalAthletesList = await Store.get(
                        "listLight",
                        "athletes",
                      ).catch(() => globalAthletesList)),
                      (globalActiveTab = "anagrafica"),
                      renderMainLayout());
                  } catch (err) {
                    ((wizardErrEl.textContent = err.message),
                      wizardErrEl.classList.remove("hidden"),
                      (wizardSaveBtn.disabled = !1),
                      (wizardSaveBtn.textContent = "CREA ATLETA"));
                  }
                },
                { signal: moduleAbortController.signal },
              ));
          })(),
        { signal: moduleAbortController.signal },
      ));
    const searchInput = document.getElementById("athlete-search");
    searchInput &&
      searchInput.addEventListener(
        "input",
        () => {
          const query = searchInput.value.trim().toLowerCase();
          let count = 0;
          listContentEl
            .querySelectorAll("[data-athlete-id]")
            .forEach((card) => {
              const matches =
                (card.dataset.name || "").includes(query) ||
                (card.dataset.role || "").includes(query) ||
                (card.dataset.team || "").includes(query);
              ((card.style.display = matches ? "" : "none"),
                matches && count++);
            });
          const grid = document.getElementById("athletes-grid");
          let searchEmpty = document.getElementById("search-empty-state");
          const totalAthleteCards =
            listContentEl.querySelectorAll("[data-athlete-id]").length;
          0 === count && totalAthleteCards > 0
            ? (!searchEmpty && grid
              ? grid.insertAdjacentHTML(
                "afterend",
                `<div id="search-empty-state">${Utils.emptyState("Nessun atleta trovato", "Nessun risultato corrisponde alla tua ricerca.")}</div>`,
              )
              : searchEmpty && (searchEmpty.style.display = "block"),
              grid && (grid.style.display = "none"))
            : (searchEmpty && (searchEmpty.style.display = "none"),
              grid && (grid.style.display = ""));
        },
        { signal: moduleAbortController.signal },
      );
  }

  function getAthleteColor(name) {
    const palette = [
      "#f472b6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#0ea5e9",
    ];
    if (!name) return palette[0];
    let hash = 0;
    for (let j = 0; j < name.length; j++)
      hash = name.charCodeAt(j) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  function renderMainLayout() {
    ((document.getElementById("app").innerHTML = `
      <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:0;margin-bottom:0;">
        <div>
          <h1 class="page-title">Atleti</h1>
          <p class="page-subtitle">${globalAthletesList.length} atleti nel sistema</p>
        </div>
      </div>
      <div id="main-tab-content" style="flex:1;padding:var(--sp-4) 0;"></div>
    `),
      document.querySelectorAll("[data-maintab]").forEach((tab) =>
        tab.addEventListener(
          "click",
          () => {
            if (tab.dataset.maintab === "metrics") {
              globalTeamFilter = "";
            }
            switchMainTab(tab.dataset.maintab);
          },
          {
            signal: moduleAbortController.signal,
          },
        ),
      ),
      switchMainTab(globalActiveTab));
  }
  function switchMainTab(activeTabId) {
    globalActiveTab = activeTabId;
    document.querySelectorAll("[data-maintab]").forEach((e) => {
      const isActive = e.dataset.maintab === activeTabId;
      ((e.style.borderBottomColor = isActive ? "var(--color-pink)" : "transparent"),
        (e.style.color = isActive
          ? "var(--color-white)"
          : "var(--color-text-muted)"),
        (e.style.opacity = isActive ? "1" : "0.65"));
    });
    const tabContent = document.getElementById("main-tab-content");
    if (tabContent)
      switch (activeTabId) {
        case "anagrafica":
          globalTeamFilter = "";
          renderAthleteList();
          break;
        case "pagamenti":
          !(async function (t) {
            t.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${[1, 2, 3].map(() => '<div class="skeleton skeleton-text"></div>').join("")}</div>`;
            try {
              const a = globalTeamFilter ? { team_id: globalTeamFilter } : {},
                { installments: l, stats: s } = await Store.get(
                  "squadSummary",
                  "payments",
                  a,
                );
              let i = "";
              const r = (e) => {
                const t = i
                  ? e.filter(
                    (e) => (e.status || "").toUpperCase() === i.toUpperCase(),
                  )
                  : e;
                return 0 === t.length
                  ? Utils.emptyState(
                    "Nessun pagamento trovato",
                    i
                      ? "Nessun elemento corrisponde al filtro."
                      : "Nessun pagamento registrato per questa squadra.",
                  )
                  : `\n          <div class="table-wrapper">\n            <table class="table">\n              <thead><tr><th>Atleta</th><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Metodo</th></tr></thead>\n              <tbody>\n                ${t.map((e) => `<tr>\n                  <td><strong>${Utils.escapeHtml(e.athlete_name || "—")}</strong></td>\n                  <td>${Utils.formatDate(e.due_date)}</td>\n                  <td><strong>€ ${Utils.formatNum(e.amount, 2)}</strong></td>\n                  <td>${"PAID" === e.status ? '<span class="badge badge-success">Pagato</span>' : "OVERDUE" === e.status ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>\n                  <td>${Utils.escapeHtml(e.payment_method || "—")}</td>\n                </tr>`).join("")}\n              </tbody>\n            </table>\n          </div>`;
              };
              ((t.innerHTML = `\n        <p class="section-label">Riepilogo Pagamenti Squadra</p>\n        <div class="grid-3" style="margin-bottom:var(--sp-3);">\n          <div class="stat-card"><span class="stat-label">Atteso</span><span class="stat-value">&euro; ${Utils.formatNum(s.total_expected, 2)}</span></div>\n          <div class="stat-card"><span class="stat-label">Incassato</span><span class="stat-value" style="color:var(--color-success)">&euro; ${Utils.formatNum(s.total_paid, 2)}</span></div>\n          <div class="stat-card"><span class="stat-label">Scaduto</span><span class="stat-value" style="color:var(--color-pink)">&euro; ${Utils.formatNum(s.total_overdue, 2)}</span></div>\n        </div>\n        <div class="filter-bar" style="margin-bottom:var(--sp-3);" id="pay-status-filter">\n          <button class="filter-chip active" data-status="" type="button">Tutti (${l.length})</button>\n          <button class="filter-chip" data-status="PAID" type="button">Pagati</button>\n          <button class="filter-chip" data-status="OVERDUE" type="button">Scaduti</button>\n          <button class="filter-chip" data-status="PENDING" type="button">In attesa</button>\n        </div>\n        <div id="pay-table-container">${r(l)}</div>\n      `),
                t
                  .querySelectorAll("#pay-status-filter [data-status]")
                  .forEach((a) => {
                    a.addEventListener(
                      "click",
                      () => {
                        ((i = a.dataset.status),
                          t
                            .querySelectorAll(
                              "#pay-status-filter [data-status]",
                            )
                            .forEach((e) =>
                              e.classList.toggle("active", e === a),
                            ),
                          (document.getElementById(
                            "pay-table-container",
                          ).innerHTML = r(l)));
                      },
                      { signal: moduleAbortController.signal },
                    );
                  }));
            } catch (e) {
              t.innerHTML = Utils.emptyState(
                "Errore caricamento pagamenti",
                Utils.friendlyError(e),
              );
            }
          })(tabContent);
          break;
        case "metrics":
          !(async function (targetEl) {
            targetEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${[1, 2, 3, 4].map(() => '<div class="skeleton skeleton-text"></div>').join("")}</div>`;
            try {
              const queryParams = globalTeamFilter ? { team_id: globalTeamFilter } : {},
                {
                  athletes: metricsAthletes,
                  averages: groupAverages,
                  metric_types: metricTypes,
                } = await Store.get(
                  "getGroupMetrics",
                  "biometrics",
                  queryParams,
                ),
                metricKeys = Object.keys(metricTypes || {}),
                metricLabels = {
                  SPRINT_10M: "Sprint 10m",
                  SPRINT_20M: "Sprint 20m",
                  SPRINT_40M: "Sprint 40m",
                  VERTICAL_JUMP_CMJ: "Salto CMJ",
                  VERTICAL_JUMP_SJ: "Salto SJ",
                  BROAD_JUMP: "Long Jump",
                  BEEP_TEST: "Beep Test",
                  VO2MAX: "VO₂max",
                  REST_HEART_RATE: "FC Riposo",
                  MAX_HEART_RATE: "FC Max",
                  RPE: "RPE",
                  HRV: "HRV",
                  TRAINING_LOAD: "Carico",
                  STRENGTH_1RM: "1RM",
                },
                formatMetricValue = (val) =>
                  null != val ? Utils.formatNum(val, 2) : "—",
                renderMetricCell = (athleteMetrics, key) => {
                  if (!athleteMetrics || !athleteMetrics[key])
                    return '<span style="color:var(--color-text-muted);">—</span>';
                  const data = athleteMetrics[key];
                  return `<span style="font-weight:600;">${formatMetricValue(data.value)}</span><span style="font-size:10px;color:var(--color-text-muted);margin-left:2px;">${Utils.escapeHtml(data.unit)}</span>`;
                };
              const teamsList = Array.isArray(globalTeamsList) ? globalTeamsList : [];
              const headerHtml = `<div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;"><p class="page-subtitle">${(metricsAthletes || []).length} atlete${globalTeamFilter ? " nella squadra selezionata" : " totali"}</p><div class="filter-bar" id="metrics-team-filter"><button class="filter-chip ${globalTeamFilter ? "" : "active"}" data-team="" type="button">Tutte</button>${teamsList.map((tm) => `<button class="filter-chip ${globalTeamFilter === tm.id ? "active" : ""}" data-team="${tm.id}" type="button">${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</button>`).join("")}</div></div>`;
              const metricHeaders =
                0 === metricKeys.length
                  ? '<th style="white-space:nowrap;text-align:center;color:var(--color-text-muted);">Metriche</th>'
                  : metricKeys
                    .map(
                      (k) =>
                        `<th style="white-space:nowrap;text-align:center;">${Utils.escapeHtml(metricLabels[k] || k)}</th>`,
                    )
                    .join("");
              const athleteRows = (metricsAthletes || [])
                .map(
                  (athlete) =>
                    `<tr style="cursor:pointer;" data-athlete-id="${athlete.id}"><td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;background:${getAthleteColor(athlete.full_name)};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:0.85rem;color:#000;border-radius:6px;">${null !== athlete.jersey_number ? Utils.escapeHtml(String(athlete.jersey_number)) : Utils.initials(athlete.full_name)}</div><span style="font-weight:600;">${Utils.escapeHtml(athlete.full_name)}</span></div></td><td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(formatTeamLabel(athlete.category, athlete.team_name))}</td>${0 === metricKeys.length ? '<td style="text-align:center;color:var(--color-text-muted);font-size:12px;">Nessuna metrica</td>' : metricKeys.map((tk) => `<td style="text-align:center;">${renderMetricCell(athlete.metrics, tk)}</td>`).join("")}</tr>`,
                )
                .join("");
              const avgCells =
                0 === metricKeys.length
                  ? '<td style="text-align:center;"><span style="color:var(--color-text-muted);">—</span></td>'
                  : metricKeys
                    .map((k) => {
                      const avgData = groupAverages && groupAverages[k];
                      return `<td style="text-align:center;">${avgData ? `<span style="font-weight:700;color:var(--color-pink);">${formatMetricValue(avgData.value)}</span><span style="font-size:10px;color:var(--color-text-muted);margin-left:2px;">${Utils.escapeHtml(avgData.unit)}</span>` : '<span style="color:var(--color-text-muted);">—</span>'}</td>`;
                    })
                    .join("");
              ((targetEl.innerHTML = `${headerHtml}<div class="table-wrapper"><table class="table"><thead><tr><th style="white-space:nowrap;">Atleta</th><th style="white-space:nowrap;">Squadra</th>${metricHeaders}</tr></thead><tbody>${athleteRows}<tr style="background:rgba(255,255,255,0.03);border-top:2px solid var(--color-border);"><td colspan="2" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);padding:10px 12px;"><i class="ph ph-chart-bar" style="margin-right:4px;"></i>Media gruppo</td>${avgCells}</tr></tbody></table></div>`),
                targetEl.querySelectorAll("[data-team]").forEach((btn) =>
                  btn.addEventListener(
                    "click",
                    () => {
                      ((globalTeamFilter = btn.dataset.team),
                        switchMainTab("metrics"));
                    },
                    { signal: moduleAbortController.signal },
                  ),
                ),
                targetEl.querySelectorAll("[data-athlete-id]").forEach((row) =>
                  row.addEventListener(
                    "click",
                    () => {
                      const id = row.dataset.athleteId;
                      ((globalSelectedId = id),
                        sessionStorage.setItem("last_athlete_id", id),
                        renderAthleteProfile(id, "metrics"));
                    },
                    { signal: moduleAbortController.signal },
                  ),
                ));
            } catch (err) {
              targetEl.innerHTML = Utils.emptyState(
                "Errore caricamento metriche",
                err.message,
              );
            }
          })(tabContent);
          break;
        case "documenti":
          !(function (e) {
            const a = new Date(),
              n = new Date(a.getTime() + 5184e6),
              l = globalAthletesList.map((e) => {
                const t = e.medical_cert_expires_at
                  ? new Date(e.medical_cert_expires_at)
                  : null,
                  l = t && t < a;
                return {
                  a: e,
                  certDate: t,
                  expired: l,
                  expiring: t && !l && t < n,
                };
              }),
              s = l.filter((e) => e.expired).length,
              r = l.filter((e) => e.expiring).length,
              o = l.length - s - r;
            e.innerHTML = `\n      <p class="section-label">Stato Documenti Squadra</p>\n      <div class="grid-3" style="margin-bottom:var(--sp-3);">\n        <div class="stat-card"><span class="stat-label">Completati</span><span class="stat-value" style="color:var(--color-success)">${o}</span></div>\n        <div class="stat-card"><span class="stat-label">In scadenza (60gg)</span><span class="stat-value" style="color:var(--color-warning)">${r}</span></div>\n        <div class="stat-card"><span class="stat-label">Scaduti</span><span class="stat-value" style="color:var(--color-pink)">${s}</span></div>\n      </div>\n      <p class="section-label">Certificati Medici</p>\n      <div class="table-wrapper">\n        <table class="table">\n          <thead><tr><th>Atleta</th><th>Squadra</th><th>Scadenza Cert. Medico</th><th>Stato</th><th>Matricola FIPAV</th></tr></thead>\n          <tbody>\n            ${l.map(({ a: e, certDate: t, expired: a, expiring: n }) => `<tr>\n              <td><strong>${Utils.escapeHtml(e.full_name)}</strong></td>\n              <td>${Utils.escapeHtml(formatTeamLabel(e.category, e.team_name))}</td>\n              <td style="color:${a ? "var(--color-pink)" : n ? "var(--color-warning)" : "var(--color-text)"}">\n                ${t ? Utils.formatDate(e.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'}\n              </td>\n              <td>${a ? '<span class="badge badge-danger">Scaduto</span>' : n ? '<span class="badge badge-warning">In scadenza</span>' : t ? '<span class="badge badge-success">Valido</span>' : '<span class="badge">Mancante</span>'}</td>\n              <td>${Utils.escapeHtml(e.federal_id || "—")}</td>\n            </tr>`).join("")}\n          </tbody>\n        </table>\n      </div>\n    `;
          })(tabContent);
      }
  }
  function showAthleteProfile(athleteId) {
    globalSelectedId = athleteId;
    sessionStorage.setItem("last_athlete_id", athleteId);
    renderAthleteProfile(athleteId, "anagrafica");
  }
  function renderMainList() {
    globalSelectedId = null;
    globalTeamFilter = "";
    sessionStorage.removeItem("last_athlete_id");
    globalActiveTab = "anagrafica";
    renderMainLayout();
  }
  async function renderAthleteProfile(athleteId, startTab = "anagrafica") {
    const appContainer = document.getElementById("app");
    if (athleteId) {
      (sessionStorage.setItem("last_athlete_id", athleteId),
        Router.updateHash(Router.getCurrentRoute(), { id: athleteId }),
        (appContainer.innerHTML = UI.skeletonPage()));
      try {
        const [athleteData, paymentsParams, metricsSummary] = await Promise.all([
          Store.get("get", "athletes", { id: athleteId }),
          Store.get("payments", "athletes", { id: athleteId }).catch(
            () => [],
          ),
          Store.get("getMetricsSummary", "biometrics", { id: athleteId }).catch(
            () => [],
          ),
        ]),
          currentUser = App.getUser(),
          hasEditPerms = ["admin", "manager", "operator"].includes(currentUser?.role),
          g = (label, value, color) => `
            <div class="stat-card" style="padding:var(--sp-2); border:1px solid var(--color-border); ${color ? `border-left:4px solid ${color};` : ""}">
              <span class="stat-label" style="font-size:10px;text-transform:uppercase;color:var(--color-text-muted);">${label}</span>
              <span class="stat-value" style="font-size:13px;font-weight:600;display:block;">${Utils.escapeHtml(value || "—")}</span>
            </div>`;
        ((appContainer.innerHTML = `\n        \x3c!-- BREADCRUMB NAV --\x3e\n        <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);border-bottom:1px solid var(--color-border);background:var(--color-bg);position:sticky;top:72px;z-index:50;">\n          <button class="btn btn-ghost btn-sm" id="back-to-list" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">\n            <i class="ph ph-arrow-left" style="font-size:16px;"></i> Atleti\n          </button>\n          <i class="ph ph-caret-right" style="font-size:12px;color:var(--color-text-muted);opacity:0.5;"></i>\n          <span style="font-size:12px;font-weight:600;color:var(--color-white);text-transform:uppercase;letter-spacing:0.06em;">${Utils.escapeHtml(athleteData.full_name)}</span>\n          <div style="flex:1;"></div>\n          ${hasEditPerms ? '<button class="btn btn-primary btn-sm" id="edit-athlete-btn" type="button" style="margin-right:8px;"><i class="ph ph-pencil-simple"></i> MODIFICA</button>' : ""}\n          ${["admin", "manager"].includes(currentUser?.role) ? '<button class="btn btn-default btn-sm" id="ai-report-btn" type="button">⚡ REPORT AI</button>' : ""}\n        </div>\n\n        <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-4); background:var(--color-black);">\n\n          <!-- TAB BAR -->\n          <div style="position:relative;margin:0 calc(var(--sp-4) * -1);padding:0 var(--sp-4);border-bottom:1px solid var(--color-border);margin-bottom:var(--sp-4);">\n            <div id="athlete-tab-bar" class="fusion-tabs-container" style="display:flex;gap:0;overflow-x:auto;scrollbar-width:none;position:relative;z-index:2;padding-bottom:1px;">\n              ${[
          { id: "anagrafica", label: "Anagrafica" },
          { id: "metrics", label: "Metrics & Load" },
          { id: "antropometria", label: "Antropometria" },
          { id: "test-fisici", label: "Test Fisici" },
          { id: "vald", label: "Vald Performance", pink: !0 },
          { id: "pagamenti", label: "Pagamenti" },
          { id: "documenti", label: "Documenti" },
        ]
          .map(
            (e) =>
              `<button class="athlete-tab-btn fusion-tab" data-tab="${e.id}" type="button" style="flex-shrink:0;white-space:nowrap; ${e.pink ? "color:var(--color-pink);" : ""}">${e.label}</button>`,
          )
          .join(
            "",
          )}\n            </div>\n            \x3c!-- Shadow gradient for scroll indication --\x3e\n            <div id="tab-scroll-indicator" style="position:absolute;top:0;right:0;bottom:0;width:48px;background:linear-gradient(to left, var(--color-black) 20%, transparent 100%);pointer-events:none;z-index:3;transition:opacity 0.3s;opacity:0.8;"></div>\n          </div>\n\n          \x3c!-- ANAGRAFICA TAB --\x3e\n          <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:flex;flex-direction:column;gap:var(--sp-4);">\n            <div style="display:flex;flex-direction:row;align-items:flex-start;gap:var(--sp-4);">\n              \x3c!-- FOTO PERSONALE --\x3e\n              <div>\n                <p class="section-label">Foto Personale</p>\n                <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;gap:var(--sp-3);">\n                    <div id="athlete-photo-preview" style="width:200px;height:200px;border-radius:16px;overflow:hidden;flex-shrink:0;border:2px solid var(--color-border);background:${getAthleteColor(athleteData.full_name)};display:flex;align-items:center;justify-content:center;">\n                      ${athleteData.photo_path ? `<img src="${Utils.escapeHtml(athleteData.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;;object-position:top">` : `<span style="font-family:var(--font-display);font-size:3.5rem;font-weight:700;color:#000;">${Utils.initials(athleteData.full_name)}</span>`}\n                    </div>\n                    <div style="display:flex;flex-direction:column;gap:8px;">\n                      <div style="font-size:13px;color:var(--color-text-muted);">\n                        ${athleteData.photo_path ? "Foto caricata" : "Nessuna foto caricata"}\n                      </div>\n                      ${hasEditPerms ? `\n                      <label for="athlete-photo-upload" class="btn btn-default btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:200px;justify-content:center;">\n                        <i class="ph ph-camera"></i> ${athleteData.photo_path ? "Cambia foto" : "Carica foto"}\n                      </label>\n                      <input id="athlete-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;">\n                      <div id="athlete-photo-status" style="font-size:12px;color:var(--color-text-muted);"></div>` : ""}\n                    </div>\n                  </div>\n                </div>\n              </div>\n              <div style="flex:1;">\n                <p class="section-label">Dati Anagrafici e Contatti</p>\n                <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">\n                    ${g("Nome", athleteData.first_name)}\n                    ${g("Cognome", athleteData.last_name)}\n                    ${g("Data di Nascita", athleteData.birth_date ? Utils.formatDate(athleteData.birth_date) : null)}\n                    ${g("Luogo di Nascita", athleteData.birth_place)}\n                    ${g("Via di Residenza", athleteData.residence_address)}\n                    ${g("Città di Residenza", athleteData.residence_city)}\n                    ${g("Cellulare", athleteData.phone)}\n                    ${g("E-Mail", athleteData.email)}\n                    ${g("Documento d'Identità", athleteData.identity_document)}\n                    ${g("Codice Fiscale", athleteData.fiscal_code)}\n                    ${g("Scadenza Cert. Medico", athleteData.medical_cert_expires_at ? Utils.formatDate(athleteData.medical_cert_expires_at) : null, athleteData.medical_cert_expires_at && new Date(athleteData.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n                    ${g("Matricola FIPAV", athleteData.federal_id)}\n                  </div>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- DOCUMENTI (in Anagrafica) --\x3e\n            <div>\n              <p class="section-label">Matricola e Documenti</p>\n              <div class="card" style="padding:var(--sp-3);">\n                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:var(--sp-3);">\n                  ${g("Documento d'Identità", athleteData.identity_document)}\n                  ${g("Codice Fiscale", athleteData.fiscal_code)}\n                  ${g("Matricola FIPAV", athleteData.federal_id)}\n                  ${g("Scadenza Cert. Medico", athleteData.medical_cert_expires_at ? Utils.formatDate(athleteData.medical_cert_expires_at) : null, athleteData.medical_cert_expires_at && new Date(athleteData.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- PAGAMENTI (in Anagrafica) --\x3e\n            <div>\n              <p class="section-label">Recenti Pagamenti</p>\n              ${paymentsParams && paymentsParams.length > 0
            ? `\n                <div class="table-wrapper">\n                  <table class="table">\n                    <thead><tr><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Metodo</th><th>Data Pagamento</th></tr></thead>\n                    <tbody>\n                      ${paymentsParams
              .slice(0, 5)
              .map(
                (e) =>
                  `<tr>\n                        <td>${Utils.formatDate(e.due_date)}</td>\n                        <td><strong>€ ${Utils.formatNum(e.amount, 2)}</strong></td>\n                        <td>${"paid" === e.status ? '<span class="badge badge-success">Pagato</span>' : "overdue" === e.status ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>\n                        <td>${Utils.escapeHtml(e.payment_method || "—")}</td>\n                        <td style="font-size:12px;color:var(--color-text-muted);">${e.paid_at ? Utils.formatDate(e.paid_at) : "—"}</td>\n                      </tr>`,
              )
              .join(
                "",
              )}\n                    </tbody>\n                  </table>\n                </div>`
            : Utils.emptyState("Nessun pagamento registrato")
          }\n            </div>\n          </div>\n\n          \x3c!-- METRICS TAB --\x3e\n          <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">\n\n            \x3c!-- PARAMETRI FISICI E SALTO --\x3e\n            <div>\n              <p class="section-label">Parametri Fisici e Salto</p>\n              <div class="grid-3">\n                <div class="stat-card">\n                  <span class="stat-label">Peso Attuale</span>\n                  <span class="stat-value">${athleteData.weight_kg ? athleteData.weight_kg + ' kg' : '—'}</span>\n                </div>\n                <div class="stat-card">\n                  <span class="stat-label">Altezza Attuale</span>\n                  <span class="stat-value">${athleteData.height_cm ? athleteData.height_cm + ' cm' : '—'}</span>\n                </div>\n                <div class="stat-card">\n                  <span class="stat-label">Miglior Salto (di recente)</span>\n                  <span class="stat-value">${(function (ms) { if (!ms || !ms.length) return '—'; const jump = ms.find((m) => m.metric_type === 'VERTICAL_JUMP_CMJ' || m.metric_type === 'VERTICAL_JUMP_SJ' || m.metric_type === 'BROAD_JUMP'); return jump ? jump.value + (jump.unit ? ' ' + jump.unit : '') : '—'; })(metricsSummary)}</span>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- ACWR Section --\x3e\n            <div>\n              <p class="section-label">Athlete Load — ACWR</p>\n              <div class="grid-3">\n                ${(function (
            e,
          ) {
            if (!e)
              return '<div class="stat-card"><span class="stat-label">ACWR</span><span class="stat-value">—</span></div>';
            const t = Math.min(100, (e.score / 2) * 100),
              a = Utils.acwrRiskColor(e.risk);
            return `\n      <div class="stat-card">\n        <span class="stat-label">ACWR Score</span>\n        <span class="stat-value" style="color:${a};">${Utils.formatNum(e.score, 2)}</span>\n        <div class="acwr-gauge" style="margin-top:8px;">\n          <div class="acwr-bar-track">\n            <div class="acwr-bar-fill" style="width:${t}%;background:${a};"></div>\n          </div>\n          <div class="acwr-zones">\n            <span>BASSO</span><span>OTTIMALE</span><span>CAUTO</span><span>PERICOLO</span>\n          </div>\n        </div>\n        <span class="stat-meta">${Utils.acwrRiskLabel(e.risk)}</span>\n      </div>`;
          })(
            athleteData.acwr,
          )}\n                <div class="stat-card">\n                  <span class="stat-label">Carico Acuto (7g)</span>\n                  <span class="stat-value">${Utils.formatNum(athleteData.acwr?.acute, 0)}</span>\n                </div>\n                <div class="stat-card">\n                  <span class="stat-label">Carico Cronico (28g)</span>\n                  <span class="stat-value">${Utils.formatNum(athleteData.acwr?.chronic, 0)}</span>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- AI Summary section --\x3e\n            <div id="ai-summary-section"></div>\n\n            \x3c!-- VALD Performance Tracking --\x3e\n            <div>\n              <p class="section-label" style="display:flex;align-items:center;gap:8px;">\n                <span style="color:var(--color-pink);">⚡</span> VALD Performance Tracking\n              </p>\n              <div id="vald-tab-content">\n                <div style="display:flex;flex-direction:column;gap:8px;">\n                  <div class="skeleton skeleton-title"></div>\n                  <div class="skeleton skeleton-text" style="width:60%;"></div>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- Metrics history --\x3e\n            <div>\n              <p class="section-label">Storico Metriche (30 giorni)</p>\n              ${athleteData.metrics?.length
            ? `\n              <div class="table-wrapper">\n                <table class="table">\n                  <thead><tr><th>Data</th><th>Durata (min)</th><th>RPE</th><th>Carico</th><th>ACWR</th><th>Note</th></tr></thead>\n                  <tbody>\n                    ${athleteData.metrics
              .map((e) => {
                return `<tr>\n                      <td>${Utils.formatDate(e.log_date)}</td>\n                      <td>${Utils.escapeHtml(String(e.duration_min))}</td>\n                      <td>${Utils.escapeHtml(String(e.rpe))}/10</td>\n                      <td><strong>${Utils.formatNum(e.load_value, 0)}</strong></td>\n                      <td>${e.acwr_score ? Utils.riskBadge(((t = e.acwr_score), t < 0.8 ? "low" : t <= 1.3 ? "moderate" : t <= 1.5 ? "high" : "extreme")) : "—"}</td>\n                      <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(e.notes || "")}</td>\n                    </tr>`;
                var t;
              })
              .join(
                "",
              )}\n                  </tbody>\n                </table>\n              </div>`
            : Utils.emptyState("Nessuna metrica registrata")
          }\n            </div>\n          </div>\n\n          \x3c!-- PAGAMENTI --\x3e\n          <div id="tab-panel-pagamenti" class="athlete-tab-panel" style="display:none;">\n            <p class="section-label">Storico Pagamenti</p>\n            ${paymentsParams && paymentsParams.length > 0 ? `\n              <div class="table-wrapper">\n                <table class="table">\n                  <thead><tr><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Pagante</th><th>Metodo</th><th>Data Pagamento</th></tr></thead>\n                  <tbody>\n                    ${paymentsParams.map((e) => `<tr>\n                      <td>${Utils.formatDate(e.due_date)}</td>\n                      <td><strong>€ ${Utils.formatNum(e.amount, 2)}</strong></td>\n                      <td>${"paid" === e.status ? '<span class="badge badge-success">Pagato</span>' : "overdue" === e.status ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>\n                      <td>${Utils.escapeHtml(e.payer_name || "—")}</td>\n                      <td>${Utils.escapeHtml(e.payment_method || "—")}</td>\n                      <td style="font-size:12px;color:var(--color-text-muted);">${e.paid_at ? Utils.formatDate(e.paid_at) : "—"}</td>\n                    </tr>`).join("")}\n                  </tbody>\n                </table>\n              </div>` : Utils.emptyState("Nessun pagamento registrato")}\n          </div>\n          \x3c!-- DOCUMENTI TAB --\x3e\n          <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">\n            <p class="section-label">Documenti Atleta</p>\n            <div class="card" style="padding:var(--sp-3);">\n              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">\n                ${g("Documento d'Identità", athleteData.identity_document)}\n                ${g("Codice Fiscale", athleteData.fiscal_code)}\n                ${g("Matricola FIPAV", athleteData.federal_id)}\n                ${g("Scadenza Cert. Medico", athleteData.medical_cert_expires_at ? Utils.formatDate(athleteData.medical_cert_expires_at) : null, athleteData.medical_cert_expires_at && new Date(athleteData.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n              </div>\n            </div>\n          </div>\n        </div>\n        \n        `),
          document
            .getElementById("back-to-list")
            ?.addEventListener("click", () => renderMainList(), {
              signal: moduleAbortController.signal,
            }),
          document.getElementById("edit-athlete-btn")?.addEventListener(
            "click",
            () =>
              (function (athleteData) {
                const teamOptions = Array.isArray(globalTeamsList)
                  ? globalTeamsList
                    .map(
                      (tm) =>
                        `<option value="${Utils.escapeHtml(tm.id)}" ${athleteData.team_id === tm.id ? "selected" : ""}>${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</option>`,
                    )
                    .join("")
                  : "";
                const s = UI.modal({
                  title: "Modifica Atleta",
                  body: `<div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-fname">Nome *</label>
            <input id="ea-fname" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.first_name || "")}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-lname">Cognome *</label>
            <input id="ea-lname" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.last_name || "")}" required>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-team">Squadra *</label>
            <select id="ea-team" class="form-select">${teamOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-jersey">N° Maglia</label>
            <input id="ea-jersey" class="form-input" type="number" min="1" max="99" value="${athleteData.jersey_number || ""}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-role">Ruolo</label>
            <input id="ea-role" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.role || "")}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-birth">Data di Nascita</label>
            <input id="ea-birth" class="form-input" type="date" value="${athleteData.birth_date ? athleteData.birth_date.substring(0, 10) : ""}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-birthplace">Luogo di Nascita</label>
            <input id="ea-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.birth_place || "")}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-rescity">Città di Residenza</label>
            <input id="ea-rescity" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.residence_city || "")}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ea-resaddr" style="display:flex;align-items:center;gap:8px;">
            Via di Residenza
            <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">
              <i class="ph ph-google-logo"></i> Google Maps
            </span>
          </label>
          <div style="position:relative;">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>
            <input id="ea-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.residence_address || "")}" autocomplete="off" style="padding-left:40px;">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-phone">Cellulare</label>
            <input id="ea-phone" class="form-input" type="tel" value="${Utils.escapeHtml(athleteData.phone || "")}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-email">E-Mail</label>
            <input id="ea-email" class="form-input" type="email" value="${Utils.escapeHtml(athleteData.email || "")}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-doc">Documento d'Identità</label>
            <input id="ea-doc" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.identity_document || "")}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-fiscal">Codice Fiscale</label>
            <input id="ea-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.fiscal_code || "")}" maxlength="16" style="text-transform:uppercase;">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-medcert">Scadenza Certificato Medico</label>
            <input id="ea-medcert" class="form-input" type="date" value="${athleteData.medical_cert_expires_at ? athleteData.medical_cert_expires_at.substring(0, 10) : ""}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-fipav">Matricola FIPAV</label>
            <input id="ea-fipav" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.federal_id || "")}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ea-height">Altezza (cm)</label>
            <input id="ea-height" class="form-input" type="number" value="${athleteData.height_cm || ""}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ea-weight">Peso (kg)</label>
            <input id="ea-weight" class="form-input" type="number" value="${athleteData.weight_kg || ""}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ea-parent">Contatto genitore (per minori)</label>
          <input id="ea-parent" class="form-input" type="text" value="${Utils.escapeHtml(athleteData.parent_contact || "")}">
        </div>
        <div id="ea-error" class="form-error hidden"></div>`,
                  footer:
                    '<button class="btn btn-ghost btn-sm" id="ea-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="ea-save" type="button">SALVA MODIFICHE</button>',
                });
                (document
                  .getElementById("ea-cancel")
                  ?.addEventListener("click", () => s.close(), {
                    signal: moduleAbortController.signal,
                  }),
                  document.getElementById("ea-save")?.addEventListener(
                    "click",
                    async () => {
                      const e = document
                        .getElementById("ea-fname")
                        .value.trim(),
                        a = document.getElementById("ea-lname").value.trim(),
                        l = document.getElementById("ea-team").value,
                        i = document.getElementById("ea-error");
                      if (!e || !a || !l)
                        return (
                          (i.textContent =
                            "Nome, cognome e squadra sono obbligatori"),
                          void i.classList.remove("hidden")
                        );
                      const r = document.getElementById("ea-save");
                      ((r.disabled = !0), (r.textContent = "Salvataggio..."));
                      try {
                        (await Store.api("update", "athletes", {
                          id: athleteData.id,
                          first_name: e,
                          last_name: a,
                          team_id: l,
                          jersey_number:
                            document.getElementById("ea-jersey").value || null,
                          role:
                            document.getElementById("ea-role").value || null,
                          birth_date:
                            document.getElementById("ea-birth").value || null,
                          birth_place:
                            document.getElementById("ea-birthplace").value ||
                            null,
                          residence_address:
                            document.getElementById("ea-resaddr").value || null,
                          residence_city:
                            document.getElementById("ea-rescity").value || null,
                          phone:
                            document.getElementById("ea-phone").value || null,
                          email:
                            document.getElementById("ea-email").value || null,
                          identity_document:
                            document.getElementById("ea-doc").value || null,
                          fiscal_code:
                            document
                              .getElementById("ea-fiscal")
                              .value?.toUpperCase() || null,
                          medical_cert_expires_at:
                            document.getElementById("ea-medcert").value || null,
                          federal_id:
                            document.getElementById("ea-fipav").value || null,
                          height_cm:
                            document.getElementById("ea-height").value || null,
                          weight_kg:
                            document.getElementById("ea-weight").value || null,
                          parent_contact:
                            document.getElementById("ea-parent").value || null,
                        }),
                          s.close(),
                          UI.toast("Atleta aggiornato", "success"),
                          Store.get("listLight", "athletes")
                            .then((e) => {
                              globalAthletesList = e;
                            })
                            .catch(() => { }),
                          renderAthleteProfile(athleteId));
                      } catch (e) {
                        ((i.textContent = e.message),
                          i.classList.remove("hidden"),
                          (r.disabled = !1),
                          (r.textContent = "SALVA MODIFICHE"));
                      }
                    },
                    { signal: moduleAbortController.signal },
                  ),
                  x(() =>
                    $(
                      document.getElementById("ea-resaddr"),
                      ({ address: e, city: t }) => {
                        if (t) {
                          const e = document.getElementById("ea-rescity");
                          e && (e.value = t);
                        }
                      },
                    ),
                  ));
              })(athleteData),
            { signal: moduleAbortController.signal },
          ),
          document.getElementById("ai-report-btn")?.addEventListener(
            "click",
            () =>
              (async function (e) {
                const t = document.getElementById("ai-report-btn");
                t && ((t.disabled = !0), (t.textContent = "⏳ Generazione..."));
                try {
                  (await Store.api("aiReport", "athletes", { athlete_id: e }),
                    UI.toast("Report AI generato con successo", "success"),
                    v(e));
                } catch (e) {
                  UI.toast("Errore generazione report: " + e.message, "error");
                } finally {
                  t && ((t.disabled = !1), (t.textContent = "⚡ REPORT AI"));
                }
              })(athleteId),
            { signal: moduleAbortController.signal },
          ));
        const w = document.getElementById("athlete-photo-upload");
        w &&
          w.addEventListener(
            "change",
            async () => {
              const e = w.files?.[0];
              if (!e) return;
              const t = document.getElementById("athlete-photo-status"),
                a = document.getElementById("athlete-photo-preview"),
                l = document.querySelector('label[for="athlete-photo-upload"]'),
                s = URL.createObjectURL(e);
              ((a.innerHTML = `<img src="${s}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;;object-position:top">`),
                t && (t.textContent = "Caricamento in corso..."),
                l &&
                ((l.style.opacity = "0.5"),
                  (l.style.pointerEvents = "none")));
              try {
                const a = new FormData();
                (a.append("id", athleteId), a.append("photo", e));
                const l = await fetch(
                  "api/router.php?module=athletes&action=uploadPhoto",
                  { method: "POST", credentials: "same-origin", body: a },
                ),
                  s = await l.json();
                if (!l.ok) throw new Error(s.message || "Errore upload");
                (t &&
                  ((t.textContent = "✓ Foto salvata"),
                    (t.style.color = "var(--color-success)")),
                  UI.toast("Foto caricata", "success"));
              } catch (e) {
                ((a.innerHTML = athleteData.photo_path
                  ? `<img src="${Utils.escapeHtml(athleteData.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;;object-position:top">`
                  : `<span style="font-family:var(--font-display);font-size:3.5rem;font-weight:700;color:#000;">${Utils.initials(athleteData.full_name)}</span>`),
                  t &&
                  ((t.textContent = "Errore: " + e.message),
                    (t.style.color = "var(--color-pink)")),
                  UI.toast("Errore upload foto: " + e.message, "error"));
              } finally {
                (l && ((l.style.opacity = ""), (l.style.pointerEvents = "")),
                  URL.revokeObjectURL(s));
              }
            },
            { signal: moduleAbortController.signal },
          );
        let E = !1;
        const _ = (e) => {
          (document.querySelectorAll(".athlete-tab-panel").forEach((e) => {
            e.style.display = "none";
          }),
            document.querySelectorAll(".athlete-tab-btn").forEach((t) => {
              const a = t.dataset.tab === e;
              ((t.style.borderBottomColor = a
                ? "metrics" === t.dataset.tab
                  ? "var(--color-pink)"
                  : "var(--color-white)"
                : "transparent"),
                (t.style.color = a
                  ? "metrics" === t.dataset.tab
                    ? "var(--color-pink)"
                    : "var(--color-white)"
                  : "metrics" === t.dataset.tab
                    ? "var(--color-pink)"
                    : "var(--color-text-muted)"),
                (t.style.opacity = a ? "1" : "0.65"));
            }));
          const t = document.getElementById("tab-panel-" + e);
          (t && (t.style.display = "flex"),
            "metrics" !== e ||
            E ||
            ((E = !0),
              (async function (e) {
                const t = document.getElementById("vald-tab-content");
                if (t) {
                  t.innerHTML =
                    '<div style="display:flex;flex-direction:column;gap:8px;padding:8px 0;">\n      <div class="skeleton skeleton-title"></div>\n      <div class="skeleton skeleton-text" style="width:60%;"></div>\n      <div class="skeleton" style="height:160px;border-radius:var(--radius);"></div>\n    </div>';
                  try {
                    const a = await Store.get("analytics", "vald", {
                      athleteId: e,
                    });
                    if (!a || !a.hasData)
                      return void (t.innerHTML =
                        '\n          <div style="text-align:center;padding:var(--sp-4);background:rgba(255,0,255,0.04);border:1px solid rgba(255,0,255,0.1);border-radius:var(--radius);margin-top:8px;">\n            <i class="ph ph-lightning-slash" style="font-size:40px;color:var(--color-pink);opacity:0.4;display:block;margin-bottom:12px;"></i>\n            <p style="font-size:14px;font-weight:700;color:var(--color-text);margin-bottom:4px;">Nessun dato VALD disponibile</p>\n            <p style="font-size:12px;color:var(--color-text-muted);">Nessuna sessione ForceDeck trovata per questo atleta.<br>Sincronizza i dati da VALD Hub per visualizzare le performance.</p>\n          </div>');
                    const {
                      semaphore: n,
                      asymmetry: l,
                      profile: s,
                      ranking: i,
                      coachMessage: r,
                      testDate: o,
                      testType: d,
                      results: c,
                    } = a,
                      p = a.jumpHeight ?? s?.jumpHeight,
                      m = n?.rsimod?.current,
                      u = a.brakingImpulse,
                      g = a.asymmetryPct ?? l?.landing?.asymmetry,
                      v = n?.rsimod?.baseline,
                      x = a.baselineBraking,
                      w = n?.status || "GREEN",
                      $ = f("rsimod", m, v),
                      E = f("braking", u, x),
                      _ = f("asymmetry", g, null),
                      k = n?.status || "GREEN",
                      I = (function (e) {
                        const t = {},
                          a = f(
                            "rsimod",
                            e.semaphore?.rsimod?.current,
                            e.semaphore?.rsimod?.baseline,
                          ),
                          n =
                            (f("jh", e.profile?.jumpHeight, null),
                              e.semaphore?.status || "GREEN"),
                          l = f("braking", e.brakingImpulse, e.baselineBraking),
                          s = f(
                            "asymmetry",
                            e.asymmetryPct ?? e.asymmetry?.landing?.asymmetry,
                            null,
                          ),
                          i = e.asymmetry?.landing?.dominant;
                        if (
                          ([
                            "svgm-quadriceps-l",
                            "svgm-quadriceps-r",
                            "svgm-hamstrings-l",
                            "svgm-hamstrings-r",
                            "svgm-core",
                          ].forEach((e) => b(t, e, a)),
                            [
                              "svgm-hamstrings-l",
                              "svgm-hamstrings-r",
                              "svgm-glutes-l",
                              "svgm-glutes-r",
                              "svgm-calves-l",
                              "svgm-calves-r",
                              "svgm-lumbar",
                            ].forEach((e) => b(t, e, l)),
                            ["svgm-hipflexors", "svgm-core"].forEach((e) =>
                              b(t, e, n),
                            ),
                            "GREEN" !== s && "unknown" !== s)
                        ) {
                          const e = "SX" === i ? "r" : "l";
                          [
                            "svgm-quadriceps-",
                            "svgm-hamstrings-",
                            "svgm-glutes-",
                            "svgm-calves-",
                          ].forEach((a) => {
                            b(t, a + e, s);
                          });
                        }
                        return t;
                      })(a),
                      A = (e, t) =>
                        null == e || null == t || 0 === t
                          ? null
                          : (((e - t) / t) * 100).toFixed(1),
                      U = (e) =>
                        null == e
                          ? '<span style="color:var(--color-text-muted);font-size:10px;">No baseline</span>'
                          : `<span style="color:${e >= 0 ? "#00E676" : e >= -5 ? "#FFD600" : "#FF1744"};font-weight:600;">${e > 0 ? "+" : ""}${e}% vs baseline</span>`,
                      S =
                        {
                          GREEN: "#00E676",
                          YELLOW: "#FFD600",
                          RED: "#FF1744",
                          ALERT: "#FF6D00",
                        }[k] || "#888",
                      z = [
                        {
                          name: "Jump Height",
                          value: null != p ? p.toFixed(1) : "—",
                          unit: "cm",
                          status: w,
                          delta: U(null),
                          icon: "arrow-fat-up",
                        },
                        {
                          name: "RSImod",
                          value: null != m ? m.toFixed(3) : "—",
                          unit: "",
                          status: $,
                          delta: U(A(m, v)),
                          icon: "lightning",
                        },
                        {
                          name: "Braking Impulse",
                          value: null != u ? u.toFixed(0) : "—",
                          unit: "Ns",
                          status: E,
                          delta: U(A(u, x)),
                          icon: "arrows-in",
                        },
                        {
                          name: "Asimmetria",
                          value: null != g ? g.toFixed(1) : "—",
                          unit: "%",
                          status: _,
                          delta:
                            null != g
                              ? `<span style="color:var(--color-text-muted);font-size:10px;">${l?.landing?.dominant ?? "—"} dominante</span>`
                              : "",
                          icon: "arrows-left-right",
                        },
                      ];
                    t.innerHTML = `\n        <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-2);padding-bottom:var(--sp-2);border-bottom:1px solid var(--color-border);">\n          <div style="width:10px;height:10px;border-radius:50%;background:${S};box-shadow:0 0 8px ${S};flex-shrink:0;"></div>\n          <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${Utils.escapeHtml(n?.label || k)}</span>\n          <span style="font-size:10px;color:var(--color-text-muted);margin-left:auto;">Test: ${Utils.escapeHtml(o || "—")} · ${Utils.escapeHtml(d || "CMJ")}</span>\n        </div>\n\n        \x3c!-- ── HERO: immagini a tutto schermo ── --\x3e\n        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);margin-bottom:var(--sp-3);">\n          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">\n            <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Frontale</span>\n            ${h("front", I)}\n          </div>\n          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">\n            <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Posteriore</span>\n            ${h("back", I)}\n          </div>\n        </div>\n\n        \x3c!-- Legenda colori --\x3e\n        <div class="cmj-legend" style="margin-bottom:var(--sp-3);">\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#00E676;"></div>OK</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FFD600;"></div>Attenzione</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FF1744;"></div>Rischio</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FF6D00;"></div>Alert</div>\n        </div>\n\n        \x3c!-- ── INDICATORI SOTTO ── --\x3e\n        <div style="display:flex;flex-direction:column;gap:var(--sp-2);">\n\n          \x3c!-- 4 KPI card --\x3e\n          <div class="cmj-kpi-grid">\n            ${z
                      .map((e) => {
                        return `\n              <div class="cmj-kpi-card ${y(e.status)}">\n                <div class="cmj-kpi-name"><i class="ph ph-${e.icon}" style="margin-right:4px;"></i>${e.name}</div>\n                <div class="cmj-kpi-value">${e.value}<span class="cmj-kpi-unit">${e.unit}</span></div>\n                <div class="cmj-kpi-delta">${((t = e.status), "unknown" === t ? "" : `<span class="cmj-kpi-badge ${{ GREEN: "green", YELLOW: "yellow", RED: "red", ALERT: "alert", unknown: "" }[t]}">${{ GREEN: "✓ OK", YELLOW: "⚠ Attenzione", RED: "✗ Rischio", ALERT: "⚡ Alert", unknown: "—" }[t]}</span>`)} ${e.delta}</div>\n              </div>`;
                        var t;
                      })
                      .join(
                        "",
                      )}\n          </div>\n\n          \x3c!-- Coach --\x3e\n          <div class="cmj-coach-msg ${y(k)}">\n            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:6px;">\n              <i class="ph ph-chalkboard-teacher" style="margin-right:4px;"></i>Raccomandazione Coach\n            </div>\n            <p style="font-size:13px;line-height:1.6;color:var(--color-text);font-style:italic;">${Utils.escapeHtml(r || "")}</p>\n            ${n?.action ? `<div style="margin-top:8px;font-size:12px;font-weight:600;color:var(--color-text-muted);">${Utils.escapeHtml(n.action)}</div>` : ""}\n          </div>\n\n          \x3c!-- Trend RSImod --\x3e\n          <div class="cmj-force-curve">\n            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">\n              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);">\n                <i class="ph ph-chart-line-up" style="margin-right:4px;"></i>Trend RSImod / Salto (ultimi test)\n              </span>\n              <span style="font-size:10px;color:var(--color-text-muted);">${c?.length || 0} test</span>\n            </div>\n            ${(function (
                        e,
                        t,
                      ) {
                        const a =
                          {
                            GREEN: "#00E676",
                            YELLOW: "#FFD600",
                            RED: "#FF1744",
                            ALERT: "#FF6D00",
                          }[t] || "#00E676",
                          n = (e || [])
                            .slice(-12)
                            .reverse()
                            .map((e) => {
                              const t = e.metrics || {};
                              return parseFloat(
                                t.RSIModified?.Value ??
                                t.JumpHeight?.Value ??
                                t.JumpHeightTotal?.Value ??
                                0,
                              );
                            })
                            .filter((e) => e > 0);
                        if (n.length < 2)
                          return '<div style="text-align:center;padding:16px;font-size:11px;color:var(--color-text-muted);">Dati curva non disponibili</div>';
                        const l = 0.9 * Math.min(...n),
                          s = 1.1 * Math.max(...n),
                          i = (e) => 60 - ((e - l) / (s - l)) * 60,
                          r = (e) => (e / (n.length - 1)) * 400,
                          o = n.indexOf(Math.max(...n)),
                          d = n.length - 1,
                          c = n
                            .map(
                              (e, t) => `${r(t).toFixed(1)},${i(e).toFixed(1)}`,
                            )
                            .join(" ");
                        return `\n      <svg class="cmj-force-svg" viewBox="0 0 400 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">\n        <defs>\n          <linearGradient id="cmj-grad" x1="0" y1="0" x2="0" y2="1">\n            <stop offset="0%" stop-color="${a}" stop-opacity="0.3"/>\n            <stop offset="100%" stop-color="${a}" stop-opacity="0"/>\n          </linearGradient>\n        </defs>\n        \x3c!-- Area fill --\x3e\n        <path d="${`M${r(0)},60 ` + n.map((e, t) => `L${r(t).toFixed(1)},${i(e).toFixed(1)}`).join(" ") + ` L${r(d)},60 Z`}" fill="url(#cmj-grad)" />\n        \x3c!-- Line --\x3e\n        <polyline points="${c}" fill="none" stroke="${a}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>\n        \x3c!-- Current (last) dot --\x3e\n        <circle cx="${r(d).toFixed(1)}" cy="${i(n[d]).toFixed(1)}" r="4" fill="${a}" />\n        \x3c!-- Peak dot --\x3e\n        ${o !== d ? `<circle cx="${r(o).toFixed(1)}" cy="${i(n[o]).toFixed(1)}" r="3" fill="white" opacity="0.5"/>` : ""}\n      </svg>`;
                      })(
                        c,
                        k,
                      )}\n            <div style="display:flex;justify-content:space-between;margin-top:4px;">\n              <span style="font-size:9px;color:var(--color-text-muted);">Più vecchio</span>\n              <span style="font-size:9px;color:var(--color-text-muted);">Più recente</span>\n            </div>\n          </div>\n\n          \x3c!-- Asimmetria SX / DX --\x3e\n          ${l ? `\n          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);">\n            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:10px;">\n              <i class="ph ph-arrows-left-right" style="margin-right:4px;"></i>Dettaglio Asimmetria SX / DX\n            </div>\n            <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--sp-1);">\n              <div style="text-align:left;">\n                <div style="font-size:9px;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:2px;">SX</div>\n                <div style="font-size:1.2rem;font-family:var(--font-display);font-weight:700;">${l.landing?.left ?? "—"}<span style="font-size:11px;color:var(--color-text-muted);"> N</span></div>\n                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:4px;overflow:hidden;"><div style="height:100%;background:#00f2fe;border-radius:4px;width:${Math.round(((l.landing?.left || 0) / ((l.landing?.left || 0) + (l.landing?.right || 1))) * 100)}%;"></div></div>\n              </div>\n              <div style="text-align:center;"><div class="cmj-kpi-badge ${"ALERT" === _ ? "alert" : "YELLOW" === _ ? "yellow" : "green"}" style="font-size:10px;padding:4px 10px;">${null != g ? g.toFixed(1) + "%" : "—"}</div></div>\n              <div style="text-align:right;">\n                <div style="font-size:9px;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:2px;">DX</div>\n                <div style="font-size:1.2rem;font-family:var(--font-display);font-weight:700;">${l.landing?.right ?? "—"}<span style="font-size:11px;color:var(--color-text-muted);"> N</span></div>\n                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:4px;overflow:hidden;"><div style="height:100%;background:#ff007a;border-radius:4px;margin-left:auto;width:${Math.round(((l.landing?.right || 0) / ((l.landing?.left || 0) + (l.landing?.right || 1))) * 100)}%;"></div></div>\n              </div>\n            </div>\n          </div>` : ""}\n\n          \x3c!-- Classifica --\x3e\n          ${i && i.length > 0 ? `\n          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);">\n            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:10px;">\n              <i class="ph ph-trophy" style="margin-right:4px;"></i>Classifica Squadra (RSImod)\n            </div>\n            <div style="display:flex;flex-direction:column;gap:4px;">\n              ${i.map((t, a) => `\n                <div style="display:flex;align-items:center;gap:10px;padding:5px 8px;border-radius:6px;background:${t.athlete_id === e ? "rgba(255,0,122,0.08)" : "transparent"};">\n                  <span style="font-size:12px;font-weight:700;color:var(--color-text-muted);width:18px;">#${a + 1}</span>\n                  <span style="flex:1;font-size:12px;">${Utils.escapeHtml(t.name || t.full_name || "—")}</span>\n                  <span style="font-size:12px;font-weight:700;color:${t.athlete_id === e ? "var(--color-pink)" : "var(--color-text)"};">${t.rsimod ?? "—"}</span>\n                </div>`).join("")}\n            </div>\n          </div>` : ""}\n\n        </div>\n      `;
                  } catch (e) {
                    t.innerHTML = `\n        <div style="text-align:center;padding:var(--sp-4);background:rgba(255,59,48,0.04);border:1px solid rgba(255,59,48,0.2);border-radius:var(--radius);">\n          <i class="ph ph-warning" style="font-size:36px;color:#FF3B30;opacity:0.6;display:block;margin-bottom:8px;"></i>\n          <p style="font-size:13px;font-weight:700;color:var(--color-text);">Errore caricamento VALD</p>\n          <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${Utils.escapeHtml(e.message)}</p>\n        </div>`;
                  }
                }
              })(athleteId)));
        };
        document.querySelectorAll(".athlete-tab-btn").forEach((t) => {
          t.addEventListener("click", () => _(t.dataset.tab), {
            signal: moduleAbortController.signal,
          });
        });
        const k = document.getElementById("athlete-tab-bar"),
          I = document.getElementById("tab-scroll-indicator");
        if (k && I) {
          const t = () => {
            const e = k.scrollLeft + k.clientWidth >= k.scrollWidth - 10;
            I.style.opacity = e ? "0" : "0.8";
          };
          (k.addEventListener("scroll", t, {
            signal: moduleAbortController.signal,
          }),
            setTimeout(t, 100));
        }
        (_(startTab), v(athleteId));
      } catch (e) {
        appContainer.innerHTML = Utils.emptyState("Atleta non trovato", e.message);
      }
    } else renderMainList();
  }
  function g(e, t, a) {
    const n = a || "var(--color-white)";
    return `\n      <div style="display:flex; flex-direction:column; gap:2px;">\n        <span style="font-size:11px; color:var(--color-silver); text-transform:uppercase; font-weight:600; letter-spacing:0.04em;">${Utils.escapeHtml(e)}</span>\n        <span style="font-size:14px; font-weight:500; color:${n};">${t ? Utils.escapeHtml(String(t)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>\n      </div>`;
  }
  async function v(e) {
    const t = document.getElementById("ai-summary-section");
    if (t)
      try {
        const a = await Store.get("aiSummary", "athletes", { id: e });
        a &&
          (t.innerHTML = `\n          <div>\n            <p class="section-label">Report AI Prestazioni</p>\n            <div class="card" style="padding:var(--sp-3);">\n              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-2);margin-bottom:var(--sp-2);">\n                <span style="font-size:12px;color:var(--color-text-muted);">Periodo: ${Utils.formatDate(a.period_start)} → ${Utils.formatDate(a.period_end)}</span>\n                <span class="badge badge-pink">AI</span>\n              </div>\n              <p style="font-size:14px;line-height:1.7;white-space:pre-line;">${Utils.escapeHtml(a.summary_text)}</p>\n            </div>\n          </div>`);
      } catch { }
  }
  function f(e, t, a) {
    if (null == t) return "unknown";
    if ("asymmetry" === e)
      return t <= 8 ? "GREEN" : t <= 12 ? "YELLOW" : "ALERT";
    if (null == a || 0 === a) return "GREEN";
    const n = ((t - a) / a) * 100;
    return n >= -5 ? "GREEN" : n >= -10 ? "YELLOW" : "RED";
  }
  function y(e) {
    return (
      {
        GREEN: "status-green",
        YELLOW: "status-yellow",
        RED: "status-red",
        ALERT: "status-alert",
        unknown: "",
      }[e] || ""
    );
  }
  function b(e, t, a) {
    const n = { ALERT: 4, RED: 3, YELLOW: 2, GREEN: 1, unknown: 0 };
    (n[a] || 0) > (n[e[t]] || 0) && (e[t] = a);
  }
  function h(e, t) {
    const a = (e) =>
      (function (e, t) {
        return (
          {
            GREEN: "muscle-green",
            YELLOW: "muscle-yellow",
            RED: "muscle-red",
            ALERT: "muscle-alert",
          }[e[t]] || "muscle-default"
        );
      })(t, e),
      n = `assets/img/anatomy/body_${e}.png`,
      l = `\n      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" aria-hidden="true">\n        <defs>\n          <filter id="glow-front">\n            <feGaussianBlur stdDeviation="1.5" result="blur"/>\n            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>\n          </filter>\n        </defs>\n        <g filter="url(#glow-front)" opacity="0.82">\n          \x3c!-- Core / Abs --\x3e\n          <ellipse id="svgm-core" class="${a("svgm-core")}" cx="50" cy="39" rx="9" ry="7" />\n          \x3c!-- Hip Flexors --\x3e\n          <ellipse id="svgm-hipflexors" class="${a("svgm-hipflexors")}" cx="50" cy="49" rx="11" ry="4" />\n          \x3c!-- Quadriceps SX (destra dello schermo = lato sinistro atleta) --\x3e\n          <ellipse id="svgm-quadriceps-l" class="${a("svgm-quadriceps-l")}" cx="43" cy="64" rx="7" ry="10" />\n          \x3c!-- Quadriceps DX --\x3e\n          <ellipse id="svgm-quadriceps-r" class="${a("svgm-quadriceps-r")}" cx="57" cy="64" rx="7" ry="10" />\n          \x3c!-- Adductors SX --\x3e\n          <ellipse id="svgm-adductors-l" class="${"muscle-default" === a("svgm-adductors-l") ? "muscle-default" : a("svgm-adductors-l")}" cx="47" cy="66" rx="3" ry="9" />\n          \x3c!-- Adductors DX --\x3e\n          <ellipse id="svgm-adductors-r" class="muscle-default" cx="53" cy="66" rx="3" ry="9" />\n          \x3c!-- Tibialis SX --\x3e\n          <ellipse id="svgm-tibialis-l" class="muscle-default" cx="43" cy="83" rx="4" ry="7" />\n          \x3c!-- Tibialis DX --\x3e\n          <ellipse id="svgm-tibialis-r" class="muscle-default" cx="57" cy="83" rx="4" ry="7" />\n        </g>\n      </svg>`,
      s = `\n      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" aria-hidden="true">\n        <defs>\n          <filter id="glow-back">\n            <feGaussianBlur stdDeviation="1.5" result="blur"/>\n            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>\n          </filter>\n        </defs>\n        <g filter="url(#glow-back)" opacity="0.82">\n          \x3c!-- Thoracic (upper back) --\x3e\n          <ellipse id="svgm-thoracic" class="muscle-default" cx="50" cy="28" rx="12" ry="7" />\n          \x3c!-- Lumbar --\x3e\n          <ellipse id="svgm-lumbar" class="${a("svgm-lumbar")}" cx="50" cy="40" rx="8" ry="6" />\n          \x3c!-- Glutes SX --\x3e\n          <ellipse id="svgm-glutes-l" class="${a("svgm-glutes-l")}" cx="44" cy="52" rx="8" ry="7" />\n          \x3c!-- Glutes DX --\x3e\n          <ellipse id="svgm-glutes-r" class="${a("svgm-glutes-r")}" cx="56" cy="52" rx="8" ry="7" />\n          \x3c!-- Hamstrings SX --\x3e\n          <ellipse id="svgm-hamstrings-l" class="${a("svgm-hamstrings-l")}" cx="43" cy="66" rx="7" ry="10" />\n          \x3c!-- Hamstrings DX --\x3e\n          <ellipse id="svgm-hamstrings-r" class="${a("svgm-hamstrings-r")}" cx="57" cy="66" rx="7" ry="10" />\n          \x3c!-- Calves SX --\x3e\n          <ellipse id="svgm-calves-l" class="${a("svgm-calves-l")}" cx="43" cy="83" rx="4.5" ry="7" />\n          \x3c!-- Calves DX --\x3e\n          <ellipse id="svgm-calves-r" class="${a("svgm-calves-r")}" cx="57" cy="83" rx="4.5" ry="7" />\n        </g>\n      </svg>`;
    return `<div style="position:relative;width:100%;">\n      <img src="${n}" alt="Corpo femminile vista ${"front" === e ? "frontale" : "posteriore"}"\n        style="width:100%;height:auto;display:block;border-radius:8px;object-fit:cover;"\n        onerror="this.style.display='none'">\n      ${"front" === e ? l : s}\n    </div>`;
  }
  function x(e) {
    if ("undefined" != typeof google && google.maps && google.maps.places)
      return (w(), void e());
    const t = window.GOOGLE_MAPS_API_KEY;
    if (!t) return;
    if (document.querySelector("script[data-gmaps-places]")) {
      const t = setInterval(() => {
        "undefined" != typeof google &&
          google.maps?.places &&
          (clearInterval(t), w(), e());
      }, 100);
      return;
    }
    const a = "__gmPlaces_" + Date.now();
    window[a] = () => {
      (delete window[a], w(), e());
    };
    const n = document.createElement("script");
    ((n.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(t)}&libraries=places&callback=${a}`),
      (n.async = !0),
      (n.defer = !0),
      (n.dataset.gmapsPlaces = "1"),
      document.head.appendChild(n));
  }
  function w() {
    if (document.getElementById("gm-pac-styles")) return;
    const e = document.createElement("style");
    ((e.id = "gm-pac-styles"),
      (e.textContent =
        "\n      .pac-container {\n        background: #18181c !important;\n        border: 1px solid rgba(255,255,255,0.12) !important;\n        border-radius: 12px !important;\n        box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;\n        font-family: inherit !important;\n        overflow: hidden !important;\n        margin-top: 4px !important;\n        z-index: 100000 !important;\n      }\n      .pac-container::after { display: none !important; }\n      .pac-item {\n        color: rgba(255,255,255,0.8) !important;\n        border-top: 1px solid rgba(255,255,255,0.06) !important;\n        padding: 10px 14px !important;\n        cursor: pointer !important;\n        font-size: 13px !important;\n        display: flex !important;\n        align-items: center !important;\n        gap: 10px !important;\n      }\n      .pac-item:first-child { border-top: none !important; }\n      .pac-item:hover, .pac-item-selected { background: rgba(0,229,255,0.08) !important; }\n      .pac-item-query { color: #fff !important; font-weight: 600 !important; font-size: 13px !important; }\n      .pac-matched { color: #00e5ff !important; font-weight: 700 !important; }\n      .pac-icon { display: none !important; }\n      .pac-secondary-text { color: rgba(255,255,255,0.45) !important; font-size: 12px !important; }\n    "),
      document.head.appendChild(e));
  }
  function $(e, t) {
    if (!e || "undefined" == typeof google || !google.maps?.places) return;
    const a = new google.maps.places.Autocomplete(e, {
      types: ["establishment", "geocode"],
      fields: ["formatted_address", "geometry", "name", "address_components"],
    });
    a.addListener("place_changed", () => {
      const n = a.getPlace();
      if (!n.geometry) return;
      const l = n.geometry.location.lat(),
        s = n.geometry.location.lng(),
        i = n.formatted_address || e.value;
      e.value = i;
      let r = "";
      if (n.address_components) {
        const e = n.address_components.find(
          (e) =>
            e.types.includes("locality") || e.types.includes("postal_town"),
        );
        e && (r = e.long_name);
      }
      t && t({ lat: l, lng: s, address: i, city: r, place: n });
    });
  }
  return {
    destroy: function () {
      (moduleAbortController.abort(), (moduleAbortController = new AbortController()));
    },
    init: async function () {
      const appEl = document.getElementById("app");
      if (!appEl) return;
      (UI.loading(!0), (appEl.innerHTML = UI.skeletonPage()));
      const currentUser = App.getUser(),
        currentRoute = Router.getCurrentRoute(),
        routeMap = {
          "athlete-profile": "anagrafica",
          "athlete-payments": "pagamenti",
          "athlete-metrics": "metrics",
          "athlete-documents": "documenti",
        };
      try {
        if ("atleta" === currentUser?.role && currentUser.athleteId)
          return (
            (globalTeamsList = await Store.get("teams", "athletes")),
            (globalSelectedId = currentUser.athleteId),
            void (await renderAthleteProfile(
              currentUser.athleteId,
              "anagrafica",
            ))
          );
        if (
          (([globalTeamsList, globalAthletesList] = await Promise.all([
            Store.get("teams", "athletes"),
            Store.get("listLight", "athletes"),
          ])),
            routeMap[currentRoute])
        )
          return (
            (globalActiveTab = routeMap[currentRoute]),
            (globalSelectedId = null),
            void renderMainLayout()
          );
        const params = Router.getParams();
        params.id
          ? ((globalSelectedId = params.id),
            await renderAthleteProfile(params.id, "anagrafica"))
          : ((globalSelectedId = null),
            (globalActiveTab = "anagrafica"),
            renderMainLayout());
      } catch (err) {
        ((appEl.innerHTML = Utils.emptyState(
          "Errore nel caricamento atleti",
          err.message + (err.stack ? ` [${err.stack.split("\n")[0]}]` : ""),
        )),
          UI.toast("Errore caricamento atleti", "error"));
      } finally {
        UI.loading(!1);
      }
    },
  };
})();
window.Athletes = Athletes;
