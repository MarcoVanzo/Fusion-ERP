"use strict";
const Societa = (() => {
  let _abort = new AbortController();
  let _currentTab = "identita";
  let _profile = null;
  let _roles = [];
  let _members = [];
  let _documents = [];
  let _deadlines = [];
  let _sponsors = [];
  let _titles = [];
  let _forestData = null;

  function sig() {
    return { signal: _abort.signal };
  }

  function getStatusColor(status) {
    return (
      {
        aperto: "var(--color-info, #60a5fa)",
        completato: "var(--color-success)",
        scaduto: "var(--color-pink)",
        annullato: "var(--color-text-muted)",
      }[status] || "var(--color-text-muted)"
    );
  }

  function renderBody() {
    _abort.abort();
    _abort = new AbortController();
    const container = document.getElementById("soc-tab-content");
    if (!container) return;

    const renderFn = {
      identita: renderIdentity,
      organigramma: renderOrgChart,
      membri: renderMembers,
      documenti: renderDocuments,
      scadenze: renderDeadlines,
      sponsor: renderSponsors,
      titoli: renderTitles,
      newsletter: renderNewsletterTab,
      foresteria: renderForesteria,
    }[_currentTab];

    if (renderFn) renderFn(container);

    if (_currentTab === "identita") {
      const docWrapper = document.createElement("div");
      docWrapper.id = "soc-docs-inline";
      container.appendChild(docWrapper);
      renderDocuments(docWrapper);
    }
  }
  function renderIdentity(container) {
    const profile = _profile || {};
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    
    container.innerHTML = `
      <div style="max-width:1200px">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--sp-4); align-items: start; margin-bottom: var(--sp-4)">
          <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
            <div class="dash-card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
              <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Identità Visiva</p>
              <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)">
                ${profile.logo_path ? `<img src="${Utils.escapeHtml(profile.logo_path)}" alt="Logo" class="soc-logo-preview">` : '<div style="width:90px;height:60px;border:2px dashed var(--color-border);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:12px">Logo</div>'}
                ${isAdmin ? '<div><input type="file" id="soc-logo-input" accept="image/*" style="display:none"><button class="btn-dash" id="soc-logo-btn" type="button"><i class="ph ph-upload-simple"></i> Carica Logo</button></div>' : ""}
              </div>
              <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-3)">
                <div class="form-group" style="flex:1;min-width:200px">
                  <label class="form-label">Colore Primario</label>
                  <div class="soc-color-row">
                    <input type="color" id="soc-color-primary" class="soc-color-swatch" value="${Utils.escapeHtml(profile.primary_color || "#FF007A")}">
                    <input type="text" id="soc-color-primary-txt" class="form-input" value="${Utils.escapeHtml(profile.primary_color || "#FF007A")}" maxlength="7" style="font-size:13px;font-family:monospace">
                  </div>
                </div>
                <div class="form-group" style="flex:1;min-width:200px">
                  <label class="form-label">Colore Secondario</label>
                  <div class="soc-color-row">
                    <input type="color" id="soc-color-secondary" class="soc-color-swatch" value="${Utils.escapeHtml(profile.secondary_color || "#000000")}">
                    <input type="text" id="soc-color-secondary-txt" class="form-input" value="${Utils.escapeHtml(profile.secondary_color || "#000000")}" maxlength="7" style="font-size:13px;font-family:monospace">
                  </div>
                </div>
                <div class="form-group" style="min-width:160px">
                  <label class="form-label">Anno Fondazione</label>
                  <input type="number" id="soc-founded" class="form-input" value="${Utils.escapeHtml(String(profile.founded_year || ""))}" min="1800" max="2099" placeholder="es. 1985">
                </div>
              </div>
            </div>
            <div class="dash-card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
              <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Indirizzi</p>
              <div class="form-group">
                <label class="form-label" for="soc-legal-addr">Sede Legale</label>
                <input id="soc-legal-addr" class="form-input" type="text" value="${Utils.escapeHtml(profile.legal_address || "")}" placeholder="Via Roma 1, 00100 Roma">
              </div>
              <div class="form-group">
                <label class="form-label" for="soc-op-addr">Sede Operativa</label>
                <input id="soc-op-addr" class="form-input" type="text" value="${Utils.escapeHtml(profile.operative_address || "")}" placeholder="Palestra Centrale, Via Sport 5">
              </div>
            </div>
          </div>
          <div class="dash-card" style="padding:var(--sp-4); height:100%;margin-bottom:var(--sp-3)">
            <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Mission &amp; Vision</p>
            <div class="form-group">
              <label class="form-label" for="soc-mission">Mission</label>
              <textarea id="soc-mission" class="form-input" rows="3" placeholder="La missione della nostra società..." style="resize:vertical">${Utils.escapeHtml(profile.mission || "")}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="soc-vision">Vision</label>
              <textarea id="soc-vision" class="form-input" rows="3" placeholder="La nostra visione per il futuro..." style="resize:vertical">${Utils.escapeHtml(profile.vision || "")}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="soc-values">Valori</label>
              <textarea id="soc-values" class="form-input" rows="2" placeholder="Rispetto, fairplay, crescita..." style="resize:vertical">${Utils.escapeHtml(profile.values || "")}</textarea>
            </div>
          </div>
        </div>
        ${isAdmin ? `<div style="display:flex;justify-content:flex-end;margin-top:var(--sp-2)"><div id="soc-profile-err" class="form-error hidden"></div><button class="btn-dash pink" id="soc-save-profile" type="button"><i class="ph ph-floppy-disk"></i> SALVA PROFILO</button></div>` : ""}
      </div>`;

    const binder = (picker, text) => {
      picker?.addEventListener("input", () => { if (text) text.value = picker.value; }, sig());
      text?.addEventListener("input", () => {
        const val = text.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val) && picker) picker.value = val;
      }, sig());
    };

    binder(document.getElementById("soc-color-primary"), document.getElementById("soc-color-primary-txt"));
    binder(document.getElementById("soc-color-secondary"), document.getElementById("soc-color-secondary-txt"));

    const logoInput = document.getElementById("soc-logo-input");
    document.getElementById("soc-logo-btn")?.addEventListener("click", () => logoInput?.click(), sig());

    logoInput?.addEventListener("change", async () => {
      if (!logoInput.files?.length) return;
      const fd = new FormData();
      fd.append("logo", logoInput.files[0]);
      const btn = document.getElementById("soc-logo-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Upload..."; }
      try {
        const res = await Store.api("uploadLogo", "societa", fd);
        if (_profile) _profile.logo_path = res.logo_path;
        else _profile = { logo_path: res.logo_path };
        UI.toast("Logo caricato", "success");
        renderIdentity(container);
      } catch (err) {
        UI.toast("Errore upload logo: " + err.message, "error");
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-upload-simple"></i> Carica Logo'; }
      }
    }, sig());

    document.getElementById("soc-save-profile")?.addEventListener("click", async () => {
      const btn = document.getElementById("soc-save-profile");
      const errEl = document.getElementById("soc-profile-err");
      errEl?.classList.add("hidden");
      if (btn) { btn.disabled = true; btn.textContent = "Salvataggio..."; }
      try {
        await Store.api("saveProfile", "societa", {
          mission: document.getElementById("soc-mission")?.value || null,
          vision: document.getElementById("soc-vision")?.value || null,
          values: document.getElementById("soc-values")?.value || null,
          founded_year: document.getElementById("soc-founded")?.value || null,
          primary_color: document.getElementById("soc-color-primary-txt")?.value || null,
          secondary_color: document.getElementById("soc-color-secondary-txt")?.value || null,
          logo_path: _profile?.logo_path || null,
          legal_address: document.getElementById("soc-legal-addr")?.value || null,
          operative_address: document.getElementById("soc-op-addr")?.value || null,
        });
        _profile = await Store.get("getProfile", "societa").catch(() => _profile);
        UI.toast("Profilo salvato", "success");
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
        UI.toast("Errore: " + err.message, "error");
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA PROFILO'; }
      }
    }, sig());
  }
  function renderOrgChart(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const roots = _roles.filter((r) => !r.parent_role_id);
    
    container.innerHTML = `
      <div>
        ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-role" type="button"><i class="ph ph-plus"></i> NUOVO RUOLO</button></div>' : ""}
        <div class="soc-tree" id="soc-tree">
          ${_roles.length === 0 ? Utils.emptyState("Nessun ruolo", "Aggiungi il primo ruolo con il pulsante in alto.") : roots.map(function renderNode(role) {
            const children = _roles.filter((r) => r.parent_role_id === role.id);
            return `
              <div style="margin-bottom:var(--sp-2)">
                <div class="soc-tree-node" draggable="true" data-role-id="${Utils.escapeHtml(role.id)}">
                  <i class="ph ph-dots-six-vertical soc-tree-drag-handle"></i>
                  <div style="flex:1">
                    <div class="soc-tree-node-name">${Utils.escapeHtml(role.name)}</div>
                    ${role.description ? `<div class="soc-tree-node-desc">${Utils.escapeHtml(role.description)}</div>` : ""}
                  </div>
                  ${isAdmin ? `
                    <button class="btn-dash" data-edit-role="${Utils.escapeHtml(role.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-dash" data-del-role="${Utils.escapeHtml(role.id)}" type="button" title="Elimina" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                  ` : ""}
                </div>
                ${children.length ? `<div class="soc-tree-level">${children.map(renderNode).join("")}</div>` : ""}
              </div>`;
          }).join("")}
        </div>
      </div>`;

    container.querySelectorAll("[data-edit-role]").forEach((btn) => {
      btn.addEventListener("click", () => openRoleModal(_roles.find((r) => r.id === btn.dataset.editRole)), sig());
    });

    container.querySelectorAll("[data-del-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const role = _roles.find((r) => r.id === btn.dataset.delRole);
        if (!role) return;
        UI.confirm(`Sei sicuro di voler eliminare il ruolo <strong>${Utils.escapeHtml(role.name)}</strong>?`, async () => {
          try {
            await Store.api("deleteRole", "societa", { id: role.id });
            _roles = await Store.get("listRoles", "societa").catch(() => _roles);
            UI.toast("Ruolo eliminato", "success");
            renderBody();
          } catch (err) { UI.toast("Errore: " + err.message, "error"); }
        });
      }, sig());
    });

    document.getElementById("soc-add-role")?.addEventListener("click", () => openRoleModal(null), sig());

    let draggedId = null;
    container.querySelectorAll(".soc-tree-node").forEach((node) => {
      node.addEventListener("dragstart", () => {
        draggedId = node.dataset.roleId;
        node.classList.add("dragging");
      }, sig());

      node.addEventListener("dragend", () => node.classList.remove("dragging"), sig());
      node.addEventListener("dragover", (e) => { e.preventDefault(); node.classList.add("drag-over"); }, sig());
      node.addEventListener("dragleave", () => node.classList.remove("drag-over"), sig());
      
      node.addEventListener("drop", async (e) => {
        e.preventDefault();
        node.classList.remove("drag-over");
        const targetId = node.dataset.roleId;
        if (draggedId && draggedId !== targetId) {
          const role = _roles.find((r) => r.id === draggedId);
          if (!role) return;
          try {
            await Store.api("updateRole", "societa", { ...role, parent_role_id: targetId });
            _roles = await Store.get("listRoles", "societa").catch(() => _roles);
            renderOrgChart(container);
            UI.toast("Gerarchia aggiornata", "success");
          } catch (err) { UI.toast("Errore: " + err.message, "error"); }
        }
      }, sig());
    });
  }

  function openRoleModal(role) {
    const isEdit = !!role;
    const parentOpts = _roles
      .filter((r) => !role || r.id !== role.id)
      .map((r) => `<option value="${Utils.escapeHtml(r.id)}" ${role?.parent_role_id === r.id ? "selected" : ""}>${Utils.escapeHtml(r.name)}</option>`)
      .join("");

    const modal = UI.modal({
      title: isEdit ? "Modifica Ruolo" : "Nuovo Ruolo",
      body: `
        <div class="form-group">
          <label class="form-label" for="rl-name">Nome Ruolo *</label>
          <input id="rl-name" class="form-input" type="text" value="${Utils.escapeHtml(role?.name || "")}" placeholder="es. Presidente">
        </div>
        <div class="form-group">
          <label class="form-label" for="rl-desc">Descrizione</label>
          <textarea id="rl-desc" class="form-input" rows="2" placeholder="Descrizione del ruolo...">${Utils.escapeHtml(role?.description || "")}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="rl-parent">Ruolo Padre (gerarchia)</label>
          <select id="rl-parent" class="form-select">
            <option value="">— Nessuno (root) —</option>
            ${parentOpts}
          </select>
        </div>
        <div id="rl-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="rl-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="rl-save" type="button">${isEdit ? "SALVA" : "CREA RUOLO"}</button>`,
    });

    document.getElementById("rl-cancel")?.addEventListener("click", () => modal.close(), sig());
    document.getElementById("rl-save")?.addEventListener("click", async () => {
      const name = document.getElementById("rl-name")?.value.trim();
      const errEl = document.getElementById("rl-error");
      if (!name) {
        if (errEl) { errEl.textContent = "Il nome è obbligatorio"; errEl.classList.remove("hidden"); }
        return;
      }
      const btn = document.getElementById("rl-save");
      if (btn) { btn.disabled = true; btn.textContent = "Salvataggio..."; }
      try {
        modal.close();
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
        if (btn) { btn.disabled = false; btn.textContent = isEdit ? "SALVA" : "CREA RUOLO"; }
      }
    }, sig());
  }

  function renderMembers(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    
    container.innerHTML = `
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
          <div class="input-wrapper" style="position:relative;min-width:220px">
            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
            <input type="text" id="soc-members-search" class="form-input" placeholder="Cerca membro..." style="padding-left:36px;height:40px;font-size:13px">
          </div>
          ${isAdmin ? '<button class="btn-dash pink" id="soc-add-member" type="button"><i class="ph ph-plus"></i> AGGIUNGI MEMBRO</button>' : ""}
        </div>
        <div class="table-wrapper" style="overflow-x:auto">
          <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr>
                <th style="padding:10px 12px;border-bottom:1px solid var(--color-border);width:50px"></th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Nome</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Ruolo</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Inizio</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Fine</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">Stato</th>
                ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border)"></th>' : ""}
              </tr>
            </thead>
            <tbody id="soc-members-tbody">
              ${_members.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun membro</td></tr>' : _members.map((m) => `
                <tr class="${m.is_active ? "" : "soc-member-inactive"}" data-member-name="${Utils.escapeHtml((m.full_name || "").toLowerCase())}">
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:center">
                    ${m.photo_path ? `<img src="${Utils.escapeHtml(m.photo_path)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;display:block;margin:0 auto">` : `<div style="width:32px;height:32px;border-radius:50%;background:var(--color-surface-elevated);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;margin:0 auto"><i class="ph ph-user"></i></div>`}
                  </td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(m.full_name)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(m.role_name || "—")}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.start_date ? Utils.formatDate(m.start_date) : "—"}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${m.end_date ? Utils.formatDate(m.end_date) : "—"}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                    <span style="color:${m.is_active ? "var(--color-success)" : "var(--color-text-muted)"}">${m.is_active ? "Attivo" : "Inattivo"}</span>
                  </td>
                  ${isAdmin ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap">
                    <button class="btn-dash" data-edit-member="${Utils.escapeHtml(m.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-dash" data-del-member="${Utils.escapeHtml(m.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                  </td>` : ""}
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById("soc-members-search")?.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      container.querySelectorAll("[data-member-name]").forEach((row) => {
        row.style.display = row.dataset.memberName.includes(q) ? "" : "none";
      });
    }, sig());

    document.getElementById("soc-add-member")?.addEventListener("click", () => openMemberModal(null), sig());

    container.querySelectorAll("[data-edit-member]").forEach((btn) => {
      btn.addEventListener("click", () => openMemberModal(_members.find((m) => m.id === btn.dataset.editMember)), sig());
    });

    container.querySelectorAll("[data-del-member]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const member = _members.find((m) => m.id === btn.dataset.delMember);
        if (!member) return;
        UI.confirm(`Rimuovere <strong>${Utils.escapeHtml(member.full_name)}</strong> dall'organigramma?`, async () => {
          try {
            await Store.api("deleteMember", "societa", { id: member.id });
            _members = await Store.get("listMembers", "societa").catch(() => _members);
            UI.toast("Membro rimosso", "success");
            renderBody();
          } catch (err) { UI.toast("Errore: " + err.message, "error"); }
        });
      }, sig());
    });
  }

  function openMemberModal(member) {
    const isEdit = !!member;
    const roleOpts = _roles
      .map((r) => `<option value="${Utils.escapeHtml(r.id)}" ${member?.role_id === r.id ? "selected" : ""}>${Utils.escapeHtml(r.name)}</option>`)
      .join("");

    const modal = UI.modal({
      title: isEdit ? "Modifica Membro" : "Nuovo Membro",
      body: `
        ${isEdit ? `
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);padding-bottom:var(--sp-3);border-bottom:1px solid var(--color-border)">
            ${member.photo_path ? `<img src="${Utils.escapeHtml(member.photo_path)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover" alt="Foto">` : `<div style="width:64px;height:64px;border-radius:50%;background:var(--color-surface-elevated);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;font-size:24px"><i class="ph ph-user"></i></div>`}
            <div>
              <input type="file" id="mb-photo-input" accept="image/*" style="display:none">
              <button class="btn-dash" id="mb-photo-btn" type="button"><i class="ph ph-camera"></i> ${member.photo_path ? "Cambia Foto" : "Carica Foto"}</button>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">JPG, PNG o WEBP. Max 10MB.</div>
            </div>
          </div>` : ""}
        <div class="form-group">
          <label class="form-label" for="mb-name">Nome Completo *</label>
          <input id="mb-name" class="form-input" type="text" value="${Utils.escapeHtml(member?.full_name || "")}" placeholder="Mario Rossi">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="mb-role">Ruolo *</label>
            <select id="mb-role" class="form-select">
              <option value="">Seleziona...</option>
              ${roleOpts}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stato</label>
            <select id="mb-active" class="form-select">
              <option value="1" ${member?.is_active !== 0 ? "selected" : ""}>Attivo</option>
              <option value="0" ${member?.is_active === 0 ? "selected" : ""}>Inattivo</option>
            </select>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="mb-start">Data Inizio</label>
            <input id="mb-start" class="form-input" type="date" value="${member?.start_date?.substring(0, 10) || ""}">
          </div>
          <div class="form-group">
            <label class="form-label" for="mb-end">Data Fine</label>
            <input id="mb-end" class="form-input" type="date" value="${member?.end_date?.substring(0, 10) || ""}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="mb-email">Email</label>
            <input id="mb-email" class="form-input" type="email" value="${Utils.escapeHtml(member?.email || "")}">
          </div>
          <div class="form-group">
            <label class="form-label" for="mb-phone">Telefono</label>
            <input id="mb-phone" class="form-input" type="tel" value="${Utils.escapeHtml(member?.phone || "")}">
          </div>
        </div>
        <div id="mb-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="mb-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="mb-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`,
    });

    if (isEdit) {
      const photoInput = document.getElementById("mb-photo-input");
      document.getElementById("mb-photo-btn")?.addEventListener("click", () => photoInput?.click(), sig());
      photoInput?.addEventListener("change", async () => {
        if (!photoInput.files?.length) return;
        const fd = new FormData();
        fd.append("file", photoInput.files[0]);
        fd.append("id", member.id);
        const btn = document.getElementById("mb-photo-btn");
        if (btn) { btn.disabled = true; btn.textContent = "Upload..."; }
        try {
          await Store.api("uploadMemberPhoto", "societa", fd);
          _members = await Store.get("listMembers", "societa").catch(() => _members);
          modal.close();
          UI.toast("Foto aggiornata", "success");
          renderBody();
          openMemberModal(_members.find((m) => m.id === member.id));
        } catch (err) {
          UI.toast("Errore upload: " + err.message, "error");
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-camera"></i> Riprova'; }
        }
      }, sig());
    }

    document.getElementById("mb-cancel")?.addEventListener("click", () => modal.close(), sig());
    document.getElementById("mb-save")?.addEventListener("click", async () => {
      const name = document.getElementById("mb-name")?.value.trim();
      const roleId = document.getElementById("mb-role")?.value;
      const errEl = document.getElementById("mb-error");
      if (!name || !roleId) {
        if (errEl) { errEl.textContent = "Nome e ruolo sono obbligatori"; errEl.classList.remove("hidden"); }
        return;
      }
      const btn = document.getElementById("mb-save");
      if (btn) { btn.disabled = true; btn.textContent = "Salvataggio..."; }
      try {
        const data = {
          full_name: name,
          role_id: roleId,
          email: document.getElementById("mb-email")?.value || null,
          phone: document.getElementById("mb-phone")?.value || null,
          start_date: document.getElementById("mb-start")?.value || null,
          end_date: document.getElementById("mb-end")?.value || null,
          is_active: parseInt(document.getElementById("mb-active")?.value || "1"),
        };
        if (isEdit) await Store.api("updateMember", "societa", { id: member.id, ...data });
        else await Store.api("createMember", "societa", data);
        
        _members = await Store.get("listMembers", "societa").catch(() => _members);
        UI.toast(isEdit ? "Membro aggiornato" : "Membro aggiunto", "success");
        renderBody();
        modal.close();
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
        if (btn) { btn.disabled = false; btn.textContent = isEdit ? "SALVA" : "CREA"; }
      }
    }, sig());
  }

  function renderDocuments(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const categories = {
      statuto: "Statuto",
      affiliazione: "Affiliazione",
      licenza: "Licenza",
      assicurazione: "Assicurazione",
      altro: "Altro",
    };
    const icons = {
      statuto: "scroll",
      affiliazione: "handshake",
      licenza: "certificate",
      assicurazione: "shield-check",
      altro: "file-pdf",
    };
    
    container.innerHTML = `
      <div>
        ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-upload-doc" type="button"><i class="ph ph-upload-simple"></i> CARICA DOCUMENTO</button></div>' : ""}
        <div class="soc-doc-grid">
          ${_documents.length === 0 ? Utils.emptyState("Nessun documento", "Carica il primo documento societario.") : _documents.map((doc) => {
            const isExpired = doc.expiry_date && (new Date(doc.expiry_date) - new Date()) / 864e5 < 0;
            const isExpiring = doc.expiry_date && (new Date(doc.expiry_date) - new Date()) / 864e5 < 30;
            
            return `
              <div class="soc-doc-card">
                <div style="display:flex;align-items:flex-start;justify-content:space-between">
                  <i class="ph ph-${icons[doc.category] || "file"} soc-doc-icon"></i>
                  ${isAdmin ? `<button class="btn-dash" data-del-doc="${Utils.escapeHtml(doc.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>` : ""}
                </div>
                <div class="soc-doc-name" title="${Utils.escapeHtml(doc.file_name)}">${Utils.escapeHtml(doc.file_name)}</div>
                <div class="soc-doc-meta">${Utils.escapeHtml(categories[doc.category] || doc.category)}</div>
                ${doc.expiry_date ? `<div class="soc-doc-meta">Scad. ${Utils.formatDate(doc.expiry_date)}</div>` : ""}
                <div style="margin-top:4px">
                  ${doc.expiry_date ? (isExpired ? '<span class="badge-expired"><i class="ph ph-warning"></i> Scaduto</span>' : isExpiring ? '<span class="badge-expiring"><i class="ph ph-clock"></i> In scadenza</span>' : '<span class="badge-ok"><i class="ph ph-check-circle"></i> Valido</span>') : ""}
                </div>
                <a href="api/?module=societa&action=downloadDocument&docId=${Utils.escapeHtml(doc.id)}" target="_blank" class="btn-dash" style="margin-top:var(--sp-1)">
                  <i class="ph ph-download-simple"></i> Scarica
                </a>
              </div>`;
          }).join("")}
        </div>
      </div>`;

    document.getElementById("soc-upload-doc")?.addEventListener("click", () => {
      const modal = UI.modal({
        title: "Carica Documento Societario",
        body: `
          <div class="form-group">
            <label class="form-label" for="sd-category">Categoria *</label>
            <select id="sd-category" class="form-select">
              <option value="statuto">Statuto</option>
              <option value="affiliazione">Affiliazione</option>
              <option value="licenza">Licenza</option>
              <option value="assicurazione">Assicurazione</option>
              <option value="altro" selected>Altro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="sd-expiry">Data Scadenza</label>
            <input id="sd-expiry" class="form-input" type="date">
          </div>
          <div class="form-group">
            <label class="form-label" for="sd-file">File (PDF, DOC, immagine — max 10 MB) *</label>
            <input id="sd-file" type="file" class="form-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp">
          </div>
          <div id="sd-error" class="form-error hidden"></div>`,
        footer: `
          <button class="btn-dash" id="sd-cancel" type="button">Annulla</button>
          <button class="btn-dash pink" id="sd-upload" type="button"><i class="ph ph-upload-simple"></i> CARICA</button>`,
      });

      document.getElementById("sd-cancel")?.addEventListener("click", () => modal.close(), sig());
      document.getElementById("sd-upload")?.addEventListener("click", async () => {
        const fileInput = document.getElementById("sd-file");
        const errEl = document.getElementById("sd-error");
        if (!fileInput?.files?.length) {
          if (errEl) { errEl.textContent = "Seleziona un file"; errEl.classList.remove("hidden"); }
          return;
        }
        const fd = new FormData();
        fd.append("file", fileInput.files[0]);
        fd.append("category", document.getElementById("sd-category")?.value || "altro");
        const expiry = document.getElementById("sd-expiry")?.value;
        if (expiry) fd.append("expiry_date", expiry);
        
        const btn = document.getElementById("sd-upload");
        if (btn) { btn.disabled = true; btn.textContent = "Upload..."; }
        try {
          await Store.api("uploadDocument", "societa", fd);
          _documents = await Store.get("listDocuments", "societa").catch(() => _documents);
          UI.toast("Documento caricato", "success");
          renderBody();
          modal.close();
        } catch (err) {
          if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-upload-simple"></i> CARICA'; }
        }
      }, sig());
    }, sig());

    container.querySelectorAll("[data-del-doc]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        UI.confirm("Eliminare definitivamente questo documento?", async () => {
          try {
            await Store.api("deleteDocument", "societa", { id: btn.dataset.delDoc });
            _documents = await Store.get("listDocuments", "societa").catch(() => _documents);
            UI.toast("Documento eliminato", "success");
            renderBody();
          } catch (err) { UI.toast("Errore: " + err.message, "error"); }
        });
      }, sig());
    });
  }

  function renderDeadlines(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const statusMap = {
      aperto: "Aperto",
      completato: "Completato",
      scaduto: "Scaduto",
      annullato: "Annullato",
    };
    const iconMap = {
      aperto: "clock",
      completato: "check-circle",
      scaduto: "warning-circle",
      annullato: "x-circle",
    };

    container.innerHTML = `
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2);margin-bottom:var(--sp-3);flex-wrap:wrap">
          <div class="dash-filters" id="soc-deadline-filter">
            <button class="dash-filter active" data-dl-status="" type="button">Tutte</button>
            <button class="dash-filter" data-dl-status="aperto" type="button">Aperte</button>
            <button class="dash-filter" data-dl-status="completato" type="button">Completate</button>
            <button class="dash-filter" data-dl-status="scaduto" type="button">Scadute</button>
          </div>
          ${isAdmin ? '<button class="btn-dash pink" id="soc-add-deadline" type="button"><i class="ph ph-plus"></i> NUOVA SCADENZA</button>' : ""}
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-2)" id="soc-deadlines-list">
          ${_deadlines.length === 0 ? Utils.emptyState("Nessuna scadenza", "Aggiungi la prima scadenza federale.") : _deadlines.map((dl) => `
            <div class="dash-card" style="padding:var(--sp-3);display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap" data-dl-status="${Utils.escapeHtml(dl.status)}">
              <i class="ph ph-${iconMap[dl.status] || "dot"}" style="font-size:22px;color:${getStatusColor(dl.status)};flex-shrink:0"></i>
              <div style="flex:1;min-width:180px">
                <div style="font-weight:600;font-size:14px">${Utils.escapeHtml(dl.title)}</div>
                <div style="font-size:12px;color:var(--color-text-muted)">${dl.category ? Utils.escapeHtml(dl.category) + " · " : ""}Scad. ${dl.due_date}</div>
              </div>
              <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:${getStatusColor(dl.status)}">${Utils.escapeHtml(statusMap[dl.status] || dl.status)}</span>
              ${isAdmin ? `
                <div style="display:flex;gap:4px">
                  <button class="btn-dash" data-edit-dl="${Utils.escapeHtml(dl.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                  <button class="btn-dash" data-del-dl="${Utils.escapeHtml(dl.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                </div>` : ""}
            </div>`).join("")}
        </div>
      </div>`;

    container.querySelectorAll("#soc-deadline-filter .dash-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".dash-filter").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const status = btn.dataset.dlStatus;
        container.querySelectorAll("#soc-deadlines-list .dash-card").forEach((card) => {
          card.style.display = !status || card.dataset.dlStatus === status ? "" : "none";
        });
      }, sig());
    });

    document.getElementById("soc-add-deadline")?.addEventListener("click", () => openDeadlineModal(null), sig());

    container.querySelectorAll("[data-edit-dl]").forEach((btn) => {
      btn.addEventListener("click", () => openDeadlineModal(_deadlines.find((d) => d.id === btn.dataset.editDl)), sig());
    });

    container.querySelectorAll("[data-del-dl]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dl = _deadlines.find((d) => d.id === btn.dataset.delDl);
        if (!dl) return;
        UI.confirm(`Eliminare la scadenza "<strong>${Utils.escapeHtml(dl.title)}</strong>"?`, async () => {
          try {
            await Store.api("deleteDeadline", "societa", { id: dl.id });
            _deadlines = await Store.get("listDeadlines", "societa").catch(() => _deadlines);
            UI.toast("Scadenza eliminata", "success");
            renderBody();
          } catch (err) { UI.toast("Errore: " + err.message, "error"); }
        });
      }, sig());
    });
  }

  function openDeadlineModal(deadline) {
    const isEdit = !!deadline;
    const modal = UI.modal({
      title: isEdit ? "Modifica Scadenza" : "Nuova Scadenza",
      body: `
        <div class="form-group">
          <label class="form-label" for="dl-title">Titolo *</label>
          <input id="dl-title" class="form-input" type="text" value="${Utils.escapeHtml(deadline?.title || "")}" placeholder="es. Rinnovo affiliazione FIPAV">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="dl-due">Data Scadenza *</label>
            <input id="dl-due" class="form-input" type="date" value="${deadline?.due_date?.substring(0, 10) || ""}">
          </div>
          <div class="form-group">
            <label class="form-label" for="dl-status">Stato</label>
            <select id="dl-status" class="form-select">
              ${["aperto", "completato", "scaduto", "annullato"].map((s) => `
                <option value="${s}" ${deadline?.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>
              `).join("")}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="dl-cat">Categoria</label>
          <input id="dl-cat" class="form-input" type="text" value="${Utils.escapeHtml(deadline?.category || "")}" placeholder="es. Federale, Fiscale…">
        </div>
        <div class="form-group">
          <label class="form-label" for="dl-notes">Note</label>
          <textarea id="dl-notes" class="form-input" rows="2">${Utils.escapeHtml(deadline?.notes || "")}</textarea>
        </div>
        <div id="dl-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn-dash" id="dl-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="dl-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`,
    });

    document.getElementById("dl-cancel")?.addEventListener("click", () => modal.close(), sig());
    document.getElementById("dl-save")?.addEventListener("click", async () => {
      const title = document.getElementById("dl-title")?.value.trim();
      const due_date = document.getElementById("dl-due")?.value;
      const errEl = document.getElementById("dl-error");
      if (!title || !due_date) {
        if (errEl) { errEl.textContent = "Titolo e data scadenza sono obbligatori"; errEl.classList.remove("hidden"); }
        return;
      }
      const btn = document.getElementById("dl-save");
      if (btn) { btn.disabled = true; btn.textContent = "Salvataggio..."; }
      try {
        const data = {
          title,
          due_date,
          status: document.getElementById("dl-status")?.value || "aperto",
          category: document.getElementById("dl-cat")?.value || null,
          notes: document.getElementById("dl-notes")?.value || null,
        };
        if (isEdit) await Store.api("updateDeadline", "societa", { id: deadline.id, ...data });
        else await Store.api("createDeadline", "societa", data);
        
        _deadlines = await Store.get("listDeadlines", "societa").catch(() => _deadlines);
        UI.toast(isEdit ? "Scadenza aggiornata" : "Scadenza creata", "success");
        renderBody();
        modal.close();
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
        if (btn) { btn.disabled = false; btn.textContent = isEdit ? "SALVA" : "CREA"; }
      }
    }, sig());
  }

  function renderSponsors(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    container.innerHTML = `
      <div>
        ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-sponsor" type="button"><i class="ph ph-plus"></i> NUOVO SPONSOR</button></div>' : ""}
        ${_sponsors.length === 0 ? Utils.emptyState("Nessuno sponsor", "Aggiungi il primo sponsor con il pulsante in alto.") : `
          <div class="soc-sponsor-grid">
            ${_sponsors.map((sp) => `
              <div class="soc-sponsor-card ${sp.is_active ? "" : "soc-sponsor-inactive"}">
                <div class="soc-sponsor-card-header">
                  ${sp.logo_path ? `<img src="${Utils.escapeHtml(sp.logo_path)}" alt="Logo" class="soc-sponsor-logo">` : '<div class="soc-sponsor-logo-placeholder"><i class="ph ph-image"></i></div>'}
                  ${isAdmin ? `
                    <div style="display:flex;gap:4px">
                      <button class="btn-dash" data-sp-logo="${Utils.escapeHtml(sp.id)}" type="button" title="Carica logo"><i class="ph ph-camera"></i></button>
                      <button class="btn-dash" data-sp-edit="${Utils.escapeHtml(sp.id)}" type="button" title="Modifica"><i class="ph ph-pencil-simple"></i></button>
                      <button class="btn-dash" data-sp-del="${Utils.escapeHtml(sp.id)}" type="button" style="color:var(--color-pink)" title="Elimina"><i class="ph ph-trash"></i></button>
                    </div>
                  ` : ""}
                </div>
                <div class="soc-sponsor-name">${Utils.escapeHtml(sp.name)}</div>
                <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.05em">${Utils.escapeHtml(sp.tipo || "Sponsor")}</div>
                ${sp.description ? `<div class="soc-sponsor-desc">${Utils.escapeHtml(sp.description)}</div>` : ""}
                <div class="soc-sponsor-links">
                  ${sp.website_url ? `<a href="${Utils.escapeHtml(sp.website_url)}" target="_blank" class="soc-sponsor-link" title="Sito web"><i class="ph ph-globe-simple"></i></a>` : ""}
                  ${sp.instagram_url ? `<a href="${Utils.escapeHtml(sp.instagram_url)}" target="_blank" class="soc-sponsor-link" title="Instagram"><i class="ph ph-instagram-logo"></i></a>` : ""}
                  ${sp.facebook_url ? `<a href="${Utils.escapeHtml(sp.facebook_url)}" target="_blank" class="soc-sponsor-link" title="Facebook"><i class="ph ph-facebook-logo"></i></a>` : ""}
                  ${sp.linkedin_url ? `<a href="${Utils.escapeHtml(sp.linkedin_url)}" target="_blank" class="soc-sponsor-link" title="LinkedIn"><i class="ph ph-linkedin-logo"></i></a>` : ""}
                  ${sp.tiktok_url ? `<a href="${Utils.escapeHtml(sp.tiktok_url)}" target="_blank" class="soc-sponsor-link" title="TikTok"><i class="ph ph-tiktok-logo"></i></a>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    `;

    document.getElementById("soc-add-sponsor")?.addEventListener("click", () => openSponsorModal(null), sig());

    container.querySelectorAll("[data-sp-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = _sponsors.find((x) => String(x.id) === btn.dataset.spEdit);
        if (item) openSponsorModal(item);
      }, sig());
    });

    container.querySelectorAll("[data-sp-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const item = _sponsors.find((x) => String(x.id) === btn.dataset.spDel);
        if (!item) return;
        const confirmModal = UI.modal({
          title: "Elimina Sponsor",
          body: `<p>Eliminare lo sponsor <strong>${Utils.escapeHtml(item.name)}</strong>?</p>`,
          footer: '<button class="btn-dash" id="sp-del-cancel" type="button">Annulla</button><button class="btn-dash pink" id="sp-del-ok" type="button">ELIMINA</button>',
        });
        document.getElementById("sp-del-cancel")?.addEventListener("click", () => confirmModal.close(), sig());
        document.getElementById("sp-del-ok")?.addEventListener("click", async () => {
          try {
            await Store.api("deleteSponsor", "societa", { id: item.id });
            Store.invalidate("societa");
            _sponsors = await Store.get("listSponsors", "societa").catch(() => _sponsors);
            confirmModal.close();
            UI.toast("Sponsor eliminato", "success");
            renderBody();
          } catch (err) {
            UI.toast("Errore: " + err.message, "error");
          }
        }, sig());
      }, sig());
    });

    container.querySelectorAll("[data-sp-logo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = _sponsors.find((x) => String(x.id) === btn.dataset.spLogo);
        if (!item) return;
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "image/*";
        inp.addEventListener("change", async () => {
          if (!inp.files?.length) return;
          const fd = new FormData();
          fd.append("logo", inp.files[0]);
          fd.append("sponsor_id", item.id);
          btn.disabled = true;
          try {
            const res = await Store.api("uploadSponsorLogo", "societa", fd);
            const found = _sponsors.find((x) => String(x.id) === String(item.id));
            if (found) found.logo_path = res.logo_path;
            UI.toast("Logo caricato", "success");
            renderBody();
          } catch (err) {
            UI.toast("Errore upload: " + err.message, "error");
            btn.disabled = false;
          }
        }, sig());
        inp.click();
      }, sig());
    });
  }

  function openSponsorModal(sponsor) {
    const isEdit = !!sponsor;
    const currentYear = new Date().getFullYear();
    let seasonOptions = '<option value="">Seleziona...</option>';
    for (let y = currentYear + 1; y >= 2015; y--) {
      const s = `${y}/${y + 1}`;
      seasonOptions += `<option value="${s}" ${sponsor?.stagione === s ? "selected" : ""}>${s}</option>`;
    }

    const modal = UI.modal({
      title: isEdit ? "Modifica Sponsor" : "Nuovo Sponsor",
      body: `
        ${isEdit ? `
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);padding-bottom:var(--sp-3);border-bottom:1px solid var(--color-border)">
            ${sponsor.logo_path ? `<img src="${Utils.escapeHtml(sponsor.logo_path)}" style="width:64px;height:64px;border-radius:8px;object-fit:cover" alt="Logo">` : '<div style="width:64px;height:64px;border-radius:8px;background:var(--color-surface-elevated);color:var(--color-text-muted);display:flex;align-items:center;justify-content:center;font-size:24px"><i class="ph ph-image"></i></div>'}
            <div>
              <input type="file" id="sp-logo-input" accept="image/*" style="display:none">
              <button class="btn-dash" id="sp-logo-btn" type="button"><i class="ph ph-camera"></i> ${sponsor.logo_path ? "Cambia Logo" : "Carica Logo"}</button>
            </div>
          </div>
        ` : `
          <div class="form-group">
            <label class="form-label">Logo Iniziale (Opzionale)</label>
            <input type="file" id="sp-logo-input-new" class="form-input" accept="image/*">
          </div>
        `}
        <div class="form-grid" style="grid-template-columns: 2fr 1.5fr 1fr">
          <div class="form-group">
            <label class="form-label">Nome *</label>
            <input id="sp-name" class="form-input" type="text" value="${Utils.escapeHtml(sponsor?.name || "")}" placeholder="Nome azienda">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select id="sp-tipo" class="form-select">
              <option value="Sponsor" ${sponsor?.tipo === "Sponsor" || !sponsor?.tipo ? "selected" : ""}>Sponsor</option>
              <option value="Main Sponsor" ${sponsor?.tipo === "Main Sponsor" ? "selected" : ""}>Main Sponsor</option>
              <option value="Title Sponsor" ${sponsor?.tipo === "Title Sponsor" ? "selected" : ""}>Title Sponsor</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stagione</label>
            <select id="sp-stagione" class="form-select">${seasonOptions}</select>
          </div>
        </div>
        <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr">
          <div class="form-group">
            <label class="form-label">Importo (€)</label>
            <input id="sp-importo" class="form-input" type="number" step="0.01" value="${sponsor?.importo || ""}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Rapporto</label>
            <input id="sp-rapporto" class="form-input" type="number" step="0.01" value="${sponsor?.rapporto || ""}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Sponsorizz.</label>
            <input id="sp-sponsorizzazione" class="form-input" type="number" step="0.01" value="${sponsor?.sponsorizzazione || ""}" readonly style="background:var(--color-surface-elevated)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descrizione</label>
          <textarea id="sp-desc" class="form-input" rows="2" placeholder="Breve descrizione...">${Utils.escapeHtml(sponsor?.description || "")}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Sito Web</label>
          <input id="sp-web" class="form-input" type="url" value="${Utils.escapeHtml(sponsor?.website_url || "")}" placeholder="https://...">
        </div>
        <div id="sp-error" class="form-error hidden"></div>
      `,
      footer: `<button class="btn-dash" id="sp-cancel" type="button">Annulla</button><button class="btn-dash pink" id="sp-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`,
    });

    const calcFormula = () => {
      const imp = parseFloat(document.getElementById("sp-importo")?.value) || 0;
      const rap = parseFloat(document.getElementById("sp-rapporto")?.value) || 0;
      const sponEl = document.getElementById("sp-sponsorizzazione");
      if (sponEl && imp > 0 && rap > 0) {
        sponEl.value = (((imp / 100) * 22) / 2 + imp / rap).toFixed(2);
      } else if (sponEl) {
        sponEl.value = "";
      }
    };

    document.getElementById("sp-importo")?.addEventListener("input", calcFormula, sig());
    document.getElementById("sp-rapporto")?.addEventListener("input", calcFormula, sig());
    document.getElementById("sp-cancel")?.addEventListener("click", () => modal.close(), sig());

    document.getElementById("sp-save")?.addEventListener("click", async () => {
      const name = document.getElementById("sp-name")?.value.trim();
      if (!name) return UI.toast("Nome obbligatorio", "warning");

      const btn = document.getElementById("sp-save");
      btn.disabled = true;
      btn.textContent = "Salvataggio...";

      try {
        const payload = {
          name,
          tipo: document.getElementById("sp-tipo").value,
          stagione: document.getElementById("sp-stagione").value || null,
          importo: document.getElementById("sp-importo").value || null,
          rapporto: document.getElementById("sp-rapporto").value || null,
          sponsorizzazione: document.getElementById("sp-sponsorizzazione").value || null,
          description: document.getElementById("sp-desc").value || null,
          website_url: document.getElementById("sp-web").value || null,
          is_active: 1
        };

        let sId = sponsor?.id;
        if (isEdit) {
          await Store.api("updateSponsor", "societa", { id: sponsor.id, ...payload });
        } else {
          const res = await Store.api("createSponsor", "societa", payload);
          sId = res.id;
        }

        const fInp = isEdit ? document.getElementById("sp-logo-input") : document.getElementById("sp-logo-input-new");
        if (fInp?.files?.length && sId) {
          const fd = new FormData();
          fd.append("logo", fInp.files[0]);
          fd.append("sponsor_id", sId);
          await Store.api("uploadSponsorLogo", "societa", fd);
        }

        Store.invalidate("societa");
        _sponsors = await Store.get("listSponsors", "societa").catch(() => _sponsors);
        UI.toast(isEdit ? "Sponsor aggiornato" : "Sponsor creato", "success");
        renderBody();
        modal.close();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
        btn.disabled = false;
        btn.textContent = isEdit ? "SALVA" : "CREA";
      }
    }, sig());
  }

  function renderTitles(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const piazzLabel = { 1: "🥇 1° Posto", 2: "🥈 2° Posto", 3: "🥉 3° Posto" };
    const campLabel = { provinciale: "Provinciale", regionale: "Regionale", nazionale: "Nazionale" };

    container.innerHTML = `
      <div>
        ${isAdmin ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-3)"><button class="btn-dash pink" id="soc-add-titolo" type="button"><i class="ph ph-plus"></i> AGGIUNGI TITOLO</button></div>' : ""}
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Stagione</th>
                <th>Campionato</th>
                <th>Categoria</th>
                <th>Piazzamento</th>
                <th>Finali Naz.</th>
                ${isAdmin ? "<th></th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${_titles.length === 0 ? `<tr><td colspan="${isAdmin ? 6 : 5}" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun titolo registrato</td></tr>` : _titles.map((row) => `
                <tr>
                  <td style="font-weight:600">${Utils.escapeHtml(row.stagione)}</td>
                  <td>${Utils.escapeHtml(campLabel[row.campionato] || row.campionato)}</td>
                  <td>${Utils.escapeHtml(row.categoria)}</td>
                  <td>${piazzLabel[row.piazzamento] || row.piazzamento}</td>
                  <td>${parseInt(row.finali_nazionali) ? '<span style="color:var(--color-success)">Sì</span>' : "No"}</td>
                  ${isAdmin ? `<td>
                    <button class="btn-dash" data-edit-titolo="${Utils.escapeHtml(row.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-dash" data-del-titolo="${Utils.escapeHtml(row.id)}" type="button" style="color:var(--color-pink)"><i class="ph ph-trash"></i></button>
                  </td>` : ""}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("soc-add-titolo")?.addEventListener("click", () => openTitleModal(null), sig());
    container.querySelectorAll("[data-edit-titolo]").forEach(btn => {
      btn.addEventListener("click", () => {
        const item = _titles.find(x => String(x.id) === btn.dataset.editTitolo);
        if (item) openTitleModal(item);
      }, sig());
    });

    container.querySelectorAll("[data-del-titolo]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const item = _titles.find(x => String(x.id) === btn.dataset.delTitolo);
        if (!item) return;
        const confirmModal = UI.modal({
          title: "Elimina Titolo",
          body: `<p>Eliminare il titolo per <strong>${Utils.escapeHtml(item.categoria)}</strong>?</p>`,
          footer: '<button class="btn-dash" id="tt-del-cancel" type="button">Annulla</button><button class="btn-dash pink" id="tt-del-ok" type="button">ELIMINA</button>',
        });
        document.getElementById("tt-del-cancel")?.addEventListener("click", () => confirmModal.close(), sig());
        document.getElementById("tt-del-ok")?.addEventListener("click", async () => {
          try {
            await Store.api("deleteTitolo", "societa", { id: item.id });
            Store.invalidate("societa");
            _titles = await Store.get("listTitoli", "societa").catch(() => _titles);
            confirmModal.close();
            UI.toast("Titolo eliminato", "success");
            renderBody();
          } catch (err) {
            UI.toast("Errore: " + err.message, "error");
          }
        }, sig());
      }, sig());
    });
  }

  function openTitleModal(title) {
    const isEdit = !!title;
    const currentYear = new Date().getFullYear();
    let seasonOptions = '<option value="">Seleziona...</option>';
    for (let y = currentYear + 1; y >= 2015; y--) {
      const s = `${y}/${y + 1}`;
      seasonOptions += `<option value="${s}" ${title?.stagione === s ? "selected" : ""}>${s}</option>`;
    }

    const modal = UI.modal({
      title: isEdit ? "Modifica Titolo" : "Nuovo Titolo",
      body: `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Stagione *</label>
            <select id="tt-stagione" class="form-select">${seasonOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Campionato *</label>
            <select id="tt-campionato" class="form-select">
              <option value="provinciale" ${title?.campionato === "provinciale" ? "selected" : ""}>Provinciale</option>
              <option value="regionale" ${title?.campionato === "regionale" ? "selected" : ""}>Regionale</option>
              <option value="nazionale" ${title?.campionato === "nazionale" ? "selected" : ""}>Nazionale</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Categoria *</label>
          <input id="tt-categoria" class="form-input" type="text" value="${Utils.escapeHtml(title?.categoria || "")}" placeholder="es. Under 18 Femminile">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Piazzamento *</label>
            <select id="tt-piazzamento" class="form-select">
              <option value="1" ${title?.piazzamento == 1 ? "selected" : ""}>🥇 1° Posto</option>
              <option value="2" ${title?.piazzamento == 2 ? "selected" : ""}>🥈 2° Posto</option>
              <option value="3" ${title?.piazzamento == 3 ? "selected" : ""}>🥉 3° Posto</option>
            </select>
          </div>
          <div class="form-group" style="padding-top:var(--sp-4)">
            <label class="form-label" style="display:flex;align-items:center;gap:var(--sp-2)">
              <input type="checkbox" id="tt-finali" ${parseInt(title?.finali_nazionali) ? "checked" : ""}> Finali Nazionali
            </label>
          </div>
        </div>
      `,
      footer: `<button class="btn-dash" id="tt-cancel" type="button">Annulla</button><button class="btn-dash pink" id="tt-save" type="button">${isEdit ? "SALVA" : "CREA"}</button>`,
    });

    document.getElementById("tt-cancel")?.addEventListener("click", () => modal.close(), sig());
    document.getElementById("tt-save")?.addEventListener("click", async () => {
      const stagione = document.getElementById("tt-stagione").value;
      const categoria = document.getElementById("tt-categoria").value.trim();
      if (!stagione || !categoria) return UI.toast("Completa i campi obbligatori", "warning");

      const btn = document.getElementById("tt-save");
      btn.disabled = true;
      try {
        const payload = {
          stagione,
          campionato: document.getElementById("tt-campionato").value,
          categoria,
          piazzamento: parseInt(document.getElementById("tt-piazzamento").value),
          finali_nazionali: document.getElementById("tt-finali").checked ? 1 : 0
        };

        if (isEdit) await Store.api("updateTitolo", "societa", { id: title.id, ...payload });
        else await Store.api("createTitolo", "societa", payload);

        Store.invalidate("societa");
        _titles = await Store.get("listTitoli", "societa").catch(() => _titles);
        UI.toast("Titolo salvato", "success");
        renderBody();
        modal.close();
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
        btn.disabled = false;
      }
    }, sig());
  }

  function renderNewsletterTab(container) {
    container.innerHTML = `
      <div style="max-width: 760px;">
        <div class="dash-card" style="padding:var(--sp-4);margin-bottom:var(--sp-3)">
          <p class="dash-card-title" style="margin-bottom:var(--sp-3)">Impostazioni Newsletter</p>
          <p style="font-size:14px;color:var(--color-text-muted);margin-bottom:var(--sp-3)">
            Gestisci le impostazioni relative alla newsletter della società.
          </p>
          <div class="form-group">
            <label class="form-label">Stato Newsletter</label>
            <select id="newsletter-status" class="form-select">
              <option value="active">Attiva</option>
              <option value="inactive">Inattiva</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Email Mittente</label>
            <input id="newsletter-email" class="form-input" type="email" placeholder="newsletter@fusion-erp.it">
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:var(--sp-2)">
            <div id="newsletter-err" class="form-error hidden"></div>
            <button class="btn-dash pink" id="newsletter-save" type="button"><i class="ph ph-floppy-disk"></i> SALVA IMPOSTAZIONI</button>
          </div>
        </div>
      </div>`;

    document.getElementById("newsletter-save")?.addEventListener("click", async () => {
      const btn = document.getElementById("newsletter-save");
      const errEl = document.getElementById("newsletter-err");
      errEl?.classList.add("hidden");
      btn.disabled = true;
      btn.textContent = "Salvataggio...";
      
      try {
        // API TODO: Implement newsletter settings endpoint
        await new Promise(r => setTimeout(r, 1000));
        UI.toast("Impostazioni newsletter salvate", "success");
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
        UI.toast("Errore: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA IMPOSTAZIONI';
      }
    }, sig());
  }

  function renderForesteria(container) {
    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const info = _forestData?.info || {};
    const media = _forestData?.media || [];
    const photos = media.filter(m => m.type === "photo");
    const videos = media.filter(m => m.type === "video");
    const youtubes = media.filter(m => m.type === "youtube");

    const getYTId = (url) => {
      if (!url) return null;
      const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return m ? m[1] : null;
    };

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
        <div class="dash-card" style="padding:var(--sp-4)">
          <p class="dash-card-title" style="margin-bottom:var(--sp-3)"><i class="ph ph-house-line"></i> La Foresteria</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px, 1fr));gap:var(--sp-3)">
            <div>
              <div class="form-group">
                <label class="form-label">Descrizione</label>
                <textarea id="for-desc" class="form-input" rows="5" placeholder="Descrizione della struttura..." style="resize:vertical">${Utils.escapeHtml(info.description || "")}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Indirizzo</label>
                <input class="form-input" type="text" id="for-address" value="${Utils.escapeHtml(info.address || "Via Bazzera 18, 30030 Martellago (VE)")}">
              </div> 
              ${isAdmin ? '<button class="btn-dash pink" id="for-save-desc" type="button"><i class="ph ph-floppy-disk"></i> SALVA DATI</button>' : ""} 
            </div>
            <div>
              <iframe src="https://maps.google.com/maps?q=${encodeURIComponent(info.address || "Via Bazzera 18, 30030 Martellago (VE)")}&output=embed&z=15" width="100%" height="220" style="border:0;border-radius:12px" allowfullscreen loading="lazy"></iframe>
              <p style="font-size:11px;color:var(--color-text-muted);margin-top:4px;text-align:center"><i class="ph ph-map-pin"></i> ${Utils.escapeHtml(info.address || "Via Bazzera 18, 30030 Martellago (VE)")}</p>
            </div>
          </div>
        </div>

        <div class="dash-card" style="padding:var(--sp-4)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3);flex-wrap:wrap;gap:var(--sp-2)">
            <p class="dash-card-title" style="margin:0"><i class="ph ph-images"></i> Media</p> 
            ${isAdmin ? `
              <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">
                <label class="btn-dash pink" style="cursor:pointer">
                  <i class="ph ph-upload-simple"></i> CARICA MEDIA
                  <input type="file" id="for-media-input" accept="image/*,video/*" style="display:none" multiple>
                </label>
                <button class="btn-dash" id="for-add-youtube" type="button"><i class="ph ph-youtube-logo"></i> AGGIUNGI YOUTUBE</button>
              </div>` : ""} 
          </div> 
          
          ${media.length === 0 ? Utils.emptyState("Nessun media", "Carica foto, video o aggiungi un link YouTube della foresteria.") : ""} 
          
          ${photos.length > 0 ? `
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:var(--sp-2)">Foto (${photos.length})</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:var(--sp-2);margin-bottom:var(--sp-3)">
              ${photos.map(ph => `
                <div style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1">
                  <img src="${Utils.escapeHtml(ph.file_path)}" alt="foto" style="width:100%;height:100%;object-fit:cover"> 
                  ${isAdmin ? `<button data-del-media="${Utils.escapeHtml(ph.id)}" class="btn-dash" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);color:#fff;padding:4px" type="button"><i class="ph ph-trash"></i></button>` : ""} 
                </div>`).join("")}
            </div>` : ""} 

          ${videos.length > 0 ? `
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:var(--sp-2)">Video (${videos.length})</p>
            <div style="display:flex;flex-direction:column;gap:var(--sp-2);margin-bottom:var(--sp-3)">
              ${videos.map(v => `
                <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2);background:var(--color-surface-elevated);border-radius:10px">
                  <i class="ph ph-film-strip" style="font-size:24px;color:var(--color-info)"></i>
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:600">${Utils.escapeHtml(v.title || "Video")}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">${Utils.escapeHtml(v.file_path?.split("/").pop() || "")}</div>
                  </div>
                  <a href="${Utils.escapeHtml(v.file_path)}" target="_blank" class="btn-dash"><i class="ph ph-play"></i></a> 
                  ${isAdmin ? `<button data-del-media="${Utils.escapeHtml(v.id)}" class="btn-dash" style="color:var(--color-pink)" type="button"><i class="ph ph-trash"></i></button>` : ""} 
                </div>`).join("")}
            </div>` : ""}

          ${youtubes.length > 0 ? `
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted);margin-bottom:var(--sp-2)">YouTube (${youtubes.length})</p>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
              ${youtubes.map(yt => {
                const vid = getYTId(yt.file_path);
                return `
                  <div style="background:var(--color-surface-elevated);border-radius:12px;overflow:hidden">
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden">
                      ${vid ? `<iframe src="https://www.youtube.com/embed/${vid}" title="Video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>` : '<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted)">Video non disponibile</div>'}
                    </div>
                    <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3)">
                      <i class="ph ph-youtube-logo" style="font-size:20px;color:#FF0000"></i>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${Utils.escapeHtml(yt.title || "Video YouTube")}</div>
                        <a href="${Utils.escapeHtml(yt.file_path)}" target="_blank" style="font-size:11px;color:var(--color-text-muted)">${Utils.escapeHtml(yt.file_path)}</a>
                      </div> 
                      ${isAdmin ? `<button data-del-media="${Utils.escapeHtml(yt.id)}" class="btn-dash" style="color:var(--color-pink)" type="button"><i class="ph ph-trash"></i></button>` : ""} 
                    </div>
                  </div>`;
              }).join("")}
            </div>` : ""}
        </div>
      </div>`;

    document.getElementById("for-save-desc")?.addEventListener("click", async () => {
      const btn = document.getElementById("for-save-desc");
      btn.disabled = true;
      btn.textContent = "Salvataggio...";
      try {
        await Store.api("saveForesteria", "societa", {
          description: document.getElementById("for-desc")?.value || null,
          address: document.getElementById("for-address")?.value || null,
        });
        UI.toast("Dati salvati", "success");
      } catch (err) {
        UI.toast("Errore: " + err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA DATI';
      }
    }, sig());
    
    container.querySelectorAll("[data-del-media]").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await Store.api("deleteForesteriaMedia", "societa", { id: btn.dataset.delMedia });
          Store.invalidate("getForesteria");
          _forestData = await Store.get("getForesteria", "societa").catch(() => _forestData);
          UI.toast("Media rimosso", "success");
          renderBody();
        } catch (err) {
          UI.toast("Errore: " + err.message, "error");
        }
      }, sig());
    });

    document.getElementById("for-media-input")?.addEventListener("change", async (ev) => {
      const files = [...ev.target.files];
      if (!files.length) return;
      const inp = document.getElementById("for-media-input");
      if (inp) inp.disabled = true;
      try {
        for (const f of files) {
          const fd = new FormData();
          fd.append("file", f);
          fd.append("title", f.name);
          await Store.api("uploadForesteriaMedia", "societa", fd);
        }
        Store.invalidate("getForesteria");
        _forestData = await Store.get("getForesteria", "societa").catch(() => _forestData);
        UI.toast(`${files.length} media caricati`, "success");
        renderBody();
      } catch (err) {
        UI.toast("Errore upload: " + err.message, "error");
      } finally {
        if (inp) inp.disabled = false;
      }
    }, sig());

    document.getElementById("for-add-youtube")?.addEventListener("click", () => {
      const modal = UI.modal({
        title: "Aggiungi Link YouTube",
        body: `
          <div class="form-group">
            <label class="form-label">URL Video YouTube *</label>
            <input id="yt-url" class="form-input" type="url" placeholder="https://www.youtube.com/watch?v=...">
          </div>
          <div class="form-group">
            <label class="form-label">Titolo</label>
            <input id="yt-title" class="form-input" type="text" placeholder="es. Tour Foresteria">
          </div>
          <div id="yt-err" class="form-error hidden"></div>`,
        footer: '<button class="btn-dash" id="yt-cancel" type="button">Annulla</button><button class="btn-dash pink" id="yt-save" type="button">AGGIUNGI</button>',
      });
      document.getElementById("yt-cancel")?.addEventListener("click", () => modal.close(), sig());
      document.getElementById("yt-save")?.addEventListener("click", async () => {
        const url = document.getElementById("yt-url")?.value.trim();
        const errEl = document.getElementById("yt-err");
        if (!url) return;
        const btn = document.getElementById("yt-save");
        btn.disabled = true;
        try {
          await Store.api("addForesteriaYoutubeLink", "societa", { url, title: document.getElementById("yt-title")?.value || null });
          Store.invalidate("getForesteria");
          _forestData = await Store.get("getForesteria", "societa").catch(() => _forestData);
          UI.toast("Link YouTube aggiunto", "success");
          renderBody();
          modal.close();
        } catch (err) {
          if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
          btn.disabled = false;
        }
      }, sig());
    }, sig());
  }

  return {
    destroy() {
      _abort.abort();
    },
    async init() {
      const appContainer = document.getElementById("app");
      if (!appContainer) return;

      UI.loading(true);
      appContainer.innerHTML = UI.skeletonPage();
      
      try {
        const route = Router.getCurrentRoute();
        _currentTab = {
          "societa-organigramma": "organigramma",
          "societa-membri": "membri",
          "societa-documenti": "documenti",
          "societa-scadenze": "scadenze",
          "societa-sponsor": "sponsor",
          "societa-titoli": "titoli",
          "societa-newsletter": "newsletter",
          "societa-foresteria": "foresteria"
        }[route] || "identita";

        if (_currentTab === "foresteria") {
          const [forestRes, otherRes] = await Promise.all([
            Store.get("getForesteria", "societa").catch(() => null),
            Promise.all([
              Store.get("getProfile", "societa").catch(() => null),
              Store.get("listRoles", "societa").catch(() => []),
              Store.get("listMembers", "societa").catch(() => []),
              Store.get("listDocuments", "societa").catch(() => []),
              Store.get("listDeadlines", "societa").catch(() => []),
              Store.get("listSponsors", "societa").catch(() => []),
              Store.get("listTitoli", "societa").catch(() => [])
            ])
          ]);
          _forestData = forestRes;
          [_profile, _roles, _members, _documents, _deadlines, _sponsors, _titles] = otherRes;
        } else {
          [_profile, _roles, _members, _documents, _deadlines, _sponsors, _titles] = await Promise.all([
            Store.get("getProfile", "societa").catch(() => null),
            Store.get("listRoles", "societa").catch(() => []),
            Store.get("listMembers", "societa").catch(() => []),
            Store.get("listDocuments", "societa").catch(() => []),
            Store.get("listDeadlines", "societa").catch(() => []),
            Store.get("listSponsors", "societa").catch(() => []),
            Store.get("listTitoli", "societa").catch(() => [])
          ]);
        }

        let title = "Società";
        let subtitle = "Identità, organigramma e documenti societari";
        if (_currentTab === "sponsor") {
          title = "Sponsor";
          subtitle = "Gestione sponsorizzazioni e loghi";
        } else if (_currentTab === "foresteria") {
          title = "La Foresteria";
          subtitle = "Il Club";
        }

        appContainer.innerHTML = `
          <div class="module-wrapper">
            <div class="page-header" style="border-bottom:1px solid var(--color-border);padding:var(--sp-4);padding-bottom:var(--sp-3);margin-bottom:0">
              <h1 class="page-title" style="text-transform:uppercase;">${title}</h1>
              <p class="page-subtitle">${subtitle}</p>
            </div>
            <div class="module-body">
              <main class="module-content" id="soc-tab-content"></main>
            </div>
          </div>`;
        
        renderBody();
      } catch (err) {
        appContainer.innerHTML = Utils.emptyState("Errore caricamento", err.message);
        UI.toast("Errore caricamento Società", "error");
      } finally {
        UI.loading(false);
      }
    }
  };
})();
window.Societa = Societa;

