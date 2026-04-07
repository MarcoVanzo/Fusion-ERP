/**
 * Societa Module — Main Orchestrator
 * Fusion ERP v1.1
 */
import SocietaAPI from './societa/SocietaAPI.js?v=2';
import SocietaView from './societa/SocietaView.js?v=3';
import SocietaOrgChart from './societa/SocietaOrgChart.js?v=2';
import SocietaForesteria from './societa/SocietaForesteria.js?v=2';

const Societa = {
    _abort: new AbortController(),
    _currentTab: 'identita',
    _data: {
        profile: null,
        companies: [],
        roles: [],
        members: [],
        documents: [],
        deadlines: [],
        sponsors: [],
        titles: [],
        foresteria: null
    },

    /** signal() helper for event listeners */
    sig: function() { return { signal: this._abort.signal }; },

    destroy: function() {
        this._abort.abort();
        // Clear data to release memory
        this._data = {
            profile: null, companies: [], roles: [], members: [], documents: [],
            deadlines: [], sponsors: [], titles: [], foresteria: null
        };
    },

    init: async function() {
        // Reset controller to allow new listeners after a previous destroy
        this._abort = new AbortController();
        
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        UI.loading(true);
        appContainer.innerHTML = SocietaView.skeleton();
        
        try {
            const route = Router.getCurrentRoute();
            this._currentTab = {
                "societa-organigramma": "organigramma",
                "societa-membri": "membri",
                "societa-documenti": "documenti",
                "societa-scadenze": "scadenze",
                "societa-sponsor": "sponsor",
                "societa-titoli": "titoli",
                "societa-foresteria": "foresteria"
            }[route] || "identita";

            // Load initial data
            await this.reloadData();
            
            this.render();
        } catch (err) {
            console.error("[Societa] Init error:", err);
            appContainer.innerHTML = Utils.emptyState("Errore caricamento", err.message);
            UI.toast("Errore caricamento modulo Società", "error");
        } finally {
            UI.loading(false);
        }
    },

    reloadData: async function() {
        const promises = {
            profile: SocietaAPI.getProfile().catch(() => ({})),
            companies: SocietaAPI.listCompanies().catch(() => []),
            roles: SocietaAPI.listRoles().catch(() => []),
            members: SocietaAPI.listMembers().catch(() => []),
            documents: SocietaAPI.listDocuments().catch(() => []),
            deadlines: SocietaAPI.listDeadlines().catch(() => []),
            sponsors: SocietaAPI.listSponsors().catch(() => []),
            titles: SocietaAPI.listTitoli().catch(() => [])
        };

        if (this._currentTab === 'foresteria' || this._currentTab === 'spese-foresteria') {
            promises.foresteria = SocietaAPI.getForesteria().catch(err => {
                console.error("[Societa] Error fetching foresteria data:", err);
                return null;
            });
        }

        const keys = Object.keys(promises);
        const results = await Promise.all(Object.values(promises));
        
        // Map results back to this._data using keys to avoid race condition index mismatches
        keys.forEach((key, index) => {
            if (key === 'titles') {
                this._data.titles = results[index];
            } else {
                this._data[key] = results[index];
            }
        });
    },

    render: function() {
        const appContainer = document.getElementById("app");
        if (!appContainer) return;

        const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);

        switch (this._currentTab) {
            case 'identita':
                appContainer.innerHTML = SocietaView.identity(this._data.profile, this._data.companies, isAdmin);
                this.attachIdentityEvents(appContainer, isAdmin);
                break;
            case 'organigramma':
                appContainer.innerHTML = SocietaView.orgChart(this._data.roles, isAdmin);
                if (isAdmin) SocietaOrgChart.initDragAndDrop(appContainer, () => this.refreshTab(), this._abort.signal);
                this.attachOrgEvents(appContainer, isAdmin);
                break;
            case 'membri':
                appContainer.innerHTML = SocietaView.membersTable(this._data.members, isAdmin);
                this.attachMembersEvents(appContainer, isAdmin);
                break;
            case 'documenti':
                appContainer.innerHTML = SocietaView.documentsGrid(this._data.documents, isAdmin);
                this.attachDocumentsEvents(appContainer, isAdmin);
                break;
            case 'scadenze':
                appContainer.innerHTML = SocietaView.deadlines(this._data.deadlines, isAdmin);
                this.attachDeadlinesEvents(appContainer, isAdmin);
                break;
            case 'sponsor':
                appContainer.innerHTML = SocietaView.sponsorsGrid(this._data.sponsors, isAdmin);
                this.attachSponsorsEvents(appContainer, isAdmin);
                break;
            case 'titoli':
                appContainer.innerHTML = SocietaView.titoli(this._data.titles, isAdmin);
                this.attachTitoliEvents(appContainer, isAdmin);
                break;
            case 'foresteria':
                if (this._data.foresteria) {
                   appContainer.innerHTML = SocietaView.foresteriaInfo(this._data.foresteria.info, this._data.foresteria.media, isAdmin);
                   SocietaForesteria.attachInfoEvents(appContainer, this._data.foresteria.info, this._abort.signal);
                   if (this._data.foresteria.info && this._data.foresteria.info.lat) SocietaForesteria.initMap(this._data.foresteria.info);
                } else {
                   appContainer.innerHTML = Utils.emptyState("Dati mancanti", "Impossibile caricare i dati della foresteria.");
                }
                break;
        }
    },

    refreshTab: async function() {
        UI.loading(true);
        try {
            await this.reloadData();
            this.render();
        } catch (err) {
            UI.toast(err.message, "error");
        } finally {
            UI.loading(false);
        }
    },

    attachIdentityEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelector("#soc-logo-btn")?.addEventListener("click", () => {
            container.querySelector("#soc-logo-input")?.click();
        }, this.sig());

        container.querySelector("#soc-logo-input")?.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const fd = new FormData();
                fd.append("logo", file);
                const res = await SocietaAPI.uploadLogo(fd);
                this._data.profile.logo_path = res.logo_path;
                UI.toast("Logo caricato", "success");
                this.render();
            } catch (err) {
                UI.toast(err.message, "error");
            }
        }, this.sig());

        // Salva profilo — pulsante ora nell'header (dash-top-bar)
        container.querySelector("#soc-save-profile")?.addEventListener("click", async () => {
            const errEl = container.querySelector("#soc-profile-err");
            const body = {
                mission: container.querySelector("#soc-mission")?.value,
                vision: container.querySelector("#soc-vision")?.value,
                values: container.querySelector("#soc-values")?.value,
                founded_year: container.querySelector("#soc-founded")?.value,
                primary_color: container.querySelector("#soc-color-primary")?.value,
                secondary_color: container.querySelector("#soc-color-secondary")?.value,
                legal_address: container.querySelector("#soc-legal-addr")?.value,
                operative_address: container.querySelector("#soc-op-addr")?.value
            };
            try {
                if (errEl) errEl.classList.add("hidden");
                await SocietaAPI.saveProfile(body);
                UI.toast("Profilo aggiornato", "success");
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
                UI.toast(err.message, "error");
            }
        }, this.sig());

        // Gestione Colore HEX txt => input color per il form della Identity
        const bindColorSync = (txtId, clrId) => {
            const txt = container.querySelector(txtId);
            const clr = container.querySelector(clrId);
            if(txt && clr) {
                txt.addEventListener("input", (e) => {
                    if(/^#[0-9A-Fa-f]{6}$/i.test(e.target.value)) clr.value = e.target.value;
                }, this.sig());
                clr.addEventListener("input", (e) => txt.value = e.target.value, this.sig());
            }
        };
        bindColorSync("#soc-color-primary-txt", "#soc-color-primary");
        bindColorSync("#soc-color-secondary-txt", "#soc-color-secondary");

        // COMPANIES GRID
        container.querySelector("#soc-add-company")?.addEventListener("click", () => {
            this.openCompanyModal();
        }, this.sig());

        container.querySelectorAll(".soc-edit-company").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                const company = this._data.companies.find(x => x.id == id);
                if (company) this.openCompanyModal(company);
            }, this.sig());
        });

        container.querySelectorAll(".soc-delete-company").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;
                if (!confirm("Sei sicuro di voler eliminare questa società?")) return;
                try {
                    await SocietaAPI.deleteCompany(id);
                    UI.toast("Società eliminata", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    openCompanyModal: function(company = null) {
        const isEdit = !!company;
        const modal = UI.modal({
            title: isEdit ? "Modifica Società" : "Nuova Società",
            body: SocietaView.modalCompany(company),
            footer: '<button class="btn-dash ghost" id="comp-modal-cancel">Annulla</button><button class="btn-dash pink" id="comp-modal-save">Salva</button>'
        });

        document.getElementById("comp-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("comp-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("comp-modal-err");
            const name = document.getElementById("comp-name").value.trim();
            if (!name) {
                errEl.textContent = "Il campo Ragione Sociale è obbligatorio.";
                errEl.classList.remove("hidden");
                return;
            }
            errEl.classList.add("hidden");
            
            const data = {
                name: name,
                vat_number: document.getElementById("comp-vat").value.trim(),
                legal_address: document.getElementById("comp-legal-addr").value.trim(),
                website: document.getElementById("comp-website").value.trim(),
                facebook: document.getElementById("comp-facebook").value.trim(),
                instagram: document.getElementById("comp-instagram").value.trim(),
                referent_name: document.getElementById("comp-ref-name").value.trim(),
                referent_contact: document.getElementById("comp-ref-contact").value.trim(),
                description: document.getElementById("comp-desc").value.trim()
            };
            if (isEdit) data.id = company.id;

            const btnSalva = document.getElementById("comp-modal-save");
            const originalText = btnSalva.innerHTML;
            btnSalva.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Salvataggio...';
            btnSalva.disabled = true;

            try {
                let compId = isEdit ? company.id : null;
                if (isEdit) {
                    await SocietaAPI.updateCompany(data);
                } else {
                    const res = await SocietaAPI.createCompany(data);
                    compId = res.id || res.data?.id; // depending on Response::success format
                }

                // Logo upload if selected
                const fileInput = document.getElementById("comp-modal-logo-input");
                if (fileInput && fileInput.files.length > 0 && compId) {
                    const fd = new FormData();
                    fd.append("company_id", compId);
                    fd.append("logo", fileInput.files[0]);
                    await SocietaAPI.uploadCompanyLogo(fd);
                }

                UI.toast(isEdit ? "Società aggiornata" : "Società inserita", "success");
                modal.close();
                this.refreshTab();
            } catch (err) {
                errEl.textContent = err.message;
                errEl.classList.remove("hidden");
                btnSalva.innerHTML = originalText;
                btnSalva.disabled = false;
            }
        }, this.sig());

        // Initialize modal UI events (e.g., file input trigger, color sync)
        setTimeout(() => {
            const logoBtn = document.getElementById("comp-modal-logo-btn");
            const logoInput = document.getElementById("comp-modal-logo-input");
            if (logoBtn && logoInput) {
                logoBtn.addEventListener("click", () => logoInput.click(), this.sig());
                logoInput.addEventListener("change", (e) => {
                    const f = e.target.files[0];
                    if(f) logoBtn.textContent = f.name;
                });
            }

            const bindColor = (txtId, clrId) => {
                const txt = document.getElementById(txtId);
                const clr = document.getElementById(clrId);
                if(txt && clr) {
                    txt.addEventListener("input", (e) => {
                        if(/^#[0-9A-Fa-f]{6}$/i.test(e.target.value)) clr.value = e.target.value;
                    });
                    clr.addEventListener("input", (e) => txt.value = e.target.value);
                }
            };
            bindColor("comp-color-prim-txt", "comp-color-prim");
            bindColor("comp-color-sec-txt", "comp-color-sec");
        }, 50);
    },

    attachOrgEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        
        container.querySelector("#soc-add-role")?.addEventListener("click", () => {
            this.openRoleModal();
        }, this.sig());

        container.querySelectorAll("[data-edit-role]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.editRole;
                const role = this._data.roles.find(x => x.id == id);
                if (role) this.openRoleModal(role);
            }, this.sig());
        });

        container.querySelectorAll("[data-del-role]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.delRole;
                const hasChildren = this._data.roles.some(x => x.parent_role_id == id);
                if (hasChildren) {
                    UI.toast("Attenzione: questo ruolo ha sotto-ruoli. Elimina prima i sotto-ruoli.", "error");
                    return;
                }
                
                if (!confirm("Sei sicuro di voler eliminare questo ruolo?")) return;
                try {
                    await SocietaAPI.deleteRole(id);
                    UI.toast("Ruolo eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    openRoleModal: function(role = null) {
        const isEdit = !!role;
        const modal = UI.modal({
            title: isEdit ? "Modifica Ruolo" : "Nuovo Ruolo",
            body: SocietaView.roleModal(role, this._data.roles),
            footer: '<button class="btn-dash ghost" id="role-modal-cancel">Annulla</button><button class="btn-dash primary" id="role-modal-save">Salva</button>'
        });

        document.getElementById("role-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("role-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("role-modal-err");
            const name = document.getElementById("role-name").value.trim();
            if (!name) {
                if (errEl) { errEl.textContent = "Il nome del ruolo è obbligatorio"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                name: name,
                parent_role_id: document.getElementById("role-parent").value || null,
                description: document.getElementById("role-desc").value.trim()
            };

            if (isEdit) data.id = role.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateRole(data);
                    UI.toast("Ruolo aggiornato", "success");
                } else {
                    await SocietaAPI.createRole(data);
                    UI.toast("Ruolo creato", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    attachMembersEvents: function(container, isAdmin) {
        // Search filter
        container.querySelector("#soc-members-search")?.addEventListener("input", (e) => {
            const val = e.target.value.toLowerCase();
            container.querySelectorAll("#soc-members-tbody tr").forEach(tr => {
                const match = tr.dataset.memberName.includes(val);
                tr.style.display = match ? "" : "none";
            });
        }, this.sig());
        
        if (!isAdmin) return;
        
        container.querySelector("#soc-add-member")?.addEventListener("click", () => {
            this.openMemberModal();
        }, this.sig());

        container.querySelectorAll("[data-edit-member]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.editMember;
                const mem = this._data.members.find(x => x.id == id);
                if (mem) this.openMemberModal(mem);
            }, this.sig());
        });

        container.querySelectorAll("[data-del-member]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.delMember;
                if (!confirm("Eliminare definitivamente questo membro dal direttivo?")) return;
                try {
                    await SocietaAPI.deleteMember(id);
                    UI.toast("Membro eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    openMemberModal: function(member = null) {
        const isEdit = !!member;
        const modal = UI.modal({
            title: isEdit ? "Modifica Membro" : "Nuovo Membro",
            body: SocietaView.memberModal(member, this._data.roles),
            footer: '<button class="btn-dash ghost" id="mem-modal-cancel">Annulla</button><button class="btn-dash primary" id="mem-modal-save">Salva</button>'
        });

        document.getElementById("mem-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("mem-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("mem-modal-err");
            const fullName = document.getElementById("mem-name").value.trim();
            if (!fullName) {
                if (errEl) { errEl.textContent = "Il nome completo è obbligatorio"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                full_name: fullName,
                role_id: document.getElementById("mem-role").value || null,
                start_date: document.getElementById("mem-start-date").value || null,
                end_date: document.getElementById("mem-end-date").value || null,
                is_active: document.getElementById("mem-active").checked ? 1 : 0
            };

            if (isEdit) data.id = member.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateMember(data);
                    UI.toast("Membro aggiornato", "success");
                } else {
                    await SocietaAPI.createMember(data);
                    UI.toast("Membro aggiunto", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    attachDocumentsEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        
        container.querySelector("#soc-upload-doc")?.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = async (evt) => {
                const file = evt.target.files[0];
                if (!file) return;
                try {
                    UI.loading(true);
                    const fd = new FormData();
                    fd.append("document", file);
                    await SocietaAPI.uploadDocument(fd);
                    UI.toast("Documento caricato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                } finally {
                    UI.loading(false);
                }
            };
            input.click();
        }, this.sig());

        container.querySelectorAll("[data-del-doc]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.delDoc;
                if (!confirm("Eliminare questo documento societario?")) return;
                try {
                    await SocietaAPI.deleteDocument(id);
                    UI.toast("Documento eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    attachDeadlinesEvents: function(container, isAdmin) {
        // Filter logic
        container.querySelectorAll("[data-dl-status]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                container.querySelectorAll(".dash-filter").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                const filter = e.target.dataset.dlStatus;
                container.querySelectorAll("#soc-deadlines-list > div").forEach(el => {
                    if (!filter || el.dataset.dlStatus === filter) el.style.display = "";
                    else el.style.display = "none";
                });
            }, this.sig());
        });

        if (!isAdmin) return;

        container.querySelector("#soc-add-deadline")?.addEventListener("click", () => {
            this.openDeadlineModal();
        }, this.sig());

        container.querySelectorAll("[data-edit-dl]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.editDl;
                const dl = this._data.deadlines.find(x => x.id == id);
                if (dl) this.openDeadlineModal(dl);
            }, this.sig());
        });

        container.querySelectorAll("[data-del-dl]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.delDl;
                if (!confirm("Eliminare questa scadenza?")) return;
                try {
                    await SocietaAPI.deleteDeadline(id);
                    UI.toast("Scadenza eliminata", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    openDeadlineModal: function(dl = null) {
        const isEdit = !!dl;
        const modal = UI.modal({
            title: isEdit ? "Modifica Scadenza" : "Nuova Scadenza",
            body: SocietaView.deadlineModal(dl),
            footer: '<button class="btn-dash ghost" id="dl-modal-cancel">Annulla</button><button class="btn-dash primary" id="dl-modal-save">Salva</button>'
        });

        document.getElementById("dl-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("dl-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("dl-modal-err");
            const title = document.getElementById("dl-title").value.trim();
            const dueDate = document.getElementById("dl-due-date").value;
            
            if (!title || !dueDate) {
                if (errEl) { errEl.textContent = "I campi Titolo e Scadenza sono obbligatori"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                title: title,
                due_date: dueDate,
                category: document.getElementById("dl-category").value.trim(),
                status: document.getElementById("dl-status").value
            };

            if (isEdit) data.id = dl.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateDeadline(data);
                    UI.toast("Scadenza aggiornata", "success");
                } else {
                    await SocietaAPI.createDeadline(data);
                    UI.toast("Scadenza creata", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    attachSponsorsEvents: function(container, isAdmin) {
        if (!isAdmin) return;

        container.querySelector("#soc-add-sponsor")?.addEventListener("click", () => {
            this.openSponsorModal();
        }, this.sig());

        container.querySelectorAll("[data-sp-edit]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.spEdit;
                const sp = this._data.sponsors.find(x => x.id === id);
                if (sp) this.openSponsorModal(sp);
            }, this.sig());
        });

        container.querySelectorAll("[data-sp-del]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.spDel;
                if (!confirm("Sei sicuro di voler eliminare questo sponsor?")) return;
                try {
                    await SocietaAPI.deleteSponsor(id);
                    UI.toast("Sponsor eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });

        container.querySelectorAll("[data-sp-logo]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.spLogo;
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async (evt) => {
                    const file = evt.target.files[0];
                    if (!file) return;
                    try {
                        const fd = new FormData();
                        fd.append("logo", file);
                        fd.append("id", id);
                        await SocietaAPI.uploadSponsorLogo(fd);
                        UI.toast("Logo sponsor aggiornato", "success");
                        this.refreshTab();
                    } catch (err) {
                        UI.toast(err.message, "error");
                    }
                };
                input.click();
            }, this.sig());
        });
    },

    openSponsorModal: function(sponsor = null) {
        const isEdit = !!sponsor;
        const modal = UI.modal({
            title: isEdit ? "Modifica Sponsor" : "Nuovo Sponsor",
            body: SocietaView.sponsorModal(sponsor),
            footer: '<button class="btn-dash ghost" id="sp-modal-cancel">Annulla</button><button class="btn-dash primary" id="sp-modal-save">Salva</button>'
        });

        document.getElementById("sp-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("sp-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("sp-modal-err");
            const name = document.getElementById("sp-name").value.trim();
            if (!name) {
                if (errEl) { errEl.textContent = "Il nome dello sponsor è obbligatorio"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                name: name,
                tipo: document.getElementById("sp-tipo").value,
                stagione: document.getElementById("sp-stagione").value.trim(),
                is_active: document.getElementById("sp-active").checked ? 1 : 0,
                description: document.getElementById("sp-desc").value.trim(),
                website_url: document.getElementById("sp-website").value.trim(),
                instagram_url: document.getElementById("sp-instagram").value.trim(),
                facebook_url: document.getElementById("sp-facebook").value.trim(),
                linkedin_url: document.getElementById("sp-linkedin").value.trim(),
                tiktok_url: document.getElementById("sp-tiktok").value.trim(),
                importo: document.getElementById("sp-importo").value || null,
                rapporto: document.getElementById("sp-rapporto").value.trim(),
                sponsorizzazione: document.getElementById("sp-sponsorizzazione").value.trim()
            };

            if (isEdit) data.id = sponsor.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateSponsor(data);
                    UI.toast("Sponsor aggiornato", "success");
                } else {
                    await SocietaAPI.createSponsor(data);
                    UI.toast("Sponsor creato", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    },

    attachTitoliEvents: function(container, isAdmin) {
        if (!isAdmin) return;
        
        container.querySelector("#soc-add-titolo")?.addEventListener("click", () => {
            this.openTitoloModal();
        }, this.sig());

        container.querySelectorAll("[data-edit-titolo]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.editTitolo;
                const titolo = this._data.titles.find(x => x.id == id);
                if (titolo) this.openTitoloModal(titolo);
            }, this.sig());
        });

        container.querySelectorAll("[data-del-titolo]").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.delTitolo;
                if (!confirm("Eliminare questo titolo dal palmarès?")) return;
                try {
                    await SocietaAPI.deleteTitolo(id);
                    UI.toast("Titolo eliminato", "success");
                    this.refreshTab();
                } catch (err) {
                    UI.toast(err.message, "error");
                }
            }, this.sig());
        });
    },

    openTitoloModal: function(titolo = null) {
        const isEdit = !!titolo;
        const modal = UI.modal({
            title: isEdit ? "Modifica Titolo" : "Nuovo Titolo",
            body: SocietaView.titoloModal(titolo),
            footer: '<button class="btn-dash ghost" id="tit-modal-cancel">Annulla</button><button class="btn-dash primary" id="tit-modal-save">Salva</button>'
        });

        document.getElementById("tit-modal-cancel")?.addEventListener("click", () => modal.close(), this.sig());
        document.getElementById("tit-modal-save")?.addEventListener("click", async () => {
            const errEl = document.getElementById("tit-modal-err");
            const stagione = document.getElementById("tit-stagione").value.trim();
            const campionato = document.getElementById("tit-campionato").value.trim();
            
            if (!stagione || !campionato) {
                if (errEl) { errEl.textContent = "I campi Stagione e Campionato sono obbligatori"; errEl.classList.remove("hidden"); }
                return;
            }

            const data = {
                stagione: stagione,
                campionato: campionato,
                categoria: document.getElementById("tit-categoria").value.trim(),
                piazzamento: document.getElementById("tit-piazzamento").value || null,
                finali_nazionali: document.getElementById("tit-finali").checked ? 1 : 0
            };

            if (isEdit) data.id = titolo.id;

            try {
                if (errEl) errEl.classList.add("hidden");
                if (isEdit) {
                    await SocietaAPI.updateTitolo(data);
                    UI.toast("Titolo aggiornato", "success");
                } else {
                    await SocietaAPI.createTitolo(data);
                    UI.toast("Titolo aggiunto", "success");
                }
                modal.close();
                this.refreshTab();
            } catch (err) {
                if (errEl) { errEl.textContent = err.message; errEl.classList.remove("hidden"); }
            }
        }, this.sig());
    }
};

export default Societa;
window.Societa = Societa;
