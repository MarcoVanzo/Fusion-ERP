"use strict";

const AdminCertificates = (() => {
  let abortController = new AbortController();

  async function loadCertificates() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    try {
      const certificates = await Store.get("listCertificates", "admin");
      
      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);">
          <p class="section-label" style="margin:0;">Certificati Medici</p>
          <button class="btn btn-primary btn-sm" id="new-cert-btn" type="button" style="display:flex;align-items:center;gap:8px;">
            <i class="ph ph-plus-circle"></i> AGGIUNGI CERTIFICATO
          </button>
        </div>

        ${certificates.length === 0
          ? Utils.emptyState("Nessun certificato caricato", "Traccia la salute degli atleti caricando il primo certificato.")
          : `<div class="table-wrapper">
              <table class="table" id="certs-table">
                <thead><tr>
                  <th>Atleta</th><th>Data Visita</th><th>Scadenza</th><th>Tipo</th><th>Stato</th><th>Azioni</th>
                </tr></thead>
                <tbody>
                  ${certificates.map((c) => {
                    const isExpired = new Date(c.expiry_date) < new Date();
                    return `
                      <tr>
                        <td><strong>${Utils.escapeHtml(c.athlete_name)}</strong></td>
                        <td>${Utils.formatDate(c.visit_date)}</td>
                        <td>${Utils.formatDate(c.expiry_date)}</td>
                        <td>${Utils.badge(c.certificate_type || "Agonistico", "muted")}</td>
                        <td>${Utils.badge(isExpired ? "Scaduto" : "Valido", isExpired ? "red" : "green")}</td>
                        <td>
                          <div style="display:flex;gap:6px;">
                            ${c.file_path ? `<a href="storage/certs/${Utils.escapeHtml(c.file_path)}" target="_blank" class="btn btn-ghost btn-sm" title="Vedi certificato"><i class="ph ph-eye"></i></a>` : ""}
                            <button class="btn btn-ghost btn-sm cert-delete" data-id="${Utils.escapeHtml(c.id)}" style="color:var(--color-error);"><i class="ph ph-trash"></i></button>
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
    } catch (_err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento certificati", err.message);
    }
  }

  function bindEvents() {
    document.getElementById("new-cert-btn")?.addEventListener("click", openCreateModal, { signal: abortController.signal });

    Utils.qsa(".cert-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Sei sicuro di voler eliminare questo certificato?")) return;
        try {
          await Store.api("deleteCertificate", "admin", { id: btn.dataset.id });
          UI.toast("Certificato eliminato", "success");
          Store.invalidate("admin", "listCertificates");
          await loadCertificates();
        } catch (_err) {
          UI.toast("Errore: " + err.message, "error");
        }
      }, { signal: abortController.signal });
    });
  }

  function openCreateModal() {
    const modal = UI.modal({
      title: "Aggiungi Certificato Medico",
      body: `
        <div class="form-group">
          <label class="form-label" for="c-athlete">ID Atleta *</label>
          <input id="c-athlete" class="form-input" type="text" placeholder="ATL_xxxx">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="c-visit">Data Visita *</label>
            <input id="c-visit" class="form-input" type="date">
          </div>
          <div class="form-group">
            <label class="form-label" for="c-expiry">Data Scadenza *</label>
            <input id="c-expiry" class="form-input" type="date">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="c-type">Tipo Certificato</label>
          <select id="c-type" class="form-select">
            <option value="Agonistico">Agonistico</option>
            <option value="Non Agonistico">Non Agonistico</option>
            <option value="Sano e robusto">Sano e Robusto</option>
          </select>
        </div>
        <div id="c-error" class="form-error hidden"></div>`,
      footer: `
        <button class="btn btn-ghost btn-sm" id="c-cancel" type="button">Annulla</button>
        <button class="btn btn-primary btn-sm" id="c-save" type="button">SALVA</button>`,
    });

    document.getElementById("c-cancel").addEventListener("click", () => modal.close(), { signal: abortController.signal });
    document.getElementById("c-save").addEventListener("click", async () => {
      const athlete = document.getElementById("c-athlete").value.trim();
      const visit = document.getElementById("c-visit").value;
      const expiry = document.getElementById("c-expiry").value;
      const type = document.getElementById("c-type").value;
      const errEl = document.getElementById("c-error");

      if (!athlete || !visit || !expiry) {
        errEl.textContent = "Compila tutti i campi obbligatori";
        errEl.classList.remove("hidden");
        return;
      }

      try {
        await Store.api("saveCertificate", "admin", {
          athlete_id: athlete,
          visit_date: visit,
          expiry_date: expiry,
          certificate_type: type
        });
        UI.toast("Certificato salvato", "success");
        Store.invalidate("admin", "listCertificates");
        await loadCertificates();
        modal.close();
      } catch (_err) {
        errEl.textContent = err.message;
        errEl.classList.remove("hidden");
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
              <h1 class="page-title">Amministrazione - Certificati</h1>
              <p class="page-subtitle">Verifica e gestione scadenze mediche</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadCertificates();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminCertificates = AdminCertificates;
