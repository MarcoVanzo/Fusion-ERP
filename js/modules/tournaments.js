"use strict";
const Tournaments = (() => {
  let t = new AbortController(),
    e = [],
    n = null;
  async function a() {
    try {
      const n = await fetch(
          "api/router.php?module=tournaments&action=getTournaments",
        ),
        a = await n.json();
      if (!a.success) throw new Error(a.error);
      ((e = a.data.tournaments),
        (function () {
          const n = document.getElementById("trm-list-content");
          n &&
            (0 !== e.length
              ? ((n.innerHTML = e
                  .map((t) => {
                    const e = new Date(t.event_date).toLocaleDateString(
                      "it-IT",
                    );
                    return `\n            <div class="dash-stat-card" data-id="${t.id}">\n                <div style="font-size: 11px; opacity: 0.6; margin-bottom: 8px; text-transform: uppercase;">${t.team_name}</div>\n                <h3 style="font-size: 1.2rem; margin-bottom: 8px;">${t.title}</h3>\n                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8;">\n                    <i class="ph ph-calendar"></i> ${e}\n                </div>\n                ${t.location_name ? `<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.8; margin-top: 4px;">\n                    <i class="ph ph-map-pin"></i> ${t.location_name}\n                </div>` : ""}\n            </div>`;
                  })
                  .join("")),
                n.querySelectorAll(".dash-stat-card").forEach((e) => {
                  e.addEventListener("click", () => o(e.dataset.id), {
                    signal: t.signal,
                  });
                }))
              : (n.innerHTML =
                  '<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5;">\n                <i class="ph ph-trophy" style="font-size: 32px; margin-bottom: 12px;"></i>\n                <p>Nessun torneo programmato. Clicca su "Nuovo Torneo" per iniziare.</p>\n            </div>'));
        })());
    } catch (t) {
      UI.toast("Errore caricamento tornei: " + t.message, "error");
    }
  }
  async function o(e) {
    document.getElementById("trm-list-view").style.display = "none";
    const a = document.getElementById("trm-detail-view");
    ((a.style.display = "block"),
      (a.innerHTML =
        '<div style="padding: 40px; text-align: center; opacity: 0.5;">Caricamento dettagli...</div>'));
    try {
      const a = await fetch(
          `api/router.php?module=tournaments&action=getTournament&id=${e}`,
        ),
        o = await a.json();
      if (!o.success) throw new Error(o.error);
      ((n = o.data),
        (function () {
          const e = n.tournament,
            a = document.getElementById("trm-detail-view"),
            o = new Date(e.event_date).toLocaleDateString("it-IT");
          ((a.innerHTML = `\n        <div class="trm-header">\n            <div>\n                <button class="btn-dash" id="btn-back-trm" style="margin-bottom: 12px; padding: 6px 12px;">\n                    <i class="ph ph-arrow-left"></i> Torna ai Tornei\n                </button>\n                <h1>${e.title}</h1>\n                <div style="opacity: 0.7; margin-top: 4px;">${e.team_name} • ${o}</div>\n            </div>\n            <button class="btn-dash" id="btn-edit-trm">\n                <i class="ph ph-pencil"></i> Modifica\n            </button>\n        </div>\n\n        <div class="dash-filters fusion-tabs-container">\n            <div class="dash-filter active" data-target="panel-overview">Overview</div>\n            <div class="dash-filter" data-target="panel-roster">Roster (${n.roster.filter((t) => "confirmed" === t.attendance_status).length}/${n.roster.length})</div>\n            <div class="dash-filter" data-target="panel-matches">Partite (${n.matches.length})</div>\n        </div>\n\n        \x3c!-- OVERVIEW PANEL --\x3e\n        <div id="panel-overview" class="dash-card active" style="padding: 24px; margin-top:24px;">\n            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">\n                <div>\n                    <h4 style="color: #f59e0b; margin-bottom: 12px;">Dettagli Logistici</h4>\n                    <p><strong>Luogo:</strong> ${e.location_name || "Non specificato"}</p>\n                    <p><strong>Quota:</strong> ${e.fee_per_athlete > 0 ? e.fee_per_athlete + " €" : "Gratuito"}</p>\n                    ${e.website_url ? `<p><strong>Sito Web:</strong> <a href="${e.website_url}" target="_blank" style="color:#60a5fa;">${e.website_url}</a></p>` : ""}\n                </div>\n                <div>\n                    <h4 style="color: #f59e0b; margin-bottom: 12px;">Alloggio / Note</h4>\n                    <div style="white-space: pre-wrap; opacity: 0.8; font-size: 14px;">${e.accommodation_info || "Nessuna informazione aggiuntiva."}</div>\n                </div>\n            </div>\n        </div>\n\n        \x3c!-- ROSTER PANEL --\x3e\n        <div id="panel-roster" class="dash-card" style="padding: 24px; margin-top:24px;">\n            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">\n                <h3>Atlete Convocate</h3>\n                <button class="btn-dash pink" id="btn-save-roster">Salva Roster</button>\n            </div>\n            <div style="background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">\n                ${n.roster.map((t) => `\n                    <div class="trm-roster-item">\n                        <div>\n                            <span style="display:inline-block; width: 24px; opacity:0.5;">${t.jersey_number || "-"}</span>\n                            <strong>${t.full_name}</strong>\n                            <span style="font-size: 11px; opacity: 0.6; margin-left: 8px;">${t.role || ""}</span>\n                        </div>\n                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">\n                            <input type="checkbox" class="trm-roster-cb" data-id="${t.id}" ${"confirmed" === t.attendance_status ? "checked" : ""}>\n                            <span style="font-size:13px;">Convocata</span>\n                        </label>\n                    </div>\n                `).join("")}\n            </div>\n        </div>\n\n        \x3c!-- MATCHES PANEL --\x3e\n        <div id="panel-matches" class="dash-card" style="padding: 24px; margin-top:24px;">\n            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">\n                <h3>Partite del Torneo</h3>\n                <button class="btn-dash pink" id="btn-add-match">Aggiungi Partita</button>\n            </div>\n            <div id="trm-matches-list">\n                ${0 === n.matches.length ? '<div style="opacity:0.5; padding:20px;">Nessuna partita aggiunta.</div>' : ""}\n                ${n.matches.map((t) => `\n                    <div class="trm-match-item" style="display:flex; justify-content:space-between; align-items:center;">\n                        <div>\n                            <div style="font-size: 12px; opacity:0.6; margin-bottom: 4px;">${new Date(t.match_time).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} ${t.court_name ? "• " + t.court_name : ""}</div>\n                            <div style="font-size: 16px;"><strong>${e.team_name}</strong> vs <strong>${t.opponent_name}</strong></div>\n                        </div>\n                        <div style="text-align: right;">\n                            <div style="font-size: 24px; font-weight: 700; color: ${t.our_score > t.opponent_score ? "#10b981" : t.our_score < t.opponent_score ? "#ef4444" : "#fff"};">\n                                ${t.our_score} - ${t.opponent_score}\n                            </div>\n                            <button class="btn-dash btn-edit-match" style="padding: 4px 8px; font-size:11px; margin-top: 4px;" data-match='${JSON.stringify(t)}'>Modifica</button>\n                        </div>\n                    </div>\n                    `).join("")}\n            </div>\n        </div>\n        `),
            document
              .getElementById("btn-back-trm")
              .addEventListener("click", i, { signal: t.signal }),
            document
              .getElementById("btn-edit-trm")
              .addEventListener("click", () => s(e), { signal: t.signal }),
            document
              .getElementById("btn-save-roster")
              .addEventListener("click", r, { signal: t.signal }),
            document
              .getElementById("btn-add-match")
              .addEventListener("click", () => l(), { signal: t.signal }),
            a.querySelectorAll(".btn-edit-match").forEach((e) => {
              e.addEventListener(
                "click",
                (t) => {
                  l(JSON.parse(t.target.dataset.match));
                },
                { signal: t.signal },
              );
            }),
            a.querySelectorAll(".dash-filter").forEach((e) => {
              e.addEventListener(
                "click",
                (t) => {
                  (a
                    .querySelectorAll(".dash-filter")
                    .forEach((t) => t.classList.remove("active")),
                    a
                      .querySelectorAll(".dash-card")
                      .forEach((t) => t.classList.remove("active")),
                    t.target.classList.add("active"),
                    document
                      .getElementById(t.target.dataset.target)
                      .classList.add("active"));
                },
                { signal: t.signal },
              );
            }));
        })());
    } catch (t) {
      (UI.toast("Errore: " + t.message, "error"), i());
    }
  }
  function i() {
    ((document.getElementById("trm-detail-view").style.display = "none"),
      (document.getElementById("trm-list-view").style.display = "block"),
      (n = null),
      a());
  }
  async function r() {
    if (!n) return;
    const t = document.getElementById("btn-save-roster");
    ((t.disabled = !0), (t.textContent = "Salvataggio..."));
    const e = [];
    document.querySelectorAll(".trm-roster-cb").forEach((t) => {
      e.push({
        athlete_id: t.dataset.id,
        status: t.checked ? "confirmed" : "absent",
      });
    });
    try {
      const t = await fetch(
          "api/router.php?module=tournaments&action=updateRoster",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: n.tournament.id, attendees: e }),
          },
        ),
        a = await t.json();
      if (!a.success) throw new Error(a.error);
      (UI.toast("Roster salvato", "success"), o(n.tournament.id));
    } catch (e) {
      (UI.toast(e.message, "error"),
        (t.disabled = !1),
        (t.textContent = "Salva Roster"));
    }
  }
  function s(t = null) {
    fetch("api/router.php?module=athletes&action=teams")
      .then((t) => t.json())
      .then((e) => {
        const i = (Array.isArray(e.data) ? e.data : e.data?.teams || [])
            .map(
              (e) =>
                `<option value="${e.id}" ${t && t.team_id === e.id ? "selected" : ""}>${e.name}</option>`,
            )
            .join(""),
          r = (t) => {
            if (!t) return "";
            const e = new Date(t),
              n = (t) => t.toString().padStart(2, "0");
            return `${e.getFullYear()}-${n(e.getMonth() + 1)}-n(e.getDate())}T${n(e.getHours())}:${n(e.getMinutes())}`;
          },
          s = `\n                <div style="display:flex; flex-direction:column; gap:12px;">\n                    <input type="hidden" id="tm-id" value="${t ? t.id : ""}">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Squadra *</label>\n                    <select id="tm-team" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                        <option value="">Seleziona...</option>\n                        ${i}\n                    </select>\n\n                    <label style="font-size:12px; opacity:0.7;">Titolo Torneo *</label>\n                    <input type="text" id="tm-title" value="${t ? t.title : ""}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Inizio *</label>\n                    <input type="datetime-local" id="tm-start" value="${r(t ? t.event_date : null)}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Fine</label>\n                    <input type="datetime-local" id="tm-end" value="${r(t ? t.event_end : null)}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Luogo (Città / Impianto)</label>\n                    <input type="text" id="tm-loc" value="${(t && t.location_name) || ""}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Sito Web</label>\n                    <input type="url" id="tm-url" value="${(t && t.website_url) || ""}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Quota Atleta (€)</label>\n                    <input type="number" step="0.01" id="tm-fee" value="${(t && t.fee_per_athlete) || 0}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    \n                    <label style="font-size:12px; opacity:0.7;">Note / Alloggio</label>\n                    <textarea id="tm-notes" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff; min-height:80px;">${(t && t.accommodation_info) || ""}</textarea>\n                </div>`,
          l = UI.modal({
            title: (t ? "Modifica" : "Nuovo") + " Torneo",
            body: s,
            footer:
              '\n                    <button class="btn btn-ghost btn-sm" id="btn-cancel-trm-modal">Annulla</button>\n                    <button class="btn btn-primary btn-sm" id="btn-save-trm-modal">Salva</button>\n                ',
          });
        (document
          .getElementById("btn-cancel-trm-modal")
          ?.addEventListener("click", () => l.close()),
          document
            .getElementById("btn-save-trm-modal")
            .addEventListener("click", async () => {
              const t = {
                id: document.getElementById("tm-id").value,
                team_id: document.getElementById("tm-team").value,
                title: document.getElementById("tm-title").value,
                event_date: document.getElementById("tm-start").value,
                event_end: document.getElementById("tm-end").value || null,
                location_name: document.getElementById("tm-loc").value,
                website_url: document.getElementById("tm-url").value,
                fee_per_athlete:
                  parseFloat(document.getElementById("tm-fee").value) || 0,
                accommodation_info: document.getElementById("tm-notes").value,
              };
              if (t.team_id && t.title && t.event_date)
                try {
                  const e = await fetch(
                      "api/router.php?module=tournaments&action=saveTournament",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(t),
                      },
                    ),
                    i = await e.json();
                  if (!i.success) throw new Error(i.error);
                  (UI.toast("Torneo salvato", "success"),
                    await (n ? o(i.data.id || n.tournament.id) : a()),
                    l.close());
                } catch (t) {
                  UI.toast(t.message, "error");
                }
              else
                UI.toast(
                  "I campi contrassegnati con * sono obbligatori.",
                  "warning",
                );
            }));
      })
      .catch((t) => {
        UI.toast("Errore caricamento squadre: " + t.message, "error");
      });
  }
  function l(t = null) {
    if (!n) return;
    const e = `\n            <div style="display:flex; flex-direction:column; gap:12px;">\n                <input type="hidden" id="mm-id" value="${t ? t.id : ""}">\n                \n                <label style="font-size:12px; opacity:0.7;">Avversario *</label>\n                <input type="text" id="mm-opp" value="${t ? t.opponent_name : ""}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                \n                <label style="font-size:12px; opacity:0.7;">Data e Ora *</label>\n                <input type="datetime-local" id="mm-time" value="${((
        t,
      ) => {
        if (!t) return "";
        const e = new Date(t),
          n = (t) => t.toString().padStart(2, "0");
        return `${e.getFullYear()}-${n(e.getMonth() + 1)}-${n(e.getDate())}T${n(e.getHours())}:${n(e.getMinutes())}`;
      })(
        t ? t.match_time : null,
      )}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                \n                <label style="font-size:12px; opacity:0.7;">Campo / Palestra</label>\n                <input type="text" id="mm-court" value="${(t && t.court_name) || ""}" style="padding:10px; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                \n                <div style="display:flex; gap:16px;">\n                    <div style="flex:1;">\n                        <label style="font-size:12px; opacity:0.7;">Ns. Punteggio</label>\n                        <input type="number" id="mm-our" value="${t ? t.our_score : 0}" style="padding:10px; width:100%; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    </div>\n                    <div style="flex:1;">\n                        <label style="font-size:12px; opacity:0.7;">Pt. Avversario</label>\n                        <input type="number" id="mm-opps" value="${t ? t.opponent_score : 0}" style="padding:10px; width:100%; border-radius:6px; border:1px solid #444; background:#222; color:#fff;">\n                    </div>\n                </div>\n            </div>`,
      a = UI.modal({
        title: (t ? "Modifica" : "Aggiungi") + " Partita",
        body: e,
        footer:
          '\n            <button class="btn btn-ghost btn-sm" id="btn-cancel-match-modal">Annulla</button>\n            <button class="btn btn-primary btn-sm" id="btn-save-match-modal">Salva Partita</button>\n        ',
      });
    (document
      .getElementById("btn-cancel-match-modal")
      ?.addEventListener("click", () => a.close()),
      document
        .getElementById("btn-save-match-modal")
        .addEventListener("click", async () => {
          const t = {
            id: document.getElementById("mm-id").value,
            event_id: n.tournament.id,
            opponent_name: document.getElementById("mm-opp").value,
            match_time: document.getElementById("mm-time").value,
            court_name: document.getElementById("mm-court").value,
            our_score: parseInt(document.getElementById("mm-our").value) || 0,
            opponent_score:
              parseInt(document.getElementById("mm-opps").value) || 0,
          };
          if (t.opponent_name && t.match_time)
            try {
              const e = await fetch(
                  "api/router.php?module=tournaments&action=saveMatch",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(t),
                  },
                ),
                i = await e.json();
              if (!i.success) throw new Error(i.error);
              (UI.toast("Partita salvata", "success"),
                await o(n.tournament.id),
                a.close());
            } catch (t) {
              UI.toast(t.message, "error");
            }
          else UI.toast("Avversario e Data sono obbligatori.", "warning");
        }));
  }
  return {
    init: async function () {
      (t.abort(),
        (t = new AbortController()),
        (function () {
          const e = document.getElementById("app");
          e &&
            ((e.innerHTML =
              '\n        \n\n        <div class="transport-dashboard" style="min-height:100vh;">\n            <div id="trm-list-view">\n                <div class="trm-header">\n                    <h1><i class="ph ph-trophy"></i> Tornei</h1>\n                    <button class="btn-dash pink" id="btn-new-tournament">\n                        <i class="ph ph-plus"></i> Nuovo Torneo\n                    </button>\n                </div>\n                <div id="trm-list-content" class="dash-stat-grid">\n                    <div style="opacity:0.5; text-align:center; grid-column: 1/-1; padding: 40px;">Caricamento...</div>\n                </div>\n            </div>\n            \n            <div id="trm-detail-view" class="trm-detail-view">\n                \x3c!-- Populated dynamically --\x3e\n            </div>\n        </div>\n        '),
            document
              .getElementById("btn-new-tournament")
              ?.addEventListener("click", () => s(), { signal: t.signal }));
        })(),
        await a());
    },
    destroy: function () {
      t.abort();
      e.length = 0;
      n = null;
    },
  };
})();
window.Tournaments = Tournaments;
