"use strict";
const Results = (() => {
  let e = new AbortController(),
    s = [],
    t = null,
    n = "matches";
  async function a() {
    try {
      const e = await Store.get("getCampionati", "results");
      ((s = e.campionati || []),
        (function () {
          const e = document.getElementById("res-champ-dropdown");
          if (!e) return;
          if (((e.innerHTML = ""), 0 === s.length))
            return (
              (e.innerHTML =
                '<div class="res-champ-trigger res-champ-empty">Nessun campionato configurato</div>'),
              void r(
                "Nessun campionato configurato",
                "Aggiungi un campionato tramite il tasto ⚙️ in alto a destra.\nPortali supportati: venezia.portalefipav.net · fipavveneto.net · federvolley.it",
              )
            );
          const n = s[0],
            a = (e) =>
              e
                ? '<img class="res-champ-fusion-logo" src="/assets/logo-colorato.png" alt="Fusion" onerror="this.style.display=\'none\'">'
                : "",
            o = document.createElement("div");
          ((o.className = "res-champ-trigger"),
            (o.id = "res-champ-trigger"),
            (o.innerHTML = `${a(n.has_our_team)}<span class="res-champ-label">${Utils.escapeHtml(n.label)}</span><i class="ph ph-caret-down res-champ-arrow"></i>`));
          const l = document.createElement("div");
          ((l.className = "res-champ-list"),
            (l.id = "res-champ-list"),
            s.forEach((e) => {
              const s = document.createElement("div");
              ((s.className =
                "res-champ-option" + (e.id === n.id ? " active" : "")),
                (s.dataset.id = e.id),
                (s.dataset.url = e.url || ""),
                (s.dataset.label = e.label),
                (s.innerHTML = `${a(e.has_our_team)}<span>${Utils.escapeHtml(e.label)}</span>`),
                s.addEventListener("click", () => {
                  ((t = { id: e.id, url: e.url || "", label: e.label }),
                    (o.innerHTML = `${a(e.has_our_team)}<span class="res-champ-label">${Utils.escapeHtml(e.label)}</span><i class="ph ph-caret-down res-champ-arrow"></i>`),
                    l
                      .querySelectorAll(".res-champ-option")
                      .forEach((e) => e.classList.remove("active")),
                    s.classList.add("active"),
                    l.classList.remove("open"),
                    o.classList.remove("open"),
                    i());
                }),
                l.appendChild(s));
            }),
            o.addEventListener("click", (e) => {
              e.stopPropagation();
              const s = l.classList.contains("open");
              (l.classList.toggle("open", !s), o.classList.toggle("open", !s));
            }),
            document.addEventListener("click", function (s) {
              e.contains(s.target) ||
                (l.classList.remove("open"), o.classList.remove("open"));
            }),
            e.appendChild(o),
            e.appendChild(l),
            (t = { id: n.id, url: n.url || "", label: n.label }));
        })(),
        s.length > 0 && (await i()));
    } catch (e) {
      (console.error("[Results] getCampionati error:", e),
        l("Impossibile caricare i campionati. " + (e.message || "")));
    }
  }
  async function i() {
    "matches" === n
      ? await (async function () {
          const e = document.getElementById("res-content");
          if ((e && (e.innerHTML = c()), !t?.id && !t?.url))
            return void r(
              "Nessun campionato selezionato",
              "Seleziona un campionato dal menu in alto.",
            );
          const s = t.id ? { campionato_id: t.id } : { campionato_url: t.url };
          try {
            const e = await Store.get("getResults", "results", s);
            if (e.needs_sync) {
              const e = document.getElementById("res-content");
              return void (
                e &&
                (e.innerHTML =
                  '\n<div class="res-empty">\n  <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>\n  <div class="res-empty-title">Partite non ancora sincronizzate</div>\n  <div class="res-empty-sub">Premi <strong>☁ Sincronizza</strong> per scaricare le partite dal portale.</div>\n  <button class="btn btn-primary btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora\n  </button>\n</div>')
              );
            }
            !(function (e) {
              const s = document.getElementById("res-content");
              if (!s) return;
              const n = e.matches || [],
                a = e.last_updated
                  ? new Date(e.last_updated).toLocaleString("it-IT")
                  : "",
                i = e.source_url || t?.url || "";
              if (0 === n.length)
                return void r(
                  "Nessuna partita trovata",
                  "Non ci sono partite disponibili per questo campionato.",
                );
              const l = {};
              let c = null,
                d = -1;
              n.forEach((e) => {
                const s = e.round || "Altre";
                if ("played" === e.status && "Altre" !== s) {
                  const e = parseInt(s);
                  !isNaN(e) && e > d && ((d = e), (c = s));
                }
                (l[s] || (l[s] = []), l[s].push(e));
              });
              const p = Object.keys(l).sort((e, s) =>
                "Altre" === e
                  ? 1
                  : "Altre" === s
                    ? -1
                    : parseInt(e) - parseInt(s),
              );
              let m = "";
              if (
                (p.forEach((e, s) => {
                  const t = l[e];
                  m += `\n<div ${c && e === c ? 'id="res-last-played-round"' : ""} style="font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.9);margin-top:${0 === s ? "24px" : "44px"};margin-bottom:18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;text-shadow:0 0 10px rgba(255,255,255,0.1);"><i class="ph ph-calendar-blank" style="color:var(--color-pink);font-size:18px;filter:drop-shadow(0 0 10px rgba(255,0,255,0.4));"></i>\n  ${"Altre" === e ? "Partite senza giornata" : "Giornata " + e}\n</div>\n<div class="res-grid">${t.map(o).join("")}</div>`;
                }),
                a)
              ) {
                const e = (() => {
                  try {
                    return new URL(i).hostname;
                  } catch (e) {
                    return "portale federale";
                  }
                })();
                m += `<div class="res-last-update">Aggiornato: ${a}${i ? ` &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(i)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a>` : ""}</div>`;
              }
              ((s.innerHTML = m),
                c &&
                  setTimeout(() => {
                    const e = document.getElementById("res-last-played-round");
                    e &&
                      e.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 150));
            })(e);
          } catch (e) {
            if ("AbortError" === e.name) return;
            (console.error("[Results] getResults error:", e),
              l("Impossibile caricare i risultati. " + (e.message || "")));
          }
        })()
      : await (async function () {
          const e = document.getElementById("res-content");
          if ((e && (e.innerHTML = c()), !t?.id && !t?.url))
            return void r(
              "Nessun campionato selezionato",
              "Seleziona un campionato dal menu in alto.",
            );
          const s = t.id ? { campionato_id: t.id } : { campionato_url: t.url };
          try {
            const e = await Store.get("getStandings", "results", s);
            if (e.needs_sync)
              return void (e.already_synced
                ? (function (e) {
                    const s = document.getElementById("res-content");
                    if (!s) return;
                    const t = e ? new Date(e).toLocaleString("it-IT") : "";
                    s.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-table" style="color:var(--color-text-muted);opacity:0.5;"></i>\n  <div class="res-empty-title">Classifica non disponibile</div>\n  <div class="res-empty-sub">\n    La sincronizzazione è avvenuta${t ? " il " + Utils.escapeHtml(t) : ""}, ma il portale non ha pubblicato la classifica per questo campionato.<br><br>\n    Prova a risincronizzare tra qualche minuto.\n  </div>\n  <button class="btn btn-ghost btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-arrows-clockwise"></i> Riprova sincronizzazione\n  </button>\n</div>`;
                  })(e.last_updated)
                : (function () {
                    const e = document.getElementById("res-content");
                    e &&
                      (e.innerHTML =
                        '\n<div class="res-empty">\n  <i class="ph ph-cloud-arrow-down" style="color:var(--color-pink);opacity:1;"></i>\n  <div class="res-empty-title">Classifica non ancora sincronizzata</div>\n  <div class="res-empty-sub">Premi il bottone <strong>☁ Sincronizza</strong> in alto a destra per caricare la classifica dal portale.</div>\n  <button class="btn btn-primary btn-sm" onclick="Results._sync()" style="margin-top:12px;">\n    <i class="ph ph-cloud-arrow-down"></i> Sincronizza ora\n  </button>\n</div>');
                  })());
            !(function (e) {
              const s = document.getElementById("res-content");
              if (!s) return;
              const n = e.standings || [],
                a = e.last_updated
                  ? new Date(e.last_updated).toLocaleString("it-IT")
                  : "",
                i = e.source_url || t?.url || "";
              if (0 === n.length)
                return void r(
                  "Classifica non disponibile",
                  "Non è stato possibile estrarre la classifica per questo campionato.",
                );
              const o = ["🥇", "🥈", "🥉"];
              let l = `\n<div class="res-table-wrap">\n  <table class="res-table">\n    <thead>\n      <tr>\n        <th class="center" style="width:50px;">#</th>\n        <th>Squadra</th>\n        <th class="center">PG</th>\n        <th class="center">V</th>\n        <th class="center">P</th>\n        <th class="center">Punti</th>\n      </tr>\n    </thead>\n    <tbody>\n${n
                .map((e, s) => {
                  const t = e.position ?? s + 1,
                    n = e.is_our_team;
                  return `\n      <tr class="${n ? "our-row" : ""}">\n        <td class="center">${t <= 3 ? `<span class="pos-medal">${o[t - 1]}</span>` : `<span class="res-pos">${t}</span>`}</td>\n        <td>\n          <div class="res-team-cell">\n            ${e.logo ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.logo)}" alt="" onerror="this.style.display='none'">` : ""}\n            ${n ? '<div class="res-team-dot"></div>' : ""}\n            <span style="${n ? "color:var(--color-pink);font-weight:700;" : ""}">${Utils.escapeHtml(e.team || "—")}</span>\n          </div>\n        </td>\n        <td class="center">${e.played ?? "—"}</td>\n        <td class="center" style="color:#4caf50;">${e.won ?? "—"}</td>\n        <td class="center" style="color:#ef5350;">${e.lost ?? "—"}</td>\n        <td class="center"><strong style="font-size:15px;">${e.points ?? "—"}</strong></td>\n      </tr>`;
                })
                .join("")}\n    </tbody>\n  </table>\n</div>`;
              if (a) {
                const e = (() => {
                  try {
                    return new URL(i).hostname;
                  } catch (e) {
                    return "portale federale";
                  }
                })();
                l += `<div class="res-last-update">Aggiornato: ${a}${i ? ` &nbsp;·&nbsp; Fonte: <a href="${Utils.escapeHtml(i)}" target="_blank" style="color:var(--color-text-muted);">${Utils.escapeHtml(e)}</a>` : ""}</div>`;
              }
              s.innerHTML = l;
            })(e);
          } catch (e) {
            if ("AbortError" === e.name) return;
            (console.error("[Results] getStandings error:", e),
              l("Impossibile caricare la classifica. " + (e.message || "")));
          }
        })();
  }
  function o(e) {
    const s = e.is_our_team,
      t = "played" === e.status,
      n =
        "live" === e.status
          ? '<span class="res-badge live"><i class="ph ph-circle" style="font-size:8px;"></i> Live</span>'
          : t
            ? '<span class="res-badge played"><i class="ph ph-check-circle"></i> Giocata</span>'
            : "unknown" === e.status
              ? '<span class="res-badge unknown"><i class="ph ph-question"></i> Da omologare</span>'
              : '<span class="res-badge scheduled"><i class="ph ph-clock"></i> In programma</span>',
      a = s
        ? '<span class="res-badge our-match"><i class="ph ph-star-four"></i> Noi</span>'
        : "";
    let i = { home: "", away: "" };
    if (t && s) {
      const s = Results._isOurTeam(e.home || ""),
        t = Results._isOurTeam(e.away || "");
      s
        ? ((i.home = (e.sets_home || 0) > (e.sets_away || 0) ? "win" : "loss"),
          (i.away = "win" === i.home ? "loss" : "win"))
        : t &&
          ((i.away = (e.sets_away || 0) > (e.sets_home || 0) ? "win" : "loss"),
          (i.home = "win" === i.away ? "loss" : "win"));
    }
    const o = e.date
        ? `${e.date}${e.time ? " · " + e.time : ""}`
        : e.time || "—",
      r = Results._isOurTeam(e.home || "")
        ? "res-team-name our-name"
        : "res-team-name",
      l = Results._isOurTeam(e.away || "")
        ? "res-team-name our-name"
        : "res-team-name",
      c =
        t && e.score
          ? `<div class="res-score ${i.home}">${e.sets_home ?? ""}</div><div class="res-time-label">-</div><div class="res-score ${i.away}">${e.sets_away ?? ""}</div>`
          : '<div class="res-score vs">vs</div>',
      d = e.home_logo
        ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.home_logo)}" alt="" onerror="this.style.display='none'">`
        : "",
      p = e.away_logo
        ? `<img class="res-team-logo" src="${Utils.escapeHtml(e.away_logo)}" alt="" onerror="this.style.display='none'">`
        : "";
    return `\n<div class="res-card${s ? " our-team" : ""}">\n  <div class="res-card-top">\n    <span>${Utils.escapeHtml(o)}</span>\n    <span>${n}${a}</span>\n  </div>\n  <div class="res-teams">\n    <div class="res-team">${d}<div class="${r}">${Utils.escapeHtml(e.home || "Casa")}</div></div>\n    <div class="res-score-block">${c}</div>\n    <div class="res-team away"><div class="${l}">${Utils.escapeHtml(e.away || "Ospite")}</div>${p}</div>\n  </div>\n</div>`;
  }
  function r(e, s) {
    const t = document.getElementById("res-content");
    t &&
      (t.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-volleyball"></i>\n  <div class="res-empty-title">${Utils.escapeHtml(e)}</div>\n  <div class="res-empty-sub">${Utils.escapeHtml(s)}</div>\n</div>`);
  }
  function l(e) {
    const s = document.getElementById("res-content");
    s &&
      (s.innerHTML = `\n<div class="res-empty">\n  <i class="ph ph-warning-circle" style="color:#ef5350;opacity:1;"></i>\n  <div class="res-empty-title">Errore di connessione</div>\n  <div class="res-empty-sub">${Utils.escapeHtml(e)}</div>\n  <button class="btn btn-ghost btn-sm" onclick="Results._refresh()" style="margin-top:8px;">\n    <i class="ph ph-arrows-clockwise"></i> Riprova\n  </button>\n</div>`);
  }
  function c() {
    return `<div class="res-loading-grid">${Array.from({ length: 6 }, () => '\n<div class="res-skel-card">\n  <div class="skeleton skeleton-text" style="width:60%;"></div>\n  <div style="display:flex;gap:12px;align-items:center;">\n    <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>\n    <div class="skeleton skeleton-title" style="width:50px;"></div>\n    <div class="skeleton skeleton-text" style="flex:1;width:auto;"></div>\n  </div>\n</div>').join("")}</div>`;
  }
  function d() {
    document
      .querySelectorAll(".res-view-btn")
      .forEach((e) => e.classList.remove("active"));
    const e = document.getElementById(`res-btn-${n}`);
    e && e.classList.add("active");
  }
  return {
    init: async function () {
      e = new AbortController();
      const s = Router.getCurrentRoute();
      ((n = "results-standings" === s ? "standings" : "matches"),
        (function () {
          const e = document.getElementById("app");
          if (!e) return;
          const s = document.getElementById("main-content");
          (s &&
            ((s.style.padding = "0"), (s.style.backgroundColor = "#0a0a0c")),
            App.getUser(),
            !document.getElementById("res-css-link") &&
              (function () {
                const e = document.createElement("link");
                ((e.id = "res-css-link"),
                  (e.rel = "stylesheet"),
                  (e.href = "css/results.css?v=" + Date.now()),
                  document.head.appendChild(e));
              })(),
            (e.innerHTML = `\n<div class="res-container">\n  <div class="res-header">\n    <div class="res-title-block">\n      <div class="res-title">🏐 Risultati</div>\n      <div class="res-subtitle">Portale Federale Pallavolo</div>\n    </div>\n    <div class="res-toolbar">\n      <div id="res-champ-dropdown" class="res-champ-dropdown">\n        <div class="res-champ-trigger" id="res-champ-trigger">\n          <span class="res-champ-label">Caricamento campionati...</span>\n          <i class="ph ph-caret-down res-champ-arrow"></i>\n        </div>\n      </div>\n      <button class="res-icon-btn" id="res-sync-btn" title="Sincronizza con portale" onclick="Results._sync()">\n        <i class="ph ph-cloud-arrow-down"></i>\n      </button>\n      <button class="res-icon-btn" id="res-refresh-btn" title="Aggiorna" onclick="Results._refresh()">\n        <i class="ph ph-arrows-clockwise"></i>\n      </button>\n      <button class="res-icon-btn" id="res-manage-btn" title="Gestisci campionati" onclick="Results._openManage()">\n        <i class="ph ph-gear"></i>\n      </button>\n    </div>\n  </div>\n  <div id="res-content">${c()}</div>\n</div>`));
        })(),
        d(),
        await a());
    },
    destroy: function () {
      (e.abort(), (e = new AbortController()));
    },
    _switchView(e) {
      ((n = e), d(), i());
    },
    async _refresh() {
      const e = document.getElementById("res-refresh-btn");
      (e && e.classList.add("loading"),
        Store.invalidate?.("getResults", "results"),
        Store.invalidate?.("getStandings", "results"),
        await i(),
        e && e.classList.remove("loading"),
        UI.toast("Risultati aggiornati", "success", 2e3));
    },
    async _sync() {
      if (!t?.id)
        return void UI.toast("Seleziona un campionato.", "warning", 2e3);
      const e = document.getElementById("res-sync-btn");
      e && (e.classList.add("loading"), (e.disabled = !0));
      try {
        UI.toast("Sincronizzazione in corso...", "info", 3e3);
        const e = await Store.api("sync", "results", { id: t.id });
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
          await i());
      } catch (e) {
        (console.error("[Results] sync error:", e),
          UI.toast("Errore sync: " + e.message, "error", 4e3));
      } finally {
        e && (e.classList.remove("loading"), (e.disabled = !1));
      }
    },
    _isOurTeam(e) {
      const s = e.toLowerCase();
      return (
        !/a\.?\s?p\.?\s?v\.?/i.test(s) &&
        ["fusion", "team volley", "fusionteam"].some((e) => s.includes(e))
      );
    },
    _openManage() {
      document.getElementById("res-manage-overlay")?.remove();
      const e =
          0 === s.length
            ? '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:10px 0;">Nessun campionato configurato.</div>'
            : s
                .map(
                  (e) =>
                    `\n<div class="res-campionato-item">\n  <div style="flex:1;min-width:0;">\n    <div class="res-campionato-item-label">${Utils.escapeHtml(e.label)}</div>\n    <div class="res-campionato-item-url">${Utils.escapeHtml(e.url)}</div>\n  </div>\n  <button class="res-del-btn" onclick="Results._deleteCampionato('${Utils.escapeHtml(e.id)}','${Utils.escapeHtml(e.label)}')">\n    <i class="ph ph-trash"></i>\n  </button>\n</div>`,
                )
                .join(""),
        t = document.createElement("div");
      ((t.id = "res-manage-overlay"),
        (t.className = "res-modal-overlay"),
        (t.innerHTML = `\n<div class="res-modal">\n  <div class="res-modal-title">⚙️ Gestisci Campionati</div>\n\n  <div class="res-modal-section">\n    <div class="res-modal-section-title">Aggiungi campionato</div>\n    <div class="res-form-row">\n      <label class="res-form-label" for="res-new-label">Nome campionato</label>\n      <input type="text" id="res-new-label" class="res-form-input" placeholder="es. Serie C Femminile Girone B">\n    </div>\n    <div class="res-form-row">\n      <label class="res-form-label" for="res-new-url">URL del portale (calendario/risultati)</label>\n      <input type="url" id="res-new-url" class="res-form-input" placeholder="https://venezia.portalefipav.net/risultati-classifiche.aspx?...">\n      <div class="res-form-hint">\n        Portali supportati: <strong>venezia.portalefipav.net</strong> · <strong>fipavveneto.net</strong> · <strong>federvolley.it</strong> · <strong>legavolley.it</strong>\n      </div>\n    </div>\n    <button class="btn btn-primary btn-sm" id="res-add-btn" onclick="Results._addCampionato()" style="align-self:flex-start;">\n      <i class="ph ph-plus"></i> Aggiungi e Sincronizza\n    </button>\n  </div>\n\n  <div class="res-modal-section">\n    <div class="res-modal-section-title">Campionati configurati</div>\n    <div class="res-campionato-list" id="res-campionato-list">${e}</div>\n  </div>\n\n  <div class="res-modal-footer">\n    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('res-manage-overlay')?.remove()">Chiudi</button>\n  </div>\n</div>`),
        t.addEventListener("click", (e) => {
          e.target === t && t.remove();
        }),
        document.body.appendChild(t));
    },
    async _addCampionato() {
      const e = document.getElementById("res-new-label")?.value.trim(),
        s = document.getElementById("res-new-url")?.value.trim();
      if (!e || !s)
        return void UI.toast("Compila nome e URL.", "warning", 2500);
      if (!s.startsWith("http"))
        return void UI.toast(
          "URL non valido — deve iniziare con https://",
          "error",
          3e3,
        );
      const t = document.getElementById("res-add-btn");
      t &&
        ((t.disabled = !0),
        (t.innerHTML = '<i class="ph ph-spinner"></i> Sincronizzazione...'));
      try {
        (await Store.api("addCampionato", "results", { label: e, url: s }),
          UI.toast("Campionato aggiunto e sincronizzato!", "success", 3e3),
          document.getElementById("res-manage-overlay")?.remove(),
          Store.invalidate?.("getCampionati", "results"),
          await a());
      } catch (e) {
        (console.error("[Results] addCampionato error:", e),
          UI.toast(
            "Errore: " + (e.message || "Errore sconosciuto"),
            "error",
            4e3,
          ),
          t &&
            ((t.disabled = !1),
            (t.innerHTML =
              '<i class="ph ph-plus"></i> Aggiungi e Sincronizza')));
      }
    },
    async _deleteCampionato(e, s) {
      confirm(`Rimuovere il campionato "${s}"?`) &&
        (await (async () => {
          try {
            (await Store.api("deleteCampionato", "results", { id: e }),
              UI.toast("Campionato rimosso.", "success", 2500),
              document.getElementById("res-manage-overlay")?.remove(),
              Store.invalidate?.("getCampionati", "results"),
              await a());
          } catch (e) {
            (console.error("[Results] deleteCampionato error:", e),
              UI.toast("Errore: " + e.message, "error", 3e3));
          }
        })());
    },
  };
})();
window.Results = Results;
