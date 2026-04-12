"use strict";
const Social = (() => {
  let n = new AbortController(),
    s = null,
    i = !1,
    a = 28,
    e = null;
  function t(n) {
    ((n.innerHTML =
      '\n        <div class="page-body" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">\n            <div class="social-connect-card" id="social-connect-card">\n                <div class="social-connect-icon">\n                    <i class="ph ph-instagram-logo" style="font-size:48px;color:var(--color-pink);"></i>\n                    <i class="ph ph-facebook-logo" style="font-size:48px;color:#1877F2;"></i>\n                </div>\n                <h2 class="social-connect-title">Collega i tuoi Social</h2>\n                <p class="social-connect-desc">\n                    Connetti il tuo account Instagram Business e la tua Pagina Facebook\n                    per visualizzare le analytics direttamente dall\'ERP.\n                </p>\n                <div class="social-connect-features">\n                    <div class="social-feature"><i class="ph ph-chart-line-up"></i> Andamento follower e reach</div>\n                    <div class="social-feature"><i class="ph ph-eye"></i> Views e engagement per post</div>\n                    <div class="social-feature"><i class="ph ph-trend-up"></i> Grafici trend giornalieri</div>\n                    <div class="social-feature"><i class="ph ph-images"></i> Griglia ultimi post con metriche</div>\n                </div>\n                <button class="btn btn-primary social-connect-btn" id="btn-connect-meta" type="button">\n                    <i class="ph ph-plug"></i> Connetti Instagram & Facebook\n                </button>\n                <button class="btn btn-ghost social-demo-btn" id="btn-demo-social" type="button" style="margin-top:8px;">\n                    <i class="ph ph-eye"></i> Mostra Demo con dati di esempio\n                </button>\n                <p class="social-connect-note">\n                    <i class="ph ph-info"></i> Servono un account Instagram Business e una Pagina Facebook collegata.\n                </p>\n            </div>\n        </div>'),
      document
        .getElementById("btn-connect-meta")
        ?.addEventListener("click", () => {
          window.location.href =
            (Store.getApiUrl, "api/router.php?module=social&action=connect");
        }),
      document
        .getElementById("btn-demo-social")
        ?.addEventListener("click", async () => {
          try {
            ((s = await Store.get("insights", "social", { days: a })), o(n));
          } catch (n) {
            UI.toast("Errore nel caricamento demo", "error");
          }
        }));
  }
  function o(e) {
    const l = s?.profile || {},
      r = s?.daily_insights || [],
      p = s?.posts || [],
      h = s?.fb_insights || {},
      g = s?.is_mock || !1,
      u = r.reduce((n, s) => n + (s.reach || 0), 0),
      v = r.reduce((n, s) => n + (s.views || 0), 0),
      m = r.reduce((n, s) => n + (s.accounts_engaged || 0), 0),
      fw_tot = r.reduce((n, s) => n + (s.follower_count || 0), 0),
      f = !!l.username,
      b = f ? `@${l.username}` : s?.fb_page_name || "Facebook Page",
      y = f ? l.followers_count : h.page_fans,
      k = y ? ((m / y) * 100).toFixed(1) : "0.0";
    ((e.innerHTML = `\n        <div class="transport-dashboard" style="min-height:100vh; padding:24px;">\n            ${g ? '\n            <div class="social-mock-banner" id="social-mock-banner"' + (s.error ? ' style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#ef4444;"' : '') + '>\n                <i class="ph ph-' + (s.error ? 'warning-circle' : 'info') + '"></i>\n                <span>' + (s.error ? '<strong>Errore Meta API:</strong> ' + Utils.escapeHtml(s.error) : 'Dati di esempio — <a href="#" id="connect-from-banner">Connetti un account reale</a> per visualizzare le tue analytics.') + '</span>\n                <button class="btn-dash" id="close-mock-banner" type="button"' + (s.error ? ' style="color:#ef4444"' : '') + '><i class="ph ph-x"></i></button>\n            </div>' : ""}\n\n            \x3c!-- Header --\x3e\n            <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-start;">\n                <div class="social-profile">\n                    <div class="social-avatar">\n                        ${l.profile_picture_url ? `<img src="${Utils.escapeHtml(l.profile_picture_url)}" alt="Profile" class="social-avatar-img">` : f ? '<i class="ph ph-instagram-logo" style="font-size:32px;"></i>' : '<i class="ph ph-facebook-logo" style="font-size:32px;color:#1877F2;"></i>'}\n                    </div>\n                    <div class="social-profile-info">\n                        <h1 class="dash-title" style="margin:0">\n                            <i class="ph ph-chart-line-up"></i> Social Analytics\n                        </h1>\n                        <p class="dash-subtitle" style="margin-top:4px;">
                            <strong>${Utils.escapeHtml(l.name || b)}</strong>
                            ${l.media_count ? ` · ${d(l.media_count)} post totali` : ""}
                        </p>
                        ${l.biography ? `<p style="margin-top:8px; font-size:13px; color:var(--text-muted); max-width:600px; line-height:1.4;">${Utils.escapeHtml(l.biography)}</p>` : ""}
                    </div>
                </div>
                <div class="social-actions">\n                    <div class="dash-filters" style="margin-bottom:8px;" id="period-selector">\n                        <button class="dash-filter ${7 === a ? "active" : ""}" data-days="7">7gg</button>\n                        <button class="dash-filter ${14 === a ? "active" : ""}" data-days="14">14gg</button>\n                        <button class="dash-filter ${28 === a ? "active" : ""}" data-days="28">28gg</button>\n                        <button class="dash-filter ${90 === a ? "active" : ""}" data-days="90">90gg</button>\n                    </div>
                    <button class="btn-dash" id="btn-disconnect-meta" type="button" title="Disconnetti account (Riconnetti)">
                        <i class="ph ph-plug-charging" style="color:var(--color-pink);"></i>
                    </button>
                </div>
            </div>

            <!-- KPI Cards Instagram -->
            <h3 style="margin-bottom:16px; font-size:16px; display:flex; align-items:center; gap:8px;"><i class="ph ph-instagram-logo" style="color:var(--color-pink);"></i> Resoconto Instagram (${a} gg)</h3>
            <div class="dash-stat-grid">
                <div class="dash-stat-card">
                    <div class="social-kpi-icon"><i class="ph ph-users" style="color:var(--color-pink);"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value">${d(l.followers_count || 0)} <small style="font-size:16px; margin-left:4px; font-weight:700; color:${fw_tot >= 0 ? '#10B981' : '#EF4444'};">${fw_tot > 0 ? '+' : ''}${fw_tot}</small></span>
                        <span class="social-kpi-label">Follower (Variazione giorno per giorno)</span>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="social-kpi-icon"><i class="ph ph-eye" style="color:var(--color-pink);"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value">${d(v)}</span>
                        <span class="social-kpi-label">Views (ex Impressions) totali generate</span>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="social-kpi-icon"><i class="ph ph-broadcast" style="color:var(--color-pink);"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value">${d(u)}</span>
                        <span class="social-kpi-label">Reach (Copertura totale netta)</span>
                    </div>
                </div>
                <div class="dash-stat-card">
                    <div class="social-kpi-icon"><i class="ph ph-images" style="color:var(--color-pink);"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value">${d(l.media_count || 0)}</span>
                        <span class="social-kpi-label">Post Pubblicati Storici</span>
                    </div>
                </div>
            </div>

            <!-- KPI Cards Facebook -->
            <h3 style="margin-top:32px; margin-bottom:16px; font-size:16px; display:flex; align-items:center; gap:8px;"><i class="ph ph-facebook-logo" style="color:#1877F2;"></i> Resoconto Facebook</h3>
            <div class="dash-stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="dash-stat-card">
                    <div class="social-kpi-icon"><i class="ph ph-users" style="color:#1877F2;"></i></div>
                    <div class="social-kpi-content">
                        <span class="social-kpi-value">${d(h.page_fans || 0)}</span>
                        <span class="social-kpi-label">Fan Pagina</span>
                    </div>
                </div>
                <div class="dash-stat-card" style="grid-column: span 3; opacity: 0.8;">
                    <div class="social-kpi-content" style="flex-direction:row; align-items:center; gap:16px; padding:8px 0;">
                        <i class="ph ph-info" style="font-size:28px; color:var(--text-muted);"></i>
                        <span style="font-size:13px; line-height:1.5; color:var(--text-muted);">
                            <strong>Limitazione API di Meta:</strong> Le altre metriche avanzate di Facebook (es. Reach, Visite, Interazioni) non sono esportabili in dashboard di terze parti poiché la tua Pagina si trova in configurazione <em>New Page Experience</em>. I dati restano visibili unicamente dall'interno dell'app nativa Business Suite.
                        </span>
                    </div>
                </div>
            </div>\n\n            \x3c!-- Chart --\x3e\n            <div class="dash-card" style="margin-top:24px; margin-bottom:24px;">\n                <div class="social-chart-header">\n                    <h3><i class="ph ph-chart-line"></i> Andamento Instagram</h3>\n                    <div class="social-chart-legend">\n                        <span class="legend-dot legend-views"></span> Views\n                        <span class="legend-dot legend-reach" style="margin-left:16px;"></span> Reach\n                    </div>\n                </div>\n                <div class="social-chart-container">\n                    <canvas id="social-chart" width="800" height="280"></canvas>\n                </div>\n            </div>\n\n            \x3c!-- Posts Grid --\x3e\n            ${
      f
        ? `\n            <div class="social-posts-section">\n                <h3 class="social-section-title"><i class="ph ph-images"></i> Ultimi Post</h3>\n                <div class="social-posts-grid" id="social-posts-grid">\n                    ${p
            .map((n) =>
              (function (n) {
                const s = n.insights || {},
                  i = n.timestamp
                    ? new Date(n.timestamp).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "",
                  a = n.caption
                    ? Utils.escapeHtml(n.caption.substring(0, 80)) +
                      (n.caption.length > 80 ? "…" : "")
                    : "",
                  e =
                    {
                      IMAGE: "image",
                      VIDEO: "video-camera",
                      CAROUSEL_ALBUM: "images",
                      REEL: "film-reel",
                    }[n.media_type] || "image";
                return `\n        <a href="${Utils.escapeHtml(n.permalink || "#")}" target="_blank" rel="noopener" class="social-post-card">\n            <div class="social-post-thumb">\n                ${n.media_url || n.thumbnail_url ? `<img src="${Utils.escapeHtml(n.thumbnail_url || n.media_url)}" alt="" loading="lazy">` : `<div class="social-post-placeholder"><i class="ph ph-${e}" style="font-size:32px;"></i></div>`}\n                <span class="social-post-type"><i class="ph ph-${e}"></i></span>\n            </div>\n            <div class="social-post-meta">\n                <div class="social-post-stats">\n                    <span><i class="ph ph-eye"></i> ${d(s.views || 0)}</span>\n                    <span><i class="ph ph-heart"></i> ${d(s.likes || n.like_count || 0)}</span>\n                    <span><i class="ph ph-chat-circle"></i> ${d(s.comments || n.comments_count || 0)}</span>\n                    ${s.shares ? `<span><i class="ph ph-share-fat"></i> ${d(s.shares)}</span>` : ""}\n                </div>\n                <p class="social-post-caption">${a}</p>\n                <span class="social-post-date">${i}</span>\n            </div>\n        </a>`;
              })(n),
            )
            .join("")}\n                </div>\n            </div>`
        : '\n            <div class="social-posts-section">\n                <div style="background:var(--color-surface);border-radius:12px;padding:32px;text-align:center;color:var(--text-muted);border:1px dashed var(--color-border);margin-top:24px;">\n                    <i class="ph ph-instagram-logo" style="font-size:32px;margin-bottom:8px;opacity:0.5;"></i>\n                    <h3 style="margin-bottom:8px;">Instagram non collegato</h3>\n                    <p style="font-size:14px;max-width:400px;margin:0 auto;line-height:1.5;">Per visualizzare i tuoi post recenti e le relative metriche in questa sezione, assicurati di aver concesso i permessi per il tuo account Instagram Business durante la procedura di connessione Meta.</p>\n                </div>\n            </div>\n            '
    }\n        </div>`),
      document
        .getElementById("period-selector")
        ?.addEventListener("click", async (n) => {
          const i = n.target.closest(".dash-filter");
          if (!i) return;
          const e = parseInt(i.dataset.days, 10);
          if (e !== a) {
            a = e;
            document.getElementById("app").innerHTML = UI.skeletonPage();
            try {
              ((s = await Store.get("insights", "social", { days: e })),
                o(document.getElementById("app")));
            } catch (n) {
              UI.toast("Errore nel caricamento dati", "error");
            }
          }
        }),
      document
        .getElementById("btn-disconnect-meta")
        ?.addEventListener("click", () => {
          UI.confirm(
            "Vuoi disconnettere il tuo account Meta? Le analytics non saranno più disponibili.",
            async () => {
              try {
                (await Store.api("disconnect", "social"),
                  (i = !1),
                  UI.toast("Account Meta disconnesso", "info"),
                  t(document.getElementById("app")));
              } catch (n) {
                UI.toast("Errore nella disconnessione", "error");
              }
            },
          );
        }),
      document
        .getElementById("close-mock-banner")
        ?.addEventListener("click", () => {
          document.getElementById("social-mock-banner")?.remove();
        }),
      document
        .getElementById("connect-from-banner")
        ?.addEventListener("click", (n) => {
          (n.preventDefault(),
            (window.location.href =
              "api/router.php?module=social&action=connect"));
        }),
      window.addEventListener(
        "resize",
        () => {
          s?.daily_insights && c(s.daily_insights);
        },
        { signal: n.signal },
      ),
      setTimeout(() => c(r), 100));
  }
  function c(n) {
    const s = document.getElementById("social-chart");
    if (!s) return;
    e = s;
    const i = s.getContext("2d"),
      a = window.devicePixelRatio || 1,
      t = s.parentElement.getBoundingClientRect();
    ((s.width = t.width * a),
      (s.height = 280 * a),
      (s.style.width = t.width + "px"),
      (s.style.height = "280px"),
      i.scale(a, a));
    const o = t.width,
      c = { top: 20, right: 20, bottom: 40, left: 50 },
      p = o - c.left - c.right,
      h = 280 - c.top - c.bottom;
    if ((i.clearRect(0, 0, o, 280), !n || n.length < 2))
      return (
        (i.fillStyle = "rgba(255,255,255,0.3)"),
        (i.font = "14px Inter, sans-serif"),
        (i.textAlign = "center"),
        void i.fillText("Dati insufficienti per il grafico", o / 2, 140)
      );
    const g = n.map((n) => n.views || 0),
      u = n.map((n) => n.reach || 0),
      v = n.map((n) => n.date),
      m = Math.max(...g, ...u, 1),
      f = p / (n.length - 1);
    ((i.strokeStyle = "rgba(255,255,255,0.06)"), (i.lineWidth = 1));
    for (let n = 0; n <= 4; n++) {
      const s = c.top + (h / 4) * n;
      (i.beginPath(),
        i.moveTo(c.left, s),
        i.lineTo(o - c.right, s),
        i.stroke(),
        (i.fillStyle = "rgba(255,255,255,0.35)"),
        (i.font = "11px Inter, sans-serif"),
        (i.textAlign = "right"));
      const a = Math.round(m - (m / 4) * n);
      i.fillText(d(a), c.left - 8, s + 4);
    }
    const b = Math.max(1, Math.floor(n.length / 7));
    ((i.fillStyle = "rgba(255,255,255,0.35)"),
      (i.font = "10px Inter, sans-serif"),
      (i.textAlign = "center"));
    for (let s = 0; s < n.length; s += b) {
      const n = c.left + s * f,
        a = new Date(v[s]);
      i.fillText(`${a.getDate()}/${a.getMonth() + 1}`, n, 272);
    }
    (l(i, g, m, c, h, f, "#FF00FF", "rgba(255, 0, 255,0.15)"),
      l(i, u, m, c, h, f, "#00E676", "rgba(0,230,118,0.10)"),
      r(i, g, m, c, h, f, "#FF00FF"),
      r(i, u, m, c, h, f, "#00E676"));
  }
  function l(n, s, i, a, e, t, o, c) {
    (n.beginPath(),
      (n.strokeStyle = o),
      (n.lineWidth = 2.5),
      (n.lineJoin = "round"));
    for (let o = 0; o < s.length; o++) {
      const c = a.left + o * t,
        l = a.top + e - (s[o] / i) * e;
      0 === o ? n.moveTo(c, l) : n.lineTo(c, l);
    }
    (n.stroke(),
      n.lineTo(a.left + (s.length - 1) * t, a.top + e),
      n.lineTo(a.left, a.top + e),
      n.closePath(),
      (n.fillStyle = c),
      n.fill());
  }
  function r(n, s, i, a, e, t, o) {
    if (!(s.length > 60))
      for (let c = 0; c < s.length; c++) {
        const l = a.left + c * t,
          r = a.top + e - (s[c] / i) * e;
        (n.beginPath(),
          n.arc(l, r, 3, 0, 2 * Math.PI),
          (n.fillStyle = o),
          n.fill(),
          (n.strokeStyle = "rgba(0,0,0,0.4)"),
          (n.lineWidth = 1),
          n.stroke());
      }
  }
  function d(n) {
    return null == n
      ? "0"
      : (n = parseInt(n, 10)) >= 1e6
        ? (n / 1e6).toFixed(1) + "M"
        : n >= 1e3
          ? (n / 1e3).toFixed(1) + "K"
          : n.toLocaleString("it-IT");
  }
  return {
    init: async function () {
      ((n = new AbortController()), (a = 28));
      const e = window.location.hash;
      if (e.includes("connected=1"))
        (UI.toast("Account Meta collegato con successo!", "success"),
          history.replaceState(null, "", window.location.pathname + "#social"));
      else if (e.includes("error=")) {
        const n = decodeURIComponent(
          e.split("error=")[1] || "Errore sconosciuto",
        );
        (UI.toast("Errore OAuth: " + n, "error", 6e3),
          history.replaceState(null, "", window.location.pathname + "#social"));
      }
      await (async function () {
        const n = document.getElementById("app");
        if (n) {
          n.innerHTML = UI.skeletonPage();
          try {
            const e = await Store.get("status", "social");
            if (
              ((i = e?.connected || !1),
              (s = await Store.get("insights", "social", { days: a })),
              !i && !s?.is_mock)
            )
              return void t(n);
            o(n);
          } catch (s) {
            (console.error("[Social] Render error:", s), t(n));
          }
        }
      })();
    },
    destroy: function () {
      (n.abort(), (s = null), (e = null));
    },
  };
})();
window.Social = Social;
