/**
 * Results API Module
 * Fusion ERP v1.1
 */

const ResultsAPI = {
    listChampionships: async function() {
        const res = await Store.get("getCampionati", "results");
        return res.campionati || [];
    },

    getMatches: async function(params) {
        // params: { campionato_id: id } OR { campionato_url: url }
        return await Store.get("getResults", "results", params);
    },

    getStandings: async function(params) {
        return await Store.get("getStandings", "results", params);
    },

    sync: async function(campionatoId) {
        return await Store.api("syncCampionato", "results", { id: campionatoId });
    },

    add: async function(label, url) {
        return await Store.api("addCampionato", "results", { label, url });
    },

    delete: async function(id) {
        return await Store.api("deleteCampionato", "results", { id });
    }
};

export default ResultsAPI;
