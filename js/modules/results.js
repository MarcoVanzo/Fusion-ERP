"use strict";
const Results = (() => {
  let e = new AbortController(),
    t = [],
    n = null,
    s = "matches";
  function _buildDropdown() {
    const wrapper = document.getElementById("res-champ-dropdown");
    if (!wrapper) return;
    wrapper.innerHTML = "";
    if (0 === t.length) {
      wrapper.innerHTML = `<div class="res-champ-trigger res-champ-empty">Nessun campionato configurato</div>`;
      l("Nessun campionato configurato", "Aggiungi un campionato tramite il tasto ⚙️ in alto a destra.\nPortali supportati: venezia.portalefipav.net · fipavveneto.net · federvolley.it");
      return;
    }
    const first = t[0];
    const fusionLogo = "/demo/assets/logo-colorato.png";
    const logoHtml = (hasFusion) => hasFusion
      ? `<img class="res-champ-fusion-logo" src="${fusionLogo}" alt="Fusion" onerror="this.style.display='none'">`
      : "";
    const trigger = document.createElement("div");
    trigger.className = "res-champ-trigger";
    trigger.id = "res-champ-trigger";
    trigger.innerHTML = `${logoHtml(first.has_our_team)}<span class="res-champ-label">${Utils.escapeHtml(first.label)}</span><i class="ph ph-caret-down res-champ-arrow"></i>`;
    const list = document.createElement("div");
    list.className = "res-champ-list";
    list.id = "res-champ-list";
    t.forEach((camp) => {
      const opt = document.createElement("div");
      opt.className = "res-champ-option" + (camp.id === first.id ? " active" : "");
      opt.dataset.id = camp.id;
      opt.dataset.url = camp.url || "";
      opt.dataset.label = camp.label;
      opt.innerHTML = `${logoHtml(camp.has_our_team)}<span>${Utils.escapeHtml(camp.label)}</span>`;
      opt.addEventListener("click", () => {
        n = { id: camp.id, url: camp.url || "", label: camp.label };
        trigger.innerHTML = `${logoHtml(camp.has_our_team)}<span class="res-champ-label">${Utils.escapeHtml(camp.label)}</span><i class="ph ph-caret-down res-champ-arrow"></i>`;
        list.querySelectorAll(".res-champ-option").forEach(o => o.classList.remove("active"));
        opt.classList.add("active");
        list.classList.remove("open");
        trigger.classList.remove("open");
        r();
      });
      list.appendChild(opt);
    });
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = list.classList.contains("open");
      list.classList.toggle("open", !isOpen);
      trigger.classList.toggle("open", !isOpen);
    });
    document.addEventListener("click", function closeDropdown(e) {
      if (!wrapper.contains(e.target)) {
        list.classList.remove("open");
        trigger.classList.remove("open");
      }
    });
    wrapper.appendChild(trigger);
    wrapper.appendChild(list);
    n = { id: first.id, url: first.url || "", label: first.label };
  }
  async function o() {
    try {
      const e = await Store.get("getCampionati", "results");
      t = e.campionati || [];
      _buildDropdown();
      if (t.length > 0) await r();
    } catch (e) {
      (console.error("[Results] getCampionati error:", e),
        c("Impossibile caricare i campionati. " + (e.message || "")));
    }
  }
  function a() {
    // legacy — mantenuta per compatibilità
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
                e.source_url || n?.url || "";
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
              d += `<div class="res-last-update">Aggiornato: ${o}${a ? ` &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(a)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a>` : ""}</div>`;
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
                e.source_url || n?.url || "";
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
                return `\n      <tr class="${s ? "our-row" : ""}">\n        <td class="center">${n <= 3 ? `<span class="pos-medal">${r[n - 1]}</span>` : `<span class="res-pos">${n}</span>`}</td>\n        <td>\n          <div class="res-team-cell">\n            ${e.logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.logo)}" alt="" onerror="this.style.display='none'">` : ""}\n            ${s ? '<div class="res-team-dot"></div>' : ""}\n            <span style="${s ? "color:var(--color-pink);font-weight:700;" : ""}">${Utils.escapeHtml(e.team || "—")}</span>\n          </div>\n        </td>\n        <td class="center">${e.played ?? "—"}</td>\n        <td class="center" style="color:#4caf50;">${e.won ?? "—"}</td>\n        <td class="center" style="color:#ef5350;">${e.lost ?? "—"}</td>\n        <td class="center"><strong style="font-size:15px;">${e.points ?? "—"}</strong></td>\n      </tr>`;
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
              i += `<div class="res-last-update">Aggiornato: ${o}${a ? ` &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(a)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a>` : ""}</div>`;
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
    const hLogo = e.home_logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.home_logo)}" alt="" onerror="this.style.display='none'">` : "",
      aLogo = e.away_logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.away_logo)}" alt="" onerror="this.style.display='none'">` : "";
    return `\n<div class="res-card${t ? " our-team" : ""}">\n  <div class="res-card-top">\n    <span>${Utils.escapeHtml(r)}</span>\n    <span>${s}${o}</span>\n  </div>\n  <div class="res-teams">\n    <div class="res-team">${hLogo}<div class="${i}">${Utils.escapeHtml(e.home || "Casa")}</div></div>\n    <div class="res-score-block">${c}</div>\n    <div class="res-team away"><div class="${l}">${Utils.escapeHtml(e.away || "Ospite")}</div>${aLogo}</div>\n  </div>\n</div>`;
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
            !document.getElementById("res-css-link") && (function () {
              const link = document.createElement("link");
              link.id = "res-css-link";
              link.rel = "stylesheet";
              link.href = "css/results.css?v=" + Date.now();
              document.head.appendChild(link);
            })(),
            (e.innerHTML = `\n<div class="res-container">\n  <div class="res-header">\n    <div class="res-title-block">\n      <div class="res-title">🏐 Risultati</div>\n      <div class="res-subtitle">Portale Federale Pallavolo</div>\n    </div>\n    <div class="res-toolbar">\n      <div id="res-champ-dropdown" class="res-champ-dropdown">\n        <div class="res-champ-trigger" id="res-champ-trigger">\n          <span class="res-champ-label">Caricamento campionati...</span>\n          <i class="ph ph-caret-down res-champ-arrow"></i>\n        </div>\n      </div>\n      <button class="res-icon-btn" id="res-sync-btn" title="Sincronizza con portale" onclick="Results._sync()">\n        <i class="ph ph-cloud-arrow-down"></i>\n      </button>\n      <button class="res-icon-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">\n        <i class="ph ph-arrows-clockwise"></i>\n      </button>\n      <button class="res-icon-btn" id="res-manage-btn" title="Gestisci campionati" onclick="Results._openManage()">\n        <i class="ph ph-gear"></i>\n      </button>\n    </div>\n  </div>\n  <div id="res-content">${d()}</div>\n</div>`));
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
