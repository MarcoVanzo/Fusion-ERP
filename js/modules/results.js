"use strict";
const Results = (() => {
  let e = new AbortController(),
    t = [],
    n = null,
    s = "matches";
  async function o() {
    try {
      const e = await Store.get("getCampionati", "results");
      t = e.campionati || [];
      const s = document.getElementById("res-campionato-select");
      if (!s) return;
      if (0 === t.length)
        return (
          (s.innerHTML =
            '<option value="">Nessun campionato configurato</option>'),
          void l(
            "Nessun campionato configurato",
            "Aggiungi un campionato tramite il tasto ⚙️ in alto a destra.\nPortali supportati: venezia.portalefipav.net · fipavveneto.net · federvolley.it",
          )
        );
      ((s.innerHTML = t
        .map(
          (e) =>
            `<option value="${Utils.escapeHtml(e.id)}" data-url="${Utils.escapeHtml(e.url || "")}">${Utils.escapeHtml(e.label)}</option>`,
        )
        .join("")),
        s.removeEventListener("change", a),
        s.addEventListener("change", a));
      const o = s.options[0];
      ((n = { id: o.value, url: o.dataset.url, label: o.textContent }),
        await r());
    } catch (e) {
      (console.error("[Results] getCampionati error:", e),
        c("Impossibile caricare i campionati. " + (e.message || "")));
    }
  }
  function a() {
    const e = document.getElementById("res-campionato-select");
    if (!e) return;
    const t = e.options[e.selectedIndex];
    ((n = { id: t.value, url: t.dataset.url, label: t.textContent }), r());
  }
  async function r() {
    "matches" === s
      ? await (async function () {
          const e = document.getElementById("res-content");
          if ((e && (e.innerHTML = d()), !n?.id && !n?.url))
            return void l(
              "Nessun campionato selezionato",
              "Seleziona un campionato dal menu in alto.",
            );
          const t = n.id ? { campionato_id: n.id } : { campionato_url: n.url };
          try {
            const e = await Store.get("getResults", "results", t);
            if (e.needs_sync) {
              const e = document.getElementById("res-content");
              return void (
                e &&
                (e.innerHTML =
                  '\n<div class="res-empty">\n  <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>\n  <div class="res-empty-title">Partite non ancora sincronizzate</div>\n  <div class="res-empty-sub">Premi <strong>☁ Sincronizza</strong> per scaricare le partite dal portale.</div>\n  <button class="btn btn-primary btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora\n  </button>\n</div>')
              );
            }
            !(function (e) {
              const t = document.getElementById("res-content");
              if (!t) return;
              const s = e.matches || [],
                o = e.last_updated
                  ? new Date(e.last_updated).toLocaleString("it-IT")
                  : "",
                a =
                  e.source_url || n?.url || "https://venezia.portalefipav.net";
              if (0 === s.length)
                return void l(
                  "Nessuna partita trovata",
                  "Non ci sono partite disponibili per questo campionato.",
                );
              const r = {};
              s.forEach((e) => {
                const t = e.round || "Altre";
                (r[t] || (r[t] = []), r[t].push(e));
              });
              const c = Object.keys(r).sort((e, t) =>
                "Altre" === e
                  ? 1
                  : "Altre" === t
                    ? -1
                    : parseInt(e) - parseInt(t),
              );
              let d = "";
              if (
                (c.forEach((e, t) => {
                  const n = r[e];
                  d += `\n<div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:white;margin-top:${0 === t ? "20px" : "32px"};margin-bottom:12px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #1c1c1e;padding-bottom:8px;">\n  <i class="ph ph-calendar-blank" style="color:var(--color-pink);"></i>\n  ${"Altre" === e ? "Partite senza giornata" : `Giornata ${e}`}\n</div>\n<div class="res-grid">${n.map(i).join("")}</div>`;
                }),
                o)
              ) {
                const e = (() => {
                  try {
                    return new URL(a).hostname;
                  } catch (e) {
                    return "portale federale";
                  }
                })();
                d += `<div class="res-last-update">Aggiornato: ${o} &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(a)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a></div>`;
              }
              t.innerHTML = d;
            })(e);
          } catch (e) {
            if ("AbortError" === e.name) return;
            (console.error("[Results] getResults error:", e),
              c("Impossibile caricare i risultati. " + (e.message || "")));
          }
        })()
      : await (async function () {
          const e = document.getElementById("res-content");
          if ((e && (e.innerHTML = d()), !n?.id && !n?.url))
            return void l(
              "Nessun campionato selezionato",
              "Seleziona un campionato dal menu in alto.",
            );
          const t = n.id ? { campionato_id: n.id } : { campionato_url: n.url };
          try {
            const e = await Store.get("getStandings", "results", t);
            if (e.needs_sync)
              return void (e.already_synced
                ? (function (e) {
                    const t = document.getElementById("res-content");
                    if (!t) return;
                    const n = e ? new Date(e).toLocaleString("it-IT") : "";
                    t.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-table" style="color:var(--color-text-muted);opacity:0.5;"></i>\n  <div class="res-empty-title">Classifica non disponibile</div>\n  <div class="res-empty-sub">\n    La sincronizzazione è avvenuta${n ? " il " + Utils.escapeHtml(n) : ""}, ma il portale non ha pubblicato la classifica per questo campionato.<br><br>\n    Prova a risincronizzare tra qualche minuto.\n  </div>\n  <button class="btn btn-ghost btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-arrows-clockwise"></i> Riprova sincronizzazione\n  </button>\n</div>`;
                  })(e.last_updated)
                : (function () {
                    const e = document.getElementById("res-content");
                    e &&
                      (e.innerHTML =
                        '\n<div class="res-empty">\n  <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>\n  <div class="res-empty-title">Classifica non ancora sincronizzata</div>\n  <div class="res-empty-sub">Premi il bottone <strong>☁ Sincronizza</strong> in alto a destra per caricare la classifica dal portale.</div>\n  <button class="btn btn-primary btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora\n  </button>\n</div>');
                  })());
            !(function (e) {
              const t = document.getElementById("res-content");
              if (!t) return;
              const s = e.standings || [],
                o = e.last_updated
                  ? new Date(e.last_updated).toLocaleString("it-IT")
                  : "",
                a =
                  e.source_url || n?.url || "https://venezia.portalefipav.net";
              if (0 === s.length)
                return void l(
                  "Classifica non disponibile",
                  "Non è stato possibile estrarre la classifica per questo campionato.",
                );
              const r = ["🥇", "🥈", "🥉"];
              let i = `\n<div class="res-table-wrap">\n  <table class="res-table">\n    <thead>\n      <tr>\n        <th class="center" style="width:50px;">#</th>\n        <th>Squadra</th>\n        <th class="center">PG</th>\n        <th class="center">V</th>\n        <th class="center">P</th>\n        <th class="center">Punti</th>\n      </tr>\n    </thead>\n    <tbody>\n${s
                .map((e, t) => {
                  const n = e.position ?? t + 1,
                    s = e.is_our_team;
                  return `\n      <tr class="${s ? "our-row" : ""}">\n        <td class="center">${n <= 3 ? `<span class="pos-medal">${r[n - 1]}</span>` : `<span class="res-pos">${n}</span>`}</td>\n        <td>\n          <div class="res-team-cell">\n            ${s ? '<div class="res-team-dot"></div>' : ""}\n            <span style="${s ? "color:var(--color-pink);font-weight:700;" : ""}">${Utils.escapeHtml(e.team || "—")}</span>\n          </div>\n        </td>\n        <td class="center">${e.played ?? "—"}</td>\n        <td class="center" style="color:#4caf50;">${e.won ?? "—"}</td>\n        <td class="center" style="color:#ef5350;">${e.lost ?? "—"}</td>\n        <td class="center"><strong style="font-size:15px;">${e.points ?? "—"}</strong></td>\n      </tr>`;
                })
                .join("")}\n    </tbody>\n  </table>\n</div>`;
              if (o) {
                const e = (() => {
                  try {
                    return new URL(a).hostname;
                  } catch (e) {
                    return "portale federale";
                  }
                })();
                i += `<div class="res-last-update">Aggiornato: ${o} &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(a)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a></div>`;
              }
              t.innerHTML = i;
            })(e);
          } catch (e) {
            if ("AbortError" === e.name) return;
            (console.error("[Results] getStandings error:", e),
              c("Impossibile caricare la classifica. " + (e.message || "")));
          }
        })();
  }
  function i(e) {
    const t = e.is_our_team,
      n = "played" === e.status,
      s =
        "live" === e.status
          ? '<span class="res-badge live"><i class="ph ph-circle" style="font-size:8px;"></i> Live</span>'
          : n
            ? '<span class="res-badge played"><i class="ph ph-check-circle"></i> Giocata</span>'
            : "unknown" === e.status
              ? '<span class="res-badge unknown"><i class="ph ph-question"></i> Da omologare</span>'
              : '<span class="res-badge scheduled"><i class="ph ph-clock"></i> In programma</span>',
      o = t
        ? '<span class="res-badge our-match"><i class="ph ph-star-four"></i> Noi</span>'
        : "";
    let a = { home: "", away: "" };
    if (n && t) {
      const t = Results._isOurTeam(e.home || ""),
        n = Results._isOurTeam(e.away || "");
      t
        ? ((a.home = (e.sets_home || 0) > (e.sets_away || 0) ? "win" : "loss"),
          (a.away = "win" === a.home ? "loss" : "win"))
        : n &&
          ((a.away = (e.sets_away || 0) > (e.sets_home || 0) ? "win" : "loss"),
          (a.home = "win" === a.away ? "loss" : "win"));
    }
    const r = e.date
        ? `${e.date}${e.time ? " · " + e.time : ""}`
        : e.time || "—",
      i = Results._isOurTeam(e.home || "")
        ? "res-team-name our-name"
        : "res-team-name",
      l = Results._isOurTeam(e.away || "")
        ? "res-team-name our-name"
        : "res-team-name",
      c =
        n && e.score
          ? `<div class="res-score ${a.home}">${e.sets_home ?? ""}</div><div class="res-time-label">-</div><div class="res-score ${a.away}">${e.sets_away ?? ""}</div>`
          : '<div class="res-score vs">vs</div>';
    return `\n<div class="res-card${t ? " our-team" : ""}">\n  <div class="res-card-top">\n    <span>${Utils.escapeHtml(r)}</span>\n    <span>${s}${o}</span>\n  </div>\n  <div class="res-teams">\n    <div class="res-team"><div class="${i}">${Utils.escapeHtml(e.home || "Casa")}</div></div>\n    <div class="res-score-block">${c}</div>\n    <div class="res-team away"><div class="${l}">${Utils.escapeHtml(e.away || "Ospite")}</div></div>\n  </div>\n</div>`;
  }
  function l(e, t) {
    const n = document.getElementById("res-content");
    n &&
      (n.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-volleyball"></i>\n  <div class="res-empty-title">${Utils.escapeHtml(e)}</div>\n  <div class="res-empty-sub">${Utils.escapeHtml(t)}</div>\n</div>`);
  }
  function c(e) {
    const t = document.getElementById("res-content");
    t &&
      (t.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-warning-circle" style="color:#ef5350;opacity:1;"></i>\n  <div class="res-empty-title">Errore di connessione</div>\n  <div class="res-empty-sub">${Utils.escapeHtml(e)}</div>\n  <button class="btn btn-ghost btn-sm" onclick="Results._refresh()" style="margin-top:8px;">\n    <i class="ph ph-arrows-clockwise"></i> Riprova\n  </button>\n</div>`);
  }
  function d() {
    return `<div class="res-loading-grid">${Array.from({ length: 6 }, () => '\n<div class="res-skel-card">\n  <div class="skeleton skeleton-text" style="width:60%;"></div>\n  <div style="display:flex;gap:12px;align-items:center;">\n    <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>\n    <div class="skeleton skeleton-title" style="width:50px;"></div>\n    <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>\n  </div>\n</div>').join("")}</div>`;
  }
  function p() {
    document
      .querySelectorAll(".res-view-btn")
      .forEach((e) => e.classList.remove("active"));
    const e = document.getElementById(`res-btn-${s}`);
    e && e.classList.add("active");
  }
  return {
    init: async function () {
      e = new AbortController();
      const t = Router.getCurrentRoute();
      ((s = "results-standings" === t ? "standings" : "matches"),
        (function () {
          const e = document.getElementById("app");
          if (!e) return;
          const t = document.getElementById("main-content");
          (t &&
            ((t.style.padding = "0"), (t.style.backgroundColor = "#0a0a0c")),
            App.getUser(),
            (e.innerHTML = `\n<style>\n  /* ── Results Module ──────────────────────────────── */\n  .res-container { padding:28px 32px; color:white; background:#0a0a0c; min-height:100%; font-family:var(--font-body),sans-serif; }\n  .res-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }\n  .res-title-block { display:flex; flex-direction:column; gap:4px; }\n  .res-title { font-family:var(--font-display); font-size:26px; font-weight:800; letter-spacing:-0.02em; }\n  .res-subtitle { font-size:12px; color:var(--color-text-muted); font-weight:500; text-transform:uppercase; letter-spacing:0.06em; }\n  .res-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }\n  .res-select { background:#1c1c1e; border:1px solid #2c2c2e; border-radius:8px; color:white; font-size:13px; font-family:var(--font-body),sans-serif; font-weight:600; padding:8px 12px; cursor:pointer; outline:none; min-width:220px; transition:border-color 0.2s; }\n  .res-select:hover,.res-select:focus { border-color:var(--color-pink); }\n  .res-view-toggle { display:flex; background:#1c1c1e; border-radius:8px; padding:3px; gap:3px; }\n  .res-view-btn { background:none; border:none; color:var(--color-text-muted); font-size:12px; font-weight:700; padding:6px 14px; border-radius:6px; cursor:pointer; text-transform:uppercase; letter-spacing:0.05em; transition:all 0.2s; }\n  .res-view-btn.active { background:var(--color-pink); color:white; }\n  .res-icon-btn { background:#1c1c1e; border:1px solid #2c2c2e; border-radius:8px; color:var(--color-text-muted); padding:8px 10px; cursor:pointer; font-size:16px; transition:all 0.2s; display:flex; align-items:center; }\n  .res-icon-btn:hover { color:white; border-color:#444; }\n  .res-icon-btn.loading i { animation:res-spin 0.7s linear infinite; }\n  @keyframes res-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }\n  .res-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; margin-top:20px; }\n  .res-card { background:#121214; border:1px solid #1c1c1e; border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; transition:border-color 0.2s,transform 0.15s; }\n  .res-card:hover { border-color:#2c2c2e; transform:translateY(-1px); }\n  .res-card.our-team { border-color:rgba(255,0,255,0.5); background:linear-gradient(135deg,#121214 0%,#1a0a10 100%); }\n  .res-card.our-team:hover { border-color:rgba(255,0,255,0.85); }\n  .res-card-top { display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--color-text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }\n  .res-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; }\n  .res-badge.played    { background:#1c2b1c; color:#4caf50; }\n  .res-badge.scheduled { background:#1c1f2e; color:#7986cb; }\n  .res-badge.unknown   { background:#2b2b1c; color:#ffc107; }\n  .res-badge.live      { background:#2b1c1c; color:#ef5350; animation:pulse-badge 1.4s ease-in-out infinite; }\n  .res-badge.our-match { background:rgba(255,0,255,0.15); color:var(--color-pink); margin-left:4px; }\n  @keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:0.6} }\n  .res-teams { display:flex; align-items:center; gap:12px; }\n  .res-team { flex:1; display:flex; flex-direction:column; gap:3px; }\n  .res-team.away { align-items:flex-end; text-align:right; }\n  .res-team-name { font-size:13px; font-weight:700; line-height:1.2; color:white; }\n  .res-team-name.our-name { color:var(--color-pink); }\n  .res-score-block { display:flex; flex-direction:column; align-items:center; gap:2px; min-width:56px; }\n  .res-score { font-family:var(--font-display); font-size:26px; font-weight:800; letter-spacing:0.05em; color:white; }\n  .res-score.win  { color:#4caf50; }\n  .res-score.loss { color:#ef5350; }\n  .res-score.vs   { font-size:16px; color:var(--color-text-muted); font-weight:600; }\n  .res-time-label { font-size:11px; color:var(--color-text-muted); font-weight:600; }\n  .res-table-wrap { margin-top:20px; overflow-x:auto; border-radius:10px; border:1px solid #1c1c1e; }\n  .res-table { width:100%; border-collapse:collapse; font-size:13px; }\n  .res-table th { background:#0e0e10; color:var(--color-text-muted); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; padding:10px 16px; text-align:left; border-bottom:1px solid #1c1c1e; }\n  .res-table th.center { text-align:center; }\n  .res-table td { padding:12px 16px; border-bottom:1px solid #111; color:white; font-weight:500; }\n  .res-table td.center { text-align:center; }\n  .res-table tr:last-child td { border-bottom:none; }\n  .res-table tr:hover td { background:#161618; }\n  .res-table tr.our-row td { background:rgba(255,0,255,0.07); }\n  .res-table tr.our-row:hover td { background:rgba(255,0,255,0.12); }\n  .res-pos { font-family:var(--font-display); font-weight:800; font-size:15px; color:var(--color-text-muted); min-width:28px; }\n  .pos-medal { font-size:16px; }\n  .res-team-cell { display:flex; align-items:center; gap:8px; }\n  .res-team-dot { width:6px; height:6px; border-radius:50%; background:var(--color-pink); flex-shrink:0; }\n  .res-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; color:var(--color-text-muted); gap:12px; text-align:center; }\n  .res-empty i { font-size:48px; opacity:0.4; }\n  .res-empty-title { font-size:16px; font-weight:700; }\n  .res-empty-sub { font-size:13px; opacity:0.6; max-width:360px; }\n  .res-loading-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:14px; margin-top:20px; }\n  .res-skel-card { background:#121214; border:1px solid #1c1c1e; border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }\n  .res-last-update { font-size:11px; color:var(--color-text-muted); margin-top:16px; text-align:right; }\n  .res-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.15s ease; }\n  @keyframes fadeIn { from{opacity:0} to{opacity:1} }\n  .res-modal { background:#121214; border:1px solid #2c2c2e; border-radius:14px; padding:28px 32px; width:520px; max-width:95vw; max-height:85vh; overflow-y:auto; display:flex; flex-direction:column; gap:20px; }\n  .res-modal-title { font-family:var(--font-display); font-size:18px; font-weight:800; color:white; }\n  .res-modal-section { display:flex; flex-direction:column; gap:12px; }\n  .res-modal-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-text-muted); }\n  .res-form-row { display:flex; flex-direction:column; gap:6px; }\n  .res-form-label { font-size:12px; font-weight:600; color:var(--color-text-muted); }\n  .res-form-input { background:#1c1c1e; border:1px solid #2c2c2e; border-radius:8px; color:white; font-size:13px; padding:9px 12px; width:100%; box-sizing:border-box; outline:none; transition:border-color 0.2s; font-family:var(--font-body),sans-serif; }\n  .res-form-input:focus { border-color:var(--color-pink); }\n  .res-form-input::placeholder { color:#555; }\n  .res-form-hint { font-size:11px; color:var(--color-text-muted); margin-top:2px; line-height:1.4; }\n  .res-campionato-list { display:flex; flex-direction:column; gap:8px; }\n  .res-campionato-item { display:flex; align-items:center; gap:10px; background:#1c1c1e; border-radius:8px; padding:10px 14px; }\n  .res-campionato-item-label { flex:1; font-size:13px; font-weight:600; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }\n  .res-campionato-item-url { font-size:10px; color:var(--color-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }\n  .res-del-btn { background:none; border:1px solid #3c1c1c; border-radius:6px; color:#ef5350; padding:4px 8px; cursor:pointer; font-size:13px; flex-shrink:0; transition:background 0.2s; }\n  .res-del-btn:hover { background:rgba(239,83,80,0.1); }\n  .res-modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:4px; }\n</style>\n\n<div class="res-container">\n  <div class="res-header">\n    <div class="res-title-block">\n      <div class="res-title">🏐 Risultati</div>\n      <div class="res-subtitle">Portale Federale Pallavolo</div>\n    </div>\n    <div class="res-toolbar">\n      <select id="res-campionato-select" class="res-select">\n        <option value="">Caricamento campionati...</option>\n      </select>\n      <div class="res-view-toggle" style="display:none;">\n        \x3c!-- Pulsanti rimossi su richiesta --\x3e\n      </div>\n      <button class="res-icon-btn" id="res-sync-btn" title="Sincronizza con portale" onclick="Results._sync()">\n        <i class="ph ph-cloud-arrow-down"></i>\n      </button>\n      <button class="res-icon-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">\n        <i class="ph ph-arrows-clockwise"></i>\n      </button>\n      <button class="res-icon-btn" id="res-manage-btn" title="Gestisci campionati" onclick="Results._openManage()">\n        <i class="ph ph-gear"></i>\n      </button>\n    </div>\n  </div>\n  <div id="res-content">${d()}</div>\n</div>`));
        })(),
        p(),
        await o());
    },
    destroy: function () {
      (e.abort(), (e = new AbortController()));
    },
    _switchView(e) {
      ((s = e), p(), r());
    },
    async _refresh() {
      const e = document.getElementById("res-refresh-btn");
      (e && e.classList.add("loading"),
        Store.invalidate?.("getResults", "results"),
        Store.invalidate?.("getStandings", "results"),
        await r(),
        e && e.classList.remove("loading"),
        UI.toast("Risultati aggiornati", "success", 2e3));
    },
    async _sync() {
      if (!n?.id)
        return void UI.toast("Seleziona un campionato.", "warning", 2e3);
      const e = document.getElementById("res-sync-btn");
      e && (e.classList.add("loading"), (e.disabled = !0));
      try {
        UI.toast("Sincronizzazione in corso...", "info", 3e3);
        const e = await Store.api("sync", "results", { id: n.id });
        if (!e.success) throw new Error(e.error || "Errore sconosciuto");
        (e.standings > 0
          ? UI.toast(
              `Sincronizzazione completata: ${e.matches} partite, ${e.standings} squadre in classifica.`,
              "success",
              4e3,
            )
          : (UI.toast(
              `Sincronizzazione parziale: ${e.matches} partite trovate, classifica non disponibile.`,
              "warning",
              5e3,
            ),
            console.warn(
              "[Results] Sync: no standings found. URL:",
              e.standings_url ?? "n/a",
            )),
          Store.invalidate?.("getResults", "results"),
          Store.invalidate?.("getStandings", "results"),
          await r());
      } catch (e) {
        (console.error("[Results] sync error:", e),
          UI.toast("Errore sync: " + e.message, "error", 4e3));
      } finally {
        e && (e.classList.remove("loading"), (e.disabled = !1));
      }
    },
    _isOurTeam(e) {
      const t = e.toLowerCase();
      return (
        !/a\.?\s?p\.?\s?v\.?/i.test(t) &&
        ["fusion", "team volley", "fusionteam"].some((e) => t.includes(e))
      );
    },
    _openManage() {
      document.getElementById("res-manage-overlay")?.remove();
      const e =
          0 === t.length
            ? '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:10px 0;">Nessun campionato configurato.</div>'
            : t
                .map(
                  (e) =>
                    `\n<div class="res-campionato-item">\n  <div style="flex:1;min-width:0;">\n    <div class="res-campionato-item-label">${Utils.escapeHtml(e.label)}</div>\n    <div class="res-campionato-item-url">${Utils.escapeHtml(e.url)}</div>\n  </div>\n  <button class="res-del-btn" onclick="Results._deleteCampionato('${Utils.escapeHtml(e.id)}','${Utils.escapeHtml(e.label)}')">\n    <i class="ph ph-trash"></i>\n  </button>\n</div>`,
                )
                .join(""),
        n = document.createElement("div");
      ((n.id = "res-manage-overlay"),
        (n.className = "res-modal-overlay"),
        (n.innerHTML = `\n<div class="res-modal">\n  <div class="res-modal-title">⚙️ Gestisci Campionati</div>\n\n  <div class="res-modal-section">\n    <div class="res-modal-section-title">Aggiungi campionato</div>\n    <div class="res-form-row">\n      <label class="res-form-label" for="res-new-label">Nome campionato</label>\n      <input type="text" id="res-new-label" class="res-form-input" placeholder="es. Serie C Femminile Girone B">\n    </div>\n    <div class="res-form-row">\n      <label class="res-form-label" for="res-new-url">URL del portale (calendario/risultati)</label>\n      <input type="url" id="res-new-url" class="res-form-input" placeholder="https://venezia.portalefipav.net/risultati-classifiche.aspx?...">\n      <div class="res-form-hint">\n        Portali supportati: <strong>venezia.portalefipav.net</strong> · <strong>fipavveneto.net</strong> · <strong>federvolley.it</strong> · <strong>legavolley.it</strong>\n      </div>\n    </div>\n    <button class="btn btn-primary btn-sm" id="res-add-btn" onclick="Results._addCampionato()" style="align-self:flex-start;">\n      <i class="ph ph-plus"></i> Aggiungi e Sincronizza\n    </button>\n  </div>\n\n  <div class="res-modal-section">\n    <div class="res-modal-section-title">Campionati configurati</div>\n    <div class="res-campionato-list" id="res-campionato-list">${e}</div>\n  </div>\n\n  <div class="res-modal-footer">\n    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('res-manage-overlay')?.remove()">Chiudi</button>\n  </div>\n</div>`),
        n.addEventListener("click", (e) => {
          e.target === n && n.remove();
        }),
        document.body.appendChild(n));
    },
    async _addCampionato() {
      const e = document.getElementById("res-new-label")?.value.trim(),
        t = document.getElementById("res-new-url")?.value.trim();
      if (!e || !t)
        return void UI.toast("Compila nome e URL.", "warning", 2500);
      if (!t.startsWith("http"))
        return void UI.toast(
          "URL non valido — deve iniziare con https://",
          "error",
          3e3,
        );
      const n = document.getElementById("res-add-btn");
      n &&
        ((n.disabled = !0),
        (n.innerHTML = '<i class="ph ph-spinner"></i> Sincronizzazione...'));
      try {
        (await Store.api("addCampionato", "results", { label: e, url: t }),
          UI.toast("Campionato aggiunto e sincronizzato!", "success", 3e3),
          document.getElementById("res-manage-overlay")?.remove(),
          Store.invalidate?.("getCampionati", "results"),
          await o());
      } catch (e) {
        (console.error("[Results] addCampionato error:", e),
          UI.toast(
            "Errore: " + (e.message || "Errore sconosciuto"),
            "error",
            4e3,
          ),
          n &&
            ((n.disabled = !1),
            (n.innerHTML =
              '<i class="ph ph-plus"></i> Aggiungi e Sincronizza')));
      }
    },
    async _deleteCampionato(e, t) {
      confirm(`Rimuovere il campionato "${t}"?`) &&
        (await (async () => {
          try {
            (await Store.api("deleteCampionato", "results", { id: e }),
              UI.toast("Campionato rimosso.", "success", 2500),
              document.getElementById("res-manage-overlay")?.remove(),
              Store.invalidate?.("getCampionati", "results"),
              await o());
          } catch (e) {
            (console.error("[Results] deleteCampionato error:", e),
              UI.toast("Errore: " + e.message, "error", 3e3));
          }
        })());
    },
  };
})();
window.Results = Results;
