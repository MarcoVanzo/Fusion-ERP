const Scouting = (() => {
  let abortController = new AbortController();
  let athletes = [];
  let lastSync = null;

  function renderTable(container) {
    const canEdit = ["admin", "manager", "allenatore"].includes(
      App.getUser()?.role,
    );

    container.innerHTML = `
            <div style="width: 100%; display: flex; flex-direction: column;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-3)">
                    <div style="display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap">
                        <div class="input-wrapper" style="position:relative;min-width:220px">
                            <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px"></i>
                            <input type="text" id="scouting-search" class="form-input" placeholder="Cerca per nome, cognome..." style="padding-left:36px;height:42px;font-size:13px;background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.1);color:#fff;">
                        </div>
                        <span id="scouting-count" class="status-badge" style="background:var(--color-primary-light);color:var(--color-primary);font-weight:600">${athletes.length} atleti</span>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                        ${
                          canEdit
                            ? `
                            <button class="btn-dash" id="scouting-sync-btn" type="button" title="Sincronizza da Cognito Forms">
                                <i class="ph ph-arrows-clockwise" style="font-size:18px;"></i> Sincronizza
                            </button>
                            <button class="btn-dash pink" id="scouting-add-btn" type="button">
                                <i class="ph ph-plus-circle" style="font-size:18px;"></i> NUOVO INSERIMENTO
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
                <div id="scouting-sync-status" style="margin-bottom:var(--sp-2);display:${lastSync ? "block" : "none"}">
                    ${
                      lastSync
                        ? `<span style="font-size:12px;color:var(--color-text-muted)">
                        <i class="ph ph-clock" style="font-size:12px"></i>
                        Ultimo sync Cognito: ${new Date(lastSync).toLocaleString("it-IT")}
                    </span>`
                        : ""
                    }
                </div>
                <div class="table-wrapper" style="overflow-x:auto">
                    <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px">
                        <thead>
                            <tr>
                                ${["Nome", "Cognome", "Società", "Anno Nascita", "Note", "Rilevatore", "Data", "Fonte"].map((h) => `<th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted)">${h}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody id="scouting-tbody">
                            ${renderRows(athletes)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    document
      .getElementById("scouting-search")
      ?.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = athletes.filter(
          (a) =>
            (a.nome && a.nome.toLowerCase().includes(term)) ||
            (a.cognome && a.cognome.toLowerCase().includes(term)) ||
            (a.societa_appartenenza &&
              a.societa_appartenenza.toLowerCase().includes(term)),
        );
        const tbody = document.getElementById("scouting-tbody");
        if (tbody) {
          tbody.innerHTML = renderRows(filtered);
        }
        const countBadge = document.getElementById("scouting-count");
        if (countBadge) countBadge.textContent = `${filtered.length} atleti`;
      }, { signal: abortController.signal });

    document
      .getElementById("scouting-add-btn")
      ?.addEventListener("click", () => {
        openSidePanel();
      }, { signal: abortController.signal });

    document
      .getElementById("scouting-sync-btn")
      ?.addEventListener("click", () => {
        doSync();
      }, { signal: abortController.signal });

    const tbody = document.getElementById("scouting-tbody");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const btn = e.target.closest(".edit-athlete-btn");
        if (btn) {
          const id = parseInt(btn.dataset.id, 10);
          const athlete = athletes.find((a) => a.id === id);
          if (athlete) {
            openSidePanel(athlete);
          }
        }
      }, { signal: abortController.signal });
    }
  }

  function renderRows(data) {
    if (data.length === 0) {
      return '<tr><td colspan="8" style="text-align:center;padding:var(--sp-4);color:var(--color-text-muted)">Nessun atleta trovato nel database scouting.</td></tr>';
    }

    return data
      .map((athlete) => {
        const sourceMap = {
          manual: {
            bg: "var(--color-bg-alt)",
            color: "var(--color-text-muted)",
            label: "Manuale",
          },
          cognito_fusion: {
            bg: "rgba(99,102,241,0.12)",
            color: "#818cf8",
            label: "Fusion",
          },
          cognito_network: {
            bg: "rgba(245,158,11,0.12)",
            color: "#f59e0b",
            label: "Network",
          },
        };
        const src = sourceMap[athlete.source] || {
          bg: "var(--color-bg-alt)",
          color: "var(--color-text-muted)",
          label: athlete.source || "—",
        };

        return `
                <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(athlete.nome || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600">${Utils.escapeHtml(athlete.cognome || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(athlete.societa_appartenenza || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${athlete.anno_nascita || "—"}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${Utils.escapeHtml(athlete.note || "")}">${Utils.escapeHtml(athlete.note || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">${Utils.escapeHtml(athlete.rilevatore || "—")}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px">${athlete.data_rilevazione || "—"}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border)">
                        <span class="status-badge" style="background:${src.bg};color:${src.color}">${src.label} ${athlete.is_locked_edit == 1 ? '<i class="ph ph-lock-key" title="Modificato manualmente" style="margin-left:4px"></i>' : ""}</span>
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right">
                        ${
                          ["admin", "manager", "allenatore"].includes(
                            App.getUser()?.role,
                          )
                            ? `
                            <button class="btn btn-icon btn-ghost btn-sm edit-athlete-btn" data-id="${athlete.id}" title="Modifica">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                        `
                            : ""
                        }
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  async function doSync() {
    const btn = document.getElementById("scouting-sync-btn");
    const statusEl = document.getElementById("scouting-sync-status");

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Sincronizzazione…';
    }
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.innerHTML =
        '<span style="font-size:12px;color:var(--color-warning)"><i class="ph ph-arrows-clockwise"></i> Sincronizzazione in corso…</span>';
    }

    try {
      const res = await Store.api("syncFromCognito", "scouting", {});
      const total = res.total || 0;
      const now = new Date().toLocaleString("it-IT");

      if (statusEl) {
        statusEl.innerHTML = `<span style="font-size:12px;color:var(--color-success)">✅ Sincronizzati ${total} atleti — ${now}</span>`;
      }

      UI.toast(
        `Sincronizzazione completata: ${total} atleti importati`,
        "success",
      );
      Store.invalidate("scouting");
      await refreshData();
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="font-size:12px;color:var(--color-pink)">⚠️ ${err.message}</span>`;
      }
      UI.toast("Errore: " + err.message, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML =
          '<i class="ph ph-arrows-clockwise"></i> Sincronizza da Cognito';
      }
    }
  }

  function openSidePanel(athlete = null) {
    const isEdit = athlete !== null;
    const panel = document.getElementById("scouting-side-panel");
    if (!panel) return;

    panel.innerHTML = `
            <div style="padding:var(--sp-3) var(--sp-4); border-bottom:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; background:var(--color-bg);">
                <h3 style="margin:0; font-size:16px; font-weight:600;">${isEdit ? "Modifica Atleta" : "Nuovo Atleta"}</h3>
                <button class="btn btn-icon btn-ghost btn-sm" id="sc-cancel-panel" title="Chiudi">
                    <i class="ph ph-x"></i>
                </button>
            </div>
            <div style="padding:var(--sp-4); flex-grow:1; overflow-y:auto;">
                ${isEdit ? '<div class="banner banner-warning" style="margin-bottom:var(--sp-4);font-size:12px;display:flex;align-items:center;gap:8px"><i class="ph ph-warning-circle" style="font-size:16px"></i> Salvando le modifiche questo record verrà bloccato e non sarà più sovrascritto dalla sync di Cognito.</div>' : ""}
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-nome">Nome *</label>
                        <input id="sc-nome" class="form-input" type="text" value="${isEdit ? Utils.escapeHtml(athlete.nome || "") : ""}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-cognome">Cognome *</label>
                        <input id="sc-cognome" class="form-input" type="text" value="${isEdit ? Utils.escapeHtml(athlete.cognome || "") : ""}" required>
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-societa">Società</label>
                        <input id="sc-societa" class="form-input" type="text" value="${isEdit ? Utils.escapeHtml(athlete.societa_appartenenza || "") : ""}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-anno">Nascita</label>
                        <input id="sc-anno" class="form-input" type="number" min="1990" max="2020" value="${isEdit ? athlete.anno_nascita || "" : ""}">
                    </div>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="sc-rilevatore">Rilevatore</label>
                        <input id="sc-rilevatore" class="form-input" type="text" placeholder="Nome" value="${isEdit ? Utils.escapeHtml(athlete.rilevatore || "") : ""}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="sc-data">Data</label>
                        <input id="sc-data" class="form-input" type="date" value="${isEdit && athlete.data_rilevazione ? athlete.data_rilevazione : new Date().toISOString().substring(0, 10)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="sc-note">Note</label>
                    <textarea id="sc-note" class="form-input" rows="4">${isEdit ? Utils.escapeHtml(athlete.note || "") : ""}</textarea>
                </div>
                <div id="sc-error" class="form-error hidden"></div>
            </div>
            <div style="padding:var(--sp-3) var(--sp-4); border-top:1px solid var(--color-border); background:var(--color-bg); display:flex; justify-content:flex-end; gap:var(--sp-2);">
                <button class="btn btn-ghost btn-sm" id="sc-cancel-panel-btn" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="sc-save-panel" type="button"><i class="ph ph-floppy-disk"></i> SALVA</button>
            </div>
        `;

    panel.style.display = "flex";

    const closeModal = () => {
      panel.style.display = "none";
      panel.innerHTML = "";
    };

    document
      .getElementById("sc-cancel-panel")
      ?.addEventListener("click", closeModal, { signal: abortController.signal });
    document
      .getElementById("sc-cancel-panel-btn")
      ?.addEventListener("click", closeModal, { signal: abortController.signal });

    document
      .getElementById("sc-save-panel")
      ?.addEventListener("click", async () => {
        const errorDiv = document.getElementById("sc-error");
        const saveBtn = document.getElementById("sc-save-panel");

        const payload = {
          id: isEdit ? athlete.id : undefined,
          nome: document.getElementById("sc-nome")?.value.trim(),
          cognome: document.getElementById("sc-cognome")?.value.trim(),
          societa_appartenenza: document
            .getElementById("sc-societa")
            ?.value.trim(),
          anno_nascita: document.getElementById("sc-anno")?.value,
          rilevatore: document.getElementById("sc-rilevatore")?.value.trim(),
          data_rilevazione: document.getElementById("sc-data")?.value,
          note: document.getElementById("sc-note")?.value.trim(),
        };

        if (!payload.nome || !payload.cognome) {
          errorDiv.textContent = "Nome e cognome sono obbligatori.";
          errorDiv.classList.remove("hidden");
          return;
        }

        try {
          saveBtn.disabled = true;
          saveBtn.innerHTML =
            '<i class="ph ph-spinner ph-spin"></i> Salvataggio...';

          if (isEdit) {
            await Store.api("updateEntry", "scouting", payload);
          } else {
            await Store.api("addManualEntry", "scouting", payload);
          }

          Store.invalidate("scouting");
          UI.toast(
            isEdit
              ? "Modifiche salvate con successo"
              : "Atleta salvato con successo",
            "success",
          );
          closeModal();
          await refreshData();
        } catch (err) {
          errorDiv.textContent =
            err.message || "Errore durante il salvataggio.";
          errorDiv.classList.remove("hidden");
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> SALVA';
        }
      });
  }

  async function refreshData() {
    try {
      const result = await Store.get("listDatabase", "scouting");
      athletes = result.entries || result || [];
      lastSync = result.last_sync || null;
      const container = document.getElementById("scouting-content-area");
      if (container) {
        renderTable(container);
      }
    } catch (err) {
      UI.toast("Errore nel caricamento del database", "error");
    }
  }

  return {
    async init() {
      const container = document.getElementById("app");
      if (!container) return;

      UI.loading(true);
      container.innerHTML = UI.skeletonPage();

      try {
        const result = await Store.get("listDatabase", "scouting");
        athletes = result.entries || result || [];
        lastSync = result.last_sync || null;

        container.innerHTML = `
                    <div class="transport-dashboard">
                        <div class="dash-top-bar" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px; margin-bottom: 24px;">
                            <div>
                                <h1 class="dash-title">Database <span style="color:var(--accent-pink);">Scouting</span></h1>
                                <p class="dash-subtitle">Contatti e atleti segnalati manualmente o via Cognito Forms</p>
                            </div>
                        </div>
                        <div class="dash-card" style="padding:var(--sp-4)" id="scouting-content-area">
                        </div>
                    </div>
                `;

        renderTable(document.getElementById("scouting-content-area"));
      } catch (err) {
        container.innerHTML = Utils.emptyState(
          "Errore di caricamento",
          err.message,
        );
        UI.toast("Impossibile caricare il database scouting", "error");
      } finally {
        UI.loading(false);
      }
    },

    destroy() {
      abortController.abort();
      abortController = new AbortController();
      athletes = [];
      lastSync = null;
    },
  };
})();

window.Scouting = Scouting;
