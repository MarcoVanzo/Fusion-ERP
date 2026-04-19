"use strict";

const AdminUsers = (() => {
  let abortController = new AbortController();

  const ROLES = ["admin", "social media manager", "allenatore", "operatore", "atleta"];
  
  const ROLE_LABELS = {
    admin: "Admin",
    "social media manager": "Social Media Manager",
    allenatore: "Allenatore",
    operatore: "Operatore",
    atleta: "Atleta",
  };

  const ROLE_COLORS = {
    admin: "pink",
    "social media manager": "blue",
    allenatore: "green",
    operatore: "muted",
    atleta: "muted",
  };

  const STATUS_COLORS = { 
    Attivo: "green", 
    Invitato: "yellow", 
    Disattivato: "red" 
  };

  async function loadUsers() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    try {
      const users = await Store.get("listUsers", "auth");
      
      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);">
          <p class="section-label" style="margin:0;">Gestione Utenze</p>
          <button class="btn btn-primary btn-sm" id="new-user-btn" type="button" style="display:flex;align-items:center;gap:8px;">
            <i class="ph ph-user-plus"></i> NUOVO UTENTE
          </button>
        </div>

        ${users.length === 0
          ? Utils.emptyState("Nessun utente trovato", "Crea il primo utente usando il pulsante in alto.")
          : `<div class="table-wrapper">
              <table class="table" id="users-table">
                <thead><tr>
                  <th></th><th>Nome</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Ultimo accesso</th><th>Azioni</th>
                </tr></thead>
                <tbody>
                  ${users.map((u) => {
                    const status = u.status || (u.is_active == 1 ? "Attivo" : "Disattivato");
                    const isActive = status === "Attivo";
                    const isInvited = status === "Invitato";
                    const lastLogin = u.last_login_at
                      ? Utils.formatDate(u.last_login_at)
                      : '<span style="color:var(--color-text-muted);font-size:11px;">Mai</span>';
                    
                    const avatar = u.avatar_path
                      ? `<img src="${Utils.escapeHtml(u.avatar_path)}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;">`
                      : `<div style="width:32px;height:32px;border-radius:50%;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--color-pink);">${Utils.escapeHtml(u.full_name?.charAt(0).toUpperCase() || "?")}</div>`;
                    
                    return `
                      <tr data-uid="${Utils.escapeHtml(u.id)}">
                        <td style="width:40px;padding:6px 4px 6px 12px;">${avatar}</td>
                        <td><strong>${Utils.escapeHtml(u.full_name)}</strong></td>
                        <td style="font-size:12px;color:var(--color-text-muted);">${Utils.escapeHtml(u.email)}</td>
                        <td>${Utils.badge(ROLE_LABELS[u.role] ?? u.role, ROLE_COLORS[u.role] ?? "muted")}</td>
                        <td>${Utils.badge(status, STATUS_COLORS[status] ?? "muted")}</td>
                        <td style="font-size:12px;color:var(--color-text-muted);">${lastLogin}</td>
                        <td>
                          <div style="display:flex;gap:6px;flex-wrap:wrap;">
                            <button class="btn btn-ghost btn-sm user-edit-role"
                              data-uid="${Utils.escapeHtml(u.id)}"
                              data-role="${Utils.escapeHtml(u.role)}"
                              data-name="${Utils.escapeHtml(u.full_name)}"
                              data-permissions='${Utils.escapeHtml(JSON.stringify(u.permissions_json || {}))}'
                              title="Modifica ruolo"><i class="ph ph-shield-check"></i> Ruolo</button>

                            ${isInvited 
                              ? `<button class="btn btn-ghost btn-sm user-resend"
                                  data-uid="${Utils.escapeHtml(u.id)}"
                                  data-name="${Utils.escapeHtml(u.full_name)}"
                                  title="Reinvia email di invito"
                                  style="color:var(--color-warning);"><i class="ph ph-envelope-simple"></i> Reinvia</button>` 
                              : `<button class="btn btn-ghost btn-sm user-toggle"
                                  data-uid="${Utils.escapeHtml(u.id)}"
                                  data-active="${isActive ? "1" : "0"}"
                                  data-name="${Utils.escapeHtml(u.full_name)}"
                                  title="${isActive ? "Sospendi" : "Riattiva"}">
                                  ${isActive ? '<i class="ph ph-lock"></i> Sospendi' : '<i class="ph ph-key"></i> Riattiva'}</button>`
                            }

                            <button class="btn btn-ghost btn-sm user-reset-pwd"
                              data-uid="${Utils.escapeHtml(u.id)}"
                              data-name="${Utils.escapeHtml(u.full_name)}"
                              title="Reset password"><i class="ph ph-password"></i> Reset</button>

                             <button class="btn btn-ghost btn-sm user-delete"
                               data-uid="${Utils.escapeHtml(u.id)}"
                               data-name="${Utils.escapeHtml(u.full_name)}"
                               title="Elimina utente"
                               style="color:var(--color-error);"><i class="ph ph-trash"></i></button>
                          </div>
                        </td>
                      </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>`
        }
      `;

      bindUserEvents();
    } catch (err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento utenti", err.message);
    }
  }

  function bindUserEvents() {
    document.getElementById("new-user-btn")?.addEventListener("click", openCreateUserModal, { signal: abortController.signal });

    Utils.qsa(".user-edit-role").forEach((btn) => 
      btn.addEventListener("click", () => openEditRoleModal({
        id: btn.dataset.uid,
        role: btn.dataset.role,
        full_name: btn.dataset.name,
        permissions_json: btn.dataset.permissions
      }), { signal: abortController.signal })
    );

    Utils.qsa(".user-toggle").forEach((btn) =>
      btn.addEventListener("click", () => toggleUserStatus(btn.dataset.uid, btn.dataset.active === "1", btn.dataset.name), { signal: abortController.signal })
    );

    Utils.qsa(".user-resend").forEach((btn) =>
      btn.addEventListener("click", () => resendInvite(btn.dataset.uid, btn.dataset.name), { signal: abortController.signal })
    );

    Utils.qsa(".user-reset-pwd").forEach((btn) =>
      btn.addEventListener("click", () => openResetPasswordModal({ id: btn.dataset.uid, full_name: btn.dataset.name }), { signal: abortController.signal })
    );

    Utils.qsa(".user-delete").forEach((btn) =>
      btn.addEventListener("click", () => deleteUser(btn.dataset.uid, btn.dataset.name), { signal: abortController.signal })
    );
  }

  function openCreateUserModal() {
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
              ${ROLES.map((r) => `<option value="${r}">${ROLE_LABELS[r]}</option>`).join("")}
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
        <button class="btn btn-primary btn-sm" id="nu-save" type="button">📧 CREA E INVIA INVITO</button>`,
    });

    document.getElementById("nu-cancel")?.addEventListener("click", () => modal.close(), { signal: abortController.signal });
    document.getElementById("nu-save")?.addEventListener("click", async () => {
      const name = document.getElementById("nu-name").value.trim();
      const email = document.getElementById("nu-email").value.trim();
      const role = document.getElementById("nu-role").value;
      const phone = document.getElementById("nu-phone").value.trim();
      const errorEl = document.getElementById("nu-error");
      const saveBtn = document.getElementById("nu-save");

      if (!name || !email) {
        errorEl.textContent = "Compila i campi obbligatori";
        errorEl.classList.remove("hidden");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Creazione in corso...";
      
      try {
        const result = await Store.api("createUser", "auth", {
          full_name: name,
          email: email,
          role: role,
          phone: phone || null,
        });

        const msg = result.tempPassword
          ? `✅ Utente creato!\n\nPassword temporanea: ${result.tempPassword}\n\nComunicala all'utente e invitalo a cambiarla al primo accesso.`
          : `✅ Utente ${name} creato con successo.`;
        
        alert(msg);
        Store.invalidate("auth");
        await loadUsers();
        modal.close();
      } catch (err) {
        if (err.name === 'AbortError') return;
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = "📧 CREA E INVIA INVITO";
      }
    }, { signal: abortController.signal });
  }

  async function openEditRoleModal(user) {
    let navConfig = [];
    try {
      const navVersion = Router?._appVersion || document.querySelector('meta[name="app-version"]')?.content || Date.now();
      const res = await fetch(`js/config/navigation.json?v=${navVersion}`);
      if (res.ok) navConfig = await res.json();
    } catch (err) {
      console.error("Errore fetch permessi", err);
    }

    let existingPerms = {};
    if (user.permissions_json) {
      try {
        existingPerms = typeof user.permissions_json === "string" ? JSON.parse(user.permissions_json) : user.permissions_json;
      } catch (_err) {}
    }

    let matrixHtml = `<div class="permissions-matrix" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 6px; margin-top: 8px;">
      <table style="width:100%; border-collapse: collapse; font-size: 13px;">
        <thead style="position: sticky; top: 0; background: var(--color-surface); box-shadow: 0 1px 0 var(--color-border); z-index: 10;">
          <tr>
            <th style="text-align:left; padding: 12px; font-weight: 600;">Modulo / Tab</th>
            <th style="width: 80px; text-align:center; padding: 12px; font-weight: 600;">Lettura</th>
            <th style="width: 80px; text-align:center; padding: 12px; font-weight: 600;">Scrittura</th>
          </tr>
        </thead>
        <tbody>`;

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
        </tr>`;

      if (navGroup.children?.length > 0) {
        navGroup.children.forEach((child) => {
          const childId = child.path;
          const cPerm = existingPerms[childId] || "none";
          const cRead = (cPerm === "read" || cPerm === "write") ? "checked" : "";
          const cWrite = cPerm === "write" ? "checked" : "";

          matrixHtml += `
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td style="padding: 8px 12px 8px 32px; color: var(--color-text-muted);"><i class="ph ph-arrow-elbow-down-right" style="margin-right:6px"></i> ${Utils.escapeHtml(child.title)}</td>
              <td style="text-align:center; padding: 8px 12px;"><input type="checkbox" class="perm-cb-read perm-child" data-target="${childId}" data-parent="${groupId}" ${cRead}></td>
              <td style="text-align:center; padding: 8px 12px;"><input type="checkbox" class="perm-cb-write perm-child" data-target="${childId}" data-parent="${groupId}" ${cWrite}></td>
            </tr>`;
        });
      }
    });

    matrixHtml += `</tbody></table></div>`;

    const modal = UI.modal({
      title: `Permessi Utente — ${Utils.escapeHtml(user.full_name)}`,
      body: `
        <div class="form-group">
          <label class="form-label" for="er-role">Ruolo Base</label>
          <select id="er-role" class="form-select">
            ${ROLES.map((r) => `<option value="${r}" ${r === user.role ? "selected" : ""}>${ROLE_LABELS[r]}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
            <label class="form-label">Permessi Specifici per Modulo</label>
            ${matrixHtml}
        </div>
        <div id="er-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="er-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="er-save" type="button">SALVA PERMESSI</button>`,
    });

    const modalEl = document.getElementById("er-role").closest(".modal-content");
    
    // Permission matrix logic
    modalEl.querySelectorAll(".perm-cb-write").forEach((cb) => {
      cb.addEventListener("change", (ev) => {
        if (ev.target.checked) {
          const row = ev.target.closest("tr");
          const readCb = row.querySelector(".perm-cb-read");
          if (readCb) readCb.checked = true;
        }
      });
    });

    modalEl.querySelectorAll(".perm-cb-read").forEach((cb) => {
      cb.addEventListener("change", (ev) => {
        if (!ev.target.checked) {
          const row = ev.target.closest("tr");
          const writeCb = row.querySelector(".perm-cb-write");
          if (writeCb) writeCb.checked = false;
        }
      });
    });

    modalEl.querySelectorAll(".perm-group").forEach((cb) => {
      cb.addEventListener("change", (ev) => {
        const target = ev.target.dataset.target;
        const isRead = ev.target.classList.contains("perm-cb-read");
        const isChecked = ev.target.checked;

        modalEl.querySelectorAll(`.perm-child[data-parent="${target}"]`).forEach((child) => {
          if (isRead && child.classList.contains("perm-cb-read")) {
            child.checked = isChecked;
            if (!isChecked) {
              const w = child.closest("tr").querySelector(".perm-cb-write");
              if (w) w.checked = false;
            }
          }
          if (!isRead && child.classList.contains("perm-cb-write")) {
            child.checked = isChecked;
            if (isChecked) {
              const r = child.closest("tr").querySelector(".perm-cb-read");
              if (r) r.checked = true;
            }
          }
        });
      });
    });

    document.getElementById("er-cancel")?.addEventListener("click", () => modal.close(), { signal: abortController.signal });
    document.getElementById("er-save")?.addEventListener("click", async () => {
      const role = document.getElementById("er-role").value;
      const errorEl = document.getElementById("er-error");
      const saveBtn = document.getElementById("er-save");

      const perms = {};
      modalEl.querySelectorAll("tbody tr").forEach((row) => {
        const rCb = row.querySelector(".perm-cb-read");
        const wCb = row.querySelector(".perm-cb-write");
        if (rCb?.dataset.target) {
          const k = rCb.dataset.target;
          const parent = rCb.dataset.parent;

          if (wCb?.checked) perms[k] = "write";
          else if (rCb.checked) perms[k] = "read";

          if (parent && perms[k]) {
            if (perms[parent] !== "write") perms[parent] = "read";
          }
        }
      });

      saveBtn.disabled = true;
      saveBtn.textContent = "Salvataggio...";
      
      try {
        await Store.api("updateUserRole", "auth", {
          userId: user.id,
          role: role,
          permissions_json: perms,
        });
        UI.toast("Ruolo aggiornato", "success");
        Store.invalidate("auth");
        await loadUsers();
        modal.close();
      } catch (err) {
        if (err.name === 'AbortError') return;
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = "SALVA PERMESSI";
      }
    }, { signal: abortController.signal });
  }

  async function toggleUserStatus(userId, currentActive, name) {
    if (!confirm(`Vuoi davvero ${currentActive ? "sospendere" : "riattivare"} l'utente "${name}"?`)) return;
    
    try {
      await Store.api("toggleUserActive", "auth", {
        userId: userId,
        active: !currentActive,
      });
      UI.toast("Utente " + (currentActive ? "sospeso" : "riattivato"), "success");
      Store.invalidate("auth");
      await loadUsers();
    } catch (err) {
      UI.toast(err.message, "error");
    }
  }

  async function resendInvite(userId, name) {
    if (!confirm(`Reinviare l'email di invito a "${name}"?`)) return;
    
    try {
      await Store.api("resendVerification", "auth", { userId: userId });
      UI.toast(`Email di invito reinviata a ${name}`, "success");
    } catch (err) {
      UI.toast("Errore: " + err.message, "error");
    }
  }

  function openResetPasswordModal(user) {
    const modal = UI.modal({
      title: `Reset password — ${Utils.escapeHtml(user.full_name)}`,
      body: `
        <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:var(--sp-3);">
          Verrà generata una password temporanea sicura. Comunicala all'utente e invitalo a cambiarla al primo accesso.
        </p>
        <div id="rp-result" class="hidden" style="padding:var(--sp-2) var(--sp-3);background:rgba(0,230,118,0.08);border:1px solid #00E676;font-size:13px;margin-bottom:var(--sp-2);">
          <strong style="color:#00E676;">✓ Password temporanea generata:</strong><br>
          <code id="rp-pwd" style="font-size:16px;letter-spacing:2px;color:#fff;font-weight:700;"></code>
          <button class="btn btn-ghost btn-sm" id="rp-copy" type="button" style="margin-left:8px;">📋 Copia</button>
        </div>
        <div id="rp-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="rp-cancel" type="button">Chiudi</button>
        <button class="btn btn-primary btn-sm" id="rp-reset" type="button">🔑 GENERA PASSWORD</button>`,
    });

    document.getElementById("rp-cancel")?.addEventListener("click", () => modal.close(), { signal: abortController.signal });
    document.getElementById("rp-reset")?.addEventListener("click", async () => {
      const resetBtn = document.getElementById("rp-reset");
      const errorEl = document.getElementById("rp-error");
      resetBtn.disabled = true;
      resetBtn.textContent = "Generazione...";
      
      try {
        const result = await Store.api("adminResetPassword", "auth", { userId: user.id });
        document.getElementById("rp-pwd").textContent = result.tempPassword;
        document.getElementById("rp-result").classList.remove("hidden");
        resetBtn.classList.add("hidden");
        UI.toast("Password temporanea generata", "success");
      } catch (err) {
        if (err.name === 'AbortError') return;
        errorEl.textContent = err.message;
        errorEl.classList.remove("hidden");
        resetBtn.disabled = false;
        resetBtn.textContent = "🔑 GENERA PASSWORD";
      }
    }, { signal: abortController.signal });

    document.getElementById("rp-copy")?.addEventListener("click", () => {
      const pwd = document.getElementById("rp-pwd").textContent;
      navigator.clipboard.writeText(pwd).then(() => UI.toast("Password copiata!", "success"));
    }, { signal: abortController.signal });
  }

  async function deleteUser(userId, name) {
    if (!confirm(`Eliminare l'utente "${name}"?\nL'operazione è reversibile solo dall'amministratore del database.`)) return;
    
    try {
      await Store.api("deleteUser", "auth", { userId: userId });
      UI.toast(`Utente ${name} eliminato.`, "success");
      Store.invalidate("auth");
      await loadUsers();
    } catch (err) {
      UI.toast("Errore: " + err.message, "error");
    }
  }

  return {
    init: async function () {
      abortController.abort();
      abortController = new AbortController();
      const i = document.getElementById("app");
      if (i) {
        i.innerHTML = `
          <div class="page-header">
            <div>
              <h1 class="page-title">Amministrazione - Utenti</h1>
              <p class="page-subtitle">Gestione account, ruoli e permessi</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadUsers();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminUsers = AdminUsers;
