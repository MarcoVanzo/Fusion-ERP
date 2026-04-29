import { ModalUtils } from './ModalUtils.js';

export const DocViewerModal = {
    open(url, title, type) {
        if (/^(javascript|data|vbscript):/i.test(url.trim())) {
            UI.toast('URL documento non valido', 'error');
            return;
        }

        if (type === 'other') {
            window.open(url, '_blank', 'width=800,height=800,menubar=no,toolbar=no,location=no,status=no');
            return;
        }

        const safeUrl = Utils.escapeHtml(url);

        let contentHtml = '';
        if (type === 'img') {
            contentHtml = `<img src="${safeUrl}" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:8px; display:block; margin:0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">`;
        } else if (type === 'pdf') {
            contentHtml = `<iframe src="${safeUrl}" style="width:100%; height:80vh; border:none; border-radius:8px; background:#fff; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"></iframe>`;
        }

        const theModal = ModalUtils.createModal(`
            <style>
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .doc-viewer-modal { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            </style>
            <div class="doc-viewer-modal" style="display:flex; flex-direction:column; gap:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:16px; min-width:0;">
                        <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0;">
                            <i class="${type === 'pdf' ? 'ph ph-file-pdf' : (type === 'img' ? 'ph ph-file-image' : 'ph ph-file-text')}" style="font-size:20px;"></i>
                        </div>
                        <h3 style="color:#fff; font-size:20px; font-weight:900; margin:0; letter-spacing:-0.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${Utils.escapeHtml(title)}">${Utils.escapeHtml(title)}</h3>
                    </div>
                    <button type="button" class="btn btn-ghost close-modal-btn" style="background:rgba(255,255,255,0.05); color:#fff; border-radius:50%; width:44px; height:44px; padding:0; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); cursor:pointer; flex-shrink:0; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <i class="ph ph-x" style="font-size:20px;"></i>
                    </button>
                </div>
                
                <div style="background:var(--color-bg); border-radius:16px; padding:0; display:flex; justify-content:center; align-items:center; overflow:hidden; position:relative; min-height:200px;">
                    ${contentHtml}
                </div>
            </div>
        `);
        
        const modalContent = theModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = type === 'pdf' || type === 'img' ? '1200px' : '500px';
            modalContent.style.width = '95%';
            modalContent.style.padding = '24px';
        }

        document.body.appendChild(theModal);
    }
};
