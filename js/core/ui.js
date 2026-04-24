'use strict';

/**
 * UI — Modal, Toast, Confirm, Loading Overlay, Skeleton
 * Fusion ERP v1.0
 *
 * Separated from store.src.js for single-responsibility.
 * Exposes: UI (global)
 *
 * Dependencies: Utils (for escapeHtml)
 */

const UI = (() => {
    /** Active loading overlay counter (supports nested show/hide) */
    let _loadingCount = 0;

    /**
     * Create and display a modal dialog.
     * @param {{ title: string, body: string|Node, footer?: string|Node, size?: 'normal'|'large'|'xlarge', onClose?: () => void }} options
     * @returns {{ close: () => void }} Modal control object
     */
    function modal({ title, body, footer = '', size = 'normal', onClose }) {
        const container = document.getElementById('modal-container');
        if (!container) return null;

        // Save focus for restoration after close
        const previousFocus = document.activeElement;

        let modalStyle = "";
        if (size === 'large') modalStyle = "max-width: 800px; width: 90%;";
        if (size === 'xlarge') modalStyle = "max-width: 1200px; width: 95%;";

        container.innerHTML = `
          <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal" style="${modalStyle}">
              <div class="modal-header">
                <h2 class="modal-title" id="modal-title">${Utils.escapeHtml(title)}</h2>
                <button class="btn btn-ghost btn-sm" id="modal-close-btn" aria-label="Chiudi finestra" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="modal-body" style="${size !== 'normal' ? 'padding:0;' : ''}"></div>
            </div>
          </div>`;

        // Insert body content
        const bodyEl = container.querySelector('.modal-body');
        if (typeof body === 'string') {
            bodyEl.innerHTML = body;
        } else if (body instanceof Node) {
            bodyEl.appendChild(body);
        }

        // Insert footer if provided
        if (footer) {
            const footerEl = document.createElement('div');
            footerEl.className = 'modal-footer';
            if (typeof footer === 'string') {
                footerEl.innerHTML = footer;
            } else if (footer instanceof Node) {
                footerEl.appendChild(footer);
            }
            container.querySelector('.modal').appendChild(footerEl);
        }

        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');

        // Accessibility: hide elements behind modal
        const hiddenEls = ['#sidebar', '#topbar']
            .map(s => document.querySelector(s))
            .filter(Boolean);
        hiddenEls.forEach(el => el.setAttribute('aria-hidden', 'true'));

        // Focus trap
        const getFocusable = () =>
            Array.from(overlay.querySelectorAll(
                'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
            ));

        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusable();
            if (!focusable.length) { e.preventDefault(); return; }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };

        const escHandler = (e) => { if (e.key === 'Escape') close(); };

        const close = () => {
            document.removeEventListener('keydown', trapFocus);
            document.removeEventListener('keydown', escHandler);
            container.innerHTML = '';
            hiddenEls.forEach(el => el.removeAttribute('aria-hidden'));
            if (previousFocus && typeof previousFocus.focus === 'function') {
                try { previousFocus.focus(); } catch (e) { /* noop */ }
            }
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', trapFocus);
        document.addEventListener('keydown', escHandler);

        // Auto-focus first focusable element
        requestAnimationFrame(() => {
            const focusable = getFocusable();
            if (focusable.length) focusable[0].focus();
        });

        return { close };
    }

    return {
        /**
         * Show or hide the full-screen loading overlay.
         * Supports nested calls (show/hide must be balanced).
         * @param {boolean} show - true to show, false to hide
         * @param {string} [text='Caricamento...'] - Status text
         */
        loading: function (show, text = 'Caricamento...') {
            _loadingCount = Math.max(0, _loadingCount + (show ? 1 : -1));

            let overlay = document.getElementById('loader-overlay');

            if (_loadingCount > 0) {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'loader-overlay';
                    overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;opacity:0;transition:opacity 0.3s ease;';
                    overlay.innerHTML = `<div class="loader-content" style="text-align:center;"><div class="loader-spinner" style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--color-pink);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div><div class="loader-text" style="font-family:var(--font-display);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.8;">${Utils.escapeHtml(text)}</div></div>`;
                    document.body.appendChild(overlay);
                    requestAnimationFrame(() => overlay.style.opacity = '1');
                } else {
                    overlay.querySelector('.loader-text').textContent = text;
                    overlay.style.display = 'flex';
                    overlay.style.opacity = '1';
                }
            } else if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => { if (_loadingCount <= 0) overlay.style.display = 'none'; }, 300);
            }
        },

        /**
         * Display a toast notification.
         * @param {string} message - Message text
         * @param {'success'|'error'|'info'|'warning'} [type='info'] - Toast type
         * @param {number} [duration=4000] - Auto-dismiss duration in ms
         */
        toast: function (message, type = 'info', duration = 4000) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00E676" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF00FF" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD600" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
                info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
            };

            const toast = document.createElement('div');
            toast.className = `toast toast-${Utils.escapeHtml(type)}`;
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `${icons[type] || icons.info}<span>${Utils.escapeHtml(message)}</span>`;
            
            const dismiss = document.createElement('button');
            dismiss.innerHTML = '&times;';
            dismiss.style.marginLeft = '10px';
            dismiss.onclick = () => toast.remove();
            toast.appendChild(dismiss);

            requestAnimationFrame(() => {
                container.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transition = 'opacity 200ms ease';
                    setTimeout(() => toast.remove(), 200);
                }, duration);
            });
        },

        /**
         * Return skeleton loading HTML for a page placeholder.
         * @returns {string} HTML string
         */
        skeletonPage: function () {
            return `
              <div class="page-body" style="display:flex;flex-direction:column;gap:var(--sp-2);">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width:40%;"></div>
                <div style="margin-top:var(--sp-3);display:flex;flex-direction:column;gap:8px;">
                  ${Array.from({ length: 6 }, () =>
                      `<div class="skeleton skeleton-text" style="width:${50 + 45 * Math.random() | 0}%;"></div>`
                  ).join('')}
                </div>
              </div>`;
        },

        /** @see modal */
        modal,

        /**
         * Display a confirmation dialog with Cancel/Confirm buttons.
         * @param {string} message - Confirmation question
         * @param {() => void} onConfirm - Callback on confirm
         */
        confirm: function (message, onConfirm) {
            const body = document.createElement('p');
            body.textContent = message;

            const footer = document.createDocumentFragment();
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-ghost btn-sm';
            cancelBtn.id = 'confirm-cancel';
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Annulla';

            const okBtn = document.createElement('button');
            okBtn.className = 'btn btn-danger btn-sm';
            okBtn.id = 'confirm-ok';
            okBtn.type = 'button';
            okBtn.textContent = 'Conferma';

            footer.appendChild(cancelBtn);
            footer.appendChild(okBtn);

            const m = modal({ title: 'Conferma', body, footer });

            document.getElementById('confirm-cancel')?.addEventListener('click', () => m.close());
            document.getElementById('confirm-ok')?.addEventListener('click', () => {
                m.close();
                onConfirm();
            });
        },

        /**
         * Open a PDF seamlessly in an internal modal to bypass popup-blockers
         * @param {string} url - URL of the PDF
         * @param {string} title - Title of the modal
         */
        openPdf: function (url, title = 'Visualizzatore PDF') {
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            if (isIOS || isSafari) {
                // Su iOS e Safari nativo, l'iframe per i PDF è buggato (schermo bianco o grigio).
                // Apriamo direttamente in una nuova scheda.
                window.open(url, '_blank');
            } else {
                const body = `<iframe src="${url}" style="width:100%; height:85vh; border:none; border-radius:0 0 8px 8px; background:#fff; display:block;"></iframe>`;
                modal({ title, body, footer: '', size: 'xlarge' });
            }
        }
    };
})();
window.UI = UI;
