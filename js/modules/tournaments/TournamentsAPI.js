/**
 * Tournaments API Module
 * Fusion ERP v1.1
 */

const TournamentsAPI = {
    list: async function() {
        const res = await Store.get("getTournaments", "tournaments");
        return res.tournaments || [];
    },

    get: async function(id) {
        return await Store.get("getTournament", "tournaments", { id });
    },

    save: async function(data) {
        return await Store.api("saveTournament", "tournaments", data);
    },

    updateRoster: async function(id, attendees) {
        return await Store.api("updateRoster", "tournaments", { event_id: id, attendees });
    },

    saveMatch: async function(data) {
        return await Store.api("saveMatch", "tournaments", data);
    },

    getTeams: async function() {
        // Reuse athletes module for teams dropdown if needed, 
        // or fetch from common endpoint
        const res = await Store.get("teams", "athletes");
        return Array.isArray(res) ? res : (res?.teams || []);
    },

    delete: async function(id) {
        return await Store.api("deleteTournament", "tournaments", { id });
    },

    duplicate: async function(id) {
        return await Store.api("duplicateTournament", "tournaments", { id });
    },

    saveExpense: async function(data) {
        return await Store.api("saveExpense", "tournaments", data);
    },

    deleteExpense: async (id) => {
        return await Store.api("deleteExpense", "tournaments", { id });
    },

    saveRoomingList: async (id) => {
        return await Store.api("saveRoomingList", "tournaments", { id });
    },

    saveSummaryPdf: async (id) => {
        return await Store.api("saveSummaryPdf", "tournaments", { id });
    }
};

export default TournamentsAPI;
