/**
 * AthletesAPI — Frontend SDK per il modulo Atleti
 * Astrae le chiamate a Store.get e Store.api per il decoupling della vista dalla logica di rete.
 */

export const AthletesAPI = {
    // --- Lettura ---
    getLightList: async () => await Store.get("listLight", "athletes"),
    
    getTeams: async () => await Store.get("teams", "athletes"),
    
    getById: async (id) => await Store.get("get", "athletes", { id }),

    getByUserId: async (userId) => await Store.get("getByUserId", "athletes", { user_id: userId }),

    getAcwr: async (id) => await Store.get("acwr", "athletes", { id }),

    getAiSummary: async (id) => await Store.get("aiSummary", "athletes", { id }),

    getActivityLog: async (id) => await Store.get("activityLog", "athletes", { id }),

    // --- Scrittura ---
    create: async (data) => await Store.api("create", "athletes", data),
    
    update: async (data) => await Store.api("update", "athletes", data),

    delete: async (id) => await Store.api("delete", "athletes", { id }),

    generateUser: async (id) => await Store.api("generateUser", "athletes", { id }),

    logMetric: async (data) => await Store.api("logMetric", "athletes", data),

    generateAIReport: async (athleteId) => await Store.api("aiReport", "athletes", { athlete_id: athleteId }),

    // --- Upload File ---
    uploadPhoto: async (id, file) => {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("photo", file);
        return await Store.api("uploadPhoto", "athletes", formData, "POST");
    },

    uploadDocument: async (id, type, file) => {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("file", file);

        // Mappatura tra tipo frontend e action backend
        const actionMap = {
            "contract-file": "uploadContractFile",
            "id-doc-front": "uploadIdDocFront",
            "id-doc-back": "uploadIdDocBack",
            "cf-doc-front": "uploadCfDocFront",
            "cf-doc-back": "uploadCfDocBack",
            "med-cert": "uploadMedicalCert"
        };

        const action = actionMap[type];
        if (!action) throw new Error("Tipo documento non supportato");

        return await Store.api(action, "athletes", formData, "POST");
    }
};
