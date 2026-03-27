"use strict";
const AdminUsers = (() => {
  let abortController = new AbortController();

  const g = ["admin", "social media manager", "allenatore", "operatore", "atleta"];
  const b = {
    admin: "Admin",
    "social media manager": "Social Media Manager",
    allenatore: "Allenatore",
    operatore: "Operatore",
    atleta: "Atleta"
  };
  const f = {
    admin: "pink",
    "social media manager": "blue",
    allenatore: "green",
    operatore: "muted",
    atleta: "muted"
  };

  async function loadUsers() {
    const e = document.getElementById("admin-content");
    if (!e) return;
    try {
      const n = await Store.get("listUsers", "auth");
      const statusColors = { Attivo: "green", Invitato: "yellow", Disattivato: "red" };
      let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2);">
          <p class="section-label" style="margin:0;">Gestione Utenze</p>
          <button class="btn btn-primary btn-sm" id="new-user-btn" type="button">+ NUOVO UTENTE</button>
        </div>`;

      if (!n || n.length === 0) {
        html += Utils.emptyState("Nessun utente trovato", "Crea il primo utente usando il pulsante in alto.");
      } else {
        const rows = n.map((t) => {
          const status = t.status || (t.is_active == 1 ? "Attivo" : "Disattivato");
          const isActive = status === "Attivo";
          const isInvited = status === "Invitato";
          const lastLogin = t.last_login_at ? Utils.formatDate(t.last_login_at) : '<span style="color:var(--color-text-muted);font-size:11px;">Mai</span>';
          
          let avatar = '';
          if (t.avatar_path) {
            avatar = `<img src="${Utils.escapeHtml(t.avatar_path)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;">`;
          } else {
            const initial = t.full_name ? t.full_name.charAt(0).toUpperCase() : '?';
            avatar = `<div style="width:32px;height:32px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#6366f1;">${Utils.escapeHtml(initial)}</div>`;
          }

          const badgeRole = b[t.role] || t.role;
          const badgeColor = f[t.role] || "muted";
          const badgeStatusColor = statusColors[status] || "muted";

          let actionButtons = `
            <button class="btn btn-ghost btn-sm user-edit-role"
              data-uid="${Utils.escapeHtml(t.id)}"
              data-role="${Utils.escapeHtml(t.role)}"
              data-name="${Utils.escapeHtml(t.full_name)}"
              data-permissions="${Utils.escapeHtml(JSON.stringify(t.permissions_json || {}))}"
              title="Modifica ruolo">✏️ Ruolo</button>
          `;

          if (isInvited) {
            actionButtons += `
              <button class="btn btn-ghost btn-sm user-resend"
                data-uid="${Utils.escapeHtml(t.id)}"
                data-name="${Utils.escapeHtml(t.full_name)}"
                title="Reinvia email di invito"
                style="color:#FFD600;">📧 Reinvia invito</button>`;
          } else {
            actionButtons += `
              <button class="btn btn-ghost btn-sm user-toggle"
                data-uid="${Utils.escapeHtml(t.id)}"
                data-active="${isActive ? "1" : "0"}"
                data-name="${Utils.escapeHtml(t.full_name)}"
                title="${isActive ? "Sospendi" : "Riattiva"}">
                ${isActive ? "🔒 Sospendi" : "✅ Riattiva"}</button>`;
          }

          actionButtons += `
            <button class="btn btn-ghost btn-sm user-reset-pwd"
              data-uid="${Utils.escapeHtml(t.id)}"
              data-name="${Utils.escapeHtml(t.full_name)}"
              title="Reset password">🔑 Reset pw</button>
             <button class="btn btn-ghost btn-sm user-delete"
               data-uid="${Utils.escapeHtml(t.id)}"
               data-name="${Utils.escapeHtml(t.full_name)}"
               title="Elimina utente"
               style="color:#FF00FF;"><img src="assets/cestino.png" alt="Elimina" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-bottom:-4px;"></button>
          `;

          return `
            <tr data-uid="${Utils.escapeHtml(t.id)}">
              <td style="width:40px;padding:6px 4px 6px 12px;">${avatar}</td>
              <td><strong>${Utils.escapeHtml(t.full_name)}</strong></td>
              <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(t.email)}</td>
              <td>${Utils.badge(badgeRole, badgeColor)}</td>
              <td>${Utils.badge(status, badgeStatusColor)}</td>
              <td style="font-size:12px;">${lastLogin}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${actionButtons}
                </div>
              </td>
            </tr>`;
        });
        html += `
          <div class="table-wrapper">
            <table class="table" id="users-table">
              <thead><tr>
                <th></th><th>Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Ultimo accesso</th><th>Azioni</th>
              </tr></thead>
              <tbody>
                ${rows.join("")}
              </tbody>
            </table>
          </div>`;
      }
      e.innerHTML = html;

      // New User
      document.getElementById("new-user-btn")?.addEventListener("click", () => {
        const modal = UI.modal({
          title: "Nuovo Utente",
          body: `
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="nu-name">Nome completo *</label>
                <input id="nu-name" class="form-input" type="text" placeholder="Mario Rossi" autocomplete="name">
              </div>
              <div class="form-group">
                <label class="form-label" for="nu-email">Email *</label>
                <input id="nu-email" class="form-input" type="email" placeholder="mario@esempio.it" autocomplete="email">
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="nu-role">Ruolo *</label>
                <select id="nu-role" class="form-select">
                  ${g.map(role => `<option value="${role}">${b[role]}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="nu-phone">Telefono</label>
                <input id="nu-phone" class="form-input" type="tel" placeholder="+39 333 1234567" autocomplete="tel">
              </div>
            </div>
            <div class="form-group" style="padding:var(--sp-2) var(--sp-3);background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);font-size:12px;color:var(--color-text-muted);">
              ℹ️ Verrà generata automaticamente una password temporanea sicura e inviata via email insieme al link di verifica.
            </div>
            <div id="nu-error" class="form-error hidden"></div>`,
          footer: `
            <button class="btn btn-ghost btn-sm" id="nu-cancel" type="button">Annulla</button>
            <button class="btn btn-primary btn-sm" id="nu-save" type="button">📧 CREA E INVIA INVITO</button>`
        });

        document.getElementById("nu-cancel")?.addEventListener("click", () => modal.close(), { signal: abortController.signal });
        document.getElementById("nu-save")?.addEventListener("click", async () => {
          const name = document.getElementById("nu-name").value.trim();
          const email = document.getElementById("nu-email").value.trim();
          const role = document.getElementById("nu-role").value;
          const phone = document.getElementById("nu-phone").value.trim();
          const errBox = document.getElementById("nu-error");
          const saveBtn = document.getElementById("nu-save");

          errBox.classList.add("hidden");
          if (!name || !email) {
            errBox.textContent = "Compila i campi obbligatori";
            errBox.classList.remove("hidden");
            return;
          }

          saveBtn.disabled = true;
          saveBtn.textContent = "Creazione in corso...";
          try {
            const res = await Store.api("createUser", "auth", {
              full_name: name,
              email: email,
              role: role,
              phone: phone || null
            });
            const msg = res.tempPassword 
              ? `✅ Utente creato!\n\nPassword temporanea: ${res.tempPassword}\n\nComunicala all'utente e invitalo a cambiarla al primo accesso.`
              : `✅ Utente ${name} creato con successo.`;
            alert(msg);
            Store.invalidate("auth");
            await loadUsers();
            modal.close();
          } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove("hidden");
            saveBtn.disabled = false;
            saveBtn.textContent = "📧 CREA E INVIA INVITO";
          }
        }, { signal: abortController.signal });
      }, { signal: abortController.signal });

      // Edit Role
      Utils.qsa(".user-edit-role").forEach(btn => {
        btn.addEventListener("click", async () => {
          let navConfig = [];
          try {
            const navVersion = Router && Router._appVersion ? Router._appVersion : document.querySelector('meta[name="app-version"]')?.content || Date.now();
            const res = await fetch("js/config/navigation.json?v=" + navVersion);
            if (res.ok) navConfig = await res.json();
          } catch (err) {
            console.error("Errore fetch permessi", err);
          }

          let existingPerms = {};
          if (btn.dataset.permissions) {
            try {
              existingPerms = typeof btn.dataset.permissions === "string" ? JSON.parse(btn.dataset.permissions) : btn.dataset.permissions;
            } catch (err) {}
          } else if (btn.dataset.role) {
             const rolePerms = { athletes:"read","athlete-profile":"read","athlete-payments":"read","athlete-metrics":"read","athlete-documents":"read",teams:"read",results:"read","results-matches":"read","results-standings":"read",transport:"read","transport-drivers":"read","transport-fleet":"read",outseason:"read","outseason-camps":"read","outseason-tournaments":"read",tournaments:"read",social:"read","social-analytics":"read","social-gallery":"read",finance:"read",admin:"read","admin-backup":"read","admin-logs":"read",users:"read",utenti:"read",tasks:"read",staff:"read","staff-documents":"read",ecommerce:"read","ecommerce-articles":"read","ecommerce-orders":"read","whatsapp-inbox":"read","whatsapp-contacts":"read",website:"read",newsletter:"read",societa:"read","societa-identita":"read","societa-organigramma":"read","societa-membri":"read","societa-documenti":"read","societa-scadenze":"read","societa-sponsor":"read","societa-titoli":"read",network:"read","network-collaborazioni":"read","network-prove":"read","network-attivita":"read" };
             const roleMap = { admin: { "admin-backup": "write", "admin-logs": "write" }, "social media manager": {}, allenatore: { finance: "none", admin: "none" }, operatore: { finance: "none", admin: "none" }, atleta: { finance: "none", admin: "none", societa: "none", staff: "none" } };
             if (btn.dataset.role === "admin") {
                Object.keys(rolePerms).forEach(k => existingPerms[k] = "write");
             } else {
                Object.keys(rolePerms).forEach(k => existingPerms[k] = rolePerms[k] || "none");
                if (roleMap[btn.dataset.role]) {
                  Object.keys(roleMap[btn.dataset.role]).forEach(k => existingPerms[k] = roleMap[btn.dataset.role][k]);
                }
             }
          }

          let matrixHtml = '<div class="permissions-matrix" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 6px; margin-top: 8px;">';
          matrixHtml += '<table style="width:100%; border-collapse: collapse; font-size: 13px;">';
          matrixHtml += '<thead style="position: sticky; top: 0; background: var(--color-surface); box-shadow: 0 1px 0 var(--color-border); z-index: 1;"><tr><th style="text-align:left; padding: 8px 12px; font-weight: 600;">Modulo / Tab</th><th style="width: 80px; text-align:center; padding: 8px 12px; font-weight: 600;">Lettura</th><th style="width: 80px; text-align:center; padding: 8px 12px; font-weight: 600;">Scrittura</th></tr></thead><tbody>';

          navConfig.forEach((navGroup) => {
            const groupId = navGroup.path || navGroup.id;
            const gPerm = existingPerms[groupId] || "none";
            const gRead = (gPerm === "read" || gPerm === "write") ? "checked" : "";
            const gWrite = gPerm === "write" ? "checked" : "";

            matrixHtml += `
              <tr style="background: var(--color-surface-hover); border-bottom: 1px solid var(--color-border);">
                  <td style="padding: 10px 12px; font-weight: 600;"><i class="ph ph-${navGroup.icon || "folder"}" style="margin-right:6px"></i> ${Utils.escapeHtml(navGroup.title)}</td>
                  <td style="text-align:center; padding: 10px 12px;"><input type="checkbox" class="perm-cb-read perm-group" data-target="${groupId}" ${gRead}></td>
                  <td style="text-align:center; padding: 10px 12px;"><input type="checkbox" class="perm-cb-write perm-group" data-target="${groupId}" ${gWrite}></td>
              </tr>
            `;

            if (navGroup.children && navGroup.children.length > 0) {
              navGroup.children.forEach(child => {
                const childId = child.path;
                const cPerm = existingPerms[childId] || "none";
                const cRead = (cPerm === "read" || cPerm === "write") ? "checked" : "";
                const cWrite = cPerm === "write" ? "checked" : "";
                
                matrixHtml += `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                        <td style="padding: 8px 12px 8px 32px; color: var(--color-text-muted);"><i class="ph ph-arrow-elbow-down-right" style="margin-right:6px"></i> ${Utils.escapeHtml(child.title)}</td>
                        <td style="text-align:center; padding: 8px 12px;"><input type="checkbox" class="perm-cb-read perm-child" data-target="${childId}" data-parent="${groupId}" ${cRead}></td>
                        <td style="text-align:center; padding: 8px 12px;"><input type="checkbox" class="perm-cb-write perm-child" data-target="${childId}" data-parent="${groupId}" ${cWrite}></td>
                    </tr>
                `;
              });
            }
          });
          matrixHtml += "</tbody></table></div>";

          const modal = UI.modal({
            title: `Permessi Utente — ${Utils.escapeHtml(btn.dataset.name)}`,
            body: `
              <div class="form-group">
                <label class="form-label" for="er-role">Ruolo Base</label>
                <select id="er-role" class="form-select">
                  ${g.map(r => `<option value="${r}" ${r === btn.dataset.role ? "selected" : ""}>${b[r]}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                  <label class="form-label">Permessi Specifici (Matrice Tab)</label>
                  ${matrixHtml}
              </div>
              <div id="er-error" class="form-error hidden"></div>`,
            footer: `
              <button class="btn btn-ghost btn-sm" id="er-cancel" type="button">Annulla</button>
              <button class="btn btn-primary btn-sm" id="er-save" type="button">SALVA</button>`
          });

          const modalBody = document.getElementById("er-role").closest(".modal-content");
          if (modalBody) {
             modalBody.querySelectorAll(".perm-cb-write").forEach(cb => {
                cb.addEventListener("change", ev => {
                   if(ev.target.checked) {
                      const readCb = ev.target.closest("tr").querySelector(".perm-cb-read");
                      if(readCb) readCb.checked = true;
                   }
                });
             });
             modalBody.querySelectorAll(".perm-cb-read").forEach(cb => {
                cb.addEventListener("change", ev => {
                    if(!ev.target.checked) {
                        const writeCb = ev.target.closest("tr").querySelector(".perm-cb-write");
                        if(writeCb) writeCb.checked = false;
                    }
                });
             });
             modalBody.querySelectorAll(".perm-group").forEach(cb => {
                 cb.addEventListener("change", ev => {
                     const isRead = ev.target.classList.contains("perm-cb-read");
                     const isChecked = ev.target.checked;
                     modalBody.querySelectorAll('.perm-child[data-parent="'+ev.target.dataset.target+'"]').forEach(child => {
                         if(isRead && child.classList.contains("perm-cb-read")) {
                             child.checked = isChecked;
                             if(!isChecked) {
                                 const w = child.closest("tr").querySelector(".perm-cb-write");
                                 if(w) w.checked = false;
                             }
                         }
                         if(!isRead && child.classList.contains("perm-cb-write")) {
                             child.checked = isChecked;
                             if(isChecked) {
                                 const r = child.closest("tr").querySelector(".perm-cb-read");
                                 if(r) r.checked = true;
                             }
                         }
                     });
                 });
             });
          }

          document.getElementById("er-cancel")?.addEventListener("click", () => modal.close(), { signal: abortController.signal });
          document.getElementById("er-save")?.addEventListener("click", async () => {
             const role = document.getElementById("er-role").value;
             const errBox = document.getElementById("er-error");
             const saveBtn = document.getElementById("er-save");
             const perms = {};
             modalBody.querySelectorAll("tbody tr").forEach(row => {
                 const rCb = row.querySelector(".perm-cb-read");
                 const wCb = row.querySelector(".perm-cb-write");
                 if(rCb && rCb.dataset.target) {
                     const k = rCb.dataset.target;
                     const parent = rCb.dataset.parent;
                     if(wCb && wCb.checked) perms[k] = "write";
                     else if(rCb.checked) perms[k] = "read";
                     
                     if(parent && perms[k]) {
                         if(perms[parent] !== "write") perms[parent] = "read";
                     }
                 }
             });

             saveBtn.disabled = true;
             saveBtn.textContent = "Salvataggio...";
             try {
                 await Store.api("updateUserRole", "auth", {
                     userId: btn.dataset.uid,
                     role: role,
                     permissions_json: perms
                 });
                 UI.toast("Ruolo aggiornato", "success");
                 Store.invalidate("auth");
                 await loadUsers();
                 modal.close();
             } catch(err) {
                 errBox.textContent = err.message;
                 errBox.classList.remove("hidden");
                 saveBtn.disabled = false;
                 saveBtn.textContent = "SALVA";
             }
          }, {signal: abortController.signal});
        }, { signal: abortController.signal });
      });

      // User Toggle
      Utils.qsa(".user-toggle").forEach(btn => {
         btn.addEventListener("click", async () => {
             const uid = btn.dataset.uid;
             const isActive = btn.dataset.active === "1";
             const name = btn.dataset.name;
             if(confirm(`Vuoi davvero ${isActive ? "sospendere" : "riattivare"} l'utente "${name}"?`)) {
                 try {
                     await Store.api("toggleUserActive", "auth", { userId: uid, active: !isActive });
                     UI.toast("Utente " + (isActive ? "sospeso" : "riattivato"), "success");
                     Store.invalidate("auth");
                     await loadUsers();
                 } catch(err) {
                     UI.toast("Errore: " + err.message, "error");
                 }
             }
         }, { signal: abortController.signal });
      });

      // User Resend
      Utils.qsa(".user-resend").forEach(btn => {
          btn.addEventListener("click", async () => {
              if(confirm("Vuoi inviare nuovamente l'email di invito a " + btn.dataset.name + "?")) {
                  try {
                      await Store.api("resendInvite", "auth", { userId: btn.dataset.uid });
                      UI.toast("Invito reinviato", "success");
                  } catch(err) {
                      UI.toast("Errore: " + err.message, "error");
                  }
              }
          }, { signal: abortController.signal });
      });

      // User Reset Password
      Utils.qsa(".user-reset-pwd").forEach(btn => {
          btn.addEventListener("click", async () => {
              if (confirm(`Inviare una email di recupero password a "${btn.dataset.name}"?`)) {
                  try {
                      await Store.api("resetUserPasswordAdmin", "auth", { userId: btn.dataset.uid });
                      UI.toast("Email di recupero inviata", "success");
                  } catch(err) {
                      UI.toast("Errore: " + err.message, "error");
                  }
              }
          }, { signal: abortController.signal });
      });

      // User Delete
      Utils.qsa(".user-delete").forEach(btn => {
          btn.addEventListener("click", async () => {
              if (confirm(`Sei sicuro di voler ELIMINARE definitivamente l'utente "${btn.dataset.name}"?\nL'operazione è distruttiva.`)) {
                  try {
                      await Store.api("deleteUser", "auth", { userId: btn.dataset.uid });
                      UI.toast("Utente eliminato", "success");
                      Store.invalidate("auth");
                      await loadUsers();
                  } catch(err) {
                      UI.toast("Errore: " + err.message, "error");
                  }
              }
          }, { signal: abortController.signal });
      });

    } catch (t) {
      if (t.name === 'AbortError') return;
      e.innerHTML = Utils.emptyState("Errore caricamento utenti", t.message);
    }
  }

  return {
    init: async function () {
      abortController.abort();
      abortController = new AbortController();
      const mainContent = document.getElementById("app");
      if (mainContent) {
        mainContent.innerHTML = `
          <div class="page-header">
            <div>
              <h1 class="page-title">Amministrazione - Utenti</h1>
              <p class="page-subtitle">Gestisci gli accessi e i ruoli</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
      }
      await loadUsers();
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    },
  };
})();
window.AdminUsers = AdminUsers;
