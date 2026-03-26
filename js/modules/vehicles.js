"use strict";
const Vehicles = (() => {
  let e = new AbortController(),
    t = [],
    n = null;
  async function a() {
    const n = document.getElementById("app");
    if (n) {
      (UI.loading(!0), (n.innerHTML = UI.skeletonPage()));
      try {
        ((t = await Store.get("getAllVehicles", "vehicles")),
          (function () {
            const n = document.getElementById("app"),
              a = App.getUser(),
              s = ["admin", "manager", "operator"].includes(a?.role),
              l = t.filter((e) => "active" === e.status).length,
              r = t.filter((e) => "maintenance" === e.status).length,
              d = t.reduce((e, t) => e + (t.open_anomalies || 0), 0);
            ((n.innerHTML = `\n      <style>\n        .vehicles-dashboard {\n          padding: 24px;\n          --dash-bg: #030305;\n          --card-bg: rgba(255, 255, 255, 0.03);\n          --card-border: rgba(255, 255, 255, 0.08);\n          --card-radius: 20px;\n          --accent-cyan: #00e5ff;\n          --accent-pink: #FF00FF;\n          --accent-orange: #FF9800;\n          --accent-green: #00E676;\n          --glass-bg: rgba(20, 20, 25, 0.6);\n          --glass-blur: blur(16px);\n          --shadow-soft: 0 8px 32px 0 rgba(0, 0, 0, 0.3);\n          animation: fade-in 0.4s ease-out;\n        }\n\n        @keyframes fade-in {\n          from { opacity: 0; transform: translateY(10px); }\n          to { opacity: 1; transform: translateY(0); }\n        }\n\n        .dash-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }\n        .dash-title { \n          font-family: var(--font-display); font-size: 32px; font-weight: 800; text-transform: uppercase; margin: 0; line-height: 1.1; \n          background: linear-gradient(90deg, #fff, rgba(255,255,255,0.6)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;\n        }\n        .dash-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 500; }\n\n        .dash-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px; }\n        .dash-stat-card {\n          background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);\n          border: 1px solid var(--card-border); border-radius: var(--card-radius);\n          padding: 24px; position: relative; overflow: hidden; box-shadow: var(--shadow-soft);\n          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease;\n        }\n        .dash-stat-card:hover { transform: translateY(-4px) scale(1.02); z-index: 2; border-color: rgba(255,255,255,0.2); }\n        .dash-stat-card::before {\n          content: ''; position: absolute; top:0; left:0; width: 100%; height: 3px;\n          background: linear-gradient(90deg, var(--accent-cyan), transparent); opacity: 0.9;\n        }\n        .dash-stat-card.pink::before { background: linear-gradient(90deg, var(--accent-pink), transparent); }\n        .dash-stat-card.orange::before { background: linear-gradient(90deg, var(--accent-orange), transparent); }\n        \n        .dash-stat-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1.5px; display: flex; justify-content: space-between; align-items: center; }\n        .dash-stat-icon { font-size: 20px; color: rgba(255,255,255,0.4); padding: 8px; background: rgba(255,255,255,0.03); border-radius: 12px; }\n        .dash-stat-value { font-family: var(--font-display); font-size: 42px; font-weight: 800; margin-top: 16px; line-height: 1; text-shadow: 0 2px 10px rgba(0,0,0,0.5); display: flex; align-items: baseline; gap: 8px;}\n\n        .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }\n        .vehicle-card {\n          background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));\n          border: 1px solid var(--card-border); border-radius: 16px;\n          padding: 24px; cursor: pointer; transition: all 0.3s;\n          position: relative; overflow: hidden;\n          display: flex; flex-direction: column; gap: 16px;\n        }\n        .vehicle-card:hover { transform: translateY(-4px); border-color: var(--accent-cyan); box-shadow: 0 12px 30px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,229,255,0.1); }\n        .vehicle-card::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: var(--accent-cyan); opacity: 0; transition: opacity 0.3s; }\n        .vehicle-card:hover::before { opacity: 1; }\n        \n        .vehicle-header { display: flex; justify-content: space-between; align-items: flex-start; }\n        .vehicle-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }\n        .vehicle-plate { display: inline-block; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.2); }\n        \n        .vehicle-status { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; }\n        .status-active { background: rgba(0,230,118,0.1); color: var(--accent-green); border: 1px solid rgba(0,230,118,0.2); }\n        .status-maintenance { background: rgba(255,152,0,0.1); color: var(--accent-orange); border: 1px solid rgba(255,152,0,0.2); }\n        .status-out { background: rgba(255,0,0,0.1); color: #FF5252; border: 1px solid rgba(255,0,0,0.2); }\n\n        .vehicle-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }\n        .v-metric { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 6px; }\n        .v-metric i { color: var(--accent-cyan); }\n        .v-metric.alert i { color: #FF5252; }\n        .v-metric.alert span { color: #FF5252; font-weight: bold; }\n\n        .btn-dash { \n          background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; \n          padding: 12px 24px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); \n          text-transform: uppercase; letter-spacing: 1.5px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;\n          backdrop-filter: blur(8px);\n        }\n        .btn-dash:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }\n        .btn-dash.primary { background: linear-gradient(135deg, var(--accent-cyan), #00b3cc); color: #000; border: none; box-shadow: 0 4px 20px rgba(0,229,255,0.4); }\n        .btn-dash.primary:hover { box-shadow: 0 8px 30px rgba(0,229,255,0.6); color:#000;}\n      </style>\n    \n      <div class="vehicles-dashboard">\n        <div class="dash-top-bar">\n          <div>\n            <h1 class="dash-title">Gestione <span style="color:var(--accent-cyan);">Mezzi</span></h1>\n            <p class="dash-subtitle">${t.length} veicoli nel parco mezzi</p>\n          </div>\n          <div style="display:flex; gap:12px;">\n            ${s ? '<button class="btn-dash primary" id="new-vehicle-btn" type="button"><i class="ph ph-plus-circle" style="font-size:20px;"></i> NUOVO MEZZO</button>' : ""}\n          </div>\n        </div>\n\n        <div class="dash-stat-grid">\n          <div class="dash-stat-card">\n            <div class="dash-stat-title">Flotta Attiva <div class="dash-stat-icon"><i class="ph ph-check-circle"></i></div></div>\n            <div class="dash-stat-value">${l} <span style="font-size:16px; color:rgba(255,255,255,0.5); font-weight:500;">/ ${t.length}</span></div>\n          </div>\n          <div class="dash-stat-card orange">\n            <div class="dash-stat-title">In Manutenzione <div class="dash-stat-icon"><i class="ph ph-wrench"></i></div></div>\n            <div class="dash-stat-value" style="color:var(--accent-orange);">${r}</div>\n          </div>\n          <div class="dash-stat-card pink">\n            <div class="dash-stat-title">Anomalie Aperte <div class="dash-stat-icon"><i class="ph ph-warning"></i></div></div>\n            <div class="dash-stat-value" style="color:var(--accent-pink);">${d}</div>\n          </div>\n        </div>\n\n        ${
              0 === t.length
                ? Utils.emptyState(
                    "Nessun mezzo trovato",
                    "Aggiungi il primo veicolo al parco mezzi.",
                  )
                : `\n          <div class="vehicle-grid">\n            ${t
                    .map((e) => {
                      let t = "Attivo",
                        n = "status-active";
                      return (
                        "maintenance" === e.status &&
                          ((t = "In Manutenzione"), (n = "status-maintenance")),
                        "out_of_service" === e.status &&
                          ((t = "Fuori Servizio"), (n = "status-out")),
                        `\n              <div class="vehicle-card" data-id="${e.id}">\n                <div class="vehicle-header">\n                  <div>\n                    <div class="vehicle-name">${Utils.escapeHtml(e.name)}</div>\n                    <div class="vehicle-plate">${Utils.escapeHtml(e.license_plate)}</div>\n                  </div>\n                  <div class="vehicle-status ${n}">${t}</div>\n                </div>\n                \n                <div class="vehicle-metrics">\n                  <div class="v-metric" title="Posti a sedere">\n                    <i class="ph ph-users"></i>\n                    <span>${e.capacity} Posti</span>\n                  </div>\n                  <div class="v-metric">\n                    <i class="ph ph-calendar-check"></i>\n                    <span>Scadenza Bollo: ${e.road_tax_expiry ? Utils.formatDate(e.road_tax_expiry) : "N/D"}</span>\n                  </div>\n                  <div class="v-metric ${e.open_anomalies > 0 ? "alert" : ""}" style="grid-column: span 2;">\n                    <i class="ph ph-warning-circle"></i>\n                    <span>${e.open_anomalies > 0 ? `${e.open_anomalies} Anomalie Aperte` : "Nessuna anomalia"}</span>\n                  </div>\n                </div>\n              </div>\n              `
                      );
                    })
                    .join("")}\n          </div>\n        `
            }\n      </div>\n    `),
              document
                .getElementById("new-vehicle-btn")
                ?.addEventListener("click", () => i(), { signal: e.signal }),
              Utils.qsa(".vehicle-card").forEach((t) => {
                t.addEventListener("click", () => o(t.dataset.id), {
                  signal: e.signal,
                });
              }));
          })());
      } catch (e) {
        ((n.innerHTML = Utils.emptyState(
          "Errore nel caricamento dei mezzi",
          e.message,
        )),
          UI.toast("Errore caricamento mezzi", "error"));
      } finally {
        UI.loading(!1);
      }
    }
  }
  function i(t = null) {
    const n = UI.modal({
      title: t ? "Modifica Mezzo" : "Nuovo Mezzo",
      body: `\n        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3); margin-bottom:var(--sp-2);">\n            <div>\n                <label class="form-label">Nome/Modello *</label>\n                <input id="veh-name" class="form-input" type="text" value="${t?.name || ""}" placeholder="es: Pulmino Ducato">\n            </div>\n            <div>\n                <label class="form-label">Targa *</label>\n                <input id="veh-plate" class="form-input" type="text" value="${t?.license_plate || ""}" style="text-transform:uppercase;">\n            </div>\n            <div>\n                <label class="form-label">Capacità (Posti)</label>\n                <input id="veh-cap" class="form-input" type="number" min="1" value="${t?.capacity || 9}">\n            </div>\n            <div>\n                <label class="form-label">Stato</label>\n                <select id="veh-status" class="form-input">\n                  <option value="active" ${"active" === t?.status ? "selected" : ""}>Attivo</option>\n                  <option value="maintenance" ${"maintenance" === t?.status ? "selected" : ""}>In Manutenzione</option>\n                  <option value="out_of_service" ${"out_of_service" === t?.status ? "selected" : ""}>Fuori Servizio</option>\n                </select>\n            </div>\n            <div>\n                <label class="form-label">Scadenza Assicurazione</label>\n                <input id="veh-ins" class="form-input" type="date" value="${t?.insurance_expiry || ""}">\n            </div>\n            <div>\n                <label class="form-label">Scadenza Bollo</label>\n                <input id="veh-tax" class="form-input" type="date" value="${t?.road_tax_expiry || ""}">\n            </div>\n            <div style="grid-column: span 2;">\n                <label class="form-label">Note</label>\n                <textarea id="veh-notes" class="form-textarea" rows="2">${t?.notes || ""}</textarea>\n            </div>\n        </div>\n        <div id="veh-error" class="form-error hidden"></div>\n      `,
      footer: `\n            ${t ? '<button class="btn btn-ghost btn-danger btn-sm" id="veh-del" style="margin-right:auto;" type="button">Elimina</button>' : ""}\n            <button class="btn btn-ghost btn-sm" id="veh-cancel" type="button">Annulla</button>\n            <button class="btn btn-primary btn-sm" style="color:#000;" id="veh-save" type="button">Salva</button>\n      `,
    });
    (document
      .getElementById("veh-cancel")
      ?.addEventListener("click", () => n.close(), { signal: e.signal }),
      document.getElementById("veh-save")?.addEventListener(
        "click",
        async () => {
          const e = document.getElementById("veh-name").value.trim(),
            i = document.getElementById("veh-plate").value.trim().toUpperCase();
          if (!e || !i)
            return (
              (document.getElementById("veh-error").textContent =
                "Nome e targa sono obbligatori"),
              void document
                .getElementById("veh-error")
                .classList.remove("hidden")
            );
          const o = document.getElementById("veh-save");
          ((o.disabled = !0), (o.innerHTML = "Salvataggio..."));
          try {
            const o = {
              name: e,
              license_plate: i,
              capacity: document.getElementById("veh-cap").value,
              status: document.getElementById("veh-status").value,
              insurance_expiry:
                document.getElementById("veh-ins").value || null,
              road_tax_expiry: document.getElementById("veh-tax").value || null,
              notes: document.getElementById("veh-notes").value || null,
            };
            (t && (o.id = t.id),
              await Store.api(
                t ? "updateVehicle" : "createVehicle",
                "vehicles",
                o,
              ),
              UI.toast(t ? "Mezzo aggiornato" : "Mezzo aggiunto", "success"),
              await a(),
              n.close());
          } catch (e) {
            ((document.getElementById("veh-error").textContent = e.message),
              document.getElementById("veh-error").classList.remove("hidden"),
              (o.disabled = !1),
              (o.innerHTML = "Salva"));
          }
        },
        { signal: e.signal },
      ),
      document.getElementById("veh-del")?.addEventListener(
        "click",
        () => {
          UI.confirm(
            `Eliminare definitivamente il mezzo "${t?.name || ""}"? Verranno eliminati anche tutto lo storico manutenzioni e anomalie!`,
            async () => {
              const e = document.getElementById("veh-del");
              e && (e.disabled = !0);
              try {
                (await Store.api("deleteVehicle", "vehicles", { id: t.id }),
                  UI.toast("Veicolo eliminato", "success"),
                  await a(),
                  n.close());
              } catch (t) {
                (UI.toast(t.message, "error"), e && (e.disabled = !1));
              }
            },
          );
        },
        { signal: e.signal },
      ));
  }
  async function o(t) {
    const s = document.getElementById("app");
    (UI.loading(!0), (s.innerHTML = UI.skeletonPage()));
    try {
      ((n = await Store.get("getVehicleById", "vehicles", { id: t })),
        (function () {
          const t = n;
          if (!t) return;
          const s = document.getElementById("app"),
            l = App.getUser(),
            r = ["admin", "manager", "operator"].includes(l?.role);
          let d = "anomalies";
          const c = () => {
              let n = "Attivo",
                o = "var(--accent-green)";
              ("maintenance" === t.status &&
                ((n = "In Manutenzione"), (o = "var(--accent-orange)")),
                "out_of_service" === t.status &&
                  ((n = "Fuori Servizio"), (o = "#FF5252")),
                (s.innerHTML = `\n        <style>\n          .detail-header {\n            padding: 32px 24px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05);\n            display: flex; justify-content: space-between; align-items: flex-end; position: relative; overflow: hidden;\n          }\n          .detail-header::before {\n            content: ''; position: absolute; top:0; left:0; width: 100%; height: 100%;\n            background: radial-gradient(circle at top right, rgba(0,229,255,0.05), transparent 40%); pointer-events: none;\n          }\n          \n          .v-title-wrap { position: relative; z-index: 1;}\n          .v-plate-badge { display: inline-block; background: #fff; color: #000; padding: 4px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold; margin-bottom: 12px; border: 2px solid #ccc; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }\n          .v-title { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: #fff; margin: 0 0 8px 0; line-height: 1; }\n          .v-subtitle { font-size: 14px; color: ${o}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }\n          \n          /* Tabs CSS moved to global */\n          \n          .v-content { padding: 32px 24px; }\n          \n          .btn-dash { \n            background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; \n            padding: 10px 20px; font-weight: 700; font-size: 12px; cursor: pointer; transition: all 0.3s; \n            text-transform: uppercase; letter-spacing: 1px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;\n          }\n          .btn-dash:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }\n          \n          /* Cards inside tabs */\n          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }\n          .info-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; }\n          .info-lbl { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }\n          .info-val { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 16px; }\n        </style>\n        \n        <div class="detail-header">\n          <div class="v-title-wrap">\n            <div style="margin-bottom: 12px;">\n               <button class="btn btn-ghost btn-sm" id="btn-back" style="color:rgba(255,255,255,0.6); padding:0;"><i class="ph ph-arrow-left"></i> Torna ai Mezzi</button>\n            </div>\n            <div class="v-plate-badge">${Utils.escapeHtml(t.license_plate)}</div>\n            <h1 class="v-title">${Utils.escapeHtml(t.name)}</h1>\n            <div class="v-subtitle"><span style="width:8px;height:8px;border-radius:50%;background:${o};display:inline-block;box-shadow:0 0 10px ${o};"></span> ${n}</div>\n          </div>\n          <div style="display:flex; gap:12px;">\n             ${r ? '<button class="btn-dash" id="btn-edit-veh"><i class="ph ph-pencil-simple"></i> Modifica</button>' : ""}\n          </div>\n        </div>\n        \n        <div class="v-tabs fusion-tabs-container" style="margin: 0 24px;">\n          <div class="v-tab ${"anomalies" === d ? "active" : ""}" data-tab="anomalies"><i class="ph ph-warning"></i> Anomalie (${t.anomalies?.filter((e) => "resolved" !== e.status).length || 0})</div>\n          <div class="v-tab ${"maintenance" === d ? "active" : ""}" data-tab="maintenance"><i class="ph ph-wrench"></i> Manutenzione (${t.maintenance?.length || 0})</div>\n          <div class="v-tab ${"info" === d ? "active" : ""}" data-tab="info"><i class="ph ph-list-dashes"></i> Info e Scadenze</div>\n        </div>\n        \n        <div class="v-content" id="tab-content">\n          ${"info" === d ? p() : "maintenance" === d ? m() : "anomalies" === d ? g() : void 0}\n        </div>\n      `),
                document
                  .getElementById("btn-back")
                  ?.addEventListener("click", () => a(), { signal: e.signal }),
                document
                  .getElementById("btn-edit-veh")
                  ?.addEventListener("click", () => i(t), { signal: e.signal }),
                Utils.qsa(".v-tab").forEach((t) =>
                  t.addEventListener(
                    "click",
                    () => {
                      ((d = t.dataset.tab), c());
                    },
                    { signal: e.signal },
                  ),
                ),
                f());
            },
            p = () =>
              `\n      <div class="info-grid">\n        <div class="info-card">\n          <h3 style="margin-top:0; margin-bottom: 24px; font-size:14px; text-transform:uppercase; color:var(--accent-cyan);">Dettagli Tecnici</h3>\n          <div class="info-lbl">Capacità</div>\n          <div class="info-val">${t.capacity} Posti a sedere</div>\n          <div class="info-lbl">Stato Attuale</div>\n          <div class="info-val">${"active" === t.status ? "Attivo" : "maintenance" === t.status ? "In Manutenzione" : "Fuori Servizio"}</div>\n          <div class="info-lbl">Note Aggiuntive</div>\n          <div class="info-val" style="color:rgba(255,255,255,0.7); font-weight:400; font-size:14px;">${t.notes ? Utils.escapeHtml(t.notes).replace(/\\n/g, "<br>") : "—"}</div>\n        </div>\n        <div class="info-card">\n          <h3 style="margin-top:0; margin-bottom: 24px; font-size:14px; text-transform:uppercase; color:var(--accent-pink);">Scadenze</h3>\n          <div class="info-lbl">Scadenza Assicurazione</div>\n          <div class="info-val" style="${v(t.insurance_expiry) ? "color:#FF5252" : ""}">${t.insurance_expiry ? Utils.formatDate(t.insurance_expiry) : "N/D"}</div>\n          <div class="info-lbl">Scadenza Bollo (Road Tax)</div>\n          <div class="info-val" style="${v(t.road_tax_expiry) ? "color:#FF5252" : ""}">${t.road_tax_expiry ? Utils.formatDate(t.road_tax_expiry) : "N/D"}</div>\n        </div>\n      </div>\n    `,
            m = () =>
              `\n      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">\n        <h2 style="margin:0; font-size:20px; font-weight:800;">Registro Manutenzioni / Tagliandi</h2>\n        <button class="btn-dash" id="btn-add-maint" style="background:var(--accent-cyan); color:#000; border:none;"><i class="ph ph-plus"></i> Registra Manutenzione</button>\n      </div>\n      \n      ${t.maintenance && 0 !== t.maintenance.length ? `\n        <div class="table-wrapper">\n          <table class="table">\n            <thead>\n              <tr>\n                <th>Data</th>\n                <th>Tipo</th>\n                <th>Km</th>\n                <th>Descrizione</th>\n                <th>Costo</th>\n                <th>Prossimo Controllo</th>\n              </tr>\n            </thead>\n            <tbody>\n              ${t.maintenance.map((e) => `\n                <tr>\n                  <td style="font-weight:600;">${Utils.formatDate(e.maintenance_date)}</td>\n                  <td>${h(e.type)}</td>\n                  <td>${e.mileage ? e.mileage.toLocaleString() + " km" : "—"}</td>\n                  <td>${Utils.escapeHtml(e.description || "—")}</td>\n                  <td>${e.cost > 0 ? "€ " + Utils.formatNum(e.cost, 2) : "—"}</td>\n                  <td>\n                    ${e.next_maintenance_date ? Utils.formatDate(e.next_maintenance_date) : ""}\n                    ${e.next_maintenance_date && e.next_maintenance_mileage ? "<br>" : ""}\n                    ${e.next_maintenance_mileage ? e.next_maintenance_mileage.toLocaleString() + " km" : ""}\n                  </td>\n                </tr>\n              `).join("")}\n            </tbody>\n          </table>\n        </div>\n      ` : Utils.emptyState("Nessuna manutenzione registrata", "Non ci sono interventi nello storico per questo mezzo.")}\n    `,
            g = () =>
              `\n      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">\n        <h2 style="margin:0; font-size:20px; font-weight:800;">Segnalazioni & Anomalie</h2>\n        <button class="btn-dash" id="btn-add-anomaly" style="background:var(--accent-pink); color:#fff; border:none;"><i class="ph ph-warning"></i> Segnala Guasto</button>\n      </div>\n      \n      ${t.anomalies && 0 !== t.anomalies.length ? `\n        <div class="grid-2" style="display:grid; grid-template-columns:1fr; gap:16px;">\n          ${t.anomalies.map((e) => `\n            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-left:4px solid ${b(e.severity)}; border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:flex-start;">\n              <div>\n                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">\n                  ${u(e.status)}\n                  <span style="font-size:12px; color:rgba(255,255,255,0.5);"><i class="ph ph-clock"></i> ${Utils.formatDate(e.report_date.split(" ")[0])}</span>\n                  <span style="font-size:12px; color:rgba(255,255,255,0.5);"><i class="ph ph-user"></i> ${Utils.escapeHtml(e.reporter_name || "Utente")}</span>\n                </div>\n                <div style="font-size:15px; font-weight:600; margin-bottom:8px;">${Utils.escapeHtml(e.description)}</div>\n                ${e.resolution_notes ? `<div style="font-size:13px; color:rgba(255,255,255,0.6); margin-top:12px; padding:12px; background:rgba(0,0,0,0.2); border-radius:8px;"><strong>Risoluzione:</strong> ${Utils.escapeHtml(e.resolution_notes)}</div>` : ""}\n              </div>\n              <div>\n                ${"resolved" !== e.status ? `<select class="form-input anomaly-status-update" data-id="${e.id}" style="width:140px; padding:6px 10px; font-size:13px; height:auto;">\n                  <option value="open" ${"open" === e.status ? "selected" : ""}>Aperto</option>\n                  <option value="in_progress" ${"in_progress" === e.status ? "selected" : ""}>In Lavorazione</option>\n                  <option value="resolved">Risolto...</option>\n                </select>` : `<div style="font-size:12px; color:rgba(255,255,255,0.4); text-align:right;">Risolto il<br>${Utils.formatDate(e.resolved_date.split(" ")[0])}</div>`}\n              </div>\n            </div>\n          `).join("")}\n        </div>\n      ` : Utils.emptyState("Nessuna anomalia", "Tutto funziona regolarmente.")}\n    `,
            v = (e) => !!e && new Date(e) - new Date() < 2592e6,
            b = (e) =>
              "critical" === e
                ? "#FF0000"
                : "high" === e
                  ? "#FF5252"
                  : "medium" === e
                    ? "#FF9800"
                    : "#00E676",
            u = (e) =>
              "open" === e
                ? '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(255,0,0,0.1); color:#FF5252; border:1px solid rgba(255,0,0,0.2);">Aperto</span>'
                : "in_progress" === e
                  ? '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(255,152,0,0.1); color:#FF9800; border:1px solid rgba(255,152,0,0.2);">In Lavoraz.</span>'
                  : '<span style="font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; background:rgba(0,230,118,0.1); color:#00E676; border:1px solid rgba(0,230,118,0.2);">Risolto</span>',
            h = (e) =>
              ({
                tagliando: "Tagliando / Service",
                gomme_estive: "Cambio Gomme (Estive)",
                gomme_invernali: "Cambio Gomme (Invernali)",
                riparazione: "Riparazione",
                revisione: "Revisione di Legge",
                altro: "Altro",
              })[e] || e,
            f = () => {
              (document.getElementById("btn-add-maint")?.addEventListener(
                "click",
                () =>
                  (function (e) {
                    const t = UI.modal({
                      title: "Registra Manutenzione",
                      body: `\n        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-2); margin-bottom:var(--sp-2);">\n          <div>\n            <label class="form-label">Data *</label>\n            <input type="date" id="m-date" class="form-input" value="${new Date().toISOString().split("T")[0]}">\n          </div>\n          <div>\n            <label class="form-label">Tipo *</label>\n            <select id="m-type" class="form-input">\n              <option value="tagliando">Tagliando / Service</option>\n              <option value="gomme_estive">Cambio Gomme (Estive)</option>\n              <option value="gomme_invernali">Cambio Gomme (Invernali)</option>\n              <option value="revisione">Revisione MCTC</option>\n              <option value="riparazione">Riparazione</option>\n              <option value="altro">Altro</option>\n            </select>\n          </div>\n          <div>\n            <label class="form-label">Km Attuali</label>\n            <input type="number" id="m-km" class="form-input" placeholder="es. 120500">\n          </div>\n          <div>\n            <label class="form-label">Costo Totale (€)</label>\n            <input type="number" id="m-cost" class="form-input" step="0.01" placeholder="0.00">\n          </div>\n          <div style="grid-column: span 2;">\n            <label class="form-label">Descrizione / Note</label>\n            <textarea id="m-desc" class="form-textarea" rows="2"></textarea>\n          </div>\n          <div style="grid-column: span 2; padding-top:16px; border-top:1px solid rgba(255,255,255,0.1); margin-top:8px;">\n            <p style="margin:0 0 12px 0; font-weight:bold; font-size:13px; color:var(--accent-cyan); text-transform:uppercase;">Prossimo Controllo Consigliato</p>\n          </div>\n          <div>\n            <label class="form-label">Prossima Data</label>\n            <input type="date" id="m-next-date" class="form-input">\n          </div>\n          <div>\n            <label class="form-label">Prossimi Km</label>\n            <input type="number" id="m-next-km" class="form-input" placeholder="es. 140500">\n          </div>\n        </div>\n        <div id="m-err" class="form-error hidden"></div>\n      `,
                      footer:
                        '\n         <button class="btn btn-ghost btn-sm" id="m-cancel" type="button">Annulla</button>\n         <button class="btn btn-primary btn-sm" id="m-save" type="button" style="color:#000;">Salva Manutenzione</button>\n      ',
                    });
                    (document
                      .getElementById("m-cancel")
                      ?.addEventListener("click", () => t.close()),
                      document
                        .getElementById("m-save")
                        ?.addEventListener("click", async () => {
                          const n = document.getElementById("m-date").value;
                          if (!n)
                            return (
                              (document.getElementById("m-err").textContent =
                                "La data è obbligatoria"),
                              void document
                                .getElementById("m-err")
                                .classList.remove("hidden")
                            );
                          document.getElementById("m-save").disabled = !0;
                          try {
                            (await Store.api("addMaintenance", "vehicles", {
                              vehicle_id: e,
                              maintenance_date: n,
                              type: document.getElementById("m-type").value,
                              mileage:
                                document.getElementById("m-km").value || null,
                              cost:
                                document.getElementById("m-cost").value || 0,
                              description:
                                document.getElementById("m-desc").value || null,
                              next_maintenance_date:
                                document.getElementById("m-next-date").value ||
                                null,
                              next_maintenance_mileage:
                                document.getElementById("m-next-km").value ||
                                null,
                            }),
                              UI.toast("Manutenzione salvata", "success"),
                              await o(e),
                              t.close());
                          } catch (e) {
                            ((document.getElementById("m-err").textContent =
                              e.message),
                              document
                                .getElementById("m-err")
                                .classList.remove("hidden"),
                              (document.getElementById("m-save").disabled =
                                !1));
                          }
                        }));
                  })(t.id),
                { signal: e.signal },
              ),
                document.getElementById("btn-add-anomaly")?.addEventListener(
                  "click",
                  () =>
                    (function (e) {
                      const t = UI.modal({
                        title: "Segnala Guasto / Anomalia",
                        body: '\n        <div style="margin-bottom:var(--sp-3);">\n          <label class="form-label">Gravità</label>\n          <select id="a-sev" class="form-input">\n            <option value="low">Bassa (Non pregiudica il servizio)</option>\n            <option value="medium" selected>Media (Da controllare presto)</option>\n            <option value="high">Alta (Urgente, possibile fermo macchina)</option>\n            <option value="critical">Critica (MEZZO FERMO)</option>\n          </select>\n        </div>\n        <div style="margin-bottom:var(--sp-2);">\n          <label class="form-label">Descrizione del problema *</label>\n          <textarea id="a-desc" class="form-textarea" rows="4" placeholder="Cosa è successo? Che spie sono accese? Rumori strani?"></textarea>\n        </div>\n        <div id="a-err" class="form-error hidden"></div>\n      ',
                        footer:
                          '\n         <button class="btn btn-ghost btn-sm" id="a-cancel" type="button">Annulla</button>\n         <button class="btn btn-primary btn-sm" id="a-save" type="button" style="background:var(--accent-pink); color:#fff; border:none; box-shadow:0 4px 15px rgba(255,0,255,0.4);">Invia Segnalazione</button>\n      ',
                      });
                      (document
                        .getElementById("a-cancel")
                        ?.addEventListener("click", () => t.close()),
                        document
                          .getElementById("a-save")
                          ?.addEventListener("click", async () => {
                            const n = document
                              .getElementById("a-desc")
                              .value.trim();
                            if (!n)
                              return (
                                (document.getElementById("a-err").textContent =
                                  "Inserisci una descrizione"),
                                void document
                                  .getElementById("a-err")
                                  .classList.remove("hidden")
                              );
                            document.getElementById("a-save").disabled = !0;
                            try {
                              (await Store.api("addAnomaly", "vehicles", {
                                vehicle_id: e,
                                severity:
                                  document.getElementById("a-sev").value,
                                description: n,
                              }),
                                UI.toast("Segnalazione inviata", "success"),
                                await o(e),
                                t.close());
                            } catch (e) {
                              ((document.getElementById("a-err").textContent =
                                e.message),
                                document
                                  .getElementById("a-err")
                                  .classList.remove("hidden"),
                                (document.getElementById("a-save").disabled =
                                  !1));
                            }
                          }));
                    })(t.id),
                  { signal: e.signal },
                ),
                Utils.qsa(".anomaly-status-update").forEach((a) => {
                  a.addEventListener(
                    "change",
                    async (e) => {
                      const a = e.target.value,
                        i = e.target.dataset.id;
                      if ("resolved" === a)
                        ((e.target.value = "open"),
                          (function (e) {
                            const t = UI.modal({
                              title: "Chiudi Anomalia",
                              body: '\n        <p style="font-size:13px; color:rgba(255,255,255,0.6); margin-top:0;">Inserisci i dettagli di come è stato risolto il problema.</p>\n        <div style="margin-bottom:var(--sp-2);">\n          <label class="form-label">Note di Risoluzione</label>\n          <textarea id="ar-notes" class="form-textarea" rows="3" placeholder="Es: Sostituita lampadina faro SX."></textarea>\n        </div>\n        <div id="ar-err" class="form-error hidden"></div>\n      ',
                              footer:
                                '\n         <button class="btn btn-ghost btn-sm" id="ar-cancel" type="button">Annulla</button>\n         <button class="btn btn-primary btn-sm" id="ar-save" type="button" style="color:#000; background:#00E676; box-shadow:0 4px 15px rgba(0,230,118,0.4);">Segna come Risolto</button>\n      ',
                            });
                            (document
                              .getElementById("ar-cancel")
                              ?.addEventListener("click", () => t.close()),
                              document
                                .getElementById("ar-save")
                                ?.addEventListener("click", async () => {
                                  document.getElementById("ar-save").disabled =
                                    !0;
                                  try {
                                    (await Store.api(
                                      "updateAnomalyStatus",
                                      "vehicles",
                                      {
                                        id: e,
                                        status: "resolved",
                                        resolution_notes:
                                          document
                                            .getElementById("ar-notes")
                                            .value.trim() || null,
                                      },
                                    ),
                                      UI.toast("Anomalia chiusa", "success"),
                                      n && (await o(n.id)),
                                      t.close());
                                  } catch (e) {
                                    ((document.getElementById(
                                      "ar-err",
                                    ).textContent = e.message),
                                      document
                                        .getElementById("ar-err")
                                        .classList.remove("hidden"),
                                      (document.getElementById(
                                        "ar-save",
                                      ).disabled = !1));
                                  }
                                }));
                          })(i));
                      else
                        try {
                          (UI.loading(!0),
                            await Store.api("updateAnomalyStatus", "vehicles", {
                              id: i,
                              status: a,
                            }),
                            UI.toast("Stato aggiornato", "success"),
                            await o(t.id));
                        } catch (e) {
                          UI.toast(e.message, "error");
                        } finally {
                          UI.loading(!1);
                        }
                    },
                    { signal: e.signal },
                  );
                }));
            };
          c();
        })());
    } catch (e) {
      (UI.toast(e.message, "error"), await a());
    } finally {
      UI.loading(!1);
    }
  }
  return { init: a };
})();
window.Vehicles = Vehicles;
