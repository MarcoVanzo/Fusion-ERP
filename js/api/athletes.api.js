"use strict";

/**
 * AthletesAPI - Frontend SDK per le chiamate API del modulo Atleti
 * Astrae le chiamate a Store.get e Store.api per decoupling della vista della logica di rete.
 */
/* eslint-disable-next-line no-unused-vars */
const AthletesAPI = (() => {
    return {
        // --- Lettura ---
        getLightList: async () => await Store.get("listLight", "athletes"),
        
        getTeams: async () => await Store.get("teams", "athletes"),
        
        getById: async (id) => await Store.get("get", "athletes", { id }),

        // --- Scrittura ---
        create: async (data) => await Store.api("create", "athletes", data),
        
        update: async (data) => await Store.api("update", "athletes", data),

        // --- Upload File (usando Store.api con FormData per decoupling raw fetch) ---
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
})();
