import { ModalUtils } from './ModalUtils.js';

const MAX_CHAT_HISTORY = 30;

export const AiDiagnosisModal = {
    open(container, athlete, anamnesi, injuries, focusedInjuryId = null) {
        let chatHistory = []; // Bounded to MAX_CHAT_HISTORY entries
        
        const theModal = ModalUtils.createModal(`
            <h2 style="font-family:var(--font-display); font-size:24px; color:#fff; margin-bottom:8px; display:flex; align-items:center; gap:12px;">
                <i class="ph ph-magic-wand" style="color:#10b981;"></i> 
                AI Assistente Medico
            </h2>
            <p style="color:var(--color-text-muted); font-size:14px; margin-bottom:24px;">Analisi diagnostica per ${Utils.escapeHtml(athlete.full_name)}</p>
            
            <div id="ai-chat-container" style="background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); height:65vh; max-height:800px; display:flex; flex-direction:column; overflow:hidden; margin-bottom:16px;">
                <div id="ai-chat-messages" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
                    <div style="text-align:center; padding:20px; color:var(--color-text-muted);"><i class="ph ph-circle-notch animate-spin"></i> Generazione quadro clinico in corso...</div>
                </div>
                <div style="padding:16px; background:rgba(255,255,255,0.02); border-top:1px solid rgba(255,255,255,0.05);">
                    <form id="ai-chat-form" style="display:flex; gap:12px;">
                        <input type="text" name="message" class="input" style="flex:1;" placeholder="Fai una domanda all'AI..." autocomplete="off">
                        <button type="submit" class="btn btn-primary" style="background:#10b981;"><i class="ph ph-paper-plane-right"></i> Invia</button>
                    </form>
                </div>
            </div>
            
            <div style="display:flex; justify-content:flex-end;">
                <button type="button" class="btn btn-default close-modal-btn">Chiudi</button>
            </div>
        `);
        
        document.body.appendChild(theModal);
        
        const modalContent = theModal.querySelector('.modal-content');
        if (modalContent) modalContent.style.maxWidth = '1200px';
        if (modalContent) modalContent.style.width = '95%';
        
        const messagesContainer = theModal.querySelector('#ai-chat-messages');
        const form = theModal.querySelector('#ai-chat-form');
        const input = form.querySelector('input');
        const submitBtn = form.querySelector('button');

        const formatMarkdown = (text) => {
            if (!text) return '';
            let html = String(text);
            
            html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

            html = html.replace(/^### (.*$)/gim, '<h4 style="font-size:16px; font-weight:800; color:#fff; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px; margin-top:20px; margin-bottom:12px;">$1</h4>');
            html = html.replace(/^## (.*$)/gim, '<h3 style="font-size:18px; font-weight:800; color:#10b981; margin-top:24px; margin-bottom:16px;">$1</h3>');
            html = html.replace(/^# (.*$)/gim, '<h2 style="font-size:20px; font-weight:800; color:#10b981; margin-top:24px; margin-bottom:16px;">$1</h2>');
            
            html = html.replace(/^\* (.*$)/gim, '<div style="display:flex; gap:8px; margin-bottom:8px; padding-left:8px;"><i class="ph ph-check-circle" style="color:#10b981; margin-top:4px;"></i><span style="flex:1;">$1</span></div>');
            html = html.replace(/^\d+\. (.*$)/gim, '<div style="display:flex; gap:8px; margin-bottom:8px; padding-left:8px;"><i class="ph ph-caret-right" style="color:#3b82f6; margin-top:4px;"></i><span style="flex:1;">$1</span></div>');
            
            html = html.replace(/^---/gim, '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:24px 0;">');
            
            html = html.replace(/\\*\\*(.*?)\\*\\*/gim, '<strong style="color:#fff;">$1</strong>');
            html = html.replace(/\\*(.*?)\\*/gim, '<em style="opacity:0.8;">$1</em>');
            
            html = html.replace(/\\n\\n/g, '<div style="height:12px;"></div>');
            html = html.replace(/\\n/g, '<br>');
            
            return html;
        };

        const appendMessage = (role, content) => {
            const isAi = role === 'AI';
            const formattedContent = isAi ? formatMarkdown(content) : Utils.escapeHtml(content);

            const html = \`
                <div style="display:flex; gap:12px; align-self: \${isAi ? 'flex-start' : 'flex-end'}; max-width:\${isAi ? '100%' : '85%'}; width:\${isAi ? '100%' : 'auto'};">
                    \${isAi ? '<div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot"></i></div>' : ''}
                    <div style="background:\${isAi ? 'rgba(255,255,255,0.02)' : '#3b82f6'}; border:\${isAi ? '1px solid rgba(255,255,255,0.05)' : 'none'}; color:#fff; padding:16px 20px; border-radius:12px; \${isAi ? 'border-top-left-radius:2px;' : 'border-top-right-radius:2px;'} font-size:14px; line-height:1.6; flex:1;">
                        \${formattedContent}
                    </div>
                </div>
            \`;
            messagesContainer.insertAdjacentHTML('beforeend', html);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const askAI = async (message = '') => {
            try {
                input.disabled = true;
                submitBtn.disabled = true;
                
                if (message) {
                    appendMessage('USER', message);
                } else {
                    messagesContainer.innerHTML = '';
                }

                const loadingId = 'loading-' + Date.now();
                messagesContainer.insertAdjacentHTML('beforeend', \`
                    <div id="\${loadingId}" style="display:flex; gap:12px; align-self:flex-start;">
                        <div style="width:32px;height:32px;border-radius:50%;background:rgba(16, 185, 129, 0.2);color:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="ph ph-robot animate-spin"></i></div>
                        <div style="background:rgba(255,255,255,0.05); color:var(--color-text-muted); padding:12px 16px; border-radius:12px; border-top-left-radius:2px; font-size:14px;">Elaborazione...</div>
                    </div>
                \`);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

                const res = await fetch('api/?module=health&action=askAI', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({
                        athlete_id: athlete.id,
                        focused_injury_id: focusedInjuryId,
                        message: message,
                        history: chatHistory
                    }),
                    signal: ModalUtils.getSignal()
                }).then(r => r.json());

                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();

                if (res.success && res.data && res.data.reply) {
                    if (message) chatHistory.push({role: 'user', content: message});
                    chatHistory.push({role: 'ai', content: res.data.reply});
                    if (chatHistory.length > MAX_CHAT_HISTORY) {
                        chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
                    }
                    appendMessage('AI', res.data.reply);
                } else {
                    throw new Error(res.error || "Errore AI");
                }
            } catch (err) {
                if (err.name === 'AbortError') return;
                const loadingEl = messagesContainer.lastElementChild;
                if(loadingEl && loadingEl.querySelector('.animate-spin')) {
                     loadingEl.remove();
                }
                appendMessage('AI', 'Errore: ' + err.message);
            } finally {
                input.disabled = false;
                submitBtn.disabled = false;
                input.focus();
            }
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = input.value.trim();
            if(!msg) return;
            input.value = '';
            askAI(msg);
        });

        askAI();
    }
};
