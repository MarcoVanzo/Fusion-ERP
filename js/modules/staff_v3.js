"use strict";
const Staff = (() => {
  let e = new AbortController(),
    t = [],
    a = [],
    n = null;
  const l = [
    "#f472b6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#0ea5e9",
  ];
  function s(e) {
    if (!e) return l[0];
    let t = 0;
    for (let a = 0; a < e.length; a++) t = e.charCodeAt(a) + ((t << 5) - t);
    return l[Math.abs(t) % l.length];
  }
  function i(e, t) {
    let a = (e || "").toUpperCase();
    return a.match(/^U\d+$/)
      ? a.replace("U", "Under ")
      : a
        ? e + " — " + t
        : t || "";
  }
  function o(e, t, a) {
    const n = a || "var(--color-white)";
    return `\n <div style="display:flex;flex-direction:column;gap:2px;">\n <span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">${Utils.escapeHtml(e)}</span>\n <span style="font-size:14px;font-weight:500;color:${n};">${t ? Utils.escapeHtml(String(t)) : '<span style="color:var(--color-text-muted);">—</span>'}</span>\n </div>`;
  }
  function r() {
    const n = document.getElementById("app");
    if (!n) return;
    const l = App.getUser(),
      o = ["admin", "manager", "operator"].includes(l?.role),
      c = [...new Set(t.map((e) => e.role).filter(Boolean))].sort();
    ((n.innerHTML = `\n <div class="transport-dashboard"><div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;"><div><h1 class="dash-title">Gestione <span style="color:var(--accent-pink);">Staff</span></h1><p class="dash-subtitle">${t.length} membro${1 !== t.length ? "i" : ""} nel sistema</p></div><div style="display:flex;gap:12px; flex-wrap:wrap; align-items:center;"><div class="input-wrapper" style="position:relative;min-width:220px;"><i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.4);font-size:16px;"></i><input type="text" id="staff-search" class="form-input" placeholder="Cerca membro staff..." style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;"></div> ${o ? '<button class="btn-dash pink" id="new-staff-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO MEMBRO</button>' : ""} </div></div><div class="dash-filters" id="staff-role-filter" style="margin-bottom:24px;">\n <button class="dash-filter active" data-role="" type="button">Tutti</button>\n ${c.map((e) =>`<button class="dash-filter" data-role="${Utils.escapeHtml(e.toLowerCase())}" type="button">${Utils.escapeHtml(e)}</button>`).join("")}\n </div>\n\n <div class="dash-stat-grid" id="staff-grid">\n ${ 0 === t.length ? Utils.emptyState( "Nessun membro staff", "Aggiungi il primo membro con il pulsante in alto.", ) : t .map((e) => (function (e) { const t = s(e.full_name), n = Utils.initials(e.full_name), l = new Date(), o = e.medical_cert_expires_at && new Date(e.medical_cert_expires_at) < l, r = e.team_names || (e.team_season_ids && e.team_season_ids.length > 0 ? e.team_season_ids .map((e) => { const t = a.find((t) => String(t.id) === String(e)); return t ? i(t.category, t.name) : ""; }) .filter(Boolean) .join(", ") : ""); return`\n        <div class="dash-stat-card" style="cursor:pointer;position:relative;overflow:hidden;padding:16px;" data-staff-id="${Utils.escapeHtml(e.id)}"\n             data-name="${Utils.escapeHtml((e.full_name || "").toLowerCase())}"\n             data-role="${Utils.escapeHtml((e.role || "").toLowerCase())}">\n            ${o ? '<div style="position:absolute;top:var(--sp-2);right:var(--sp-2);width:8px;height:8px;border-radius:50%;background:var(--color-pink);box-shadow:0 0 6px var(--color-pink);"></div>' : ""}\n            <div style="display:flex;align-items:flex-start;gap:var(--sp-2);">\n                <div style="width:48px;height:48px;background:${t};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-display);font-weight:700;font-size:1.3rem;color:#000;border-radius:8px;position:relative;overflow:hidden;">\n                    ${e.photo_path ? `<img src="${e.photo_path}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;">` : ""}\n                    ${Utils.escapeHtml(n)}\n                </div>\n                <div style="overflow:hidden;flex:1;">\n                    <div style="font-family:var(--font-display);font-weight:700;font-size:1.1rem;">${Utils.escapeHtml(e.full_name)}</div>\n                    <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(e.role || "—")}</div>\n                    <div style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(r)}</div>\n                    ${e.phone ? `<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;"><i class="ph ph-phone" style="font-size:11px;"></i> ${Utils.escapeHtml(e.phone)}</div>` : ""}\n                </div>\n            </div>\n        </div>`; })(e), ) .join("") }\n </div></div>\n`),
      document.getElementById("staff-search")?.addEventListener(
        "input",
        (e) => {
          const t = e.target.value.trim().toLowerCase();
          document.querySelectorAll("[data-staff-id]").forEach((e) => {
            const a =
              (e.dataset.name || "").includes(t) ||
              (e.dataset.role || "").includes(t);
            e.style.display = a ? "" : "none";
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
        t.addEventListener("click", () => d(t.dataset.staffId), {
          signal: e.signal,
        });
      }),
      document.getElementById("new-staff-btn")?.addEventListener(
        "click",
        () =>
          (function () {
            const n = a
                .map(
                  (e) =>
                    `<label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="ns-teams" value="${Utils.escapeHtml(e.id)}" class="form-checkbox"> ${Utils.escapeHtml(i(e.category, e.name))}${e.season ? " — " + Utils.escapeHtml(e.season) : ""}</label>`,
                )
                .join(""),
              l = ["Dati Personali", "Contatti & Documenti"];
            let s = 1;
            const o = {},
              d = [
                `<div class="form-grid">\n <div class="form-group"><label class="form-label" for="ns-fname">Nome *</label><input id="ns-fname" class="form-input" type="text" placeholder="Marco" required></div>\n <div class="form-group"><label class="form-label" for="ns-lname">Cognome *</label><input id="ns-lname" class="form-input" type="text" placeholder="Rossi" required></div>\n </div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="ns-role">Ruolo / Qualifica</label>\n <select id="ns-role" class="form-select">\n <option value="">Seleziona...</option>\n <option>Primo Allenatore</option><option>Secondo Allenatore</option><option>Preparatore Atletico</option>\n <option>Medico</option><option>Fisioterapista</option><option>Segreteria</option><option>Direttore Tecnico</option><option>Dirigente</option><option>Addetta Stampa</option><option>Altro</option>\n </select>\n </div>\n <div class="form-group"><label class="form-label" for="ns-birth">Data di Nascita</label><input id="ns-birth" class="form-input" type="date"></div>\n </div>\n <div class="form-group"><label class="form-label">Squadre (Opzionale)</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">${n}</div></div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="ns-birthplace">Luogo di Nascita</label><input id="ns-birthplace" class="form-input" type="text" placeholder="Roma"></div>\n <div class="form-group"><label class="form-label" for="ns-rescity">Città di Residenza</label><input id="ns-rescity" class="form-input" type="text" placeholder="Milano"></div>\n </div>`,
                '<div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-phone">Cellulare</label><input id="ns-phone" class="form-input" type="tel" placeholder="+39 333 1234567"></div>\n                <div class="form-group"><label class="form-label" for="ns-email">E-Mail</label><input id="ns-email" class="form-input" type="email" placeholder="nome@email.com"></div>\n            </div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-fiscal">Codice Fiscale</label><input id="ns-fiscal" class="form-input" type="text" placeholder="RSSMRC90A01H501Z" maxlength="16" style="text-transform:uppercase;"></div>\n                <div class="form-group"><label class="form-label" for="ns-doc">Documento d\'Identità</label><input id="ns-doc" class="form-input" type="text" placeholder="CI / Passaporto"></div>\n            </div>\n            <div class="form-grid">\n                <div class="form-group"><label class="form-label" for="ns-medcert">Scadenza Cert. Medico</label><input id="ns-medcert" class="form-input" type="date"></div>\n            </div>\n            <div class="form-group"><label class="form-label" for="ns-notes">Note</label><textarea id="ns-notes" class="form-input" rows="2" placeholder="Note aggiuntive..." style="resize:vertical;"></textarea></div>',
              ],
              c = () => {
                document
                  .querySelectorAll(
                    "#staff-wizard-body input:not([type=checkbox]), #staff-wizard-body select, #staff-wizard-body textarea",
                  )
                  .forEach((e) => {
                    o[e.id] = e.value;
                  });
                const e = Array.from(
                  document.querySelectorAll(
                    '#staff-wizard-body input[name="ns-teams"]:checked',
                  ),
                ).map((e) => e.value);
                (e.length > 0 || o["ns-teams-touched"]) &&
                  ((o["ns-teams"] = e), (o["ns-teams-touched"] = !0));
              },
              p = () => {
                const e = document.getElementById("staff-wizard-body");
                if (!e) return;
                ((e.innerHTML = `\n <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">\n ${[1, 2].map((e) =>`\n                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">\n                            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;\n                                ${e < s ? "background:var(--color-success);color:#000;" : e === s ? "background:var(--color-pink);color:#fff;" : "background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);"}">\n                                ${e < s ? "✓" : e}\n                            </div>\n                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;color:${e === s ? "var(--color-white)" : "rgba(255,255,255,0.35)"};">${l[e - 1]}</div>\n                        </div>\n                        ${e < 2 ? `<div style="flex:0.5;height:2px;background:${e < s ? "var(--color-success)" : "rgba(255,255,255,0.1)"};margin-bottom:20px;"></div>` : ""}\n                    `).join("")}\n </div>\n <div id="ns-step-content">${d[s - 1]}</div>\n <div id="ns-error" class="form-error hidden"></div>\n`),
                  requestAnimationFrame(() => {
                    (Object.entries(o).forEach(([e, t]) => {
                      if ("ns-teams" === e || "ns-teams-touched" === e) return;
                      const a = document.getElementById(e);
                      a && (a.value = t);
                    }),
                      o["ns-teams"] &&
                        o["ns-teams"].forEach((e) => {
                          const t = document.querySelector(
                            `#staff-wizard-body input[name="ns-teams"][value="${e}"]`,
                          );
                          t && (t.checked = !0);
                        }));
                  }));
                const t = document.getElementById("ns-prev"),
                  a = document.getElementById("ns-next"),
                  n = document.getElementById("ns-save");
                (t && (t.style.display = 1 === s ? "none" : ""),
                  a && (a.style.display = 2 === s ? "none" : ""),
                  n && (n.style.display = 2 === s ? "" : "none"));
              },
              m = UI.modal({
                title: "Nuovo Membro Staff",
                body: '<div id="staff-wizard-body"></div>',
                footer:
                  '\n                <button class="btn btn-ghost btn-sm" id="ns-cancel" type="button">Annulla</button>\n                <button class="btn btn-default btn-sm" id="ns-prev" type="button" style="display:none;"><i class="ph ph-arrow-left"></i> Indietro</button>\n                <button class="btn btn-primary btn-sm" id="ns-next" type="button">Avanti <i class="ph ph-arrow-right"></i></button>\n                <button class="btn btn-primary btn-sm" id="ns-save" type="button" style="display:none;">CREA MEMBRO</button>\n            ',
              });
            (p(),
              document
                .getElementById("ns-cancel")
                ?.addEventListener("click", () => m.close(), {
                  signal: e.signal,
                }),
              document.getElementById("ns-prev")?.addEventListener(
                "click",
                () => {
                  (c(), s > 1 && (s--, p()));
                },
                { signal: e.signal },
              ),
              document.getElementById("ns-next")?.addEventListener(
                "click",
                () => {
                  if (1 === s) {
                    const e = document.getElementById("ns-fname")?.value.trim(),
                      t = document.getElementById("ns-lname")?.value.trim(),
                      a = document.getElementById("ns-error");
                    if (!e || !t)
                      return (
                        (a.textContent = "Nome e cognome sono obbligatori"),
                        void a.classList.remove("hidden")
                      );
                  }
                  (c(), s < 2 && (s++, p()));
                },
                { signal: e.signal },
              ),
              document.getElementById("ns-save")?.addEventListener(
                "click",
                async () => {
                  c();
                  const e = document.getElementById("ns-error"),
                    a = document.getElementById("ns-save");
                  ((a.disabled = !0), (a.textContent = "Creazione..."));
                  try {
                    (await Store.api("create", "staff", {
                      first_name: o["ns-fname"] || "",
                      last_name: o["ns-lname"] || "",
                      role: o["ns-role"] || null,
                      birth_date: o["ns-birth"] || null,
                      birth_place: o["ns-birthplace"] || null,
                      residence_city: o["ns-rescity"] || null,
                      phone: o["ns-phone"] || null,
                      email: o["ns-email"] || null,
                      fiscal_code: (o["ns-fiscal"] || "").toUpperCase() || null,
                      identity_document: o["ns-doc"] || null,
                      medical_cert_expires_at: o["ns-medcert"] || null,
                      notes: o["ns-notes"] || null,
                      team_ids: o["ns-teams"] || [],
                    }),
                      m.close(),
                      UI.toast("Membro staff creato", "success"),
                      (t = await Store.get("list", "staff").catch(() => t)),
                      r());
                  } catch (t) {
                    ((e.textContent = t.message),
                      e.classList.remove("hidden"),
                      (a.disabled = !1),
                      (a.textContent = "CREA MEMBRO"));
                  }
                },
                { signal: e.signal },
              ));
          })(),
        { signal: e.signal },
      ));
  }
  async function d(l) {
    n = l;
    const c = document.getElementById("app");
    c.innerHTML = UI.skeletonPage();
    try {
      const p = await Store.get("get", "staff", { id: l }),
        m = App.getUser(),
        f = ["admin", "manager", "operator"].includes(m?.role),
        u = (s(p.full_name), new Date()),
        b =
          p.medical_cert_expires_at && new Date(p.medical_cert_expires_at) < u,
        v =
          p.team_names ||
          (p.team_season_ids && p.team_season_ids.length > 0
            ? p.team_season_ids
                .map((e) => {
                  const t = a.find((t) => t.id === e);
                  return t ? i(t.category, t.name) : "";
                })
                .filter(Boolean)
                .join(", ")
            : "");
      ((c.innerHTML = ` <div class="transport-dashboard" style="min-height:100vh;"><!-- BREADCRUMB NAV --><div style="display:flex;align-items:center;gap:var(--sp-2);padding:0 var(--sp-4);"><button class="btn btn-ghost btn-sm" id="staff-back" style="color:var(--color-text-muted);border:none;padding:0;display:flex;align-items:center;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;" type="button"><i class="ph ph-arrow-left" style="font-size:16px;"></i> Staff </button><div style="flex:1;"></div> ${f ? '<button class="btn btn-primary btn-sm" id="staff-edit-btn" type="button" style="margin-right:8px;"><i class="ph ph-pencil-simple"></i> MODIFICA</button>' : ""} ${f ? '<button class="btn btn-default btn-sm" id="staff-delete-btn" type="button" style="color:var(--color-pink);border-color:rgba(255,0,122,0.3);"><i class="ph ph-trash"></i></button>' : ""} </div><!-- HEADER STAFF --><div style="display:flex; align-items:center; gap:var(--sp-4); padding:0 var(--sp-4); margin-top:var(--sp-2);"><div style="display:flex; flex-direction:column;"><h2 style="font-size:2.5rem; font-weight:800; margin:0; line-height:1.1; font-family:var(--font-display); text-transform:uppercase; letter-spacing:-0.5px;">${Utils.escapeHtml(p.first_name || "")} <span style="font-weight:300; color:var(--color-text-muted);">${Utils.escapeHtml(p.last_name || "")}</span></h2><div style="font-size:15px; color:var(--color-white); margin-top:8px; display:flex; gap:12px; align-items:center;"> ${p.role ?`<span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px; font-weight:600; font-size:13px; letter-spacing:0.5px; text-transform:uppercase;">${Utils.escapeHtml(p.role)}</span>`: ""} ${v ?`<span style="color:var(--color-text-muted); font-weight:500;">${Utils.escapeHtml(v)}</span>`: ""} </div></div></div><!-- TAB BAR --><div style="position:relative;margin:0 calc(var(--sp-4) * -1);padding:0 var(--sp-4);border-bottom:1px solid var(--color-border);margin-bottom:var(--sp-4);"><div id="staff-tab-bar" class="fusion-tabs-container" style="display:flex;gap:0;overflow-x:auto;scrollbar-width:none;position:relative;z-index:2;padding-bottom:1px;"><button class="athlete-tab-btn fusion-tab active" data-stab="anagrafica" type="button" style="flex-shrink:0;white-space:nowrap;"><i class="ph ph-identification-card"></i> Anagrafica </button><button class="athlete-tab-btn fusion-tab" data-stab="documenti" type="button" style="flex-shrink:0;white-space:nowrap;"><i class="ph ph-file-text"></i> Documenti </button></div><div id="tab-scroll-indicator" style="position:absolute;top:0;right:0;bottom:0;width:48px;background:linear-gradient(to left, var(--color-black) 20%, transparent 100%);pointer-events:none;z-index:3;transition:opacity 0.3s;opacity:0.8;"></div></div><!-- TAB: ANAGRAFICA --><div id="stab-panel-anagrafica" class="athlete-tab-panel" style="display:flex;flex-direction:column;gap:var(--sp-4);padding:0 var(--sp-4);"><div style="display:flex;flex-direction:row;align-items:flex-start;gap:var(--sp-4);"><!-- FOTO PERSONALE --><div style="width:280px;flex-shrink:0;"><p class="section-label" style="text-align:center;">Foto Personale</p><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-3);"><div id="staff-photo-preview" style="width:240px;height:240px;border-radius:16px;overflow:hidden;flex-shrink:0;border:2px solid var(--color-border);background:${s(p.full_name)};display:flex;align-items:center;justify-content:center;"> ${p.photo_path ?`<img src="${Utils.escapeHtml(p.photo_path)}" alt="Foto staff" style="width:100%;height:100%;object-fit:cover;object-position:center">`:`<span style="font-family:var(--font-display);font-size:4.5rem;font-weight:700;color:#000;">${Utils.initials(p.full_name)}</span>`} </div><div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;"><div style="font-size:13px;color:var(--color-text-muted);text-align:center;"> ${p.photo_path ? "Foto caricata" : "Nessuna foto caricata"} </div> ${ f ?`
                      <label for="staff-photo-upload" class="btn btn-default btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:100%;justify-content:center;">
                        <i class="ph ph-camera"></i> ${p.photo_path ? "Cambia foto" : "Carica foto"}
                      </label>
                      <input id="staff-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" data-staff-id="${p.id}">
                      <div id="staff-photo-status" style="font-size:12px;color:var(--color-text-muted);text-align:center;"></div>` : "" } </div></div></div></div><div style="flex:1;"><p class="section-label">Dati Anagrafici e Contatti</p><div class="dash-card" style="padding:var(--sp-3);"><div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3);"> ${o("Nome", p.first_name)} ${o("Cognome", p.last_name)} ${o("Ruolo / Qualifica", p.role)} ${o("Squadre", v)} ${o("Data di Nascita", p.birth_date ? Utils.formatDate(p.birth_date) : null)} ${o("Luogo di Nascita", p.birth_place)} ${o("Città di Residenza", p.residence_city)} ${o("Via di Residenza", p.residence_address)} ${o("Cellulare", p.phone)} ${o("E-Mail", p.email)} </div> ${p.notes ?`<div style="margin-top:var(--sp-2);padding-top:var(--sp-2);border-top:1px solid var(--color-border);"><span style="font-size:11px;color:var(--color-silver);text-transform:uppercase;font-weight:600;">Note</span><p style="font-size:14px;margin-top:4px;line-height:1.6;">${Utils.escapeHtml(p.notes)}</p></div>`: ""} </div></div></div><!-- DOCUMENTI (in Anagrafica) --><div><p class="section-label">Matricola e Documenti</p><div class="dash-card" style="padding:var(--sp-3);"><div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:var(--sp-3);"> ${o("Documento d'Identità", p.identity_document)} ${o("Codice Fiscale", p.fiscal_code)} ${o("Scadenza Cert. Medico", p.medical_cert_expires_at ? Utils.formatDate(p.medical_cert_expires_at) : null, b ? "var(--color-pink)" : null)} </div></div></div></div><!-- TAB: DOCUMENTI --><div id="stab-panel-documenti" class="athlete-tab-panel" style="display:none;flex-direction:column;gap:var(--sp-4);padding:0 var(--sp-4);"><div><p class="section-label">Matricola e Dati</p><div class="dash-card" style="padding:var(--sp-3);"><div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);"> ${o("Codice Fiscale", p.fiscal_code)} ${o("Documento d'Identità", p.identity_document)} ${o("Scadenza Cert. Medico", p.medical_cert_expires_at ? Utils.formatDate(p.medical_cert_expires_at) : null, b ? "var(--color-pink)" : null)} </div></div></div><div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><p class="section-label" style="margin-bottom:0;">Contratto di Collaborazione</p> ${f && p.email ?`<button class="btn btn-primary btn-sm" id="generate-contract-btn" style="font-size:11px;padding:4px 10px;">+ NUOVO</button>`: !p.email ? '<span style="font-size:11px;color:var(--color-pink);">Email mancante per contratto</span>' : ""} </div><div class="dash-card" style="padding:var(--sp-3);"> ${ !p.contract_status ? Utils.emptyState( "Nessun contratto attivo", "Genera un nuovo contratto per questo membro.", ) :`
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                          <div><span style="font-size:12px;color:var(--color-text-muted);">Stato:</span> <strong style="color:${p.contract_status === "firmato" ? "var(--color-success)" : p.contract_status === "inviato" ? "var(--color-info)" : "var(--color-white)"};text-transform:uppercase;font-size:12px;letter-spacing:1px;">${p.contract_status}</strong></div>
                          ${p.contract_signed_at ? `<div style="font-size:12px;color:var(--color-text-muted);">Firmato il: ${Utils.formatDateTime(p.contract_signed_at)}</div>` : ""}
                      </div>
                      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);padding:var(--sp-3);background:rgba(0,0,0,0.2);border-radius:6px;">
                          ${o("Valido dal", p.contract_valid_from ? Utils.formatDate(p.contract_valid_from) : null)}
                          ${o("Valido al", p.contract_valid_to ? Utils.formatDate(p.contract_valid_to) : null)}
                          ${o("Compenso mensile", p.contract_monthly_fee ? "€ " + Number(p.contract_monthly_fee).toFixed(2) : "A titolo gratuito")}
                      </div>
                      <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3);">
                          ${p.contract_status === "firmato" && p.contract_signed_pdf_path ? `<a href="api/router.php?module=staff&action=downloadContract&id=${p.id}" target="_blank" class="btn btn-default btn-sm"><i class="ph ph-download"></i> SCARICA FIRMATO</a>` : ""}
                          ${p.contract_status === "inviato" && f ? `<button class="btn btn-default btn-sm" id="check-contract-btn" data-id="${p.id}"><i class="ph ph-arrows-clockwise"></i> VERIFICA STATO</button>` : ""}
                      </div>
                      ` } </div></div><!-- ALLEGATI --><div><p class="section-label">Allegati</p><div style="display:flex;flex-direction:column;gap:var(--sp-3);"><!-- Contratto (file) --><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);"><div style="display:flex;align-items:center;gap:10px;"><i class="ph ph-file-pdf" style="font-size:24px;color:var(--color-pink);flex-shrink:0;"></i><div><div style="font-size:13px;font-weight:600;">Contratto</div><div style="font-size:11px;color:var(--color-text-muted);">${p.contract_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(p.contract_file_path.split("/").pop()) : "Nessun file caricato"}</div></div></div><div style="display:flex;gap:var(--sp-2);align-items:center;"> ${p.contract_file_path ?`<a href="api/router.php?module=staff&action=downloadDoc&field=contract_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>`: ""} ${ f ?`<button class="btn btn-primary btn-sm" id="upload-contract-file-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                                  <input type="file" id="upload-contract-file-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : "" } </div></div></div><!-- CI Fronte --><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);"><div style="display:flex;align-items:center;gap:10px;"><i class="ph ph-identification-badge" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i><div><div style="font-size:13px;font-weight:600;">CI Fronte</div><div style="font-size:11px;color:var(--color-text-muted);">${p.id_doc_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(p.id_doc_file_path.split("/").pop()) : "Nessun file caricato"}</div></div></div><div style="display:flex;gap:var(--sp-2);align-items:center;"> ${p.id_doc_file_path ?`<a href="api/router.php?module=staff&action=downloadDoc&field=id_doc_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>`: ""} ${ f ?`<button class="btn btn-primary btn-sm" id="upload-id-doc-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                                  <input type="file" id="upload-id-doc-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : "" } </div></div></div><!-- CI Retro --><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);"><div style="display:flex;align-items:center;gap:10px;"><i class="ph ph-identification-card" style="font-size:24px;color:var(--color-info);flex-shrink:0;"></i><div><div style="font-size:13px;font-weight:600;">CI Retro</div><div style="font-size:11px;color:var(--color-text-muted);">${p.id_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(p.id_doc_back_file_path.split("/").pop()) : "Nessun file caricato"}</div></div></div><div style="display:flex;gap:var(--sp-2);align-items:center;"> ${p.id_doc_back_file_path ?`<a href="api/router.php?module=staff&action=downloadDoc&field=id_doc_back_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>`: ""} ${ f ?`<button class="btn btn-primary btn-sm" id="upload-id-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                                  <input type="file" id="upload-id-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : "" } </div></div></div><!-- CF Fronte --><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);"><div style="display:flex;align-items:center;gap:10px;"><i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i><div><div style="font-size:13px;font-weight:600;">CF Fronte</div><div style="font-size:11px;color:var(--color-text-muted);">${p.cf_doc_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(p.cf_doc_file_path.split("/").pop()) : "Nessun file caricato"}</div></div></div><div style="display:flex;gap:var(--sp-2);align-items:center;"> ${p.cf_doc_file_path ?`<a href="api/router.php?module=staff&action=downloadDoc&field=cf_doc_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>`: ""} ${ f ?`<button class="btn btn-primary btn-sm" id="upload-cf-doc-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                                  <input type="file" id="upload-cf-doc-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : "" } </div></div></div><!-- CF Retro --><div class="dash-card" style="padding:var(--sp-3);"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);"><div style="display:flex;align-items:center;gap:10px;"><i class="ph ph-credit-card" style="font-size:24px;color:var(--color-success);flex-shrink:0;"></i><div><div style="font-size:13px;font-weight:600;">CF Retro</div><div style="font-size:11px;color:var(--color-text-muted);">${p.cf_doc_back_file_path ? '<i class="ph ph-check-circle" style="color:var(--color-success);"></i> ' + Utils.escapeHtml(p.cf_doc_back_file_path.split("/").pop()) : "Nessun file caricato"}</div></div></div><div style="display:flex;gap:var(--sp-2);align-items:center;"> ${p.cf_doc_back_file_path ?`<a href="api/router.php?module=staff&action=downloadDoc&field=cf_doc_back_file_path&id=${p.id}" target="_blank" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-arrow-square-out"></i> Apri</a>`: ""} ${ f ?`<button class="btn btn-primary btn-sm" id="upload-cf-doc-back-btn" type="button" style="display:inline-flex;align-items:center;gap:6px;"><i class="ph ph-upload-simple"></i> Carica</button>
                                  <input type="file" id="upload-cf-doc-back-input" accept=".pdf,image/jpeg,image/png,image/webp" style="display:none;">` : "" } </div></div></div></div></div></div></div> `),
        document.querySelectorAll("[data-stab]").forEach((t) => {
          t.addEventListener(
            "click",
            () => {
              const e = t.dataset.stab;
              (document.querySelectorAll("[data-stab]").forEach((t) => {
                t.dataset.stab === e
                  ? t.classList.add("active")
                  : t.classList.remove("active");
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
        // Add overlay photo upload events connected to the new inline Anagrafica layout
        (() => {
          const fileInput = document.getElementById("staff-photo-upload");
          const previewLabel = document.querySelector(
            'label[for="staff-photo-upload"]',
          );
          if (fileInput) {
            fileInput.addEventListener(
              "change",
              async (ev) => {
                const file = ev.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("id", p.id);
                formData.append("file", file);

                const statusText =
                  document.getElementById("staff-photo-status");
                if (statusText)
                  statusText.textContent = "Caricamento in corso...";
                if (previewLabel) previewLabel.style.opacity = "0.5";

                try {
                  const response = await fetch(
                    "api/router.php?module=staff&action=uploadPhoto",
                    {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "X-Requested-With": "XMLHttpRequest" },
                      body: formData,
                    },
                  );
                  const res = await response.json();
                  if (!response.ok || !res.success)
                    throw new Error(res.error || "Errore di caricamento");

                  UI.toast("Foto aggiornata con successo", "success");
                  Store.invalidate("list", "staff");
                  Store.invalidate("get", "staff");
                  d(p.id); // reload
                } catch (err) {
                  UI.toast(err.message, "error");
                  if (statusText)
                    statusText.textContent = "Errore: " + err.message;
                } finally {
                  if (previewLabel) previewLabel.style.opacity = "";
                }
              },
              { signal: e.signal },
            );
          }
        })(),
        // Contract Generation
        document.getElementById("generate-contract-btn")?.addEventListener(
          "click",
          () => {
            const m = UI.modal({
              title: "Genera Contratto di Collaborazione",
              body: ` <div class="form-grid"><div class="form-group"><label class="form-label" for="cg-from">Valido dal *</label><input type="date" id="cg-from" class="form-input" required></div><div class="form-group"><label class="form-label" for="cg-to">Valido al *</label><input type="date" id="cg-to" class="form-input" required></div></div><div class="form-group"><label class="form-label" for="cg-fee">Compenso Mensile (€) (Opzionale)</label><input type="number" id="cg-fee" step="0.01" class="form-input" placeholder="Es. 150.00"></div><div id="cg-error" class="form-error hidden"></div> `,
              footer: ` <button class="btn btn-ghost btn-sm" id="cg-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="cg-save" type="button">GENERA E INVIA</button> `,
            });

            document
              .getElementById("cg-cancel")
              .addEventListener("click", () => m.close());
            document
              .getElementById("cg-save")
              .addEventListener("click", async () => {
                const from = document.getElementById("cg-from").value;
                const to = document.getElementById("cg-to").value;
                const fee = document.getElementById("cg-fee").value || null;
                const err = document.getElementById("cg-error");
                const btn = document.getElementById("cg-save");

                if (!from || !to) {
                  err.textContent = "Data di inizio e fine obbligatorie";
                  err.classList.remove("hidden");
                  return;
                }

                btn.disabled = true;
                btn.textContent = "Generazione...";

                try {
                  await Store.api("generateContract", "staff", {
                    staff_id: p.id,
                    valid_from: from,
                    valid_to: to,
                    monthly_fee: fee,
                  });
                  m.close();
                  UI.toast("Contratto generato e inviato!", "success");
                  Store.invalidate("list", "staff");
                  Store.invalidate("get", "staff");
                  d(p.id);
                } catch (errApi) {
                  err.textContent = errApi.message;
                  err.classList.remove("hidden");
                  btn.disabled = false;
                  btn.textContent = "GENERA E INVIA";
                }
              });
          },
          { signal: e.signal },
        ),
        // Contract Status check
        document.getElementById("check-contract-btn")?.addEventListener(
          "click",
          async (ev) => {
            const btn = ev.target.closest("button");
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> VERIFICA...';
            try {
              const res = await Store.api("checkContractStatus", "staff", {
                id: p.id,
              });
              UI.toast(
                res.signed
                  ? "Contratto firmato!"
                  : "Ancora in attesa di firma.",
                res.signed ? "success" : "info",
              );
              if (res.signed) {
                Store.invalidate("list", "staff");
                Store.invalidate("get", "staff");
                d(p.id);
              } else {
                btn.disabled = false;
                btn.innerHTML =
                  '<i class="ph ph-arrows-clockwise"></i> VERIFICA STATO';
              }
            } catch (err) {
              UI.toast(err.message, "error");
              btn.disabled = false;
              btn.innerHTML =
                '<i class="ph ph-arrows-clockwise"></i> VERIFICA STATO';
            }
          },
          { signal: e.signal },
        ),
        // Document Upload Handlers
        [
          "contract-file",
          "id-doc",
          "id-doc-back",
          "cf-doc",
          "cf-doc-back",
        ].forEach((type) => {
          const btn = document.getElementById(`upload-${type}-btn`);
          const input = document.getElementById(`upload-${type}-input`);
          if (btn && input) {
            btn.addEventListener("click", () => input.click());
            input.addEventListener(
              "change",
              async (ev) => {
                const file = ev.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("id", p.id);
                formData.append("file", file);

                let action = "";
                if (type === "contract-file") action = "uploadContractFile";
                else if (type === "id-doc") action = "uploadIdDoc";
                else if (type === "id-doc-back") action = "uploadIdDocBack";
                else if (type === "cf-doc") action = "uploadCfDoc";
                else if (type === "cf-doc-back") action = "uploadCfDocBack";

                UI.toast("Caricamento documento...", "info");
                try {
                  const response = await fetch(
                    `api/router.php?module=staff&action=${action}`,
                    {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "X-Requested-With": "XMLHttpRequest" },
                      body: formData,
                    },
                  );
                  const res = await response.json();
                  if (!response.ok || !res.success)
                    throw new Error(res.error || "Errore di caricamento");

                  UI.toast("Documento caricato con successo", "success");
                  Store.invalidate("list", "staff");
                  Store.invalidate("get", "staff");
                  d(p.id); // reload
                } catch (err) {
                  UI.toast(err.message, "error");
                }
              },
              { signal: e.signal },
            );
          }
        }),
        document.getElementById("staff-back")?.addEventListener(
          "click",
          () => {
            ((n = null), r());
          },
          { signal: e.signal },
        ),
        document.getElementById("staff-edit-btn")?.addEventListener(
          "click",
          () =>
            (function (e) {
              const n = a
                  .map(
                    (t) =>
                      `<label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" name="es-teams" value="${Utils.escapeHtml(String(t.id))}" class="form-checkbox" ${(e.team_season_ids || []).map(String).includes(String(t.id)) ? "checked" : ""}> ${Utils.escapeHtml(i(t.category, t.name))}${t.season ? " — " + Utils.escapeHtml(t.season) : ""}</label>`,
                  )
                  .join(""),
                l = UI.modal({
                  title: "Modifica Membro Staff",
                  body: `\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-fname">Nome *</label><input id="es-fname" class="form-input" type="text" value="${Utils.escapeHtml(e.first_name || "")}" required></div>\n <div class="form-group"><label class="form-label" for="es-lname">Cognome *</label><input id="es-lname" class="form-input" type="text" value="${Utils.escapeHtml(e.last_name || "")}" required></div>\n </div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-role">Ruolo / Qualifica</label>\n <select id="es-role" class="form-select">\n <option value="">Seleziona...</option>\n ${["Primo Allenatore", "Secondo Allenatore", "Preparatore Atletico", "Medico", "Fisioterapista", "Segreteria", "Direttore Tecnico", "Dirigente", "Addetta Stampa", "Altro"].map((t) =>`<option ${e.role === t ? "selected" : ""}>${t}</option>`).join("")}\n </select>\n </div>\n <div class="form-group"><label class="form-label" for="es-birth">Data di Nascita</label><input id="es-birth" class="form-input" type="date" value="${e.birth_date ? e.birth_date.substring(0, 10) : ""}"></div>\n </div>\n <div class="form-group"><label class="form-label">Squadre (Opzionale)</label><div id="es-teams-wrapper" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:120px;overflow-y:auto;padding:8px;border:1px solid var(--color-border);border-radius:6px;background:rgba(0,0,0,0.2);">${n}</div></div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-birthplace">Luogo di Nascita</label><input id="es-birthplace" class="form-input" type="text" value="${Utils.escapeHtml(e.birth_place || "")}"></div>\n <div class="form-group"><label class="form-label" for="es-rescity">Città di Residenza</label><input id="es-rescity" class="form-input" type="text" value="${Utils.escapeHtml(e.residence_city || "")}"></div>\n </div>\n <div class="form-group"><label class="form-label" for="es-resaddr">Via di Residenza</label><input id="es-resaddr" class="form-input" type="text" value="${Utils.escapeHtml(e.residence_address || "")}"></div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-phone">Cellulare</label><input id="es-phone" class="form-input" type="tel" value="${Utils.escapeHtml(e.phone || "")}"></div>\n <div class="form-group"><label class="form-label" for="es-email">E-Mail</label><input id="es-email" class="form-input" type="email" value="${Utils.escapeHtml(e.email || "")}"></div>\n </div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-fiscal">Codice Fiscale</label><input id="es-fiscal" class="form-input" type="text" value="${Utils.escapeHtml(e.fiscal_code || "")}" maxlength="16" style="text-transform:uppercase;"></div>\n <div class="form-group"><label class="form-label" for="es-doc">Documento d'Identità</label><input id="es-doc" class="form-input" type="text" value="${Utils.escapeHtml(e.identity_document || "")}"></div>\n </div>\n <div class="form-grid">\n <div class="form-group"><label class="form-label" for="es-medcert">Scadenza Cert. Medico</label><input id="es-medcert" class="form-input" type="date" value="${e.medical_cert_expires_at ? e.medical_cert_expires_at.substring(0, 10) : ""}"></div>\n </div>\n <div class="form-group"><label class="form-label" for="es-notes">Note</label><textarea id="es-notes" class="form-input" rows="2" style="resize:vertical;">${Utils.escapeHtml(e.notes || "")}</textarea></div>\n <div id="es-error" class="form-error hidden"></div>\n`,
                  footer:
                    '\n                <button class="btn btn-ghost btn-sm" id="es-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="es-save" type="button">SALVA MODIFICHE</button>\n            ',
                });
              const performSave = async (
                showSuccessToast = true,
                closeOnSuccess = false,
              ) => {
                const a = document.getElementById("es-fname").value.trim(),
                  n = document.getElementById("es-lname").value.trim(),
                  s = document.getElementById("es-error");
                if (!a || !n) {
                  s.textContent = "Nome e cognome sono obbligatori";
                  s.classList.remove("hidden");
                  return;
                }
                const i = document.getElementById("es-teams-wrapper"),
                  o = i
                    ? Array.from(
                        i.querySelectorAll('input[name="es-teams"]:checked'),
                      ).map((e) => e.value)
                    : [];
                const r = document.getElementById("es-save");
                r.disabled = !0;
                r.textContent = "Salvataggio...";
                try {
                  await Store.api("update", "staff", {
                    id: e.id,
                    first_name: a,
                    last_name: n,
                    role: document.getElementById("es-role").value || null,
                    birth_date:
                      document.getElementById("es-birth").value || null,
                    birth_place:
                      document.getElementById("es-birthplace").value || null,
                    residence_address:
                      document.getElementById("es-resaddr").value || null,
                    residence_city:
                      document.getElementById("es-rescity").value || null,
                    phone: document.getElementById("es-phone").value || null,
                    email: document.getElementById("es-email").value || null,
                    fiscal_code:
                      document
                        .getElementById("es-fiscal")
                        .value?.toUpperCase() || null,
                    identity_document:
                      document.getElementById("es-doc").value || null,
                    medical_cert_expires_at:
                      document.getElementById("es-medcert").value || null,
                    notes: document.getElementById("es-notes").value || null,
                    team_ids: o,
                  });
                  if (showSuccessToast) {
                    UI.toast("Auto-Salvataggio completato", "success");
                    const activeEl = document.activeElement;
                    if (
                      activeEl &&
                      ["INPUT", "SELECT", "TEXTAREA"].includes(activeEl.tagName)
                    ) {
                      const originalBorder = activeEl.style.borderColor;
                      activeEl.style.borderColor = "var(--color-success)";
                      setTimeout(
                        () => (activeEl.style.borderColor = originalBorder),
                        1500,
                      );
                    }
                  }
                  Store.invalidate("list", "staff");
                  Store.invalidate("get", "staff");

                  // Aggiorna lo store t se necessario
                  t = await Store.get("list", "staff").catch(() => t);

                  if (closeOnSuccess) {
                    l.close();
                    d(e.id);
                  }
                } catch (err) {
                  s.textContent = err.message;
                  s.classList.remove("hidden");
                } finally {
                  r.disabled = !1;
                  r.textContent = "SALVA MODIFICHE";
                }
              };

              document
                .getElementById("es-cancel")
                ?.addEventListener("click", () => l.close());
              document
                .getElementById("es-save")
                ?.addEventListener("click", () => performSave(true, true));

              // Attach blur listener to all inputs in the modal body for Auto-save (T3, T5)
              setTimeout(() => {
                const modalWrapper = document
                  .getElementById("es-fname")
                  ?.closest(".fusion-modal-body");
                if (modalWrapper) {
                  modalWrapper.addEventListener("focusout", (ev) => {
                    if (
                      ["INPUT", "SELECT", "TEXTAREA"].includes(
                        ev.target.tagName,
                      )
                    ) {
                      performSave(true, false);
                    }
                  });
                }
              }, 100);
            })(p),
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
                        r());
                    } catch (e) {
                      UI.toast("Errore: " + e.message, "error");
                    }
                  }));
            })(p),
          { signal: e.signal },
        ));
    } catch (e) {
      c.innerHTML = Utils.emptyState("Errore caricamento", e.message);
    }
  }
  function renderDocumentsView() {
    const c = document.getElementById("app");
    if (!c) return;
    const today = new Date();
    const future60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const medCertStats = { expired: 0, expiring: 0, valid: 0, missing: 0 };
    const certRows = t
      .map((p) => {
        let statusHtml = "";
        let certDate = p.medical_cert_expires_at
          ? new Date(p.medical_cert_expires_at)
          : null;
        let isExpired = certDate && certDate < today;
        let isExpiring = certDate && !isExpired && certDate < future60;

        if (isExpired) {
          medCertStats.expired++;
          statusHtml = '<span class="badge badge-danger">Scaduto</span>';
        } else if (isExpiring) {
          medCertStats.expiring++;
          statusHtml = '<span class="badge badge-warning">In scadenza</span>';
        } else if (certDate) {
          medCertStats.valid++;
          statusHtml = '<span class="badge badge-success">Valido</span>';
        } else {
          medCertStats.missing++;
          statusHtml = '<span class="badge">Mancante</span>';
        }

        let contractStatusHtml = "";
        if (p.contract_status === "firmato") {
          contractStatusHtml =
            '<span class="badge badge-success">Firmato</span>';
        } else if (p.contract_status === "inviato") {
          contractStatusHtml =
            '<span class="badge badge-warning">Inviato</span>';
        } else {
          contractStatusHtml = '<span class="badge">Nessuno</span>';
        }

        return `<tr style="cursor:pointer;" data-staff-id="${Utils.escapeHtml(p.id)}"><td><strong>${Utils.escapeHtml(p.full_name)}</strong></td><td>${Utils.escapeHtml(p.role || "—")}</td><td style="color:${isExpired ? "var(--color-pink)" : isExpiring ? "var(--color-warning)" : "var(--color-text)"}"> ${certDate ? Utils.formatDate(p.medical_cert_expires_at) : '<span style="color:var(--color-text-muted)">—</span>'} </td><td>${statusHtml}</td><td>${Utils.escapeHtml(p.identity_document || "—")}</td><td>${Utils.escapeHtml(p.fiscal_code || "—")}</td><td>${contractStatusHtml}</td></tr>`;
      })
      .join("");

    c.innerHTML = ` <div class="transport-dashboard"><div class="dash-top-bar" style="border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:24px;margin-bottom:24px;"><div><h1 class="dash-title">Documenti <span style="color:var(--accent-pink);">Staff</span></h1><p class="dash-subtitle">Stato dei documenti e contratti dello staff</p></div></div><p class="section-label">Stato Certificati Medici</p><div class="dash-stat-grid" style="margin-bottom:var(--sp-4);"><div class="dash-stat-card"><span class="stat-label">Validi</span><span class="stat-value" style="color:var(--color-success)">${medCertStats.valid}</span></div><div class="dash-stat-card"><span class="stat-label">In scadenza (60gg)</span><span class="stat-value" style="color:var(--color-warning)">${medCertStats.expiring}</span></div><div class="dash-stat-card"><span class="stat-label">Scaduti o Mancanti</span><span class="stat-value" style="color:var(--color-pink)">${medCertStats.expired + medCertStats.missing}</span></div></div><div class="table-wrapper" style="background:var(--color-black);border:1px solid rgba(255,255,255,0.05);border-radius:12px;overflow:hidden;"><table class="table"><thead style="background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.05);"><tr><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Membro</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Ruolo</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Scadenza Cert. Medico</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Stato Cert.</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Doc. Identità</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Cod. Fiscale</th><th style="color:var(--color-silver);font-weight:600;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:16px;">Contratto</th></tr></thead><tbody> ${certRows.length > 0 ? certRows :`<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:var(--sp-4);">Nessun membro presente</td></tr>`} </tbody></table></div></div> `;

    document.querySelectorAll("[data-staff-id]").forEach((t) => {
      t.addEventListener("click", () => d(t.dataset.staffId), {
        signal: e.signal,
      });
    });
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
          (([t, a] = await Promise.all([
            Store.get("list", "staff"),
            Store.get("teams", "athletes").catch(() => []),
          ])),
            (n = null),
            Router.getCurrentRoute() === "staff-documents"
              ? renderDocumentsView()
              : r());
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
