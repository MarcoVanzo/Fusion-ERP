/**
 * Chat Module — Real-Time Team Messaging
 * Fusion ERP v1.0
 *
 * Features:
 * - Channel list with unread counts
 * - Real-time messages via Server-Sent Events (SSE)
 * - Send text messages
 * - Create channels (team, staff, parents, general)
 * - Unread badge in navigation
 */

'use strict';

const Chat = (() => {
    let _ac = new AbortController();
    let _channels = [];
    let _activeChannel = null;
    let _messages = [];
    let _eventSource = null;
    let _pollInterval = null;

    // ─── INIT ──────────────────────────────────────────────────────────────────

    async function init() {
        _ac = new AbortController();
        _channels = [];
        _activeChannel = null;
        _messages = [];
        _closeSSE();

        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = UI.skeletonPage();

        try {
            const data = await Store.get('channels', 'chat');
            _channels = data || [];
            _render(app);
        } catch (_err) {
            console.error('[Chat] Init error:', err);
            app.innerHTML = Utils.emptyState('Errore nel caricamento', err.message, 'Riprova', null, () => init());
        }
    }

    // ─── RENDER ────────────────────────────────────────────────────────────────

    function _render(app) {
        const totalUnread = _channels.reduce((s, c) => s + (parseInt(c.unread_count) || 0), 0);

        app.innerHTML = `
        <div class="chat-page">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h2 class="chat-sidebar-title">
                        <i class="ph ph-chat-circle" style="color:var(--color-primary);"></i>
                        Chat
                        ${totalUnread > 0 ? `<span class="chat-unread-badge">${totalUnread}</span>` : ''}
                    </h2>
                    <button class="btn btn-ghost btn-sm" id="btn-new-channel" type="button" title="Nuovo canale">
                        <i class="ph ph-plus-circle" style="font-size:20px;"></i>
                    </button>
                </div>
                <div class="chat-channel-list" id="chat-channel-list">
                    ${_channels.length === 0
                ? `<div class="chat-empty-channels">
                            <i class="ph ph-chat-circle-dots" style="font-size:32px;opacity:0.3;"></i>
                            <p>Nessun canale</p>
                            <button class="btn btn-primary btn-sm" id="btn-new-channel-empty" type="button">Crea il primo</button>
                           </div>`
                : _channels.map(c => _renderChannelItem(c)).join('')}
                </div>
            </div>
            <div class="chat-main" id="chat-main">
                ${_activeChannel ? _renderChatArea() : _renderNoChannelSelected()}
            </div>
        </div>`;

        _bindEvents(app);

        // Auto-select first channel if none selected
        if (!_activeChannel && _channels.length > 0) {
            _selectChannel(_channels[0].id);
        }
    }

    function _renderChannelItem(c) {
        const isActive = _activeChannel?.id === c.id;
        const unread = parseInt(c.unread_count) || 0;
        const typeIcon = {
            'team': 'users-three',
            'staff': 'briefcase',
            'parents': 'house',
            'direct': 'user',
            'general': 'megaphone'
        }[c.type] || 'chat-circle';

        const lastMsg = c.last_message
            ? (c.last_message.length > 40 ? c.last_message.substring(0, 40) + '…' : c.last_message)
            : 'Nessun messaggio';
        const lastTime = c.last_message_at
            ? new Date(c.last_message_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            : '';

        return `
        <div class="chat-channel-item ${isActive ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''}"
             data-channel-id="${Utils.escapeHtml(c.id)}" role="button" tabindex="0">
            <div class="chat-channel-icon">
                <i class="ph ph-${typeIcon}"></i>
            </div>
            <div class="chat-channel-info">
                <span class="chat-channel-name">${Utils.escapeHtml(c.name)}</span>
                <span class="chat-channel-preview">${Utils.escapeHtml(lastMsg)}</span>
            </div>
            <div class="chat-channel-meta">
                <span class="chat-channel-time">${lastTime}</span>
                ${unread > 0 ? `<span class="chat-channel-badge">${unread}</span>` : ''}
            </div>
        </div>`;
    }

    function _renderNoChannelSelected() {
        return `
        <div class="chat-no-channel">
            <i class="ph ph-chat-circle-dots" style="font-size:64px;opacity:0.15;"></i>
            <p style="color:var(--text-muted);margin-top:12px;">Seleziona un canale per iniziare</p>
        </div>`;
    }

    function _renderChatArea() {
        return `
        <div class="chat-area">
            <div class="chat-area-header">
                <div class="chat-area-title">
                    <h3>${Utils.escapeHtml(_activeChannel.name)}</h3>
                    <span class="chat-area-type">${Utils.escapeHtml(_activeChannel.type)}</span>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div style="display:flex;justify-content:center;padding:20px;">
                    <div class="skeleton skeleton-text" style="width:200px;height:20px;"></div>
                </div>
            </div>
            <div class="chat-input-area">
                <form id="chat-send-form" class="chat-send-form">
                    <input type="text" id="chat-input" class="form-input chat-input-field"
                           placeholder="Scrivi un messaggio..." autocomplete="off" maxlength="2000">
                    <button type="submit" class="btn btn-primary chat-send-btn" id="chat-send-btn">
                        <i class="ph ph-paper-plane-right"></i>
                    </button>
                </form>
            </div>
        </div>`;
    }

    // ─── EVENTS ────────────────────────────────────────────────────────────────

    function _bindEvents(app) {
        // Channel selection
        app.querySelector('#chat-channel-list')?.addEventListener('click', e => {
            const item = e.target.closest('[data-channel-id]');
            if (item) _selectChannel(item.dataset.channelId);
        }, { signal: _ac.signal });

        // Keyboard on channel list
        app.querySelector('#chat-channel-list')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const item = e.target.closest('[data-channel-id]');
                if (item) _selectChannel(item.dataset.channelId);
            }
        }, { signal: _ac.signal });

        // New channel buttons
        app.querySelector('#btn-new-channel')?.addEventListener('click', () => _openNewChannelModal(), { signal: _ac.signal });
        app.querySelector('#btn-new-channel-empty')?.addEventListener('click', () => _openNewChannelModal(), { signal: _ac.signal });

        // Send message form
        app.querySelector('#chat-send-form')?.addEventListener('submit', e => {
            e.preventDefault();
            _sendMessage();
        }, { signal: _ac.signal });
    }

    // ─── CHANNEL SELECTION ─────────────────────────────────────────────────────

    async function _selectChannel(channelId) {
        _activeChannel = _channels.find(c => c.id === channelId) || null;
        if (!_activeChannel) return;

        // Re-render to update sidebar active state and show chat area
        const app = document.getElementById('app');
        _render(app);

        // Load messages
        const msgContainer = document.getElementById('chat-messages');
        if (!msgContainer) return;

        try {
            const data = await Store.get('messages', 'chat', { channel_id: channelId });
            _messages = data || [];
            _renderMessages(msgContainer);
            _scrollToBottom(msgContainer);

            // Mark channel as read
            _activeChannel.unread_count = 0;
            _updateChannelInSidebar(_activeChannel);

            // Start polling for new messages
            _startPolling(channelId);
        } catch (_err) {
            console.error('[Chat] Load messages error:', err);
            msgContainer.innerHTML = `<p style="text-align:center;color:var(--color-danger);">${Utils.escapeHtml(err.message)}</p>`;
        }

        // Focus input
        document.getElementById('chat-input')?.focus();
    }

    function _renderMessages(container) {
        if (!container) return;
        if (_messages.length === 0) {
            container.innerHTML = `
            <div class="chat-no-messages">
                <i class="ph ph-chat-circle-dots" style="font-size:40px;opacity:0.2;"></i>
                <p>Nessun messaggio. Inizia la conversazione!</p>
            </div>`;
            return;
        }

        const currentUserId = window.__fusionUser?.id || '';
        let lastDate = '';

        container.innerHTML = _messages.map(m => {
            const msgDate = new Date(m.created_at).toLocaleDateString('it-IT', {
                weekday: 'long', day: 'numeric', month: 'long'
            });
            let dateSeparator = '';
            if (msgDate !== lastDate) {
                lastDate = msgDate;
                dateSeparator = `<div class="chat-date-separator"><span>${Utils.escapeHtml(msgDate)}</span></div>`;
            }

            const isMine = m.user_id === currentUserId;
            const time = new Date(m.created_at).toLocaleTimeString('it-IT', {
                hour: '2-digit', minute: '2-digit'
            });

            return `${dateSeparator}
            <div class="chat-message ${isMine ? 'mine' : 'other'}" data-msg-id="${Utils.escapeHtml(m.id)}">
                ${!isMine ? `<div class="chat-msg-author">${Utils.escapeHtml(m.author_name || 'Utente')}</div>` : ''}
                <div class="chat-msg-bubble">
                    <div class="chat-msg-content">${Utils.escapeHtml(m.content)}</div>
                    <span class="chat-msg-time">${time}</span>
                </div>
            </div>`;
        }).join('');
    }

    // ─── SEND MESSAGE ──────────────────────────────────────────────────────────

    async function _sendMessage() {
        const input = document.getElementById('chat-input');
        const btn = document.getElementById('chat-send-btn');
        if (!input || !_activeChannel) return;

        const content = input.value.trim();
        if (!content) return;

        input.disabled = true;
        btn.disabled = true;

        try {
            const res = await Store.api('send', 'chat', {
                channel_id: _activeChannel.id,
                content
            });

            // Optimistic append
            _messages.push({
                id: res.id || 'MSG_' + Date.now(),
                user_id: window.__fusionUser?.id || '',
                content: res.content || content,
                type: 'text',
                author_name: res.author_name || window.__fusionUser?.fullName || '',
                created_at: res.created_at || new Date().toISOString()
            });

            const msgContainer = document.getElementById('chat-messages');
            _renderMessages(msgContainer);
            _scrollToBottom(msgContainer);

            input.value = '';
        } catch (_err) {
            console.error('[Chat] Send error:', err);
            UI.toast(err.message || 'Errore invio messaggio', 'error');
        } finally {
            input.disabled = false;
            btn.disabled = false;
            input.focus();
        }
    }

    // ─── POLLING (fallback for SSE) ────────────────────────────────────────────

    function _startPolling(channelId) {
        _closeSSE();
        _pollInterval = setInterval(async () => {
            if (!_activeChannel || _activeChannel.id !== channelId) {
                clearInterval(_pollInterval);
                return;
            }
            try {
                const data = await Store.get('messages', 'chat', { channel_id: channelId });
                const newMsgs = data || [];
                if (newMsgs.length > _messages.length) {
                    _messages = newMsgs;
                    const msgContainer = document.getElementById('chat-messages');
                    const wasAtBottom = _isScrolledToBottom(msgContainer);
                    _renderMessages(msgContainer);
                    if (wasAtBottom) _scrollToBottom(msgContainer);
                }
            } catch { /* ignore polling errors */ }
        }, 5000); // Poll every 5 seconds
    }

    function _closeSSE() {
        if (_eventSource) {
            _eventSource.close();
            _eventSource = null;
        }
        if (_pollInterval) {
            clearInterval(_pollInterval);
            _pollInterval = null;
        }
    }

    // ─── NEW CHANNEL MODAL ─────────────────────────────────────────────────────

    function _openNewChannelModal() {
        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:var(--sp-2);';
        body.innerHTML = `
        <form id="new-channel-form">
            <div class="form-group" style="margin:0 0 var(--sp-2) 0;">
                <label class="form-label">Nome canale *</label>
                <input type="text" id="channel-name" class="form-input" required
                       placeholder="Es. U18 Maschile, Staff tecnico..." maxlength="100">
            </div>
            <div class="form-group" style="margin:0 0 var(--sp-2) 0;">
                <label class="form-label">Tipo</label>
                <select id="channel-type" class="form-input">
                    <option value="general">Generale</option>
                    <option value="team">Squadra</option>
                    <option value="staff">Staff</option>
                    <option value="parents">Genitori</option>
                </select>
            </div>
            <div id="channel-error" class="form-error hidden"></div>
            <button type="submit" class="btn btn-primary" id="channel-create-btn">
                <i class="ph ph-plus"></i> Crea Canale
            </button>
        </form>`;

        const modal = UI.modal({ title: 'Nuovo Canale', body });

        body.querySelector('#new-channel-form').addEventListener('submit', async e => {
            e.preventDefault();
            const name = body.querySelector('#channel-name').value.trim();
            const type = body.querySelector('#channel-type').value;
            const errEl = body.querySelector('#channel-error');
            const btn = body.querySelector('#channel-create-btn');

            if (!name) {
                errEl.textContent = 'Il nome è obbligatorio';
                errEl.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Creazione...';
            errEl.classList.add('hidden');

            try {
                const res = await Store.api('createChannel', 'chat', { name, type });
                _channels.unshift({
                    id: res.id,
                    name, type,
                    unread_count: 0,
                    last_message: null,
                    last_message_at: null
                });
                UI.toast('Canale creato!', 'success');
                modal.close();
                _selectChannel(res.id);
                _render(document.getElementById('app'));
            } catch (_err) {
                errEl.textContent = err.message || 'Errore nella creazione';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btn.innerHTML = '<i class="ph ph-plus"></i> Crea Canale';
            }
        });
    }

    // ─── HELPERS ───────────────────────────────────────────────────────────────

    function _scrollToBottom(container) {
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }

    function _isScrolledToBottom(container) {
        if (!container) return true;
        return container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    }

    function _updateChannelInSidebar(channel) {
        const item = document.querySelector(`[data-channel-id="${channel.id}"]`);
        if (item) {
            item.querySelector('.chat-channel-badge')?.remove();
            item.classList.remove('has-unread');
        }
    }

    function destroy() {
        _ac.abort();
        _closeSSE();
        _channels = [];
        _activeChannel = null;
        _messages = [];
    }

    return { init, destroy };
})();

window.Chat = Chat;
