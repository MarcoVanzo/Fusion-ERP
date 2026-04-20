/**
 * Societa OrgChart Module — Handles Drag & Drop and Role positioning
 */
import SocietaAPI from './SocietaAPI.js';

export default {
    draggedId: null,

    initDragAndDrop: function(container, onUpdate, signal) {
        const nodes = container.querySelectorAll(".soc-tree-node");
        
        nodes.forEach(node => {
            node.addEventListener("dragstart", (e) => {
                this.draggedId = node.dataset.roleId;
                node.classList.add("dragging");
                e.dataTransfer.setData("text/plain", this.draggedId);
            }, { signal });

            node.addEventListener("dragend", () => {
                node.classList.remove("dragging");
                this.draggedId = null;
            }, { signal });

            node.addEventListener("dragover", (e) => {
                e.preventDefault();
                node.classList.add("drag-over");
            }, { signal });

            node.addEventListener("dragleave", () => {
                node.classList.remove("drag-over");
            }, { signal });

            node.addEventListener("drop", async (e) => {
                e.preventDefault();
                node.classList.remove("drag-over");
                const targetId = node.dataset.roleId;

                if (this.draggedId && this.draggedId !== targetId) {
                    try {
                        UI.loading(true);
                        // In a real scenario, we might want to check for circularity here
                        await SocietaAPI.updateRole({ id: this.draggedId, name: this.getRoleNameById(this.draggedId), parent_role_id: targetId });
                        UI.toast("Gerarchia aggiornata", "success");
                        if (onUpdate) onUpdate();
                    } catch (_err) {
                        UI.toast("Errore: " + err.message, "error");
                    } finally {
                        UI.loading(false);
                    }
                }
            }, { signal });
        });
    },

    getRoleNameById: function(id) {
        // This should probably come from a shared state or the orchestrator
        const el = document.querySelector(`.soc-tree-node[data-role-id="${id}"] .soc-tree-node-name`);
        return el ? el.textContent.trim() : "";
    }
};
