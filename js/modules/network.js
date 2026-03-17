"use strict";
const Network = (() => {
  let t = new AbortController(),
    e = "collaborazioni",
    a = [],
    n = [],
    l = [],
    o = "",
    i = "";
  const s = ["club", "agenzia", "istituzione", "sponsor", "altro"],
    r = ["attivo", "scaduto", "in_rinnovo"],
    c = ["in_valutazione", "approvato", "non_idoneo", "da_ricontattare"],
    d = {
      in_valutazione: "In Valutazione",
      approvato: "Approvato",
      non_idoneo: "Non Idoneo",
      da_ricontattare: "Da Ricontattare",
    },
    p = { attivo: "Attivo", scaduto: "Scaduto", in_rinnovo: "In Rinnovo" };
  function m() {
    return { signal: t.signal };
  }
  function u(t, e = "") {
    const a = `status-badge status-badge-${CSS.escape ? CSS.escape(t) : t}`,
      n = ("col" === e ? p : d)[t] || t;
    return `<span class="${a}">${Utils.escapeHtml(n)}</span>`;
  }
  function v() {
    const t = document.getElementById("net-tab-content");
    if (!t) return;
    const a = { collaborazioni: b, prove: f, attivita: h }[e];
    a && a(t);
  }
  function b(t) {
    const e = ["admin", "manager"].includes(App.getUser()?.role),
      n = o ? a.filter((t) => t.status === o) : a;
    ((t.innerHTML = `\n            <div>\n                <div class="net-filter-bar" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">\n                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">\n                        <button class="filter-chip ${o ? "" : "active"}" data-col-status="" type="button">Tutte</button>\n                        ${r.map((t) => `\n                            <button class="filter-chip ${o === t ? "active" : ""}" data-col-status="${Utils.escapeHtml(t)}" type="button">\n                                ${Utils.escapeHtml(p[t] || t)}\n                            </button>`).join("")}\n                    </div>\n                    ${e ? '<button class="btn btn-primary btn-sm" id="net-add-col" type="button"><i class="ph ph-plus"></i> NUOVA COLLABORAZIONE</button>' : ""}\n                </div>\n                <div class="net-card-grid">\n                    ${0 === n.length ? Utils.emptyState("Nessuna collaborazione", "Aggiungi la prima collaborazione con il pulsante in alto.") : n.map((t) => `\n                            <div class="net-card" data-open-col="${Utils.escapeHtml(t.id)}">\n                                <div class="net-card-header">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        ${
                                          t.logo_path
                                            ? `<img src="${Utils.escapeHtml(t.logo_path)}" style="height:40px; width:40px; object-fit:contain; border-radius:var(--radius-sm); background:#fff; padding:2px; flex-shrink:0;">`
                                            : ""
                                        }
                                        <div class="net-card-title" style="margin:0;">${Utils.escapeHtml(
                                          t.partner_name,
                                        )}</div>
                                    </div>
                                    ${u(t.status, "col")}
                                </div>\n                                <div class="net-card-meta">\n                                    <i class="ph ph-tag" style="margin-right:4px"></i>${Utils.escapeHtml(t.partner_type || "—")}\n                                    ${t.agreement_type ? ` · <em>${Utils.escapeHtml(t.agreement_type)}</em>` : ""}\n                                </div>\n                                ${t.referent_name ? `<div class="net-card-meta"><i class="ph ph-user" style="margin-right:4px"></i>${Utils.escapeHtml(t.referent_name)}</div>` : ""}\n                                ${t.start_date || t.end_date ? `\n                                    <div class="net-card-meta">\n                                        <i class="ph ph-calendar" style="margin-right:4px"></i>\n                                        ${t.start_date || ""} → ${t.end_date || "∞"}\n                                    </div>` : ""}\n                                ${e ? `<div style="display:flex;gap:4px;margin-top:var(--sp-1)">\n                                    <button class="btn btn-default btn-sm" data-edit-col="${Utils.escapeHtml(t.id)}" type="button" onclick="event.stopPropagation()"><i class="ph ph-pencil-simple"></i></button>\n                                    <button class="btn btn-default btn-sm" data-del-col="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)" onclick="event.stopPropagation()"><i class="ph ph-trash"></i></button>\n                                </div>` : ""}\n                            </div>`).join("")}\n                </div>\n            </div>`),
      t.querySelectorAll("[data-col-status]").forEach((e) => {
        e.addEventListener(
          "click",
          () => {
            ((o = e.dataset.colStatus), b(t));
          },
          m(),
        );
      }),
      t.querySelectorAll("[data-open-col]").forEach((t) => {
        t.addEventListener(
          "click",
          (e) => {
            if (e.target.closest("button")) return;
            const n = a.find((e) => e.id === t.dataset.openCol);
            n &&
              (function (t) {
                const e = UI.modal({
                  title: Utils.escapeHtml(t.partner_name),
                  body: `\n                <div style="display:flex;flex-direction:column;gap:var(--sp-2)">\n                    <div style="display:flex;gap:var(--sp-2);align-items:center;justify-content:space-between">\n                        <div style="display:flex;gap:var(--sp-2);align-items:center">\n                            ${u(t.status, "col")}\n                            <span style="font-size:13px;color:var(--color-text-muted)">${Utils.escapeHtml(t.partner_type || "")}</span>\n                        </div>\n                        ${t.logo_path ? `<img src="${t.logo_path}" style="height:40px;object-fit:contain;border-radius:var(--radius-sm)">` : ""}\n                    </div>\n                    ${t.agreement_type ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Accordo</span><div style="font-weight:600">${Utils.escapeHtml(t.agreement_type)}</div></div>` : ""}\n                    ${t.start_date || t.end_date ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Periodo</span><div>${t.start_date || "?"} → ${t.end_date || "∞"}</div></div>` : ""}\n                    ${t.referent_name ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Referente</span><div>${Utils.escapeHtml(t.referent_name)} ${t.referent_contact ? "· " + Utils.escapeHtml(t.referent_contact) : ""}</div></div>` : ""}\n                    ${t.notes ? `<div><span style="font-size:12px;color:var(--color-text-muted)">Note</span><div style="font-size:13px">${Utils.escapeHtml(t.notes)}</div></div>` : ""}\n                    <div id="col-docs-area" style="margin-top:var(--sp-3)">\n                        <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:var(--sp-1)">Documenti Allegati</span>\n                        <div id="col-docs-list" style="font-size:13px;display:flex;flex-direction:column;gap:4px">Caricamento...</div>\n                    </div>\n                </div>`,
                  footer:
                    '<button class="btn btn-ghost btn-sm" id="cod-close" type="button">Chiudi</button>',
                });
                (Store.get("listColDocuments", "network", {
                  collaboration_id: t.id,
                })
                  .then((t) => {
                    const e = document.getElementById("col-docs-list");
                    e &&
                      (t.length
                        ? (e.innerHTML = t
                            .map(
                              (t) =>
                                `\n                    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px;background:var(--color-bg-alt);border-radius:var(--radius-sm)">\n                        <span style="display:flex;align-items:center;gap:6px">\n                            <i class="ph ph-file-text" style="color:var(--color-primary)"></i>\n                            ${Utils.escapeHtml(t.file_name)}\n                            ${t.doc_type ? `<small class="badge badge-sm">${Utils.escapeHtml(t.doc_type)}</small>` : ""}\n                        </span>\n                        <a href="api/?module=network&action=downloadColDocument&docId=${t.id}" target="_blank" class="btn btn-ghost btn-sm" style="height:24px;width:24px;padding:0"><i class="ph ph-download-simple"></i></a>\n                    </div>\n                `,
                            )
                            .join(""))
                        : (e.innerHTML =
                            '<span style="color:var(--color-text-muted);font-style:italic">Nessun documento</span>'));
                  })
                  .catch((t) => {
                    const e = document.getElementById("col-docs-list");
                    e &&
                      (e.innerHTML = `<span style="color:var(--color-pink)">Errore: ${t.message}</span>`);
                  }),
                  document
                    .getElementById("cod-close")
                    ?.addEventListener("click", () => e.close()));
              })(n);
          },
          m(),
        );
      }),
      t.querySelectorAll("[data-edit-col]").forEach((t) =>
        t.addEventListener(
          "click",
          (e) => {
            (e.stopPropagation(), g(a.find((e) => e.id === t.dataset.editCol)));
          },
          m(),
        ),
      ),
      t.querySelectorAll("[data-del-col]").forEach((t) =>
        t.addEventListener(
          "click",
          (e) => {
            (e.stopPropagation(),
              (async function (t) {
                const e = a.find((e) => e.id === t);
                if (!e) return;
                const n = UI.modal({
                  title: "Elimina Collaborazione",
                  body: `<p>Eliminare la collaborazione con <strong>${Utils.escapeHtml(e.partner_name)}</strong>?</p>`,
                  footer:
                    '<button class="btn btn-ghost btn-sm" id="dc-cancel" type="button">Annulla</button>\n                     <button class="btn btn-primary btn-sm" id="dc-confirm" type="button" style="background:var(--color-pink)">ELIMINA</button>',
                });
                (document
                  .getElementById("dc-cancel")
                  ?.addEventListener("click", () => n.close()),
                  document
                    .getElementById("dc-confirm")
                    ?.addEventListener("click", async () => {
                      try {
                        (await Store.api("deleteCollaboration", "network", {
                          id: t,
                        }),
                          (a = await Store.get(
                            "listCollaborations",
                            "network",
                          ).catch(() => a)),
                          UI.toast("Collaborazione eliminata", "success"),
                          await v(),
                          n.close());
                      } catch (t) {
                        UI.toast("Errore: " + t.message, "error");
                      }
                    }));
              })(t.dataset.delCol));
          },
          m(),
        ),
      ),
      document
        .getElementById("net-add-col")
        ?.addEventListener("click", () => g(null), m()));
  }
  function g(t) {
    const e = !!t,
      n = s
        .map(
          (e) =>
            `<option value="${e}" ${t?.partner_type === e ? "selected" : ""}>${e.charAt(0).toUpperCase() + e.slice(1)}</option>`,
        )
        .join(""),
      l = r
        .map(
          (e) =>
            `<option value="${e}" ${t?.status === e ? "selected" : ""}>${p[e] || e}</option>`,
        )
        .join(""),
      o = UI.modal({
        title: e ? "Modifica Collaborazione" : "Nuova Collaborazione",
        body: `\n                <div class="form-group">\n                    <label class="form-label" for="cl-name">Partner *</label>\n                    <input id="cl-name" class="form-input" type="text" value="${Utils.escapeHtml(t?.partner_name || "")}" placeholder="Nome club/agenzia...">\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="cl-type">Tipo</label>\n                        <select id="cl-type" class="form-select">${n}</select>\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="cl-status">Stato</label>\n                        <select id="cl-status" class="form-select">${l}</select>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="cl-agreement">Tipo accordo</label>\n                    <input id="cl-agreement" class="form-input" type="text" value="${Utils.escapeHtml(t?.agreement_type || "")}" placeholder="es. Prestito, Affiliazione…">\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="cl-start">Data Inizio</label>\n                        <input id="cl-start" class="form-input" type="date" value="${t?.start_date?.substring(0, 10) || ""}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="cl-end">Data Fine</label>\n                        <input id="cl-end" class="form-input" type="date" value="${t?.end_date?.substring(0, 10) || ""}">\n                    </div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="cl-ref-name">Referente</label>\n                        <input id="cl-ref-name" class="form-input" type="text" value="${Utils.escapeHtml(t?.referent_name || "")}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="cl-ref-contact">Contatto</label>\n                        <input id="cl-ref-contact" class="form-input" type="text" value="${Utils.escapeHtml(t?.referent_contact || "")}">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label">Media & Documenti</label>\n                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2)">\n                        <div>\n                            <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Logo Aziendale</label>\n                            <input id="cl-logo-file" class="form-input" type="file" accept="image/*">\n                        </div>\n                        <div>\n                            <label class="form-label" style="font-size:11px;color:var(--color-text-muted)">Allegato Contratto (PDF)</label>\n                            <input id="cl-contract-file" class="form-input" type="file" accept=".pdf">\n                        </div>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="cl-notes">Note</label>\n                    <textarea id="cl-notes" class="form-input" rows="2">${Utils.escapeHtml(t?.notes || "")}</textarea>\n                </div>\n                <div id="cl-error" class="form-error hidden"></div>`,
        footer: `\n                <button class="btn btn-ghost btn-sm" id="cl-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="cl-save" type="button">${e ? "SALVA" : "CREA"}</button>`,
      });
    (document
      .getElementById("cl-cancel")
      ?.addEventListener("click", () => o.close()),
      document
        .getElementById("cl-save")
        ?.addEventListener("click", async () => {
          const n = document.getElementById("cl-name")?.value.trim(),
            l = document.getElementById("cl-error");
          if (!n)
            return (
              (l.textContent = "Il nome è obbligatorio"),
              void l.classList.remove("hidden")
            );
          const i = document.getElementById("cl-save");
          ((i.disabled = !0), (i.textContent = "Salvataggio..."));
          try {
            const l = {
              partner_name: n,
              partner_type:
                document.getElementById("cl-type")?.value || "altro",
              status: document.getElementById("cl-status")?.value || "attivo",
              agreement_type:
                document.getElementById("cl-agreement")?.value || null,
              start_date: document.getElementById("cl-start")?.value || null,
              end_date: document.getElementById("cl-end")?.value || null,
              referent_name:
                document.getElementById("cl-ref-name")?.value || null,
              referent_contact:
                document.getElementById("cl-ref-contact")?.value || null,
              notes: document.getElementById("cl-notes")?.value || null,
            };
            let i = t?.id;
            e
              ? await Store.api("updateCollaboration", "network", {
                  id: t.id,
                  ...l,
                })
              : (i = (await Store.api("createCollaboration", "network", l)).id);
            const s = document.getElementById("cl-logo-file")?.files[0];
            if (s) {
              const t = new FormData();
              (t.append("collaboration_id", i),
                t.append("logo", s),
                await Store.api("uploadColLogo", "network", t));
            }
            const r = document.getElementById("cl-contract-file")?.files[0];
            if (r) {
              const t = new FormData();
              (t.append("collaboration_id", i),
                t.append("doc_type", "contratto"),
                t.append("file", r),
                await Store.api("uploadColDocument", "network", t));
            }
            ((a = await Store.get("listCollaborations", "network").catch(
              () => a,
            )),
              UI.toast(
                e ? "Collaborazione aggiornata" : "Collaborazione creata",
                "success",
              ),
              await v(),
              o.close());
          } catch (t) {
            ((l.textContent = t.message),
              l.classList.remove("hidden"),
              (i.disabled = !1),
              (i.textContent = e ? "SALVA" : "CREA"));
          }
        }));
  }
  function f(t) {
    const e = ["admin", "manager"].includes(App.getUser()?.role),
      a = i ? n.filter((t) => t.status === i) : n;
    ((t.innerHTML = `\n            <div>\n                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">\n                    <div style="display:flex;gap:var(--sp-1);flex-wrap:wrap">\n                        <button class="filter-chip ${i ? "" : "active"}" data-tr-status="" type="button">Tutti</button>\n                        ${c.map((t) => `\n                            <button class="filter-chip ${i === t ? "active" : ""}" data-tr-status="${Utils.escapeHtml(t)}" type="button">\n                                ${Utils.escapeHtml(d[t] || t)}\n                            </button>`).join("")}\n                    </div>\n                    ${e ? '<button class="btn btn-primary btn-sm" id="net-add-trial" type="button"><i class="ph ph-plus"></i> NUOVO ATLETA</button>' : ""}\n                </div>\n                <div class="table-wrapper" style="overflow-x:auto">\n                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">\n                        <thead>\n                            <tr>\n                                ${["Nome", "Provenienza", "Posizione", "Prova", "Stato", "Score", ""].map((t) => `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${t}</th>`).join("")}\n                            </tr>\n                        </thead>\n                        <tbody>\n                            ${
      0 === a.length
        ? '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta in prova</td></tr>'
        : a
            .map((t) => {
              const a = (function (t) {
                const e = parseFloat(t.avg_score || 0);
                return e ? e.toFixed(1) : null;
              })(t);
              return `<tr>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(t.full_name || t.athlete_first_name + " " + t.athlete_last_name)}</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(t.origin_club || "—")}</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(t.position || "—")}</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${t.trial_start || "—"} → ${t.trial_end || "∞"}</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${u(t.status)}</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${
                a
                  ? (function (t) {
                      return null === t
                        ? ""
                        : `<div class="score-circle" style="--pct:${((parseFloat(t) / 10) * 100).toFixed(1)}" title="Media valutazioni">${t}</div>`;
                    })(a)
                  : '<span style="color:var(--color-text-muted);font-size:12px">—</span>'
              }</td>\n                                        <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">\n                                            ${e ? `\n                                            <button class="btn btn-ghost btn-sm" data-eval-trial="${Utils.escapeHtml(t.id)}" type="button" title="Valuta"><i class="ph ph-star"></i></button>\n                                            <button class="btn btn-ghost btn-sm" data-edit-trial="${Utils.escapeHtml(t.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>\n                                            ${t.scouting_profile_id ? `<span title="Profilo scouting: ${Utils.escapeHtml(t.scouting_profile_id)}" style="font-size:12px;color:var(--color-success)"><i class="ph ph-check-circle"></i></span>` : `<button class="btn btn-ghost btn-sm btn-convert-scouting" data-convert-trial="${Utils.escapeHtml(t.id)}" type="button" title="Converti in Scouting"><i class="ph ph-arrow-right"></i></button>`}\n                                            <button class="btn btn-ghost btn-sm" data-del-trial="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ""}\n                                        </td>\n                                    </tr>`;
            })
            .join("")
    }\n                        </tbody>\n                    </table>\n                </div>\n            </div>`),
      t.querySelectorAll("[data-tr-status]").forEach((e) =>
        e.addEventListener(
          "click",
          () => {
            ((i = e.dataset.trStatus), f(t));
          },
          m(),
        ),
      ),
      document
        .getElementById("net-add-trial")
        ?.addEventListener("click", () => y(null), m()),
      t
        .querySelectorAll("[data-edit-trial]")
        .forEach((t) =>
          t.addEventListener(
            "click",
            () => y(n.find((e) => e.id === t.dataset.editTrial)),
            m(),
          ),
        ),
      t.querySelectorAll("[data-eval-trial]").forEach((t) =>
        t.addEventListener(
          "click",
          () =>
            (function (t) {
              const e = [
                  { key: "score_technical", label: "Tecnica" },
                  { key: "score_tactical", label: "Tattica" },
                  { key: "score_physical", label: "Fisico" },
                  { key: "score_mental", label: "Mental" },
                  { key: "score_potential", label: "Potenziale" },
                ],
                a = UI.modal({
                  title: "Scheda di Valutazione",
                  body: `\n                <div class="form-group">\n                    <label class="form-label" for="ev-date">Data Valutazione *</label>\n                    <input id="ev-date" class="form-input" type="date" value="${new Date().toISOString().substring(0, 10)}">\n                </div>\n                <div style="margin:var(--sp-3) 0">\n                    ${e.map((t) => `\n                        <div class="eval-slider-row">\n                            <span class="eval-slider-label">${Utils.escapeHtml(t.label)}</span>\n                            <input type="range" class="eval-slider" id="ev-${t.key}" min="1" max="10" value="5" data-score-dim="${t.key}">\n                            <span class="eval-slider-value" id="ev-${t.key}-val">5</span>\n                        </div>`).join("")}\n                    <div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2);border-top:1px solid var(--color-border);padding-top:var(--sp-2)">\n                        <span style="font-size:13px;color:var(--color-text-muted)">Media:</span>\n                        <strong id="ev-avg-display" style="font-size:16px;color:var(--color-pink)">5.0</strong>\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="ev-video">URL Video</label>\n                    <input id="ev-video" class="form-input" type="url" placeholder="https://...">\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="ev-notes">Note</label>\n                    <textarea id="ev-notes" class="form-input" rows="2"></textarea>\n                </div>\n                <div id="ev-error" class="form-error hidden"></div>`,
                  footer:
                    '\n                <button class="btn btn-ghost btn-sm" id="ev-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="ev-save" type="button"><i class="ph ph-star"></i> SALVA VALUTAZIONE</button>',
                });
              (e.forEach((t) => {
                const a = document.getElementById("ev-" + t.key),
                  n = document.getElementById("ev-" + t.key + "-val");
                a?.addEventListener("input", () => {
                  (n && (n.textContent = a.value),
                    (() => {
                      const t = e.map((t) =>
                          parseInt(
                            document.getElementById("ev-" + t.key)?.value || 5,
                          ),
                        ),
                        a = t.reduce((t, e) => t + e, 0) / t.length,
                        n = document.getElementById("ev-avg-display");
                      n && (n.textContent = a.toFixed(1));
                    })());
                });
              }),
                document
                  .getElementById("ev-cancel")
                  ?.addEventListener("click", () => a.close()),
                document
                  .getElementById("ev-save")
                  ?.addEventListener("click", async () => {
                    const l = document.getElementById("ev-date")?.value,
                      o = document.getElementById("ev-error");
                    if (!l)
                      return (
                        (o.textContent = "Data obbligatoria"),
                        void o.classList.remove("hidden")
                      );
                    const i = document.getElementById("ev-save");
                    ((i.disabled = !0), (i.textContent = "Salvataggio..."));
                    try {
                      const o = {
                        trial_id: t,
                        eval_date: l,
                        video_url:
                          document.getElementById("ev-video")?.value || null,
                        notes:
                          document.getElementById("ev-notes")?.value || null,
                      };
                      (e.forEach((t) => {
                        o[t.key] = parseInt(
                          document.getElementById("ev-" + t.key)?.value || 5,
                        );
                      }),
                        await Store.api("evaluateTrial", "network", o),
                        (n = await Store.get("listTrials", "network").catch(
                          () => n,
                        )),
                        UI.toast("Valutazione salvata", "success"),
                        await v(),
                        a.close());
                    } catch (t) {
                      ((o.textContent = t.message),
                        o.classList.remove("hidden"),
                        (i.disabled = !1),
                        (i.innerHTML =
                          '<i class="ph ph-star"></i> SALVA VALUTAZIONE'));
                    }
                  }));
            })(t.dataset.evalTrial),
          m(),
        ),
      ),
      t.querySelectorAll("[data-convert-trial]").forEach((t) =>
        t.addEventListener(
          "click",
          () =>
            (async function (t) {
              const e = n.find((e) => e.id === t);
              if (!e) return;
              const a = UI.modal({
                title: "Converti in Scouting",
                body: `<p style="font-size:14px">Convertire <strong>${Utils.escapeHtml((e.athlete_first_name || "") + " " + (e.athlete_last_name || ""))}</strong> in profilo Scouting?</p>\n                   <p style="font-size:12px;color:var(--color-text-muted)">Verrà creato un profilo nel modulo Scouting e la prova verrà aggiornata.</p>`,
                footer:
                  '<button class="btn btn-ghost btn-sm" id="cs-cancel" type="button">Annulla</button>\n                     <button class="btn btn-primary btn-sm btn-convert-scouting" id="cs-confirm" type="button"><i class="ph ph-arrow-right"></i> CONVERTI</button>',
              });
              (document
                .getElementById("cs-cancel")
                ?.addEventListener("click", () => a.close()),
                document
                  .getElementById("cs-confirm")
                  ?.addEventListener("click", async () => {
                    const e = document.getElementById("cs-confirm");
                    ((e.disabled = !0), (e.textContent = "Conversione..."));
                    try {
                      const e = await Store.api(
                        "convertToScouting",
                        "network",
                        { trial_id: t },
                      );
                      ((n = await Store.get("listTrials", "network").catch(
                        () => n,
                      )),
                        UI.toast(
                          e.message || "Atleta convertito in Scouting ✓",
                          "success",
                        ),
                        await v(),
                        a.close());
                    } catch (t) {
                      (UI.toast("Errore: " + t.message, "error"),
                        (e.disabled = !1),
                        (e.innerHTML =
                          '<i class="ph ph-arrow-right"></i> CONVERTI'));
                    }
                  }));
            })(t.dataset.convertTrial),
          m(),
        ),
      ),
      t.querySelectorAll("[data-del-trial]").forEach((t) =>
        t.addEventListener(
          "click",
          () =>
            (async function (t) {
              const e = n.find((e) => e.id === t);
              if (!e) return;
              const a = UI.modal({
                title: "Rimuovi Atleta in Prova",
                body: `<p>Rimuovere <strong>${Utils.escapeHtml((e.athlete_first_name || "") + " " + (e.athlete_last_name || ""))}</strong>?</p>`,
                footer:
                  '<button class="btn btn-ghost btn-sm" id="dt-cancel" type="button">Annulla</button>\n                     <button class="btn btn-primary btn-sm" id="dt-confirm" type="button" style="background:var(--color-pink)">RIMUOVI</button>',
              });
              (document
                .getElementById("dt-cancel")
                ?.addEventListener("click", () => a.close()),
                document
                  .getElementById("dt-confirm")
                  ?.addEventListener("click", async () => {
                    try {
                      (await Store.api("deleteTrial", "network", { id: t }),
                        (n = await Store.get("listTrials", "network").catch(
                          () => n,
                        )),
                        UI.toast("Atleta rimosso", "success"),
                        await v(),
                        a.close());
                    } catch (t) {
                      UI.toast("Errore: " + t.message, "error");
                    }
                  }));
            })(t.dataset.delTrial),
          m(),
        ),
      ));
  }
  function y(t) {
    const e = !!t,
      a = c
        .map(
          (e) =>
            `<option value="${e}" ${t?.status === e ? "selected" : ""}>${d[e] || e}</option>`,
        )
        .join(""),
      l = UI.modal({
        title: e ? "Modifica Atleta in Prova" : "Nuovo Atleta in Prova",
        body: `\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="tr-first">Nome *</label>\n                        <input id="tr-first" class="form-input" type="text" value="${Utils.escapeHtml(t?.athlete_first_name || "")}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="tr-last">Cognome *</label>\n                        <input id="tr-last" class="form-input" type="text" value="${Utils.escapeHtml(t?.athlete_last_name || "")}">\n                    </div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="tr-dob">Data di nascita</label>\n                        <input id="tr-dob" class="form-input" type="date" value="${t?.birth_date?.substring(0, 10) || ""}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="tr-nat">Nazionalità</label>\n                        <input id="tr-nat" class="form-input" type="text" value="${Utils.escapeHtml(t?.nationality || "")}">\n                    </div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="tr-pos">Posizione</label>\n                        <input id="tr-pos" class="form-input" type="text" value="${Utils.escapeHtml(t?.position || "")}" placeholder="es. Alzatore">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="tr-club">Club di provenienza</label>\n                        <input id="tr-club" class="form-input" type="text" value="${Utils.escapeHtml(t?.origin_club || "")}">\n                    </div>\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="tr-start">Inizio prova</label>\n                        <input id="tr-start" class="form-input" type="date" value="${t?.trial_start?.substring(0, 10) || ""}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="tr-end">Fine prova</label>\n                        <input id="tr-end" class="form-input" type="date" value="${t?.trial_end?.substring(0, 10) || ""}">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="tr-status">Stato</label>\n                    <select id="tr-status" class="form-select">${a}</select>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="tr-notes">Note</label>\n                    <textarea id="tr-notes" class="form-input" rows="2">${Utils.escapeHtml(t?.notes || "")}</textarea>\n                </div>\n                <div id="tr-error" class="form-error hidden"></div>`,
        footer: `\n                <button class="btn btn-ghost btn-sm" id="tr-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="tr-save" type="button">${e ? "SALVA" : "CREA"}</button>`,
      });
    (document
      .getElementById("tr-cancel")
      ?.addEventListener("click", () => l.close()),
      document
        .getElementById("tr-save")
        ?.addEventListener("click", async () => {
          const a = document.getElementById("tr-first")?.value.trim(),
            o = document.getElementById("tr-last")?.value.trim(),
            i = document.getElementById("tr-error");
          if (!a || !o)
            return (
              (i.textContent = "Nome e cognome obbligatori"),
              void i.classList.remove("hidden")
            );
          const s = document.getElementById("tr-save");
          ((s.disabled = !0), (s.textContent = "Salvataggio..."));
          try {
            const i = {
              athlete_first_name: a,
              athlete_last_name: o,
              birth_date: document.getElementById("tr-dob")?.value || null,
              nationality: document.getElementById("tr-nat")?.value || null,
              position: document.getElementById("tr-pos")?.value || null,
              origin_club: document.getElementById("tr-club")?.value || null,
              trial_start: document.getElementById("tr-start")?.value || null,
              trial_end: document.getElementById("tr-end")?.value || null,
              status:
                document.getElementById("tr-status")?.value || "in_valutazione",
              notes: document.getElementById("tr-notes")?.value || null,
            };
            (e
              ? await Store.api("updateTrial", "network", { id: t.id, ...i })
              : await Store.api("createTrial", "network", i),
              (n = await Store.get("listTrials", "network").catch(() => n)),
              UI.toast(e ? "Atleta aggiornato" : "Atleta aggiunto", "success"),
              await v(),
              l.close());
          } catch (t) {
            ((i.textContent = t.message),
              i.classList.remove("hidden"),
              (s.disabled = !1),
              (s.textContent = e ? "SALVA" : "CREA"));
          }
        }));
  }
  function h(t) {
    const e = ["admin", "manager"].includes(App.getUser()?.role);
    ((t.innerHTML = `\n            <div>\n                <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">\n                    <div class="input-wrapper" style="position:relative;min-width:220px">\n                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>\n                        <input type="text" id="net-act-search" class="form-input" placeholder="Cerca attività..." style="padding-left:36px;height:40px;font-size:13px">\n                    </div>\n                    ${e ? '<button class="btn btn-primary btn-sm" id="net-add-act" type="button"><i class="ph ph-plus"></i> NUOVA ATTIVITÀ</button>' : ""}\n                </div>\n                <div class="net-timeline" id="net-timeline">\n                    ${0 === l.length ? Utils.emptyState("Nessuna attività", "Registra la prima attività di network.") : l.map((t) => `\n                            <div class="net-timeline-item" data-act-title="${Utils.escapeHtml((t.title || "").toLowerCase())}">\n                                <div class="net-timeline-dot"></div>\n                                <div style="min-width:90px;padding-top:2px">\n                                    <span class="net-timeline-date">${t.date || ""}</span>\n                                </div>\n                                <div class="net-timeline-content">\n                                    <div class="net-timeline-title">${Utils.escapeHtml(t.title)}</div>\n                                    <div class="net-timeline-meta">\n                                        ${t.activity_type ? Utils.escapeHtml(t.activity_type) + (t.location ? " · " : "") : ""}\n                                        ${t.location ? Utils.escapeHtml(t.location) : ""}\n                                    </div>\n                                    ${t.outcome ? `<div style="font-size:12px;margin-top:4px;color:var(--color-text-muted)">${Utils.escapeHtml(t.outcome)}</div>` : ""}\n                                </div>\n                                ${e ? `<div style="display:flex;gap:4px;align-self:flex-start;padding-top:2px">\n                                    <button class="btn btn-ghost btn-sm" data-edit-act="${Utils.escapeHtml(t.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>\n                                    <button class="btn btn-ghost btn-sm" data-del-act="${Utils.escapeHtml(t.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>\n                                </div>` : ""}\n                            </div>`).join("")}\n                </div>\n            </div>`),
      document.getElementById("net-act-search")?.addEventListener(
        "input",
        (e) => {
          const a = e.target.value.trim().toLowerCase();
          t.querySelectorAll("[data-act-title]").forEach(
            (t) =>
              (t.style.display = t.dataset.actTitle.includes(a) ? "" : "none"),
          );
        },
        m(),
      ),
      document
        .getElementById("net-add-act")
        ?.addEventListener("click", () => x(null), m()),
      t
        .querySelectorAll("[data-edit-act]")
        .forEach((t) =>
          t.addEventListener(
            "click",
            () => x(l.find((e) => e.id === t.dataset.editAct)),
            m(),
          ),
        ),
      t.querySelectorAll("[data-del-act]").forEach((t) =>
        t.addEventListener(
          "click",
          async () => {
            try {
              (await Store.api("deleteActivity", "network", {
                id: t.dataset.delAct,
              }),
                (l = await Store.get("listActivities", "network").catch(
                  () => l,
                )),
                UI.toast("Attività eliminata", "success"),
                v());
            } catch (t) {
              UI.toast("Errore: " + t.message, "error");
            }
          },
          m(),
        ),
      ));
  }
  function x(t) {
    const e = !!t,
      a = UI.modal({
        title: e ? "Modifica Attività" : "Nuova Attività",
        body: `\n                <div class="form-group">\n                    <label class="form-label" for="ac-title">Titolo *</label>\n                    <input id="ac-title" class="form-input" type="text" value="${Utils.escapeHtml(t?.title || "")}" placeholder="es. Incontro con Pallavolo Roma">\n                </div>\n                <div class="form-grid">\n                    <div class="form-group">\n                        <label class="form-label" for="ac-date">Data *</label>\n                        <input id="ac-date" class="form-input" type="date" value="${t?.date?.substring(0, 10) || ""}">\n                    </div>\n                    <div class="form-group">\n                        <label class="form-label" for="ac-type">Tipo</label>\n                        <input id="ac-type" class="form-input" type="text" value="${Utils.escapeHtml(t?.activity_type || "")}" placeholder="es. Riunione, Osservazione…">\n                    </div>\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="ac-loc">Luogo</label>\n                    <input id="ac-loc" class="form-input" type="text" value="${Utils.escapeHtml(t?.location || "")}">\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="ac-outcome">Esito</label>\n                    <input id="ac-outcome" class="form-input" type="text" value="${Utils.escapeHtml(t?.outcome || "")}" placeholder="es. Accordo raggiunto">\n                </div>\n                <div class="form-group">\n                    <label class="form-label" for="ac-notes">Note</label>\n                    <textarea id="ac-notes" class="form-input" rows="2">${Utils.escapeHtml(t?.notes || "")}</textarea>\n                </div>\n                <div id="ac-error" class="form-error hidden"></div>`,
        footer: `\n                <button class="btn btn-ghost btn-sm" id="ac-cancel" type="button">Annulla</button>\n                <button class="btn btn-primary btn-sm" id="ac-save" type="button">${e ? "SALVA" : "CREA"}</button>`,
      });
    (document
      .getElementById("ac-cancel")
      ?.addEventListener("click", () => a.close()),
      document
        .getElementById("ac-save")
        ?.addEventListener("click", async () => {
          const n = document.getElementById("ac-title")?.value.trim(),
            o = document.getElementById("ac-date")?.value,
            i = document.getElementById("ac-error");
          if (!n || !o)
            return (
              (i.textContent = "Titolo e data obbligatori"),
              void i.classList.remove("hidden")
            );
          const s = document.getElementById("ac-save");
          ((s.disabled = !0), (s.textContent = "Salvataggio..."));
          try {
            const i = {
              title: n,
              date: o,
              activity_type: document.getElementById("ac-type")?.value || null,
              location: document.getElementById("ac-loc")?.value || null,
              outcome: document.getElementById("ac-outcome")?.value || null,
              notes: document.getElementById("ac-notes")?.value || null,
            };
            (e
              ? await Store.api("updateActivity", "network", { id: t.id, ...i })
              : await Store.api("createActivity", "network", i),
              (l = await Store.get("listActivities", "network").catch(() => l)),
              UI.toast(
                e ? "Attività aggiornata" : "Attività registrata",
                "success",
              ),
              await v(),
              a.close());
          } catch (t) {
            ((i.textContent = t.message),
              i.classList.remove("hidden"),
              (s.disabled = !1),
              (s.textContent = e ? "SALVA" : "CREA"));
          }
        }));
  }
  return {
    destroy() {
      (t.abort(), (t = new AbortController()));
    },
    async init() {
      const t = document.getElementById("app");
      if (t) {
        (UI.loading(!0), (t.innerHTML = UI.skeletonPage()));
        try {
          [a, n, l] = await Promise.all([
            Store.get("listCollaborations", "network").catch(() => []),
            Store.get("listTrials", "network").catch(() => []),
            Store.get("listActivities", "network").catch(() => []),
          ]);
          const t = Router.getCurrentRoute();
          ((e =
            "network-prove" === t
              ? "prove"
              : "network-attivita" === t
                ? "attivita"
                : "collaborazioni"),
            (function () {
              const t = document.getElementById("app");
              if (t) {
                t.innerHTML =
                  '\n            <div class="module-wrapper">\n                <div class="page-header" style="border-bottom:1px solid var(--color-border);padding:var(--sp-4);padding-bottom:var(--sp-3);margin-bottom:0">\n                    <h1 class="page-title">Network</h1>\n                    <p class="page-subtitle">Collaborazioni, atleti in prova e attività di rete</p>\n                </div>\n                <div style="display:flex;gap:0;border-bottom:1px solid var(--color-border);padding:0 var(--sp-4)">\n                    <button class="net-main-tab" data-net-main-tab="collaborazioni" type="button" style="padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid transparent;color:var(--color-text-muted);transition:all .2s">Collaborazioni</button>\n                    <button class="net-main-tab" data-net-main-tab="prove" type="button" style="padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid transparent;color:var(--color-text-muted);transition:all .2s">Prove</button>\n                    <button class="net-main-tab" data-net-main-tab="attivita" type="button" style="padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:13px;font-weight:600;border-bottom:2px solid transparent;color:var(--color-text-muted);transition:all .2s">Attività</button>\n                </div>\n                <div class="module-body">\n                    <main class="module-content" id="net-tab-content"></main>\n                </div>\n            </div>';
                document.querySelectorAll(".net-main-tab").forEach((btn) => {
                  btn.addEventListener("click", () => {
                    e = btn.dataset.netMainTab;
                    document.querySelectorAll(".net-main-tab").forEach((b) => {
                      b.style.borderBottomColor = "transparent";
                      b.style.color = "var(--color-text-muted)";
                    });
                    btn.style.borderBottomColor = "var(--color-primary)";
                    btn.style.color = "var(--color-primary)";
                    v();
                  });
                });
                const activeBtn = document.querySelector(
                  `.net-main-tab[data-net-main-tab="${e}"]`,
                );
                if (activeBtn) {
                  activeBtn.style.borderBottomColor = "var(--color-primary)";
                  activeBtn.style.color = "var(--color-primary)";
                }
                v();
              }
            })());
        } catch (e) {
          (t &&
            (t.innerHTML = Utils.emptyState("Errore caricamento", e.message)),
            UI.toast("Errore caricamento Network", "error"));
        } finally {
          UI.loading(!1);
        }
      }
    },
  };
})();
window.Network = Network;
