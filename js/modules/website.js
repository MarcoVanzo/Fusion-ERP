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

        document.getElementById('btn-add-news').onclick = () => _showArticleModal();
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
            listEl.innerHTML = Utils.emptyState('Nessun articolo trovato', 'Inizia creando il tuo primo articolo.', 'Crea Articolo', () => _showArticleModal());
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

    async function _showArticleModal(article = null) {
        let cats = [];
        try { cats = await Store.get('categories', 'website'); } catch (err) { UI.toast('Errore categorie', 'error'); return; }

        const isEdit = !!article;

        const body = document.createElement('div');
        body.innerHTML = `
            <form id="news-form" style="display: flex; flex-direction: column; gap: var(--sp-3);">
                <div class="form-group">
                    <label class="form-label">Titolo</label>
                    <input type="text" id="news-title" class="form-input" required value="${isEdit ? Utils.escapeHtml(article.title) : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Slug (URL)</label>
                    <input type="text" id="news-slug" class="form-input" required value="${isEdit ? Utils.escapeHtml(article.slug) : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Copertina</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="file" id="news-cover-file" accept="image/*" style="flex:1;">
                        <input type="hidden" id="news-cover-url" value="${isEdit && article.cover_image_url ? Utils.escapeHtml(article.cover_image_url) : ''}">
                        <div id="cover-preview" style="width:50px; height:50px; background:#222; border-radius:4px; background-size:cover; background-position:center; ${isEdit && article.cover_image_url ? `background-image:url(${article.cover_image_url})` : ''}"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Categoria</label>
                    <select id="news-category" class="form-input" required>
                        ${cats.map(c => `<option value="${c.id}" ${isEdit && article.category_id == c.id ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Riassunto (Excerpt)</label>
                    <textarea id="news-excerpt" class="form-input" style="height: 60px;">${isEdit && article.excerpt ? Utils.escapeHtml(article.excerpt) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Contenuto (HTML)</label>
                    <textarea id="news-content" class="form-input" style="height: 150px; font-family: monospace;">${isEdit && article.content_html ? Utils.escapeHtml(article.content_html) : ''}</textarea>
                </div>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="news-published-check" ${isEdit && article.is_published == 1 ? 'checked' : ''}> Pubblicato
                </label>
            </form>
        `;

        const modal = UI.modal({
            title: isEdit ? 'Modifica Articolo' : 'Nuovo Articolo',
            body: body,
            footer: `
                ${isEdit ? `<button class="btn" style="margin-right:auto; background:var(--color-danger); color:white; border:none;" id="btn-delete">ELIMINA</button>` : ''}
                <button class="btn btn-ghost" id="btn-cancel">ANNULLA</button>
                <button class="btn btn-primary" id="btn-save">${isEdit ? 'AGGIORNA' : 'SALVA'}</button>
            `
        });

        const titleInput = body.querySelector('#news-title');
        const slugInput = body.querySelector('#news-slug');
        const fileInput = body.querySelector('#news-cover-file');
        const urlInput = body.querySelector('#news-cover-url');
        const preview = body.querySelector('#cover-preview');

        titleInput.oninput = () => {
            if (!isEdit) {
                slugInput.value = titleInput.value.toLowerCase().trim()
                    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
            }
        };

        fileInput.onchange = async () => {
            if (!fileInput.files[0]) return;

            // Show loading state
            preview.style.opacity = '0.5';

            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            try {
                const res = await fetch('api/router.php?module=website&action=uploadImage', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Authorization': 'Bearer ' + (Store.getToken() || '') }
                });
                const result = await res.json();
                if (result.success) {
                    urlInput.value = result.data.url;
                    preview.style.backgroundImage = `url(${result.data.url})`;
                    UI.toast('Immagine caricata', 'success');
                } else {
                    throw new Error(result.error || 'Errore upload');
                }
            } catch (e) {
                UI.toast(e.message, 'error');
            } finally {
                preview.style.opacity = '1';
                // Reset file input so same file can be selected again
                fileInput.value = '';
            }
        };

        if (isEdit) {
            body.querySelector('#btn-delete').onclick = async () => {
                if (!confirm('Sei sicuro di voler eliminare questo articolo?')) return;
                body.querySelector('#btn-delete').disabled = true;
                try {
                    await Store.api('deleteNews', 'website', { id: article.id });
                    UI.toast('Articolo eliminato', 'success');
                    modal.close();
                    await loadNews();
                } catch (e) {
                    UI.toast(e.message, 'error');
                    body.querySelector('#btn-delete').disabled = false;
                }
            };
        }

        body.querySelector('#btn-cancel').onclick = () => modal.close();
        body.querySelector('#btn-save').onclick = async () => {
            const data = {
                title: titleInput.value.trim(),
                slug: slugInput.value.trim(),
                category_id: body.querySelector('#news-category').value,
                cover_image_url: urlInput.value,
                excerpt: body.querySelector('#news-excerpt').value,
                content_html: body.querySelector('#news-content').value,
                is_published: body.querySelector('#news-published-check').checked ? 1 : 0
            };

            if (data.is_published && (!isEdit || !article.published_at)) {
                data.published_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            } else if (isEdit) {
                data.published_at = article.published_at; // keep original publish date
            }

            if (!data.title || !data.slug) return UI.toast('Titolo e Slug sono obbligatori', 'warning');

            body.querySelector('#btn-save').disabled = true;
            try {
                if (isEdit) {
                    data.id = article.id;
                    await Store.api('updateNews', 'website', data);
                    UI.toast('Articolo aggiornato!', 'success');
                } else {
                    await Store.api('createNews', 'website', data);
                    UI.toast('Articolo creato!', 'success');
                }
                modal.close();
                await loadNews();
            } catch (err) {
                UI.toast(err.message, 'error');
                body.querySelector('#btn-save').disabled = false;
            }
        };
    }

    async function editArticle(id) {
        const article = _news.find(n => n.id == id);
        if (article) {
            _showArticleModal(article);
        } else {
            UI.toast('Articolo non trovato', 'error');
        }
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
