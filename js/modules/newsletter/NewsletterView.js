// js/modules/newsletter/NewsletterView.js
import { _NewsletterAPI } from './NewsletterAPI.js';

export const NewsletterView = {
    renderEmptyConfig() {
        return `
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title"><i class="ph ph-envelope-simple"></i> Newsletter</h1>
                    <p class="page-subtitle">Gestisci iscritti e comunicazioni tramite MailerLite.</p>
                </div>
            </div>
            <div class="dash-card" style="max-width:600px;margin:0 auto;padding:var(--sp-5);text-align:center;">
                <i class="ph ph-plug" style="font-size:48px;color:var(--color-text-muted);margin-bottom:16px;display:block;opacity:0.5;"></i>
                <h2 style="margin-bottom:8px;font-size:18px;">MailerLite non configurato</h2>
                <p style="color:var(--color-text-muted);font-size:14px;margin-bottom:var(--sp-3);">
                    Per abilitare la newsletter aggiungi la chiave API nel file <code>.env</code> del server:
                </p>
                <pre style="background:var(--color-surface-raised);border:1px solid var(--color-border);border-radius:8px;padding:var(--sp-3);font-size:13px;text-align:left;overflow-x:auto;">MAILERLITE_API_KEY=ml.xxxxxxxxxxxxxxxx</pre>
                <p style="color:var(--color-text-muted);font-size:13px;margin-top:var(--sp-3);">
                    Ottieni la chiave su <a href="https://dashboard.mailerlite.com/integrations/api" target="_blank" style="color:var(--color-primary);">dashboard.mailerlite.com</a>
                </p>
            </div>`;
    },

    renderDashboard(state, isAdmin) {
        const { stats, filter, nextCursor } = state;
        return `
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title"><i class="ph ph-envelope-simple"></i> Newsletter</h1>
                    <p class="page-subtitle">Gestisci iscritti, campagne e comunicazioni via email con MailerLite.</p>
                </div>
                ${isAdmin ? `
                <div class="page-actions">
                    <a href="https://dashboard.mailerlite.com/campaigns" target="_blank" class="btn btn-default" style="text-decoration: none;">
                        <i class="ph ph-paper-plane-right"></i> Crea Newsletter in MailerLite
                    </a>
                    <button class="btn btn-default" id="btn-nl-groups" type="button">
                        <i class="ph ph-squares-four"></i> Gestisci Gruppi
                    </button>
                    <button class="btn-dash pink" id="btn-nl-add-subscriber" type="button">
                        <i class="ph ph-plus"></i> AGGIUNGI ISCRITTO
                    </button>
                </div>` : ""}
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom:var(--sp-4);">
                <div class="dash-stat-card">
                    <div class="dash-stat-title">
                        Iscritti Totali
                        <div class="dash-stat-icon" style="background:var(--color-primary-soft);color:var(--color-primary);">
                            <i class="ph ph-users"></i>
                        </div>
                    </div>
                    <div class="dash-stat-value">${stats.total.toLocaleString("it-IT")}</div>
                </div>
                <div class="dash-stat-card green">
                    <div class="dash-stat-title">
                        Attivi
                        <div class="dash-stat-icon" style="background:var(--color-success-soft);color:var(--color-success);">
                            <i class="ph ph-check-circle"></i>
                        </div>
                    </div>
                    <div class="dash-stat-value">${stats.active.toLocaleString("it-IT")}</div>
                </div>
                <div class="dash-stat-card yellow">
                    <div class="dash-stat-title">
                        Disiscritti
                        <div class="dash-stat-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b;">
                            <i class="ph ph-x-circle"></i>
                        </div>
                    </div>
                    <div class="dash-stat-value">${stats.unsubscribed.toLocaleString("it-IT")}</div>
                </div>
                <div class="dash-stat-card cyan">
                    <div class="dash-stat-title">
                        Da Confermare
                        <div class="dash-stat-icon" style="background:rgba(0,229,255,0.1);color:var(--accent-cyan);">
                            <i class="ph ph-warning-circle"></i>
                        </div>
                    </div>
                    <div class="dash-stat-value">${(stats.unconfirmed || 0).toLocaleString("it-IT")}</div>
                </div>
            </div>

            ${this.renderCampaignsCard(state.campaigns)}

            <div class="dash-card">
                <div style="margin-bottom:16px;" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <h2 class="dash-card-title"><i class="ph ph-users-three"></i> Iscritti</h2>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <div class="dash-filters" id="nl-status-filter">
                            <button class="dash-filter ${filter.status === "active" ? "active" : ""}" data-nl-status="active" type="button">Attivi</button>
                            <button class="dash-filter ${filter.status === "unconfirmed" ? "active" : ""}" data-nl-status="unconfirmed" type="button">Da confermare</button>
                            <button class="dash-filter ${filter.status === "unsubscribed" ? "active" : ""}" data-nl-status="unsubscribed" type="button">Disiscritti</button>
                            <button class="dash-filter ${filter.status === "bounced" ? "active" : ""}" data-nl-status="bounced" type="button">Bounce</button>
                        </div>
                        ${isAdmin ? `
                        <button class="btn-dash" id="btn-nl-export" type="button">
                            <i class="ph ph-download-simple"></i> CSV
                        </button>` : ""}
                    </div>
                </div>

                <div style="padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--color-border);">
                    <div class="input-wrapper" style="position:relative;max-width:320px;">
                        <i class="ph ph-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--color-text-muted);font-size:16px;"></i>
                        <input type="text" id="nl-search" class="form-input" placeholder="Cerca per email..." value="${Utils.escapeHtml(filter.search)}" style="padding-left:36px;height:38px;font-size:13px;">
                    </div>
                </div>

                <div id="nl-subscribers-content" style="padding:var(--sp-4);">
                    ${this.renderSubscribersTable(state.subscribers, state.meta, isAdmin)}
                </div>

                ${nextCursor ? `
                <div style="padding:var(--sp-3) var(--sp-4);border-top:1px solid var(--color-border);text-align:center;">
                    <button class="btn-dash" id="btn-nl-loadmore" type="button">
                        <i class="ph ph-arrow-down"></i> Carica altri
                    </button>
                </div>` : ""}
            </div>`;
    },

    renderCampaignsCard(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            return `
            <div class="dash-card" style="margin-bottom:var(--sp-4);">
                <div style="margin-bottom:16px;">
                    <h2 class="dash-card-title"><i class="ph ph-megaphone"></i> Ultime Campagne</h2>
                </div>
                <div style="padding:40px 20px; text-align:center; color:var(--color-text-muted);">
                    <i class="ph ph-chart-bar" style="font-size:48px; opacity:0.3; margin-bottom:16px; display:block;"></i>
                    <p style="font-weight:600; margin-bottom:4px;">Nessuna campagna recente</p>
                    <p style="font-size:13px;">Invia una campagna da MailerLite per sbloccare i grafici e le statistiche.</p>
                </div>
            </div>`;
        }

        return `
        <div class="dash-card" style="margin-bottom:var(--sp-4);">
            <div style="margin-bottom:16px;">
                <h2 class="dash-card-title"><i class="ph ph-megaphone"></i> Ultime Campagne</h2>
            </div>
            <div style="padding:var(--sp-4); border-bottom:1px solid var(--color-border);">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:var(--sp-4);">
                    <div>
                        <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; color:var(--color-text);">Trend di Apertura e Click</h3>
                        <div style="height:250px; position:relative;">
                            <canvas id="nl-chart-rates"></canvas>
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:14px; font-weight:600; margin-bottom:12px; color:var(--color-text);">Volumi di Invio</h3>
                        <div style="height:250px; position:relative;">
                            <canvas id="nl-chart-volumes"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-wrapper" style="overflow-x:auto;">
                <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Data Invio</th>
                            <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Campagna</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Inviate</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Aperture</th>
                            <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Click</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns.map((c) => {
                            const date = c.scheduled_for || c.created_at || "";
                            const dateStr = date
                                ? new Date(date).toLocaleDateString("it-IT", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }) : "—";
                            const stats = c.stats || {};
                            const sent = stats.sent || 0;
                            const opens = stats.opens_count || 0;
                            const openRate = stats.open_rate?.float ? stats.open_rate.float * 100 : sent > 0 ? (opens / sent) * 100 : 0;
                            const clicks = stats.clicks_count || 0;
                            const clickRate = stats.click_rate?.float ? stats.click_rate.float * 100 : sent > 0 ? (clicks / sent) * 100 : 0;
                            const name = c.name || "Senza nome";

                            return `
                            <tr>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:13px;color:var(--color-text-muted);white-space:nowrap;">${dateStr}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600;">${Utils.escapeHtml(name)}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;font-size:13px;">${sent.toLocaleString("it-IT")}</td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;">
                                    <div style="font-weight:600;">${opens.toLocaleString("it-IT")}</div>
                                    <div style="font-size:11px;color:var(--color-text-muted);">${openRate.toFixed(1)}%</div>
                                </td>
                                <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);text-align:right;">
                                    <div style="font-weight:600;">${clicks.toLocaleString("it-IT")}</div>
                                    <div style="font-size:11px;color:var(--color-text-muted);">${clickRate.toFixed(1)}%</div>
                                </td>
                            </tr>`;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderSubscribersTable(subscribers, meta, isAdmin) {
        if (subscribers.length === 0) {
            return `<div style="text-align:center;color:var(--color-text-muted);padding:40px 0;">
                <i class="ph ph-users" style="font-size:40px;margin-bottom:12px;display:block;opacity:0.4;"></i>
                <p style="font-weight:600;margin-bottom:4px;">Nessun iscritto trovato</p>
                <p style="font-size:13px;">Prova a modificare i filtri o aggiungi il primo iscritto.</p>
            </div>`;
        }

        const statusLabel = {
            active: "Attivo",
            unsubscribed: "Disiscriito",
            bounced: "Bounce",
            unconfirmed: "Non confermato",
            junk: "Spam",
        };
        const statusColor = {
            active: "var(--color-success)",
            unsubscribed: "var(--color-text-muted)",
            bounced: "var(--color-pink)",
            unconfirmed: "#f59e0b",
            junk: "var(--color-pink)",
        };

        return `
        <div class="table-wrapper" style="overflow-x:auto;">
            <table class="data-table" style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Email</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Nome</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Stato</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Gruppi</th>
                        <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-muted);">Iscritto il</th>
                        ${isAdmin ? '<th style="padding:10px 12px;border-bottom:1px solid var(--color-border);"></th>' : ""}
                    </tr>
                </thead>
                <tbody>
                    ${subscribers.map((sub) => {
                        const fields = sub.fields || {};
                        const getName = (key) => fields[key] || "";
                        const name = [getName("name"), getName("last_name")].filter(Boolean).join(" ") || "—";
                        const groups = (sub.groups || [])
                            .map((g) => `<span style="background:var(--color-primary-soft);color:var(--color-primary);font-size:11px;padding:2px 6px;border-radius:4px;font-weight:600;">${Utils.escapeHtml(g.name)}</span>`)
                            .join(" ");
                        const date = sub.created_at ? sub.created_at.substring(0, 10) : "—";
                        const st = sub.status || "active";
                        return `
                        <tr>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-weight:600;">${Utils.escapeHtml(sub.email)}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">${Utils.escapeHtml(name)}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">
                                <span style="color:${statusColor[st] || "var(--color-text-muted)"};font-weight:600;font-size:12px;">${statusLabel[st] || st}</span>
                            </td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);">${groups || '<span style="color:var(--color-text-muted);font-size:12px;">—</span>'}</td>
                            <td style="padding:10px 12px;border-bottom:1px solid var(--color-border);font-size:12px;color:var(--color-text-muted);">${date}</td>
                            ${isAdmin ? `<td style="padding:10px 12px;border-bottom:1px solid var(--color-border);white-space:nowrap;">
                                <button class="btn-dash" data-nl-del-sub="${Utils.escapeHtml(sub.id)}" title="Elimina" type="button" style="color:var(--color-pink);">
                                    <i class="ph ph-trash"></i>
                                </button>
                            </td>` : ""}
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-top:var(--sp-2);">
            Visualizzati ${subscribers.length} iscritti su ${meta.total || subscribers.length} totali
        </div>`;
    },

    openAddModal(groups, callbacks) {
        const groupsOptions = groups.map((g) =>
            `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 0;">
                <input type="checkbox" class="nl-group-check" value="${Utils.escapeHtml(g.id)}" style="width:16px;height:16px;">
                ${Utils.escapeHtml(g.name)}
            </label>`
        ).join("");

        const modal = UI.modal({
            title: "Nuovo Iscritto",
            body: `
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label" for="nl-sub-name">Nome</label>
                        <input id="nl-sub-name" class="form-input" type="text" placeholder="Mario">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="nl-sub-lastname">Cognome</label>
                        <input id="nl-sub-lastname" class="form-input" type="text" placeholder="Rossi">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="nl-sub-email">Email *</label>
                    <input id="nl-sub-email" class="form-input" type="email" placeholder="mario.rossi@esempio.it">
                </div>
                ${groups.length > 0 ? `
                <div class="form-group">
                    <label class="form-label">Gruppi</label>
                    <div style="border:1px solid var(--color-border);border-radius:8px;padding:var(--sp-2) var(--sp-3);max-height:160px;overflow-y:auto;">
                        ${groupsOptions}
                    </div>
                </div>` : ""}
                <div id="nl-sub-error" class="form-error hidden"></div>
            `,
            footer: `
                <button class="btn-dash" id="nl-sub-cancel" type="button">Annulla</button>
                <button class="btn-dash pink" id="nl-sub-save" type="button">AGGIUNGI</button>
            `,
        });

        document.getElementById("nl-sub-cancel")?.addEventListener("click", () => modal.close());
        document.getElementById("nl-sub-save")?.addEventListener("click", async () => {
            const email = document.getElementById("nl-sub-email")?.value.trim();
            const name = document.getElementById("nl-sub-name")?.value.trim();
            const last = document.getElementById("nl-sub-lastname")?.value.trim();
            const errEl = document.getElementById("nl-sub-error");
            const selectedGroups = [...document.querySelectorAll(".nl-group-check:checked")].map((c) => c.value);

            if (!email || !email.includes("@")) {
                errEl.textContent = "Inserisci un indirizzo email valido";
                errEl.classList.remove("hidden");
                return;
            }

            const saveBtn = document.getElementById("nl-sub-save");
            saveBtn.disabled = true;
            saveBtn.textContent = "Aggiunta...";

            try {
                await callbacks.onSave({ email, name: name || null, last_name: last || null, groups: selectedGroups });
                modal.close();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                saveBtn.disabled = false;
                saveBtn.textContent = "AGGIUNGI";
            }
        });
    },

    openGroupsModal(groups, callbacks) {
        function renderGroupList(localGroups) {
            if (localGroups.length === 0) return `<p style="text-align:center;color:var(--color-text-muted);padding:20px 0;font-size:14px;">Nessun gruppo creato</p>`;
            return localGroups.map((g) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--color-border);">
                    <div>
                        <div style="font-weight:600;font-size:14px;">${Utils.escapeHtml(g.name)}</div>
                        <div style="font-size:12px;color:var(--color-text-muted);">${g.active_count || 0} iscritti attivi</div>
                    </div>
                    <button class="btn-dash" data-del-group="${Utils.escapeHtml(g.id)}" type="button" style="color:var(--color-pink);">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>`).join("");
        }

        const modal = UI.modal({
            title: "Gestione Gruppi",
            body: `
                <div style="margin-bottom:var(--sp-3);">
                    <div style="display:flex;gap:8px;">
                        <input id="nl-group-name" class="form-input" type="text" placeholder="Nome nuovo gruppo..." style="flex:1;">
                        <button class="btn-dash pink" id="nl-group-create" type="button"><i class="ph ph-plus"></i> Crea</button>
                    </div>
                    <div id="nl-group-error" class="form-error hidden" style="margin-top:6px;"></div>
                </div>
                <div id="nl-groups-list">${renderGroupList(groups)}</div>
            `,
            footer: `<button class="btn-dash" id="nl-groups-close" type="button">Chiudi</button>`,
        });

        document.getElementById("nl-groups-close")?.addEventListener("click", () => modal.close());

        function rebindDeleteBtns(_currentGroups) {
            document.querySelectorAll("[data-del-group]").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    const gid = btn.dataset.delGroup;
                    try {
                        const newGroups = await callbacks.onDeleteGroup(gid);
                        const list = document.getElementById("nl-groups-list");
                        if (list) list.innerHTML = renderGroupList(newGroups);
                        rebindDeleteBtns(newGroups);
                        UI.toast("Gruppo eliminato", "success");
                    } catch (err) {
                        UI.toast("Errore: " + err.message, "error");
                    }
                });
            });
        }
        rebindDeleteBtns(groups);

        document.getElementById("nl-group-create")?.addEventListener("click", async () => {
            const name = document.getElementById("nl-group-name")?.value.trim();
            const errEl = document.getElementById("nl-group-error");
            if (!name) {
                errEl.textContent = "Il nome è obbligatorio";
                errEl.classList.remove("hidden");
                return;
            }
            const btn = document.getElementById("nl-group-create");
            btn.disabled = true;
            btn.textContent = "Creazione...";
            try {
                const newGroups = await callbacks.onCreateGroup(name);
                const list = document.getElementById("nl-groups-list");
                if (list) list.innerHTML = renderGroupList(newGroups);
                rebindDeleteBtns(newGroups);
                document.getElementById("nl-group-name").value = "";
                errEl.classList.add("hidden");
                UI.toast("Gruppo creato", "success");
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-plus"></i> Crea';
            }
        });
    }
};
