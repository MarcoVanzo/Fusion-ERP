"use strict";

const AdminSettings = (() => {
  let abortController = new AbortController();

  async function loadSettings() {
    const container = document.getElementById("admin-content");
    if (!container) return;

    container.innerHTML = `<div style="padding:var(--sp-4);text-align:center;color:var(--color-text-muted);">Caricamento impostazioni…</div>`;

    try {
      const res = await Store.get("current", "tenant"); // Assuming Store.get handles the fetch/json/success check
      const settings = (res && res.settings) ? res.settings : (res || {});

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);">
          <p class="section-label" style="margin:0;">Impostazioni Generali</p>
          <button class="btn btn-primary btn-sm" id="save-settings-btn" type="button" style="display:flex;align-items:center;gap:8px;">
            <i class="ph ph-floppy-disk"></i> SALVA IMPOSTAZIONI
          </button>
        </div>

        <div class="card" style="margin-bottom:var(--sp-4);">
          <form id="tenant-settings-form">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
              <div class="form-group" style="grid-column:1/-1;">
                <label class="form-label" for="setting_club_name">Nome Società Sportiva / Ente</label>
                <input type="text" id="setting_club_name" name="club_name" class="form-input" value="${Utils.escapeHtml(settings.club_name || "")}">
              </div>
              
              <div class="form-group">
                <label class="form-label" for="setting_sport_type">Sport Principale</label>
                <input type="text" id="setting_sport_type" name="sport_type" class="form-input" value="${Utils.escapeHtml(settings.sport_type || "")}">
              </div>

              <div class="form-group">
                <label class="form-label" for="setting_federation">Federazione / Ente di Promozione</label>
                <input type="text" id="setting_federation" name="federation" class="form-input" value="${Utils.escapeHtml(settings.federation || "")}">
              </div>

              <div class="form-group">
                <label class="form-label" for="setting_season_format">Stagione Attuale (es. 2025-2026)</label>
                <input type="text" id="setting_season_format" name="season_format" class="form-input" value="${Utils.escapeHtml(settings.season_format || "")}">
              </div>

              <div class="form-group">
                <label class="form-label" for="setting_legal_form">Forma Giuridica (es. ASD, SSD)</label>
                <input type="text" id="setting_legal_form" name="legal_form" class="form-input" value="${Utils.escapeHtml(settings.legal_form || "")}">
              </div>

              <div class="form-group">
                <label class="form-label" for="setting_primary_color">Colore Principale Brand (Hex)</label>
                <div style="display:flex;gap:10px;">
                  <input type="color" id="setting_primary_color_picker" class="form-input" style="width:50px;padding:2px;height:42px;cursor:pointer;" value="${Utils.escapeHtml(settings.primary_color || "#FF00FF")}">
                  <input type="text" id="setting_primary_color" name="primary_color" class="form-input" value="${Utils.escapeHtml(settings.primary_color || "#FF00FF")}" style="flex:1;font-family:monospace;">
                </div>
              </div>

              <div class="form-group" style="display:flex;flex-direction:column;justify-content:flex-end;">
                  <label class="form-label">Piano in Uso</label>
                  <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid var(--color-border);border-radius:var(--radius);font-weight:600;display:flex;align-items:center;gap:8px;">
                      <i class="ph ph-crown" style="color:var(--color-warning);"></i>
                      <span style="text-transform:uppercase;">${Utils.escapeHtml(settings.plan_tier || "PRO")}</span>
                  </div>
              </div>

              <div class="form-group">
                <label class="form-label">Limite Squadre</label>
                <input type="text" class="form-input" disabled value="${Utils.escapeHtml(settings.max_teams || "20")}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Limite Atleti</label>
                <input type="text" class="form-input" disabled value="${Utils.escapeHtml(settings.max_athletes || "500")}">
              </div>
            </div>
          </form>
        </div>
      `;

      bindEvents();
    } catch (err) {
      if (err.name === 'AbortError') return;
      container.innerHTML = Utils.emptyState("Errore caricamento impostazioni", err.message);
    }
  }

  function bindEvents() {
    const picker = document.getElementById("setting_primary_color_picker");
    const input = document.getElementById("setting_primary_color");
    const saveBtn = document.getElementById("save-settings-btn");
    const form = document.getElementById("tenant-settings-form");

    picker?.addEventListener("input", (e) => {
      if (input) input.value = e.target.value.toUpperCase();
    }, { signal: abortController.signal });

    input?.addEventListener("input", (e) => {
      if (picker && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
        picker.value = e.target.value;
      }
    }, { signal: abortController.signal });

    saveBtn?.addEventListener("click", async () => {
      saveBtn.disabled = true;
      const originalHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> SALVATAGGIO...';

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const _res = await Store.api("updateSettings", "tenant", data);
        UI.toast("Impostazioni aggiornate con successo", "success");
        
        if (data.primary_color) {
          document.documentElement.style.setProperty("--color-pink", data.primary_color);
        }
        
        Store.invalidate("tenant");
      } catch (err) {
        UI.toast(err.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHtml;
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
              <h1 class="page-title">Amministrazione - Impostazioni</h1>
              <p class="page-subtitle">Configurazione tenant e branding</p>
            </div>
          </div>
          <div class="page-body">
            <div id="admin-content">
              ${UI.skeletonPage()}
            </div>
          </div>`;
        await loadSettings();
      }
    },
    destroy: function () {
      abortController.abort();
      abortController = new AbortController();
    }
  };
})();

window.AdminSettings = AdminSettings;
