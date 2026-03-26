"use strict";
const Transport = (() => {
  let t = new AbortController(),
    e = [],
    n = [],
    a = [],
    i = [],
    r = null,
    o = null,
    s = [],
    l = null,
    d = new Map();
  async function p() {
    const t = document.getElementById("app");
    if (t) {
      (UI.loading(!0), (t.innerHTML = UI.skeletonPage()));
      try {
        ((e = await Store.get("listEvents", "transport")),
          "transport-drivers" ===
          ("undefined" != typeof Router ? Router.getCurrentRoute() : null)
            ? B()
            : c());
      } catch (e) {
        ((t.innerHTML = Utils.emptyState(
          "Errore nel caricamento eventi",
          e.message,
        )),
          UI.toast("Errore caricamento eventi", "error"));
      } finally {
        UI.loading(!1);
      }
    }
  }
  function c() {
    const n = document.getElementById("app"),
      a = App.getUser(),
      i = ["admin", "manager", "operator"].includes(a?.role),
      r = {
        training: "Allenamento",
        away_game: "Trasferta",
        home_game: "Gara Casa",
        tournament: "Torneo",
      },
      o = e.length,
      s = e.filter((t) => new Date(t.event_date) >= new Date()).length,
      l = e.filter((t) => "away_game" === t.type).length;
    ((n.innerHTML = `                <div class="transport-dashboard">        <div class="dash-top-bar">          <div>            <h1 class="dash-title">Gestione <span style="color:var(--accent-pink);">Trasporti</span></h1>            <p class="dash-subtitle">${o} eventi nel sistema</p>          </div>          <div style="display:flex; gap:12px; flex-wrap:wrap;">            <button class="btn-dash" id="storico-btn" type="button"><i class="ph ph-clock-counter-clockwise" style="font-size:18px;"></i> STORICO</button>            <button class="btn-dash" id="autisti-btn" type="button"><i class="ph ph-steering-wheel" style="font-size:18px;"></i> AUTISTI</button>            <button class="btn-dash" id="mezzi-btn" type="button"><i class="ph ph-bus" style="font-size:18px;"></i> GESTIONE MEZZI</button>            <button class="btn-dash pink" id="nuovo-trasporto-btn" type="button"><i class="ph ph-van" style="font-size:18px;"></i> NUOVO TRASPORTO</button>            ${i ? '<button class="btn-dash primary" id="new-event-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NUOVO EVENTO</button>' : ""}          </div>        </div>        <div class="dash-stat-grid">          <div class="dash-stat-card">            <div class="dash-stat-title">Totale Eventi <div class="dash-stat-icon"><i class="ph ph-calendar-blank"></i></div></div>            <div class="dash-stat-value">${o}</div>          </div>          <div class="dash-stat-card cyan">            <div class="dash-stat-title">In Programma <div class="dash-stat-icon"><i class="ph ph-clock"></i></div></div>            <div class="dash-stat-value">${s}</div>          </div>          <div class="dash-stat-card">            <div class="dash-stat-title">Trasferte <div class="dash-stat-icon"><i class="ph ph-bus"></i></div></div>            <div class="dash-stat-value">${l}</div>          </div>          <div class="dash-stat-card cyan">            <div class="dash-stat-title">Allenamenti <div class="dash-stat-icon"><i class="ph ph-barbell"></i></div></div>            <div class="dash-stat-value">${e.filter((t) => "training" === t.type).length}</div>          </div>        </div>        <div class="dash-grid">          <div class="dash-card">            <div class="dash-card-header">              <div class="dash-card-title">PROSSIMI EVENTI</div>              <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>            </div>                        <div class="dash-filters">              <button class="dash-filter active" data-type-filter="" type="button">Tutti</button>              <button class="dash-filter" data-type-filter="away_game" type="button">Trasferte</button>              <button class="dash-filter" data-type-filter="home_game" type="button">Gare in Casa</button>              <button class="dash-filter" data-type-filter="training" type="button">Allenamenti</button>              <button class="dash-filter" data-type-filter="tournament" type="button">Tornei</button>            </div>            <div id="events-list">              ${g(e, r)}            </div>          </div>                    <div class="dash-card" style="display:flex; flex-direction:column; gap:20px;">             <div class="dash-card-header" style="margin-bottom:0;">              <div class="dash-card-title">AZIONI RAPIDE</div>              <div class="dash-card-dots"><i class="ph ph-dots-three-bold"></i></div>            </div>                                                 <div class="action-card" style="margin-top: -10px;">              <div class="action-icon-wrap" style="background: rgba(255, 0, 255,0.1); border-color: rgba(255, 0, 255,0.3); box-shadow: 0 0 20px rgba(255, 0, 255,0.2);">                <i class="ph ph-calendar-plus action-icon" style="color: var(--accent-pink);"></i>              </div>              <div class="action-title">Nuovo Evento</div>              <p class="action-desc">Crea un nuovo evento per gestire trasferte, gare e allenamenti.</p>              ${i ? '<button class="btn-dash" id="qa-new-event" style="width: 100%;" type="button"><i class="ph ph-plus-circle"></i> Crea Evento</button>' : ""}          </div>        </div>      </div>`),
      Utils.qsa("[data-type-filter]").forEach((n) =>
        n.addEventListener(
          "click",
          () => {
            (Utils.qsa("[data-type-filter]").forEach((t) =>
              t.classList.remove("active"),
            ),
              n.classList.add("active"));
            const t = n.dataset.typeFilter,
              a = t ? e.filter((e) => e.type === t) : e;
            ((document.getElementById("events-list").innerHTML = g(a, r)), m());
          },
          { signal: t.signal },
        ),
      ),
      document
        .getElementById("new-event-btn")
        ?.addEventListener("click", () => f(), { signal: t.signal }),
      document
        .getElementById("nuovo-trasporto-btn")
        ?.addEventListener("click", () => x(), { signal: t.signal }),
      document
        .getElementById("storico-btn")
        ?.addEventListener("click", () => L(), { signal: t.signal }),
      document
        .getElementById("autisti-btn")
        ?.addEventListener("click", () => B(), { signal: t.signal }),
      document
        .getElementById("mezzi-btn")
        ?.addEventListener("click", () => Router.navigate("transport-fleet"), {
          signal: t.signal,
        }),
      document
        .getElementById("qa-new-event")
        ?.addEventListener("click", () => f(), { signal: t.signal }),
      m());
  }
  function g(t, e) {
    if (0 === t.length)
      return Utils.emptyState(
        "Nessun evento programmato",
        "Crea il primo evento per iniziare a gestire le trasferte.",
      );
    const n = {};
    t.forEach((t) => {
      const e = new Date(t.event_date),
        a = isNaN(e)
          ? "Da definire"
          : e
              .toLocaleDateString("it-IT", { day: "numeric", month: "short" })
              .toUpperCase();
      (n[a] || (n[a] = []), n[a].push(t));
    });
    let a = "";
    for (const [t, i] of Object.entries(n))
      ((a += `<div class="dash-date-header">${t}</div>`),
        i.forEach((t) => {
          a += b(t, e);
        }));
    return a;
  }
  function m() {
    Utils.qsa("[data-event-id]").forEach(
      (e) =>
        e.addEventListener("click", () => u(e.dataset.eventId), {
          signal: t.signal,
        }),
      { signal: t.signal },
    );
  }
  function b(t, e) {
    let n = "pink",
      a = "E",
      i = "pink-line";
    "away_game" === t.type
      ? ((n = "cyan"), (a = "A"), (i = "cyan-line"))
      : "home_game" === t.type
        ? ((n = "pink"), (a = "H"), (i = "pink-line"))
        : "training" === t.type
          ? ((n = "yellow"), (a = "T"), (i = "yellow-line"))
          : "tournament" === t.type &&
            ((n = "green"), (a = "T"), (i = "green-line"));
    const r = new Date(t.event_date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      o = new Date(t.event_date),
      s = isNaN(o)
        ? ""
        : o.toLocaleDateString("it-IT", { weekday: "short" }).toUpperCase();
    return `      <div class="dash-fixture ${i}" data-event-id="${Utils.escapeHtml(t.id)}">        <div class="fixture-icon ${n}">${a}</div>        <div class="fixture-details">          <div class="fixture-title">${Utils.escapeHtml(t.title)}</div>          <div class="fixture-sub">            <span class="${n}"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(t.location_name || "TBD")}</span>             <span style="opacity:0.5; margin:0 4px;">•</span>             <span><i class="ph ph-users"></i> ${Utils.escapeHtml(t.team_name)}</span>          </div>        </div>        <div class="fixture-time-wrapper">           <div class="fixture-type-label">${Utils.escapeHtml(e[t.type] || t.type)}</div>           <div class="fixture-time">${s} ${r}</div>        </div>        <div class="fixture-status"><i class="ph ph-caret-right"></i></div>      </div>`;
  }
  async function u(e) {
    const n = document.getElementById("app");
    n.innerHTML = UI.skeletonPage();
    try {
      const [a, i, r] = await Promise.all([
          Store.get("listEvents", "transport").then((t) =>
            t.find((t) => t.id === e),
          ),
          Store.get("listRoutes", "transport", { eventId: e }),
          Store.get("listAttendees", "transport", { eventId: e }).catch(
            () => [],
          ),
        ]),
        o = App.getUser(),
        s = ["admin", "manager", "operator"].includes(o?.role),
        l = new Date(a?.event_date),
        d = isNaN(l)
          ? "TBD"
          : l
              .toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })
              .toUpperCase(),
        p = i.reduce((t, e) => t + e.seats_total, 0),
        g = i.reduce((t, e) => t + e.seats_available, 0),
        m = p - g,
        b = p > 0 ? Math.round((m / p) * 100) : 0,
        f = `            `;
      ((n.innerHTML =
        f +
        `        <div class="transport-dashboard">          \x3c!-- Breadcrumb --\x3e          <div style="padding:12px 0 0;display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.4);">            <button type="button" id="bc-home" style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Trasporti</button>            <i class="ph ph-caret-right" style="font-size:10px;"></i>            <span style="color:rgba(255,255,255,0.8);font-weight:600;text-transform:uppercase;letter-spacing:1px;">${Utils.escapeHtml(a?.title || "Evento").substring(0, 30)}</span>          </div>          <div class="dash-top-bar">            <div>              <div class="dash-title-wrap">                 <button class="btn-dash icon-only" id="back-events" type="button" title="Torna Indietro"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>                 <h1 class="dash-title">${Utils.escapeHtml(a?.title || "Evento")}</h1>              </div>              <p class="dash-subtitle"><i class="ph ph-calendar-blank"></i> ${d} <span style="opacity:0.3;margin:0 8px;">|</span> <i class="ph ph-map-pin"></i> ${Utils.escapeHtml(a?.location_name || "Da definire")}</p>            </div>            <div style="display:flex;gap:12px; flex-wrap:wrap;">              <button class="btn-dash pink" id="add-route-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> OFFRI PASSAGGIO</button>              ${s ? '<button class="btn-dash" id="send-convocations-btn" type="button"><i class="ph ph-paper-plane-tilt" style="font-size:18px;"></i> CONVOCAZIONI</button>' : ""}            </div>          </div>          <div class="dash-grid">            \x3c!-- Left Column: Map & Routes --\x3e            <div style="display:flex; flex-direction:column; gap:28px;">              <div class="dash-card">                 <div class="dash-card-header" style="margin-bottom: 20px;">                   <div class="dash-card-title"><i class="ph ph-map-trifold" style="color:var(--accent-cyan);"></i> MAPPA E PERCORSO</div>                   <div style="color: rgba(255,255,255,0.3); letter-spacing: 2px; cursor:pointer;"><i class="ph ph-dots-three-bold"></i></div>                 </div>                 <div class="gmap-container" id="map-container">                    ${a?.location_lat && a?.location_lng ? '<div id="gmap" style="width:100%;height:100%;"></div>' : '<div style="text-align:center;"><i class="ph ph-map-pin-line" style="font-size:48px;color:rgba(255,255,255,0.1);margin-bottom:12px;display:block;"></i><p style="color:rgba(255,255,255,0.4);font-size:14px; font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; font-weight:700;">Coordinate GPS assenti</p></div>'}                 </div>              </div>              <div class="dash-card cyan">                 <div class="dash-card-header">                   <div class="dash-card-title"><i class="ph ph-car" style="color:var(--accent-cyan);"></i> TRATTE DISPONIBILI <span style="background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; font-size:14px; margin-left:8px;">${i.length}</span></div>                 </div>                 <div>                    ${
          0 === i.length
            ? Utils.emptyState(
                "Nessuna tratta offerta",
                "Aggiungi la tua auto per iniziare.",
              )
            : i
                .map((t) =>
                  (function (t) {
                    const e =
                        t.seats_total > 0
                          ? Math.round(
                              100 * (1 - t.seats_available / t.seats_total),
                            )
                          : 0,
                      n = 0 === t.seats_available;
                    return `      <div class="route-card">        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">          <div style="display:flex; gap:16px; align-items:center;">            <div style="width:48px; height:48px; border-radius:12px; background:rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.3); display:flex; align-items:center; justify-content:center; color:var(--accent-cyan); font-size:24px; box-shadow:0 0 15px rgba(0,229,255,0.1);">                <i class="ph ph-steering-wheel"></i>            </div>            <div>              <div class="route-driver-name">${Utils.escapeHtml(t.driver_name)} ${n ? '<span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; color:#fff; margin-left:8px;">COMPLETO</span>' : ""}</div>              ${t.driver_phone ? `<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:6px; font-weight:500;"><i class="ph ph-phone"></i> ${Utils.escapeHtml(t.driver_phone)}</div>` : ""}            </div>          </div>          <div style="text-align:right; background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">            <div style="font-family:var(--font-display);font-size:24px;font-weight:800;line-height:1;margin-bottom:4px;color:${n ? "rgba(255,255,255,0.3)" : "#fff"}">${t.seats_available}<span style="font-size:16px; opacity:0.5;">/${t.seats_total}</span></div>            <div style="font-size:10px;text-transform:uppercase;color:rgba(255,255,255,0.4);letter-spacing:1px;font-weight:700;">Liberi</div>          </div>        </div>                <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px; color:rgba(255,255,255,0.7); font-weight:500; background:rgba(255,255,255,0.02); padding:12px; border-radius:10px;">           ${t.meeting_point_name ? `<div><i class="ph ph-map-pin" style="color:var(--accent-pink); margin-right:4px;"></i> ${Utils.escapeHtml(t.meeting_point_name)}</div>` : "<div></div>"}           ${t.departure_time ? `<div style="text-align:right;"><i class="ph ph-clock" style="color:var(--accent-cyan); margin-right:4px;"></i> ${Utils.formatDateTime(t.departure_time)}</div>` : "<div></div>"}        </div>        <div style="margin-top:20px;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden; position:relative;">          <div style="position:absolute; left:0; top:0; height:100%; width:${e}%; background:linear-gradient(90deg, #00b3cc, var(--accent-cyan)); transition:width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow:0 0 10px var(--accent-cyan); ${n ? "background:rgba(255,255,255,0.2); box-shadow:none;" : ""}"></div>        </div>                ${t.reimbursement_eur ? `          <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between; border-top:1px dashed rgba(255,255,255,0.1); padding-top:16px;">            <div style="font-size:13px;color:rgba(255,255,255,0.5); font-weight:500;">                <i class="ph ph-navigation-arrow"></i> ${Utils.formatNum(t.distance_km, 1)} km  <span style="opacity:0.3; margin:0 8px;">|</span>  <i class="ph ph-coins"></i> <span style="color:#00e676;font-weight:700;">${Utils.formatCurrency(t.reimbursement_eur)}</span>            </div>            <button class="btn-dash" style="padding:6px 14px; font-size:11px; border-color:rgba(255,255,255,0.2);" data-carpool-id="${Utils.escapeHtml(t.id)}" data-km="${Utils.escapeHtml(String(t.distance_km || 0))}" id="gen-reimb-${Utils.escapeHtml(t.id)}" type="button"><i class="ph ph-file-pdf" style="color:#ff1a1a;"></i> PDF RIMBORSO</button>          </div>` : ""}      </div>`;
                  })(t),
                )
                .join("")
        }                 </div>              </div>            </div>            \x3c!-- Right Column: Stats & Status --\x3e            <div style="display:flex; flex-direction:column; gap:28px;">              <div class="dash-card pink">                 <div class="dash-card-header" style="margin-bottom:0px;">                    <div class="dash-card-title"><i class="ph ph-chart-pie-slice" style="color:var(--accent-pink);"></i> RIEPILOGO CAPACITÀ</div>                 </div>                                  <div class="pie-chart-wrapper">                    <div class="pie-chart">                       <div class="pie-chart-inner">                          <div class="pie-val">${b}%</div>                          <div class="pie-lbl">Occupato</div>                       </div>                    </div>                 </div>                                  <div style="background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.03);">                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; padding-bottom:12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">                      <div style="display:flex; align-items:center; gap:8px; font-weight:600;"><div style="width:12px; height:12px; border-radius:50%; background:var(--accent-pink); box-shadow:0 0 10px var(--accent-pink);"></div> Posti Occupati</div>                      <div style="font-weight:800; font-size:18px;">${m}</div>                   </div>                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; padding:12px 0; border-bottom: 1px dashed rgba(255,255,255,0.1);">                      <div style="display:flex; align-items:center; gap:8px; font-weight:600;"><div style="width:12px; height:12px; border-radius:50%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3);"></div> Posti Liberi</div>                      <div style="font-weight:800; font-size:18px;">${g}</div>                   </div>                   <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px; color:rgba(255,255,255,0.5); padding-top:12px;">                      <div style="font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:12px;">Totale Posti Auto</div>                      <div style="font-weight:800; font-size:16px;">${p}</div>                   </div>                 </div>              </div>              \x3c!-- Presenze Card --\x3e              <div class="dash-card cyan">                 <div class="dash-card-header">                    <div class="dash-card-title"><i class="ph ph-users" style="color:var(--accent-cyan);"></i> PRESENZE CONVOCATI</div>                 </div>                 <div style="font-size:14px; max-height:400px; overflow-y:auto; padding-right:8px;" id="attendees-list-container">                    ${(function (
          t,
          e,
          n,
          a,
        ) {
          if (!t || 0 === t.length)
            return Utils.emptyState(
              "Nessun convocato",
              "Assicurati di aver assegnato atleti alla squadra per questo evento.",
            );
          let i = "";
          return (
            t.forEach((t) => {
              const r = n?.id === t.user_id,
                o = t.status || "invited";
              let s = "";
              ((s =
                "confirmed" === o
                  ? '<span class="badge badge-success">Confermato</span>'
                  : "absent" === o
                    ? '<span class="badge badge-danger">Assente</span>'
                    : "excused" === o
                      ? '<span class="badge badge-warning">Giustificato</span>'
                      : '<span class="badge badge-default">In attesa</span>'),
                (i += `        <div style="background:rgba(255,255,255,0.02); padding: 12px; margin-bottom: 8px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center;">           <div>             <div style="font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px;">               ${Utils.escapeHtml(t.athlete_name)}                ${r ? '<span style="font-size:10px; background:var(--accent-pink); padding:2px 6px; border-radius:4px; color:#fff;">TU</span>' : ""}             </div>             <div style="margin-top:4px;">${s}</div>           </div>                      ${r || a ? `             <div style="display:flex; gap:8px;">               <button class="btn-dash" style="padding:6px; min-width:32px; border-color:rgba(0, 230, 118, 0.4); color:#00E676;"                        onclick="Transport.handleAttendeeStatusChange('${Utils.escapeHtml(e)}', '${Utils.escapeHtml(t.athlete_id)}', 'confirmed')" title="Conferma Presenza">                 <i class="ph ph-check-circle"></i>               </button>               <button class="btn-dash" style="padding:6px; min-width:32px; border-color:rgba(255, 26, 26, 0.4); color:#ff1a1a;"                        onclick="Transport.handleAttendeeStatusChange('${Utils.escapeHtml(e)}', '${Utils.escapeHtml(t.athlete_id)}', 'absent')" title="Declina">                 <i class="ph ph-x-circle"></i>               </button>             </div>           ` : ""}        </div>      `));
            }),
            i
          );
        })(
          r,
          e,
          o,
          s,
        )}                 </div>              </div>            </div>                      </div>        </div>`),
        document
          .getElementById("back-events")
          ?.addEventListener("click", () => c(), { signal: t.signal }),
        document
          .getElementById("bc-home")
          ?.addEventListener("click", () => c(), { signal: t.signal }),
        document.getElementById("add-route-btn")?.addEventListener(
          "click",
          () =>
            (function (e) {
              const n = UI.modal({
                title: "Offri Passaggio",
                body: '        <div class="form-group">          <label class="form-label" for="route-seats">Posti disponibili (escluso guidatore)</label>          <input id="route-seats" class="form-input" type="number" min="1" max="8" placeholder="3" value="3">        </div>        <div class="form-group">          <label class="form-label" for="route-meeting">Punto di ritrovo</label>          <input id="route-meeting" class="form-input" type="text" placeholder="Via Roma 10, Milano">        </div>        <div class="form-group">          <label class="form-label" for="route-departure">Orario di partenza</label>          <input id="route-departure" class="form-input" type="datetime-local">        </div>        <div class="form-group">          <label class="form-label" for="route-notes">Note</label>          <textarea id="route-notes" class="form-textarea" placeholder="Info aggiuntive..." style="min-height:60px;"></textarea>        </div>        <div id="route-error" class="form-error hidden"></div>',
                footer:
                  '        <button class="btn btn-ghost btn-sm" id="route-cancel" type="button">Annulla</button>        <button class="btn btn-primary btn-sm" id="route-save" type="button">OFFRI PASSAGGIO</button>',
              });
              (document
                .getElementById("route-cancel")
                ?.addEventListener(
                  "click",
                  () => n.close(),
                  { signal: t.signal },
                  { signal: t.signal },
                ),
                document.getElementById("route-save")?.addEventListener(
                  "click",
                  async () => {
                    const t =
                      parseInt(document.getElementById("route-seats").value) ||
                      0;
                    if (t < 1)
                      return (
                        (document.getElementById("route-error").textContent =
                          "Inserisci almeno 1 posto"),
                        void document
                          .getElementById("route-error")
                          .classList.remove("hidden")
                      );
                    const a = document.getElementById("route-save");
                    ((a.disabled = !0), (a.textContent = "Salvataggio..."));
                    try {
                      (await Store.api("createRoute", "transport", {
                        event_id: e,
                        seats_total: t + 1,
                        meeting_point_name:
                          document.getElementById("route-meeting").value ||
                          null,
                        departure_time:
                          document.getElementById("route-departure").value ||
                          null,
                        notes:
                          document.getElementById("route-notes").value || null,
                      }),
                        UI.toast("Tratta aggiunta!", "success"),
                        await u(e),
                        n.close());
                    } catch (t) {
                      ((document.getElementById("route-error").textContent =
                        t.message),
                        document
                          .getElementById("route-error")
                          .classList.remove("hidden"),
                        (a.disabled = !1),
                        (a.textContent = "OFFRI PASSAGGIO"));
                    }
                  },
                  { signal: t.signal },
                ));
            })(e),
          { signal: t.signal },
        ),
        document.getElementById("send-convocations-btn")?.addEventListener(
          "click",
          () =>
            (async function (t) {
              UI.confirm(
                "Inviare le convocazioni a tutti gli atleti convocati per questo evento?",
                async () => {
                  try {
                    const e = await Store.api("sendConvocations", "transport", {
                      eventId: t,
                    });
                    UI.toast(
                      `Convocazioni inviate: ${e.sent} successi, ${e.failed} errori`,
                      e.failed > 0 ? "info" : "success",
                    );
                  } catch (t) {
                    UI.toast("Errore invio email: " + t.message, "error");
                  }
                },
              );
            })(e),
          { signal: t.signal },
        ),
        a?.location_lat &&
          a?.location_lng &&
          (function (t, e, n) {
            const a = window.GOOGLE_MAPS_API_KEY;
            if (!a) return;
            const i = document.createElement("script");
            ((i.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(a)}&callback=_gmapInitCallback`),
              (i.async = !0),
              (i.defer = !0),
              (window._gmapInitCallback = function () {
                const a = document.getElementById("gmap");
                if (!a) return;
                const i = { lat: parseFloat(t), lng: parseFloat(e) },
                  r = new google.maps.Map(a, {
                    center: i,
                    zoom: 14,
                    styles: [
                      {
                        elementType: "geometry",
                        stylers: [{ color: "#0a0a0a" }],
                      },
                      {
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#ffffff" }],
                      },
                      {
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#000000" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#1a1a1a" }],
                      },
                      {
                        featureType: "road.arterial",
                        elementType: "geometry",
                        stylers: [{ color: "#FF00FF", lightness: -80 }],
                      },
                    ],
                  });
                new google.maps.Marker({
                  position: i,
                  map: r,
                  title: n || "Destinazione",
                });
              }),
              document.head.appendChild(i));
          })(a.location_lat, a.location_lng, a.location_name));
    } catch (e) {
      const n = document.getElementById("app");
      (n &&
        ((n.innerHTML = `<div style="padding:40px;text-align:center;">          <p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Errore nel caricamento: ${Utils.escapeHtml(e.message)}</p>          <button class="btn btn-ghost" id="err-back-btn" type="button"><i class="ph ph-arrow-left"></i> Torna indietro</button>        </div>`),
        document
          .getElementById("err-back-btn")
          ?.addEventListener("click", () => c(), { signal: t.signal })),
        UI.toast("Errore: " + e.message, "error"));
    }
  }
  async function f() {
    if (!a.length)
      try {
        a = await Store.get("listTeams", "transport");
      } catch (t) {
        a = [];
      }
    const e = a
        .map(
          (t) =>
            `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.name)} (${Utils.escapeHtml(t.category)})</option>`,
        )
        .join(""),
      n = UI.modal({
        title: "Nuovo Evento",
        body: `        <div class="form-group">          <label class="form-label" for="ev-title">Titolo *</label>          <input id="ev-title" class="form-input" type="text" placeholder="Partita vs Team ABC" required>        </div>        <div class="form-grid">          <div class="form-group">            <label class="form-label" for="ev-date">Data e ora *</label>            <input id="ev-date" class="form-input" type="datetime-local" required>          </div>          <div class="form-group">            <label class="form-label" for="ev-type">Tipo *</label>            <select id="ev-type" class="form-select">              <option value="training">Allenamento</option>              <option value="away_game">Trasferta</option>              <option value="home_game">Gara in Casa</option>              <option value="tournament">Torneo</option>            </select>          </div>        </div>        <div class="form-group">          <label class="form-label" for="ev-location">Luogo</label>          <input id="ev-location" class="form-input" type="text" placeholder="PalaXxx, Via Roma 1, Milano">        </div>        <div class="form-group">          <label class="form-label" for="ev-team">Squadra *</label>          <select id="ev-team" class="form-select"><option value="">— Seleziona squadra —</option>${e}</select>        </div>        <div id="ev-error" class="form-error hidden"></div>`,
        footer:
          '        <button class="btn btn-ghost btn-sm" id="ev-cancel" type="button">Annulla</button>        <button class="btn btn-primary btn-sm" id="ev-save" type="button">CREA EVENTO</button>',
      });
    (document
      .getElementById("ev-cancel")
      ?.addEventListener(
        "click",
        () => n.close(),
        { signal: t.signal },
        { signal: t.signal },
      ),
      document.getElementById("ev-save")?.addEventListener(
        "click",
        async () => {
          const t = document.getElementById("ev-title").value.trim(),
            e = document.getElementById("ev-date").value,
            a = document.getElementById("ev-team").value.trim(),
            i = document.getElementById("ev-error");
          if (!t || !e || !a)
            return (
              (i.textContent = "Titolo, data e ID squadra sono obbligatori"),
              void i.classList.remove("hidden")
            );
          const r = document.getElementById("ev-save");
          ((r.disabled = !0), (r.textContent = "Creazione..."));
          try {
            (await Store.api("createEvent", "transport", {
              title: t,
              event_date: e,
              team_id: a,
              type: document.getElementById("ev-type").value,
              location_name:
                document.getElementById("ev-location").value || null,
            }),
              UI.toast("Evento creato", "success"),
              await p(),
              n.close());
          } catch (t) {
            ((i.textContent = t.message),
              i.classList.remove("hidden"),
              (r.disabled = !1),
              (r.textContent = "CREA EVENTO"));
          }
        },
        { signal: t.signal },
      ));
  }
  async function x() {
    const e = document.getElementById("app");
    ((e.innerHTML = UI.skeletonPage()),
      (r = null),
      (s = []),
      (l = null),
      d.clear());
    try {
      [n, a] = await Promise.all([
        Store.get("listGyms", "transport"),
        Store.get("listTeams", "transport"),
      ]);
    } catch (t) {
      ((n = []), (a = []));
    }
    const i = n
        .map(
          (t) =>
            `<option value="${Utils.escapeHtml(t.id)}" data-address="${Utils.escapeHtml(t.address || "")}" data-lat="${t.lat || ""}" data-lng="${t.lng || ""}">${Utils.escapeHtml(t.name)}</option>`,
        )
        .join(""),
      o = a
        .map(
          (t) =>
            `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(t.name)} (${Utils.escapeHtml(t.category)})</option>`,
        )
        .join("");
    ((e.innerHTML = `        <div class="transport-dashboard">      <div class="dash-top-bar">        <div>          <div class="dash-title-wrap">             <button class="btn-dash icon-only" id="nt-back" type="button" title="Torna Indietro"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>             <h1 class="dash-title">Nuovo <span style="color:var(--accent-pink);">Trasporto</span></h1>          </div>          <p class="dash-subtitle">Pianifica il percorso di raccolta atlete con backward planning</p>        </div>      </div>      <div class="dash-grid">        \x3c!-- Step 1: Destinazione --\x3e        <div class="dash-card pink">          <div class="dash-card-header">            <div class="dash-card-title"><span style="background:var(--accent-pink);color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;">1</span> DESTINAZIONE</div>          </div>          <div class="form-group" style="margin-top:16px;">            <label class="form-label" for="nt-gym-select">Palestra / Impianto</label>            <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">              <div style="flex:1; min-width:200px;">                <select class="form-select" id="nt-gym-select">                  <option value="">— Seleziona destinazione —</option>                  ${i}                </select>              </div>              <button class="btn-dash pink" id="nt-add-gym-btn" type="button"><i class="ph ph-plus"></i> Nuova Palestra</button>              <button class="btn-dash" id="nt-del-gym-btn" type="button" style="border-color:rgba(255, 0, 255,0.4);color:#FF00FF;" title="Elimina palestra selezionata"><i class="ph ph-trash"></i> Elimina</button>            </div>          </div>        </div>        \x3c!-- Step 2: Dati Viaggio --\x3e        <div class="dash-card cyan">          <div class="dash-card-header">            <div class="dash-card-title"><span style="background:var(--accent-cyan);color:#000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;font-weight:700;">2</span> DATI VIAGGIO</div>          </div>          <div class="form-grid" style="margin-top:16px;">            <div class="form-group">              <label class="form-label" for="nt-team-select">Squadra</label>              <select class="form-select" id="nt-team-select">                <option value="">— Seleziona squadra —</option>                ${o}              </select>            </div>            <div class="form-group">              <label class="form-label">Orario Arrivo Desiderato</label>              <input class="form-input" type="time" id="nt-arrival-time" value="18:00">            </div>          </div>          <div class="form-group" style="margin-top:0;">            <label class="form-label" style="display:flex;align-items:center;gap:8px;">              Indirizzo di Partenza del Mezzo              <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(66,133,244,0.15);border:1px solid rgba(66,133,244,0.3);border-radius:6px;padding:2px 8px;font-size:10px;color:#4285F4;font-weight:700;letter-spacing:0.5px;">                <i class="ph ph-google-logo"></i> Google Maps              </span>            </label>            <div style="position:relative;">              <i class="ph ph-magnifying-glass" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.35);font-size:16px;pointer-events:none;"></i>              <input class="form-input" type="text" id="nt-departure-addr" autocomplete="off"                placeholder="Cerca indirizzo di partenza..."                value="${localStorage.getItem("fusion_last_departure") || ""}"                style="padding-left:40px;">            </div>            <div id="nt-departure-map" style="display:none;margin-top:10px;border-radius:12px;overflow:hidden;height:160px;border:1px solid rgba(66,133,244,0.25);"></div>          </div>          <div class="form-group" style="margin-top:0;">            <label class="form-label">Data Trasporto</label>            <input class="form-input" type="date" id="nt-transport-date" value="${new Date().toISOString().slice(0, 10)}">          </div>        </div>        \x3c!-- Step 3: Atlete --\x3e        <div class="dash-card green" style="grid-column:1/-1;">          <div class="dash-card-header">            <div class="dash-card-title"><span style="background:#00e676;color:#000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:14px;font-weight:700;">3</span> SELEZIONA ATLETE</div>          </div>          <p style="font-size:13px; color:rgba(255,255,255,0.5); margin-top:8px; margin-bottom:16px;">Seleziona una squadra per caricare le atlete. Clicca su una card per selezionare o deselezionare.</p>          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;" id="nt-athletes-grid">            <div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">              <i class="ph ph-users" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>              Seleziona una squadra per visualizzare le atlete            </div>          </div>          <div style="margin-top:24px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; padding-top:20px; border-top:1px dashed rgba(255,255,255,0.1);">            <button class="btn-dash primary" id="nt-calc-btn" type="button" disabled style="padding:12px 24px;font-size:16px;"><i class="ph ph-route" style="font-size:22px;"></i> Calcola Percorso</button>            <span id="nt-validation-hint" style="font-size:13px; color:rgba(255,255,255,0.4);">Compila destinazione, squadra e seleziona almeno un'atleta</span>          </div>        </div>        \x3c!-- Results --\x3e        <div id="nt-results" style="display:none; grid-column:1/-1; margin-top:10px;"></div>      </div>    </div>`),
      document
        .getElementById("nt-back")
        ?.addEventListener("click", () => c(), { signal: t.signal }),
      document
        .getElementById("nt-gym-select")
        ?.addEventListener("change", v, { signal: t.signal }),
      document
        .getElementById("nt-team-select")
        ?.addEventListener("change", h, { signal: t.signal }),
      document
        .getElementById("nt-add-gym-btn")
        ?.addEventListener("click", z, { signal: t.signal }),
      document
        .getElementById("nt-del-gym-btn")
        ?.addEventListener("click", T, { signal: t.signal }),
      document
        .getElementById("nt-calc-btn")
        ?.addEventListener("click", $, { signal: t.signal }),
      k(() =>
        E(
          document.getElementById("nt-departure-addr"),
          ({ lat: t, lng: e, address: n }) => {
            d.set(n, { lat: t, lng: e });
            try {
              localStorage.setItem("fusion_last_departure", n);
            } catch (t) {}
            const a = document.getElementById("nt-departure-map");
            if (a && "undefined" != typeof google) {
              a.style.display = "block";
              const i = new google.maps.Map(a, {
                center: { lat: t, lng: e },
                zoom: 15,
                disableDefaultUI: !0,
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
                  {
                    elementType: "labels.text.fill",
                    stylers: [{ color: "#ffffff" }],
                  },
                  {
                    elementType: "labels.text.stroke",
                    stylers: [{ color: "#000000" }],
                  },
                  {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#1a1a1a" }],
                  },
                  {
                    featureType: "road.arterial",
                    elementType: "geometry",
                    stylers: [{ color: "#FF00FF", lightness: -80 }],
                  },
                ],
              });
              new google.maps.Marker({
                position: { lat: t, lng: e },
                map: i,
                title: n,
              });
            }
          },
        ),
      ));
  }
  function v(t) {
    const e = t.target.selectedOptions[0];
    e && e.value
      ? ((r = {
          id: e.value,
          name: e.textContent,
          address: e.dataset.address || "",
          lat: parseFloat(e.dataset.lat) || null,
          lng: parseFloat(e.dataset.lng) || null,
        }),
        w())
      : (r = null);
  }
  async function h(t) {
    const e = t.target.value;
    ((o = e), (s = []));
    const n = document.getElementById("nt-athletes-grid");
    if (e) {
      n.innerHTML =
        '<div style="grid-column:1/-1; text-align:center; padding:30px;"><div class="spinner"></div></div>';
      try {
        ((i = await Store.get("listTeamAthletes", "transport", { teamId: e })),
          y(),
          w());
      } catch (t) {
        n.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#FF00FF;">Errore: ${Utils.escapeHtml(t.message)}</div>`;
      }
    } else
      n.innerHTML =
        '<div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);"><i class="ph ph-users" style="font-size:48px; display:block; margin-bottom:12px; opacity:0.3;"></i>Seleziona una squadra per visualizzare le atlete</div>';
  }
  function y() {
    const e = document.getElementById("nt-athletes-grid");
    i.length
      ? ((e.innerHTML = i
          .map((t) => {
            const e = (t.full_name || "")
                .split(" ")
                .map((t) => t[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
              n = [t.residence_address, t.residence_city]
                .filter((t) => t && t.trim())
                .join(", ");
            n &&
              !t.residence_address?.includes(t.residence_city || "~~~") &&
              (t.residence_address = n);
            const a = t.residence_address && t.residence_address.trim(),
              i = s.some((e) => e.id === t.id);
            return `\        <div class="nt-athlete-card ${i ? "selected" : ""}" data-athlete-id="${Utils.escapeHtml(t.id)}" style="background:rgba(255,255,255,0.02);border:1px solid ${i ? '#00e676' : 'rgba(255,255,255,0.1)'};border-radius:12px;padding:16px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all 0.2s;">\          <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:${i ? '#fff' : 'rgba(255,255,255,0.5)'};">${e}</div>\          <div style="flex:1; min-width:0;">\            <div style="font-weight:600;font-size:14px;color:${i ? '#fff' : 'rgba(255,255,255,0.7)'};">${Utils.escapeHtml(t.full_name)}</div>\            <div style="font-size:12px;color:${a ? 'rgba(255,255,255,0.4)' : '#ff5252'};margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\              ${a ? '<i class="ph ph-map-pin"></i> ' + Utils.escapeHtml(t.residence_address) : '<i class="ph ph-warning"></i> Indirizzo mancante'}\            </div>\            ${!a && i ? `<input class="nt-addr-input form-input" style="margin-top:8px;padding:6px 10px;font-size:12px;height:auto;" type="text" data-addr-for="${Utils.escapeHtml(t.id)}" placeholder="Inserisci indirizzo..." onclick="event.stopPropagation()">` : ""}\          </div>\          <div style="color:${i ? '#00e676' : 'rgba(255,255,255,0.2)'};font-size:24px;">\            <i class="ph ${i ? 'ph-check-circle-fill' : 'ph-circle'}"></i>\          </div>\        </div>`;
          })
          .join("")),
        e.querySelectorAll(".nt-athlete-card").forEach((e) => {
          e.addEventListener(
            "click",
            (t) => {
              if (t.target.classList.contains("nt-addr-input")) return;
              const n = e.dataset.athleteId,
                a = i.find((t) => t.id === n);
              if (!a) return;
              const r = s.findIndex((t) => t.id === n);
              (r >= 0 ? s.splice(r, 1) : s.push({ ...a }), y(), w());
            },
            { signal: t.signal },
          );
        }),
        e.querySelectorAll(".nt-addr-input").forEach((e) => {
          (e.addEventListener(
            "blur",
            () => {
              const t = e.dataset.addrFor,
                n = e.value.trim();
              if (n.length > 3) {
                const e = s.find((e) => e.id === t),
                  a = i.find((e) => e.id === t);
                (e && (e.residence_address = n),
                  a && (a.residence_address = n),
                  y());
              }
            },
            { signal: t.signal },
          ),
            k(() =>
              E(e, ({ lat: t, lng: n, address: a }) => {
                const r = e.dataset.addrFor;
                d.set(a, { lat: t, lng: n });
                const o = s.find((t) => t.id === r),
                  l = i.find((t) => t.id === r);
                (o && (o.residence_address = a),
                  l && (l.residence_address = a),
                  y());
              }),
            ));
        }))
      : (e.innerHTML =
          '<div style="grid-column:1/-1; text-align:center; padding:40px; color:rgba(255,255,255,0.4);">Nessuna atleta trovata per questa squadra</div>');
  }
  function w() {
    const t = document.getElementById("nt-calc-btn"),
      e = document.getElementById("nt-validation-hint");
    if (!t) return;
    const n = !!r,
      a = !!o,
      i = s.length > 0,
      l = n && a && i;
    if (((t.disabled = !l), e))
      if (l) e.style.display = "none";
      else {
        e.style.display = "";
        const t = [];
        (n || t.push("destinazione"),
          a || t.push("squadra"),
          i || t.push("almeno un'atleta"),
          (e.textContent = "Seleziona: " + t.join(", ")));
      }
  }
  function k(t) {
    if ("undefined" != typeof google && google.maps && google.maps.places)
      return (I(), void t());
    const e = window.GOOGLE_MAPS_API_KEY;
    if (!e) return;
    if (document.querySelector("script[data-gmaps-places]")) {
      const e = setInterval(() => {
        "undefined" != typeof google &&
          google.maps?.places &&
          (clearInterval(e), I(), t());
      }, 100);
      return;
    }
    const n = "__gmPlaces_" + Date.now();
    window[n] = () => {
      (delete window[n], I(), t());
    };
    const a = document.createElement("script");
    ((a.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(e)}&libraries=places&callback=${n}`),
      (a.async = !0),
      (a.defer = !0),
      (a.dataset.gmapsPlaces = "1"),
      document.head.appendChild(a));
  }
  function I() {
    if (document.getElementById("gm-pac-styles")) return;
    const t = document.createElement("style");
    ((t.id = "gm-pac-styles"),
      (t.textContent =
        '      .pac-container {        background: #18181c !important;        border: 1px solid rgba(255,255,255,0.12) !important;        border-radius: 12px !important;        box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;        font-family: inherit !important;        overflow: hidden !important;        margin-top: 4px !important;      }      .pac-container::after { display: none !important; } /* rimuove logo Google */      .pac-item {        color: rgba(255,255,255,0.8) !important;        border-top: 1px solid rgba(255,255,255,0.06) !important;        padding: 10px 14px !important;        cursor: pointer !important;        font-size: 13px !important;        display: flex !important;        align-items: center !important;        gap: 10px !important;      }      .pac-item:first-child { border-top: none !important; }      .pac-item:hover, .pac-item-selected { background: rgba(0,229,255,0.08) !important; }      .pac-item-query { color: #fff !important; font-weight: 600 !important; font-size: 13px !important; }      .pac-matched { color: #00e5ff !important; font-weight: 700 !important; }      .pac-icon { display: none !important; } /* nasconde le icone pin che appaiono come "?" */      .pac-secondary-text { color: rgba(255,255,255,0.45) !important; font-size: 12px !important; }    '),
      document.head.appendChild(t));
  }
  function E(t, e) {
    if (!t || "undefined" == typeof google || !google.maps?.places) return;
    const n = new google.maps.places.Autocomplete(t, {
      types: ["establishment", "geocode"],
      fields: ["formatted_address", "geometry", "name"],
    });
    n.addListener("place_changed", () => {
      const a = n.getPlace();
      if (!a.geometry) return;
      const i = a.geometry.location.lat(),
        r = a.geometry.location.lng(),
        o = a.formatted_address || t.value;
      ((t.value = o), e && e({ lat: i, lng: r, address: o, place: a }));
    });
  }
  function z() {
    let t = null,
      e = null;
    const a = UI.modal({
      title: "Nuova Palestra",
      body: '        <div class="form-group"><label class="form-label" for="gym-name">Nome *</label><input id="gym-name" class="form-input" type="text" placeholder="Palazzetto dello Sport" autocomplete="off"></div>        <div class="form-group">          <label class="form-label" for="gym-address">Indirizzo <span style="font-size:11px; opacity:0.5;">(verifica con Google Maps)</span></label>          <input id="gym-address" class="form-input" type="text" placeholder="Via Roma 1, Milano" autocomplete="off">          <div id="gym-map-preview" style="display:none; margin-top:10px; border-radius:10px; overflow:hidden; height:180px; border:1px solid rgba(255,255,255,0.1);"></div>        </div>        <div id="gym-error" class="form-error hidden"></div>',
      footer:
        '<button class="btn btn-ghost btn-sm" id="gym-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="gym-save" type="button">SALVA</button>',
    });
    (document
      .getElementById("gym-cancel")
      ?.addEventListener("click", () => a.close()),
      document
        .getElementById("gym-save")
        ?.addEventListener("click", async () => {
          const i = document.getElementById("gym-name").value.trim(),
            o = document.getElementById("gym-address").value.trim(),
            s = document.getElementById("gym-error");
          if (!i)
            return (
              (s.textContent = "Nome obbligatorio"),
              void s.classList.remove("hidden")
            );
          const l = document.getElementById("gym-save");
          ((l.disabled = !0), (l.textContent = "Salvataggio..."));
          try {
            const s = await Store.api("createGym", "transport", {
                name: i,
                address: o || null,
                lat: t,
                lng: e,
              }),
              l = { id: s.id, name: i, address: o, lat: t, lng: e };
            n.push(l);
            const d = document.getElementById("nt-gym-select");
            if (d) {
              const n = document.createElement("option");
              ((n.value = s.id),
                (n.textContent = i),
                (n.dataset.address = o),
                (n.dataset.lat = t || ""),
                (n.dataset.lng = e || ""),
                d.appendChild(n),
                (d.value = s.id),
                (r = l));
            }
            (UI.toast("Palestra aggiunta!", "success"), a.close());
          } catch (t) {
            ((s.textContent = t.message),
              s.classList.remove("hidden"),
              (l.disabled = !1),
              (l.textContent = "SALVA"));
          }
        }),
      k(() =>
        E(
          document.getElementById("gym-address"),
          ({ lat: n, lng: a, place: i }) => {
            ((t = n), (e = a));
            const r = document.getElementById("gym-map-preview");
            if (r && "undefined" != typeof google) {
              r.style.display = "block";
              const t = new google.maps.Map(r, {
                  center: { lat: n, lng: a },
                  zoom: 15,
                  disableDefaultUI: !0,
                  styles: [
                    {
                      elementType: "geometry",
                      stylers: [{ color: "#0a0a0a" }],
                    },
                    {
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#ffffff" }],
                    },
                    {
                      elementType: "labels.text.stroke",
                      stylers: [{ color: "#000000" }],
                    },
                    {
                      featureType: "road",
                      elementType: "geometry",
                      stylers: [{ color: "#1a1a1a" }],
                    },
                    {
                      featureType: "road.arterial",
                      elementType: "geometry",
                      stylers: [{ color: "#FF00FF", lightness: -80 }],
                    },
                  ],
                }),
                e = document.getElementById("gym-address")?.value || "";
              new google.maps.Marker({
                position: { lat: n, lng: a },
                map: t,
                title: e,
              });
            }
          },
        ),
      ));
  }
  async function T() {
    if (!r)
      return void UI.toast(
        "Seleziona prima una palestra da eliminare",
        "error",
      );
    const t = r.name;
    UI.confirm(
      `Eliminare la palestra "${t}"? L'operazione non può essere annullata.`,
      async () => {
        try {
          (await Store.api("deleteGym", "transport", { id: r.id }),
            (n = n.filter((t) => t.id !== r.id)));
          const e = document.getElementById("nt-gym-select");
          if (e) {
            const t = e.querySelector(`option[value="${r.id}"]`);
            (t && t.remove(), (e.value = ""));
          }
          ((r = null), UI.toast(`Palestra "${t}" eliminata`, "success"));
        } catch (t) {
          UI.toast("Errore: " + t.message, "error");
        }
      },
    );
  }
  async function _(t, e, n, a = !0, l = null) {
    return new Promise((i, r) => {
      k(() => {
        if (
          "undefined" == typeof google ||
          !google.maps ||
          !google.maps.DirectionsService
        )
          return r(new Error("Google Maps API non accessibile."));
        const o = new google.maps.DirectionsService(),
          s = {
            origin: t,
            destination: e,
            waypoints: n.map((t) => ({ location: t, stopover: !0 })),
            optimizeWaypoints: a,
            travelMode: google.maps.TravelMode.DRIVING,
          };
        l && l instanceof Date && l > new Date() && (s.drivingOptions = { departureTime: l, trafficModel: "bestguess" });
        o.route(s, (t, e) => {
          e === google.maps.DirectionsStatus.OK ? i(t) : r(new Error(e));
        });
      });
    });
  }
  async function $() {
    if (!r)
      return void UI.toast("Seleziona una palestra di destinazione", "error");
    const t = document.getElementById("nt-arrival-time")?.value;
    if (!t) return void UI.toast("Inserisci l'orario di arrivo", "error");
    const e = document.getElementById("nt-departure-addr")?.value;
    if (!e) return void UI.toast("Inserisci l'indirizzo di partenza", "error");
    if (0 === s.length)
      return void UI.toast("Seleziona almeno un'atleta", "error");
    const n = s.filter(
      (t) => !t.residence_address || !t.residence_address.trim(),
    );
    if (n.length > 0)
      return void UI.toast(
        `${n.length} atlete senza indirizzo. Compilare prima di procedere.`,
        "error",
      );
    const a = document.getElementById("nt-calc-btn");
    ((a.disabled = !0),
      (a.innerHTML =
        '<div class="spinner" style="width:20px;height:20px;"></div> Calcolo in corso...'));
    try {
      const n = r.address || r.name;
      a.innerHTML =
        '<div class="spinner" style="width:20px;height:20px;"></div> Calcolo percorso Google...';
      const i = s.map((t) => t.residence_address);
      let o = null;
      try {
        o = await _(e, n, i, !0);
        let baseD = 0;
        const baseLegs = o.routes[0].legs;
        for (let idx = 0; idx < baseLegs.length; idx++) {
          baseD += baseLegs[idx].duration.value;
          if (idx > 0 && idx < baseLegs.length - 1) baseD += 180;
        }
        const [xBase, vBase] = t.split(":").map(Number);
        const transDateStr = document.getElementById("nt-transport-date")?.value || new Date().toISOString().slice(0, 10);
        const arrDate = new Date(`${transDateStr}T${String(xBase).padStart(2, '0')}:${String(vBase).padStart(2, '0')}:00`);
        const estDep = new Date(arrDate.getTime() - 1e3 * baseD);
        if (estDep > new Date()) {
          o = await _(e, n, i, !0, estDep);
        }
      } catch (t) {
        throw new Error(
          "Impossibile calcolare il percorso con Google Maps: " + t.message,
        );
      }
      const d = o.routes[0],
        p = d.waypoint_order.map((t) => s[t]),
        fullPath = d.overview_path ? d.overview_path.map(pt => ({lat: pt.lat(), lng: pt.lng()})) : [];
      let c = 0,
        g = 0;
      const m = [],
        b = [],
        u = [];
      b.push({
        lat: d.legs[0].start_location.lat(),
        lng: d.legs[0].start_location.lng(),
        label: e,
      });
      for (let t = 0; t < d.legs.length; t++) {
        const e = d.legs[t],
          n = e.distance.value,
          a = e.duration_in_traffic ? e.duration_in_traffic.value : e.duration.value,
          i = t > 0 && t < d.legs.length - 1 ? 180 : 0;
        ((c += n),
          (g += a + i),
          m.push(a + i),
          u.push({ durata: e.duration.text, distanza: e.distance.text }),
          b.push({
            lat: e.end_location.lat(),
            lng: e.end_location.lng(),
            label: e.end_address,
          }));
      }
      const f = {
          durata: Math.round(g / 60) + " min",
          distanza: (c / 1e3).toFixed(1) + " km",
          tappe: s.length,
        },
        [x, v] = t.split(":").map(Number),
        transDateStr2 = document.getElementById("nt-transport-date")?.value || new Date().toISOString().slice(0, 10),
        y = new Date(new Date(`${transDateStr2}T${String(x).padStart(2, '0')}:${String(v).padStart(2, '0')}:00`).getTime() - 1e3 * g),
        w = [];
      let k = new Date(y);
      (w.push({
        tipo: "partenza",
        luogo: e,
        orario: k.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        nota: "Partenza Mezzo",
        coord: b[0],
      }),
        m.forEach((e, n) => {
          if (((k = new Date(k.getTime() + 1e3 * e)), n < p.length)) {
            const t = p[n];
            w.push({
              tipo: "raccolta",
              luogo: t.residence_address,
              orario: k.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              nota: `Raccolta ${t.full_name}`,
              atleta_id: t.id,
              atleta_name: t.full_name,
              coord: b[n + 1],
            });
          } else
            w.push({
              tipo: "arrivo",
              luogo: r.name,
              orario: k.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              nota: `Arrivo — Target: ${t}`,
              coord: b[b.length - 1],
            });
        }),
        (l = {
          timeline: w,
          stats: f,
          ai: null,
          departureTime: y.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
        U(w, f, null, b, fullPath));
    } catch (t) {
      (UI.toast("Errore calcolo percorso: " + t.message, "error"),
        console.error(t));
    } finally {
      ((a.disabled = !1),
        (a.innerHTML =
          '<i class="ph ph-route" style="font-size:22px;"></i> Ricalcola Percorso'));
    }
  }
  function U(e, n, a, i, fullPath) {
    const o = document.getElementById("nt-results");
    if (
      ((o.style.display = "block"),
      (o.innerHTML = `      <div class="nt-stats-grid">        <div class="nt-stat"><div class="nt-stat-val">${Utils.escapeHtml(n.durata)}</div><div class="nt-stat-lbl">Durata Stimata</div></div>        <div class="nt-stat"><div class="nt-stat-val">${Utils.escapeHtml(n.distanza)}</div><div class="nt-stat-lbl">Distanza</div></div>        <div class="nt-stat"><div class="nt-stat-val">${n.tappe}</div><div class="nt-stat-lbl">Tappe</div></div>      </div>      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 24px; align-items: stretch;">                \x3c!-- Left Column: Route map --\x3e        <div style="display:flex; flex-direction:column; gap:24px;">          \x3c!-- Route map --\x3e          <div class="nt-step" style="padding:0; overflow:hidden; margin:0; flex: 1; display:flex; flex-direction:column;">            <div id="nt-route-map" style="width:100%; flex:1; min-height: 320px; background:#0a0a0c; display:flex; align-items:center; justify-content:center;">              <div style="text-align:center; color:rgba(255,255,255,0.3);">                <div class="spinner" style="margin:0 auto 12px;"></div>                <p style="font-size:13px; font-family:var(--font-display); text-transform:uppercase; letter-spacing:1px;">Caricamento mappa...</p>              </div>            </div>          </div>        </div>        \x3c!-- Right Column: Timeline --\x3e        <div class="nt-step" style="margin:0; height: 100%; display:flex; flex-direction:column;">          <span class="nt-step-num" style="background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.2);"><i class="ph ph-clock"></i></span>          <h3 class="nt-step-title">Timeline Percorso</h3>          <div class="nt-timeline" style="margin-top:24px; flex: 1; overflow-y: auto;">            ${e.map((t) => `              <div class="nt-tl-item ${t.tipo}">                <div class="nt-tl-time">${Utils.escapeHtml(t.orario)}</div>                <div class="nt-tl-note">${Utils.escapeHtml(t.nota)}</div>                <div class="nt-tl-place"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(t.luogo)}</div>              </div>`).join("")}          </div>        </div>      </div>      <div style="display:flex; gap:16px; flex-wrap:wrap;">        <button class="nt-save-btn" id="nt-save-btn" type="button"><i class="ph ph-floppy-disk" style="font-size:20px;"></i> Salva Trasporto</button>        <button class="btn-dash ghost" onclick="window.print()" type="button"><i class="ph ph-printer"></i> Stampa</button>      </div>`),
      document
        .getElementById("nt-save-btn")
        ?.addEventListener("click", S, { signal: t.signal }),
      o.scrollIntoView({ behavior: "smooth", block: "start" }),
      i)
    )
      !(function (t) {
        const e = document.getElementById("nt-route-map");
        if (!e || !t || !t.length) return;
        const n = t.filter((t) => t && t.lat && t.lng);
        if (!n.length)
          return void (e.innerHTML =
            '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;"><i class="ph ph-map-pin-line" style="font-size:48px;display:block;margin-bottom:12px;"></i><p>Coordinate non disponibili</p></div>');
        ((e.style.display = "flex"),
          (e.style.flexDirection = "column"),
          (e.style.height = "100%"));
        const a = "leaflet-map-" + Date.now();
        ((e.innerHTML = `      <div id="${a}" style="width:100%; flex:1; min-height:300px;"></div>`),
          (function (t) {
            if (window.L) t();
            else {
              if (!document.getElementById("leaflet-css")) {
                const t = document.createElement("link");
                ((t.id = "leaflet-css"),
                  (t.rel = "stylesheet"),
                  (t.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
                  document.head.appendChild(t));
              }
              if (document.getElementById("leaflet-js")) {
                const e = setInterval(() => {
                  window.L && (clearInterval(e), t());
                }, 100);
              } else {
                const e = document.createElement("script");
                ((e.id = "leaflet-js"),
                  (e.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
                  (e.onload = t),
                  document.head.appendChild(e));
              }
            }
          })(function () {
            const t = window.L,
              e = t.map(a, { zoomControl: !0, scrollWheelZoom: !1 });
            t.tileLayer(
              "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              { attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19 },
            ).addTo(e);
            const routePoints = (fullPath && fullPath.length) ? fullPath.map(pt => [pt.lat, pt.lng]) : n.map((t) => [t.lat, t.lng]);
            (t
              .polyline(routePoints, {
                color: "#ff00ff",
                weight: 4,
                opacity: 0.9,
              })
              .addTo(e),
              n.forEach((a, i) => {
                const r = 0 === i,
                  o = i === n.length - 1,
                  s = r ? "#00e5ff" : o ? "#00E676" : "#FF00FF",
                  l = `<div style="width:32px;height:32px;border-radius:50%;background:${s};color:${r || o ? "#000" : "#fff"};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.6);">${r ? "🚐" : o ? "🏟" : String(i)}</div>`,
                  d = t.divIcon({
                    html: l,
                    className: "",
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  }),
                  p = a.label || "—";
                t.marker([a.lat, a.lng], { icon: d })
                  .addTo(e)
                  .bindPopup(
                    `<b style="color:${s}">${r ? "Partenza" : o ? "Palestra" : "Tappa " + i}</b><br><small>${p}</small>`,
                  );
              }),
              e.fitBounds(routePoints, { padding: [24, 24] }),
              setTimeout(() => e.invalidateSize(), 300));
          }));
      })(i);
    else {
      const t = document.getElementById("nt-route-map");
      t &&
        (t.innerHTML =
          '<div style="text-align:center; color:rgba(255,255,255,0.3); padding:40px;"><i class="ph ph-map-pin-line" style="font-size:48px; display:block; margin-bottom:12px;"></i><p style="font-size:13px; font-family:var(--font-display); text-transform:uppercase; letter-spacing:1px;">Nessuna coordinata disponibile</p></div>');
    }
    (a &&
      (function (t) {
        const e = document.getElementById("nt-ai-body");
        e &&
          (t && t.consigli
            ? (e.innerHTML = `      <div style="width:100%;">        <p style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.85); margin:0;">${Utils.escapeHtml(t.consigli)}</p>        ${t.fuori_percorso && t.fuori_percorso.length ? `          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">            <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#FF00FF; font-weight:700; margin-bottom:8px;"><i class="ph ph-warning"></i> Atlete Fuori Percorso</p>            ${t.fuori_percorso.map((t) => `<div style="font-size:13px; margin-bottom:4px;"><strong>${Utils.escapeHtml(t.nome)}</strong>: ${Utils.escapeHtml(t.motivo)}</div>`).join("")}          </div>` : ""}        ${t.punti_raccolta && t.punti_raccolta.length ? `          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1);">            <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#00e5ff; font-weight:700; margin-bottom:8px;"><i class="ph ph-map-pin"></i> Punti di Raccolta Suggeriti</p>            ${t.punti_raccolta.map((t) => `<div style="font-size:13px; margin-bottom:4px;"><strong>${Utils.escapeHtml(t.nome)}</strong>: ${Utils.escapeHtml(t.indirizzo)}</div>`).join("")}          </div>` : ""}      </div>`)
            : (e.innerHTML =
                '<span style="color:rgba(255,255,255,0.4); font-size:14px;">Analisi AI non disponibile al momento.</span>'));
      })(a),
      (function (t) {
        if (window.Sortable) t();
        else if (document.getElementById("sortable-js")) {
          const e = setInterval(() => {
            window.Sortable && (clearInterval(e), t());
          }, 100);
        } else {
          const e = document.createElement("script");
          ((e.id = "sortable-js"),
            (e.src =
              "https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"),
            (e.onload = t),
            document.head.appendChild(e));
        }
      })(() => {
        const t = document.querySelector(".nt-timeline");
        t &&
          !t.dataset.sortable &&
          ((t.dataset.sortable = "1"),
          window.Sortable.create(t, {
            animation: 150,
            filter: ".partenza, .arrivo",
            onEnd: function (t) {
              t.oldIndex !== t.newIndex &&
                (async function () {
                  const t = document.querySelector(".nt-timeline");
                  if (!t || !l) return;
                  const e = Array.from(t.children),
                    n = [];
                  if (
                    (e.forEach((t) => {
                      if (
                        !t.classList.contains("partenza") &&
                        !t.classList.contains("arrivo")
                      ) {
                        const e = t
                            .querySelector(".nt-tl-note")
                            .textContent.replace("Raccolta ", ""),
                          a = s.find((t) => t.full_name === e);
                        a && n.push(a);
                      }
                    }),
                    n.length === s.length)
                  ) {
                    UI.toast("Ricalcolo percorso manuale...", "info");
                    try {
                      const t =
                          document.getElementById("nt-departure-addr")?.value,
                        e = r.address || r.name,
                        a = document.getElementById("nt-arrival-time")?.value,
                        i = n.map((t) => t.residence_address);

                      let oRaw = await _(t, e, i, !1);
                      let baseD = 0;
                      for (let idx = 0; idx < oRaw.routes[0].legs.length; idx++) {
                        baseD += oRaw.routes[0].legs[idx].duration.value;
                        if (idx > 0 && idx < oRaw.routes[0].legs.length - 1) baseD += 180;
                      }
                      const [hx, mx] = a.split(":").map(Number);
                      const tdStr = document.getElementById("nt-transport-date")?.value || new Date().toISOString().slice(0, 10);
                      const arrD = new Date(`${tdStr}T${String(hx).padStart(2, '0')}:${String(mx).padStart(2, '0')}:00`);
                      const eDep = new Date(arrD.getTime() - 1e3 * baseD);
                      if (eDep > new Date()) {
                        oRaw = await _(t, e, i, !1, eDep);
                      }
                      const o = oRaw.routes[0];
                      const fullP = o.overview_path ? o.overview_path.map(pt => ({lat: pt.lat(), lng: pt.lng()})) : [];

                      let s = 0,
                        d = 0;
                      const p = [],
                        c = [];
                      c.push({
                        lat: o.legs[0].start_location.lat(),
                        lng: o.legs[0].start_location.lng(),
                        label: t,
                      });
                      for (let t = 0; t < o.legs.length; t++) {
                        const e = o.legs[t],
                          n = e.distance.value,
                          a = e.duration_in_traffic ? e.duration_in_traffic.value : e.duration.value,
                          i = t > 0 && t < o.legs.length - 1 ? 180 : 0;
                        ((s += n),
                          (d += a + i),
                          p.push(a + i),
                          c.push({
                            lat: e.end_location.lat(),
                            lng: e.end_location.lng(),
                            label: e.end_address,
                          }));
                      }
                      const g = {
                          durata: Math.round(d / 60) + " min",
                          distanza: (s / 1e3).toFixed(1) + " km",
                          tappe: n.length,
                        },
                        [m, b] = a.split(":").map(Number),
                        tdStr3 = document.getElementById("nt-transport-date")?.value || new Date().toISOString().slice(0, 10),
                        f = new Date(new Date(`${tdStr3}T${String(m).padStart(2, '0')}:${String(b).padStart(2, '0')}:00`).getTime() - 1e3 * d),
                        x = [];
                      let v = new Date(f);
                      (x.push({
                        tipo: "partenza",
                        luogo: t,
                        orario: v.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        nota: "Partenza Mezzo",
                        coord: c[0],
                      }),
                        p.forEach((t, e) => {
                          if (
                            ((v = new Date(v.getTime() + 1e3 * t)),
                            e < n.length)
                          ) {
                            const t = n[e];
                            x.push({
                              tipo: "raccolta",
                              luogo: t.residence_address,
                              orario: v.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                              nota: `Raccolta ${t.full_name}`,
                              atleta_id: t.id,
                              atleta_name: t.full_name,
                              coord: c[e + 1],
                            });
                          } else
                            x.push({
                              tipo: "arrivo",
                              luogo: r.name,
                              orario: v.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                              nota: `Arrivo — Target: ${a}`,
                              coord: c[c.length - 1],
                            });
                        }),
                        (l.timeline = x),
                        (l.stats = g),
                        (l.departureTime = f.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })),
                        U(x, g, l.ai, c, fullP));
                    } catch (t) {
                      UI.toast("Errore nel ricalcolo: " + t.message, "error");
                    }
                  }
                })();
            },
          }));
      }));
  }
  async function S() {
    if (!l || !r || !o) return void UI.toast("Dati incompleti", "error");
    const t = document.getElementById("nt-save-btn");
    ((t.disabled = !0),
      (t.innerHTML =
        '<div class="spinner" style="width:18px;height:18px;"></div> Salvataggio...'));
    try {
      (await Store.api("saveTransport", "transport", {
        team_id: o,
        destination_name: r.name,
        destination_address: r.address || null,
        destination_lat: r.lat || null,
        destination_lng: r.lng || null,
        departure_address:
          document.getElementById("nt-departure-addr")?.value || null,
        arrival_time: document.getElementById("nt-arrival-time")?.value,
        departure_time: l.departureTime || null,
        transport_date:
          document.getElementById("nt-transport-date")?.value ||
          new Date().toISOString().slice(0, 10),
        athletes_json: s.map((t) => ({
          id: t.id,
          name: t.full_name,
          address: t.residence_address,
        })),
        timeline_json: l.timeline,
        stats_json: l.stats,
      }),
        UI.toast("Trasporto salvato con successo!", "success"),
        L());
    } catch (e) {
      (UI.toast("Errore: " + e.message, "error"),
        (t.disabled = !1),
        (t.innerHTML =
          '<i class="ph ph-floppy-disk" style="font-size:20px;"></i> Salva Trasporto'));
    }
  }
  async function L() {
    const e = document.getElementById("app");
    e.innerHTML = UI.skeletonPage();
    try {
      const n = await Store.get("listTransports", "transport"),
        a =
          "      ";
      ((e.innerHTML =
        a +
        `      <div class="st-page">        <div class="st-top">          <div class="st-title">            <button class="btn-dash ghost" id="st-back" type="button" style="padding:10px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>            Storico <span style="color:#00e5ff;">Trasporti</span>          </div>          <button class="btn-dash primary" id="st-nuovo-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO TRASPORTO</button>        </div>        ${
          0 === n.length
            ? '          <div style="text-align:center; padding:80px 20px; color:rgba(255,255,255,0.4);">            <i class="ph ph-van" style="font-size:64px; display:block; margin-bottom:16px; opacity:0.3;"></i>            <p style="font-family:var(--font-display); font-size:18px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Nessun Trasporto Salvato</p>            <p style="margin-top:8px; font-size:14px;">Crea il tuo primo trasporto per vederlo qui.</p>          </div>'
            : n
                .map((t) => {
                  let e = [];
                  try {
                    e =
                      "string" == typeof t.athletes_json
                        ? JSON.parse(t.athletes_json)
                        : t.athletes_json || [];
                  } catch {
                    e = [];
                  }
                  let n = {};
                  try {
                    n =
                      "string" == typeof t.stats_json
                        ? JSON.parse(t.stats_json)
                        : t.stats_json || {};
                  } catch {
                    n = {};
                  }
                  const a = t.transport_date
                    ? new Date(t.transport_date).toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    : "";
                  return `            <div class="st-card">              <div class="st-card-title"><i class="ph ph-map-pin" style="margin-right:8px;"></i>${Utils.escapeHtml(t.destination_name)}</div>              <div class="st-card-meta">                <span><i class="ph ph-calendar-blank"></i> ${Utils.escapeHtml(a)}</span>                <span><i class="ph ph-clock"></i> Arrivo: ${Utils.escapeHtml(t.arrival_time || "")}</span>                ${t.departure_time ? `<span><i class="ph ph-van"></i> Partenza: ${Utils.escapeHtml(t.departure_time)}</span>` : ""}                ${n.durata ? `<span><i class="ph ph-timer"></i> ${Utils.escapeHtml(n.durata)}</span>` : ""}                ${n.distanza ? `<span><i class="ph ph-navigation-arrow"></i> ${Utils.escapeHtml(n.distanza)}</span>` : ""}              </div>              <div class="st-card-athletes">                <i class="ph ph-users" style="margin-right:4px;"></i>                ${e.map((t) => Utils.escapeHtml(t.name || t.full_name || "")).join(", ") || "Nessuna atleta"}              </div>            </div>`;
                })
                .join("")
        }      </div>`),
        document
          .getElementById("st-back")
          ?.addEventListener("click", () => c(), { signal: t.signal }),
        document
          .getElementById("st-nuovo-btn")
          ?.addEventListener("click", () => x(), { signal: t.signal }));
    } catch (n) {
      ((e.innerHTML = `<div style="padding:40px;text-align:center;"><p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Errore: ${Utils.escapeHtml(n.message)}</p><button class="btn btn-ghost" id="st-err-back" type="button"><i class="ph ph-arrow-left"></i> Torna indietro</button></div>`),
        document
          .getElementById("st-err-back")
          ?.addEventListener("click", () => c(), { signal: t.signal }));
    }
  }
  async function B() {
    const e = document.getElementById("app");
    e.innerHTML = UI.skeletonPage();
    const n = App.getUser(),
      a = ["admin", "manager", "operator"].includes(n?.role);
    try {
      const n = await Store.get("listDrivers", "transport"),
        i =
          "              ";
      ((e.innerHTML =
        i +
        `        <div class="drv-page">          <div class="drv-top">            <div class="drv-title">              <button class="btn-dash" id="drv-back" type="button" style="padding:10px; -webkit-text-fill-color:unset; font-size:14px;"><i class="ph ph-arrow-left" style="font-size:20px;"></i></button>              Gestione <span style="color:#00e5ff;">Autisti</span>            </div>            ${a ? '<button class="btn-dash primary" id="drv-add-btn" type="button"><i class="ph ph-plus-circle" style="font-size:18px;"></i> AGGIUNGI AUTISTA</button>' : ""}          </div>          <div id="drv-list">            ${
          0 === n.length
            ? Utils.emptyState(
                "Nessun autista registrato",
                "Aggiungi il primo autista per iniziare.",
              )
            : `<div class="drv-grid">${n
                .map((t) =>
                  (function (t, e) {
                    (t.full_name || "")
                      .split(" ")
                      .map((t) => t[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    const n = !!t.is_active;
                    return `      <div class="drv-card ${n ? "" : "inactive"}" data-driver-id="${Utils.escapeHtml(t.id)}">        <div style="display:flex; gap:16px; align-items:flex-start;">          <div class="drv-avatar"><i class="ph ph-steering-wheel"></i></div>          <div style="flex:1; min-width:0;">            <div class="drv-name">${Utils.escapeHtml(t.full_name)}</div>            <div class="drv-meta">              ${t.phone ? `<span><i class="ph ph-phone"></i>${Utils.escapeHtml(t.phone)}</span>` : ""}              ${t.license_number ? `<span><i class="ph ph-identification-card"></i>Patente: ${Utils.escapeHtml(t.license_number)}</span>` : ""}              ${t.hourly_rate ? `<span><i class="ph ph-currency-eur"></i>${Utils.formatCurrency(t.hourly_rate)}/h</span>` : ""}              ${t.notes ? `<span style="margin-top:4px; color:rgba(255,255,255,0.35); font-size:12px;"><i class="ph ph-note"></i>${Utils.escapeHtml(t.notes)}</span>` : ""}            </div>            <span class="drv-badge ${n ? "active" : "inactive"}">              <i class="ph ${n ? "ph-check-circle" : "ph-pause-circle"}"></i>              ${n ? "Attivo" : "Non Attivo"}            </span>          </div>        </div>        ${e ? `        <div class="drv-actions">          <button class="btn-drv" data-driver-toggle="${Utils.escapeHtml(t.id)}" data-driver-active="${n ? "1" : "0"}" type="button">            <i class="ph ${n ? "ph-pause" : "ph-play"}"></i> ${n ? "Disattiva" : "Attiva"}          </button>          <button class="btn-drv danger" data-driver-delete="${Utils.escapeHtml(t.id)}" type="button">            <i class="ph ph-trash"></i> Elimina          </button>        </div>` : ""}      </div>`;
                  })(t, a),
                )
                .join("")}</div>`
        }          </div>        </div>`),
        document
          .getElementById("drv-back")
          ?.addEventListener("click", () => c(), { signal: t.signal }),
        document.getElementById("drv-add-btn")?.addEventListener(
          "click",
          () =>
            (function () {
              const e = UI.modal({
                title: "Aggiungi Autista",
                body: '        <div class="form-group">          <label class="form-label" for="drv-name">Nome completo *</label>          <input id="drv-name" class="form-input" type="text" placeholder="Mario Rossi" required>        </div>        <div class="form-group">          <label class="form-label" for="drv-phone">Telefono</label>          <input id="drv-phone" class="form-input" type="tel" placeholder="+39 340 1234567">        </div>        <div class="form-group">          <label class="form-label" for="drv-license">Numero Patente</label>          <input id="drv-license" class="form-input" type="text" placeholder="AB1234567">        </div>        <div class="form-group">          <label class="form-label" for="drv-rate">Tariffa oraria (€/h)</label>          <input id="drv-rate" class="form-input" type="number" min="0" step="0.5" placeholder="15.00">        </div>        <div class="form-group">          <label class="form-label" for="drv-notes">Note</label>          <textarea id="drv-notes" class="form-textarea" placeholder="Disponibilità, preferenze..." style="min-height:60px;"></textarea>        </div>        <div id="drv-error" class="form-error hidden"></div>',
                footer:
                  '        <button class="btn btn-ghost btn-sm" id="drv-cancel" type="button">Annulla</button>        <button class="btn btn-primary btn-sm" id="drv-save" type="button">SALVA AUTISTA</button>',
              });
              (document
                .getElementById("drv-cancel")
                ?.addEventListener("click", () => e.close(), {
                  signal: t.signal,
                }),
                document.getElementById("drv-save")?.addEventListener(
                  "click",
                  async () => {
                    const t = document.getElementById("drv-name").value.trim();
                    if (!t)
                      return (
                        (document.getElementById("drv-error").textContent =
                          "Il nome è obbligatorio"),
                        void document
                          .getElementById("drv-error")
                          .classList.remove("hidden")
                      );
                    const n = document.getElementById("drv-save");
                    ((n.disabled = !0), (n.textContent = "Salvataggio..."));
                    try {
                      (await Store.api("createDriver", "transport", {
                        full_name: t,
                        phone:
                          document.getElementById("drv-phone").value.trim() ||
                          null,
                        license_number:
                          document.getElementById("drv-license").value.trim() ||
                          null,
                        hourly_rate:
                          parseFloat(
                            document.getElementById("drv-rate").value,
                          ) || null,
                        notes:
                          document.getElementById("drv-notes").value.trim() ||
                          null,
                      }),
                        UI.toast("Autista aggiunto!", "success"),
                        await B(),
                        e.close());
                    } catch (t) {
                      ((document.getElementById("drv-error").textContent =
                        t.message),
                        document
                          .getElementById("drv-error")
                          .classList.remove("hidden"),
                        (n.disabled = !1),
                        (n.textContent = "SALVA AUTISTA"));
                    }
                  },
                  { signal: t.signal },
                ));
            })(),
          { signal: t.signal },
        ),
        Utils.qsa("[data-driver-toggle]").forEach((e) =>
          e.addEventListener(
            "click",
            async () => {
              const t = e.dataset.driverToggle,
                n = "1" === e.dataset.driverActive;
              try {
                (await Store.api("toggleDriverActive", "transport", {
                  id: t,
                  is_active: !n,
                }),
                  UI.toast(
                    n ? "Autista disattivato" : "Autista attivato",
                    "success",
                  ),
                  B());
              } catch (t) {
                UI.toast("Errore: " + t.message, "error");
              }
            },
            { signal: t.signal },
          ),
        ),
        Utils.qsa("[data-driver-delete]").forEach((e) =>
          e.addEventListener(
            "click",
            () => {
              const t = e.dataset.driverDelete;
              UI.confirm("Eliminare questo autista?", async () => {
                try {
                  (await Store.api("deleteDriver", "transport", { id: t }),
                    UI.toast("Autista eliminato", "success"),
                    B());
                } catch (t) {
                  UI.toast("Errore: " + t.message, "error");
                }
              });
            },
            { signal: t.signal },
          ),
        ));
    } catch (n) {
      ((e.innerHTML = `<div style="padding:40px;text-align:center;"><p style="color:rgba(255,255,255,0.5);margin-bottom:24px;">Errore: ${Utils.escapeHtml(n.message)}</p><button class="btn btn-ghost" id="drv-err-back" type="button"><i class="ph ph-arrow-left"></i> Torna indietro</button></div>`),
        document
          .getElementById("drv-err-back")
          ?.addEventListener("click", () => c(), { signal: t.signal }),
        UI.toast("Errore: " + n.message, "error"));
    }
  }
  return {
    destroy: function () {
      (t.abort(), (t = new AbortController()));
    },
    init: p,
    handleAttendeeStatusChange: async function (t, e, n) {
      try {
        (await Store.api("updateAttendeeStatus", "transport", {
          event_id: t,
          athlete_id: e,
          status: n,
        }),
          UI.toast("Stato presenza aggiornato", "success"),
          u(t));
      } catch (t) {
        UI.toast("Errore: " + t.message, "error");
      }
    },
    showDriversTab: B,
  };
})();
window.Transport = Transport;
