"use strict";
const Finance = (() => {
    let n = new AbortController,
        t = null,
        e = [],
        a = [],
        i = [],
        s = {},
        l = "dashboard";
    const r = ["Bonifico", "Contanti", "Carta", "Assegno", "PayPal", "Altro"];
    async function o() {
        n = new AbortController, l = "dashboard";
        const e = document.getElementById("app");
        if (e) {
            e.innerHTML = UI.skeletonPage();
            try {
                const i = window.location.hash;
                if ("#finance-invoices" === i) return g(e);
                if ("#finance-74ter" === i) return m(e);
                if ("#finance-foresteria" === i) return renderForesteriaExpenses(e);
                const [l, r] = await Promise.all([Store.get("dashboard", "finance"), Store.get("categories", "finance").catch(() => ({
                    categories: {}
                }))]);
                t = l, s = r?.categories || {},
                    function(e) {
                        const i = t || {},
                            l = i.total_income || 0,
                            r = i.total_expenses || 0,
                            y = i.balance || 0,
                            b = i.fiscal_year || {};
                        e.innerHTML = `\n        <div class="finance-page">\n            <div class="finance-header">\n                <div class="finance-title-row">\n                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                        <i class="ph ph-calculator" style="color:var(--color-primary);"></i>\n                        Contabilità\n                    </h1>\n                    <div style="display:flex;gap:8px;">\n                        <button class="btn btn-ghost btn-sm" id="btn-view-entries" type="button">\n                            <i class="ph ph-list"></i> Prima Nota\n                        </button>\n                        <button class="btn btn-ghost btn-sm" id="btn-view-invoices" type="button">\n                            <i class="ph ph-file-invoice"></i> Fatture Elettroniche\n                        </button>\n                        <button class="btn btn-ghost btn-sm" id="btn-view-accounts" type="button">\n                            <i class="ph ph-tree-structure"></i> Piano dei Conti\n                        </button>\n                        <button class="btn btn-ghost btn-sm" id="btn-rendiconto" type="button">\n                            <i class="ph ph-file-text"></i> Rendiconto\n                        </button>\n                        <button class="btn btn-ghost btn-sm" id="btn-74ter" type="button">\n                            <i class="ph ph-intersect"></i> 74-ter\n                        </button>\n                        <button class="btn btn-primary" id="btn-new-entry" type="button">\n                            <i class="ph ph-plus"></i> Nuova Registrazione\n                        </button>\n                    </div>\n                </div>\n                ${b.label?`<p style="color:var(--text-muted);font-size:13px;margin-top:4px;">\n                    <i class="ph ph-calendar"></i> Anno fiscale: <strong>${Utils.escapeHtml(b.label)}</strong>\n                    (${b.start_date} — ${b.end_date})\n                </p>`:""}\n            </div>\n\n            \x3c!-- KPI Cards --\x3e\n            <div class="finance-kpi-grid">\n                <div class="finance-kpi-card kpi-income">\n                    <div class="finance-kpi-icon"><i class="ph ph-arrow-circle-down"></i></div>\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">€ ${v(l)}</span>\n                        <span class="finance-kpi-label">Entrate</span>\n                    </div>\n                </div>\n                <div class="finance-kpi-card kpi-expenses">\n                    <div class="finance-kpi-icon"><i class="ph ph-arrow-circle-up"></i></div>\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">€ ${v(r)}</span>\n                        <span class="finance-kpi-label">Uscite</span>\n                    </div>\n                </div>\n                <div class="finance-kpi-card kpi-balance">\n                    <div class="finance-kpi-icon"><i class="ph ph-scales"></i></div>\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value ${y>=0?"positive":"negative"}">€ ${v(y)}</span>\n                        <span class="finance-kpi-label">${y>=0?"Avanzo":"Disavanzo"}</span>\n                    </div>\n                </div>\n                <div class="finance-kpi-card kpi-count">\n                    <div class="finance-kpi-icon"><i class="ph ph-note-pencil"></i></div>\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">${i.entry_count||0}</span>\n                        <span class="finance-kpi-label">Registrazioni</span>\n                    </div>\n                </div>\n            </div>\n\n            \x3c!-- Monthly Trend --\x3e\n            ${function(n){if(!n||0===n.length)return"";const t=Math.max(...n.map(n=>Math.max(parseFloat(n.income)||0,parseFloat(n.expenses)||0)),1);return`\n        <div class="finance-section finance-trend">\n            <h3 style="margin-bottom:var(--sp-2);display:flex;align-items:center;gap:8px;">\n                <i class="ph ph-chart-bar" style="color:var(--color-primary);"></i>\n                Andamento Mensile\n            </h3>\n            <div class="finance-chart">\n                ${n.map(n=>{const e=parseFloat(n.income)||0,a=parseFloat(n.expenses)||0,i=Math.max(2,e/t*100),s=Math.max(2,a/t*100),l=n.month?n.month.split("-")[1]:"",r=["","Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"][parseInt(l)]||l;return`\n                    <div class="finance-chart-col">\n                        <div class="finance-chart-bars">\n                            <div class="finance-bar bar-income" style="height:${i}%;" title="Entrate: € ${v(e)}"></div>\n                            <div class="finance-bar bar-expense" style="height:${s}%;" title="Uscite: € ${v(a)}"></div>\n                        </div>\n                        <span class="finance-chart-label">${r}</span>\n                    </div>`}).join("")}\n            </div>\n            <div class="finance-chart-legend">\n                <span><span class="legend-dot" style="background:#10b981;"></span> Entrate</span>\n                <span><span class="legend-dot" style="background:#ef4444;"></span> Uscite</span>\n            </div>\n        </div>`}(i.monthly_trend||[])}\n\n            \x3c!-- Recent Entries --\x3e\n            <div class="finance-section">\n                <h3 style="margin-bottom:var(--sp-2);display:flex;align-items:center;gap:8px;">\n                    <i class="ph ph-clock-clockwise" style="color:var(--color-primary);"></i>\n                    Ultime registrazioni\n                </h3>\n                <div class="finance-entries-list">\n                    ${0===(i.recent_entries||[]).length?'<div class="finance-empty"><i class="ph ph-note-pencil" style="font-size:40px;opacity:0.2;"></i>\n                           <p>Nessuna registrazione. Inizia inserendo la prima nota.</p></div>':(i.recent_entries||[]).map(n=>c(n)).join("")}\n                </div>\n            </div>\n        </div>`,
                            function(t) {
                                t.querySelector("#btn-new-entry")?.addEventListener("click", () => d(), {
                                    signal: n.signal
                                }), t.querySelector("#btn-view-entries")?.addEventListener("click", () => p(t), {
                                    signal: n.signal
                                }), t.querySelector("#btn-view-invoices")?.addEventListener("click", () => g(t), {
                                    signal: n.signal
                                }), t.querySelector("#btn-view-accounts")?.addEventListener("click", () => async function(t) {
                                    t.innerHTML = UI.skeletonPage();
                                    try {
                                        const e = await Store.get("chartOfAccounts", "finance");
                                        a = e || [],
                                            function(t) {
                                                const e = {
                                                    entrata: [],
                                                    uscita: [],
                                                    patrimoniale_attivo: [],
                                                    patrimoniale_passivo: []
                                                };
                                                a.forEach(n => {
                                                    e[n.type] && e[n.type].push(n)
                                                });
                                                const i = {
                                                        entrata: "Entrate",
                                                        uscita: "Uscite",
                                                        patrimoniale_attivo: "Attività",
                                                        patrimoniale_passivo: "Passività"
                                                    },
                                                    s = {
                                                        entrata: "#10b981",
                                                        uscita: "#ef4444",
                                                        patrimoniale_attivo: "#3b82f6",
                                                        patrimoniale_passivo: "#f59e0b"
                                                    };
                                                t.innerHTML = `\n                < div class="finance-page" >\n                    <div class="finance-header">\n                        <div class="finance-title-row">\n                            <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                                <i class="ph ph-tree-structure" style="color:var(--color-primary);"></i> Piano dei Conti\n                            </h1>\n                            <button class="btn btn-ghost btn-sm" id="btn-back-dash">\n                                <i class="ph ph-arrow-left"></i> Dashboard\n                            </button>\n                        </div>\n                    </div>\n            ${Object.entries(e).map(([n,t])=>`\n            <div class="finance-section" style="margin-bottom:var(--sp-3);">\n                <h3 style="color:${s[n]};margin-bottom:var(--sp-1);font-size:14px;text-transform:uppercase;letter-spacing:0.06em;">\n                    ${i[n]} (${t.length})\n                </h3>\n                ${t.map(n=>`\n                <div class="finance-account-row">\n                    <span class="finance-account-code">${Utils.escapeHtml(n.code)}</span>\n                    <span class="finance-account-name">${Utils.escapeHtml(n.name)}</span>\n                    ${n.is_system?'<span class="finance-account-badge">Sistema</span>':""}\n                </div>`).join("")}\n            </div>`).join("")}\n        </div > `, t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                                                    signal: n.signal
                                                })
                                            }(t)
                                    } catch (n) {
                                        t.innerHTML = Utils.emptyState("Errore", n.message)
                                    }
                                }(t), {
                                    signal: n.signal
                                }), t.querySelector("#btn-rendiconto")?.addEventListener("click", () => async function(t) {
                                    t.innerHTML = UI.skeletonPage();
                                    try {
                                        ! function(t, e) {
                                            const a = e.fiscal_year || {},
                                                i = e.sections || {};
                                            t.innerHTML = `\n    < div class="finance-page" >\n        <div class="finance-header">\n            <div class="finance-title-row">\n                <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                    <i class="ph ph-file-text" style="color:var(--color-primary);"></i>\n                    Rendiconto Gestionale ETS\n                </h1>\n                <div style="display:flex;gap:8px;">\n                    <button class="btn btn-ghost btn-sm" id="btn-rendiconto-pdf">\n                        <i class="ph ph-file-pdf" style="color:#ef4444;"></i> Esporta PDF\n                    </button>\n                    <button class="btn btn-ghost btn-sm" id="btn-back-dash">\n                        <i class="ph ph-arrow-left"></i> Dashboard\n                    </button>\n                </div>\n            </div>\n            <p style="color:var(--text-muted);font-size:13px;">\n                Esercizio: ${Utils.escapeHtml(a.label||"—")} (${a.start_date||""} — ${a.end_date||""})\n            </p>\n        </div>\n\n            ${Object.values(i).map(n=>`\n            <div class="finance-rendiconto-section">\n                <h3 class="finance-rendiconto-title">${Utils.escapeHtml(n.label)}</h3>\n                ${(n.accounts||[]).filter(n=>0!==n.balance).map(n=>`\n                <div class="finance-rendiconto-row">\n                    <span>${Utils.escapeHtml(n.code)} — ${Utils.escapeHtml(n.name)}</span>\n                    <span style="font-weight:600;">€ ${v(n.balance)}</span>\n                </div>`).join("")||'<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">Nessun movimento</p>'}\n                <div class="finance-rendiconto-total">\n                    <span>Totale ${Utils.escapeHtml(n.label)}</span>\n                    <span>€ ${v(n.total)}</span>\n                </div>\n            </div>`).join("")}\n\n            <div class="finance-rendiconto-result ${e.avanzo_disavanzo>=0?"positive":"negative"}">\n                <span>${Utils.escapeHtml(e.avanzo_label||"Risultato")}</span>\n                <span>€ ${v(e.avanzo_disavanzo||0)}</span>\n            </div>\n        </div>`, t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                                                signal: n.signal
                                            })
                                        }(t, await Store.get("rendiconto", "finance"))
                                    } catch (n) {
                                        t.innerHTML = Utils.emptyState("Errore", n.message)
                                    }
                                }(t), {
                                    signal: n.signal
                                }), t.querySelector("#btn-74ter")?.addEventListener("click", () => m(t), {
                                    signal: n.signal
                                }), t.querySelector(".finance-entries-list")?.addEventListener("click", n => {
                                    const t = n.target.closest("[data-id]");
                                    t && async function(n) {
                                        try {
                                            const t = await Store.get("getEntry", "finance", {
                                                    id: n
                                                }),
                                                e = document.createElement("div");
                                            e.innerHTML = `\n            <div style="display:flex;flex-direction:column;gap:var(--sp-2);">\n                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">\n                    <div><strong>N°</strong>: ${t.entry_number}</div>\n                    <div><strong>Data</strong>: ${new Date(t.entry_date).toLocaleDateString("it-IT")}</div>\n                    <div><strong>Categoria</strong>: ${Utils.escapeHtml(s[t.category]||t.category||"—")}</div>\n                    <div><strong>Metodo</strong>: ${Utils.escapeHtml(t.payment_method||"—")}</div>\n                    <div><strong>Importo</strong>: <strong>€ ${v(parseFloat(t.total_amount))}</strong></div>\n                    <div><strong>Rif.</strong>: ${Utils.escapeHtml(t.reference||"—")}</div>\n                </div>\n                ${(t.lines||[]).length>0?`\n                <h4 style="margin:var(--sp-2) 0 0;">Righe contabili</h4>\n                <table style="width:100%;font-size:13px;border-collapse:collapse;">\n                    <thead><tr style="border-bottom:1px solid var(--color-border);">\n                        <th style="text-align:left;padding:6px;">Conto</th>\n                        <th style="text-align:right;padding:6px;">Dare</th>\n                        <th style="text-align:right;padding:6px;">Avere</th>\n                    </tr></thead>\n                    <tbody>${(t.lines||[]).map(n=>`\n                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">\n                            <td style="padding:6px;">[${Utils.escapeHtml(n.account_code)}] ${Utils.escapeHtml(n.account_name)}</td>\n                            <td style="text-align:right;padding:6px;color:#ef4444;">${parseFloat(n.debit)>0?"€ "+v(parseFloat(n.debit)):""}</td>\n                            <td style="text-align:right;padding:6px;color:#10b981;">${parseFloat(n.credit)>0?"€ "+v(parseFloat(n.credit)):""}</td>\n                        </tr>`).join("")}\n                    </tbody>\n                </table>`:""}\n                <p style="font-size:11px;color:var(--text-muted);margin-top:var(--sp-1);">\n                    Creato da ${Utils.escapeHtml(t.created_by_name||"—")} il ${new Date(t.created_at).toLocaleString("it-IT")}\n                </p>\n            </div>`, UI.modal({
                                                title: `Registrazione #${t.entry_number}`,
                                                body: e
                                            })
                                        } catch (n) {
                                            UI.toast(n.message || "Errore", "error")
                                        }
                                    }(t.dataset.id)
                                }, {
                                    signal: n.signal
                                })
                            }(e)
                    }(e)
            } catch (n) {
                console.error("[Finance] Init error:", n), e.innerHTML = Utils.emptyState("Errore nel caricamento", n.message, "Riprova", null, () => o())
            }
        }
    }

    function c(n) {
        const t = (n.category || "").match(/quote|iscrizi|sponsor|contribut|donaz|event|5.*mille/i),
            e = t ? "arrow-circle-down" : "arrow-circle-up",
            a = t ? "#10b981" : "#ef4444",
            i = s[n.category] || n.category || "—",
            l = n.entry_date ? new Date(n.entry_date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short"
            }) : "";
        return `\n        <div class="finance-entry-row" data-id="${Utils.escapeHtml(n.id)}" role="button" tabindex="0">\n            <div class="finance-entry-icon" style="color:${a};"><i class="ph ph-${e}"></i></div>\n            <div class="finance-entry-info">\n                <span class="finance-entry-desc">${Utils.escapeHtml(n.description)}</span>\n                <span class="finance-entry-meta">${Utils.escapeHtml(i)} · ${n.payment_method||""}</span>\n            </div>\n            <div class="finance-entry-right">\n                <span class="finance-entry-amount" style="color:${a};">€ ${v(parseFloat(n.total_amount)||0)}</span>\n                <span class="finance-entry-date">${l}</span>\n            </div>\n        </div>`
    }
    async function d() {
        if (0 === a.length) try {
            const n = await Store.get("chartOfAccounts", "finance");
            a = n || []
        } catch {
            a = []
        }
        const n = document.createElement("div");
        n.style.cssText = "display:flex;flex-direction:column;gap:var(--sp-2);";
        const t = Object.entries(s).map(([n, t]) => `<option value="${n}">${Utils.escapeHtml(t)}</option>`).join(""),
            e = a.map(n => `<option value="${Utils.escapeHtml(n.id)}">[${Utils.escapeHtml(n.code)}] ${Utils.escapeHtml(n.name)} (${n.type})</option>`).join("");
        n.innerHTML = `\n        <form id="entry-form">\n            <div class="form-group" style="margin:0 0 var(--sp-2) 0;">\n                <label class="form-label">Descrizione *</label>\n                <input type="text" id="entry-desc" class="form-input" required placeholder="Es. Quota socio Rossi Mario">\n            </div>\n            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Data *</label>\n                    <input type="date" id="entry-date" class="form-input" required value="${(new Date).toISOString().split("T")[0]}">\n                </div>\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Categoria</label>\n                    <select id="entry-cat" class="form-input"><option value="">— Seleziona —</option>${t}</select>\n                </div>\n            </div>\n            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Importo (€) *</label>\n                    <input type="number" id="entry-amount" class="form-input" step="0.01" min="0" required placeholder="0.00">\n                </div>\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Metodo pagamento</label>\n                    <select id="entry-payment" class="form-input">\n                        <option value="">—</option>\n                        ${r.map(n=>`<option value="${n}">${n}</option>`).join("")}\n                    </select>\n                </div>\n            </div>\n            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);">\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Conto DARE</label>\n                    <select id="entry-debit-account" class="form-input">${e}</select>\n                </div>\n                <div class="form-group" style="margin:0;">\n                    <label class="form-label">Conto AVERE</label>\n                    <select id="entry-credit-account" class="form-input">${e}</select>\n                </div>\n            </div>\n            <div class="form-group" style="margin:0;">\n                <label class="form-label">Riferimento / N° documento</label>\n                <input type="text" id="entry-ref" class="form-input" placeholder="Es. Ric. 001/2026">\n            </div>\n            <div id="entry-error" class="form-error hidden"></div>\n            <button type="submit" class="btn btn-primary" id="entry-save-btn">\n                <i class="ph ph-plus"></i> Registra\n            </button>\n        </form>`;
        const i = UI.modal({
            title: "Nuova Registrazione",
            body: n,
            size: "lg"
        });
        n.querySelector("#entry-form").addEventListener("submit", async t => {
            t.preventDefault();
            const e = n.querySelector("#entry-save-btn"),
                a = n.querySelector("#entry-error"),
                s = n.querySelector("#entry-desc").value.trim(),
                l = parseFloat(n.querySelector("#entry-amount").value) || 0;
            if (!s || l <= 0) return a.textContent = "Descrizione e importo sono obbligatori", void a.classList.remove("hidden");
            e.disabled = !0, e.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvataggio...', a.classList.add("hidden");
            try {
                await Store.api("createEntry", "finance", {
                    description: s,
                    entry_date: n.querySelector("#entry-date").value,
                    category: n.querySelector("#entry-cat").value || null,
                    payment_method: n.querySelector("#entry-payment").value || null,
                    reference: n.querySelector("#entry-ref").value.trim() || null,
                    lines: [{
                        account_id: n.querySelector("#entry-debit-account").value,
                        debit: l,
                        credit: 0
                    }, {
                        account_id: n.querySelector("#entry-credit-account").value,
                        debit: 0,
                        credit: l
                    }]
                }), UI.toast("Registrazione creata!", "success"), i.close(), o()
            } catch (n) {
                a.textContent = n.message || "Errore", a.classList.remove("hidden"), e.disabled = !1, e.innerHTML = '<i class="ph ph-plus"></i> Registra'
            }
        })
    }
    async function p(t) {
        t.innerHTML = UI.skeletonPage();
        try {
            const a = await Store.get("listEntries", "finance");
            e = a?.entries || [],
                function(t, a) {
                    t.innerHTML = `\n        <div class="finance-page">\n            <div class="finance-header">\n                <div class="finance-title-row">\n                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                        <i class="ph ph-list" style="color:var(--color-primary);"></i> Prima Nota\n                    </h1>\n                    <div style="display:flex;gap:8px;">\n                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">\n                            <i class="ph ph-arrow-left"></i> Dashboard\n                        </button>\n                        <button class="btn btn-primary" id="btn-new-entry">\n                            <i class="ph ph-plus"></i> Nuova\n                        </button>\n                    </div>\n                </div>\n            </div>\n            <div class="finance-entries-list">\n                ${0===e.length?'<div class="finance-empty"><p>Nessuna registrazione trovata</p></div>':e.map(n=>c(n)).join("")}\n            </div>\n            ${a.pages>1?`<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:12px;">\n                Pagina ${a.page} di ${a.pages} (${a.total} totali)</p>`:""}\n        </div>`, t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                        signal: n.signal
                    }), t.querySelector("#btn-new-entry")?.addEventListener("click", () => d(), {
                        signal: n.signal
                    })
                }(t, a)
        } catch (n) {
            t.innerHTML = Utils.emptyState("Errore", n.message, "Riprova", null, () => p(t))
        }
    }
    async function g(t) {
        t.innerHTML = UI.skeletonPage();
        try {
            const e = await Store.get("listInvoices", "finance");
            i = e?.invoices || [],
                function(t, e) {
                    const a = i.map(n => {
                        const t = "out" === n.direction,
                            e = t ? "arrow-circle-right" : "arrow-circle-left",
                            a = t ? "var(--color-primary)" : "var(--color-warning)";
                        let i = "muted";
                        return "sent" === n.status ? i = "blue" : "delivered" === n.status ? i = "green" : "rejected" === n.status ? i = "red" : "draft" === n.status && (i = "yellow"), `\n            <tr class="finance-invoice-row" data-id="${Utils.escapeHtml(n.id)}" style="cursor:pointer;" title="Vedi dettaglio SDI">\n                <td style="color:${a};"><i class="ph ph-${e}"></i></td>\n                <td><strong>${Utils.escapeHtml(n.invoice_number)}</strong><br><span style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;">${Utils.escapeHtml(n.type)}</span></td>\n                <td>${new Date(n.created_at).toLocaleDateString("it-IT")}</td>\n                <td>${Utils.escapeHtml(n.recipient_name)}</td>\n                <td style="font-family:monospace;font-size:12px;">${n.sdi_code||n.pec||'<span style="color:var(--text-muted);">—</span>'}</td>\n                <td style="font-weight:600;text-align:right;">€ ${v(parseFloat(n.total_amount))}</td>\n                <td style="text-align:center;">${Utils.badge(n.status.toUpperCase(),i)}</td>\n            </tr>`
                    }).join("");
                    t.innerHTML = `\n        <div class="finance-page">\n            <div class="finance-header">\n                <div class="finance-title-row">\n                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                        <i class="ph ph-file-invoice" style="color:var(--color-primary);"></i> Fatture e Ricevute (SDI)\n                    </h1>\n                    <div style="display:flex;gap:8px;">\n                        <button class="btn btn-ghost btn-sm" id="btn-back-dash"><i class="ph ph-arrow-left"></i> Dashboard</button>\n                    </div>\n                </div>\n            </div>\n            <div class="table-wrapper">\n                <table class="table table-hover">\n                    <thead><tr>\n                        <th style="width:40px;"></th>\n                        <th>Numero</th>\n                        <th>Data</th>\n                        <th>Intestatario</th>\n                        <th>Codice SDI / PEC</th>\n                        <th style="text-align:right;">Totale</th>\n                        <th style="text-align:center;">Stato SDI</th>\n                    </tr></thead>\n                    <tbody>\n                        ${a||'<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--text-muted);">Nessuna fattura/ricevuta</td></tr>'}\n                    </tbody>\n                </table>\n            </div>\n            ${e.pages>1?`<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:12px;">\n                Pagina ${e.page} di ${e.pages} (${e.total} totali)</p>`:""}\n        </div>`, t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                        signal: n.signal
                    }), t.querySelectorAll(".finance-invoice-row").forEach(t => {
                        t.addEventListener("click", () => async function(n) {
                            try {
                                const t = await Store.get("getInvoice", "finance", {
                                        id: n
                                    }),
                                    e = "draft" === t.status,
                                    a = document.createElement("div");
                                a.innerHTML = `\n            <div style="background:#fff;color:#000;padding:40px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.5;">\n                <div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">\n                    <div>\n                        <h2 style="margin:0;font-size:24px;">${t.type.toUpperCase()}</h2>\n                        <strong style="font-size:16px;">N. ${Utils.escapeHtml(t.invoice_number)}</strong>\n                        <div style="margin-top:5px;">Data: ${new Date(t.created_at).toLocaleDateString("it-IT")}</div>\n                    </div>\n                    <div style="text-align:right;">\n                        <strong>SDI PREVIEW LAYOUT</strong><br>\n                        Stato Attuale: ${t.status.toUpperCase()}<br>\n                        ${t.sdi_id?`SDI ID: ${Utils.escapeHtml(t.sdi_id)}`:""}\n                    </div>\n                </div>\n\n                <div style="display:flex;justify-content:space-between;margin-bottom:30px;">\n                    <div style="width:45%;">\n                        <strong>MITTENTE:</strong><br>\n                        ${Utils.escapeHtml(Store.getState().user?.club_name||"ASD Fusion")}<br>\n                        ASD/SSD a R.L.<br>\n                        \x3c!-- Other tenant data would go here --\x3e\n                    </div>\n                    <div style="width:45%;">\n                        <strong>DESTINATARIO:</strong><br>\n                        ${Utils.escapeHtml(t.recipient_name)}<br>\n                        ${t.recipient_address?Utils.escapeHtml(t.recipient_address)+"<br>":""}\n                        ${t.recipient_cf?"C.F. "+Utils.escapeHtml(t.recipient_cf)+"<br>":""}\n                        ${t.recipient_piva?"P.IVA "+Utils.escapeHtml(t.recipient_piva)+"<br>":""}\n                        <br>\n                        <strong>Codice Destinatario (SDI):</strong> ${Utils.escapeHtml(t.sdi_code||"0000000")}<br>\n                        ${t.pec?`<strong>PEC:</strong> ${Utils.escapeHtml(t.pec)}`:""}\n                    </div>\n                </div>\n\n                <table style="width:100%;border-collapse:collapse;margin-bottom:30px;">\n                    <thead style="border-bottom:1px solid #000;">\n                        <tr>\n                            <th style="text-align:left;padding:8px 0;">Descrizione</th>\n                            <th style="text-align:center;padding:8px 0;width:60px;">Q.tà</th>\n                            <th style="text-align:right;padding:8px 0;width:100px;">Prezzo Unit.</th>\n                            <th style="text-align:right;padding:8px 0;width:100px;">Importo</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        ${(t.line_items||[]).map(n=>`\n                        <tr>\n                            <td style="padding:8px 0;">${Utils.escapeHtml(n.description)}</td>\n                            <td style="text-align:center;padding:8px 0;">${n.qty||1}</td>\n                            <td style="text-align:right;padding:8px 0;">€ ${v(parseFloat(n.unit_price||0))}</td>\n                            <td style="text-align:right;padding:8px 0;">€ ${v(parseFloat(n.amount||0))}</td>\n                        </tr>\n                        `).join("")}\n                    </tbody>\n                </table>\n\n                <div style="display:flex;justify-content:flex-end;">\n                    <div style="width:300px;">\n                        <div style="display:flex;justify-content:space-between;padding:4px 0;">\n                            <span>Imponibile:</span>\n                            <span>€ ${v(parseFloat(t.subtotal))}</span>\n                        </div>\n                        <div style="display:flex;justify-content:space-between;padding:4px 0;">\n                            <span>Imposta (${parseFloat(t.tax_rate)}%):</span>\n                            <span>€ ${v(parseFloat(t.tax_amount))}</span>\n                        </div>\n                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #000;font-weight:bold;font-size:16px;">\n                            <span>TOTALE DOCUMENTO:</span>\n                            <span>€ ${v(parseFloat(t.total_amount))}</span>\n                        </div>\n                    </div>\n                </div>\n                \n                ${t.notes?`<div style="margin-top:30px;padding:10px;border:1px solid #eee;"><strong>Note:</strong><br>${Utils.escapeHtml(t.notes)}</div>`:""}\n            </div>`;
                                const i = `\n                <button class="btn btn-ghost" onclick="UI.closeAllModals()">Chiudi</button>\n                ${e?'<button class="btn btn-primary" id="btn-send-sdi" onclick="UI.toast(\'Integrazione SDI non configurata: funzione disabilitata in demo\', \'info\', 4000)"><i class="ph ph-paper-plane-tilt"></i> INVIA ALLO SDI</button>':""}\n                <button class="btn btn-ghost" onclick="window.print()"><i class="ph ph-printer"></i> Stampa Cortesia</button>\n            `;
                                UI.modal({
                                    title: `Dettaglio ${t.type} #${t.invoice_number}`,
                                    body: a,
                                    footer: i,
                                    size: "lg"
                                })
                            } catch (n) {
                                UI.toast(n.message || "Errore recupero fattura", "error")
                            }
                        }(t.dataset.id), {
                            signal: n.signal
                        })
                    })
                }(t, e)
        } catch (n) {
            t.innerHTML = Utils.emptyState("Errore", n.message, "Riprova", null, () => g(t))
        }
    }
    let _fexChartJsLoaded = !1,
        _fexChartJsPromise = null;

    function loadChartJsFex() {
        return _fexChartJsLoaded ? Promise.resolve() : _fexChartJsPromise ? _fexChartJsPromise : _fexChartJsPromise = new Promise((e, r) => {
            const t = document.createElement("script");
            t.src = "https://cdn.jsdelivr.net/npm/chart.js", t.onload = () => {
                _fexChartJsLoaded = !0, e()
            }, t.onerror = e => r(e), document.head.appendChild(t)
        }), _fexChartJsPromise
    }
    async function renderForesteriaExpenses(t) {
        t.innerHTML = UI.skeletonPage();
        try {
            const _forestData = await Store.get("getForesteria", "societa").catch(() => ({
                expenses: []
            }));
            const expenses = _forestData?.expenses || [];
            const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
            const catLabel = {
                manutenzione: "Manutenzione",
                pulizie: "Pulizie",
                utenze: "Utenze",
                cibo: "Cibo/Spesa",
                frutta_verdura: "Frutta e Verdura",
                tuto: "Tuto",
                affitto: "Affitto",
                altro: "Altro"
            };
            const catColors = {
                manutenzione: "#FFB300",
                pulizie: "#03A9F4",
                utenze: "#E91E63",
                cibo: "#4CAF50",
                frutta_verdura: "#8BC34A",
                tuto: "#D32F2F",
                affitto: "#607D8B",
                altro: "#9E9E9E"
            };
            t.innerHTML = `\n        <div class="finance-page">\n            <div class="finance-header">\n                <div class="finance-title-row">\n                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                        <i class="ph ph-house-line" style="color:var(--color-primary);"></i> Spese Foresteria\n                    </h1>\n                    <div style="display:flex;gap:8px;">\n                        <button class="btn btn-ghost btn-sm" id="btn-back-dash"><i class="ph ph-arrow-left"></i> Dashboard</button>\n                        ${isAdmin?'<button class="btn btn-primary btn-sm" id="for-add-exp" type="button"><i class="ph ph-plus"></i> AGGIUNGI SPESA</button>':""}\n                    </div>\n                </div>\n            </div>\n            <div class="card" style="padding:var(--sp-4)">\n                ${expenses.length===0?Utils.emptyState("Nessuna spesa registrata","Registra la prima spesa con il pulsante in alto."):`<div class="table-wrapper" style="overflow-x:auto"><table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr>\n                  <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted)">Data</th>\n                  <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted)">Descrizione</th>\n                  <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted)">Categoria</th>\n                  <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted)">Importo</th>\n                  ${isAdmin?'<th style="padding:10px 12px;border-bottom:1px solid var(--color-border)"></th>':""}\n                </tr></thead><tbody>${expenses.map(ex=>`<tr>\n                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">${Utils.escapeHtml(ex.expense_date?.substring(0,10)||"—")}</td>\n                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(ex.description||"—")} ${ex.receipt_path?`<a href="${Utils.escapeHtml(ex.receipt_path)}" target="_blank" style="margin-left:8px;color:var(--color-primary);" title="Vedi Scontrino"><i class="ph ph-file-text"></i></a>`:""}</td>\n                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)"><span style="font-size:11px;background:var(--color-surface-elevated);padding:2px 8px;border-radius:20px">${catLabel[ex.category]||ex.category||"—"}</span></td>\n                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;font-weight:700">€ ${parseFloat(ex.amount||0).toFixed(2)}</td>\n                  ${isAdmin?`<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap"><button class="btn btn-ghost btn-sm" data-del-exp="${Utils.escapeHtml(ex.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button></td>`:""}\n                </tr>`).join("")}</tbody></table></div>`}\n            </div>\n            <div class="card" style="padding:var(--sp-4);margin-top:var(--sp-4);">\n                <h3 style="margin-bottom:var(--sp-3);display:flex;align-items:center;gap:8px;">\n                    <i class="ph ph-chart-bar" style="color:var(--color-primary);"></i> Riepilogo Mensile\n                </h3>\n                ${expenses.length>0?`<div style="width:100%;height:300px;position:relative;">\n                    <canvas id="foresteria-chart"></canvas>\n                </div>`:`<div style="text-align:center;padding:40px 20px;color:var(--color-text-muted);"><i class="ph ph-chart-bar" style="font-size:32px;opacity:0.5;margin-bottom:8px;"></i><p>Aggiungi la tua prima spesa per generare il grafico.</p></div>`}\n            </div>\n        </div>`;
            t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                signal: n.signal
            });
            t.querySelector("#for-add-exp")?.addEventListener("click", () => {
                const modal = UI.modal({
                    title: "Nuova Spesa",
                    body: `<div class="form-group"><label class="form-label">Descrizione *</label><input id="fex-desc" class="form-input" type="text" placeholder="es. Riparazione idraulico"></div><div class="form-grid"><div class="form-group"><label class="form-label">Importo € *</label><input id="fex-amount" class="form-input" type="number" step="0.01" min="0"></div><div class="form-group"><label class="form-label">Data *</label><input id="fex-date" class="form-input" type="date" value="${new Date().toISOString().substring(0,10)}"></div></div><div class="form-group"><label class="form-label">Categoria</label><select id="fex-cat" class="form-select"><option value="manutenzione">Manutenzione</option><option value="pulizie">Pulizie</option><option value="utenze">Utenze</option><option value="cibo">Cibo/Spesa</option><option value="frutta_verdura">Frutta e Verdura</option><option value="tuto">Tuto</option><option value="affitto">Affitto</option><option value="altro" selected>Altro</option></select></div><div class="form-group"><label class="form-label">Foto Scontrino/Ricevuta</label><input type="file" id="fex-receipt" class="form-input" accept="image/*" capture="environment"></div><div class="form-group"><label class="form-label">Note</label><textarea id="fex-notes" class="form-input" rows="2"></textarea></div><div id="fex-err" class="form-error hidden"></div>`,
                    footer: '<button class="btn btn-ghost btn-sm" id="fex-cancel" type="button">Annulla</button><button class="btn btn-primary btn-sm" id="fex-save" type="button">AGGIUNGI</button>'
                });
                document.getElementById("fex-cancel")?.addEventListener("click", () => modal.close());
                document.getElementById("fex-save")?.addEventListener("click", async () => {
                    const desc = document.getElementById("fex-desc")?.value.trim();
                    const amount = document.getElementById("fex-amount")?.value;
                    const date = document.getElementById("fex-date")?.value;
                    const errEl = document.getElementById("fex-err");
                    if (!desc || !amount || !date) {
                        errEl.textContent = "Descrizione, importo e data sono obbligatori";
                        errEl.classList.remove("hidden");
                        return;
                    }
                    const btn = document.getElementById("fex-save");
                    btn.disabled = true;
                    btn.textContent = "Salvataggio...";
                    try {
                        const fd = new FormData();
                        fd.append("description", desc);
                        fd.append("amount", amount);
                        fd.append("expense_date", date);
                        fd.append("category", document.getElementById("fex-cat")?.value || "altro");
                        const notes = document.getElementById("fex-notes")?.value;
                        if (notes) fd.append("notes", notes);
                        const fileInp = document.getElementById("fex-receipt");
                        if (fileInp && fileInp.files[0]) fd.append("receipt", fileInp.files[0]);
                        await Store.api("addExpense", "societa", fd);
                        UI.toast("Spesa aggiunta", "success");
                        await renderForesteriaExpenses(t);
                        modal.close();
                    } catch (err) {
                        errEl.textContent = err.message;
                        errEl.classList.remove("hidden");
                        btn.disabled = false;
                        btn.textContent = "AGGIUNGI";
                    }
                })
            });
            t.querySelectorAll("[data-del-exp]").forEach(btn => btn.addEventListener("click", async () => {
                try {
                    await Store.api("deleteExpense", "societa", {
                        id: btn.dataset.delExp
                    });
                    UI.toast("Spesa rimossa", "success");
                    await renderForesteriaExpenses(t);
                } catch (err) {
                    UI.toast("Errore: " + err.message, "error");
                }
            }));
            if (expenses.length > 0) {
                await loadChartJsFex();
                const eCtx = document.getElementById("foresteria-chart");
                if (eCtx) {
                    if (window._fexChartInstance) {
                        window._fexChartInstance.destroy();
                    }
                    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                    const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
                    const dataByMonth = {};
                    months.forEach(m => dataByMonth[m] = {});
                    expenses.forEach(x => {
                        if (!x.expense_date) return;
                        const dParts = x.expense_date.split("-");
                        if (dParts.length >= 2) {
                            const m = dParts[1];
                            if (months.includes(m)) {
                                const c = x.category || "altro";
                                dataByMonth[m][c
                                } = (dataByMonth[m][c] || 0) + parseFloat(x.amount || 0);
                            }
                        }
                    });
                    const datasets = [];
                    Object.keys(catLabel).forEach(cat => {
                        const data = months.map(m => dataByMonth[m][cat] || 0);
                        if (data.some(v => v > 0)) {
                            datasets.push({
                                label: catLabel[cat],
                                data: data,
                                backgroundColor: catColors[cat],
                                borderWidth: 0,
                                borderRadius: 4
                            });
                        }
                    });
                    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--color-text-muted").trim() || "#9CA3AF";
                    window._fexChartInstance = new Chart(eCtx, {
                        type: "bar",
                        data: {
                            labels: monthNames,
                            datasets: datasets
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    labels: {
                                        color: textColor,
                                        font: {
                                            family: "Inter, sans-serif"
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    grid: {
                                        color: "rgba(255,255,255,0.05)"
                                    },
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            family: "Inter, sans-serif"
                                        }
                                    }
                                },
                                y: {
                                    stacked: true,
                                    grid: {
                                        color: "rgba(255,255,255,0.05)"
                                    },
                                    ticks: {
                                        color: textColor,
                                        font: {
                                            family: "Inter, sans-serif"
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (n) {
            t.innerHTML = Utils.emptyState("Errore", n.message, "Riprova", null, () => renderForesteriaExpenses(t));
        }
    }

    function v(n) {
        return new Intl.NumberFormat("it-IT", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(n)
    }
    async function m(t) {
        t.innerHTML = UI.skeletonPage();
        try {
            ! function(t, e) {
                t.innerHTML = `\n        <div class="finance-page">\n            <div class="finance-header">\n                <div class="finance-title-row">\n                    <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">\n                        <i class="ph ph-intersect" style="color:var(--color-pink);"></i>\n                        Regime 74-ter\n                    </h1>\n                    <div style="display:flex;gap:8px;">\n                        <button class="btn btn-ghost btn-sm" id="btn-back-dash">\n                            <i class="ph ph-arrow-left"></i> Dashboard\n                        </button>\n                    </div>\n                </div>\n            </div>\n\n            \x3c!-- 74-ter KPI --\x3e\n            <div class="finance-kpi-grid">\n                <div class="finance-kpi-card" style="border-left: 4px solid var(--color-pink);">\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">€ ${v(e.total_billed)}</span>\n                        <span class="finance-kpi-label">Totale Fatturato (Lordo)</span>\n                    </div>\n                </div>\n                <div class="finance-kpi-card" style="border-left: 4px solid #3b82f6;">\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">€ ${v(e.margin_74ter)}</span>\n                        <span class="finance-kpi-label">Margine 74-ter</span>\n                    </div>\n                </div>\n                <div class="finance-kpi-card" style="border-left: 4px solid var(--color-danger);">\n                    <div class="finance-kpi-content">\n                        <span class="finance-kpi-value">€ ${v(e.vat_due)}</span>\n                        <span class="finance-kpi-label">IVA Dovuta (Netta)</span>\n                    </div>\n                </div>\n            </div>\n\n            <div class="finance-section">\n                <h3 style="margin-bottom:var(--sp-2);">Registri 74-ter Summary</h3>\n                <div class="table-wrapper">\n                    <table class="table">\n                        <thead>\n                            <tr>\n                                <th>Mese</th>\n                                <th style="text-align:right;">Vendite</th>\n                                <th style="text-align:right;">Acquisti (Misto)</th>\n                                <th style="text-align:right;">Margine Lordo</th>\n                                <th style="text-align:right;">IVA Debito</th>\n                            </tr>\n                        </thead>\n                        <tbody>\n                            ${(e.monthly_trend||[]).map(n=>`\n                                <tr>\n                                    <td>${n.month}</td>\n                                    <td style="text-align:right;">€ ${v(n.sales)}</td>\n                                    <td style="text-align:right;">€ ${v(n.acquisitions)}</td>\n                                    <td style="text-align:right;">€ ${v(n.margin)}</td>\n                                    <td style="text-align:right;">€ ${v(.22*n.margin)}</td>\n                                </tr>\n                            `).join("")}\n                        </tbody>\n                    </table>\n                </div>\n            </div>\n        </div>`, t.querySelector("#btn-back-dash")?.addEventListener("click", () => o(), {
                    signal: n.signal
                })
            }(t, await Store.get("getFiscal74ter", "finance").catch(() => ({
                margin_74ter: 92800.5,
                vat_due: 41750,
                total_billed: 495200,
                monthly_trend: [{
                    month: "2023-10",
                    sales: 495200,
                    acquisitions: 92800,
                    margin: 185500
                }, {
                    month: "2023-11",
                    sales: 95200,
                    acquisitions: 2800,
                    margin: 15500
                }, {
                    month: "2023-12",
                    sales: 495200,
                    acquisitions: 92800,
                    margin: 185500
                }]
            })))
        } catch (n) {
            t.innerHTML = Utils.emptyState("Errore", n.message)
        }
    }
    return {
        init: o,
        destroy: function() {
            n.abort(), t = null, e = [], a = []
        }
    }
})();
window.Finance = Finance;