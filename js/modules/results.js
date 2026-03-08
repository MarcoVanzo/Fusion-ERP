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
            let lastPlayedRound = null;
            let maxPlayedRoundNum = -1;
            s.forEach((e) => {
              const t = e.round || "Altre";
              if (e.status === "played" && t !== "Altre") {
                const rNum = parseInt(t);
                if (!isNaN(rNum) && rNum > maxPlayedRoundNum) {
                  maxPlayedRoundNum = rNum;
                  lastPlayedRound = t;
                }
              }
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
                const isCurrent = lastPlayedRound && e === lastPlayedRound;
                d += `\n<div ${isCurrent ? 'id="res-last-played-round"' : ''} style="font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.9);margin-top:${0 === t ? "24px" : "44px"};margin-bottom:18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;text-shadow:0 0 10px rgba(255,255,255,0.1);"><i class="ph ph-calendar-blank" style="color:var(--color-pink);font-size:18px;filter:drop-shadow(0 0 10px rgba(255,0,255,0.4));"></i>\n  ${"Altre" === e ? "Partite senza giornata" : "Giornata " + e}\n</div>\n<div class="res-grid">${n.map(i).join("")}</div>`;
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
            if (lastPlayedRound) {
              setTimeout(() => {
                const el = document.getElementById("res-last-played-round");
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 150);
            }
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
            (e.innerHTML = `\n<style>
  /* ── Results Module ──────────────────────────────── */
  .res-container { padding:32px 40px; color:white; background:#0a0a0c; min-height:100%; font-family:var(--font-body),sans-serif; }
  .res-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
  .res-title-block { display:flex; flex-direction:column; gap:6px; }
  .res-title { font-family:var(--font-display); font-size:32px; font-weight:900; letter-spacing:-0.03em; color:white; text-shadow:0 0 30px rgba(255,255,255,0.15); }
  .res-subtitle { font-size:13px; color:var(--color-pink); font-weight:800; text-transform:uppercase; letter-spacing:0.1em; text-shadow:0 0 12px rgba(255,0,255,0.4); }
  .res-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .res-select { background:rgba(28,28,30,0.5); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:white; font-size:14px; font-family:var(--font-body),sans-serif; font-weight:700; padding:10px 16px; cursor:pointer; outline:none; min-width:260px; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); box-shadow:0 8px 24px rgba(0,0,0,0.3); appearance:none; }
  .res-select:hover,.res-select:focus { border-color:var(--color-pink); background:rgba(38,38,40,0.7); box-shadow:0 0 20px rgba(255,0,255,0.25); transform:translateY(-1px); }
  .res-view-toggle { display:none; }
  .res-icon-btn { background:rgba(28,28,30,0.5); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); border:1px solid rgba(255,255,255,0.08); border-radius:12px; color:var(--color-text-muted); padding:10px 14px; cursor:pointer; font-size:20px; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
  .res-icon-btn:hover { color:white; border-color:rgba(255,255,255,0.3); background:rgba(255,255,255,0.1); transform:translateY(-2px); box-shadow:0 12px 30px rgba(0,0,0,0.4); }
  .res-icon-btn.loading i { animation:res-spin 0.8s cubic-bezier(0.4,0,0.2,1) infinite; }
  @keyframes res-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .res-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(350px,1fr)); gap:24px; margin-top:24px; padding-bottom:40px; }
  .res-card { background:rgba(18,18,20,0.6); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.06); border-radius:20px; padding:24px 28px; display:flex; flex-direction:column; gap:16px; transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1); box-shadow:0 15px 35px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05); position:relative; overflow:hidden; cursor:default; }
  .res-card::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.08) 0%, transparent 70%); opacity:0; transition:opacity 0.4s ease; pointer-events:none; }
  .res-card:hover { transform:translateY(-6px) scale(1.02); border-color:rgba(255,255,255,0.15); box-shadow:0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); z-index:2; }
  .res-card:hover::before { opacity:1; }
  .res-card.our-team { border-color:rgba(255,0,255,0.3); background:linear-gradient(150deg, rgba(35,15,35,0.85) 0%, rgba(18,18,24,0.95) 100%); box-shadow:0 15px 40px rgba(255,0,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05); }
  .res-card.our-team::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, transparent, var(--color-pink), transparent); opacity:0.6; }
  .res-card.our-team:hover { border-color:rgba(255,0,255,0.6); box-shadow:0 30px 60px rgba(255,0,255,0.2), 0 0 25px rgba(255,0,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1); }
  .res-card-top { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--color-text-muted); font-weight:800; text-transform:uppercase; letter-spacing:0.1em; z-index:1; }
  .res-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:24px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition:all 0.3s; }
  .res-badge.played    { background:rgba(76,175,80,0.15); color:#81c784; border:1px solid rgba(76,175,80,0.25); }
  .res-badge.scheduled { background:rgba(121,134,203,0.15); color:#9fa8da; border:1px solid rgba(121,134,203,0.25); }
  .res-badge.unknown   { background:rgba(255,193,7,0.15); color:#ffd54f; border:1px solid rgba(255,193,7,0.25); }
  .res-badge.live      { background:rgba(239,83,80,0.2); color:#e57373; border:1px solid rgba(239,83,80,0.4); animation:pulse-badge 1.5s cubic-bezier(0.4,0,0.2,1) infinite; box-shadow:0 0 16px rgba(239,83,80,0.5); }
  .res-badge.our-match { background:rgba(255,0,255,0.15); color:var(--color-pink); border:1px solid rgba(255,0,255,0.3); margin-left:8px; box-shadow:0 0 16px rgba(255,0,255,0.3); }
  @keyframes pulse-badge { 0%{box-shadow:0 0 0 0 rgba(239,83,80,0.5);} 70%{box-shadow:0 0 0 8px rgba(239,83,80,0);} 100%{box-shadow:0 0 0 0 rgba(239,83,80,0);} }
  .res-teams { display:flex; align-items:center; justify-content:space-between; gap:20px; z-index:1; }
  .res-team { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; }
  .res-team.away { align-items:flex-end; text-align:right; }
  .res-team-name { font-size:16px; font-weight:800; line-height:1.4; color:rgba(255,255,255,0.9); transition:color 0.2s; }
  .res-card:hover .res-team-name { color:white; }
  .res-team-name.our-name { color:white; text-shadow:0 0 15px rgba(255,0,255,0.5); font-size:17px; }
  .res-score-block { display:flex; flex-direction:row; align-items:center; justify-content:center; gap:10px; min-width:90px; background:rgba(0,0,0,0.4); padding:10px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.06); box-shadow:inset 0 2px 10px rgba(0,0,0,0.3); }
  .res-score { font-family:var(--font-display); font-size:32px; font-weight:900; letter-spacing:0.02em; color:white; line-height:1; }
  .res-score.win  { color:#69f0ae; text-shadow:0 0 20px rgba(105,240,174,0.4); }
  .res-score.loss { color:#ff5252; text-shadow:0 0 20px rgba(255,82,82,0.4); }
  .res-score.vs   { font-size:18px; color:rgba(255,255,255,0.4); font-weight:800; text-transform:uppercase; letter-spacing:0.1em; }
  .res-time-label { font-size:16px; color:rgba(255,255,255,0.3); font-weight:700; }
  .res-table-wrap { margin-top:32px; overflow-x:auto; border-radius:20px; background:rgba(18,18,20,0.6); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.06); box-shadow:0 15px 40px rgba(0,0,0,0.3); }
  .res-table { width:100%; border-collapse:separate; border-spacing:0; font-size:15px; }
  .res-table th { background:rgba(0,0,0,0.5); color:var(--color-text-muted); font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; padding:18px 20px; text-align:left; border-bottom:1px solid rgba(255,255,255,0.08); position:sticky; top:0; z-index:2; backdrop-filter:blur(10px); }
  .res-table th.center { text-align:center; }
  .res-table td { padding:18px 20px; border-bottom:1px solid rgba(255,255,255,0.04); color:rgba(255,255,255,0.9); font-weight:600; transition:all 0.2s ease; }
  .res-table td.center { text-align:center; }
  .res-table tr:last-child td { border-bottom:none; }
  .res-table tr:hover td { background:rgba(255,255,255,0.04); transform:translateY(-1px); }
  .res-table tr.our-row { position:relative; }
  .res-table tr.our-row td { background:rgba(255,0,255,0.08); position:relative; z-index:1; }
  .res-table tr.our-row:hover td { background:rgba(255,0,255,0.12); }
  .res-table tr.our-row td:first-child::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--color-pink); box-shadow:0 0 12px var(--color-pink); }
  .res-table td strong { font-size:18px; font-weight:900; }
  .res-pos { font-family:var(--font-display); font-weight:900; font-size:18px; color:rgba(255,255,255,0.3); min-width:32px; display:inline-block; transition:color 0.2s; }
  .res-table tr:hover .res-pos { color:rgba(255,255,255,0.6); }
  .pos-medal { font-size:26px; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4)); display:inline-block; transform:translateY(-2px); transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  .res-table tr:hover .pos-medal { transform:translateY(-2px) scale(1.15); }
  .res-team-cell { display:flex; align-items:center; gap:12px; }
  .res-team-dot { width:10px; height:10px; border-radius:50%; background:var(--color-pink); flex-shrink:0; box-shadow:0 0 12px var(--color-pink); }
  .res-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:100px 20px; color:var(--color-text-muted); gap:20px; text-align:center; background:rgba(18,18,20,0.5); border-radius:24px; border:2px dashed rgba(255,255,255,0.06); margin-top:24px; transition:all 0.3s; }
  .res-empty:hover { border-color:rgba(255,255,255,0.15); background:rgba(18,18,20,0.7); }
  .res-empty i { font-size:72px; opacity:0.3; background:linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.3)); }
  .res-empty-title { font-size:22px; font-weight:900; color:white; letter-spacing:-0.02em; }
  .res-empty-sub { font-size:15px; opacity:0.8; max-width:440px; line-height:1.6; }
  .res-loading-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(350px,1fr)); gap:24px; margin-top:24px; }
  .res-skel-card { background:rgba(18,18,20,0.6); -webkit-backdrop-filter:blur(24px); backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.06); border-radius:20px; padding:24px 28px; display:flex; flex-direction:column; gap:16px; box-shadow:0 15px 35px rgba(0,0,0,0.2); }
  .res-last-update { font-size:13px; color:var(--color-text-muted); margin-top:24px; margin-bottom:48px; text-align:right; font-weight:700; padding:0 12px; opacity:0.7; }
  .res-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); z-index:9000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.25s cubic-bezier(0.4,0,0.2,1); }
  @keyframes fadeIn { from{opacity:0; backdrop-filter:blur(0px);} to{opacity:1; backdrop-filter:blur(8px);} }
  .res-modal { background:rgba(18,18,20,0.95); border:1px solid rgba(255,255,255,0.1); box-shadow:0 30px 80px rgba(0,0,0,0.6); border-radius:24px; padding:36px 44px; width:600px; max-width:92vw; max-height:85vh; overflow-y:auto; display:flex; flex-direction:column; gap:28px; transform-origin:center; animation:modalScale 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes modalScale { from{transform:scale(0.95); opacity:0;} to{transform:scale(1); opacity:1;} }
  .res-modal-title { font-family:var(--font-display); font-size:26px; font-weight:900; color:white; letter-spacing:-0.02em; }
  .res-modal-section { display:flex; flex-direction:column; gap:18px; }
  .res-modal-section-title { font-size:13px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:var(--color-pink); }
  .res-form-row { display:flex; flex-direction:column; gap:8px; }
  .res-form-label { font-size:14px; font-weight:700; color:rgba(255,255,255,0.8); }
  .res-form-input { background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:15px; padding:14px 16px; width:100%; box-sizing:border-box; outline:none; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); font-family:var(--font-body),sans-serif; }
  .res-form-input:focus { border-color:var(--color-pink); background:rgba(0,0,0,0.6); box-shadow:0 0 15px rgba(255,0,255,0.15); }
  .res-form-input::placeholder { color:rgba(255,255,255,0.3); }
  .res-form-hint { font-size:13px; color:var(--color-text-muted); margin-top:6px; line-height:1.5; }
  .res-campionato-list { display:flex; flex-direction:column; gap:12px; }
  .res-campionato-item { display:flex; align-items:center; gap:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:14px; padding:14px 20px; transition:all 0.2s; }
  .res-campionato-item:hover { background:rgba(255,255,255,0.06); transform:translateX(4px); border-color:rgba(255,255,255,0.1); }
  .res-campionato-item-label { flex:1; font-size:15px; font-weight:800; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .res-campionato-item-url { font-size:12px; color:rgba(255,255,255,0.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px; margin-top:2px; }
  .res-del-btn { background:rgba(239,83,80,0.1); border:1px solid rgba(239,83,80,0.2); border-radius:10px; color:#ef5350; padding:10px; cursor:pointer; font-size:18px; flex-shrink:0; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.2); }
  .res-del-btn:hover { background:rgba(239,83,80,0.2); border-color:rgba(239,83,80,0.4); transform:scale(1.1); box-shadow:0 8px 24px rgba(239,83,80,0.3); }
  .res-modal-footer { display:flex; justify-content:flex-end; gap:14px; margin-top:12px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.05); }\n</style>\n<div class="res-container">\n  <div class="res-header">\n    <div class="res-title-block">\n      <div class="res-title">🏐 Risultati</div>\n      <div class="res-subtitle">Portale Federale Pallavolo</div>\n    </div>\n    <div class="res-toolbar">\n      <select id="res-campionato-select" class="res-select">\n        <option value="">Caricamento campionati...</option>\n      </select>\n      <div class="res-view-toggle" style="display:none;">\n        <!-- Pulsanti rimossi su richiesta -->\n      </div>\n      <button class="res-icon-btn" id="res-sync-btn" title="Sincronizza con portale" onclick="Results._sync()">\n        <i class="ph ph-cloud-arrow-down"></i>\n      </button>\n      <button class="res-icon-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">\n        <i class="ph ph-arrows-clockwise"></i>\n      </button>\n      <button class="res-icon-btn" id="res-manage-btn" title="Gestisci campionati" onclick="Results._openManage()">\n        <i class="ph ph-gear"></i>\n      </button>\n    </div>\n  </div>\n  <div id="res-content">${d()}</div>\n</div>`));
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
