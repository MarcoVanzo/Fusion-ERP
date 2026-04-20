"use strict";

const AdminContracts = (() => {
  let abortController = new AbortController();

  async function loadContracts() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    try {
      const contracts = await Store.get("listContracts", "admin");
      
      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);">
          <p class="section-label" style="margin:0;">Contratti Collaboratori</p>
          <button class="btn btn-primary btn-sm" id="new-contract-btn" type="button" style="display:flex;align-items:center;gap:8px;">
            <i class="ph ph-file-doc"></i> GENERA CONTRATTO
          </button>
        </div>

        ${contracts.length === 0
          ? Utils.emptyState("Nessun contratto generato", "Genera il primo contratto per un collaboratore sportivo.")
          : `<div class="table-wrapper">
              <table class="table" id="contracts-table">
                <thead><tr>
                  <th>Collaboratore</th><th>Ruolo</th><th>Validità</th><th>Compenso</th><th>Stato</th><th>Azioni</th>
                </tr></thead>
                <tbody>
                  ${contracts.map((c) => {
                    const statusClass = c.status === "signed" ? "green" : c.status === "expired" ? "red" : "muted";
                    return `
                      <tr>
                        <td><strong>${Utils.escapeHtml(c.user_name)}</strong><br><span style="font-size:11px;color:var(--color-text-muted);">${Utils.escapeHtml(c.user_email)}</span></td>
                        <td style="font-size:12px;">${Utils.escapeHtml(c.role_description || "—")}</td>
                        <td style="font-size:12px;">${Utils.formatDate(c.valid_from)} → ${Utils.formatDate(c.valid_to)}</td>
                        <td>${c.monthly_fee_eur ? Utils.formatCurrency(c.monthly_fee_eur) + "/mese" : "Gratuito"}</td>
                        <td>${Utils.badge(c.status, statusClass)}</td>
                        <td>
                          <div style="display:flex;gap:6px;">
                            ${c.pdf_path ? `<a href="storage/pdfs/${Utils.escapeHtml(c.pdf_path)}" target="_blank" class="btn btn-ghost btn-sm" title="Vedi PDF"><i class="ph ph-file-pdf"></i></a>` : ""}
                            <button class="btn btn-ghost btn-sm contract-delete" data-id="${Utils.escapeHtml(c.id)}" style="color:var(--color-error);"><i class="ph ph-trash"></i></button>
                          </div>
                        </td>
                      </tr>`;
                  }).join("")}
                </tbody>
              </table>
            </div>`
        }
      `;

      bindEvents();
    } catch (err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento contratti", err.message);
    }
  }

  function bindEvents() {
    document.getElementById("new-contract-btn")?.addEventListener("click", openCreateModal, { signal: abortController.signal });

    Utils.qsa(".contract-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Sei sicuro di voler eliminare questo contratto?")) return;
        try {
          await Store.api("deleteContract", "admin", { id: btn.dataset.id });
          UI.toast("Contratto eliminato", "success");
          Store.invalidate("admin", "listContracts");
          await loadContracts();
        } catch (err) {
          UI.toast("Errore: " + err.message, "error");
        }
      }, { signal: abortController.signal });
    });
  }

  function openCreateModal() {
    const modal = UI.modal({
      title: "Genera Contratto Collaboratore",
      body: `
        <div class="form-group">
          <label class="form-label" for="ctr-user">ID Utente collaboratore *</label>
          <input id="ctr-user" class="form-input" type="text" placeholder="USR_xxxx">
        </div>
        <div class="form-group">
          <label class="form-label" for="ctr-role">Descrizione ruolo/mansione *</label>
          <textarea id="ctr-role" class="form-textarea" placeholder="Allenatore Settore Giovanile U14..." style="min-height:80px;"></textarea>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="ctr-from">Inizio validità *</label>
            <input id="ctr-from" class="form-input" type="date">
          </div>
          <div class="form-group">
            <label class="form-label" for="ctr-to">Fine validità *</label>
            <input id="ctr-to" class="form-input" type="date">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ctr-fee">Compenso mensile (€) — vuoto = gratuito</label>
          <input id="ctr-fee" class="form-input" type="number" min="0" step="0.01" placeholder="500.00">
        </div>
        <div id="ctr-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="ctr-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="ctr-save" type="button">GENERA & SCARICA PDF</button>`,
    });

    document.getElementById("ctr-cancel").addEventListener("click", () => modal.close(), { signal: abortController.signal });
    document.getElementById("ctr-save").addEventListener("click", async () => {
      const user = document.getElementById("ctr-user").value.trim();
      const role = document.getElementById("ctr-role").value.trim();
      const from = document.getElementById("ctr-from").value;
      const to = document.getElementById("ctr-to").value;
      const fee = document.getElementById("ctr-fee").value;
      const errEl = document.getElementById("ctr-error");

      if (!user || !role || !from || !to) {
        errEl.textContent = "Compila tutti i campi obbligatori";
        errEl.classList.remove("hidden");
        return;
      }

      const saveBtn = document.getElementById("ctr-save");
      saveBtn.disabled = true;
      saveBtn.textContent = "Generazione PDF...";

      try {
        await Store.api("generateContract", "admin", {
          user_id: user,
          role_description: role,
          valid_from: from,
          valid_to: to,
          monthly_fee_eur: fee || null,
        });
        UI.toast("Contratto generato", "success");
        Store.invalidate("admin", "listContracts");
        await loadContracts();
        modal.close();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
        saveBtn.disabled = false;
        saveBtn.textContent = "GENERA & SCARICA PDF";
      }
    }, { signal: abortController.signal });
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
              <h1 class="page-title">Amministrazione - Contratti</h1>
              <p class="page-subtitle">Generazione e gestione contratti collaboratori</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadContracts();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminContracts = AdminContracts;
