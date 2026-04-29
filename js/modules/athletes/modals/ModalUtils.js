export const ModalUtils = {
    _modalAc: null,

    closeModal(overlay) {
        if (this._modalAc) {
            this._modalAc.abort();
            this._modalAc = null;
        }
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    },

    createModal(htmlContent) {
        if (this._modalAc) {
            this._modalAc.abort();
        }
        this._modalAc = new AbortController();

        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop';
        overlay.style = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;';
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style = 'background:var(--color-bg); padding:32px; border-radius:16px; border:1px solid rgba(255,255,255,0.1); width:100%; max-width:600px; max-height:90vh; overflow-y:auto; position:relative;';
        modal.innerHTML = htmlContent;
        
        overlay.appendChild(modal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal(overlay);
        }, { signal: this._modalAc.signal });
        
        const closeBtns = overlay.querySelectorAll('.close-modal-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(overlay), { signal: this._modalAc.signal });
        });

        return overlay;
    },

    getSignal() {
        return this._modalAc ? this._modalAc.signal : undefined;
    }
};
