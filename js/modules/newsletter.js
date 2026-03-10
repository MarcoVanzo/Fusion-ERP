"use strict";
const Newsletter = (() => {
    let _controller = new AbortController();

    function sig() { return { signal: _controller.signal }; }

    function render() {
        const app = document.getElementById("app");
        if (!app) return;

        const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);

        app.innerHTML = `
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title"><i class="ph ph-envelope-simple"></i> Newsletter</h1>
                    <p class="page-subtitle">Gestisci iscritti, campagne e comunicazioni via email.</p>
                </div>
                ${isAdmin ? `
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-new-campaign" type="button">
                        <i class="ph ph-plus"></i> NUOVA CAMPAGNA
                    </button>
                </div>` : ""}
            </div>

            <div class="stats-grid" style="margin-bottom: var(--sp-4);">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--color-primary-soft); color: var(--color-primary);">
                        <i class="ph ph-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Iscritti Totali</div>
                        <div class="stat-value" id="nl-total-subscribers">—</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--color-success-soft); color: var(--color-success);">
                        <i class="ph ph-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Iscritti Attivi</div>
                        <div class="stat-value" id="nl-active-subscribers">—</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(245,158,11,0.15); color: #f59e0b;">
                        <i class="ph ph-paper-plane-tilt"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Campagne Inviate</div>
                        <div class="stat-value" id="nl-campaigns-sent">—</div>
                    </div>
                </div>
            </div>

            <div class="card no-tilt" style="margin-bottom: var(--sp-4);">
                <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <h2 class="card-title"><i class="ph ph-users-three"></i> Iscritti</h2>
                    ${isAdmin ? `
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-default btn-sm" id="btn-nl-export" type="button">
                            <i class="ph ph-download-simple"></i> Esporta CSV
                        </button>
                        <button class="btn btn-primary btn-sm" id="btn-nl-add-subscriber" type="button">
                            <i class="ph ph-plus"></i> Aggiungi
                        </button>
                    </div>` : ""}
                </div>
                <div id="nl-subscribers-content" style="padding: var(--sp-4);">
                    <div style="text-align:center; color:var(--color-text-muted); padding:40px 0;">
                        <i class="ph ph-users" style="font-size:40px; margin-bottom:12px; display:block; opacity:0.4;"></i>
                        <p style="margin-bottom:8px; font-weight:600;">Nessun iscritto</p>
                        <p style="font-size:13px;">Gli iscritti alla newsletter appariranno qui una volta configurato il backend.</p>
                    </div>
                </div>
            </div>

            <div class="card no-tilt">
                <div class="card-header">
                    <h2 class="card-title"><i class="ph ph-envelope-open"></i> Campagne Recenti</h2>
                </div>
                <div style="padding: var(--sp-4);">
                    <div style="text-align:center; color:var(--color-text-muted); padding:40px 0;">
                        <i class="ph ph-paper-plane-tilt" style="font-size:40px; margin-bottom:12px; display:block; opacity:0.4;"></i>
                        <p style="margin-bottom:8px; font-weight:600;">Nessuna campagna</p>
                        <p style="font-size:13px;">Le campagne email inviate appariranno qui.</p>
                    </div>
                </div>
            </div>
        `;

        // Placeholder stats
        setTimeout(() => {
            const el = id => document.getElementById(id);
            if (el("nl-total-subscribers")) el("nl-total-subscribers").textContent = "0";
            if (el("nl-active-subscribers")) el("nl-active-subscribers").textContent = "0";
            if (el("nl-campaigns-sent")) el("nl-campaigns-sent").textContent = "0";
        }, 100);

        if (isAdmin) {
            document.getElementById("btn-new-campaign")?.addEventListener("click", () => {
                UI.toast("Funzionalità campagne in arrivo", "info");
            }, sig());

            document.getElementById("btn-nl-add-subscriber")?.addEventListener("click", () => {
                openAddSubscriberModal();
            }, sig());

            document.getElementById("btn-nl-export")?.addEventListener("click", () => {
                UI.toast("Export CSV disponibile dopo configurazione backend", "info");
            }, sig());
        }
    }

    function openAddSubscriberModal() {
        const modal = UI.modal({
            title: "Nuovo Iscritto",
            body: `
                <div class="form-group">
                    <label class="form-label" for="nl-sub-name">Nome</label>
                    <input id="nl-sub-name" class="form-input" type="text" placeholder="Mario Rossi">
                </div>
                <div class="form-group">
                    <label class="form-label" for="nl-sub-email">Email *</label>
                    <input id="nl-sub-email" class="form-input" type="email" placeholder="mario@esempio.it">
                </div>
                <div id="nl-sub-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn btn-ghost btn-sm" id="nl-sub-cancel" type="button">Annulla</button>
                <button class="btn btn-primary btn-sm" id="nl-sub-save" type="button">AGGIUNGI</button>
            `
        });

        document.getElementById("nl-sub-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("nl-sub-save")?.addEventListener("click", () => {
            const email = document.getElementById("nl-sub-email")?.value.trim();
            const errEl = document.getElementById("nl-sub-error");
            if (!email || !email.includes("@")) {
                errEl.textContent = "Inserisci un indirizzo email valido";
                errEl.classList.remove("hidden");
                return;
            }
            UI.toast("Iscritto aggiunto (backend non ancora configurato)", "info");
            modal.close();
        });
    }

    return {
        init() {
            _controller = new AbortController();
            render();
        },
        destroy() {
            _controller.abort();
            _controller = new AbortController();
        }
    };
})();

window.Newsletter = Newsletter;
