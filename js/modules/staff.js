"use strict";
const Staff = (() => {
  let e = new AbortController(),
    t = [],
    globalTeamsList = [],
    n = null;
  const a = [
    "#f472b6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#0ea5e9",
  ];
  function l(e) {
    if (!e) return a[0];
    let t = 0;
    for (let n = 0; n < e.length; n++) t = e.charCodeAt(n) + ((t << 5) - t);
    return a[Math.abs(t) % a.length];
  }
  function formatTeamLabel(category, name) {
    let cat = (category || "").toUpperCase();
    return cat.match(/^U\d+$/)
      ? cat.replace("U", "Under ")
      : cat
        ? category + " — " + name
        : name || "";
  }
  function s(e, t, n) {
    const a = n || "var(--color-white)";
    return `\n        <div style="display:flex;flex-direction:column;gap:2px;">\n          <span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">${Utils.escapeHtml(e)}</span>\n          <span style="font-size:14px;font-weight:500;color:${a};">${t ? Utils.escapeHtml(String(t)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>\n        </div>`;
  }
  function i() {
    const n = document.getElementById("app");
    if (!n) return;
    const a = App.getUser(),
      s = ["admin", "manager", "operator"].includes(a?.role),
      r = [...new Set(t.map((e) => e.role).filter(Boolean))].sort();
    ((n.innerHTML = `\n            <div class="page-header" style="border-bottom:1px solid var(--color-border);padding-bottom:var(--sp-3);margin-bottom:var(--sp-3);">\n                <div>\n                    <h1 class="page-title">Staff</h1>\n                    <p class="page-subtitle">${t.length} membro${1 !== t.length ? "i" : ""} nel sistema</p>\n                </div>\n            </div>\n\n            <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap;">\n                <div class="input-wrapper" style="position:relative;min-width:220px;">\n                    <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>\n                    <input type="text" id="staff-search" class="form-input" placeholder="Cerca membro staff..." style="padding-left:36px;height:42px;font-size:13px;">\n                </div>\n                ${s ? '<button class="btn btn-primary" id="new-staff-btn" type="button">+ NUOVO MEMBRO</button>' : ""}\n            </div>\n\n            <div class="filter-bar" id="staff-role-filter" style="margin-bottom:var(--sp-3);">\n                <button class="filter-chip active" data-role="" type="button">Tutti</button>\n                ${r.map((e) => `<button class="filter-chip" data-role="${Utils.escapeHtml(e.toLowerCase())}" type="button">${Utils.escapeHtml(e)}</button>`).join("")}\n            </div>\n\n            <div class="grid-3" id="staff-grid">\n                ${0 === t.length
      ? Utils.emptyState(
        "Nessun membro staff",
        "Aggiungi il primo membro con il pulsante in alto.",
      )
      : t
        .map((e) =>
          (function (e) {
            const t = l(e.full_name),
              n = Utils.initials(e.full_name),
              a = new Date(),
              s =
                e.medical_cert_expires_at &&
                new Date(e.medical_cert_expires_at) < a;
            const teamNamesStr = e.team_names || (e.team_ids && e.team_ids.length > 0 ? e.team_ids.map(id => {
              const tm = globalTeamsList.find(t => String(t.id) === String(id));
              return tm ? formatTeamLabel(tm.category, tm.name) : '';
            }).filter(Boolean).join(', ') : '');
            return `\n        <div class="card" style="cursor:pointer;position:relative;overflow:hidden;"\n             data-staff-id="${Utils.escapeHtml(e.id)}"\n             data-name="${Utils.escapeHtml((e.full_name || "").toLowerCase())}"\n             data-role="${Utils.escapeHtml((e.role || "").toLowerCase())}">\n            ${s ? '<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:8px;height:8px;border-radius:50%;background:var(--color-pink);box-shadow:0 0 6px var(--color-pink);"></div>' : ""}\n            <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">\n                <div style="width:48px;height:48px;background:${t};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;">\n                    ${Utils.escapeHtml(n)}\n                </div>\n                <div style="overflow:hidden;flex:1;">\n                    <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(e.full_name)}</div>\n                    <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(e.role || "—")}</div>\n                    <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(teamNamesStr)}</div>\n                    ${e.phone ? `<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;"><i class="ph ph-phone" style="font-size:11px;"></i> ${Utils.escapeHtml(e.phone)}</div>` : ""}\n                </div>\n            </div>\n        </div>`;
          })(e),
        )
        .join("")
      }\n            </div>\n        `),
      document.getElementById("staff-search")?.addEventListener(
        "input",
        (e) => {
          const t = e.target.value.trim().toLowerCase();
          document.querySelectorAll("[data-staff-id]").forEach((e) => {
            const n =
              (e.dataset.name || "").includes(t) ||
              (e.dataset.role || "").includes(t);
            e.style.display = n ? "" : "none";
          });
        },
        { signal: e.signal },
      ),
      document
        .querySelectorAll("#staff-role-filter [data-role]")
        .forEach((t) => {
          t.addEventListener(
            "click",
            () => {
              (document
                .querySelectorAll("#staff-role-filter [data-role]")
                .forEach((e) => e.classList.remove("active")),
                t.classList.add("active"));
              const e = t.dataset.role;
              document.querySelectorAll("[data-staff-id]").forEach((t) => {
                t.style.display = e && t.dataset.role !== e ? "none" : "";
              });
            },
            { signal: e.signal },
          );
        }),
      document.querySelectorAll("[data-staff-id]").forEach((t) => {
        t.addEventListener("click", () => o(t.dataset.staffId), {
          signal: e.signal,
        });
      }),
      document.getElementById("new-staff-btn")?.addEventListener(
        "click",
        () =>
          (function () {
            const teamOptions = globalTeamsList.map(tm => `<label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="ns-teams" value="${Utils.escapeHtml(tm.id)}" class="form-checkbox"> ${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</label>`).join("");
            const n = ["Dati Personali", "Contatti & Documenti"];
            let a = 1;
            const l = {},
              s = [
                `<div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-fname">Nome *</label><input id="ns-fname" class="form-input" type="text" placeholder="Marco" required></div>\n                <div class="form-group"><label class="form-label" for="ns-lname">Cognome *</label><input id="ns-lname" class="form-input" type="text" placeholder="Rossi" required></div>\n            </div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-role">Ruolo / Qualifica</label>\n                    <select id="ns-role" class="form-select">\n                        <option value="">Seleziona...</option>\n                        <option>Primo Allenatore</option><option>Secondo Allenatore</option><option>Preparatore Atletico</option>\n                        <option>Medico</option><option>Fisioterapista</option><option>Segreteria</option><option>Dirigente</option><option>Addetta Stampa</option><option>Altro</option>\n                    </select>\n                </div>\n                <div class="form-group"><label class="form-label" for="ns-birth">Data di Nascita</label><input id="ns-birth" class="form-input" type="date"></div>\n            </div>\n            <div class="form-group"><label class="form-label">Squadre (Opzionale)</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">${teamOptions}</div></div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-birthplace">Luogo di Nascita</label><input id="ns-birthplace" class="form-input" type="text" placeholder="Roma"></div>\n                <div class="form-group"><label class="form-label" for="ns-rescity">Città di Residenza</label><input id="ns-rescity" class="form-input" type="text" placeholder="Milano"></div>\n            </div>`,
                '<div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-phone">Cellulare</label><input id="ns-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>\n                <div class="form-group"><label class="form-label" for="ns-email">E-Mail</label><input id="ns-email" class="form-input" type="email" placeholder="nome@email.com"></div>\n            </div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-fiscal">Codice Fiscale</label><input id="ns-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>\n                <div class="form-group"><label class="form-label" for="ns-doc">Documento d\'Identità</label><input id="ns-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>\n            </div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-medcert">Scadenza Cert. Medico</label><input id="ns-medcert" class="form-input" type="date"></div>\n            </div>\n            <div class="form-group"><label class="form-label" for="ns-notes">Note</label><textarea id="ns-notes" class="form-input" rows="2" placeholder="Note aggiuntive..." style="resize:vertical;"></textarea></div>',
              ],
              o = () => {
                document
                  .querySelectorAll(
                    "#staff-wizard-body input:not([type=checkbox]), #staff-wizard-body select, #staff-wizard-body textarea",
                  )
                  .forEach((e) => {
                    l[e.id] = e.value;
                  });
                const checkedTeams = Array.from(document.querySelectorAll('#staff-wizard-body input[name="ns-teams"]:checked')).map(el => el.value);
                if (checkedTeams.length > 0 || l["ns-teams-touched"]) {
                  l["ns-teams"] = checkedTeams;
                  l["ns-teams-touched"] = true;
                }
              },
              r = () => {
                const e = document.getElementById("staff-wizard-body");
                if (!e) return;
                ((e.innerHTML = `\n                <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">\n                    ${[1, 2].map((e) => `\n                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">\n                            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;\n                                ${e < a ? "background:var(--color-success);color:#000;" : e === a ? "background:var(--color-pink);color:#fff;" : "background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);"}">\n                                ${e < a ? "✓" : e}\n                            </div>\n                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${e === a ? "var(--color-white)" : "rgba(255,255,255,0.35)"};">${n[e - 1]}</div>\n                        </div>\n                        ${e < 2 ? `<div style="flex:0.5;height:2px;background:${e < a ? "var(--color-success)" : "rgba(255,255,255,0.1)"};margin-bottom:20px;"></div>` : ""}\n                    `).join("")}\n                </div>\n                <div id="ns-step-content">${s[a - 1]}</div>\n                <div id="ns-error" class="form-error hidden"></div>\n            `),
                  requestAnimationFrame(() => {
                    Object.entries(l).forEach(([e, t]) => {
                      if (e === "ns-teams" || e === "ns-teams-touched") return;
                      const n = document.getElementById(e);
                      n && (n.value = t);
                    });
                    if (l["ns-teams"]) {
                      l["ns-teams"].forEach(tid => {
                        const cb = document.querySelector(`#staff-wizard-body input[name="ns-teams"][value="${tid}"]`);
                        if (cb) cb.checked = true;
                      });
                    }
                  }));
                const t = document.getElementById("ns-prev"),
                  i = document.getElementById("ns-next"),
                  o = document.getElementById("ns-save");
                (t && (t.style.display = 1 === a ? "none" : ""),
                  i && (i.style.display = 2 === a ? "none" : ""),
                  o && (o.style.display = 2 === a ? "" : "none"));
              },
              d = UI.modal({
                title: "Nuovo Membro Staff",
                body: '<div id="staff-wizard-body"></div>',
                footer:
                  '\n                <button class="btn btn-ghost btn-sm" id="ns-cancel" type="button">Annulla</button>\n                <button class="btn btn-default btn-sm" id="ns-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>\n                <button class="btn btn-primary btn-sm" id="ns-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>\n                <button class="btn btn-primary btn-sm" id="ns-save" type="button" style="display:none;">CREA MEMBRO</button>\n            ',
              });
            (r(),
              document
                .getElementById("ns-cancel")
                ?.addEventListener("click", () => d.close(), {
                  signal: e.signal,
                }),
              document.getElementById("ns-prev")?.addEventListener(
                "click",
                () => {
                  (o(), a > 1 && (a--, r()));
                },
                { signal: e.signal },
              ),
              document.getElementById("ns-next")?.addEventListener(
                "click",
                () => {
                  if (1 === a) {
                    const e = document.getElementById("ns-fname")?.value.trim(),
                      t = document.getElementById("ns-lname")?.value.trim(),
                      n = document.getElementById("ns-error");
                    if (!e || !t)
                      return (
                        (n.textContent = "Nome e cognome sono obbligatori"),
                        void n.classList.remove("hidden")
                      );
                  }
                  (o(), a < 2 && (a++, r()));
                },
                { signal: e.signal },
              ),
              document.getElementById("ns-save")?.addEventListener(
                "click",
                async () => {
                  o();
                  const e = document.getElementById("ns-error"),
                    n = document.getElementById("ns-save");
                  ((n.disabled = !0), (n.textContent = "Creazione..."));
                  try {
                    (await Store.api("create", "staff", {
                      first_name: l["ns-fname"] || "",
                      last_name: l["ns-lname"] || "",
                      role: l["ns-role"] || null,
                      birth_date: l["ns-birth"] || null,
                      birth_place: l["ns-birthplace"] || null,
                      residence_city: l["ns-rescity"] || null,
                      phone: l["ns-phone"] || null,
                      email: l["ns-email"] || null,
                      fiscal_code: (l["ns-fiscal"] || "").toUpperCase() || null,
                      identity_document: l["ns-doc"] || null,
                      medical_cert_expires_at: l["ns-medcert"] || null,
                      notes: l["ns-notes"] || null,
                      team_ids: l["ns-teams"] || [],
                    }),
                      d.close(),
                      UI.toast("Membro staff creato", "success"),
                      (t = await Store.get("list", "staff").catch(() => t)),
                      i());
                  } catch (t) {
                    ((e.textContent = t.message),
                      e.classList.remove("hidden"),
                      (n.disabled = !1),
                      (n.textContent = "CREA MEMBRO"));
                  }
                },
                { signal: e.signal },
              ));
          })(),
        { signal: e.signal },
      ));
  }
  async function o(a) {
    n = a;
    const r = document.getElementById("app");
    r.innerHTML = UI.skeletonPage();
    try {
      const d = await Store.get("get", "staff", { id: a }),
        c = App.getUser(),
        p = ["admin", "manager", "operator"].includes(c?.role),
        m = l(d.full_name),
        f = new Date(),
        u =
          d.medical_cert_expires_at && new Date(d.medical_cert_expires_at) < f;
      const teamNamesStr = d.team_names || (d.team_ids && d.team_ids.length > 0 ? d.team_ids.map(id => {
        const tm = globalTeamsList.find(t => t.id === id);
        return tm ? formatTeamLabel(tm.category, tm.name) : '';
      }).filter(Boolean).join(', ') : '');
      ((r.innerHTML = `\n                \x3c!-- BREADCRUMB --\x3e\n                <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-4);border-bottom:1px solid var(--color-border);background:var(--color-bg);position:sticky;top:72px;z-index:50;">\n                    <button class="btn btn-ghost btn-sm" id="staff-back" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button">\n                        <i class="ph ph-arrow-left" style="font-size:16px;"></i> Staff\n                    </button>\n                    <i class="ph ph-caret-right" style="font-size:12px;color:var(--color-text-muted);opacity:0.5;"></i>\n                    <span style="font-size:12px;font-weight:600;color:var(--color-white);text-transform:uppercase;letter-spacing:0.06em;">${Utils.escapeHtml(d.full_name)}</span>\n                    <div style="flex:1;"></div>\n                    ${p ? '<button class="btn btn-primary btn-sm" id="staff-edit-btn" type="button"><i class="ph ph-pencil-simple"></i> MODIFICA</button>' : ""}\n                    ${p ? '<button class="btn btn-default btn-sm" id="staff-delete-btn" type="button" style="margin-left:8px;color:var(--color-pink);border-color:rgba(255,0,122,0.3);"><i class="ph ph-trash"></i></button>' : ""}\n                </div>\n\n                \x3c!-- TAB BAR --\x3e\n                <div style="display:flex;gap:0;border-bottom:1px solid var(--color-border);overflow-x:auto;scrollbar-width:none;" id="staff-tab-bar" class="fusion-tabs-container">\n                    <button class="athlete-tab-btn fusion-tab active" data-stab="anagrafica" type="button">\n                        <i class="ph ph-identification-card"></i> Anagrafica\n                    </button>\n                    <button class="athlete-tab-btn fusion-tab" data-stab="documenti" type="button">\n                        <i class="ph ph-file-text"></i> Documenti\n                    </button>\n                </div>\n\n                \x3c!-- TAB: ANAGRAFICA --\x3e\n                <div id="stab-panel-anagrafica" style="padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-4);">\n                    <div>\n                        <p class="section-label">Dati Anagrafici e Contatti</p>\n                        <div class="card" style="padding:var(--sp-3);">\n                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">\n                                ${s("Nome", d.first_name)}\n                                ${s("Cognome", d.last_name)}\n                                ${s("Ruolo / Qualifica", d.role)}\n                                ${s("Squadre", teamNamesStr)}\n                                ${s("Data di Nascita", d.birth_date ? Utils.formatDate(d.birth_date) : null)}\n                                ${s("Luogo di Nascita", d.birth_place)}\n                                ${s("Città di Residenza", d.residence_city)}\n                                ${s("Via di Residenza", d.residence_address)}\n                                ${s("Cellulare", d.phone)}\n                                ${s("E-Mail", d.email)}\n                            </div>\n                            ${d.notes ? `<div style="margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--color-border);"><span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;">Note</span><p style="font-size:14px;margin-top:4px;line-height:1.6;">${Utils.escapeHtml(d.notes)}</p></div>` : ""}\n                        </div>\n                    </div>\n                </div>\n\n                \x3c!-- TAB: DOCUMENTI --\x3e\n                <div id="stab-panel-documenti" style="padding:var(--sp-4);display:none;flex-direction:column;gap:var(--sp-4);">\n                    <div>\n                        <p class="section-label">Documenti</p>\n                        <div class="card" style="padding:var(--sp-3);">\n                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);">\n                                ${s("Codice Fiscale", d.fiscal_code)}\n                                ${s("Documento d'Identità", d.identity_document)}\n                                ${s("Scadenza Cert. Medico", d.medical_cert_expires_at ? Utils.formatDate(d.medical_cert_expires_at) : null, u ? "var(--color-pink)" : null)}\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            `),
        document.querySelectorAll("[data-stab]").forEach((t) => {
          t.addEventListener(
            "click",
            () => {
              const e = t.dataset.stab;
              (document.querySelectorAll("[data-stab]").forEach((t) => {
                const n = t.dataset.stab === e;
                n ? t.classList.add("active") : t.classList.remove("active");
              }),
                (document.getElementById(
                  "stab-panel-anagrafica",
                ).style.display = "anagrafica" === e ? "flex" : "none"),
                (document.getElementById("stab-panel-documenti").style.display =
                  "documenti" === e ? "flex" : "none"));
            },
            { signal: e.signal },
          );
        }),
        document.getElementById("staff-back")?.addEventListener(
          "click",
          () => {
            ((n = null), i());
          },
          { signal: e.signal },
        ),
        document.getElementById("staff-edit-btn")?.addEventListener(
          "click",
          () =>
            (function (e) {
              const teamOptions = globalTeamsList.map(tm => `<label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="es-teams" value="${Utils.escapeHtml(String(tm.id))}" class="form-checkbox" ${(e.team_ids || []).map(String).includes(String(tm.id)) ? "checked" : ""}> ${Utils.escapeHtml(formatTeamLabel(tm.category, tm.name))}</label>`).join("");
              const n = UI.modal({
                title: "Modifica Membro Staff",
                body: `\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-fname">Nome *</label><input id="es-fname" class="form-input" type="text" value="${Utils.escapeHtml(e.first_name || "")}" required></div>\n                    <div class="form-group"><label class="form-label" for="es-lname">Cognome *</label><input id="es-lname" class="form-input" type="text" value="${Utils.escapeHtml(e.last_name || "")}" required></div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-role">Ruolo / Qualifica</label>\n                        <select id="es-role" class="form-select">\n                            <option value="">Seleziona...</option>\n                            ${["Primo Allenatore", "Secondo Allenatore", "Preparatore Atletico", "Medico", "Fisioterapista", "Segreteria", "Dirigente", "Addetta Stampa", "Altro"].map((t) => `<option ${e.role === t ? "selected" : ""}>${t}</option>`).join("")}\n                        </select>\n                    </div>\n                    <div class="form-group"><label class="form-label" for="es-birth">Data di Nascita</label><input id="es-birth" class="form-input" type="date" value="${e.birth_date ? e.birth_date.substring(0, 10) : ""}"></div>\n                </div>\n                <div class="form-group"><label class="form-label">Squadre (Opzionale)</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">${teamOptions}</div></div>\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-birthplace">Luogo di Nascita</label><input id="es-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(e.birth_place || "")}"></div>\n                    <div class="form-group"><label class="form-label" for="es-rescity">Città di Residenza</label><input id="es-rescity" class="form-input" type="text" value="${Utils.escapeHtml(e.residence_city || "")}"></div>\n                </div>\n                <div class="form-group"><label class="form-label" for="es-resaddr">Via di Residenza</label><input id="es-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(e.residence_address || "")}"></div>\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-phone">Cellulare</label><input id="es-phone" class="form-input" type="tel" value="${Utils.escapeHtml(e.phone || "")}"></div>\n                    <div class="form-group"><label class="form-label" for="es-email">E-Mail</label><input id="es-email" class="form-input" type="email" value="${Utils.escapeHtml(e.email || "")}"></div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-fiscal">Codice Fiscale</label><input id="es-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(e.fiscal_code || "")}" maxlength="16" style="text-transform:uppercase;"></div>\n                    <div class="form-group"><label class="form-label" for="es-doc">Documento d'Identità</label><input id="es-doc" class="form-input" type="text" value="${Utils.escapeHtml(e.identity_document || "")}"></div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group"><label class="form-label" for="es-medcert">Scadenza Cert. Medico</label><input id="es-medcert" class="form-input" type="date" value="${e.medical_cert_expires_at ? e.medical_cert_expires_at.substring(0, 10) : ""}"></div>\n                </div>\n                <div class="form-group"><label class="form-label" for="es-notes">Note</label><textarea id="es-notes" class="form-input" rows="2" style="resize:vertical;">${Utils.escapeHtml(e.notes || "")}</textarea></div>\n                <div id="es-error" class="form-error hidden"></div>\n            `,
                footer:
                  '\n                <button class="btn btn-ghost btn-sm" id="es-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="es-save" type="button">SALVA MODIFICHE</button>\n            ',
              });
              (document
                .getElementById("es-cancel")
                ?.addEventListener("click", () => n.close()),
                document
                  .getElementById("es-save")
                  ?.addEventListener("click", async () => {
                    const a = document.getElementById("es-fname").value.trim(),
                      l = document.getElementById("es-lname").value.trim(),
                      s = document.getElementById("es-error");
                    if (!a || !l)
                      return (
                        (s.textContent = "Nome e cognome sono obbligatori"),
                        void s.classList.remove("hidden")
                      );
                    const modalBody = document.getElementById("es-fname").closest(".fusion-modal");
                    const checkedTeams = modalBody ? Array.from(modalBody.querySelectorAll('input[name="es-teams"]:checked')).map(el => el.value) : [];
                    console.log("Saving staff with teams:", checkedTeams);
                    const i = document.getElementById("es-save");
                    ((i.disabled = !0), (i.textContent = "Salvataggio..."));
                    try {
                      (await Store.api("update", "staff", {
                        id: e.id,
                        first_name: a,
                        last_name: l,
                        role: document.getElementById("es-role").value || null,
                        birth_date:
                          document.getElementById("es-birth").value || null,
                        birth_place:
                          document.getElementById("es-birthplace").value ||
                          null,
                        residence_address:
                          document.getElementById("es-resaddr").value || null,
                        residence_city:
                          document.getElementById("es-rescity").value || null,
                        phone:
                          document.getElementById("es-phone").value || null,
                        email:
                          document.getElementById("es-email").value || null,
                        fiscal_code:
                          document
                            .getElementById("es-fiscal")
                            .value?.toUpperCase() || null,
                        identity_document:
                          document.getElementById("es-doc").value || null,
                        medical_cert_expires_at:
                          document.getElementById("es-medcert").value || null,
                        notes:
                          document.getElementById("es-notes").value || null,
                        team_ids: checkedTeams,
                      }),
                        n.close(),
                        UI.toast("Membro staff aggiornato", "success"),
                        Store.invalidate("list/staff"),
                        Store.invalidate("get/staff"),
                        (t = await Store.get("list", "staff").catch(() => t)),
                        o(e.id));
                    } catch (e) {
                      ((s.textContent = e.message),
                        s.classList.remove("hidden"),
                        (i.disabled = !1),
                        (i.textContent = "SALVA MODIFICHE"));
                    }
                  }));
            })(d),
          { signal: e.signal },
        ),
        document.getElementById("staff-delete-btn")?.addEventListener(
          "click",
          () =>
            (function (e) {
              const a = UI.modal({
                title: "Elimina Membro Staff",
                body: `<p style="font-size:14px;line-height:1.6;">Sei sicuro di voler eliminare <strong>${Utils.escapeHtml(e.full_name)}</strong>? L'operazione non è reversibile.</p>`,
                footer:
                  '\n                <button class="btn btn-ghost btn-sm" id="del-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="del-confirm" type="button" style="background:var(--color-pink);border-color:var(--color-pink);">ELIMINA</button>\n            ',
              });
              (document
                .getElementById("del-cancel")
                ?.addEventListener("click", () => a.close()),
                document
                  .getElementById("del-confirm")
                  ?.addEventListener("click", async () => {
                    try {
                      (await Store.api("delete", "staff", { id: e.id }),
                        a.close(),
                        UI.toast("Membro staff eliminato", "success"),
                        (n = null),
                        (t = await Store.get("list", "staff").catch(() => t)),
                        i());
                    } catch (e) {
                      UI.toast("Errore: " + e.message, "error");
                    }
                  }));
            })(d),
          { signal: e.signal },
        ));
    } catch (e) {
      r.innerHTML = Utils.emptyState("Errore caricamento", e.message);
    }
  }
  return {
    destroy() {
      (e.abort(), (e = new AbortController()));
    },
    async init() {
      const e = document.getElementById("app");
      if (e) {
        (UI.loading(!0), (e.innerHTML = UI.skeletonPage()));
        try {
          (([t, globalTeamsList] = await Promise.all([Store.get("list", "staff"), Store.get("teams", "athletes").catch(() => [])])), (n = null), i());
        } catch (t) {
          ((e.innerHTML = Utils.emptyState(
            "Errore caricamento staff",
            t.message,
          )),
            UI.toast("Errore caricamento staff", "error"));
        } finally {
          UI.loading(!1);
        }
      }
    },
  };
})();
window.Staff = Staff;
