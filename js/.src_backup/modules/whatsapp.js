/**
 * WhatsApp Module — Inbox & Contacts
 * Fusion ERP v1.0
 *
 * Views:
 *   - whatsapp-inbox    : conversazioni + chat area + invio messaggi
 *   - whatsapp-contacts : rubrica contatti importati + import vCard
 */

'use strict';

const WhatsApp = (() => {
    let _ac = new AbortController();
    let _conversations = [];
    let _activePhone = null;
    let _messages = [];
    let _pollInterval = null;
    let _currentView = 'inbox'; // 'inbox' | 'contacts'

    // ─── INIT ───────────────────────────────────────────────────────────────

    async function init() {
        _ac = new AbortController();
        _conversations = [];
        _activePhone = null;
        _messages = [];
        _stopPolling();

        const route = Router.getCurrentRoute();
        _currentView = route === 'whatsapp-contacts' ? 'contacts' : 'inbox';

        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = UI.skeletonPage();

        if (_currentView === 'contacts') {
            await _initContacts(app);
        } else {
            await _initInbox(app);
        }
    }

    // ─── INBOX ──────────────────────────────────────────────────────────────

    async function _initInbox(app) {
        try {
            const data = await Store.get('getConversations', 'whatsapp');
            _conversations = data?.conversations || [];
            _renderInbox(app);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore caricamento inbox', err.message, 'Riprova', null, () => init());
        }
    }

    function _renderInbox(app) {
        app.innerHTML = `
        <div class="wa-page">
            <div class="wa-sidebar">
                <div class="wa-sidebar-header">
                    <div class="wa-sidebar-title">
                        <i class="ph ph-whatsapp-logo" style="color:#25D366;font-size:22px;"></i>
                        <h2>WhatsApp</h2>
                    </div>
                    <span class="wa-sidebar-sub">Inbox messaggi</span>
                </div>
                <div class="wa-conv-list" id="wa-conv-list">
                    ${_conversations.length === 0
                ? `<div class="wa-empty-list">
                               <i class="ph ph-chat-circle-dots" style="font-size:36px;opacity:.2;"></i>
                               <p>Nessun messaggio ricevuto</p>
                           </div>`
                : _conversations.map(c => _renderConvItem(c)).join('')}
                </div>
            </div>
            <div class="wa-main" id="wa-main">
                ${_renderNoConvSelected()}
            </div>
        </div>`;

        _bindInboxEvents(app);

        if (!_activePhone && _conversations.length > 0) {
            _selectConversation(_conversations[0].from_phone);
        }
    }

    function _renderConvItem(c) {
        const isActive = _activePhone === c.from_phone;
        const unread = parseInt(c.unread_count) || 0;
        const name = c.display_name || _formatPhone(c.from_phone);
        const preview = c.last_body ? (c.last_body.length > 42 ? c.last_body.slice(0, 42) + '…' : c.last_body) : '';
        const timeStr = c.last_message_at
            ? new Date(c.last_message_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            : '';
        const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

        return `
        <div class="wa-conv-item ${isActive ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''}"
             data-phone="${Utils.escapeHtml(c.from_phone)}" role="button" tabindex="0">
            <div class="wa-avatar">${Utils.escapeHtml(initials)}</div>
            <div class="wa-conv-info">
                <span class="wa-conv-name">${Utils.escapeHtml(name)}</span>
                <span class="wa-conv-preview">${Utils.escapeHtml(preview)}</span>
            </div>
            <div class="wa-conv-meta">
                <span class="wa-conv-time">${timeStr}</span>
                ${unread > 0 ? `<span class="wa-unread-badge">${unread}</span>` : ''}
            </div>
        </div>`;
    }

    function _renderNoConvSelected() {
        return `
        <div class="wa-no-conv">
            <i class="ph ph-whatsapp-logo" style="font-size:72px;opacity:.1;color:#25D366;"></i>
            <p style="color:var(--text-muted);margin-top:16px;font-size:15px;">Seleziona una conversazione</p>
        </div>`;
    }

    function _renderChatArea(conv) {
        const name = conv?.display_name || _formatPhone(conv?.from_phone || _activePhone);
        return `
        <div class="wa-chat-area">
            <div class="wa-chat-header">
                <div class="wa-avatar sm">${name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div class="wa-chat-header-info">
                    <span class="wa-chat-name">${Utils.escapeHtml(name)}</span>
                    <span class="wa-chat-phone">${_formatPhone(_activePhone)}</span>
                </div>
            </div>
            <div class="wa-messages" id="wa-messages">
                <div class="wa-loading-msgs">
                    <i class="ph ph-circle-notch ph-spin"></i>
                </div>
            </div>
            <div class="wa-input-area">
                <form id="wa-send-form" class="wa-send-form">
                    <textarea id="wa-input" class="wa-text-input" rows="1"
                        placeholder="Scrivi un messaggio..." maxlength="4096"></textarea>
                    <button type="submit" class="wa-send-btn" id="wa-send-btn">
                        <i class="ph ph-paper-plane-right"></i>
                    </button>
                </form>
            </div>
        </div>`;
    }

    function _renderMessages(container) {
        if (!container) return;
        if (_messages.length === 0) {
            container.innerHTML = `<div class="wa-no-messages"><i class="ph ph-chat-circle-dots"></i><p>Nessun messaggio</p></div>`;
            return;
        }

        let lastDate = '';
        container.innerHTML = _messages.map(m => {
            const isMe = m.from_phone === 'me';
            const date = new Date(m.timestamp ? m.timestamp * 1000 : m.created_at);
            const dateStr = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

            let sep = '';
            if (dateStr !== lastDate) {
                lastDate = dateStr;
                sep = `<div class="wa-date-sep"><span>${Utils.escapeHtml(dateStr)}</span></div>`;
            }

            const bubbleCls = isMe ? 'wa-bubble-out' : 'wa-bubble-in';
            const icon = m.status === 'read' ? '<i class="ph ph-checks" style="color:#53bdeb;"></i>'
                : m.status === 'replied' ? '<i class="ph ph-check-fat"></i>'
                    : '';

            return `${sep}
            <div class="wa-msg ${isMe ? 'out' : 'in'}">
                <div class="${bubbleCls}">
                    <span class="wa-msg-text">${Utils.escapeHtml(m.body || '')}</span>
                    <span class="wa-msg-meta">${timeStr} ${isMe ? icon : ''}</span>
                </div>
            </div>`;
        }).join('');
    }

    function _bindInboxEvents(app) {
        app.querySelector('#wa-conv-list')?.addEventListener('click', e => {
            const item = e.target.closest('[data-phone]');
            if (item) _selectConversation(item.dataset.phone);
        }, { signal: _ac.signal });

        app.querySelector('#wa-conv-list')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const item = e.target.closest('[data-phone]');
                if (item) _selectConversation(item.dataset.phone);
            }
        }, { signal: _ac.signal });
    }

    async function _selectConversation(phone) {
        _activePhone = phone;
        _stopPolling();

        const conv = _conversations.find(c => c.from_phone === phone);
        const main = document.getElementById('wa-main');
        if (!main) return;
        main.innerHTML = _renderChatArea(conv);

        // Re-render sidebar per aggiornare stato attivo
        document.querySelectorAll('.wa-conv-item').forEach(el => {
            el.classList.toggle('active', el.dataset.phone === phone);
        });

        // Bind send form
        document.getElementById('wa-send-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            await _sendReply();
        }, { signal: _ac.signal });

        // Auto-resize textarea
        const textarea = document.getElementById('wa-input');
        textarea?.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }, { signal: _ac.signal });

        await _loadMessages(phone);
        _startPolling(phone);
    }

    async function _loadMessages(phone) {
        const container = document.getElementById('wa-messages');
        if (!container) return;
        try {
            const data = await Store.get('getMessages', 'whatsapp', { from_phone: phone });
            _messages = data?.messages || [];
            _renderMessages(container);
            _scrollToBottom(container);

            // Azzera badge nella sidebar
            const item = document.querySelector(`[data-phone="${CSS.escape(phone)}"]`);
            if (item) { item.classList.remove('has-unread'); item.querySelector('.wa-unread-badge')?.remove(); }
        } catch (err) {
            container.innerHTML = `<p style="text-align:center;color:var(--color-danger);">${Utils.escapeHtml(err.message)}</p>`;
        }
    }

    async function _sendReply() {
        const input = document.getElementById('wa-input');
        const btn = document.getElementById('wa-send-btn');
        if (!input || !_activePhone) return;
        const text = input.value.trim();
        if (!text) return;

        input.disabled = true;
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i>';

        try {
            const res = await Store.api('reply', 'whatsapp', { to_phone: _activePhone, text });
            _messages.push({
                id: res.id,
                from_phone: 'me',
                body: text,
                timestamp: res.ts,
                status: 'read',
                created_at: new Date().toISOString(),
            });
            const container = document.getElementById('wa-messages');
            _renderMessages(container);
            _scrollToBottom(container);
            input.value = '';
            input.style.height = 'auto';
        } catch (err) {
            UI.toast(err.message || 'Errore invio messaggio', 'error');
        } finally {
            input.disabled = false;
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-paper-plane-right"></i>';
            input.focus();
        }
    }

    function _startPolling(phone) {
        _pollInterval = setInterval(async () => {
            if (_activePhone !== phone) { _stopPolling(); return; }
            try {
                const data = await Store.get('getMessages', 'whatsapp', { from_phone: phone });
                const msgs = data?.messages || [];
                if (msgs.length > _messages.length) {
                    _messages = msgs;
                    const container = document.getElementById('wa-messages');
                    const atBottom = _isAtBottom(container);
                    _renderMessages(container);
                    if (atBottom) _scrollToBottom(container);
                }
            } catch { /* ignora errori di polling */ }
        }, 5000);
    }

    function _stopPolling() {
        if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
    }

    // ─── CONTACTS ───────────────────────────────────────────────────────────

    async function _initContacts(app) {
        try {
            const data = await Store.get('getContacts', 'whatsapp');
            const contacts = data?.contacts || [];
            _renderContacts(app, contacts);
        } catch (err) {
            app.innerHTML = Utils.emptyState('Errore caricamento contatti', err.message, 'Riprova', null, () => init());
        }
    }

    function _renderContacts(app, contacts) {
        app.innerHTML = `
        <div class="wa-contacts-page">
            <div class="page-header" style="padding:var(--sp-4) var(--sp-4) 0;">
                <div class="page-header-title">
                    <i class="ph ph-address-book" style="color:var(--color-primary);"></i>
                    <h2>Rubrica Contatti</h2>
                </div>
                <button class="btn btn-primary" id="btn-import-vcf" type="button">
                    <i class="ph ph-upload-simple"></i> Importa da iPhone (.vcf)
                </button>
                <input type="file" id="vcf-file-input" accept=".vcf,.vcard" style="display:none;">
            </div>
            <div style="padding:var(--sp-4);">
                ${contacts.length === 0
                ? Utils.emptyState('Nessun contatto', 'Importa i contatti dal tuo iPhone.', null, null, null)
                : `<div class="wa-contacts-grid">
                        ${contacts.map(c => _renderContactCard(c)).join('')}
                       </div>`}
            </div>
        </div>`;

        _bindContactsEvents(app, contacts);
    }

    function _renderContactCard(c) {
        const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const athleteTag = c.athlete_name
            ? `<span class="wa-contact-tag"><i class="ph ph-user"></i> ${Utils.escapeHtml(c.athlete_name.trim())}</span>`
            : `<button class="btn btn-ghost btn-xs btn-link-athlete" data-contact-id="${Utils.escapeHtml(c.id)}" type="button">
                   <i class="ph ph-link"></i> Collega atleta
               </button>`;

        return `
        <div class="wa-contact-card">
            <div class="wa-avatar md">${Utils.escapeHtml(initials)}</div>
            <div class="wa-contact-info">
                <span class="wa-contact-name">${Utils.escapeHtml(c.name)}</span>
                <span class="wa-contact-phone">${_formatPhone(c.phone_normalized)}</span>
                ${athleteTag}
            </div>
        </div>`;
    }

    function _bindContactsEvents(app, contacts) {
        // Import button → trigger file input
        app.querySelector('#btn-import-vcf')?.addEventListener('click', () => {
            app.querySelector('#vcf-file-input')?.click();
        }, { signal: _ac.signal });

        // File selected → upload for preview
        app.querySelector('#vcf-file-input')?.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            await _uploadVCardPreview(file);
        }, { signal: _ac.signal });

        // Link to athlete buttons
        app.addEventListener('click', e => {
            const btn = e.target.closest('.btn-link-athlete');
            if (btn) _openLinkAthleteModal(btn.dataset.contactId);
        }, { signal: _ac.signal });
    }

    async function _uploadVCardPreview(file) {
        const formData = new FormData();
        formData.append('vcf', file);

        UI.toast('Analisi file in corso...', 'info');

        try {
            const res = await fetch(`api/?module=whatsapp&action=importContacts&preview=1`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Errore upload');
            const data = await res.json();
            _showImportPreviewModal(data.preview || []);
        } catch (err) {
            UI.toast('Errore nel parsing del file .vcf', 'error');
        }
    }

    function _showImportPreviewModal(preview) {
        if (preview.length === 0) {
            UI.toast('Nessun contatto trovato nel file', 'warning');
            return;
        }

        const body = document.createElement('div');
        body.innerHTML = `
        <p style="margin-bottom:var(--sp-2);color:var(--text-muted);font-size:13px;">
            Trovati <strong>${preview.length}</strong> numeri. Seleziona quelli da importare:
        </p>
        <div style="margin-bottom:var(--sp-2);display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" id="sel-all">Seleziona tutto</button>
            <button class="btn btn-ghost btn-sm" id="sel-none">Deseleziona</button>
        </div>
        <div style="max-height:380px;overflow-y:auto;">
            <table class="data-table" style="font-size:13px;">
                <thead><tr>
                    <th style="width:32px;"></th>
                    <th>Nome</th><th>Numero</th><th>Match Atleta</th>
                </tr></thead>
                <tbody>
                    ${preview.map((c, i) => `
                    <tr>
                        <td><input type="checkbox" class="contact-check" data-idx="${i}" checked></td>
                        <td>${Utils.escapeHtml(c.name)}</td>
                        <td>${_formatPhone(c.phone_normalized)}</td>
                        <td>${c.athlete_match
                ? `<span class="badge badge-success"><i class="ph ph-check"></i> ${Utils.escapeHtml(c.athlete_match.name)}</span>`
                : '<span style="color:var(--text-muted);">—</span>'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:var(--sp-3);display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn btn-ghost" id="btn-cancel-import">Annulla</button>
            <button class="btn btn-primary" id="btn-confirm-import">
                <i class="ph ph-download-simple"></i> Importa selezionati
            </button>
        </div>`;

        const modal = UI.modal({ title: '📱 Importa contatti iPhone', body, size: 'lg' });

        body.querySelector('#sel-all')?.addEventListener('click', () => {
            body.querySelectorAll('.contact-check').forEach(cb => cb.checked = true);
        });
        body.querySelector('#sel-none')?.addEventListener('click', () => {
            body.querySelectorAll('.contact-check').forEach(cb => cb.checked = false);
        });
        body.querySelector('#btn-cancel-import')?.addEventListener('click', () => modal.close());

        body.querySelector('#btn-confirm-import')?.addEventListener('click', async () => {
            const selected = [];
            body.querySelectorAll('.contact-check:checked').forEach(cb => {
                selected.push({ ...preview[parseInt(cb.dataset.idx)] });
            });

            if (selected.length === 0) {
                UI.toast('Nessun contatto selezionato', 'warning');
                return;
            }

            const btn = body.querySelector('#btn-confirm-import');
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Importazione...';

            try {
                const res = await Store.api('importContacts', 'whatsapp', { contacts: selected });
                UI.toast(`Importati ${res.imported} contatti!`, 'success');
                modal.close();
                await init(); // Ricarica la vista contatti
            } catch (err) {
                UI.toast(err.message || 'Errore importazione', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-download-simple"></i> Importa selezionati';
            }
        });
    }

    async function _openLinkAthleteModal(contactId) {
        try {
            const data = await Store.get('list', 'athletes');
            const athletes = data?.athletes || data || [];

            const body = document.createElement('div');
            body.innerHTML = `
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--sp-2);">
                Seleziona l'atleta da collegare a questo contatto:
            </p>
            <select class="form-input" id="athlete-select" style="margin-bottom:var(--sp-3);">
                <option value="">— Nessuno (scollega) —</option>
                ${athletes.map(a => `<option value="${Utils.escapeHtml(a.id)}">${Utils.escapeHtml(((a.first_name || '') + ' ' + (a.last_name || '')).trim())}</option>`).join('')}
            </select>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button class="btn btn-ghost" id="btn-cancel-link">Annulla</button>
                <button class="btn btn-primary" id="btn-confirm-link">
                    <i class="ph ph-link"></i> Collega
                </button>
            </div>`;

            const modal = UI.modal({ title: 'Collega a un atleta', body });
            body.querySelector('#btn-cancel-link')?.addEventListener('click', () => modal.close());
            body.querySelector('#btn-confirm-link')?.addEventListener('click', async () => {
                const athleteId = body.querySelector('#athlete-select').value || null;
                try {
                    await Store.api('linkContact', 'whatsapp', { contact_id: contactId, athlete_id: athleteId });
                    UI.toast('Contatto aggiornato!', 'success');
                    modal.close();
                    await init();
                } catch (err) {
                    UI.toast(err.message, 'error');
                }
            });
        } catch (err) {
            UI.toast('Errore caricamento atleti', 'error');
        }
    }

    // ─── HELPERS ────────────────────────────────────────────────────────────

    function _formatPhone(phone) {
        if (!phone || phone === 'me') return '';
        // Es. 393471234567 → +39 347 123 4567
        const p = String(phone);
        if (p.startsWith('39') && p.length >= 11) {
            const local = p.slice(2);
            return '+39 ' + local.slice(0, 3) + ' ' + local.slice(3, 6) + ' ' + local.slice(6);
        }
        return '+' + p;
    }

    function _scrollToBottom(container) {
        if (container) requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
    }

    function _isAtBottom(container) {
        if (!container) return true;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    }

    function destroy() {
        _ac.abort();
        _stopPolling();
        _conversations = [];
        _messages = [];
        _activePhone = null;
    }

    return { init, destroy };
})();

window.WhatsApp = WhatsApp;
