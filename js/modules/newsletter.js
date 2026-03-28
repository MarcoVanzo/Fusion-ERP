"use strict";
const Newsletter = (() => {
  let _controller = new AbortController();

  function sig() {
    return { signal: _controller.signal };
  }

  // ─── STATE ────────────────────────────────────────────────────────────────
  let _configured = false;
  let _stats = { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
  let _groups = [];
  let _subscribers = [];
  let _campaigns = [];
  let _meta = { total: 0 };
  let _nextCursor = null;
  let _filter = { status: "active", search: "" };

  // ─── RENDER SHELL ─────────────────────────────────────────────────────────
  function render() {
    _controller.abort();
    _controller = new AbortController();
    
    const app = document.getElementById("app");
    if (!app) return;

    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);

    if (!_configured) {
      app.innerHTML = `
                <div class="page-header">
                    <div class="page-title-group">
                        <h1 class="page-title"><i class="ph ph-envelope-simple"></i> Newsletter</h1>
                        <p class="page-subtitle">Gestisci iscritti e comunicazioni tramite MailerLite.</p>
                    </div>
                </div>
                <div class="dash-card" style="max-width:600px;margin:0 auto;padding:var(--sp-5);text-align:center;">
                    <i class="ph ph-plug" style="font-size:48px;color:var(--color-text-muted);margin-bottom:16px;display:block;opacity:0.5;"></i>
                    <h2 style="margin-bottom:8px;font-size:18px;">MailerLite non configurato</h2>
                    <p style="color:var(--color-text-muted);font-size:14px;margin-bottom:var(--sp-3);">
                        Per abilitare la newsletter aggiungi la chiave API nel file <code>.env</code> del server:
                    </p>
                    <pre style="background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:8px;padding:var(--sp-3);font-size:13px;text-align:left;overflow-x:auto;">MAILERLITE_API_KEY=ml.xxxxxxxxxxxxxxxx</pre>
                    <p style="color:var(--color-text-muted);font-size:13px;margin-top:var(--sp-3);">
                        Ottieni la chiave su <a href="https://dashboard.mailerlite.com/integrations/api" target="_blank" style="color:var(--color-primary);">dashboard.mailerlite.com</a>
                    </p>
                </div>`;
      return;
    }

    app.innerHTML = `
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title"><i class="ph ph-envelope-simple"></i> Newsletter</h1>
                    <p class="page-subtitle">Gestisci iscritti, campagne e comunicazioni via email con MailerLite.</p>
                </div>
                ${
                  isAdmin
                    ? `
                <div class="page-actions">
                    <a href="https://dashboard.mailerlite.com/campaigns" target="_blank" class="btn btn-default" style="text-decoration: none;">
                        <i class="ph ph-paper-plane-right"></i> Crea Newsletter in MailerLite
                    </a>
                    <button class="btn btn-default" id="btn-nl-groups" type="button">
                        <i class="ph ph-squares-four"></i> Gestisci Gruppi
                    </button>
                    <button class="btn-dash pink" id="btn-nl-add-subscriber" type="button">
                        <i class="ph ph-plus"></i> AGGIUNGI ISCRITTO
                    </button>
                </div>`
                    : ""
                }
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom:var(--sp-4);">
                <div class="dash-stat-card">
                    <div class="stat-icon" style="background:var(--color-primary-soft);color:var(--color-primary);">
                        <i class="ph ph-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Iscritti Totali</div>
                        <div class="stat-value">${_stats.total.toLocaleString("it-IT")}</div>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="stat-icon" style="background:var(--color-success-soft);color:var(--color-success);">
                        <i class="ph ph-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Attivi</div>
                        <div class="stat-value">${_stats.active.toLocaleString("it-IT")}</div>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b;">
                        <i class="ph ph-x-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Disiscritti</div>
                        <div class="stat-value">${_stats.unsubscribed.toLocaleString("it-IT")}</div>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="stat-icon" style="background:rgba(239,68,68,0.1);color:var(--color-pink);">
                        <i class="ph ph-warning-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Da Confermare</div>
                        <div class="stat-value">${(_stats.unconfirmed || 0).toLocaleString("it-IT")}</div>
                    </div>
                </div>
            </div>

            ${renderCampaignsCard()}

            <div class="dash-card">
                <div style="margin-bottom:16px;" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <h2 class="dash-card-title"><i class="ph ph-users-three"></i> Iscritti</h2>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <div class="dash-filters" id="nl-status-filter">
                            <button class="dash-filter ${_filter.status === "active" ? "active" : ""}" data-nl-status="active" type="button">Attivi</button>
                            <button class="dash-filter ${_filter.status === "unconfirmed" ? "active" : ""}" data-nl-status="unconfirmed" type="button">Da confermare</button>
                            <button class="dash-filter ${_filter.status === "unsubscribed" ? "active" : ""}" data-nl-status="unsubscribed" type="button">Disiscritti</button>
                            <button class="dash-filter ${_filter.status === "bounced" ? "active" : ""}" data-nl-status="bounced" type="button">Bounce</button>
                        </div>
                        ${
                          isAdmin
                            ? `
                        <button class="btn-dash" id="btn-nl-export" type="button">
                            <i class="ph ph-download-simple"></i> CSV
                        </button>`
                            : ""
                        }
                    </div>
                </div>

                <div style="padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--color-border);">
                    <div class="input-wrapper" style="position:relative;max-width:320px;">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>
                        <input type="text" id="nl-search" class="form-input" placeholder="Cerca per email..." value="${Utils.escapeHtml(_filter.search)}" style="padding-left:36px;height:38px;font-size:13px;">
                    </div>
                </div>

                <div id="nl-subscribers-content" style="padding:var(--sp-4);">
                    ${renderSubscribersTable()}
                </div>

                ${
                  _nextCursor
                    ? `
                <div style="padding:var(--sp-3) var(--sp-4);border-top:1px solid var(--color-border);text-align:center;">
                    <button class="btn-dash" id="btn-nl-loadmore" type="button">
                        <i class="ph ph-arrow-down"></i> Carica altri
                    </button>
                </div>`
                    : ""
                }
            </div>`;

    bindEvents(isAdmin);
    setTimeout(initCampaignCharts, 0);
  }

  function renderCampaignsCard() {
    if (!_campaigns || _campaigns.length === 0) {
      return `
            <div class="dash-card" style="margin-bottom:var(--sp-4);">
                <div style="margin-bottom:16px;">
                    <h2 class="dash-card-title"><i class="ph ph-megaphone"></i> Ultime Campagne</h2>
                </div>
                <div style="padding:40px 20px; text-align:center; color:var(--color-text-muted);">
                    <i class="ph ph-chart-bar" style="font-size:48px; opacity:0.3; margin-bottom:16px; display:block;"></i>
                    <p style="font-weight:600; margin-bottom:4px;">Nessuna campagna recente</p>
                    <p style="font-size:13px;">Invia una campagna da MailerLite per sbloccare i grafici e le statistiche.</p>
                </div>
            </div>`;
    }

    return `
        <div class="dash-card" style="margin-bottom:var(--sp-4);">
            <div style="margin-bottom:16px;">
                <h2 class="dash-card-title"><i class="ph ph-megaphone"></i> Ultime Campagne</h2>
            </div>
            <div style="padding:var(--sp-4); border-bottom:1px solid var(--color-border);">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:var(--sp-4);">
                    <div>
                        <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; color:var(--color-text);">Trend di Apertura e Click</h3>
                        <div style="height:250px; position:relative;">
                            <canvas id="nl-chart-rates"></canvas>
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; color:var(--color-text);">Volumi di Invio</h3>
                        <div style="height:250px; position:relative;">
                            <canvas id="nl-chart-volumes"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Data Invio</th>
                            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Campagna</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Inviate</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Aperture</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Click</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${_campaigns
                          .map((c) => {
                            const date = c.scheduled_for || c.created_at || "";
                            const dateStr = date
                              ? new Date(date).toLocaleDateString("it-IT", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—";
                            const stats = c.stats || {};
                            const sent = stats.sent || 0;
                            const opens = stats.opens_count || 0;
                            const openRate = stats.open_rate?.float
                              ? stats.open_rate.float * 100
                              : sent > 0
                                ? (opens / sent) * 100
                                : 0;
                            const clicks = stats.clicks_count || 0;
                            const clickRate = stats.click_rate?.float
                              ? stats.click_rate.float * 100
                              : sent > 0
                                ? (clicks / sent) * 100
                                : 0;
                            const name = c.name || "Senza nome";

                            return `
                            <tr>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:13px;color:var(--color-text-muted);white-space:nowrap;">${dateStr}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600;">${Utils.escapeHtml(name)}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;font-size:13px;">${sent.toLocaleString("it-IT")}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;">
                                    <div style="font-weight:600;">${opens.toLocaleString("it-IT")}</div>
                                    <div style="font-size:11px;color:var(--color-text-muted);">${openRate.toFixed(1)}%</div>
                                </td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;">
                                    <div style="font-weight:600;">${clicks.toLocaleString("it-IT")}</div>
                                    <div style="font-size:11px;color:var(--color-text-muted);">${clickRate.toFixed(1)}%</div>
                                </td>
                            </tr>`;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>`;
  }

  let _chartJsLoaded = false;
  let _chartJsPromise = null;

  function loadChartJs() {
    if (_chartJsLoaded) return Promise.resolve();
    if (_chartJsPromise) return _chartJsPromise;

    _chartJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => {
        _chartJsLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return _chartJsPromise;
  }

  async function initCampaignCharts() {
    if (!_campaigns || _campaigns.length === 0) return;
    const ctxRates = document.getElementById("nl-chart-rates");
    const ctxVols = document.getElementById("nl-chart-volumes");
    if (!ctxRates || !ctxVols) return;

    try {
      await loadChartJs();
    } catch (e) {
      console.error("[Newsletter] Failed to load Chart.js", e);
      return;
    }

    // Prepare data (reverse because campaigns are newest first)
    const sorted = [..._campaigns].reverse();
    const labels = sorted.map((c) => {
      const date = c.scheduled_for || c.created_at || "";
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
      });
    });

    const sentData = sorted.map((c) => (c.stats && c.stats.sent) || 0);
    const openRates = sorted.map((c) => {
      const sent = (c.stats && c.stats.sent) || 0;
      const opens = (c.stats && c.stats.opens_count) || 0;
      return c.stats?.open_rate?.float
        ? c.stats.open_rate.float * 100
        : sent > 0
          ? (opens / sent) * 100
          : 0;
    });
    const clickRates = sorted.map((c) => {
      const sent = (c.stats && c.stats.sent) || 0;
      const clicks = (c.stats && c.stats.clicks_count) || 0;
      return c.stats?.click_rate?.float
        ? c.stats.click_rate.float * 100
        : sent > 0
          ? (clicks / sent) * 100
          : 0;
    });

    // Destroy existing instances if any
    if (window._nlChartRates) window._nlChartRates.destroy();
    if (window._nlChartVols) window._nlChartVols.destroy();

    // Colors
    const primary =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim() || "#3b82f6";
    const pink =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-pink")
        .trim() || "#ec4899";
    const textMuted =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-text-muted")
        .trim() || "#64748b";
    const border =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-border")
        .trim() || "#e2e8f0";

    Chart.defaults.color = textMuted;
    Chart.defaults.font.family = "Inter, sans-serif";

    // Rates Chart
    window._nlChartRates = new Chart(ctxRates, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Aperture (%)",
            data: openRates,
            borderColor: primary,
            backgroundColor: primary + "33",
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointBackgroundColor: "#fff",
            pointBorderColor: primary,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Click (%)",
            data: clickRates,
            borderColor: pink,
            backgroundColor: "transparent",
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: "#fff",
            pointBorderColor: pink,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: { usePointStyle: true, boxWidth: 8 },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: border },
            ticks: { callback: (v) => v + "%" },
          },
          x: { grid: { display: false } },
        },
        interaction: { mode: "nearest", axis: "x", intersect: false },
      },
    });

    // Volumes Chart
    window._nlChartVols = new Chart(ctxVols, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Email Inviate",
            data: sentData,
            backgroundColor: primary + "cc",
            borderRadius: 4,
            hoverBackgroundColor: primary,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Inviate: ${ctx.raw.toLocaleString("it-IT")}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: border } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderSubscribersTable() {
    if (_subscribers.length === 0) {
      return `<div style="text-align:center;color:var(--color-text-muted);padding:40px 0;">
                <i class="ph ph-users" style="font-size:40px;margin-bottom:12px;display:block;opacity:0.4;"></i>
                <p style="font-weight:600;margin-bottom:4px;">Nessun iscritto trovato</p>
                <p style="font-size:13px;">Prova a modificare i filtri o aggiungi il primo iscritto.</p>
            </div>`;
    }

    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const statusLabel = {
      active: "Attivo",
      unsubscribed: "Disiscriito",
      bounced: "Bounce",
      unconfirmed: "Non confermato",
      junk: "Spam",
    };
    const statusColor = {
      active: "var(--color-success)",
      unsubscribed: "var(--color-text-muted)",
      bounced: "var(--color-pink)",
      unconfirmed: "#f59e0b",
      junk: "var(--color-pink)",
    };

    return `
        <div class="table-wrapper" style="overflow-x:auto;">
            <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Email</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Nome</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Stato</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Gruppi</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Iscritto il</th>
                        ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>' : ""}
                    </tr>
                </thead>
                <tbody>
                    ${_subscribers
                      .map((sub) => {
                        const fields = sub.fields || {};
                        const getName = (key) => fields[key] || "";
                        const name =
                          [getName("name"), getName("last_name")]
                            .filter(Boolean)
                            .join(" ") || "—";
                        const groups = (sub.groups || [])
                          .map(
                            (g) =>
                              `<span style="background:var(--color-primary-soft);color:var(--color-primary);font-size:11px;padding:2px 6px;border-radius:4px;font-weight:600;">${Utils.escapeHtml(g.name)}</span>`,
                          )
                          .join(" ");
                        const date = sub.created_at
                          ? sub.created_at.substring(0, 10)
                          : "—";
                        const st = sub.status || "active";
                        return `
                        <tr>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600;">${Utils.escapeHtml(sub.email)}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">${Utils.escapeHtml(name)}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">
                                <span style="color:${statusColor[st] || "var(--color-text-muted)"};font-weight:600;font-size:12px;">${statusLabel[st] || st}</span>
                            </td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">${groups || '<span style="color:var(--color-text-muted);font-size:12px;">—</span>'}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px;color:var(--color-text-muted);">${date}</td>
                            ${
                              isAdmin
                                ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;">
                                <button class="btn-dash" data-nl-del-sub="${Utils.escapeHtml(sub.id)}" title="Elimina" type="button" style="color:var(--color-pink);">
                                    <i class="ph ph-trash"></i>
                                </button>
                            </td>`
                                : ""
                            }
                        </tr>`;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-2);">
            Visualizzati ${_subscribers.length} iscritti su ${_meta.total || _subscribers.length} totali
        </div>`;
  }

  // ─── EVENT BINDING ────────────────────────────────────────────────────────
  function bindEvents(isAdmin) {
    // Status filter chips
    document.querySelectorAll("[data-nl-status]").forEach((btn) => {
      btn.addEventListener(
        "click",
        async () => {
          _filter.status = btn.dataset.nlStatus;
          _subscribers = [];
          _nextCursor = null;
          await loadSubscribers(false);
          render();
        },
        sig(),
      );
    });

    // Search (debounced)
    let searchTimeout;
    document.getElementById("nl-search")?.addEventListener(
      "input",
      (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          _filter.search = e.target.value.trim();
          _subscribers = [];
          _nextCursor = null;
          await loadSubscribers(false);
          const content = document.getElementById("nl-subscribers-content");
          if (content) content.innerHTML = renderSubscribersTable();
        }, 400);
      },
      sig(),
    );

    // Load more
    document.getElementById("btn-nl-loadmore")?.addEventListener(
      "click",
      async () => {
        const btn = document.getElementById("btn-nl-loadmore");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Caricamento...";
        }
        await loadSubscribers(true);
        const content = document.getElementById("nl-subscribers-content");
        if (content) content.innerHTML = renderSubscribersTable();
        // Re-bind delete buttons after re-render
        bindDeleteButtons();
        if (_nextCursor) {
          const newBtn = document.getElementById("btn-nl-loadmore");
          if (newBtn) {
            newBtn.disabled = false;
            newBtn.innerHTML = '<i class="ph ph-arrow-down"></i> Carica altri';
          }
        } else {
          const container =
            document.getElementById("btn-nl-loadmore")?.parentElement;
          if (container) container.remove();
        }
      },
      sig(),
    );

    if (isAdmin) {
      // Add subscriber
      document
        .getElementById("btn-nl-add-subscriber")
        ?.addEventListener("click", () => openAddModal(), sig());

      // Manage groups
      document
        .getElementById("btn-nl-groups")
        ?.addEventListener("click", () => openGroupsModal(), sig());

      // Export CSV
      document.getElementById("btn-nl-export")?.addEventListener(
        "click",
        () => {
          window.open("api/?module=newsletter&action=exportCsv", "_blank");
        },
        sig(),
      );

      bindDeleteButtons();
    }
  }

  function bindDeleteButtons() {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    if (!isAdmin) return;
    document.querySelectorAll("[data-nl-del-sub]").forEach((btn) => {
      btn.addEventListener(
        "click",
        () => confirmDeleteSubscriber(btn.dataset.nlDelSub),
        sig(),
      );
    });
  }

  // ─── DATA LOADING ─────────────────────────────────────────────────────────
  async function loadSubscribers(append = false) {
    try {
      const params = { limit: 25 };
      if (_nextCursor) params.cursor = _nextCursor;
      if (_filter.status) params.status = _filter.status;
      if (_filter.search) params.search = _filter.search;

      const result = await Store.get("listSubscribers", "newsletter", params);

      if (append) {
        _subscribers = [..._subscribers, ...(result.data || [])];
      } else {
        _subscribers = result.data || [];
      }
      _meta = result.meta || { total: _subscribers.length };
      _nextCursor = extractCursor(result.links?.next);
    } catch (err) {
      console.error("[Newsletter] loadSubscribers error:", err);
    }
  }

  function extractCursor(nextUrl) {
    if (!nextUrl) return null;
    try {
      const url = new URL(nextUrl);
      return url.searchParams.get("cursor");
    } catch {
      return null;
    }
  }

  // ─── ADD SUBSCRIBER MODAL ─────────────────────────────────────────────────
  function openAddModal() {
    const groupsOptions = _groups
      .map(
        (g) =>
          `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 0;">
                <input type="checkbox" class="nl-group-check" value="${Utils.escapeHtml(g.id)}" style="width:16px;height:16px;">
                ${Utils.escapeHtml(g.name)}
            </label>`,
      )
      .join("");

    const modal = UI.modal({
      title: "Nuovo Iscritto",
      body: `
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="nl-sub-name">Nome</label>
                        <input id="nl-sub-name" class="form-input" type="text" placeholder="Mario">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="nl-sub-lastname">Cognome</label>
                        <input id="nl-sub-lastname" class="form-input" type="text" placeholder="Rossi">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="nl-sub-email">Email *</label>
                    <input id="nl-sub-email" class="form-input" type="email" placeholder="mario.rossi@esempio.it">
                </div>
                ${
                  _groups.length > 0
                    ? `
                <div class="form-group">
                    <label class="form-label">Gruppi</label>
                    <div style="border:1px solid var(--color-border);border-radius:8px;padding:var(--sp-2) var(--sp-3);max-height:160px;overflow-y:auto;">
                        ${groupsOptions}
                    </div>
                </div>`
                    : ""
                }
                <div id="nl-sub-error" class="form-error hidden"></div>
            `,
      footer: `
                <button class="btn-dash" id="nl-sub-cancel" type="button">Annulla</button>
                <button class="btn-dash pink" id="nl-sub-save" type="button">AGGIUNGI</button>
            `,
    });

    document
      .getElementById("nl-sub-cancel")
      ?.addEventListener("click", () => modal.close());
    document
      .getElementById("nl-sub-save")
      ?.addEventListener("click", async () => {
        const email = document.getElementById("nl-sub-email")?.value.trim();
        const name = document.getElementById("nl-sub-name")?.value.trim();
        const last = document.getElementById("nl-sub-lastname")?.value.trim();
        const errEl = document.getElementById("nl-sub-error");
        const groups = [
          ...document.querySelectorAll(".nl-group-check:checked"),
        ].map((c) => c.value);

        if (!email || !email.includes("@")) {
          errEl.textContent = "Inserisci un indirizzo email valido";
          errEl.classList.remove("hidden");
          return;
        }

        const saveBtn = document.getElementById("nl-sub-save");
        saveBtn.disabled = true;
        saveBtn.textContent = "Aggiunta...";

        try {
          await Store.api("upsertSubscriber", "newsletter", {
            email,
            name: name || null,
            last_name: last || null,
            groups,
          });
          _subscribers = [];
          _nextCursor = null;
          await loadSubscribers(false);
          [_stats] = await Promise.all([
            Store.get("getStats", "newsletter").catch(() => _stats),
          ]);
          UI.toast("Iscritto aggiunto con successo", "success");
          render();
          modal.close();
        } catch (err) {
          errEl.textContent = err.message;
          errEl.classList.remove("hidden");
          saveBtn.disabled = false;
          saveBtn.textContent = "AGGIUNGI";
        }
      });
  }

  // ─── DELETE SUBSCRIBER ────────────────────────────────────────────────────
  function confirmDeleteSubscriber(id) {
    const sub = _subscribers.find((s) => s.id === id);
    const m = UI.modal({
      title: "Elimina Iscritto",
      body: `<p style="font-size:14px;">Sei sicuro di voler eliminare <strong>${Utils.escapeHtml(sub?.email || id)}</strong> da MailerLite?<br><span style="color:var(--color-text-muted);font-size:13px;">Questa azione è irreversibile.</span></p>`,
      footer: `
                <button class="btn-dash" id="nl-del-cancel" type="button">Annulla</button>
                <button class="btn-dash pink" id="nl-del-ok" type="button" style="background:var(--color-pink);">ELIMINA</button>
            `,
    });
    document
      .getElementById("nl-del-cancel")
      ?.addEventListener("click", () => m.close());
    document
      .getElementById("nl-del-ok")
      ?.addEventListener("click", async () => {
        try {
          await Store.api("deleteSubscriber", "newsletter", { id });
          _subscribers = _subscribers.filter((s) => s.id !== id);
          if (_stats.total > 0) _stats.total--;
          if (_stats.active > 0 && (sub?.status === "active" || !sub?.status))
            _stats.active--;
          UI.toast("Iscritto eliminato", "success");
          render();
          m.close();
        } catch (err) {
          UI.toast("Errore: " + err.message, "error");
        }
      });
  }

  // ─── GROUPS MODAL ─────────────────────────────────────────────────────────
  function openGroupsModal() {
    function renderGroupList() {
      if (_groups.length === 0)
        return `<p style="text-align:center;color:var(--color-text-muted);padding:20px 0;font-size:14px;">Nessun gruppo creato</p>`;
      return _groups
        .map(
          (g) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">${Utils.escapeHtml(g.name)}</div>
                        <div style="font-size:12px;color:var(--color-text-muted);">${g.active_count || 0} iscritti attivi</div>
                    </div>
                    <button class="btn-dash" data-del-group="${Utils.escapeHtml(g.id)}" type="button" style="color:var(--color-pink);">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>`,
        )
        .join("");
    }

    const modal = UI.modal({
      title: "Gestione Gruppi",
      body: `
                <div style="margin-bottom:var(--sp-3);">
                    <div style="display:flex;gap:8px;">
                        <input id="nl-group-name" class="form-input" type="text" placeholder="Nome nuovo gruppo..." style="flex:1;">
                        <button class="btn-dash pink" id="nl-group-create" type="button"><i class="ph ph-plus"></i> Crea</button>
                    </div>
                    <div id="nl-group-error" class="form-error hidden" style="margin-top:6px;"></div>
                </div>
                <div id="nl-groups-list">${renderGroupList()}</div>
            `,
      footer: `<button class="btn-dash" id="nl-groups-close" type="button">Chiudi</button>`,
    });

    document
      .getElementById("nl-groups-close")
      ?.addEventListener("click", () => modal.close());

    function rebindDeleteBtns() {
      document.querySelectorAll("[data-del-group]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const gid = btn.dataset.delGroup;
          try {
            await Store.api("deleteGroup", "newsletter", { id: gid });
            _groups = _groups.filter((g) => g.id !== gid);
            const list = document.getElementById("nl-groups-list");
            if (list) list.innerHTML = renderGroupList();
            rebindDeleteBtns();
            UI.toast("Gruppo eliminato", "success");
          } catch (err) {
            UI.toast("Errore: " + err.message, "error");
          }
        });
      });
    }
    rebindDeleteBtns();

    document
      .getElementById("nl-group-create")
      ?.addEventListener("click", async () => {
        const name = document.getElementById("nl-group-name")?.value.trim();
        const errEl = document.getElementById("nl-group-error");
        if (!name) {
          errEl.textContent = "Il nome è obbligatorio";
          errEl.classList.remove("hidden");
          return;
        }
        const btn = document.getElementById("nl-group-create");
        btn.disabled = true;
        btn.textContent = "Creazione...";
        try {
          const newGroup = await Store.api("createGroup", "newsletter", {
            name,
          });
          if (newGroup?.id) _groups.push(newGroup);
          else
            _groups = await Store.get("listGroups", "newsletter").catch(
              () => _groups,
            );
          const list = document.getElementById("nl-groups-list");
          if (list) list.innerHTML = renderGroupList();
          rebindDeleteBtns();
          document.getElementById("nl-group-name").value = "";
          errEl.classList.add("hidden");
          UI.toast("Gruppo creato", "success");
        } catch (err) {
          errEl.textContent = err.message;
          errEl.classList.remove("hidden");
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="ph ph-plus"></i> Crea';
        }
      });
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────────────
  return {
    async init() {
      _controller = new AbortController();

      UI.loading(true);
      try {
        // Check if MailerLite is configured
        const config = await Store.get("getConfig", "newsletter").catch(() => ({
          configured: false,
        }));
        _configured = config.configured ?? false;

        if (_configured) {
          [_stats, _groups, _campaigns] = await Promise.all([
            Store.get("getStats", "newsletter").catch(() => _stats),
            Store.get("listGroups", "newsletter").catch(() => []),
            Store.get("listCampaigns", "newsletter").catch(() => []),
          ]);
          await loadSubscribers(false);
        }
      } catch (err) {
        console.error("[Newsletter] init error:", err);
      } finally {
        UI.loading(false);
      }

      render();
    },
    destroy() {
      _controller.abort();
      _controller = new AbortController();
      // Reset state
      _subscribers = [];
      _groups = [];
      _campaigns = [];
      _stats = { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
      _nextCursor = null;
      _filter = { status: "", search: "" };
    },
  };
})();

window.Newsletter = Newsletter;
