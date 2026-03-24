"use strict";
const Athletes = (() => {
  let e = new AbortController(),
    t = [],
    a = [],
    n = "",
    s = "anagrafica",
    l = null,
    i = new Set(),
    r = !1;
  function o() {
    "undefined" != typeof FilterState &&
      (FilterState.save("athletes", "team", n),
      FilterState.save("athletes", "tab", s));
  }
  function d(e, t) {
    let a = (e || "").toUpperCase();
    return a.match(/^U\d+$/)
      ? a.replace("U", "Under ")
      : a
        ? e + " — " + t
        : t || "";
  }
  function c() {
    const g = document.getElementById("main-tab-content");
    if (!g) return;
    const v = Array.isArray(a) ? a : [],
      y = n
        ? t.filter(
            (e) =>
              String(e.team_id) === String(n) ||
              (!(!e.team_season_ids || !Array.isArray(e.team_season_ids)) &&
                e.team_season_ids.some((e) => String(e) === String(n))),
          )
        : t;
    ((g.innerHTML = `\n      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;">\n        <p class="page-subtitle">${y.length} atleti${n ? " in squadra selezionata" : " totali"}</p>\n        <div style="display:flex;align-items:center;gap:var(--sp-2);">\n          <div class="input-wrapper" style="position:relative;min-width:220px;">\n            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>\n            <input type="text" id="athlete-search" class="form-input" placeholder="Cerca atleta..." style="padding-left:36px;height:42px;font-size:13px;">\n          </div>\n          <button class="btn btn-primary" id="new-athlete-btn" type="button">+ NUOVO ATLETA</button>\n        </div>\n      </div>\n      <div class="filter-bar" id="team-filter">\n        <button class="filter-chip ${n ? "" : "active"}" data-team="" type="button">Tutti</button>\n        ${v.map((e) => `<button class="filter-chip ${n === e.id ? "active" : ""}" data-team="${Utils.escapeHtml(e.id)}" type="button">${Utils.escapeHtml(d(e.category, e.name))}</button>`).join("")}\n      </div>\n      ${
      0 === y.length
        ? Utils.emptyState(
            "Nessun atleta trovato",
            "Aggiungi il primo atleta con il pulsante in alto.",
          )
        : `<div class="grid-3" id="athletes-grid">${y
            .map((e) =>
              (function (e) {
                const t = e.acwr_risk
                    ? Utils.acwrRiskColor(e.acwr_risk)
                    : "transparent",
                  a = p(e.full_name);
                return `\n      <div class="card" style="cursor:pointer;position:relative;overflow:hidden;" data-athlete-id="${Utils.escapeHtml(e.id)}" data-name="${Utils.escapeHtml((e.full_name || "").toLowerCase())}" data-role="${Utils.escapeHtml((e.role || "").toLowerCase())}" data-team="${Utils.escapeHtml(((e.team_names || []).map((e) => e.name).join(" ") + " " + (e.team_name || "")).toLowerCase())}">\n        ${e.acwr_risk && "moderate" !== e.acwr_risk && "low" !== e.acwr_risk ? `<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:24px;height:24px;border-radius:50%;background:${t};display:flex;align-items:center;justify-content:center;font-size:14px;color:#000;box-shadow:0 0 8px ${t};"><i class="ph-fill ph-warning-circle"></i></div>` : ""}\n        <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">\n          <div style="width:48px;height:48px;background:${a};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;">${e.photo_path ? `<img src="${Utils.escapeHtml(e.photo_path)}" style="width:100%;height:100%;object-fit:cover;object-position:center;display:block;border-radius:8px;">` : `\n            ${null != e.jersey_number ? Utils.escapeHtml(String(e.jersey_number)) : Utils.initials(e.full_name)}`}\n          </div>\n          <div style="overflow:hidden;flex:1;">\n            <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(e.full_name)}</div>\n            <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(e.role || "—")}</div>\n            <div style="margin-top:4px; display:flex; flex-wrap:wrap; gap:4px;">\n              ${e.team_names && e.team_names.length > 0 ? e.team_names.map((e) => Utils.badge(d(e.category, e.name), "muted")).join("") : Utils.badge(d(e.category, e.team_name), "muted")}\n            </div>\n          </div>\n        </div>\n      </div>`;
              })(e),
            )
            .join("")}</div>`
    }\n    `),
      g.addEventListener(
        "click",
        (e) => {
          const t = e.target.closest("[data-team]");
          (t && ((n = t.dataset.team), c()), o());
          const a = e.target.closest("[data-athlete-id]");
          if (a)
            if (r) {
              const e = a.dataset.athleteId;
              (i.has(e)
                ? (i.delete(e), a.classList.remove("selected"))
                : (i.add(e), a.classList.add("selected")),
                m());
            } else
              (o(),
                (s = a.dataset.athleteId),
                (l = s),
                sessionStorage.setItem("last_athlete_id", s),
                f(s, "anagrafica"));
          var s;
        },
        { signal: e.signal },
      ),
      document.getElementById("new-athlete-btn")?.addEventListener(
        "click",
        () =>
          (function () {
            a.map(
              (e) =>
                `<option value="${Utils.escapeHtml(e.id)}">${Utils.escapeHtml(d(e.category, e.name))}</option>`,
            ).join("");
            let n = 1;
            const l = [
                "Dati Obbligatori",
                "Dati Sportivi",
                "Contatti",
                "Documenti",
              ],
              i = [
                `\n  <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-fname">Nome *</label><input id="na-fname" class="form-input" type="text" placeholder="Marco" required></div>\n        <div class="form-group"><label class="form-label" for="na-lname">Cognome *</label><input id="na-lname" class="form-input" type="text" placeholder="Rossi" required></div>\n      </div>\n      <div class="form-grid">\n        <div class="form-group">\n          <label class="form-label">Squadre *</label>\n          <div id="na-team-panel" class="multi-team-panel" style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:10px;background:rgba(255,255,255,0.04);border:1px solid var(--color-border);border-radius:var(--radius);">\n            ${a.map((e) => `\n              <label class="multi-team-option" for="na-team-${Utils.escapeHtml(e.id)}">\n                <input type="checkbox" id="na-team-${Utils.escapeHtml(e.id)}" class="na-team-cb" value="${Utils.escapeHtml(e.id)}" style="display:none;">\n                <span class="multi-team-label">${Utils.escapeHtml(d(e.category, e.name))}${e.season ? ' \u2014 ' + Utils.escapeHtml(e.season) : ''}</span>\n              </label>\n            `).join("")}\n          </div>\n          <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;"><i class="ph ph-info"></i> Seleziona una o più squadre</div>\n        </div>\n        <div class="form-group"><label class="form-label" for="na-birth">Data di Nascita</label><input id="na-birth" class="form-input" type="date"></div>\n      </div>\n      <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-birthplace">Luogo di Nascita</label><input id="na-birthplace" class="form-input" type="text" placeholder="Roma"></div>\n        <div class="form-group"><label class="form-label" for="na-rescity">Città di Residenza</label><input id="na-rescity" class="form-input" type="text" placeholder="Milano"></div>\n      </div>`,
                '\n  <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-role">Ruolo</label><input id="na-role" class="form-input" type="text" placeholder="Palleggiatrice"></div>\n        <div class="form-group"><label class="form-label" for="na-jersey">N° Maglia</label><input id="na-jersey" class="form-input" type="number" min="1" max="99" placeholder="10"></div>\n      </div>\n  <div class="form-grid">\n    <div class="form-group"><label class="form-label" for="na-height">Altezza (cm)</label><input id="na-height" class="form-input" type="number" placeholder="180"></div>\n    <div class="form-group"><label class="form-label" for="na-weight">Peso (kg)</label><input id="na-weight" class="form-input" type="number" placeholder="75"></div>\n  </div>',
                '\n    <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-phone">Cellulare</label><input id="na-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>\n        <div class="form-group"><label class="form-label" for="na-email">E-Mail</label><input id="na-email" class="form-input" type="email" placeholder="atleta@email.com"></div>\n      </div>\n  <div class="form-group">\n    <label class="form-label" for="na-resaddr" style="display:flex;align-items:center;gap:8px;">\n      Via di Residenza\n      <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">\n        <i class="ph ph-google-logo"></i> Google Maps\n      </span>\n    </label>\n    <div style="position:relative;">\n      <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>\n      <input id="na-resaddr" class="form-input" type="text" placeholder="Via Roma 1, Milano" autocomplete="off" style="padding-left:40px;">\n    </div>\n  </div>',
                '\n    <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-fiscal">Codice Fiscale</label><input id="na-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>\n        <div class="form-group"><label class="form-label" for="na-doc">Documento d\'Identità</label><input id="na-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>\n      </div>\n      <div class="form-grid">\n        <div class="form-group"><label class="form-label" for="na-medcert">Scadenza Cert. Medico</label><input id="na-medcert" class="form-input" type="date"></div>\n        <div class="form-group"><label class="form-label" for="na-fipav">Matricola FIPAV</label><input id="na-fipav" class="form-input" type="text" placeholder="FI-123456"></div>\n      </div>\n      <div class="form-group"><label class="form-label" for="na-parent">Contatto genitore (per minori)</label><input id="na-parent" class="form-input" type="text" placeholder="Nome cognome genitore"></div>',
              ],
              r = {},
              o = () => {
                document
                  .querySelectorAll(
                    "#wizard-step-content input:not([type=checkbox]), #wizard-step-content select",
                  )
                  .forEach((e) => {
                    r[e.id] = e.value;
                  });
                const e = Array.from(
                  document.querySelectorAll(".na-team-cb:checked"),
                ).map((e) => e.value);
                (e.length > 0 || r["na-teams-touched"]) &&
                  ((r.team_season_ids = e), (r["na-teams-touched"] = !0));
              },
              c = () => {
                const e = document.getElementById("wizard-body");
                if (!e) return;
                ((e.innerHTML = `\n  <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">\n    ${[1, 2, 3, 4].map((e) => `\n          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">\n            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;\n              ${e < n ? "background:var(--color-success);color:#000;" : e === n ? "background:var(--color-pink);color:#fff;" : "background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);"}">${e < n ? "✓" : e}</div>\n            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${e === n ? "var(--color-white)" : "rgba(255,255,255,0.35)"};">${l[e - 1]}</div>\n          </div>\n          ${e < 4 ? `<div style="flex:0.5;height:2px;background:${e < n ? "var(--color-success)" : "rgba(255,255,255,0.1)"};margin-bottom:20px;"></div>` : ""}\n        `).join("")}\n      </div><div id="wizard-step-content">${i[n - 1]}</div><div id="na-error" class="form-error hidden"></div>`),
                  requestAnimationFrame(() => {
                    (Object.entries(r).forEach(([e, t]) => {
                      if ("team_season_ids" === e || "na-teams-touched" === e) return;
                      const a = document.getElementById(e);
                      a && (a.value = t);
                    }),
                      r.team_season_ids &&
                        r.team_season_ids.forEach((e) => {
                          const t = document.getElementById(`na-team-${e}`);
                          t &&
                            ((t.checked = !0),
                            t
                              .closest(".multi-team-option")
                              ?.classList.add("selected"));
                        }),
                      document.querySelectorAll(".na-team-cb").forEach((e) => {
                        e.addEventListener("change", (e) => {
                          const t = e.target.closest(".multi-team-option");
                          (e.target.checked
                            ? t?.classList.add("selected")
                            : t?.classList.remove("selected"),
                            o());
                        });
                      }));
                  }));
                const t = document.getElementById("na-prev"),
                  a = document.getElementById("na-next"),
                  s = document.getElementById("na-save");
                (t && (t.style.display = 1 === n ? "none" : ""),
                  a && (a.style.display = 4 === n ? "none" : ""),
                  s && (s.style.display = 4 === n ? "" : "none"),
                  3 === n &&
                    loadGoogleMaps(() =>
                      initGoogleMapsAutocomplete(
                        document.getElementById("na-resaddr"),
                        ({ address: e, city: t }) => {
                          if (t) {
                            const e = document.getElementById("na-rescity");
                            e && ((e.value = t), (r["na-rescity"] = t));
                          }
                        },
                      ),
                    ));
              },
              p = UI.modal({
                title: "Nuovo Atleta",
                body: '<div id="wizard-body"></div>',
                footer:
                  '\n  <button class="btn btn-ghost btn-sm" id="na-cancel" type="button">Annulla</button>\n        <button class="btn btn-default btn-sm" id="na-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>\n        <button class="btn btn-primary btn-sm" id="na-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>\n        <button class="btn btn-primary btn-sm" id="na-save" type="button" style="display:none;">CREA ATLETA</button>',
              });
            (c(),
              document
                .getElementById("na-cancel")
                ?.addEventListener("click", () => p.close(), {
                  signal: e.signal,
                }),
              document.getElementById("na-prev")?.addEventListener(
                "click",
                () => {
                  (o(), n > 1 && (n--, c()));
                },
                { signal: e.signal },
              ),
              document.getElementById("na-next")?.addEventListener(
                "click",
                () => {
                  if (1 === n) {
                    const e = document.getElementById("na-fname")?.value.trim(),
                      t = document.getElementById("na-lname")?.value.trim(),
                      a = Array.from(
                        document.querySelectorAll(".na-team-cb:checked"),
                      ),
                      n = document.getElementById("na-error");
                    if (!e || !t || 0 === a.length)
                      return (
                        (n.textContent =
                          "Nome, cognome e almeno una squadra sono obbligatori"),
                        void n.classList.remove("hidden")
                      );
                  }
                  (o(), n < 4 && (n++, c()));
                },
                { signal: e.signal },
              ),
              document.getElementById("na-save")?.addEventListener(
                "click",
                async () => {
                  o();
                  const e = document.getElementById("na-error"),
                    a = document.getElementById("na-save");
                  ((a.disabled = !0), (a.textContent = "Creazione..."));
                  try {
                    (await Store.api("create", "athletes", {
                      first_name: r["na-fname"] || "",
                      last_name: r["na-lname"] || "",
                      team_season_ids: r.team_season_ids || [],
                      jersey_number: r["na-jersey"] || null,
                      role: r["na-role"] || null,
                      birth_date: r["na-birth"] || null,
                      birth_place: r["na-birthplace"] || null,
                      residence_address: r["na-resaddr"] || null,
                      residence_city: r["na-rescity"] || null,
                      phone: r["na-phone"] || null,
                      email: r["na-email"] || null,
                      identity_document: r["na-doc"] || null,
                      fiscal_code: (r["na-fiscal"] || "").toUpperCase() || null,
                      medical_cert_expires_at: r["na-medcert"] || null,
                      federal_id: r["na-fipav"] || null,
                      height_cm: r["na-height"] || null,
                      weight_kg: r["na-weight"] || null,
                      parent_contact: r["na-parent"] || null,
                    }),
                      (t = await Store.get("listLight", "athletes").catch(
                        () => t,
                      )),
                      (s = "anagrafica"),
                      p.close(),
                      UI.toast("Atleta creato", "success"),
                      u());
                  } catch (t) {
                    ((e.textContent = t.message),
                      e.classList.remove("hidden"),
                      (a.disabled = !1),
                      (a.textContent = "CREA ATLETA"));
                  }
                },
                { signal: e.signal },
              ));
          })(),
        { signal: e.signal },
      ));
    const b = document.getElementById("athlete-search");
    if (b) {
      let t;
      b.addEventListener(
        "input",
        () => {
          (clearTimeout(t),
            (t = setTimeout(() => {
              const e = b.value.trim().toLowerCase();
              let t = 0;
              g.querySelectorAll("[data-athlete-id]").forEach((a) => {
                const n =
                  (a.dataset.name || "").includes(e) ||
                  (a.dataset.role || "").includes(e) ||
                  (a.dataset.team || "").includes(e);
                ((a.style.display = n ? "" : "none"), n && t++);
              });
              const a = document.getElementById("athletes-grid");
              let n = document.getElementById("search-empty-state");
              const s = g.querySelectorAll("[data-athlete-id]").length;
              0 === t && s > 0
                ? (!n && a
                    ? a.insertAdjacentHTML(
                        "afterend",
                        `<div id="search-empty-state">${Utils.emptyState("Nessun atleta trovato", "Nessun risultato corrisponde alla tua ricerca.")}</div>`,
                      )
                    : n && (n.style.display = "block"),
                  a && (a.style.display = "none"))
                : (n && (n.style.display = "none"),
                  a && (a.style.display = ""));
            }, 250)));
        },
        { signal: e.signal },
      );
    }
  }
  function p(e) {
    const t = [
      "#f472b6",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#0ea5e9",
    ];
    if (!e) return t[0];
    let a = 0;
    for (let t = 0; t < e.length; t++) a = e.charCodeAt(t) + ((a << 5) - a);
    return t[Math.abs(a) % t.length];
  }
  function m() {
    let e = document.getElementById("athlete-bulk-bar");
    e ||
      ((e = document.createElement("div")),
      (e.id = "athlete-bulk-bar"),
      (e.className = "bulk-action-bar"),
      (e.innerHTML =
        '\n        <span class="bulk-action-count" id="bulk-count-label">0 selezionati</span>\n        <div class="bulk-action-divider"></div>\n        <button class="btn btn-sm btn-ghost" id="bulk-cancel-btn" type="button">Annulla</button>\n        <button class="btn btn-sm btn-primary" id="bulk-category-btn" type="button">Cambia categoria</button>\n      '),
      document.body.appendChild(e),
      document
        .getElementById("bulk-cancel-btn")
        ?.addEventListener("click", () => {
          (i.clear(),
            (r = !1),
            document
              .querySelectorAll("[data-athlete-id].selected")
              .forEach((e) => e.classList.remove("selected")),
            document
              .getElementById("athletes-grid")
              ?.classList.remove("bulk-select-mode"),
            m());
        }),
      document
        .getElementById("bulk-category-btn")
        ?.addEventListener("click", () => {
          0 !== i.size &&
            UI.toast(
              `${i.size} atleti selezionati — funzione categoria in sviluppo`,
              "info",
              3e3,
            );
        }));
    const t = i.size,
      a = document.getElementById("bulk-count-label");
    (a && (a.textContent = `${t} selezionati`),
      t > 0
        ? (e.classList.add("visible"),
          (r = !0),
          document
            .getElementById("athletes-grid")
            ?.classList.add("bulk-select-mode"))
        : (e.classList.remove("visible"),
          0 === i.size &&
            ((r = !1),
            document
              .getElementById("athletes-grid")
              ?.classList.remove("bulk-select-mode"))));
  }
  function u() {
    ((document.getElementById("app").innerHTML =
      `\n      <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:0;margin-bottom:0;">\n        <div>\n          <h1 class="page-title">Atleti</h1>\n          <p class="page-subtitle">${t.length} atleti nel sistema</p>\n        </div>\n      </div>\n      <div id="main-tab-content" style="flex:1;padding:var(--sp-4) 0;"></div>\n    `),
      document.querySelectorAll("[data-maintab]").forEach((t) =>
        t.addEventListener(
          "click",
          () => {
            ("metrics" === t.dataset.maintab && (n = ""), g(t.dataset.maintab));
          },
          { signal: e.signal },
        ),
      ),
      g(s));
  }
  function g(i) {
    ((s = i),
      document.querySelectorAll("[data-maintab]").forEach((e) => {
        const t = e.dataset.maintab === i;
        ((e.style.borderBottomColor = t ? "var(--color-pink)" : "transparent"),
          (e.style.color = t
            ? "var(--color-white)"
            : "var(--color-text-muted)"),
          (e.style.opacity = t ? "1" : "0.65"));
      }));
    const r = document.getElementById("main-tab-content");
    if (r)
      switch (i) {
        case "anagrafica":
          ((n = ""), c());
          break;
        case "pagamenti":
          !(async function (t) {
            t.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${[1, 2, 3].map(() => '<div class="skeleton skeleton-text"></div>').join("")}</div>`;
            try {
              const a = n ? { team_id: n } : {},
                { installments: s, stats: l } = await Store.get(
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
              ((t.innerHTML = `\n        <p class="section-label">Riepilogo Pagamenti Squadra</p>\n        <div class="grid-3" style="margin-bottom:var(--sp-3);">\n          <div class="stat-card"><span class="stat-label">Atteso</span><span class="stat-value">&euro; ${Utils.formatNum(l.total_expected, 2)}</span></div>\n          <div class="stat-card"><span class="stat-label">Incassato</span><span class="stat-value" style="color:var(--color-success)">&euro; ${Utils.formatNum(l.total_paid, 2)}</span></div>\n          <div class="stat-card"><span class="stat-label">Scaduto</span><span class="stat-value" style="color:var(--color-pink)">&euro; ${Utils.formatNum(l.total_overdue, 2)}</span></div>\n        </div>\n        <div class="filter-bar" style="margin-bottom:var(--sp-3);" id="pay-status-filter">\n          <button class="filter-chip active" data-status="" type="button">Tutti (${s.length})</button>\n          <button class="filter-chip" data-status="PAID" type="button">Pagati</button>\n          <button class="filter-chip" data-status="OVERDUE" type="button">Scaduti</button>\n          <button class="filter-chip" data-status="PENDING" type="button">In attesa</button>\n        </div>\n        <div id="pay-table-container">${r(s)}</div>\n      `),
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
                          ).innerHTML = r(s)));
                      },
                      { signal: e.signal },
                    );
                  }));
            } catch (e) {
              t.innerHTML = Utils.emptyState(
                "Errore caricamento pagamenti",
                Utils.friendlyError(e),
              );
            }
          })(r);
          break;
        case "metrics":
          !(async function (t) {
            t.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${[1, 2, 3, 4].map(() => '<div class="skeleton skeleton-text"></div>').join("")}</div>`;
            try {
              const s = n ? { team_id: n } : {},
                {
                  athletes: i,
                  averages: r,
                  metric_types: o,
                } = await Store.get("getGroupMetrics", "biometrics", s),
                c = Object.keys(o || {}),
                m = {
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
                  CMJ_JUMP_HEIGHT: "Jump Height",
                  CMJ_RSIMOD: "RSImod",
                  CMJ_BRAKING: "Braking Impulse",
                  CMJ_ASYMMETRY: "Asimmetria",
                },
                u = (e) => (null != e ? Utils.formatNum(e, 2) : "—"),
                v = (e, t) => {
                  if (!e || !e[t])
                    return '<span style="color:var(--color-text-muted);">—</span>';
                  const a = e[t];
                  return `<div style="display:flex;align-items:center;gap:4px;justify-content:center;">${a.icon ? `<i class="ph ph-${a.icon}" style="color:${a.color || 'inherit'}"></i>` : ""}<span style="font-weight:600;${a.color ? `color:${a.color};` : ""}">${u(a.value)}</span><span style="font-size:10px;color:var(--color-text-muted);">${Utils.escapeHtml(a.unit)}</span></div>`;
                },
                y = Array.isArray(a) ? a : [],
                b = `<div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;"><p class="page-subtitle">${(i || []).length} atlete${n ? " nella squadra selezionata" : " totali"}</p><div class="filter-bar" id="metrics-team-filter"><button class="filter-chip ${n ? "" : "active"}" data-team="" type="button">Tutte</button>${y.map((e) => `<button class="filter-chip ${n === e.id ? "active" : ""}" data-team="${e.id}" type="button">${Utils.escapeHtml(d(e.category, e.name))}</button>`).join("")}</div></div>`,
                h =
                  0 === c.length
                    ? '<th style="white-space:nowrap;text-align:center;color:var(--color-text-muted);">Metriche</th>'
                    : c
                        .map(
                          (e) =>
                            `<th style="white-space:nowrap;text-align:center;">${Utils.escapeHtml(m[e] || e)}</th>`,
                        )
                        .join(""),
                x = (i || [])
                  .map(
                    (e) =>
                      `<tr style="cursor:pointer;" data-athlete-id="${e.id}"><td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;background:${p(e.full_name)};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:0.85rem;color:#000;border-radius:6px;">${null !== e.jersey_number ? Utils.escapeHtml(String(e.jersey_number)) : Utils.initials(e.full_name)}</div><span style="font-weight:600;">${Utils.escapeHtml(e.full_name)}</span></div></td><td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(d(e.category, e.team_name))}</td>${0 === c.length ? '<td style="text-align:center;color:var(--color-text-muted);font-size:12px;">Nessuna metrica</td>' : c.map((t) => `<td style="text-align:center;">${v(e.metrics, t)}</td>`).join("")}</tr>`,
                  )
                  .join(""),
                $ =
                  0 === c.length
                    ? '<td style="text-align:center;"><span style="color:var(--color-text-muted);">—</span></td>'
                    : c
                        .map((e) => {
                          const t = r && r[e];
                          return `<td style="text-align:center;">${t ? `<span style="font-weight:700;color:var(--color-pink);">${u(t.value)}</span><span style="font-size:10px;color:var(--color-text-muted);margin-left:2px;">${Utils.escapeHtml(t.unit)}</span>` : '<span style="color:var(--color-text-muted);">—</span>'}</td>`;
                        })
                        .join("");
              ((t.innerHTML = `${b}<div class="table-wrapper"><table class="table"><thead><tr><th style="white-space:nowrap;">Atleta</th><th style="white-space:nowrap;">Squadra</th>${h}</tr></thead><tbody>${x}<tr style="background:rgba(255,255,255,0.03);border-top:2px solid var(--color-border);"><td colspan="2" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);padding:10px 12px;"><i class="ph ph-chart-bar" style="margin-right:4px;"></i>Media gruppo</td>${$}</tr></tbody></table></div>`),
                t.querySelectorAll("[data-team]").forEach((t) =>
                  t.addEventListener(
                    "click",
                    () => {
                      ((n = t.dataset.team), g("metrics"));
                    },
                    { signal: e.signal },
                  ),
                ),
                t.querySelectorAll("[data-athlete-id]").forEach((t) =>
                  t.addEventListener(
                    "click",
                    () => {
                      const e = t.dataset.athleteId;
                      ((l = e),
                        sessionStorage.setItem("last_athlete_id", e),
                        f(e, "metrics"));
                    },
                    { signal: e.signal },
                  ),
                ));
            } catch (e) {
              t.innerHTML = Utils.emptyState(
                "Errore caricamento metriche",
                e.message,
              );
            }
          })(r);
          break;
        case "documenti":
          !(function (e) {
            const a = new Date(),
              n = new Date(a.getTime() + 5184e6),
              s = t.map((e) => {
                const t = e.medical_cert_expires_at
                    ? new Date(e.medical_cert_expires_at)
                    : null,
                  s = t && t < a;
                return {
                  a: e,
                  certDate: t,
                  expired: s,
                  expiring: t && !s && t < n,
                };
              }),
              l = s.filter((e) => e.expired).length,
              i = s.filter((e) => e.expiring).length,
              r = s.length - l - i;
            e.innerHTML = `\n      <p class="section-label">Stato Documenti Squadra</p>\n      <div class="grid-3" style="margin-bottom:var(--sp-3);">\n        <div class="stat-card"><span class="stat-label">Completati</span><span class="stat-value" style="color:var(--color-success)">${r}</span></div>\n        <div class="stat-card"><span class="stat-label">In scadenza (60gg)</span><span class="stat-value" style="color:var(--color-warning)">${i}</span></div>\n        <div class="stat-card"><span class="stat-label">Scaduti</span><span class="stat-value" style="color:var(--color-pink)">${l}</span></div>\n      </div>\n      <p class="section-label">Certificati Medici</p>\n      <div class="table-wrapper">\n        <table class="table">\n          <thead><tr><th>Atleta</th><th>Squadra</th><th>Scadenza Cert. Medico</th><th>Stato</th><th>Matricola FIPAV</th></tr></thead>\n          <tbody>\n            ${s.map(({ a: e, certDate: t, expired: a, expiring: n }) => `<tr>\n              <td><strong>${Utils.escapeHtml(e.full_name)}</strong></td>\n              <td>${Utils.escapeHtml(d(e.category, e.team_name))}</td>\n              <td style="color:${a ? "var(--color-pink)" : n ? "var(--color-warning)" : "var(--color-text)"}">\n                ${t ? Utils.formatDate(e.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'}\n              </td>\n              <td>${a ? '<span class="badge badge-danger">Scaduto</span>' : n ? '<span class="badge badge-warning">In scadenza</span>' : t ? '<span class="badge badge-success">Valido</span>' : '<span class="badge">Mancante</span>'}</td>\n              <td>${Utils.escapeHtml(e.federal_id || "—")}</td>\n            </tr>`).join("")}\n          </tbody>\n        </table>\n      </div>\n    `;
          })(r);
      }
  }
  function v() {
    ((l = null),
      sessionStorage.removeItem("last_athlete_id"),
      u());
  }
  async function f(n, s = "anagrafica") {
    const l = document.getElementById("app");
    if (n) {
      (sessionStorage.setItem("last_athlete_id", n),
        Router.updateHash(Router.getCurrentRoute(), { id: n }),
        (l.innerHTML = UI.skeletonPage()),
        window.scrollTo({ top: 0, left: 0 }));
      try {
        const [r, o, c] = await Promise.all([
            Store.get("get", "athletes", { id: n }),
            Store.get("payments", "athletes", { id: n }).catch(() => []),
            Store.get("getMetricsSummary", "biometrics", { id: n }).catch(
              () => [],
            ),
          ]),
          m = App.getUser(),
          u = ["admin", "manager", "operator"].includes(m?.role),
          g = (e, t, a) =>
            `\n            <div class="stat-card" style="padding:var(--sp-2); border:1px solid var(--color-border); ${a ? `border-left:4px solid ${a};` : ""}">\n              <span class="stat-label" style="font-size:10px;text-transform:uppercase;color:var(--color-text-muted);">${e}</span>\n              <span class="stat-value" style="font-size:13px;font-weight:600;display:block;">${Utils.escapeHtml(t || "—")}</span>\n            </div>`;
        ((l.innerHTML = `\n        <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-4); background:var(--color-black); min-height:100vh; padding-top:var(--sp-3);">\n\n          \x3c!-- BREADCRUMB NAV --\x3e\n          <div style="display:flex;align-items:center;gap:var(--sp-2);padding:0 var(--sp-4);">\n            <button class="btn btn-ghost btn-sm" id="back-to-list" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">\n              <i class="ph ph-arrow-left" style="font-size:16px;"></i> Atleti\n            </button>\n            <div style="flex:1;"></div>\n            ${u ? '<button class="btn btn-primary btn-sm" id="edit-athlete-btn" type="button" style="margin-right:8px;"><i class="ph ph-pencil-simple"></i> MODIFICA</button>' : ""}\n            ${["admin", "manager"].includes(m?.role) ? '<button class="btn btn-default btn-sm" id="ai-report-btn" type="button">⚡ REPORT AI</button>' : ""}\n          </div>\n\n          \x3c!-- HEADER ATLETA --\x3e\n          <div style="display:flex; align-items:center; gap:var(--sp-4); padding:0 var(--sp-4); margin-top:var(--sp-2);">\n            ${null != r.jersey_number ? `<div style="font-size:4rem; font-weight:800; color:var(--color-pink); font-family:var(--font-display); line-height:1; letter-spacing:-2px;">#${Utils.escapeHtml(String(r.jersey_number))}</div>` : ""}\n            <div style="display:flex; flex-direction:column;">\n              <h2 style="font-size:2.5rem; font-weight:800; margin:0; line-height:1.1; font-family:var(--font-display); text-transform:uppercase; letter-spacing:-0.5px;">${Utils.escapeHtml(r.first_name || "")} <span style="font-weight:300; color:var(--color-text-muted);">${Utils.escapeHtml(r.last_name || "")}</span></h2>\n              <div style="font-size:15px; color:var(--color-white); margin-top:8px; display:flex; gap:12px; align-items:center;">\n                ${r.role ? `<span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-weight:600; font-size:13px; letter-spacing:0.5px; text-transform:uppercase;">${Utils.escapeHtml(r.role)}</span>` : ""}\n                ${r.team_names && r.team_names.length > 0 ? r.team_names.map((e) => `<span style="color:var(--color-text-muted); font-weight:500;">${Utils.escapeHtml(d(e.category, e.name))}</span>`).join('<span style="color:var(--color-text-muted); opacity:0.5;">·</span>') : r.team_name ? `<span style="color:var(--color-text-muted); font-weight:500;">${Utils.escapeHtml(d(r.category, r.team_name))}</span>` : ""}\n              </div>\n            </div>\n          </div>\n\n          \x3c!-- TAB BAR --\x3e\n          <div style="position:relative;margin:0 calc(var(--sp-4) * -1);padding:0 var(--sp-4);border-bottom:1px solid var(--color-border);margin-bottom:var(--sp-4);">\n            <div id="athlete-tab-bar" class="fusion-tabs-container" style="display:flex;gap:0;overflow-x:auto;scrollbar-width:none;position:relative;z-index:2;padding-bottom:1px;">\n              ${[
          { id: "anagrafica", label: "Anagrafica" },
          { id: "pagamenti", label: "Pagamenti" },
          { id: "documenti", label: "Documenti" },
        ]
          .map(
            (e) =>
              `<button class="athlete-tab-btn fusion-tab" data-tab="${e.id}" type="button" style="flex-shrink:0;white-space:nowrap; ${e.pink ? "color:var(--color-pink);" : ""}">${e.label}</button>`,
          )
          .join(
            "",
          )}\n            </div>\n            \x3c!-- Shadow gradient for scroll indication --\x3e\n            <div id="tab-scroll-indicator" style="position:absolute;top:0;right:0;bottom:0;width:48px;background:linear-gradient(to left, var(--color-black) 20%, transparent 100%);pointer-events:none;z-index:3;transition:opacity 0.3s;opacity:0.8;"></div>\n          </div>\n\n          \x3c!-- ANAGRAFICA TAB --\x3e\n          <div id="tab-panel-anagrafica" class="athlete-tab-panel" style="display:flex;flex-direction:column;gap:var(--sp-4);">\n            <div style="display:flex;flex-direction:row;align-items:flex-start;gap:var(--sp-4);">\n              \x3c!-- FOTO PERSONALE --\x3e\n              <div style="width:280px;flex-shrink:0;">\n                <p class="section-label" style="text-align:center;">Foto Personale</p>\n                <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-3);">\n                    <div id="athlete-photo-preview" style="width:240px;height:240px;border-radius:16px;overflow:hidden;flex-shrink:0;border:2px solid var(--color-border);background:${p(r.full_name)};display:flex;align-items:center;justify-content:center;">\n                      ${r.photo_path ? `<img src="${Utils.escapeHtml(r.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;object-position:center">` : `<span style="font-family:var(--font-display);font-size:4.5rem;font-weight:700;color:#000;">${Utils.initials(r.full_name)}</span>`}\n                    </div>\n                    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;">\n                      <div style="font-size:13px;color:var(--color-text-muted);text-align:center;">\n                        ${r.photo_path ? "Foto caricata" : "Nessuna foto caricata"}\n                      </div>\n                      ${u ? `\n                      <label for="athlete-photo-upload" class="btn btn-default btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:100%;justify-content:center;">\n                        <i class="ph ph-camera"></i> ${r.photo_path ? "Cambia foto" : "Carica foto"}\n                      </label>\n                      <input id="athlete-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;">\n                      <div id="athlete-photo-status" style="font-size:12px;color:var(--color-text-muted);text-align:center;"></div>` : ""}\n                    </div>\n                  </div>\n                </div>\n              </div>\n              <div style="flex:1;">\n                <p class="section-label">Dati Anagrafici e Contatti</p>\n                <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);">\n                    ${g("Nome", r.first_name)}\n                    ${g("Cognome", r.last_name)}\n                    ${g("Data di Nascita", r.birth_date ? Utils.formatDate(r.birth_date) : null)}\n                    ${g("Luogo di Nascita", r.birth_place)}\n                    ${g("Via di Residenza", r.residence_address)}\n                    ${g("Città di Residenza", r.residence_city)}\n                    ${g("Cellulare", r.phone)}\n                    ${g("E-Mail", r.email)}\n                    ${g("Documento d'Identità", r.identity_document)}\n                    ${g("Codice Fiscale", r.fiscal_code)}\n                    ${g("Scadenza Cert. Medico", r.medical_cert_expires_at ? Utils.formatDate(r.medical_cert_expires_at) : null, r.medical_cert_expires_at && new Date(r.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n                    ${g("Matricola FIPAV", r.federal_id)}\n                  </div>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- DOCUMENTI (in Anagrafica) --\x3e\n            <div>\n              <p class="section-label">Matricola e Documenti</p>\n              <div class="card" style="padding:var(--sp-3);">\n                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:var(--sp-3);">\n                  ${g("Documento d'Identità", r.identity_document)}\n                  ${g("Codice Fiscale", r.fiscal_code)}\n                  ${g("Matricola FIPAV", r.federal_id)}\n                  ${g("Scadenza Cert. Medico", r.medical_cert_expires_at ? Utils.formatDate(r.medical_cert_expires_at) : null, r.medical_cert_expires_at && new Date(r.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- PAGAMENTI (in Anagrafica) --\x3e\n            <div>\n              <p class="section-label">Recenti Pagamenti</p>\n              ${
          o && o.length > 0
            ? `\n                <div class="table-wrapper">\n                  <table class="table">\n                    <thead><tr><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Metodo</th><th>Data Pagamento</th></tr></thead>\n                    <tbody>\n                      ${o
                .slice(0, 5)
                .map(
                  (e) =>
                    `<tr>\n                        <td>${Utils.formatDate(e.due_date)}</td>\n                        <td><strong>€ ${Utils.formatNum(e.amount, 2)}</strong></td>\n                        <td>${"paid" === e.status ? '<span class="badge badge-success">Pagato</span>' : "overdue" === e.status ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>\n                        <td>${Utils.escapeHtml(e.payment_method || "—")}</td>\n                        <td style="font-size:12px;color:var(--color-text-muted);">${e.paid_at ? Utils.formatDate(e.paid_at) : "—"}</td>\n                      </tr>`,
                )
                .join(
                  "",
                )}\n                    </tbody>\n                  </table>\n                </div>`
            : Utils.emptyState("Nessun pagamento registrato")
        }\n            </div>\n          </div>\n\n          \x3c!-- METRICS TAB --\x3e\n          <div id="tab-panel-metrics" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">\n\n            \x3c!-- PARAMETRI FISICI E SALTO --\x3e\n            <div>\n              <p class="section-label">Parametri Fisici e Salto</p>\n              <div class="grid-3">\n                <div class="stat-card">\n                  <span class="stat-label">Peso Attuale</span>\n                  <span class="stat-value">${r.weight_kg ? r.weight_kg + " kg" : "—"}</span>\n                </div>\n                <div class="stat-card">\n                  <span class="stat-label">Altezza Attuale</span>\n                  <span class="stat-value">${r.height_cm ? r.height_cm + " cm" : "—"}</span>\n                </div>\n                <div class="stat-card">\n                  <span class="stat-label">Miglior Salto (di recente)</span>\n                  <span class="stat-value">${(function (
          e,
        ) {
          if (!e || !e.length) return "—";
          const t = e.find(
            (e) =>
              "VERTICAL_JUMP_CMJ" === e.metric_type ||
              "VERTICAL_JUMP_SJ" === e.metric_type ||
              "BROAD_JUMP" === e.metric_type,
          );
          return t ? t.value + (t.unit ? " " + t.unit : "") : "—";
        })(
          c,
        )}</span>\n                </div>\n              </div>\n            </div>\n\n            \x3c!-- VALD Performance Tracking --\x3e\n            <div id="vald-section">\n              <p class="section-label" style="display:flex;align-items:center;gap:8px;justify-content:space-between;">\n                <span style="display:flex;align-items:center;gap:8px;"><span style="color:var(--color-pink);">⚡</span> VALD Performance Tracking</span>\n                <span style="display:flex;align-items:center;gap:6px;">\n                  <button id="vald-link-btn" type="button" class="btn btn-sm btn-ghost" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;" title="Collega atleti VALD/ERP"><i class="ph ph-link" style="font-size:13px;"></i> Collega</button>\n                  <button id="vald-sync-btn" type="button" class="btn btn-sm btn-default" style="display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 12px;border-color:rgba(255,0,255,0.3);color:var(--color-pink);" title="Sincronizza dati VALD ForceDecks"><i class="ph ph-arrows-clockwise" style="font-size:13px;"></i> Sincronizza</button>\n                </span>\n              </p>\n              <div id="vald-tab-content">\n                <div style="display:flex;flex-direction:column;gap:8px;">\n                  <div class="skeleton skeleton-title"></div>\n                  <div class="skeleton skeleton-text" style="width:60%;"></div>\n                </div>\n              </div>\n            </div>\n\n            ${
          r.metrics?.length
            ? `\n              <div class="table-wrapper">\n                <table class="table">\n                  <thead><tr><th>Data</th><th>Durata (min)</th><th>RPE</th><th>Carico</th><th>Note</th></tr></thead>\n                  <tbody>\n                    ${r.metrics
                .map((e) => {
                  return `<tr>\n                      <td>${Utils.formatDate(e.log_date)}</td>\n                      <td>${Utils.escapeHtml(String(e.duration_min))}</td>\n                      <td>${Utils.escapeHtml(String(e.rpe))}/10</td>\n                      <td><strong>${Utils.formatNum(e.load_value, 0)}</strong></td>\n                      <td>${e.acwr_score ? Utils.riskBadge(((t = e.acwr_score), t < 0.8 ? "low" : t <= 1.3 ? "moderate" : t <= 1.5 ? "high" : "extreme")) : "—"}</td>\n                      <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(e.notes || "")}</td>\n                    </tr>`;
                  var t;
                })
                .join(
                  "",
                )}\n                  </tbody>\n                </table>\n              </div>`
            : ""
        }\n\n          \x3c!-- PAGAMENTI --\x3e\n          <div id="tab-panel-pagamenti" class="athlete-tab-panel" style="display:none;">\n            <p class="section-label">Storico Pagamenti</p>\n            ${o && o.length > 0 ? `\n              <div class="table-wrapper">\n                <table class="table">\n                  <thead><tr><th>Scadenza</th><th>Importo</th><th>Stato</th><th>Pagante</th><th>Metodo</th><th>Data Pagamento</th></tr></thead>\n                  <tbody>\n                    ${o.map((e) => `<tr>\n                      <td>${Utils.formatDate(e.due_date)}</td>\n                      <td><strong>€ ${Utils.formatNum(e.amount, 2)}</strong></td>\n                      <td>${"paid" === e.status ? '<span class="badge badge-success">Pagato</span>' : "overdue" === e.status ? '<span class="badge badge-danger">Scaduto</span>' : '<span class="badge badge-warning">In attesa</span>'}</td>\n                      <td>${Utils.escapeHtml(e.payer_name || "—")}</td>\n                      <td>${Utils.escapeHtml(e.payment_method || "—")}</td>\n                      <td style="font-size:12px;color:var(--color-text-muted);">${e.paid_at ? Utils.formatDate(e.paid_at) : "—"}</td>\n                    </tr>`).join("")}\n                  </tbody>\n                </table>\n              </div>` : Utils.emptyState("Nessun pagamento registrato")}\n          </div>\n          \x3c!-- DOCUMENTI TAB --\x3e\n          <div id="tab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);">\n            <p class="section-label">Matricola e Dati</p>\n            <div class="card" style="padding:var(--sp-3);">\n              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">\n                ${g("Documento d'Identità", r.identity_document)}\n                ${g("Codice Fiscale", r.fiscal_code)}\n                ${g("Matricola FIPAV", r.federal_id)}\n                ${g("Scadenza Cert. Medico", r.medical_cert_expires_at ? Utils.formatDate(r.medical_cert_expires_at) : null, r.medical_cert_expires_at && new Date(r.medical_cert_expires_at) < new Date() ? "var(--color-pink)" : null)}\n              </div>\n            </div>\n\n            <p class="section-label">Allegati</p>\n            <div style="display:flex;flex-direction:column;gap:var(--sp-3);">\n              \x3c!-- Contratto --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-file-pdf" style="font-size:24px;color:var(--color-pink);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">Contratto</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.contract_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.contract_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.contract_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=contract_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-contract-file-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-contract-file-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n              \n              \x3c!-- CI Fronte --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-identification-badge" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">CI Fronte</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.id_doc_front_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.id_doc_front_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.id_doc_front_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=id_doc_front_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-id-doc-front-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-id-doc-front-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n\n              \x3c!-- CI Retro --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-identification-card" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">CI Retro</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.id_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.id_doc_back_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.id_doc_back_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=id_doc_back_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-id-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-id-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n\n              \x3c!-- CF Fronte --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">CF Fronte</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.cf_doc_front_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.cf_doc_front_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.cf_doc_front_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=cf_doc_front_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-cf-doc-front-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-cf-doc-front-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n\n              \x3c!-- CF Retro --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">CF Retro</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.cf_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.cf_doc_back_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.cf_doc_back_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=cf_doc_back_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-cf-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-cf-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n\n              \x3c!-- Certificato Medico --\x3e\n              <div class="card" style="padding:var(--sp-3);">\n                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);">\n                      <div style="display:flex;align-items:center;gap:10px;">\n                          <i class="ph ph-first-aid" style="font-size:24px;color:var(--color-warning);flex-shrink:0;"></i>\n                          <div>\n                              <div style="font-size:13px;font-weight:600;">Certificato Medico</div>\n                              <div style="font-size:11px;color:var(--color-text-muted);">${r.medical_cert_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(r.medical_cert_file_path.split('/').pop()) : 'Nessun file caricato'}</div>\n                          </div>\n                      </div>\n                      <div style="display:flex;gap:var(--sp-2);align-items:center;">\n                          ${r.medical_cert_file_path ? `<a href="api/router.php?module=athletes&action=downloadDoc&field=medical_cert_file_path&id=${r.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>` : ''}\n                          ${u ? `<button class="btn btn-primary btn-sm" id="upload-med-cert-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>\n                          <input type="file" id="upload-med-cert-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : ''}\n                      </div>\n                  </div>\n              </div>\n\n            </div>\n          </div>\n        </div>\n        \n        `),
          document
            .getElementById("back-to-list")
            ?.addEventListener("click", () => v(), { signal: e.signal }),
          (i = document.getElementById("edit-athlete-btn")) &&
            (i.onclick = () =>
              (function (s) {
                const l = Array.isArray(s.team_season_ids)
                    ? s.team_season_ids
                    : s.team_id
                      ? [s.team_id]
                      : [],
                  i = Array.isArray(a)
                    ? a
                        .map((e) => {
                          const t = l.includes(e.id) ? "checked" : "";
                          return `<label class="multi-team-option${t ? " selected" : ""}" for="ea-team-${Utils.escapeHtml(e.id)}">\n                          <input type="checkbox" id="ea-team-${Utils.escapeHtml(e.id)}" class="ea-team-cb" value="${Utils.escapeHtml(e.id)}" ${t} style="display:none;">\n                          <span class="multi-team-label">${Utils.escapeHtml(d(e.category, e.name))}${e.season ? ' \u2014 ' + Utils.escapeHtml(e.season) : ''}</span>\n                        </label>`;
                        })
                        .join("")
                    : "",
                  r = UI.modal({
                    title: "Modifica Atleta",
                    body: `<div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-fname">Nome *</label>\n            <input id="ea-fname" class="form-input" type="text" value="${Utils.escapeHtml(s.first_name || "")}" required>\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-lname">Cognome *</label>\n            <input id="ea-lname" class="form-input" type="text" value="${Utils.escapeHtml(s.last_name || "")}" required>\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-team-panel">Squadre</label>\n            <div id="ea-team-panel" class="multi-team-panel" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:10px;background:rgba(255,255,255,0.04);border:1px solid var(--color-border);border-radius:var(--radius);">\n${i}\n</div>\n            <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;"><i class="ph ph-info"></i> Puoi selezionare più squadre</div>\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-jersey">N° Maglia</label>\n            <input id="ea-jersey" class="form-input" type="number" min="1" max="99" value="${s.jersey_number || ""}">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-role">Ruolo</label>\n            <input id="ea-role" class="form-input" type="text" value="${Utils.escapeHtml(s.role || "")}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-birth">Data di Nascita</label>\n            <input id="ea-birth" class="form-input" type="date" value="${s.birth_date ? s.birth_date.substring(0, 10) : ""}">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-birthplace">Luogo di Nascita</label>\n            <input id="ea-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(s.birth_place || "")}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-rescity">Città di Residenza</label>\n            <input id="ea-rescity" class="form-input" type="text" value="${Utils.escapeHtml(s.residence_city || "")}">\n          </div>\n        </div>\n        <div class="form-group">\n          <label class="form-label" for="ea-resaddr" style="display:flex;align-items:center;gap:8px;">\n            Via di Residenza\n            <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">\n              <i class="ph ph-google-logo"></i> Google Maps\n            </span>\n          </label>\n          <div style="position:relative;">\n            <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>\n            <input id="ea-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(s.residence_address || "")}" autocomplete="off" style="padding-left:40px;">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-phone">Cellulare</label>\n            <input id="ea-phone" class="form-input" type="tel" value="${Utils.escapeHtml(s.phone || "")}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-email">E-Mail</label>\n            <input id="ea-email" class="form-input" type="email" value="${Utils.escapeHtml(s.email || "")}">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-doc">Documento d'Identità</label>\n            <input id="ea-doc" class="form-input" type="text" value="${Utils.escapeHtml(s.identity_document || "")}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-fiscal">Codice Fiscale</label>\n            <input id="ea-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(s.fiscal_code || "")}" maxlength="16" style="text-transform:uppercase;">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-medcert">Scadenza Certificato Medico</label>\n            <input id="ea-medcert" class="form-input" type="date" value="${s.medical_cert_expires_at ? s.medical_cert_expires_at.substring(0, 10) : ""}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-fipav">Matricola FIPAV</label>\n            <input id="ea-fipav" class="form-input" type="text" value="${Utils.escapeHtml(s.federal_id || "")}">\n          </div>\n        </div>\n        <div class="form-grid">\n          <div class="form-group">\n            <label class="form-label" for="ea-height">Altezza (cm)</label>\n            <input id="ea-height" class="form-input" type="number" value="${s.height_cm || ""}">\n          </div>\n          <div class="form-group">\n            <label class="form-label" for="ea-weight">Peso (kg)</label>\n            <input id="ea-weight" class="form-input" type="number" value="${s.weight_kg || ""}">\n          </div>\n        </div>\n        <div class="form-group">\n          <label class="form-label" for="ea-parent">Contatto genitore (per minori)</label>\n          <input id="ea-parent" class="form-input" type="text" value="${Utils.escapeHtml(s.parent_contact || "")}">\n        </div>\n        <div id="ea-error" class="form-error hidden"></div>`,
                    footer:
                      '<button class="btn btn-ghost btn-sm" id="ea-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="ea-save" type="button">SALVA MODIFICHE</button>',
                  });
                (document
                  .getElementById("ea-cancel")
                  ?.addEventListener("click", () => r.close(), {
                    signal: e.signal,
                  }),
                  document.getElementById("ea-save")?.addEventListener(
                    "click",
                    async () => {
                      const e = document
                          .getElementById("ea-fname")
                          .value.trim(),
                        a = document.getElementById("ea-lname").value.trim(),
                        l = [
                          ...document.querySelectorAll(".ea-team-cb:checked"),
                        ].map((e) => e.value),
                        i = document.getElementById("ea-error");
                      if (!e || !a || 0 === l.length)
                        return (
                          (i.textContent =
                            "Nome, cognome e almeno una squadra sono obbligatori"),
                          void i.classList.remove("hidden")
                        );
                      const o = document.getElementById("ea-save");
                      ((o.disabled = !0), (o.textContent = "Salvataggio..."));
                      try {
                        (await Store.api("update", "athletes", {
                          id: s.id,
                          first_name: e,
                          last_name: a,
                          team_season_ids: l,
                          team_id: l[0] || null,
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
                          Store.clearCache(),
                          await Store.get("listLight", "athletes")
                            .then((e) => {
                              t = e;
                            })
                            .catch(() => {}),
                          f(n),
                          r.close(),
                          UI.toast("Atleta aggiornato", "success"));
                      } catch (e) {
                        ((i.textContent = e.message),
                          i.classList.remove("hidden"),
                          (o.disabled = !1),
                          (o.textContent = "SALVA MODIFICHE"));
                      }
                    },
                    { signal: e.signal },
                  ),
                  _(() =>
                    (function (e, t) {
                      if (
                        !e ||
                        "undefined" == typeof google ||
                        !google.maps?.places
                      )
                        return;
                      const a = new google.maps.places.Autocomplete(e, {
                        types: ["establishment", "geocode"],
                        fields: [
                          "formatted_address",
                          "geometry",
                          "name",
                          "address_components",
                        ],
                      });
                      a.addListener("place_changed", () => {
                        const n = a.getPlace();
                        if (!n.geometry) return;
                        const s = n.geometry.location.lat(),
                          l = n.geometry.location.lng(),
                          i = n.formatted_address || e.value;
                        e.value = i;
                        let r = "";
                        if (n.address_components) {
                          const e = n.address_components.find(
                            (e) =>
                              e.types.includes("locality") ||
                              e.types.includes("postal_town"),
                          );
                          e && (r = e.long_name);
                        }
                        t &&
                          t({ lat: s, lng: l, address: i, city: r, place: n });
                      });
                    })(
                      document.getElementById("ea-resaddr"),
                      ({ address: e, city: t }) => {
                        if (t) {
                          const e = document.getElementById("ea-rescity");
                          e && (e.value = t);
                        }
                      },
                    ),
                  ),
                  document.querySelectorAll(".ea-team-cb").forEach((e) => {
                    e.addEventListener("change", (e) => {
                      const t = e.target.closest(".multi-team-option");
                      e.target.checked
                        ? t?.classList.add("selected")
                        : t?.classList.remove("selected");
                    });
                  }));
              })(r)),
          (function () {
            var e = document.getElementById("ai-report-btn");
            e &&
              (e.onclick = () =>
                (async function (e) {
                  const t = document.getElementById("ai-report-btn");
                  t &&
                    ((t.disabled = !0), (t.textContent = "⏳ Generazione..."));
                  try {
                    (await Store.api("aiReport", "athletes", { athlete_id: e }),
                      UI.toast("Report AI generato con successo", "success"),
                      y(e));
                  } catch (e) {
                    UI.toast(
                      "Errore generazione report: " + e.message,
                      "error",
                    );
                  } finally {
                    t && ((t.disabled = !1), (t.textContent = "⚡ REPORT AI"));
                  }
                })(n));
          })());
        const w = document.getElementById("athlete-photo-upload");
        w &&
          (w.onchange = async () => {
            const e = w.files?.[0];
            if (!e) return;
            const t = document.getElementById("athlete-photo-status"),
              a = document.getElementById("athlete-photo-preview"),
              s = document.querySelector('label[for="athlete-photo-upload"]'),
              l = URL.createObjectURL(e);
            ((a.innerHTML = `<img src="${l}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;object-position:center">`),
              t && (t.textContent = "Caricamento in corso..."),
              s &&
                ((s.style.opacity = "0.5"), (s.style.pointerEvents = "none")));
            try {
              const a = new FormData();
              (a.append("id", n), a.append("photo", e));
              const s = await fetch(
                  "api/router.php?module=athletes&action=uploadPhoto",
                  { method: "POST", credentials: "same-origin", body: a },
                ),
                l = await s.json();
              if (!s.ok) throw new Error(l.message || "Errore upload");
              (t &&
                ((t.textContent = "✓ Foto salvata"),
                (t.style.color = "var(--color-success)")),
                UI.toast("Foto caricata", "success"));
            } catch (e) {
              ((a.innerHTML = r.photo_path
                ? `<img src="${Utils.escapeHtml(r.photo_path)}" alt="Foto atleta" style="width:100%;height:100%;object-fit:cover;object-position:center">`
                : `<span style="font-family:var(--font-display);font-size:3.5rem;font-weight:700;color:#000;">${Utils.initials(r.full_name)}</span>`),
                t &&
                  ((t.textContent = "Errore: " + e.message),
                  (t.style.color = "var(--color-pink)")),
                UI.toast("Errore upload foto: " + e.message, "error"));
            } finally {
              (s && ((s.style.opacity = ""), (s.style.pointerEvents = "")),
                URL.revokeObjectURL(l));
            }
          });

        if (u) {
            ["contract-file", "id-doc-front", "id-doc-back", "cf-doc-front", "cf-doc-back", "med-cert"].forEach(type => {
                const btn = document.getElementById(`upload-${type}-btn`);
                const input = document.getElementById(`upload-${type}-input`);
                if (btn && input) {
                    btn.addEventListener('click', () => input.click(), { signal: e.signal });
                    input.addEventListener('change', async (ev) => {
                        const file = ev.target.files[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('id', n);
                        formData.append('file', file);
                        
                        let action = '';
                        if (type === 'contract-file') action = 'uploadContractFile';
                        else if (type === 'id-doc-front') action = 'uploadIdDocFront';
                        else if (type === 'id-doc-back') action = 'uploadIdDocBack';
                        else if (type === 'cf-doc-front') action = 'uploadCfDocFront';
                        else if (type === 'cf-doc-back') action = 'uploadCfDocBack';
                        else if (type === 'med-cert') action = 'uploadMedicalCert';

                        UI.toast('Caricamento documento in corso...', 'info');
                        btn.disabled = true;
                        try {
                            const response = await fetch(`api/router.php?module=athletes&action=${action}`, {
                                method: 'POST',
                                body: formData
                            });
                            const res = await response.json();
                            if (!response.ok || !res.success) throw new Error(res.error || 'Errore di caricamento');
                            
                            UI.toast('Documento caricato con successo', 'success');
                            Store.invalidate("listLight/athletes");
                            Store.invalidate("get/athletes");
                            f(n, "documenti");
                        } catch (err) {
                            UI.toast(err.message, 'error');
                            btn.disabled = false;
                        } finally {
                            input.value = '';
                        }
                    }, { signal: e.signal });
                }
            });
        }

        if (u) {
            ["contract-file", "id-doc-front", "id-doc-back", "cf-doc-front", "cf-doc-back", "med-cert"].forEach(type => {
                const btn = document.getElementById(`upload-${type}-btn`);
                const input = document.getElementById(`upload-${type}-input`);
                if (btn && input) {
                    btn.addEventListener('click', () => input.click(), { signal: e.signal });
                    input.addEventListener('change', async (ev) => {
                        const file = ev.target.files[0];
                        if (!file) return;
                        
                        const formData = new FormData();
                        formData.append('id', n);
                        formData.append('file', file);
                        
                        let action = '';
                        if (type === 'contract-file') action = 'uploadContractFile';
                        else if (type === 'id-doc-front') action = 'uploadIdDocFront';
                        else if (type === 'id-doc-back') action = 'uploadIdDocBack';
                        else if (type === 'cf-doc-front') action = 'uploadCfDocFront';
                        else if (type === 'cf-doc-back') action = 'uploadCfDocBack';
                        else if (type === 'med-cert') action = 'uploadMedicalCert';

                        UI.toast('Caricamento documento in corso...', 'info');
                        btn.disabled = true;
                        try {
                            const response = await fetch(`api/router.php?module=athletes&action=${action}`, {
                                method: 'POST',
                                body: formData
                            });
                            const res = await response.json();
                            if (!response.ok || !res.success) throw new Error(res.error || 'Errore di caricamento');
                            
                            UI.toast('Documento caricato con successo', 'success');
                            Store.invalidate("listLight/athletes");
                            Store.invalidate("get/athletes");
                            f(n, "documenti");
                        } catch (err) {
                            UI.toast(err.message, 'error');
                            btn.disabled = false;
                        } finally {
                            input.value = '';
                        }
                    }, { signal: e.signal });
                }
            });
        }
        let E = !1;
        const k = (e) => {
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
                // Attach VALD sync button listener
                const syncBtn = document.getElementById("vald-sync-btn");
                if (syncBtn && !syncBtn._syncAttached) {
                  syncBtn._syncAttached = true;
                  syncBtn.addEventListener("click", async () => {
                    const origHtml = syncBtn.innerHTML;
                    syncBtn.disabled = true;
                    syncBtn.innerHTML = '<i class="ph ph-spinner" style="display:inline-block;animation:spin 1s linear infinite;"></i> Sincronizzando…';
                    try {
                      const res = await Store.api("sync", "vald", {});
                      const synced = res?.synced ?? 0;
                      const found = res?.found ?? 0;
                      if (synced > 0) {
                        UI.toast(`✅ VALD: ${synced} nuovi test importati su ${found} trovati.`, "success", 5000);
                        // Reload VALD analytics
                        E = false;
                        Store.clearCache();
                      } else if (found > 0) {
                        UI.toast(`ℹ️ VALD: ${found} test trovati, nessun dato nuovo da importare.`, "info", 4000);
                      } else {
                        UI.toast("ℹ️ VALD: Nessun nuovo test trovato.", "info", 3000);
                      }
                    } catch (err) {
                      UI.toast("❌ Errore sync VALD: " + (err.message || err), "error", 5000);
                    } finally {
                      syncBtn.disabled = false;
                      syncBtn.innerHTML = origHtml;
                    }
                  });
                }

                // Attach VALD link button listener
                const linkBtn = document.getElementById("vald-link-btn");
                if (linkBtn && !linkBtn._linkAttached) {
                  linkBtn._linkAttached = true;
                  linkBtn.addEventListener("click", async () => {
                    linkBtn.disabled = true;
                    linkBtn.innerHTML = '<i class="ph ph-spinner" style="display:inline-block;animation:spin 1s linear infinite;"></i>';
                    try {
                      const data = await Store.get("valdAthletes", "vald", {});
                      const { valdAthletes: vList = [], erpAthletes: eList = [] } = data || {};

                      // Build select options html
                      const optionsHtml = `<option value="">— non collegare —</option>` +
                        eList.map(a => `<option value="${Utils.escapeHtml(a.id)}">${Utils.escapeHtml(a.name)}</option>`).join("");

                      const rowsHtml = vList.map((va, idx) => {
                        const currentId = va.linked_erp_id || va.suggested_erp_id || "";
                        const isLinked = !!va.linked_erp_id;
                        const isSuggested = !isLinked && !!va.suggested_erp_id;
                        const badge = isLinked ? '<span class="badge badge-success" style="font-size:9px;">Collegato</span>' :
                          isSuggested ? '<span class="badge badge-warning" style="font-size:9px;">Auto</span>' : '';
                        const categoryBadge = va.vald_category ? `<span style="font-size:10px;color:var(--color-text-muted);margin-left:6px;">${Utils.escapeHtml(va.vald_category)}</span>` : '';
                        // Insert pre-selected value
                        const opts = `<option value="">— non collegare —</option>` +
                          eList.map(a => `<option value="${Utils.escapeHtml(a.id)}"${a.id === currentId ? ' selected' : ''}>${Utils.escapeHtml(a.name)}</option>`).join("");
                        return `<tr>
                          <td style="font-size:13px;font-weight:600;">${Utils.escapeHtml(va.vald_name)}${categoryBadge}</td>
                          <td>${badge}</td>
                          <td><select class="form-input vald-link-select" style="font-size:12px;padding:4px 8px;" data-vald-id="${Utils.escapeHtml(va.vald_id)}">${opts}</select></td>
                        </tr>`;
                      }).join("");

                      const modal = UI.modal({
                        title: '🔗 Collega Atleti VALD',
                        maxWidth: '700px',
                        body: `
                          <p style="font-size:12px;color:var(--color-text-muted);margin-bottom:var(--sp-2);">Associa ogni atleta VALD al corrispettivo nella tua anagrafica ERP. Le corrispondenze automatiche (Auto) sono basate sulla somiglianza del nome.</p>
                          <div class="table-wrapper" style="max-height:60vh;overflow-y:auto;">
                            <table class="table">
                              <thead><tr><th>Atleta VALD</th><th>Stato</th><th>Atleta ERP</th></tr></thead>
                              <tbody>${rowsHtml}</tbody>
                            </table>
                          </div>`,
                        footer: '<button class="btn btn-ghost btn-sm" id="vald-link-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="vald-link-save" type="button">💾 Salva Abbinamenti</button>',
                      });

                      document.getElementById("vald-link-cancel")?.addEventListener("click", () => modal.close());
                      document.getElementById("vald-link-save")?.addEventListener("click", async () => {
                        const saveBtn2 = document.getElementById("vald-link-save");
                        if (saveBtn2) { saveBtn2.disabled = true; saveBtn2.textContent = "Salvando…"; }
                        try {
                          const links = [];
                          document.querySelectorAll(".vald-link-select").forEach(sel => {
                            if (sel.value) {
                              links.push({ athlete_id: sel.value, vald_athlete_id: sel.dataset.valdId });
                            }
                          });
                          const res = await Store.api("linkAthlete", "vald", links);
                          modal.close();
                          UI.toast(`✅ ${res?.saved ?? links.length} atleti collegati! Ora puoi sincronizzare i dati.`, "success", 5000);
                          Store.clearCache();
                        } catch (err) {
                          UI.toast("❌ Errore: " + (err.message || err), "error", 5000);
                          if (saveBtn2) { saveBtn2.disabled = false; saveBtn2.textContent = "💾 Salva Abbinamenti"; }
                        }
                      });
                    } catch (err) {
                      UI.toast("❌ Impossibile caricare atleti VALD: " + (err.message || err), "error", 5000);
                    } finally {
                      linkBtn.disabled = false;
                      linkBtn.innerHTML = '<i class="ph ph-link" style="font-size:13px;"></i> Collega';
                    }
                  });
                }

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
                        asymmetry: s,
                        profile: l,
                        testDate: o,
                        testType: d,
                        results: c,
                      } = a,
                      p = a.jumpHeight ?? l?.jumpHeight,
                      m = n?.rsimod?.current,
                      u = a.brakingImpulse,
                      g = a.asymmetryPct ?? s?.landing?.asymmetry,
                      v = n?.rsimod?.baseline,
                      f = a.baselineBraking,
                      y = n?.status || "GREEN",
                      _ = b("rsimod", m, v),
                      w = b("braking", u, f),
                      E = b("asymmetry", g, null),
                      k = n?.status || "GREEN",
                      I = (function (e) {
                        const t = {},
                          a = b(
                            "rsimod",
                            e.semaphore?.rsimod?.current,
                            e.semaphore?.rsimod?.baseline,
                          ),
                          n =
                            (b("jh", e.profile?.jumpHeight, null),
                            e.semaphore?.status || "GREEN"),
                          s = b("braking", e.brakingImpulse, e.baselineBraking),
                          l = b(
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
                          ].forEach((e) => x(t, e, a)),
                          [
                            "svgm-hamstrings-l",
                            "svgm-hamstrings-r",
                            "svgm-glutes-l",
                            "svgm-glutes-r",
                            "svgm-calves-l",
                            "svgm-calves-r",
                            "svgm-lumbar",
                          ].forEach((e) => x(t, e, s)),
                          ["svgm-hipflexors", "svgm-core"].forEach((e) =>
                            x(t, e, n),
                          ),
                          "GREEN" !== l && "unknown" !== l)
                        ) {
                          const e = "SX" === i ? "r" : "l";
                          [
                            "svgm-quadriceps-",
                            "svgm-hamstrings-",
                            "svgm-glutes-",
                            "svgm-calves-",
                          ].forEach((a) => {
                            x(t, a + e, l);
                          });
                        }
                        return t;
                      })(a),
                      A = (e, t) =>
                        null == e || null == t || 0 === t
                          ? null
                          : (((e - t) / t) * 100).toFixed(1),
                      S = (e) =>
                        null == e
                          ? '<span style="color:var(--color-text-muted);font-size:10px;">No baseline</span>'
                          : `<span style="color:${e >= 0 ? "#00E676" : e >= -5 ? "#FFD600" : "#FF1744"};font-weight:600;">${e > 0 ? "+" : ""}${e}% vs baseline</span>`,
                      U =
                        {
                          GREEN: "#00E676",
                          YELLOW: "#FFD600",
                          RED: "#FF1744",
                          ALERT: "#FF6D00",
                        }[k] || "#888",
                      L = [
                        {
                          name: "Jump Height",
                          value: null != p ? p.toFixed(1) : "—",
                          unit: "cm",
                          status: y,
                          delta: S(null),
                          icon: "arrow-fat-up",
                        },
                        {
                          name: "RSImod",
                          value: null != m ? m.toFixed(3) : "—",
                          unit: "",
                          status: _,
                          delta: S(A(m, v)),
                          icon: "lightning",
                        },
                        {
                          name: "Braking Impulse",
                          value: null != u ? u.toFixed(0) : "—",
                          unit: "Ns",
                          status: w,
                          delta: S(A(u, f)),
                          icon: "arrows-in",
                        },
                        {
                          name: "Asimmetria",
                          value: null != g ? g.toFixed(1) : "—",
                          unit: "%",
                          status: E,
                          delta:
                            null != g
                              ? `<span style="color:var(--color-text-muted);font-size:10px;">${s?.landing?.dominant ?? "—"} dominante</span>`
                              : "",
                          icon: "arrows-left-right",
                        },
                      ];
                    t.innerHTML = `\n        <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--sp-2);padding-bottom:var(--sp-2);border-bottom:1px solid var(--color-border);">\n          <div style="width:10px;height:10px;border-radius:50%;background:${U};box-shadow:0 0 8px ${U};flex-shrink:0;"></div>\n          <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${Utils.escapeHtml(n?.label || k)}</span>\n          <span style="font-size:10px;color:var(--color-text-muted);margin-left:auto;">Test: ${Utils.escapeHtml(o || "—")} · ${Utils.escapeHtml(d || "CMJ")}</span>\n        </div>\n\n        \x3c!-- ── HERO: immagini a tutto schermo ── --\x3e\n        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);margin-bottom:var(--sp-3);">\n          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">\n            <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Frontale</span>\n            ${$("front", I)}\n          </div>\n          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">\n            <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-text-muted);">Posteriore</span>\n            ${$("back", I)}\n          </div>\n        </div>\n\n        \x3c!-- Legenda colori --\x3e\n        <div class="cmj-legend" style="margin-bottom:var(--sp-3);">\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#00E676;"></div>OK</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FFD600;"></div>Attenzione</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FF1744;"></div>Rischio</div>\n          <div class="cmj-legend-item"><div class="cmj-legend-dot" style="background:#FF6D00;"></div>Alert</div>\n        </div>\n\n        \x3c!-- ── INDICATORI SOTTO ── --\x3e\n        <div style="display:flex;flex-direction:column;gap:var(--sp-2);">\n\n          \x3c!-- 4 KPI card --\x3e\n          <div class="cmj-kpi-grid">\n            ${L.map(
                      (e) => {
                        return `\n              <div class="cmj-kpi-card ${h(e.status)}">\n                <div class="cmj-kpi-name"><i class="ph ph-${e.icon}" style="margin-right:4px;"></i>${e.name}</div>\n                <div class="cmj-kpi-value">${e.value}<span class="cmj-kpi-unit">${e.unit}</span></div>\n                <div class="cmj-kpi-delta">${((t = e.status), "unknown" === t ? "" : `<span class="cmj-kpi-badge ${{ GREEN: "green", YELLOW: "yellow", RED: "red", ALERT: "alert", unknown: "" }[t]}">${{ GREEN: "✓ OK", YELLOW: "⚠ Attenzione", RED: "✗ Rischio", ALERT: "⚡ Alert", unknown: "—" }[t]}</span>`)} ${e.delta}</div>\n              </div>`;
                        var t;
                      },
                    ).join(
                      "",
                    )}\n          </div>\n\n\n          \x3c!-- AI Buttons --\x3e\n          <div id="vald-ai-section-${e}" style="display:flex;flex-direction:column;gap:var(--sp-2);">\n            <div style="display:flex;gap:8px;flex-wrap:wrap;">\n              <button id="vald-ai-dx-btn-${e}" type="button" class="btn btn-sm" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:6px 14px;background:rgba(100,80,255,0.12);border:1px solid rgba(100,80,255,0.35);border-radius:var(--radius);color:rgba(160,140,255,1);cursor:pointer;" onclick="window.__valdAi('${e}','diagnosis')"><i class=\"ph ph-brain\"></i> Analisi Stato di Forma (AI)</button>\n              <button id="vald-ai-pl-btn-${e}" type="button" class="btn btn-sm" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:6px 14px;background:rgba(0,180,120,0.1);border:1px solid rgba(0,180,120,0.3);border-radius:var(--radius);color:rgba(0,210,140,1);cursor:pointer;" onclick="window.__valdAi('${e}','plan')"><i class=\"ph ph-barbell\"></i> Piano di Intervento (AI)</button>\n            </div>\n            <div id="vald-ai-result-${e}" style="display:none;"></div>\n          </div>\n\n          \x3c!-- Trend RSImod --\x3e\n          <div class="cmj-force-curve">\n            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">\n              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);">\n                <i class="ph ph-chart-line-up" style="margin-right:4px;"></i>Trend RSImod / Salto (ultimi test)\n              </span>\n              <span style="font-size:10px;color:var(--color-text-muted);">${c?.length || 0} test</span>\n            </div>\n            ${(function (
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
                      const s = 0.9 * Math.min(...n),
                        l = 1.1 * Math.max(...n),
                        i = (e) => 60 - ((e - s) / (l - s)) * 60,
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
                    )}
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span style="font-size:9px;color:var(--color-text-muted);">Più vecchio</span>
              <span style="font-size:9px;color:var(--color-text-muted);">Più recente</span>
            </div>
          </div>

          <!-- Storico VALD (Tabella Raw) -->
          <div style="margin-top:var(--sp-2);">
            <p class="section-label" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <i class="ph ph-list-numbers"></i> Dettaglio Misurazioni VALD
            </p>
            ${c && c.length > 0 ? `
            <div class="table-wrapper">
              <table class="table" style="font-size:12px;">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Test</th>
                    <th style="text-align:right;">RSImod</th>
                    <th style="text-align:right;">Jump Height</th>
                    <th style="text-align:right;">Asimmetria</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.map(test => {
                    const metrics = test.metrics || {};
                    const asymmValue = test.asymmetry?.landing?.asymmetry;
                    
                    return `
                    <tr>
                      <td>${Utils.formatDate(test.test_date) || "—"}</td>
                      <td>${Utils.escapeHtml(test.test_type || "CMJ")}</td>
                      <td style="text-align:right;font-weight:600;">${metrics.RSIModified?.Value ? metrics.RSIModified.Value.toFixed(2) : "—"}</td>
                      <td style="text-align:right;">${metrics.JumpHeight?.Value || metrics.JumpHeightImpMom?.Value || metrics.JumpHeightTotal?.Value ? (metrics.JumpHeight?.Value || metrics.JumpHeightImpMom?.Value || metrics.JumpHeightTotal?.Value).toFixed(1) + " cm" : "—"}</td>
                      <td style="text-align:right;">
                        ${asymmValue != null ? `
                          <span style="display:inline-flex;align-items:center;gap:4px;">
                            ${asymmValue.toFixed(1)}% <span style="font-size:9px;color:var(--color-text-muted);">${test.asymmetry?.landing?.dominant || ""}</span>
                          </span>
                        ` : "—"}
                      </td>
                    </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>` : '<div style="font-size:12px;color:var(--color-text-muted);text-align:center;padding:16px;">Nessuna misurazione disponibile.</div>'}
          </div>

          <!-- Asimmetria SX / DX -->
          ${s ? `
          <div style="background:rgba(255,255,255,0.02);border:1px solid var(--color-border);border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-text-muted);margin-bottom:10px;">
              <i class="ph ph-arrows-left-right" style="margin-right:4px;"></i>Dettaglio Asimmetria SX / DX
            </div>
            <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--sp-1);">
              <div style="text-align:left;">
                <div style="font-size:9px;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:2px;">SX</div>
                <div style="font-size:1.2rem;font-family:var(--font-display);font-weight:700;">${s.landing?.left ?? "—"}<span style="font-size:11px;color:var(--color-text-muted);"> N</span></div>
                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:4px;overflow:hidden;"><div style="height:100%;background:#00f2fe;border-radius:4px;width:${Math.round(((s.landing?.left || 0) / ((s.landing?.left || 0) + (s.landing?.right || 1))) * 100)}%;"></div></div>
              </div>
              <div style="text-align:center;"><div class="cmj-kpi-badge ${"ALERT" === E ? "alert" : "YELLOW" === E ? "yellow" : "green"}" style="font-size:10px;padding:4px 10px;">${null != g ? g.toFixed(1) + "%" : "—"}</div></div>
              <div style="text-align:right;">
                <div style="font-size:9px;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:2px;">DX</div>
                <div style="font-size:1.2rem;font-family:var(--font-display);font-weight:700;">${s.landing?.right ?? "—"}<span style="font-size:11px;color:var(--color-text-muted);"> N</span></div>
                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;margin-top:4px;overflow:hidden;"><div style="height:100%;background:#ff007a;border-radius:4px;margin-left:auto;width:${Math.round(((s.landing?.right || 0) / ((s.landing?.left || 0) + (s.landing?.right || 1))) * 100)}%;"></div></div>
              </div>
            </div>
          </div>` : ""}

        </div>\n      `;
                  } catch (e) {
                    t.innerHTML = `\n        <div style="text-align:center;padding:var(--sp-4);background:rgba(255,59,48,0.04);border:1px solid rgba(255,59,48,0.2);border-radius:var(--radius);">\n          <i class="ph ph-warning" style="font-size:36px;color:#FF3B30;opacity:0.6;display:block;margin-bottom:8px;"></i>\n          <p style="font-size:13px;font-weight:700;color:var(--color-text);">Errore caricamento VALD</p>\n          <p style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${Utils.escapeHtml(e.message)}</p>\n        </div>`;
                  }
                }
              })(n)));
        };
        document.querySelectorAll(".athlete-tab-btn").forEach((t) => {
          t.addEventListener("click", () => k(t.dataset.tab), {
            signal: e.signal,
          });
        });
        const I = document.getElementById("athlete-tab-bar"),
          A = document.getElementById("tab-scroll-indicator");
        if (I && A) {
          const t = () => {
            const e = I.scrollLeft + I.clientWidth >= I.scrollWidth - 10;
            A.style.opacity = e ? "0" : "0.8";
          };
          (I.addEventListener("scroll", t, { signal: e.signal }),
            setTimeout(t, 100));
        }
        (k(s), y(n));
      } catch (e) {
        l.innerHTML = Utils.emptyState("Atleta non trovato", e.message);
      }
    } else v();
    var i;
  }
  async function y(_e) { /* ai-summary removed */ }
  function b(e, t, a) {
    if (null == t) return "unknown";
    if ("asymmetry" === e)
      return t <= 8 ? "GREEN" : t <= 12 ? "YELLOW" : "ALERT";
    if (null == a || 0 === a) return "GREEN";
    const n = ((t - a) / a) * 100;
    return n >= -5 ? "GREEN" : n >= -10 ? "YELLOW" : "RED";
  }
  function h(e) {
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
  function x(e, t, a) {
    const n = { ALERT: 4, RED: 3, YELLOW: 2, GREEN: 1, unknown: 0 };
    (n[a] || 0) > (n[e[t]] || 0) && (e[t] = a);
  }
  function $(e, t) {
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
      s = `\n      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" aria-hidden="true">\n        <defs>\n          <filter id="glow-front">\n            <feGaussianBlur stdDeviation="1.5" result="blur"/>\n            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>\n          </filter>\n        </defs>\n        <g filter="url(#glow-front)" opacity="0.82">\n          \x3c!-- Core / Abs --\x3e\n          <ellipse id="svgm-core" class="${a("svgm-core")}" cx="50" cy="39" rx="9" ry="7" />\n          \x3c!-- Hip Flexors --\x3e\n          <ellipse id="svgm-hipflexors" class="${a("svgm-hipflexors")}" cx="50" cy="49" rx="11" ry="4" />\n          \x3c!-- Quadriceps SX (destra dello schermo = lato sinistro atleta) --\x3e\n          <ellipse id="svgm-quadriceps-l" class="${a("svgm-quadriceps-l")}" cx="43" cy="64" rx="7" ry="10" />\n          \x3c!-- Quadriceps DX --\x3e\n          <ellipse id="svgm-quadriceps-r" class="${a("svgm-quadriceps-r")}" cx="57" cy="64" rx="7" ry="10" />\n          \x3c!-- Adductors SX --\x3e\n          <ellipse id="svgm-adductors-l" class="${"muscle-default" === a("svgm-adductors-l") ? "muscle-default" : a("svgm-adductors-l")}" cx="47" cy="66" rx="3" ry="9" />\n          \x3c!-- Adductors DX --\x3e\n          <ellipse id="svgm-adductors-r" class="muscle-default" cx="53" cy="66" rx="3" ry="9" />\n          \x3c!-- Tibialis SX --\x3e\n          <ellipse id="svgm-tibialis-l" class="muscle-default" cx="43" cy="83" rx="4" ry="7" />\n          \x3c!-- Tibialis DX --\x3e\n          <ellipse id="svgm-tibialis-r" class="muscle-default" cx="57" cy="83" rx="4" ry="7" />\n        </g>\n      </svg>`,
      l = `\n      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" aria-hidden="true">\n        <defs>\n          <filter id="glow-back">\n            <feGaussianBlur stdDeviation="1.5" result="blur"/>\n            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>\n          </filter>\n        </defs>\n        <g filter="url(#glow-back)" opacity="0.82">\n          \x3c!-- Thoracic (upper back) --\x3e\n          <ellipse id="svgm-thoracic" class="muscle-default" cx="50" cy="28" rx="12" ry="7" />\n          \x3c!-- Lumbar --\x3e\n          <ellipse id="svgm-lumbar" class="${a("svgm-lumbar")}" cx="50" cy="40" rx="8" ry="6" />\n          \x3c!-- Glutes SX --\x3e\n          <ellipse id="svgm-glutes-l" class="${a("svgm-glutes-l")}" cx="44" cy="52" rx="8" ry="7" />\n          \x3c!-- Glutes DX --\x3e\n          <ellipse id="svgm-glutes-r" class="${a("svgm-glutes-r")}" cx="56" cy="52" rx="8" ry="7" />\n          \x3c!-- Hamstrings SX --\x3e\n          <ellipse id="svgm-hamstrings-l" class="${a("svgm-hamstrings-l")}" cx="43" cy="66" rx="7" ry="10" />\n          \x3c!-- Hamstrings DX --\x3e\n          <ellipse id="svgm-hamstrings-r" class="${a("svgm-hamstrings-r")}" cx="57" cy="66" rx="7" ry="10" />\n          \x3c!-- Calves SX --\x3e\n          <ellipse id="svgm-calves-l" class="${a("svgm-calves-l")}" cx="43" cy="83" rx="4.5" ry="7" />\n          \x3c!-- Calves DX --\x3e\n          <ellipse id="svgm-calves-r" class="${a("svgm-calves-r")}" cx="57" cy="83" rx="4.5" ry="7" />\n        </g>\n      </svg>`;
    return `<div style="position:relative;width:100%;">\n      <img src="${n}" alt="Corpo femminile vista ${"front" === e ? "frontale" : "posteriore"}"\n        style="width:100%;height:auto;display:block;border-radius:8px;object-fit:cover;"\n        onerror="this.style.display='none'">\n      ${"front" === e ? s : l}\n    </div>`;
  }
  function _(e) {
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
  return {
    destroy: function () {
      (e.abort(), (e = new AbortController()), i.clear(), (r = !1), (t = []), (a = []), (l = null), (n = ""));
      const el = document.getElementById("athlete-bulk-bar");
      el && el.remove();
    },
    init: async function () {
      "undefined" != typeof FilterState &&
        ((n = FilterState.restore("athletes", "team", "")),
        (s = FilterState.restore("athletes", "tab", "anagrafica")));
      const e = document.getElementById("app");
      if (!e) return;
      (UI.loading(!0), (e.innerHTML = UI.skeletonPage()));
      const i = App.getUser(),
        r = Router.getCurrentRoute(),
        o = {
          "athlete-profile": "anagrafica",
          "athlete-payments": "pagamenti",
          "athlete-metrics": "metrics",
          "athlete-documents": "documenti",
        };
      try {
        if ("atleta" === i?.role && i.athleteId)
          return (
            (a = await Store.get("teams", "athletes")),
            (l = i.athleteId),
            void (await f(i.athleteId, "anagrafica"))
          );
        if (
          (([a, t] = await Promise.all([
            Store.get("teams", "athletes"),
            Store.get("listLight", "athletes"),
          ])),
          o[r])
        )
          return (
            (s = o[r]),
            (l = null),
            "athlete-metrics" === r && (n = ""),
            void u()
          );
        const e = Router.getParams();
        e.id
          ? ((l = e.id), await f(e.id, "anagrafica"))
          : ((l = null), (s = "anagrafica"), u());
      } catch (t) {
        ((e.innerHTML = Utils.emptyState(
          "Errore nel caricamento atleti",
          t.message + (t.stack ? ` [${t.stack.split("\n")[0]}]` : ""),
        )),
          UI.toast("Errore caricamento atleti", "error"));
      } finally {
        UI.loading(!1);
      }
    },
  };
})();
window.Athletes = Athletes;

// VALD On-Demand AI Analysis — persistent results + chat per section
window.__valdAi = async function(athleteId, part) {
  const label  = part === 'plan' ? 'Piano di Intervento' : 'Analisi Stato di Forma';
  const color  = part === 'plan' ? 'rgba(0,200,140,0.9)' : 'rgba(150,130,255,0.9)';
  const bg     = part === 'plan' ? 'rgba(0,180,120,0.07)' : 'rgba(100,80,255,0.07)';
  const border = part === 'plan' ? 'rgba(0,180,120,0.25)' : 'rgba(100,80,255,0.25)';
  const icon   = part === 'plan' ? 'ph-barbell' : 'ph-brain';
  // Each part has its own result container so both can show simultaneously
  const resultId = 'vald-ai-' + part + '-result-' + athleteId;
  const btnId    = (part === 'plan' ? 'vald-ai-pl-btn-' : 'vald-ai-dx-btn-') + athleteId;
  const btn      = document.getElementById(btnId);
  let resultEl   = document.getElementById(resultId);

  // Create slot if missing
  const section = document.getElementById('vald-ai-section-' + athleteId);
  if (!resultEl && section) {
    resultEl = document.createElement('div');
    resultEl.id = resultId;
    section.appendChild(resultEl);
  }
  if (!resultEl) return;

  // Always invalidate cache before calling AI — prevents stale error responses
  Store.invalidate('aiAnalysis/vald');

  if (btn) { btn.disabled = true; btn.textContent = 'Elaborazione AI\u2026'; }
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div style="font-size:12px;color:var(--color-text-muted);padding:8px 0;">AI in elaborazione\u2026 (15-25s)</div>';

  try {
    const data = await Store.get('aiAnalysis', 'vald', { athleteId, part });
    const raw  = (data && data.text) ? data.text : 'Nessuna risposta AI.';
    const text = raw
      .replace(/^(DIAGNOSI|PIANO\s+DI\s+INTERVENTO|PIANO)\s*:\s*/i, '')
      .replace(/\*+/g, '')   // strip markdown asterisks (bold/italic)
      .trim();

    const chatId = 'vald-chat-' + part + '-' + athleteId;

    // Mini markdown renderer: tables, headings, lists, plain text
    function renderAiMarkdown(md) {
      const lines  = md.split('\n');
      let html     = '';
      let inList   = false;
      let i        = 0;
      while (i < lines.length) {
        const line = lines[i];
        // Markdown table: detect block of lines containing |
        if (line.trim().startsWith('|')) {
          // close any open list
          if (inList) { html += '</ul>'; inList = false; }
          // collect table rows
          const tRows = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            const row = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            // skip separator rows (----)
            if (!row.every(c => /^[-: ]+$/.test(c))) tRows.push(row);
            i++;
          }
          if (tRows.length) {
            html += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:6px 0;">';
            tRows.forEach((row, ri) => {
              const tag = ri === 0 ? 'th' : 'td';
              html += '<tr>' + row.map(c =>
                `<${tag} style="border:1px solid ${border};padding:4px 8px;text-align:left;${ri===0?'background:rgba(255,255,255,0.05);font-weight:600;':''}">${Utils.escapeHtml(c)}</${tag}>`
              ).join('') + '</tr>';
            });
            html += '</table>';
          }
          continue;
        }
        // Heading ## or ###
        if (/^#{1,3}\s/.test(line)) {
          if (inList) { html += '</ul>'; inList = false; }
          const txt = line.replace(/^#{1,3}\s/, '');
          html += `<div style="font-weight:700;margin:8px 0 3px;font-size:13px;">${Utils.escapeHtml(txt)}</div>`;
          i++; continue;
        }
        // Bullet / numbered list
        if (/^[-•*]\s|^\d+\.\s/.test(line.trim())) {
          if (!inList) { html += '<ul style="margin:4px 0 4px 16px;padding:0;list-style:disc;">'; inList = true; }
          const txt = line.replace(/^[-•*]\s|^\d+\.\s/, '');
          html += `<li style="margin:2px 0;font-size:13px;line-height:1.55;">${Utils.escapeHtml(txt)}</li>`;
          i++; continue;
        }
        // Empty line
        if (line.trim() === '') {
          if (inList) { html += '</ul>'; inList = false; }
          html += '<br>';
          i++; continue;
        }
        // Normal paragraph line
        if (inList) { html += '</ul>'; inList = false; }
        html += `<span style="font-size:13px;line-height:1.65;">${Utils.escapeHtml(line)}</span><br>`;
        i++;
      }
      if (inList) html += '</ul>';
      return html;
    }

    resultEl.innerHTML =
      '<div style="background:'+bg+';border:1px solid '+border+';border-radius:var(--radius);padding:var(--sp-2) var(--sp-3);margin-top:var(--sp-1);">'
      + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:'+color+';margin-bottom:6px;">'
      + '<i class="ph '+icon+'" style="margin-right:4px;"></i>'+label+' <span style="font-size:9px;opacity:0.7;">AI \u00b7 Gemini</span>'
      + '</div>'
      + '<div id="vald-ai-'+part+'-text-'+athleteId+'" style="color:var(--color-text);margin:0 0 10px;">'+renderAiMarkdown(text)+'</div>'
      // Chat section
      + '<div id="'+chatId+'" style="border-top:1px solid '+border+';padding-top:8px;margin-top:4px;">'
      + '<div id="'+chatId+'-history" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;margin-bottom:8px;"></div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
      + '<input id="'+chatId+'-input" type="text" placeholder="Chiedi al preparatore AI\u2026" style="flex:1;font-size:12px;padding:6px 10px;border-radius:var(--radius);border:1px solid '+border+';background:rgba(255,255,255,0.04);color:var(--color-text);outline:none;" '
      + 'onkeydown="if(event.key===\'Enter\')window.__valdChat(\''+athleteId+'\',\''+part+'\');">'
      + '<button type="button" onclick="window.__valdChat(\''+athleteId+'\',\''+part+'\');" style="padding:6px 12px;font-size:12px;border-radius:var(--radius);border:1px solid '+border+';background:'+bg+';color:'+color+';cursor:pointer;white-space:nowrap;">'
      + '<i class="ph ph-paper-plane-tilt"></i> Invia</button>'
      + '</div></div>'
      + '</div>';
  } catch (err) {
    resultEl.innerHTML = '<div style="color:var(--color-danger);font-size:12px;">Errore: ' + Utils.escapeHtml(err.message) + '</div>';
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = (part === 'plan'
      ? '<i class="ph ph-barbell"></i> Piano di Intervento (AI)'
      : '<i class="ph ph-brain"></i> Analisi Stato di Forma (AI)');
  }
};

// VALD AI Chat — ask follow-up questions
window.__valdChat = async function(athleteId, part) {
  const chatId  = 'vald-chat-' + part + '-' + athleteId;
  const input   = document.getElementById(chatId + '-input');
  const history = document.getElementById(chatId + '-history');
  if (!input || !history) return;

  const question = input.value.trim();
  if (!question) return;

  // Get last AI result as context
  const textEl = document.getElementById('vald-ai-' + part + '-text-' + athleteId);
  const context = textEl ? textEl.textContent.slice(0, 600) : '';

  input.value = '';
  input.disabled = true;

  // User bubble
  const userDiv = document.createElement('div');
  userDiv.style.cssText = 'background:rgba(255,255,255,0.06);border-radius:8px;padding:6px 10px;font-size:12px;color:var(--color-text);align-self:flex-end;max-width:85%;';
  userDiv.textContent = question;
  history.appendChild(userDiv);

  // AI thinking bubble
  const aiDiv = document.createElement('div');
  aiDiv.style.cssText = 'background:rgba(100,80,255,0.08);border-radius:8px;padding:6px 10px;font-size:12px;color:var(--color-text-muted);align-self:flex-start;max-width:90%;white-space:pre-line;';
  aiDiv.textContent = 'Sto elaborando\u2026';
  history.appendChild(aiDiv);
  history.scrollTop = history.scrollHeight;

  try {
    const resp = await Store.api('aiChat', 'vald', { athleteId, question, context });
    aiDiv.style.color = 'var(--color-text)';
    aiDiv.textContent = (resp && resp.answer) ? resp.answer : 'Nessuna risposta.';
  } catch (err) {
    aiDiv.style.color = 'var(--color-danger)';
    aiDiv.textContent = 'Errore: ' + err.message;
  }

  input.disabled = false;
  input.focus();
  history.scrollTop = history.scrollHeight;
};
