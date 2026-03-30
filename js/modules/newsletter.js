// js/modules/newsletter.js
import { NewsletterAPI } from './newsletter/NewsletterAPI.js';
import { NewsletterView } from './newsletter/NewsletterView.js';
import { initCampaignCharts } from './newsletter/NewsletterCharts.js';

const Newsletter = (() => {
  let _controller = new AbortController();

  function sig() {
    return { signal: _controller.signal };
  }

  // State
  let _configured = false;
  let _stats = { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
  let _groups = [];
  let _subscribers = [];
  let _campaigns = [];
  let _meta = { total: 0 };
  let _nextCursor = null;
  let _filter = { status: "active", search: "" };
  let _searchTimeout = null;

  function extractCursor(nextUrl) {
    if (!nextUrl) return null;
    try {
      const url = new URL(nextUrl);
      return url.searchParams.get("cursor");
    } catch {
      return null;
    }
  }

  async function loadSubscribers(append = false) {
    try {
      const params = { limit: 25 };
      if (_nextCursor) params.cursor = _nextCursor;
      if (_filter.status) params.status = _filter.status;
      if (_filter.search) params.search = _filter.search;

      const result = await NewsletterAPI.listSubscribers(params);

      if (append) {
        _subscribers = [..._subscribers, ...(result.data || [])];
      } else {
        _subscribers = result.data || [];
      }
      _meta = result.meta || { total: _subscribers.length };
      _nextCursor = extractCursor(result.links?.next);
    } catch (err) {
      console.error("[Newsletter] loadSubscribers error:", err);
    }
  }

  function render() {
    _controller.abort();
    _controller = new AbortController();
    
    const app = document.getElementById("app");
    if (!app) return;

    if (!_configured) {
        app.innerHTML = NewsletterView.renderEmptyConfig();
        return;
    }

    const isAdmin = ["admin", "manager"].includes(App.getUser()?.role);
    const state = { stats: _stats, groups: _groups, subscribers: _subscribers, campaigns: _campaigns, meta: _meta, nextCursor: _nextCursor, filter: _filter };
    
    app.innerHTML = NewsletterView.renderDashboard(state, isAdmin);

    bindEvents(isAdmin);
    setTimeout(() => initCampaignCharts(_campaigns), 0);
  }

  function bindEvents(isAdmin) {
    // Status filter chips
    document.querySelectorAll("[data-nl-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
          _filter.status = btn.dataset.nlStatus;
          _subscribers = [];
          _nextCursor = null;
          await loadSubscribers(false);
          render();
        }, sig()
      );
    });

    // Search
    document.getElementById("nl-search")?.addEventListener("input", (e) => {
        clearTimeout(_searchTimeout);
        _searchTimeout = setTimeout(async () => {
          _filter.search = e.target.value.trim();
          _subscribers = [];
          _nextCursor = null;
          await loadSubscribers(false);
          const content = document.getElementById("nl-subscribers-content");
          if (content) content.innerHTML = NewsletterView.renderSubscribersTable(_subscribers, _meta, isAdmin);
          bindDeleteButtons(isAdmin);
        }, 400);
      }, sig()
    );

    // Load more
    document.getElementById("btn-nl-loadmore")?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-nl-loadmore");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Caricamento...";
        }
        await loadSubscribers(true);
        const content = document.getElementById("nl-subscribers-content");
        if (content) content.innerHTML = NewsletterView.renderSubscribersTable(_subscribers, _meta, isAdmin);
        
        bindDeleteButtons(isAdmin);
        
        if (_nextCursor) {
          const newBtn = document.getElementById("btn-nl-loadmore");
          if (newBtn) {
            newBtn.disabled = false;
            newBtn.innerHTML = '<i class="ph ph-arrow-down"></i> Carica altri';
          }
        } else {
          const container = document.getElementById("btn-nl-loadmore")?.parentElement;
          if (container) container.remove();
        }
      }, sig()
    );

    if (isAdmin) {
      document.getElementById("btn-nl-add-subscriber")?.addEventListener("click", () => {
        NewsletterView.openAddModal(_groups, {
            onSave: async (data) => {
                await NewsletterAPI.upsertSubscriber(data);
                _subscribers = [];
                _nextCursor = null;
                await loadSubscribers(false);
                _stats = await NewsletterAPI.getStats().catch(() => _stats);
                UI.toast("Iscritto aggiunto con successo", "success");
                render();
            }
        });
      }, sig());

      document.getElementById("btn-nl-groups")?.addEventListener("click", () => {
          NewsletterView.openGroupsModal(_groups, {
              onCreateGroup: async (name) => {
                  const newGroup = await NewsletterAPI.createGroup({ name });
                  if (newGroup?.id) _groups.push(newGroup);
                  else _groups = await NewsletterAPI.listGroups().catch(() => _groups);
                  return _groups;
              },
              onDeleteGroup: async (id) => {
                  await NewsletterAPI.deleteGroup(id);
                  _groups = _groups.filter((g) => g.id !== id);
                  return _groups;
              }
          });
      }, sig());

      document.getElementById("btn-nl-export")?.addEventListener("click", () => {
          window.open("api/?module=newsletter&action=exportCsv", "_blank");
      }, sig());

      bindDeleteButtons(isAdmin);
    }
  }

  function bindDeleteButtons(isAdmin) {
    if (!isAdmin) return;
    document.querySelectorAll("[data-nl-del-sub]").forEach((btn) => {
      btn.addEventListener("click", () => confirmDeleteSubscriber(btn.dataset.nlDelSub), sig());
    });
  }

  function confirmDeleteSubscriber(id) {
    const sub = _subscribers.find((s) => s.id === id);
    const m = UI.modal({
      title: "Elimina Iscritto",
      body: `<p style="font-size:14px;">Sei sicuro di voler eliminare <strong>${Utils.escapeHtml(sub?.email || id)}</strong> da MailerLite?<br><span style="color:var(--color-text-muted);font-size:13px;">Questa azione è irreversibile.</span></p>`,
      footer: `
        <button class="btn-dash" id="nl-del-cancel" type="button">Annulla</button>
        <button class="btn-dash pink" id="nl-del-ok" type="button" style="background:var(--color-pink);">ELIMINA</button>
      `,
    });
    document.getElementById("nl-del-cancel")?.addEventListener("click", () => m.close());
    document.getElementById("nl-del-ok")?.addEventListener("click", async () => {
        try {
          await NewsletterAPI.deleteSubscriber(id);
          _subscribers = _subscribers.filter((s) => s.id !== id);
          if (_stats.total > 0) _stats.total--;
          if (_stats.active > 0 && (sub?.status === "active" || !sub?.status)) _stats.active--;
          UI.toast("Iscritto eliminato", "success");
          render();
          m.close();
        } catch (err) {
          UI.toast("Errore: " + err.message, "error");
        }
    });
  }

  return {
    async init() {
      _controller = new AbortController();

      UI.loading(true);
      try {
        const config = await NewsletterAPI.getConfig();
        _configured = config.configured ?? false;

        if (_configured) {
          [_stats, _groups, _campaigns] = await Promise.all([
            NewsletterAPI.getStats().catch(() => _stats),
            NewsletterAPI.listGroups().catch(() => []),
            NewsletterAPI.listCampaigns().catch(() => []),
          ]);
          await loadSubscribers(false);
        }
      } catch (err) {
        console.error("[Newsletter] init error:", err);
      } finally {
        UI.loading(false);
      }

      render();
    },
    destroy() {
      clearTimeout(_searchTimeout);
      _controller.abort();
      _controller = new AbortController();
      _subscribers = [];
      _groups = [];
      _campaigns = [];
      _stats = { total: 0, active: 0, unsubscribed: 0, bounced: 0 };
      _nextCursor = null;
      _filter = { status: "active", search: "" };
    },
  };
})();

window.Newsletter = Newsletter;
