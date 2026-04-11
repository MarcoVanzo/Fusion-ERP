"use strict";
const OutSeason = (() => {
  let n = new AbortController(),
    t = new Set(),
    e = [];
  const o = [
      {
        key: "29 Giugno - 3 Luglio",
        label: "29 Giu – 3 Lug",
        color: "#6366f1",
      },
      { key: "6 Luglio - 10 Luglio", label: "6 – 10 Luglio", color: "#f59e0b" },
      {
        key: "13 Luglio - 17 Luglio",
        label: "13 – 17 Luglio",
        color: "#10b981",
      },
    ],
    a = ["Alzatrice", "Schiacciatrice", "Opposto", "Centrale", "Libero"],
    s = {
      Alzatrice: "🟡",
      Schiacciatrice: "🔴",
      Opposto: "🟣",
      Centrale: "🔵",
      Libero: "🟢",
    },
    i = "2026";
  function r(n) {
    const t = n.order_summary || n.OrderSummary || "";
    return t.includes("Paid") && !t.includes("Unpaid");
  }
  function d(n) {
    return (n.formula_scelta || n.FormulaScelta || "").includes("Full");
  }
  function l(n) {
    return d(n) ? 250 : 150;
  }
  function c(n) {
    return n.nome_e_cognome || n.NomeECognome || "";
  }
  function p(n) {
    return n.settimana_scelta || n.SettimanaScelta || "";
  }
  function u(n) {
    return n.ruolo || n.Ruolo || "";
  }
  function g(n) {
    return n.club_di_appartenenza || n.ClubDiAppartenenza || "";
  }
  function b(n) {
    return d(n) ? "Full Master" : "Daily Master";
  }
  function isVer(name) {
    return t.has(String(name).toLowerCase().trim());
  }
  function f() {
    if (!e || 0 === e.length)
      return void UI.toast("Nessun dato da esportare", "warning");
    const n = [
      [
        "Nome Cognome",
        "Settimana",
        "Formula",
        "Club",
        "Ruolo",
        "Data Nascita",
        "Cellulare / Emergenza",
        "Note",
        "Pagato",
      ].join(","),
    ];
    e.forEach((e) => {
      const o = [
        c(e),
        p(e),
        b(e),
        g(e),
        u(e),
        e.data_di_nascita || e.DataDiNascita || "",
        e.cellulare_emergenze ||
          e.CellulareEmergenze ||
          e.cellulare ||
          e.Cellulare ||
          "",
        (e.note || e.Note || "").replace(/\r?\n|\r/g, " "),
        r(e) || isVer(c(e)) ? "Si" : "No",
      ].map((n) => `"${String(n).replace(/"/g, '""')}"`);
      n.push(o.join(","));
    });
    const o = "\\uFEFF" + n.join("\\n"),
      a = "data:text/csv;charset=utf-8," + encodeURIComponent(o),
      s = document.createElement("a");
    (s.setAttribute("href", a),
      s.setAttribute("download", "outseason_iscritti.csv"),
      document.body.appendChild(s),
      s.click(),
      document.body.removeChild(s));
  }
  async function m() {
    try {
      const f = await fetch(
          `api/router.php?module=outseason&action=getEntries&season_key=${i}`,
          { method: "GET", credentials: "same-origin", cache: "no-store" },
        ),
        m = await f.json();
      if (!m.success) throw new Error(m.error || "Errore caricamento entries");
      ((e = m.data?.entries || []),
        (function (f) {
          const m = document.getElementById("os-badge-count");
          m && (m.textContent = `${e.length} Iscritte`);
          const y = document.getElementById("os-sync-status");
          if (y && f) {
            const n = new Date(f);
            ((y.style.display = "block"),
              (y.innerHTML = `<span style="font-size:12px;opacity:.5;">\n                <i class="ph ph-clock" style="font-size:12px;"></i>\n                Ultimo aggiornamento da Cognito: ${n.toLocaleString("it-IT")}</span>`));
          }
          const S = document.getElementById("os-main-content");
          S &&
            ((S.style.opacity = "1"),
            (S.style.pointerEvents = "auto"),
            0 !== e.length
              ? ((S.innerHTML = `\n        \x3c!-- KPI Cards --\x3e\n        <div class="os-kpi-row" id="os-kpi-row">\n            ${K()}\n        </div>
        </div>

        \x3c!-- Tabs --\x3e
        <div class="os-tabs fusion-tabs-container" id="os-tabs">
            <button class="os-tab fusion-tab active" data-panel="payments">💳 Verifica Pagamenti</button>
            <button class="os-tab fusion-tab" data-panel="weeks">📅 Per Settimana / Ruolo</button>
        </div>

        \x3c!-- Panel: Payments --\x3e
        <div id="os-panel-payments">
            <div id="os-payments-table-wrap">${v()}</div>
            \x3c!-- Bank Statement Verify Section --\x3e
            <div class="os-verify-section">
                <input type="file" id="os-pdf-input" accept=".pdf,application/pdf" style="display:none;">
                <button class="os-verify-btn" id="os-verify-btn">
                    <i class="ph ph-bank" style="font-size:20px;"></i>
                    🏦 Verifica Estratto Conto
                </button>
                <p style="margin-top:10px;font-size:12px;opacity:0.5;">Carica il PDF dell'estratto conto bancario per verificare i bonifici delle iscritte</p>
                <div id="os-verify-results"></div>
            </div>
        </div>

        \x3c!-- Panel: Weeks --\x3e
        <div id="os-panel-weeks" class="os-panel-hidden">${W()}</div>`),
                (function () {
                  const t = document.getElementById("os-tabs");
                  t &&
                    t.addEventListener(
                      "click",
                      (n) => {
                        const e = n.target.closest(".os-tab");
                        if (!e) return;
                        const o = e.dataset.panel;
                        (t
                          .querySelectorAll(".os-tab")
                          .forEach((n) => n.classList.remove("active")),
                          e.classList.add("active"),
                          document
                            .getElementById("os-panel-payments")
                            .classList.toggle(
                              "os-panel-hidden",
                              "payments" !== o,
                            ),
                          document
                            .getElementById("os-panel-weeks")
                            .classList.toggle(
                              "os-panel-hidden",
                              "weeks" !== o,
                            ));
                      },
                      { signal: n.signal },
                    );
                })(),
                (function () {
                  const e = document.getElementById("os-verify-btn"),
                    o = document.getElementById("os-pdf-input");
                  e &&
                    o &&
                    (e.addEventListener("click", () => o.click(), {
                      signal: n.signal,
                    }),
                    o.addEventListener(
                      "change",
                      async (n) => {
                        const a = n.target.files[0];
                        if (a) {
                          if ("application/pdf" !== a.type)
                            return (
                              w("Seleziona un file PDF valido."),
                              void (o.value = "")
                            );
                          if (a.size > 10485760)
                            return (
                              w("Il file è troppo grande. Massimo 10 MB."),
                              void (o.value = "")
                            );
                          ((e.disabled = !0),
                            (e.innerHTML =
                              '<div class="os-spinner"></div> Analisi AI in corso...'),
                            (document.getElementById(
                              "os-verify-results",
                            ).innerHTML = ""));
                          try {
                            const n = new FormData();
                            n.append("file", a);
                            const e = await fetch(
                                "api/router.php?module=outseason&action=verifyPayments",
                                {
                                  method: "POST",
                                  body: n,
                                  credentials: "same-origin",
                                  headers: {
                                    "X-Requested-With": "XMLHttpRequest",
                                  },
                                },
                              ),
                              o = await e.json();
                            if (!o.success)
                              return void w(
                                o.error || "Errore durante la verifica.",
                              );
                            if (!o.data.parsed) {
                              const n = o.data.raw_response
                                ? `<br><br><strong>Risposta AI (debug):</strong><pre style="margin-top:8px;padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;font-size:11px;max-height:200px;overflow:auto;white-space:pre-wrap;">${o.data.raw_response}</pre>`
                                : "";
                              return void w(
                                (o.data.message ||
                                  "L'AI non ha restituito un risultato strutturato.") +
                                  n,
                              );
                            }
                            !(function (n) {
                              const e =
                                document.getElementById("os-verify-results");
                              if (!e) return;
                              const o = n.results || [],
                                a = n.summary || {
                                  total_checked: o.length,
                                  found: 0,
                                  not_found: 0,
                                },
                                s = a.found || o.filter((n) => n.found).length,
                                r =
                                  a.not_found ||
                                  o.filter((n) => !n.found).length,
                                d = o
                                  .map((n) => {
                                    const t =
                                        "high" === n.confidence
                                          ? "os-confidence-high"
                                          : "medium" === n.confidence
                                            ? "os-confidence-medium"
                                            : "os-confidence-low",
                                      e =
                                        "high" === n.confidence
                                          ? "Alta"
                                          : "medium" === n.confidence
                                            ? "Media"
                                            : "Bassa";
                                    return `\n            <tr>\n                <td style="font-weight:600;">${n.name}</td>\n                <td style="font-weight:600;">${n.expected_amount} €</td>
                <td>${n.found ? '<span class="os-match-found">✅ Trovato</span>' : '<span class="os-match-missing">❌ Non trovato</span>'}</td>
                <td>${(n.found && n.transaction_date) || "—"}</td>
                <td>${n.found ? (n.transaction_amount || "") + " €" : "—"}</td>
                <td>${n.found ? `<span class="os-confidence ${t}">${e}</span>` : "—"}</td>
                <td style="font-size:11px;opacity:.6;">${n.notes || "—"}</td>
            </tr>`;
                                  })
                                  .join("");
                              ((e.innerHTML = `\n        <div class="os-verify-results">\n            <div class="os-verify-summary">\n                <div class="os-verify-card"><div class="os-verify-card-label">Verificati</div><div class="os-verify-card-value checked">${a.total_checked}</div></div>\n                <div class="os-verify-card"><div class="os-verify-card-label">Trovati</div><div class="os-verify-card-value found">${s}</div></div>\n                <div class="os-verify-card"><div class="os-verify-card-label">Non Trovati</div><div class="os-verify-card-value missing">${r}</div></div>
            </div>
            <div class="os-table-wrap">
                <div class="os-table-title">
                    <i class="ph ph-magnifying-glass" style="font-size:18px;color:#818cf8;"></i>
                    Risultati Verifica Bonifici
                    <span class="os-count" style="background:rgba(16,185,129,0.15);color:#10b981;">${s} Trovati</span>
                    <span class="os-count" style="background:rgba(239,68,68,0.15);color:#ef4444;">${r} Non trovati</span>
                </div>
                <div style="overflow-x:auto;">
                <table class="os-table">
                    <thead><tr>
                        <th>Nome</th><th>Importo Atteso</th><th>Esito</th>
                        <th>Data Transaz.</th><th>Importo Transaz.</th>
                        <th>Confidenza</th><th>Note</th>
                    </tr></thead>
                    <tbody>${d}</tbody>
                </table>
                </div>
            </div>
        </div>`),
                                (t = new Set(
                                  o
                                    .filter(
                                      (n) => n.found && "high" === n.confidence,
                                    )
                                    .map((n) =>
                                      String(n.name).toLowerCase().trim(),
                                    ),
                                )));
                              const l = document.getElementById(
                                "os-payments-table-wrap",
                              );
                              l && (l.innerHTML = v());
                              const wPan =
                                document.getElementById("os-panel-weeks");
                              (wPan && (wPan.innerHTML = W()),
                                document.getElementById("os-kpi-row") &&
                                  (document.getElementById(
                                    "os-kpi-row",
                                  ).innerHTML = K()),
                                (async function (n) {
                                  try {
                                    const res = await fetch(
                                        "api/router.php?module=outseason&action=saveVerification",
                                        {
                                          method: "POST",
                                          credentials: "same-origin",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "X-Requested-With": "XMLHttpRequest",
                                          },
                                          body: JSON.stringify({
                                            season_key: i,
                                            results: n,
                                          }),
                                        },
                                      ),
                                      data = await res.json();
                                    if (
                                      data &&
                                      data.data &&
                                      data.data.errors &&
                                      data.data.errors.length > 0
                                    ) {
                                      console.error(
                                        "Save Verification Errors:",
                                        data.data.errors,
                                      );
                                      UI.toast(
                                        "Errore salvataggio per alcuni record. Controlla la console.",
                                        "error",
                                      );
                                    }
                                  } catch (n) {
                                    console.warn(
                                      "[OutSeason] Could not save verifications:",
                                      n,
                                    );
                                  }
                                })(o));
                            })(o.data);
                          } catch (n) {
                            (console.error("[OutSeason] Verify error:", n),
                              w(
                                "Errore di rete. Controllare la connessione e riprovare.",
                              ));
                          } finally {
                            ((e.disabled = !1),
                              (e.innerHTML =
                                '<i class="ph ph-bank" style="font-size:20px;"></i> 🏦 Verifica Estratto Conto'),
                              (o.value = ""));
                          }
                        }
                      },
                      { signal: n.signal },
                    ));
                })())
              : (S.innerHTML =
                  '<div class="os-table-wrap" style="padding:40px;text-align:center;opacity:.6;">\n                <p style="font-size:1.1rem;margin-bottom:16px;">Nessun dato trovato nel database.</p>\n                <p style="font-size:13px;margin-bottom:20px;">Clicca il pulsante per importare i dati da Cognito Forms.</p>\n            </div>'));
        })(m.data?.last_sync || null),
        await (async function () {
          try {
            const n = await fetch(
                `api/router.php?module=outseason&action=getVerification&season_key=${i}`,
                {
                  method: "GET",
                  credentials: "same-origin",
                  cache: "no-store",
                },
              ),
              e = await n.json();
            if (
              !e.success ||
              !Array.isArray(e.data?.results) ||
              0 === e.data.results.length
            )
              return;
            if (
              ((t = new Set(
                e.data.results
                  .filter((n) => n.found && "high" === n.confidence)
                  .map((n) => String(n.entry_name).toLowerCase().trim()),
              )),
              t.size > 0)
            ) {
              const n = document.getElementById("os-payments-table-wrap");
              n && (n.innerHTML = v());
              const wPan = document.getElementById("os-panel-weeks");
              (wPan && (wPan.innerHTML = W()),
                document.getElementById("os-kpi-row") &&
                  (document.getElementById("os-kpi-row").innerHTML = K()));
            }
          } catch (n) {
            console.warn("[OutSeason] Could not load saved verifications:", n);
          }
        })());
    } catch (n) {
      console.error("[OutSeason] Load error:", n);
      const t = document.getElementById("os-main-content");
      t &&
        ((t.style.opacity = "1"),
        (t.style.pointerEvents = "auto"),
        (t.innerHTML = `<div class="os-verify-error">⚠️ Errore caricamento dati: ${n.message}<br><br>\n                    <button class="os-sync-btn" onclick="OutSeason.manualSync()">\n                        <i class="ph ph-arrows-clockwise"></i> Sincronizza ora da Cognito\n                    </button></div>`));
    }
  }
  async function y() {
    await h();
  }
  async function h() {
    const n = document.getElementById("os-sync-btn"),
      t = document.getElementById("os-sync-status");
    (n &&
      ((n.disabled = !0),
      (n.innerHTML =
        '<div class="os-spinner" style="width:14px;height:14px;border-width:2px;"></div> Sincronizzazione…')),
      t &&
        ((t.style.display = "block"),
        (t.innerHTML =
          '<span style="font-size:12px;color:#f59e0b;">\n                <i class="ph ph-arrows-clockwise" style="font-size:12px;"></i> Sincronizzazione in corso…</span>')));
    try {
      const n = await fetch(
          "api/router.php?module=outseason&action=syncFromCognito",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        ),
        e = await n.json();
      if (!e.success)
        return void x(e.error || "Errore durante la sincronizzazione.");
      const o = e.data?.upserted ?? 0,
        a = new Date().toLocaleString("it-IT");
      (t &&
        (t.innerHTML = `<span style="font-size:12px;color:#10b981;">\n                    ✅ Sincronizzate ${o} iscritte — ${a}</span>`),
        await m());
    } catch (n) {
      x("Errore di rete: " + n.message);
    } finally {
      n &&
        ((n.disabled = !1),
        (n.innerHTML =
          '<i class="ph ph-arrows-clockwise" style="font-size:16px;"></i> Sincronizza da Cognito'));
    }
  }
  function x(n) {
    const t = document.getElementById("os-sync-status");
    t &&
      ((t.style.display = "block"),
      (t.innerHTML = `<span style="font-size:12px;color:#ef4444;">⚠️ ${n}</span>`));
  }
  function W() {
    return o
      .map((n) => {
        const t = e.filter((t) => p(t) === n.key);
        if (0 === t.length)
          return `\n                <div class="os-week-section">\n                    <div class="os-week-header">\n                        <div class="os-week-dot" style="background:${n.color};"></div>\n                        <h3>${n.label}</h3>\n                        <span class="os-count">0 iscritte</span>\n                    </div>\n                    <div class="os-table-wrap" style="padding:24px;text-align:center;opacity:.5;">Nessuna iscritta per questa settimana</div>\n                </div>`;
        const o = {};
        (a.forEach((n) => (o[n] = [])),
          t.forEach((n) => {
            const t = u(n);
            (o[t] || (o[t] = []), o[t].push(n));
          }));
        let i = "";
        a.forEach((n) => {
          const t = o[n];
          t &&
            0 !== t.length &&
            ((i += `<tr class="os-role-header"><td colspan="6"><span class="os-role-emoji">${s[n] || "⚪"}</span>${n} <span style="opacity:.5;font-weight:400;font-size:12px;margin-left:8px;">(${t.length})</span></td></tr>`),
            t.forEach((n) => {
              const t = (n.data_di_nascita || n.DataDiNascita || "").substring(
                0,
                4,
              );
              i += `\n                    <tr>\n                        <td style="padding-left:28px;font-weight:600;">${c(n)}</td>\n                        <td>${g(n)}</td>
                        <td>${t || "—"}</td>
                        <td><span class="os-badge-formula ${d(n) ? "os-badge-full" : "os-badge-daily"}">${b(n)}</span></td>
                        <td>${r(n) || isVer(c(n)) ? '<span class="os-badge-paid">✓</span>' : '<span class="os-badge-unpaid">✗</span>'}</td>
                        <td>
                            <button class="btn btn-ghost btn-xs os-genera-atleta" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); color:#818cf8; white-space:nowrap; padding: 4px 8px; border-radius: 6px;">
                                <i class="ph ph-user-plus"></i> Genera
                            </button>
                        </td>
                    </tr>`;
            }));
        });
        const l = a
          .filter((n) => o[n] && o[n].length > 0)
          .map((n) => `${s[n] || "⚪"} ${o[n].length} ${n}`)
          .join("&nbsp;&nbsp;·&nbsp;&nbsp;");
        return `\n            <div class="os-week-section">\n                <div class="os-week-header">\n                    <div class="os-week-dot" style="background:${n.color};box-shadow:0 0 8px ${n.color}80;"></div>\n                    <h3 style="color:${n.color};">${n.label}</h3>
                    <span class="os-count">${t.length} iscritte</span>
                </div>
                <div class="os-table-wrap">
                    <div style="padding:10px 20px;font-size:12px;opacity:.7;border-bottom:1px solid rgba(255,255,255,0.05);">${l}</div>
                    <div style="overflow-x:auto;">
                    <table class="os-table">
                        <thead><tr><th>Nome</th><th>Club</th><th>Anno Nascita</th><th>Formula</th><th>Pagato</th><th>Azioni</th></tr></thead>
                        <tbody>${i}</tbody>
                    </table>
                    </div>
                </div>
            </div>`;
      })
      .join("");
  }
  function v() {
    const n = [...e].sort((n, t) => {
        const d1 = new Date(n.entry_date || n.EntryDate || 0),
          d2 = new Date(t.entry_date || t.EntryDate || 0);
        return d2 - d1;
      }),
      o = n.filter((n) => r(n) || isVer(c(n))),
      a = n.filter((n) => !r(n) && !isVer(c(n))),
      s = n
        .map(
          (
            n,
            e,
          ) => `\n            <tr>\n                <td style="opacity:.5;">${e + 1}</td>\n                <td style="font-weight:600;">${c(n)}</td>
                <td>${g(n)}</td>
                <td><span class="os-badge-formula ${d(n) ? "os-badge-full" : "os-badge-daily"}">${b(n)}</span></td>
                <td style="font-weight:600;">${(function (n) {
                  return d(n) ? "250 €" : "150 €";
                })(n)}</td>
                <td>${
                  "Bonifico Bancario" ===
                  (function (n) {
                    return n.come_vuoi_pagare || n.ComeVuoiPagare || "";
                  })(n)
                    ? "🏦 Bonifico"
                    : "💳 Carta/PayPal"
                }</td>
                <td>${r(n) || isVer(c(n)) ? '<span class="os-badge-paid">● Pagato</span>' : '<span class="os-badge-unpaid">● Da pagare</span>'}</td>
                <td style="opacity:.7;">${(function (n) {
                  const t = new Date(n.entry_date || n.EntryDate || "");
                  return isNaN(t)
                    ? "—"
                    : t.toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                })(n)}</td>
                <td style="opacity:.5;font-size:11px;">${
                  (function (n) {
                    return n.codice_sconto || n.CodiceSconto || null;
                  })(n) || "—"
                }</td>
                <td>
                    <button class="btn btn-ghost btn-xs os-genera-atleta" style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); color:#818cf8; white-space:nowrap; padding: 4px 8px; border-radius: 6px;">
                        <i class="ph ph-user-plus"></i> Genera
                    </button>
                </td>
            </tr>`,
        )
        .join(""),
      i = o.reduce((n, t) => n + l(t), 0),
      p = a.reduce((n, t) => n + l(t), 0);
    return `\n        <div class="os-table-wrap">\n            <div class="os-table-title">\n                <i class="ph ph-credit-card" style="font-size:18px;color:#f59e0b;"></i>
                Riepilogo Pagamenti Caparra
                <span class="os-count" style="background:rgba(16,185,129,0.15);color:#10b981;">${o.length} Pagati</span>
                <span class="os-count" style="background:rgba(239,68,68,0.15);color:#ef4444;">${a.length} Da Pagare</span>
            </div>
            <div style="overflow-x:auto;">
            <table class="os-table">
                <thead><tr>
                    <th>#</th><th>Nome</th><th>Club</th><th>Formula</th><th>Caparra</th><th>Metodo</th><th>Stato</th><th>Data Iscr.</th><th>Sconto</th><th>Azioni</th>
                </tr></thead>
                <tbody>
                    ${s}
                    <tr class="os-summary-row">
                        <td></td>
                        <td colspan="3">TOTALE: ${e.length} iscritte</td>
                        <td>${(i + p).toLocaleString("it-IT")} €</td>
                        <td></td>
                        <td><span class="os-badge-paid">${i.toLocaleString("it-IT")} €</span> <span class="os-badge-unpaid">${p.toLocaleString("it-IT")} €</span></td>
                        <td colspan="3"></td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>`;
  }
  function K() {
    const o = e.filter((n) => r(n) || isVer(c(n))),
      a = e.filter((n) => !r(n) && !isVer(c(n))),
      k = e.reduce((n, t) => n + l(t), 0),
      z = o.reduce((n, t) => n + l(t), 0),
      $ = a.reduce((n, t) => n + l(t), 0);
    return `<div class="os-kpi"><div class="os-kpi-label">Totale Iscritte</div><div class="os-kpi-value total">${e.length}</div></div><div class="os-kpi"><div class="os-kpi-label">Caparra Incassata</div><div class="os-kpi-value paid">${z.toLocaleString("it-IT")} €</div></div><div class="os-kpi"><div class="os-kpi-label">Caparra Da Riscuotere</div><div class="os-kpi-value unpaid">${$.toLocaleString("it-IT")} €</div></div><div class="os-kpi"><div class="os-kpi-label">Totale Caparre</div><div class="os-kpi-value" style="color:#818cf8;">${k.toLocaleString("it-IT")} €</div></div>`;
  }
  function w(n) {
    const t = document.getElementById("os-verify-results");
    t && (t.innerHTML = `<div class="os-verify-error">⚠️ ${n}</div>`);
  }
  return {
    destroy: function () {
      n.abort();
      t.clear();
      e.length = 0;
    },
    init: async function () {
      (n.abort(),
        (n = new AbortController()),
        (t = new Set()),
        (function () {
          const t = document.getElementById("app");
          t &&
            ((t.innerHTML =
              '\n        <style>\n            .os-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: osFadeIn .4s ease; }\n            @keyframes osFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\n\n            .os-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }\n            .os-header h1 { font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n            .os-header .os-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(245,158,11,0.15); color: #f59e0b; }\n\n            /* Sync button */\n            .os-sync-btn {\n                display: inline-flex; align-items: center; gap: 8px;\n                padding: 8px 18px; border: 1px solid rgba(99,102,241,0.4); border-radius: 10px;\n                background: rgba(99,102,241,0.1); color: #818cf8; font-size: 13px; font-weight: 600;\n                cursor: pointer; transition: all .2s ease; margin-left: auto;\n            }\n            .os-sync-btn:hover { background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.7); transform: translateY(-1px); }\n            .os-sync-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }\n\n            /* KPI Cards */\n            .os-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }\n            .os-kpi { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; backdrop-filter: blur(12px); transition: transform .2s, box-shadow .2s; }\n            .os-kpi:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }\n            .os-kpi-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-bottom: 6px; }\n            .os-kpi-value { font-size: 1.8rem; font-weight: 700; }\n            .os-kpi-value.paid { color: #10b981; }\n            .os-kpi-value.unpaid { color: #ef4444; }\n            .os-kpi-value.total { color: #f59e0b; }\n\n            /* Tabs */\n            .os-tabs { display: flex; gap: 4px; margin-bottom: 24px; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.06); }\n            .os-tab { flex: 1; padding: 10px 18px; border: none; background: none; color: inherit; font-size: 14px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all .2s; opacity: 0.6; text-align: center; }\n            .os-tab:hover { opacity: 0.9; background: rgba(255,255,255,0.05); }\n            .os-tab.active { background: rgba(245,158,11,0.15); color: #f59e0b; opacity: 1; font-weight: 700; }\n\n            /* Table */\n            .os-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; margin-bottom: 24px; }\n            .os-table-title { padding: 16px 20px; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }\n            .os-table-title .os-count { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }\n            .os-table { width: 100%; border-collapse: collapse; font-size: 13px; }\n            .os-table thead th { padding: 10px 14px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: .5px; opacity: 0.5; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }\n            .os-table tbody td { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }\n            .os-table tbody tr { transition: background .15s; }\n            .os-table tbody tr:hover { background: rgba(255,255,255,0.04); }\n            .os-table tbody tr:last-child td { border-bottom: none; }\n\n            /* Badges */\n            .os-badge-paid { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: rgba(16,185,129,0.12); color: #10b981; }\n            .os-badge-unpaid { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: rgba(239,68,68,0.12); color: #ef4444; }\n            .os-badge-formula { display: inline-block; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }\n            .os-badge-full { background: rgba(99,102,241,0.12); color: #818cf8; }\n            .os-badge-daily { background: rgba(245,158,11,0.12); color: #f59e0b; }\n\n            /* Summary row */\n            .os-summary-row td { font-weight: 700 !important; border-top: 2px solid rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.02); padding-top: 14px !important; }\n\n            /* Role group header */\n            .os-role-header td { background: rgba(255,255,255,0.03); font-weight: 700; font-size: 14px; padding: 10px 14px !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }\n            .os-role-emoji { font-size: 16px; margin-right: 6px; }\n\n            /* Week Section */\n            .os-week-section { margin-bottom: 24px; animation: osFadeIn .4s ease; }\n            .os-week-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }\n            .os-week-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }\n            .os-week-header h3 { font-size: 1.1rem; font-weight: 700; }\n            .os-week-header .os-count { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.08); }\n\n            /* Bank Verify Section */\n            .os-verify-section { margin-top: 28px; animation: osFadeIn .4s ease; }\n            .os-verify-btn {\n                display: inline-flex; align-items: center; gap: 10px;\n                padding: 14px 28px; border: none; border-radius: 14px;\n                background: linear-gradient(135deg, #6366f1, #8b5cf6);\n                color: #fff; font-size: 15px; font-weight: 700;\n                cursor: pointer; transition: all .25s ease;\n                box-shadow: 0 4px 16px rgba(99,102,241,0.3);\n                position: relative; overflow: hidden;\n            }\n            .os-verify-btn::before { content: \'\'; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity .25s; }\n            .os-verify-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }\n            .os-verify-btn:hover::before { opacity: 1; }\n            .os-verify-btn:active { transform: scale(0.97); }\n            .os-verify-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }\n            .os-verify-btn .os-spinner, .os-sync-btn .os-spinner {\n                width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3);\n                border-top-color: currentColor; border-radius: 50%;\n                animation: osSpin .7s linear infinite; display: inline-block;\n            }\n            @keyframes osSpin { to { transform: rotate(360deg); } }\n\n            .os-verify-results { margin-top: 24px; animation: osFadeIn .5s ease; }\n            .os-verify-summary { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }\n            .os-verify-card { flex: 1; min-width: 160px; padding: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; text-align: center; backdrop-filter: blur(12px); }\n            .os-verify-card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.5; margin-bottom: 6px; }\n            .os-verify-card-value { font-size: 1.6rem; font-weight: 700; }\n            .os-verify-card-value.found { color: #10b981; }\n            .os-verify-card-value.missing { color: #ef4444; }\n            .os-verify-card-value.checked { color: #818cf8; }\n\n            .os-match-found { color: #10b981; font-weight: 700; }\n            .os-match-missing { color: #ef4444; font-weight: 700; }\n            .os-confidence { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }\n            .os-confidence-high { background: rgba(16,185,129,0.15); color: #10b981; }\n            .os-confidence-medium { background: rgba(245,158,11,0.15); color: #f59e0b; }\n            .os-confidence-low { background: rgba(239,68,68,0.15); color: #ef4444; }\n\n            .os-verify-error { margin-top: 16px; padding: 16px 20px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; font-size: 14px; font-weight: 500; }\n\n            /* Responsive */\n            @media (max-width: 768px) {\n                .os-page { padding: 12px; }\n                .os-table { font-size: 12px; }\n                .os-table thead th, .os-table tbody td { padding: 8px 8px; }\n                .os-kpi-row { grid-template-columns: repeat(2, 1fr); }\n                .os-verify-summary { flex-direction: column; }\n                .os-verify-btn { width: 100%; justify-content: center; }\n                .os-sync-btn { margin-left: 0; }\n            }\n            .os-panel-hidden { display: none !important; }\n        </style>\n        <div class="os-page">\n            <div class="os-header">\n                <h1><i class="ph ph-sun" style="font-size:28px;-webkit-text-fill-color:#f59e0b;"></i> FTV Out Season 2026</h1>\n                <span class="os-badge" id="os-badge-count">Caricamento…</span>\n                <button class="os-sync-btn" id="os-export-btn" title="Esporta lista iscritti in formato CSV">\n                    <i class="ph ph-download-simple" style="font-size:16px;"></i> Esporta CSV\n                </button>\n                <button class="os-sync-btn" id="os-sync-btn" title="Sincronizza dati da Cognito Forms">\n                    <i class="ph ph-arrows-clockwise" style="font-size:16px;"></i> Sincronizza da Cognito\n                </button>\n            </div>\n            <div id="os-sync-status" style="display:none;margin-bottom:16px;"></div>\n            <div id="os-main-content" style="opacity:.4;pointer-events:none;">\n                <div style="padding:40px;text-align:center;opacity:.5;">\n                    <i class="ph ph-spinner" style="font-size:32px;"></i>\n                    <p style="margin-top:12px;">Caricamento iscritte…</p>\n                </div>\n            </div>\n        </div>'),
            document
              .getElementById("os-sync-btn")
              ?.addEventListener("click", y, { signal: n.signal });
            document
              .getElementById("os-export-btn")
              ?.addEventListener("click", f, { signal: n.signal });

            document.getElementById("app")?.addEventListener("click", async (ev) => {
                const btn = ev.target.closest(".os-genera-atleta");
                if (btn) {
                    try {
                        const { AthletesAPI } = await import('./athletes/AthletesAPI.js?v=3');
                        const { AthletesWizard } = await import('./athletes/AthletesWizard.js?v=3');
                        const teams = await AthletesAPI.getTeams();
                        AthletesWizard.openCreate(teams, () => {
                            if (typeof UI !== 'undefined' && UI.toast) UI.toast("Atleta aggiunta con successo!", "success");
                        });
                    } catch(err) {
                        console.error("[OutSeason] Error opening wizard", err);
                        if (typeof UI !== 'undefined' && UI.toast) UI.toast("Errore apertura maschera atleta", "error");
                    }
                }
            }, { signal: n.signal });
        })(),
        await m());
    },
    manualSync: h,
  };
})();
window.OutSeason = OutSeason;
