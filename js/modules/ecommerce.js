"use strict";
const Ecommerce = (() => {
  let e = new AbortController(),
    t = "articles",
    n = null;
  function a(e) {
    return new Promise((t) => {
      if (!e || !e.startsWith("data:image/")) return t(e);
      const n = new Image();
      ((n.onload = () => {
        const e = document.createElement("canvas"),
          a = e.getContext("2d");
        ((e.width = n.width), (e.height = n.height), a.drawImage(n, 0, 0));
        const i = a.getImageData(0, 0, e.width, e.height),
          o = i.data;
        for (let e = 0; e < o.length; e += 4) {
          const t = o[e],
            n = o[e + 1],
            a = o[e + 2],
            i = o[e + 3],
            r = Math.sqrt((t - 255) ** 2 + (n - 255) ** 2 + (a - 255) ** 2);
          if (r < 30) o[e + 3] = 0;
          else if (r < 80) {
            const c = Math.max(0, (r - 30) / 50);
            o[e + 3] = Math.floor(i * c);
            const s = 71225 / 60945;
            ((o[e] = Math.max(0, Math.min(255, s * (t - 128) + 128))),
              (o[e + 1] = Math.max(0, Math.min(255, s * (n - 128) + 128))),
              (o[e + 2] = Math.max(0, Math.min(255, s * (a - 128) + 128))));
          } else if (i > 0) {
            const i = 71225 / 60945;
            ((o[e] = Math.max(0, Math.min(255, i * (t - 128) + 128))),
              (o[e + 1] = Math.max(0, Math.min(255, i * (n - 128) + 128))),
              (o[e + 2] = Math.max(0, Math.min(255, i * (a - 128) + 128))));
          }
        }
        (a.putImageData(i, 0, 0), t(e.toDataURL("image/png")));
      }),
        (n.onerror = () => t(e)),
        (n.src = e));
    });
  }
  async function i() {
    const n = document.getElementById("ec-panel-articles");
    if (n) {
      !(async function () {
        try {
          if (!await EcommerceDB.getMeta("dedupArticles_v2")) {
            const dedupCount = await EcommerceDB.deduplicateArticoli();
            if (dedupCount > 0) {
              const e = document.getElementById("ec-panel-articles");
              e && "articles" === t && o(e);
            }
            await EcommerceDB.setMeta("dedupArticles_v2", !0);
          }
          if (await EcommerceDB.getMeta("nanoBananaUpgradeAggressivo_v2"))
            return;
          const e = await EcommerceDB.getArticoli();
          let n = 0;
          for (let t of e)
            if (
              t.immagineBase64 &&
              (!t.immagineMimeType ||
                "image/jpeg" === t.immagineMimeType ||
                ("image/png" === t.immagineMimeType &&
                  t.immagineBase64.length > 500))
            )
              try {
                const e = await a(t.immagineBase64);
                e !== t.immagineBase64 &&
                  ((t.immagineBase64 = e),
                    (t.immagineMimeType = "image/png"),
                    await EcommerceDB.saveArticolo(t),
                    n++);
              } catch (e) { }
          if (n > 0) {
            console.log(`NanoBanana v2: upgraded ${n} legacy images.`);
            const e = document.getElementById("ec-panel-articles");
            e && "articles" === t && o(e);
          }
          await EcommerceDB.setMeta("nanoBananaUpgradeAggressivo_v2", !0);
        } catch (e) {
          console.error("NanoBanana: auto-upgrade failed", e);
        }
      })();
      try {
        const t = await EcommerceDB.countArticoli(),
          a = document.getElementById("ec-badge");
        a && (a.textContent = t > 0 ? `${t} Articoli` : "Articoli");
        const i = await EcommerceDB.getMeta("importCompletato");
        if (0 === t && !i)
          return void (function (t) {
            ((t.innerHTML =
              '\n        <div class="ec-import-banner">\n            <span class="ec-import-banner-icon">📦</span>\n            <div style="flex:1; min-width:0;">\n                <h3>Nessun articolo trovato</h3>\n                <p>Importa i prodotti dal sito originale in un click, oppure aggiungili manualmente.</p>\n            </div>\n            <div style="display:flex; gap:10px; flex-shrink:0; flex-wrap:wrap;">\n                <button class="ec-btn ec-btn-primary" id="ec-start-wizard" type="button">\n                    <i class="ph ph-download-simple"></i> Importa dal Sito\n                </button>\n                <button class="ec-btn ec-btn-ghost" id="ec-skip-import" type="button">\n                    Aggiungi Manualmente\n                </button>\n            </div>\n        </div>\n        <div id="ec-wizard-area"></div>\n        '),
              document.getElementById("ec-start-wizard").addEventListener(
                "click",
                () => {
                  ((document.querySelector(".ec-import-banner").style.display =
                    "none"),
                    l(document.getElementById("ec-wizard-area")));
                },
                { signal: e.signal },
              ),
              document.getElementById("ec-skip-import").addEventListener(
                "click",
                async () => {
                  (await EcommerceDB.setMeta("importCompletato", !0), o(t));
                },
                { signal: e.signal },
              ));
          })(n);
        o(n);
      } catch (e) {
        n.innerHTML = `<div class="ec-empty"><i class="ph ph-warning-circle"></i><p>Errore: ${Utils.escapeHtml(e.message)}</p></div>`;
      }
    }
  }
  async function o(t) {
    const n = await EcommerceDB.getArticoli(),
      a = [...new Set(n.map((e) => e.categoria).filter(Boolean))].sort(),
      i = document.getElementById("ec-badge");
    (i && (i.textContent = `${n.length} Articoli`),
      (t.innerHTML = `\n        <div class="ec-toolbar">\n            <div class="ec-search">\n                <i class="ph ph-magnifying-glass"></i>\n                <input type="text" id="ec-search-input" placeholder="Cerca articolo..." autocomplete="off">\n            </div>\n            <select class="ec-filter-cat" id="ec-cat-filter">\n                <option value="">Tutte le categorie</option>\n                ${a.map((e) => `<option value="${Utils.escapeHtml(e)}">${Utils.escapeHtml(e)}</option>`).join("")}\n            </select>\n            <button class="ec-btn ec-btn-success" id="ec-add-btn" type="button">\n                <i class="ph ph-plus"></i> Aggiungi Articolo\n            </button>\n        </div>\n        <div class="ec-grid" id="ec-articles-grid">\n            ${0 === n.length ? '<div class="ec-empty" style="grid-column:1/-1;">\n            <i class="ph ph-shopping-bag"></i>\n            <p>Nessun articolo trovato</p>\n        </div>' : n.map(r).join("")}\n        </div>\n        `));
    const o = document.getElementById("ec-search-input"),
      l = document.getElementById("ec-cat-filter");
    let d;
    const p = () => {
      (clearTimeout(d),
        (d = setTimeout(() => {
          const e = o.value.trim().toLowerCase(),
            a = l.value,
            i = n.filter(
              (t) =>
                (!e || t.nome.toLowerCase().includes(e)) &&
                (!a || t.categoria === a),
            );
          ((document.getElementById("ec-articles-grid").innerHTML =
            0 === i.length
              ? '<div class="ec-empty" style="grid-column:1/-1;">\n            <i class="ph ph-shopping-bag"></i>\n            <p>Nessun articolo trovato</p>\n        </div>'
              : i.map(r).join("")),
            c(t, n));
        }, 200)));
    };
    (o.addEventListener("input", p, { signal: e.signal }),
      l.addEventListener("change", p, { signal: e.signal }),
      document
        .getElementById("ec-add-btn")
        .addEventListener("click", () => s(null, t), { signal: e.signal }),
      c(t, n));
  }
  function r(e) {
    const t = e.immagineBase64
      ? `<img class="ec-card-img" src="${e.immagineBase64}" alt="${Utils.escapeHtml(e.nome)}" loading="lazy">`
      : '<div class="ec-card-img-placeholder"><i class="ph ph-image"></i></div>',
      n = e.disponibile
        ? '<span class="ec-badge-disponibile">● Disponibile</span>'
        : '<span class="ec-badge-non-disponibile">● Non Disponibile</span>';
    return `\n        <div class="ec-card" data-id="${e.id}">\n            <div class="ec-card-img-wrapper">\n                ${t}\n            </div>\n            <div class="ec-card-body">\n                <div class="ec-card-cat">${Utils.escapeHtml(e.categoria || "—")}</div>\n                <div class="ec-card-name" title="${Utils.escapeHtml(e.nome)}">${Utils.escapeHtml(e.nome)}</div>\n                <div class="ec-card-price">${(e.prezzo ?? 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })} €</div>\n                <div class="ec-card-footer">\n                    ${n}\n                    <div class="ec-card-actions">\n                        <button class="ec-icon-btn ec-edit-btn" data-id="${e.id}" title="Modifica">✏️</button>\n                        <button class="ec-icon-btn ec-delete-btn" data-id="${e.id}" title="Elimina">🗑️</button>\n                    </div>\n                </div>\n            </div>\n        </div>`;
  }
  function c(t, n) {
    (document.querySelectorAll(".ec-edit-btn").forEach((a) => {
      a.addEventListener(
        "click",
        () => {
          const e = Number(a.dataset.id),
            i = n.find((t) => t.id === e);
          i && s(i, t);
        },
        { signal: e.signal },
      );
    }),
      document.querySelectorAll(".ec-delete-btn").forEach((a) => {
        a.addEventListener(
          "click",
          () => {
            const e = Number(a.dataset.id),
              i = n.find((t) => t.id === e),
              r = i ? i.nome : "questo articolo";
            UI.confirm(
              `Eliminare "${r}"? L'operazione non è reversibile.`,
              async () => {
                (await EcommerceDB.deleteArticolo(e),
                  UI.toast("Articolo eliminato", "success"),
                  o(t));
              },
            );
          },
          { signal: e.signal },
        );
      }));
  }
  function s(e, t) {
    const n = !!e,
      i = document.createElement("div");
    ((i.className = "ec-form"),
      (i.innerHTML = `\n        <div class="ec-form-row">\n            <div>\n                <label for="ec-f-nome">Nome *</label>\n                <input type="text" id="ec-f-nome" placeholder="Nome prodotto" value="${Utils.escapeHtml(e?.nome || "")}" required>\n            </div>\n            <div>\n                <label for="ec-f-prezzo">Prezzo (€) *</label>\n                <input type="number" id="ec-f-prezzo" placeholder="0.00" step="0.01" min="0" value="${e?.prezzo ?? ""}">\n            </div>\n        </div>\n        <div>\n            <label for="ec-f-categoria">Categoria</label>\n            <input type="text" id="ec-f-categoria" placeholder="es. Abbigliamento" value="${Utils.escapeHtml(e?.categoria || "")}">\n        </div>\n        <div>\n            <label for="ec-f-desc">Descrizione</label>\n            <textarea id="ec-f-desc" placeholder="Descrizione del prodotto...">${Utils.escapeHtml(e?.descrizione || "")}</textarea>\n        </div>\n        <div>\n            <label>Immagine</label>\n            <p style="font-size:12px;opacity:.55;margin:0 0 8px;">Carica un file dal tuo computer, oppure incolla un URL.</p>\n            <div style="display:flex;gap:10px;flex-wrap:wrap;">\n                <input type="file" id="ec-f-img-file" accept="image/*" style="flex:1;min-width:0;">\n                <input type="text" id="ec-f-img-url" placeholder="https://... URL immagine (facoltativo)" style="flex:2;min-width:0;">\n            </div>\n            <img id="ec-f-img-preview" class="ec-img-preview"\n                src="${e?.immagineBase64 || ""}"\n                style="${e?.immagineBase64 ? "display:block;" : "display:none;"}">\n        </div>\n        <div class="ec-toggle">\n            <input type="checkbox" id="ec-f-disponibile" ${(e?.disponibile ?? 1) ? "checked" : ""}>\n            <label for="ec-f-disponibile" style="text-transform:none;opacity:1;font-size:14px;">Articolo disponibile</label>\n        </div>\n        <div id="ec-form-error" style="color:#ef4444;font-size:13px;display:none;"></div>\n        `));
    const r = document.createElement("div");
    ((r.style.cssText = "display:flex;gap:10px;justify-content:flex-end;"),
      (r.innerHTML = `\n        <button class="ec-btn ec-btn-ghost" id="ec-f-cancel" type="button">Annulla</button>\n        <button class="ec-btn ec-btn-primary" id="ec-f-save" type="button">\n            ${n ? "💾 Salva Modifiche" : "➕ Aggiungi Articolo"}\n        </button>`));
    const c = UI.modal({
      title: n ? `Modifica: ${e.nome}` : "Nuovo Articolo",
      body: i,
      footer: r,
    });
    let s = e?.immagineBase64 || null,
      l = e?.immagineMimeType || null;
    const d = document.getElementById("ec-f-img-preview");
    (document
      .getElementById("ec-f-img-file")
      .addEventListener("change", async (e) => {
        const t = e.target.files[0];
        if (t)
          try {
            ((s = await EcommerceDB.fileToBase64(t)),
              (l = t.type),
              (d.src = s),
              (d.style.display = "block"));
          } catch (e) {
            UI.toast("Errore lettura immagine", "error");
          }
      }),
      document
        .getElementById("ec-f-cancel")
        .addEventListener("click", () => c.close()),
      document
        .getElementById("ec-f-save")
        .addEventListener("click", async () => {
          const i = document.getElementById("ec-form-error");
          i.style.display = "none";
          const r = document.getElementById("ec-f-nome").value.trim();
          if (!r)
            return (
              (i.textContent = "Il nome è obbligatorio."),
              void (i.style.display = "block")
            );
          const d = document.getElementById("ec-f-img-url").value.trim();
          if (d && !s) {
            const e = await EcommerceDB.urlToBase64(d);
            e
              ? ((s = e), (l = "image/jpeg"))
              : UI.toast(
                "Impossibile scaricare l'immagine dall'URL (CORS o URL non valido).",
                "warning",
                4e3,
              );
          }
          const p = document.getElementById("ec-f-save");
          ((p.disabled = !0), (p.textContent = "Salvataggio..."));
          await new Promise(r => setTimeout(r, 50));
          try {
            (s && ((s = await a(s)), (l = "image/png")),
              await EcommerceDB.saveArticolo({
                id: n ? e.id : void 0,
                nome: r,
                prezzo:
                  parseFloat(document.getElementById("ec-f-prezzo")?.value.replace(/[^0-9,.]/g, "").replace(",", ".")) || 0,
                categoria: document
                  .getElementById("ec-f-categoria")
                  .value.trim(),
                descrizione: document.getElementById("ec-f-desc").value.trim(),
                disponibile:
                  document.getElementById("ec-f-disponibile").checked,
                immagineBase64: s,
                immagineMimeType: l,
              }),
              UI.toast(
                n ? "Articolo aggiornato" : "Articolo aggiunto",
                "success",
              ),
              c.close(),
              o(t));
          } catch (e) {
            ((i.textContent = "Errore salvataggio: " + e.message),
              (i.style.display = "block"),
              (p.disabled = !1),
              (p.textContent = n
                ? "💾 Salva Modifiche"
                : "➕ Aggiungi Articolo"));
          }
        }));
  }
  function l(t) {
    ((t.innerHTML =
      '\n        <div class="ec-wizard">\n            <div class="ec-wizard-step">Step 1 di 3</div>\n            <h3>🌐 Connessione al Negozio Originale</h3>\n            <p class="ec-wizard-note">\n                Il sistema recupererà l\'elenco dei prodotti da\n                <strong>fusionteamvolley.it/fusion-shop/</strong> tramite il server (nessun problema CORS).\n                Le immagini verranno scaricate e salvate localmente in formato base64 — nessuna dipendenza esterna.\n            </p>\n            <div style="display:flex;gap:10px;margin-top:20px;">\n                <button class="ec-btn ec-btn-primary" id="ec-wizard-fetch" type="button">\n                    <i class="ph ph-cloud-arrow-down" style="font-size:16px;"></i>\n                    Recupera Prodotti\n                </button>\n                <button class="ec-btn ec-btn-ghost" id="ec-wizard-cancel" type="button">Annulla</button>\n            </div>\n            <div id="ec-wizard-status" style="margin-top:16px;"></div>\n        </div>'),
      document.getElementById("ec-wizard-cancel").addEventListener(
        "click",
        () => {
          i();
        },
        { signal: e.signal },
      ),
      document.getElementById("ec-wizard-fetch").addEventListener(
        "click",
        async () => {
          await (async function (t) {
            const n = document.getElementById("ec-wizard-status"),
              i = document.getElementById("ec-wizard-fetch");
            ((i.disabled = !0),
              (i.innerHTML =
                '<div class="ec-spinner"></div> Recupero in corso...'));
            try {
              Store.invalidate("scrapeShop");
              const i =
                (await Store.get("scrapeShop", "ecommerce")).products || [];
              if (0 === i.length)
                return (
                  (n.innerHTML =
                    '\n                    <div class="ec-cors-warning">\n                        <strong>⚠️ Nessun prodotto rilevato</strong><br>\n                        Il negozio potrebbe essere offline o cambiato struttura.<br>\n                        Puoi comunque aggiungere gli articoli manualmente.\n                    </div>\n                    <button class="ec-btn ec-btn-ghost" id="ec-wizard-manual" type="button">\n                        Passa all\'inserimento manuale\n                    </button>'),
                  void document
                    .getElementById("ec-wizard-manual")
                    .addEventListener("click", async () => {
                      (await EcommerceDB.setMeta("importCompletato", !0),
                        o(document.getElementById("ec-panel-articles")));
                    })
                );
              !(function (t, n) {
                const i = n
                  .map(
                    (e) =>
                      `\n            <div class="ec-product-preview-item">\n                ${e.immagineUrl ? `<img class="ec-product-preview-img" src="${Utils.escapeHtml(e.immagineUrl)}" alt="" loading="lazy">` : '<div class="ec-product-preview-img" style="display:flex;align-items:center;justify-content:center;font-size:28px;color:rgba(255,255,255,.2);">📦</div>'}\n                <div class="ec-product-preview-name" title="${Utils.escapeHtml(e.nome)}">${Utils.escapeHtml(e.nome)}</div>\n                <div class="ec-product-preview-price">${e.prezzo > 0 ? e.prezzo.toLocaleString("it-IT") + " €" : "—"}</div>\n            </div>`,
                  )
                  .join("");
                ((t.innerHTML = `\n        <div class="ec-wizard">\n            <div class="ec-wizard-step">Step 2 di 3</div>\n            <h3>📋 Anteprima Prodotti (${n.length} trovati)</h3>\n            <p class="ec-wizard-note">Verifica i prodotti rilevati. Cliccando <strong>Conferma e Salva</strong> le immagini verranno scaricate e salvate localmente.</p>\n            <div class="ec-product-preview-grid">${i}</div>\n            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">\n                <button class="ec-btn ec-btn-success" id="ec-wizard-confirm" type="button">\n                    ✅ Conferma e Salva (${n.length} articoli)\n                </button>\n                <button class="ec-btn ec-btn-ghost" id="ec-wizard-back" type="button">← Indietro</button>\n            </div>\n            <div id="ec-wizard-progress-area" style="margin-top:20px;display:none;">\n                <div class="ec-wizard-step">Step 3 di 3 — Download immagini</div>\n                <div class="ec-progress"><div class="ec-progress-bar" id="ec-prog-bar" style="width:0%;"></div></div>\n                <p id="ec-prog-text" class="ec-wizard-note">0 / ${n.length} immagini scaricate...</p>\n            </div>\n        </div>`),
                  document
                    .getElementById("ec-wizard-back")
                    .addEventListener("click", () => l(t), {
                      signal: e.signal,
                    }),
                  document.getElementById("ec-wizard-confirm").addEventListener(
                    "click",
                    () =>
                      (async function (e, t) {
                        ((document.getElementById(
                          "ec-wizard-confirm",
                        ).disabled = !0),
                          (document.getElementById("ec-wizard-back").disabled =
                            !0),
                          (document.getElementById(
                            "ec-wizard-progress-area",
                          ).style.display = "block"));
                        const n = document.getElementById("ec-prog-bar"),
                          i = document.getElementById("ec-prog-text"),
                          r = t.length,
                          c = [];
                        let s = 0;
                        for (const e of t) {
                          let t = null,
                            o = null;
                          (e.immagineUrl &&
                            ((t = await EcommerceDB.urlToBase64(e.immagineUrl)),
                              t && (t = await a(t)),
                              (o = t
                                ? t.startsWith("data:image/png")
                                  ? "image/png"
                                  : "image/jpeg"
                                : null)),
                            s++);
                          const l = Math.round((s / r) * 100);
                          ((n.style.width = l + "%"),
                            (i.textContent = `${s} / ${r} immagini scaricate (${t ? "OK" : "skipped"}: ${Utils.escapeHtml(e.nome)})`),
                            c.push({
                              nome: e.nome,
                              prezzo: e.prezzo || 0,
                              immagineBase64: t,
                              immagineMimeType: o,
                              descrizione: e.descrizione || "",
                              categoria: e.categoria || "",
                              disponibile: !0,
                            }));
                        }
                        (await EcommerceDB.bulkSaveArticoli(c),
                          await EcommerceDB.setMeta("importCompletato", !0),
                          (i.textContent = `✅ ${c.length} articoli salvati con successo!`),
                          UI.toast(
                            `Importazione completata: ${c.length} articoli`,
                            "success",
                            5e3,
                          ),
                          setTimeout(() => {
                            const e =
                              document.getElementById("ec-panel-articles");
                            e && o(e);
                          }, 1200));
                      })(0, n),
                    { signal: e.signal },
                  ));
              })(t, i);
            } catch (e) {
              const errMsg = e.message && e.message.toLowerCase().includes("fetch")
                ? "Errore di rete o server non raggiungibile (Timeout/CORS). Assicurati di essere connesso." : Utils.escapeHtml(e.message);
              ((n.innerHTML = `<div class="ec-cors-warning">\n                <strong>⚠️ Errore di connessione</strong><br>\n                ${errMsg}<br><br>\n                Puoi aggiungere gli articoli manualmente cliccando "Aggiungi Manualmente".\n            </div>`),
                (i.disabled = !1),
                (i.innerHTML =
                  '<i class="ph ph-cloud-arrow-down"></i> Riprova'));
            }
          })(t);
        },
        { signal: e.signal },
      ));
  }
  async function d() {
    const t = document.getElementById("ec-panel-orders");
    if (t) {
      t.innerHTML =
        '<div style="padding:40px;text-align:center;opacity:.5;">\n            <div class="ec-spinner" style="width:28px;height:28px;margin:0 auto 12px;"></div>\n            <p>Caricamento ordini...</p>\n        </div>';
      try {
        const a = (await Store.get("getOrders", "ecommerce")).orders || [];
        ((n = new Date()),
          (function (t, a) {
            let i = "all";
            const o = () =>
              "all" === i
                ? a
                : a.filter(
                  (e) =>
                    ((e) => {
                      const t = String(e.statoInterno || "").toLowerCase();
                      if (t && "da definire" !== t) return t;
                      const n = String(e.statoForms || "").toLowerCase();
                      return "pagato" === n || "non pagato" === n
                        ? n
                        : "da definire";
                    })(e) === i,
                ),
              r = (e) =>
                e
                  .map((e) => {
                    let t = e.statoInterno;
                    if (
                      ((t && "da definire" !== t.toLowerCase()) || (t = null),
                        !t && e.statoForms)
                    ) {
                      const n = String(e.statoForms).toLowerCase();
                      ("pagato" !== n && "non pagato" !== n) || (t = n);
                    }
                    const n =
                      "pagato" === (a = t || "da definire")
                        ? '<span class="ec-badge-pagato">🟢 Pagato</span>'
                        : "non pagato" === a
                          ? '<span class="ec-badge-nonpagato">🔴 Non Pagato</span>'
                          : "consegnato" === a
                            ? '<span class="ec-badge-consegnato">🔵 Consegnato</span>'
                            : '<span class="ec-badge-pending">⚪ Da definire</span>';
                    var a;
                    const i = e.dataOrdine
                      ? new Date(e.dataOrdine).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      : "—",
                      o =
                        e.totale > 0
                          ? e.totale.toLocaleString("it-IT", {
                            minimumFractionDigits: 2,
                          }) + " €"
                          : "—",
                      r =
                        e.articoli ||
                        (e.orderSummary
                          ? e.orderSummary
                            .replace(/<[^>]+>/g, " ")
                            .replace(/\s+/g, " ")
                            .trim()
                          : "") ||
                        "—",
                      c = Array.isArray(e._campiDisponibili)
                        ? e._campiDisponibili.join(", ")
                        : "",
                      s = c
                        ? `<span title="Campi Cognito disponibili:\n${c}" style="cursor:help;opacity:.4;font-size:11px;margin-left:4px;">ℹ</span>`
                        : "";
                    return `<tr>\n                <td style="font-weight:600;">${Utils.escapeHtml(e.nomeCliente || "—")}${s}</td>\n                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${Utils.escapeHtml(r)}">\n                    ${Utils.escapeHtml(r.substring(0, 70))}${r.length > 70 ? "…" : ""}\n                </td>\n                <td style="font-weight:700;">${o}</td>\n                <td>${i}</td>\n                <td>${n}</td>\n                <td>\n                    <select class="ec-stato-select" data-order-id="${Utils.escapeHtml(String(e.id))}">\n                        <option value="" ${t ? "" : "selected"}>— Imposta Stato</option>\n                        <option value="pagato" ${"pagato" === t ? "selected" : ""}>🟢 Pagato</option>\n                        <option value="non pagato" ${"non pagato" === t ? "selected" : ""}>🔴 Non Pagato</option>\n                        <option value="consegnato" ${"consegnato" === t ? "selected" : ""}>🔵 Consegnato</option>\n                    </select>\n                </td>\n            </tr>`;
                  })
                  .join(""),
              c = () => {
                const n = o(),
                  i = t.querySelector("#ec-orders-tbody");
                (i &&
                  (i.innerHTML =
                    0 === n.length
                      ? '<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.5;">Nessun ordine trovato</td></tr>'
                      : r(n)),
                  t.querySelectorAll(".ec-stato-select").forEach((t) => {
                    t.addEventListener(
                      "change",
                      async () => {
                        const e = t.dataset.orderId,
                          n = t.value;
                        if (n)
                          try {
                            await Store.api("updateOrderStatus", "ecommerce", {
                              id: e,
                              stato: n,
                            });
                            const t = a.find((t) => String(t.id) === String(e));
                            (t && (t.statoInterno = n),
                              UI.toast(
                                "Stato aggiornato nel server",
                                "success",
                                2e3,
                              ),
                              c());
                          } catch (e) {
                            UI.toast(e.message, "error");
                          }
                      },
                      { signal: e.signal },
                    );
                  }));
              };
            ((t.innerHTML = `\n        <div class="ec-orders-toolbar">\n            <div class="ec-filter-bar">\n                <button class="ec-filter-btn active" data-filter="all" type="button">Tutti (${a.length})</button>\n                <button class="ec-filter-btn" data-filter="pagato" type="button">🟢 Pagati</button>\n                <button class="ec-filter-btn" data-filter="non pagato" type="button">🔴 Non Pagati</button>\n                <button class="ec-filter-btn" data-filter="consegnato" type="button">🔵 Consegnati</button>\n            </div>\n            <button class="ec-btn ec-btn-ghost" id="ec-orders-refresh" type="button" style="margin-left:auto;">\n                <i class="ph ph-arrows-clockwise"></i> Aggiorna\n            </button>\n            <span class="ec-last-update" id="ec-last-update">${n ? "Ultimo aggiornamento: " + n.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : ""}</span>\n        </div>\n\n        <div class="ec-table-wrap">\n            <table class="ec-table">\n                <thead>\n                    <tr>\n                        <th>Cliente</th>\n                        <th>Articoli</th>\n                        <th>Totale</th>\n                        <th>Data</th>\n                        <th>Stato</th>\n                        <th>Cambia Stato</th>\n                    </tr>\n                </thead>\n                <tbody id="ec-orders-tbody">\n                    ${0 === a.length ? '<tr><td colspan="6" style="text-align:center;padding:40px;opacity:.5;">Nessun ordine trovato</td></tr>' : r(a)}\n                </tbody>\n            </table>\n        </div>`),
              t.querySelectorAll(".ec-filter-btn").forEach((n) => {
                n.addEventListener(
                  "click",
                  () => {
                    (t
                      .querySelectorAll(".ec-filter-btn")
                      .forEach((e) => e.classList.remove("active")),
                      n.classList.add("active"),
                      (i = n.dataset.filter),
                      c());
                  },
                  { signal: e.signal },
                );
              }),
              document.getElementById("ec-orders-refresh").addEventListener(
                "click",
                async (e) => {
                  const t = e.currentTarget;
                  ((t.disabled = !0),
                    (t.innerHTML =
                      '<i class="ph ph-spinner ph-spin"></i> Sincronizzazione...'));
                  try {
                    const e = await Store.api("syncOrders", "ecommerce");
                    (UI.toast(
                      e?.message || "Sincronizzazione completata",
                      "success",
                    ),
                      Store.invalidate("getOrders"),
                      await d());
                  } catch (e) {
                    (UI.toast(e.message, "error"),
                      (t.disabled = !1),
                      (t.innerHTML =
                        '<i class="ph ph-arrows-clockwise"></i> Aggiorna'));
                  }
                },
                { signal: e.signal },
              ),
              c());
          })(t, a));
        const i = document.getElementById("ec-badge");
        i && (i.textContent = `${a.length} Ordini`);
      } catch (e) {
        t.innerHTML = `<div class="ec-empty">\n                <i class="ph ph-warning-circle"></i>\n                <p>Errore caricamento ordini: ${Utils.escapeHtml(e.message)}</p>\n            </div>`;
      }
    }
  }
  return {
    destroy() {
      e.abort();
    },
    async init() {
      (e.abort(), (e = new AbortController()));
      const a =
        "undefined" != typeof Router
          ? Router.getCurrentRoute()
          : "ecommerce-articles";
      ((t = "ecommerce-orders" === a ? "orders" : "articles"),
        (n = null),
        (document.getElementById("page-title").textContent = "eCommerce"),
        (document.getElementById("page-subtitle").textContent =
          "orders" === t
            ? "Gestione ordini negozio"
            : "Gestione articoli negozio"),
        (function () {
          const n = document.getElementById("app");
          if (!n) return;
          n.innerHTML = `\n        <style>\n        .ec-page { padding: 24px; max-width: 1400px; margin: 0 auto; animation: ecFadeIn .4s ease; }\n        @keyframes ecFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\n\n        /* Header */\n        .ec-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }\n        .ec-header h1 { font-size: 1.8rem; font-weight: 700;\n            background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n        .ec-header-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;\n            background: rgba(99,102,241,0.15); color: #818cf8; }\n\n        /* Removed Sub-tabs */\n\n        /* Action btn */\n        .ec-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;\n            border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s ease;\n            border: 1px solid; }\n        .ec-btn-primary { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818cf8; }\n        .ec-btn-primary:hover { background: rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.7); transform: translateY(-1px); }\n        .ec-btn-success { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.4); color: #10b981; }\n        .ec-btn-success:hover { background: rgba(16,185,129,0.22); border-color: rgba(16,185,129,0.7); transform: translateY(-1px); }\n        .ec-btn-danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }\n        .ec-btn-danger:hover { background: rgba(239,68,68,0.18); transform: translateY(-1px); }\n        .ec-btn-ghost { background: transparent; border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }\n        .ec-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }\n\n        /* Import Banner */\n        .ec-import-banner { display: flex; align-items: center; gap: 20px; flex-wrap: wrap;\n            padding: 24px 28px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25);\n            border-radius: 16px; margin-bottom: 28px; }\n        .ec-import-banner-icon { font-size: 36px; flex-shrink: 0; }\n        .ec-import-banner h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 4px; }\n        .ec-import-banner p { font-size: 13px; opacity: .65; margin: 0; }\n\n        /* Products grid */\n        .ec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }\n        \n        .ec-card { \n            position: relative;\n            background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%); \n            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);\n            border: 1px solid rgba(255,255,255,0.1);\n            border-radius: 20px; overflow: hidden; \n            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); \n        }\n        .ec-card::before {\n            content: ""; position: absolute; inset: 0; pointer-events: none;\n            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%);\n            opacity: 0; transition: opacity 0.4s ease; z-index: 2;\n        }\n        .ec-card:hover { \n            transform: translateY(-8px) scale(1.02); \n            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.15) inset; \n            border-color: rgba(99,102,241,0.4); \n        }\n        .ec-card:hover::before { opacity: 1; }\n\n        .ec-card-img-wrapper {\n            position: relative; width: 100%; height: 210px; display: flex; align-items: center; justify-content: center;\n            background: radial-gradient(circle at top, rgba(99,102,241,0.12) 0%, transparent 70%);\n            overflow: hidden; padding: 24px;\n        }\n        .ec-card-img { \n            width: 100%; height: 100%; object-fit: contain; \n            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)) saturate(1.2); \n            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); \n            z-index: 10; \n        }\n        .ec-card:hover .ec-card-img {\n            transform: scale(1.15) translateY(-5px) rotate(2.5deg);\n            filter: drop-shadow(0 15px 25px rgba(99,102,241,0.4)) saturate(1.4) contrast(1.1);\n        }\n        .ec-card-img-placeholder { \n            width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;\n            background: rgba(255,255,255,0.02); font-size: 56px; color: rgba(255,255,255,0.1); \n            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);\n        }\n        .ec-card:hover .ec-card-img-placeholder { transform: scale(1.1) rotate(2.5deg); color: rgba(99,102,241,0.3); }\n\n        .ec-card-body { padding: 18px 20px 20px; position: relative; z-index: 10; }\n        .ec-card-cat { font-size: 11px; opacity: .6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 700; color: #a78bfa; }\n        .ec-card-name { font-size: 16px; font-weight: 800; margin-bottom: 8px; line-height: 1.3;\n            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }\n        .ec-card-price { font-size: 1.4rem; font-weight: 900; \n            background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%); \n            -webkit-background-clip: text; -webkit-text-fill-color: transparent; \n            display: inline-block; }\n        .ec-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.1); }\n        .ec-badge-disponibile { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;\n            background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; box-shadow: 0 2px 8px rgba(16,185,129,0.1); }\n        .ec-badge-non-disponibile { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700;\n            background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }\n        .ec-card-actions { display: flex; gap: 8px; }\n        .ec-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);\n            background: rgba(255,255,255,0.04); cursor: pointer; display: flex; align-items: center;\n            justify-content: center; font-size: 14px; transition: all .15s; }\n        .ec-icon-btn:hover { background: rgba(255,255,255,0.09); transform: scale(1.1); }\n\n        /* Toolbar (search + add btn) */\n        .ec-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }\n        .ec-search { flex: 1; min-width: 200px; max-width: 340px; position: relative; }\n        .ec-search input { width: 100%; padding: 9px 12px 9px 36px; background: rgba(255,255,255,0.05);\n            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: inherit; font-size: 14px; }\n        .ec-search input:focus { outline: none; border-color: rgba(99,102,241,0.5); }\n        .ec-search i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%);\n            font-size: 16px; opacity: .5; pointer-events: none; }\n        .ec-filter-cat { padding: 9px 12px; background: rgba(255,255,255,0.05);\n            border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: inherit; font-size: 14px; }\n        .ec-filter-cat:focus { outline: none; border-color: rgba(99,102,241,0.5); }\n\n        /* Empty state */\n        .ec-empty { padding: 64px 24px; text-align: center; opacity: .55; }\n        .ec-empty i { font-size: 48px; display: block; margin-bottom: 16px; }\n        .ec-empty p { font-size: 15px; }\n\n        /* Form modal */\n        .ec-form { display: flex; flex-direction: column; gap: 14px; }\n        .ec-form label { font-size: 12px; font-weight: 600; text-transform: uppercase;\n            letter-spacing: .5px; opacity: .65; display: block; margin-bottom: 4px; }\n        .ec-form input[type=text], .ec-form input[type=number], .ec-form textarea, .ec-form select {\n            width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.06);\n            border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;\n            color: inherit; font-size: 14px; }\n        .ec-form textarea { resize: vertical; min-height: 80px; }\n        .ec-form input:focus, .ec-form textarea:focus, .ec-form select:focus\n            { outline: none; border-color: rgba(99,102,241,0.5); }\n        .ec-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n        .ec-img-preview { width: 100%; max-height: 180px; object-fit: contain;\n            border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); margin-top: 8px; display: none; }\n        .ec-toggle { display: flex; align-items: center; gap: 10px; }\n        .ec-toggle input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; accent-color: #818cf8; }\n\n        /* Import Wizard */\n        .ec-wizard { max-width: 720px; }\n        .ec-wizard-step { font-size: 12px; opacity: .5; text-transform: uppercase;\n            letter-spacing: 1px; margin-bottom: 8px; }\n        .ec-wizard h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }\n        .ec-progress { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; margin: 16px 0; overflow: hidden; }\n        .ec-progress-bar { height: 100%; background: linear-gradient(90deg, #6366f1, #a78bfa);\n            border-radius: 4px; transition: width .3s ease; }\n        .ec-product-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr));\n            gap: 12px; max-height: 360px; overflow-y: auto; margin: 16px 0; padding-right: 4px; }\n        .ec-product-preview-item { background: rgba(255,255,255,0.04); border-radius: 10px;\n            padding: 10px; text-align: center; border: 1px solid rgba(255,255,255,0.07); }\n        .ec-product-preview-img { width: 100%; height: 100px; object-fit: contain; padding: 6px; border-radius: 8px;\n            background: transparent; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) saturate(1.2) contrast(1.1); }\n        .ec-product-preview-name { font-size: 12px; font-weight: 600; overflow: hidden;\n            text-overflow: ellipsis; white-space: nowrap; }\n        .ec-product-preview-price { font-size: 13px; color: #818cf8; font-weight: 700; }\n        .ec-wizard-note { font-size: 13px; opacity: .6; line-height: 1.7; }\n        .ec-cors-warning { padding: 14px 18px; background: rgba(245,158,11,0.08);\n            border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; font-size: 13px; margin: 16px 0; }\n        .ec-cors-warning strong { color: #f59e0b; }\n\n        /* Orders table */\n        .ec-orders-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }\n        .ec-filter-bar { display: flex; gap: 4px; background: rgba(255,255,255,0.04);\n            border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 4px; }\n        .ec-filter-btn { padding: 6px 14px; border: none; background: none; border-radius: 6px;\n            cursor: pointer; font-size: 13px; color: inherit; opacity: .6; transition: all .15s; }\n        .ec-filter-btn.active { background: rgba(99,102,241,0.15); color: #818cf8; opacity: 1; font-weight: 600; }\n        .ec-table-wrap { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);\n            border-radius: 16px; overflow: hidden; }\n        .ec-table { width: 100%; border-collapse: collapse; font-size: 13px; }\n        .ec-table thead th { padding: 11px 14px; text-align: left; font-weight: 600;\n            text-transform: uppercase; font-size: 11px; letter-spacing: .5px;\n            opacity: .5; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }\n        .ec-table tbody td { padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }\n        .ec-table tbody tr:last-child td { border-bottom: none; }\n        .ec-table tbody tr:hover { background: rgba(255,255,255,0.03); }\n        .ec-table tbody tr:hover { background: rgba(255,255,255,0.03); }\n        .ec-badge-pagato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;\n            border-radius: 8px; font-size: 12px; font-weight: 600;\n            background: rgba(16,185,129,0.12); color: #10b981; }\n        .ec-badge-nonpagato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;\n            border-radius: 8px; font-size: 12px; font-weight: 600;\n            background: rgba(239,68,68,0.12); color: #ef4444; }\n        .ec-badge-consegnato { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;\n            border-radius: 8px; font-size: 12px; font-weight: 600;\n            background: rgba(59,130,246,0.12); color: #3b82f6; }\n        .ec-badge-pending { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px;\n            border-radius: 8px; font-size: 12px; font-weight: 600;\n            background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); }\n        .ec-stato-select { padding: 5px 10px; background: rgba(255,255,255,0.06);\n            border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;\n            color: inherit; font-size: 12px; cursor: pointer; }\n        .ec-stato-select:focus { outline: none; border-color: rgba(99,102,241,0.5); }\n        .ec-last-update { font-size: 12px; opacity: .5; margin-left: auto; }\n        .ec-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);\n            border-top-color: #818cf8; border-radius: 50%; animation: ecSpin .7s linear infinite; display: inline-block; }\n        @keyframes ecSpin { to { transform: rotate(360deg); } }\n\n        @media (max-width: 768px) {\n            .ec-page { padding: 12px; }\n            .ec-grid { grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; }\n            .ec-form-row { grid-template-columns: 1fr; }\n            .ec-header h1 { font-size: 1.4rem; }\n        }\n    </style>\n        <div class="ec-page">\n            <div class="ec-header">\n                <h1><i class="ph ph-shopping-cart" style="font-size:28px;-webkit-text-fill-color:#818cf8;"></i> eCommerce</h1>\n                <span class="ec-header-badge" id="ec-badge">—</span>\n            </div>\n\n            \x3c!-- Sub-tabs removed --\x3e\n\n            \x3c!-- Content panels --\x3e\n            <div id="ec-panel-articles" style="${"articles" === t ? "" : "display:none;"}"></div>\n            <div id="ec-panel-orders" style="${"orders" === t ? "" : "display:none;"}"></div>\n        </div>\n        `;
          const a = document.getElementById("ec-tab-articles"),
            o = document.getElementById("ec-tab-orders");
          (a &&
            a.addEventListener(
              "click",
              () => Router.navigate("ecommerce-articles"),
              { signal: e.signal },
            ),
            o &&
            o.addEventListener(
              "click",
              () => Router.navigate("ecommerce-orders"),
              { signal: e.signal },
            ),
            "articles" === t ? i() : d());
        })());
    },
  };
})();
window.Ecommerce = Ecommerce;
