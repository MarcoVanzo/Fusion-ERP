"use strict";
const WhatsApp = (() => {
  let t = new AbortController(),
    e = [],
    n = null,
    a = [],
    s = null,
    i = "inbox";
  function o(t) {
    if (!t) return;
    if (0 === a.length)
      return void (t.innerHTML =
        '<div class="wa-no-messages"><i class="ph ph-chat-circle-dots"></i><p>Nessun messaggio</p></div>');
    let e = "";
    t.innerHTML = a
      .map((t) => {
        const n = "me" === t.from_phone,
          a = new Date(t.timestamp ? 1e3 * t.timestamp : t.created_at),
          s = a.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
          i = a.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          });
        let o = "";
        s !== e &&
          ((e = s),
            (o = `<div class="wa-date-sep"><span>${Utils.escapeHtml(s)}</span></div>`));
        const c = n ? "wa-bubble-out" : "wa-bubble-in",
          l =
            "read" === t.status
              ? '<i class="ph ph-checks" style="color:#53bdeb;"></i>'
              : "replied" === t.status
                ? '<i class="ph ph-check-fat"></i>'
                : "";
        return `${o}\n            <div class="wa-msg ${n ? "out" : "in"}">\n                <div class="${c}">\n                    <span class="wa-msg-text">${Utils.escapeHtml(t.body || "")}</span>\n                    <span class="wa-msg-meta">${i} ${n ? l : ""}</span>\n                </div>\n            </div>`;
      })
      .join("");
  }
  async function c(i) {
    ((n = i), l());
    const c = e.find((t) => t.from_phone === i),
      d = document.getElementById("wa-main");
    if (!d) return;
    ((d.innerHTML = (function (t) {
      const e = t?.display_name || r(t?.from_phone || n) || "Sconosciuto";
      return `\n        <div class="wa-chat-area">\n            <div class="wa-chat-header">\n                <div class="wa-avatar sm">${e
        .split(" ")
        .map((t) => t[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}</div>\n                <div class="wa-chat-header-info">\n                    <span class="wa-chat-name">${Utils.escapeHtml(e)}</span>\n                    <span class="wa-chat-phone">${r(n)}</span>\n                </div>\n            </div>\n            <div class="wa-messages" id="wa-messages">\n                <div class="wa-loading-msgs">\n                    <i class="ph ph-circle-notch ph-spin"></i>\n                </div>\n            </div>\n            <div class="wa-input-area">\n                <form id="wa-send-form" class="wa-send-form">\n                    <textarea id="wa-input" class="wa-text-input" rows="1"\n                        placeholder="Scrivi un messaggio..." maxlength="4096"></textarea>\n                    <button type="submit" class="wa-send-btn" id="wa-send-btn">\n                        <i class="ph ph-paper-plane-right"></i>\n                    </button>\n                </form>\n            </div>\n        </div>`;
    })(c)),
      document.querySelectorAll(".wa-conv-item").forEach((t) => {
        t.classList.toggle("active", t.dataset.phone === i);
      }),
      document.getElementById("wa-send-form")?.addEventListener(
        "submit",
        async (t) => {
          (t.preventDefault(),
            await (async function () {
              const t = document.getElementById("wa-input"),
                e = document.getElementById("wa-send-btn");
              if (!t || !n) return;
              const s = t.value.trim();
              if (s) {
                ((t.disabled = !0),
                  (e.disabled = !0),
                  (e.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i>'));
                try {
                  const e = await Store.api("reply", "whatsapp", {
                    to_phone: n,
                    text: s,
                  });
                  a.push({
                    id: e.id,
                    from_phone: "me",
                    body: s,
                    timestamp: e.ts,
                    status: "read",
                    created_at: new Date().toISOString(),
                  });
                  const i = document.getElementById("wa-messages");
                  (o(i), p(i), (t.value = ""), (t.style.height = "auto"));
                } catch (t) {
                  UI.toast(t.message || "Errore invio messaggio", "error");
                } finally {
                  ((t.disabled = !1),
                    (e.disabled = !1),
                    (e.innerHTML = '<i class="ph ph-paper-plane-right"></i>'),
                    t.focus());
                }
              }
            })());
        },
        { signal: t.signal },
      ));
    const m = document.getElementById("wa-input");
    (m?.addEventListener(
      "input",
      () => {
        ((m.style.height = "auto"),
          (m.style.height = Math.min(m.scrollHeight, 120) + "px"));
      },
      { signal: t.signal },
    ),
      await (async function (t) {
        const e = document.getElementById("wa-messages");
        if (e)
          try {
            const n = await Store.get("getMessages", "whatsapp", {
              from_phone: t,
            });
            ((a = n?.messages || []), o(e), p(e));
            const s = document.querySelector(`[data-phone="${CSS.escape(t)}"]`);
            s &&
              (s.classList.remove("has-unread"),
                s.querySelector(".wa-unread-badge")?.remove());
          } catch (t) {
            e.innerHTML = `<p style="text-align:center;color:var(--color-danger);">${Utils.escapeHtml(t.message)}</p>`;
          }
      })(i),
      (function (tPhone) {
        l();
        if (n !== tPhone) return;
        let pRate = 5000;
        let myS = { active: !0, id: 0 };
        s = myS;
        const pFn = async () => {
          if (n !== tPhone || !myS.active) return;
          try {
            const getE = await Store.get("getMessages", "whatsapp", {
              from_phone: tPhone,
            }, { signal: t.signal }),
              msgs = getE?.messages || [];
            if (msgs.length > a.length) {
              a = msgs;
              const ct = document.getElementById("wa-messages"),
                ce = (function (el) {
                  return (
                    !el || el.scrollHeight - el.scrollTop - el.clientHeight < 60
                  );
                })(ct);
              (o(ct), ce && p(ct));
              pRate = 5000;
            } else {
              pRate = Math.min(pRate * 1.5, 60000);
            }
          } catch {
            pRate = Math.min(pRate * 1.5, 60000);
          }
          if (n === tPhone && myS.active && !t.signal.aborted) myS.id = setTimeout(pFn, pRate);
        };
        myS.id = setTimeout(pFn, pRate);
      })(i));
  }
  function l() {
    s && (clearTimeout(s.id || s), s.active = !1, (s = null));
  }
  function r(t) {
    if (!t || "me" === t) return "";
    const e = String(t);
    if (e.startsWith("39") && e.length >= 11) {
      const t = e.slice(2);
      return "+39 " + t.slice(0, 3) + " " + t.slice(3, 6) + " " + t.slice(6);
    }
    return "+" + e;
  }
  function p(t) {
    t &&
      requestAnimationFrame(() => {
        t.scrollTop = t.scrollHeight;
      });
  }
  return {
    init: async function s() {
      ((t = new AbortController()), (e = []), (n = null), (a = []), l());
      const o = Router.getCurrentRoute();
      i = "whatsapp-contacts" === o ? "contacts" : "inbox";
      const p = document.getElementById("app");
      p &&
        ((p.innerHTML = UI.skeletonPage()),
          "contacts" === i
            ? await (async function (e) {
              try {
                const n = await Store.get("getContacts", "whatsapp");
                !(function (e, n) {
                  ((e.innerHTML = `\n        <div class="wa-contacts-page">\n            <div class="page-header" style="padding:var(--sp-4) var(--sp-4) 0;">\n                <div class="page-header-title">\n                    <i class="ph ph-address-book" style="color:var(--color-primary);"></i>\n                    <h2>Rubrica Contatti</h2>\n                </div>\n                <button class="btn btn-primary" id="btn-import-vcf" type="button">\n                    <i class="ph ph-upload-simple"></i> Importa da iPhone (.vcf)\n                </button>\n                <input type="file" id="vcf-file-input" accept=".vcf,.vcard" style="display:none;">\n            </div>\n            <div style="padding:var(--sp-4);">\n                ${0 === n.length
                    ? Utils.emptyState(
                      "Nessun contatto",
                      "Importa i contatti dal tuo iPhone.",
                      null,
                      null,
                      null,
                    )
                    : `<div class="wa-contacts-grid">\n                        ${n
                      .map((t) =>
                        (function (t) {
                          const e = t.name
                            .split(" ")
                            .map((t) => t[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase(),
                            n = t.athlete_name
                              ? `<span class="wa-contact-tag"><i class="ph ph-user"></i> ${Utils.escapeHtml(t.athlete_name.trim())}</span>`
                              : `<button class="btn btn-ghost btn-xs btn-link-athlete" data-contact-id="${Utils.escapeHtml(t.id)}" type="button">\n                   <i class="ph ph-link"></i> Collega atleta\n               </button>`;
                          return `\n        <div class="wa-contact-card">\n            <div class="wa-avatar md">${Utils.escapeHtml(e)}</div>\n            <div class="wa-contact-info">\n                <span class="wa-contact-name">${Utils.escapeHtml(t.name)}</span>\n                <span class="wa-contact-phone">${Utils.escapeHtml(r(t.phone_normalized))}</span>\n                ${n}\n            </div>\n        </div>`;
                        })(t),
                      )
                      .join("")}\n                       </div>`
                    }\n            </div>\n        </div>`),
                    (function (e) {
                      (e.querySelector("#btn-import-vcf")?.addEventListener(
                        "click",
                        () => {
                          e.querySelector("#vcf-file-input")?.click();
                        },
                        { signal: t.signal },
                      ),
                        e.querySelector("#vcf-file-input")?.addEventListener(
                          "change",
                          async (t) => {
                            const e = t.target.files?.[0];
                            e &&
                              (await (async function (t) {
                                const e = new FormData();
                                (e.append("vcf", t),
                                  UI.toast("Analisi file in corso...", "info"));
                                try {
                                  const t = await fetch(
                                    "api/?module=whatsapp&action=importContacts&preview=1",
                                    {
                                      method: "POST",
                                      body: e,
                                      credentials: "same-origin",
                                    },
                                  );
                                  if (!t.ok) throw new Error("Errore upload");
                                  !(function (t) {
                                    if (0 === t.length)
                                      return void UI.toast(
                                        "Nessun contatto trovato nel file",
                                        "warning",
                                      );
                                    const e = document.createElement("div");
                                    e.innerHTML = `\n        <p style="margin-bottom:var(--sp-2);color:var(--text-muted);font-size:13px;">\n            Trovati <strong>${t.length}</strong> numeri. Seleziona quelli da importare:\n        </p>\n        <div style="margin-bottom:var(--sp-2);display:flex;gap:8px;">\n            <button class="btn btn-ghost btn-sm" id="sel-all">Seleziona tutto</button>\n            <button class="btn btn-ghost btn-sm" id="sel-none">Deseleziona</button>\n        </div>\n        <div style="max-height:380px;overflow-y:auto;">\n            <table class="data-table" style="font-size:13px;">\n                <thead><tr>\n                    <th style="width:32px;"></th>\n                    <th>Nome</th><th>Numero</th><th>Match Atleta</th>\n                </tr></thead>\n                <tbody>\n                    ${t.map((t, e) => `\n                    <tr>\n                        <td><input type="checkbox" class="contact-check" data-idx="${e}" checked></td>\n                        <td>${Utils.escapeHtml(t.name)}</td>\n                        <td>${Utils.escapeHtml(r(t.phone_normalized))}</td>\n                        <td>${t.athlete_match ? `<span class="badge badge-success"><i class="ph ph-check"></i> ${Utils.escapeHtml(t.athlete_match.name)}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>\n                    </tr>`).join("")}\n                </tbody>\n            </table>\n        </div>\n        <div style="margin-top:var(--sp-3);display:flex;justify-content:flex-end;gap:8px;">\n            <button class="btn btn-ghost" id="btn-cancel-import">Annulla</button>\n            <button class="btn btn-primary" id="btn-confirm-import">\n                <i class="ph ph-download-simple"></i> Importa selezionati\n            </button>\n        </div>`;
                                    const n = UI.modal({
                                      title: "📱 Importa contatti iPhone",
                                      body: e,
                                      size: "lg",
                                    });
                                    (e
                                      .querySelector("#sel-all")
                                      ?.addEventListener("click", () => {
                                        e.querySelectorAll(
                                          ".contact-check",
                                        ).forEach((t) => (t.checked = !0));
                                      }),
                                      e
                                        .querySelector("#sel-none")
                                        ?.addEventListener("click", () => {
                                          e.querySelectorAll(
                                            ".contact-check",
                                          ).forEach((t) => (t.checked = !1));
                                        }),
                                      e
                                        .querySelector("#btn-cancel-import")
                                        ?.addEventListener("click", () =>
                                          n.close(),
                                        ),
                                      e
                                        .querySelector("#btn-confirm-import")
                                        ?.addEventListener(
                                          "click",
                                          async () => {
                                            const a = [];
                                            if (
                                              (e
                                                .querySelectorAll(
                                                  ".contact-check:checked",
                                                )
                                                .forEach((e) => {
                                                  a.push({
                                                    ...t[
                                                    parseInt(e.dataset.idx)
                                                    ],
                                                  });
                                                }),
                                                0 === a.length)
                                            )
                                              return void UI.toast(
                                                "Nessun contatto selezionato",
                                                "warning",
                                              );
                                            const i = e.querySelector(
                                              "#btn-confirm-import",
                                            );
                                            ((i.disabled = !0),
                                              (i.innerHTML =
                                                '<i class="ph ph-circle-notch ph-spin"></i> Importazione...'));
                                            try {
                                              const t = await Store.api(
                                                "importContacts",
                                                "whatsapp",
                                                { contacts: a },
                                              );
                                              (UI.toast(
                                                `Importati ${t.imported} contatti!`,
                                                "success",
                                              ),
                                                n.close(),
                                                await s());
                                            } catch (t) {
                                              (UI.toast(
                                                t.message ||
                                                "Errore importazione",
                                                "error",
                                              ),
                                                (i.disabled = !1),
                                                (i.innerHTML =
                                                  '<i class="ph ph-download-simple"></i> Importa selezionati'));
                                            }
                                          },
                                        ));
                                  })((await t.json()).preview || []);
                                } catch (t) {
                                  UI.toast(
                                    "Errore nel parsing del file .vcf",
                                    "error",
                                  );
                                }
                              })(e));
                          },
                          { signal: t.signal },
                        ),
                        e.addEventListener(
                          "click",
                          (t) => {
                            const e = t.target.closest(".btn-link-athlete");
                            e &&
                              (async function (t) {
                                try {
                                  const e = await Store.get("list", "athletes"),
                                    n = e?.athletes || e || [],
                                    a = document.createElement("div");
                                  a.innerHTML = `\n            <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--sp-2);">\n                Seleziona l'atleta da collegare a questo contatto:\n            </p>\n            <select class="form-input" id="athlete-select" style="margin-bottom:var(--sp-3);">\n                <option value="">— Nessuno (scollega) —</option>\n                ${n.map((t) => `<option value="${Utils.escapeHtml(t.id)}">${Utils.escapeHtml(((t.first_name || "") + " " + (t.last_name || "")).trim())}</option>`).join("")}\n            </select>\n            <div style="display:flex;justify-content:flex-end;gap:8px;">\n                <button class="btn btn-ghost" id="btn-cancel-link">Annulla</button>\n                <button class="btn btn-primary" id="btn-confirm-link">\n                    <i class="ph ph-link"></i> Collega\n                </button>\n            </div>`;
                                  const i = UI.modal({
                                    title: "Collega a un atleta",
                                    body: a,
                                  });
                                  (a
                                    .querySelector("#btn-cancel-link")
                                    ?.addEventListener("click", () =>
                                      i.close(),
                                    ),
                                    a
                                      .querySelector("#btn-confirm-link")
                                      ?.addEventListener("click", async () => {
                                        const e =
                                          a.querySelector("#athlete-select")
                                            .value || null;
                                        try {
                                          (await Store.api(
                                            "linkContact",
                                            "whatsapp",
                                            { contact_id: t, athlete_id: e },
                                          ),
                                            UI.toast(
                                              "Contatto aggiornato!",
                                              "success",
                                            ),
                                            i.close(),
                                            await s());
                                        } catch (t) {
                                          UI.toast(t.message, "error");
                                        }
                                      }));
                                } catch (t) {
                                  UI.toast(
                                    "Errore caricamento atleti",
                                    "error",
                                  );
                                }
                              })(e.dataset.contactId);
                          },
                          { signal: t.signal },
                        ));
                    })(e));
                })(e, n?.contacts || []);
              } catch (t) {
                e.innerHTML = Utils.emptyState(
                  "Errore caricamento contatti",
                  t.message,
                  "Riprova",
                  null,
                  () => s(),
                );
              }
            })(p)
            : await (async function (a) {
              try {
                const s = await Store.get("getConversations", "whatsapp");
                ((e = s?.conversations || []),
                  (function (a) {
                    ((a.innerHTML = `\n        <div class="wa-page">\n            <div class="wa-sidebar">\n                <div class="wa-sidebar-header">\n                    <div class="wa-sidebar-title">\n                        <i class="ph ph-whatsapp-logo" style="color:#25D366;font-size:22px;"></i>\n                        <h2>WhatsApp</h2>\n                    </div>\n                    <span class="wa-sidebar-sub">Inbox messaggi</span>\n                </div>\n                <div class="wa-conv-list" id="wa-conv-list">\n                    ${0 === e.length
                      ? '<div class="wa-empty-list">\n                               <i class="ph ph-chat-circle-dots" style="font-size:36px;opacity:.2;"></i>\n                               <p>Nessun messaggio ricevuto</p>\n                           </div>'
                      : e
                        .map((t) =>
                          (function (t) {
                            const e = n === t.from_phone,
                              a = parseInt(t.unread_count) || 0,
                              s = t.display_name || r(t.from_phone),
                              i = t.last_body
                                ? t.last_body.length > 42
                                  ? t.last_body.slice(0, 42) + "…"
                                  : t.last_body
                                : "",
                              o = t.last_message_at
                                ? new Date(
                                  t.last_message_at,
                                ).toLocaleTimeString("it-IT", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "",
                              c = s
                                .split(" ")
                                .map((t) => t[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            return `\n        <div class="wa-conv-item ${e ? "active" : ""} ${a > 0 ? "has-unread" : ""}"\n             data-phone="${Utils.escapeHtml(t.from_phone)}" role="button" tabindex="0">\n            <div class="wa-avatar">${Utils.escapeHtml(c)}</div>\n            <div class="wa-conv-info">\n                <span class="wa-conv-name">${Utils.escapeHtml(s)}</span>\n                <span class="wa-conv-preview">${Utils.escapeHtml(i)}</span>\n            </div>\n            <div class="wa-conv-meta">\n                <span class="wa-conv-time">${o}</span>\n                ${a > 0 ? `<span class="wa-unread-badge">${a}</span>` : ""}\n            </div>\n        </div>`;
                          })(t),
                        )
                        .join("")
                      }\n                </div>\n            </div>\n            <div class="wa-main" id="wa-main">\n                \n        <div class="wa-no-conv">\n            <i class="ph ph-whatsapp-logo" style="font-size:72px;opacity:.1;color:#25D366;"></i>\n            <p style="color:var(--text-muted);margin-top:16px;font-size:15px;">Seleziona una conversazione</p>\n        </div>\n            </div>\n        </div>`),
                      (function (e) {
                        (e.querySelector("#wa-conv-list")?.addEventListener(
                          "click",
                          (t) => {
                            const e = t.target.closest("[data-phone]");
                            e && c(e.dataset.phone);
                          },
                          { signal: t.signal },
                        ),
                          e.querySelector("#wa-conv-list")?.addEventListener(
                            "keydown",
                            (t) => {
                              if ("Enter" === t.key) {
                                const e = t.target.closest("[data-phone]");
                                e && c(e.dataset.phone);
                              }
                            },
                            { signal: t.signal },
                          ));
                      })(a),
                      !n && e.length > 0 && c(e[0].from_phone));
                  })(a));
              } catch (t) {
                a.innerHTML = Utils.emptyState(
                  "Errore caricamento inbox",
                  t.message,
                  "Riprova",
                  null,
                  () => s(),
                );
              }
            })(p));
    },
    destroy: function () {
      (t.abort(), l(), (e = []), (a = []), (n = null));
    },
  };
})();
window.WhatsApp = WhatsApp;
