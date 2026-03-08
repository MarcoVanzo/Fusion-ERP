/**
 * Website Module — CMS for News and Articles
 * Fusion ERP v1.0
 */

'use strict';

const Website = (() => {
    let _container = null;
    let _news = [];

    async function init() {
        _container = document.getElementById('app');
        _renderLayout();
        await loadNews();
    }

    function _renderLayout() {
        _container.innerHTML = `
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Sito Web</h1>
                    <p class="page-subtitle">Gestione contenuti, news e articoli del portale.</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-news">
                        <i class="ph ph-plus"></i> NUOVO ARTICOLO
                    </button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: var(--sp-4);">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--color-primary-soft); color: var(--color-primary);">
                        <i class="ph ph-newspaper"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Articoli Totali</div>
                        <div class="stat-value" id="news-total">-</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--color-success-soft); color: var(--color-success);">
                        <i class="ph ph-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Pubblicati</div>
                        <div class="stat-value" id="news-published">-</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Ultimi Articoli</h2>
                </div>
                <div id="news-list-container">
                    <div class="empty-state">
                        <div class="skeleton-text" style="width: 100%; height: 200px; border-radius: 8px;"></div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-add-news').onclick = _showCreateModal;
    }

    async function loadNews() {
        try {
            _news = await Store.get('newsList', 'website');
            _renderNewsList();
            _updateStats();
        } catch (err) {
            console.error('[Website] Failed to load news:', err);
            document.getElementById('news-list-container').innerHTML = Utils.emptyState(
                'Errore nel caricamento',
                err.message,
                'Riprova',
                () => loadNews()
            );
        }
    }

    function _renderNewsList() {
        const listEl = document.getElementById('news-list-container');
        if (!_news || _news.length === 0) {
            listEl.innerHTML = Utils.emptyState('Nessun articolo trovato', 'Inizia creando il tuo primo articolo.', 'Crea Articolo', () => _showCreateModal());
            return;
        }

        listEl.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Titolo</th>
                            <th>Categoria</th>
                            <th>Stato</th>
                            <th>Data Pubblicazione</th>
                            <th style="text-align: right;">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${_news.map(n => `
                            <tr>
                                <td>
                                    <div style="font-weight: 600;">${Utils.escapeHtml(n.title)}</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">/${n.slug}</div>
                                </td>
                                <td>
                                    <span class="badge" style="background: ${n.color_hex}20; color: ${n.color_hex}; border: 1px solid ${n.color_hex}40;">
                                        ${Utils.escapeHtml(n.category_name)}
                                    </span>
                                </td>
                                <td>
                                    ${n.is_published == 1
                ? '<span class="badge badge-success">Pubblicato</span>'
                : '<span class="badge badge-warning">Bozza</span>'}
                                </td>
                                <td>${n.published_at ? Utils.formatDate(n.published_at) : '-'}</td>
                                <td style="text-align: right;">
                                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Website.editArticle(${n.id})" title="Modifica">
                                        <i class="ph ph-pencil"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function _updateStats() {
        document.getElementById('news-total').textContent = _news.length;
        document.getElementById('news-published').textContent = _news.filter(n => n.is_published == 1).length;
    }

    async function _showCreateModal() {
        // Fetch categories first
        let cats = [];
        try {
            cats = await Store.get('categories', 'website');
        } catch (err) {
            UI.toast('Errore caricamento categorie', 'error');
            return;
        }

        const body = document.createElement('div');
        body.innerHTML = `
            <form id="create-news-form" style="display: flex; flex-direction: column; gap: var(--sp-3);">
                <div class="form-group">
                    <label class="form-label">Titolo</label>
                    <input type="text" id="news-title" class="form-input" placeholder="Il titolo dell'articolo" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Slug (URL)</label>
                    <input type="text" id="news-slug" class="form-input" placeholder="titolo-articolo" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <select id="news-category" class="form-input" required>
                        ${cats.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Contenuto (HTML)</label>
                    <textarea id="news-content" class="form-input" style="height: 150px;" placeholder="<p>Scrivi qui il tuo articolo...</p>"></textarea>
                </div>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="news-published-check"> Pubblica immediatamente
                </label>
            </form>
        `;

        const modal = UI.modal({
            title: 'Nuovo Articolo',
            body: body,
            footer: `
                <button class="btn btn-ghost" id="btn-cancel">ANNULLA</button>
                <button class="btn btn-primary" id="btn-save">SALVA ARTICOLO</button>
            `
        });

        const titleInput = body.querySelector('#news-title');
        const slugInput = body.querySelector('#news-slug');

        titleInput.oninput = () => {
            slugInput.value = titleInput.value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        };

        body.querySelector('#btn-cancel').onclick = () => modal.close();
        body.querySelector('#btn-save').onclick = async () => {
            const data = {
                title: titleInput.value.trim(),
                slug: slugInput.value.trim(),
                category_id: body.querySelector('#news-category').value,
                content_html: body.querySelector('#news-content').value,
                is_published: body.querySelector('#news-published-check').checked ? 1 : 0,
                published_at: body.querySelector('#news-published-check').checked ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
            };

            if (!data.title || !data.slug) return UI.toast('Titolo e Slug sono obbligatori', 'warning');

            try {
                await Store.api('createNews', 'website', data);
                UI.toast('Articolo creato!', 'success');
                modal.close();
                await loadNews();
            } catch (err) {
                UI.toast(err.message, 'error');
            }
        };
    }

    function editArticle(id) {
        UI.toast('Modifica articolo (ID: ' + id + ') in arrivo...', 'info');
    }

    return {
        init,
        editArticle,
        destroy: () => {
            _container = null;
            _news = [];
        }
    };
})();

window.Website = Website;
