/**
 * Staff API Module
 * Fusion ERP v1.1
 */

const StaffAPI = {
    list: async function() {
        return await Store.get("list", "staff");
    },
    
    get: async function(id) {
        return await Store.get("get", "staff", { id });
    },
    
    create: async function(data) {
        return await Store.api("create", "staff", data);
    },
    
    update: async function(data) {
        return await Store.api("update", "staff", data);
    },
    
    delete: async function(id) {
        return await Store.api("delete", "staff", { id });
    },

    getTeams: async function() {
        return await Store.get("teams", "athletes").catch(() => []);
    },

    // Contract Management
    generateContract: async function(data) {
        return await Store.api("generateContract", "staff", data);
    },

    checkContractStatus: async function(id) {
        return await Store.api("checkContractStatus", "staff", { id });
    },

    // File Uploads
    uploadFile: async function(id, file, action) {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("file", file);

        const response = await fetch(`api/router.php?module=staff&action=${action}`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "X-Requested-With": "XMLHttpRequest" },
            body: formData,
        });

        const res = await response.json();
        if (!response.ok || !res.success) {
            throw new Error(res.error || "Errore di caricamento");
        }

        Store.invalidate("list", "staff");
        Store.invalidate("get", "staff");
        return res;
    }
};

export default StaffAPI;
