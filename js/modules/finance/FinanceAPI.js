/**
 * Finance API Module
 * Fusion ERP v1.1
 */

const FinanceAPI = {
    getDashboard: async function() {
        return await Store.get("dashboard", "finance");
    },

    getCategories: async function() {
        const res = await Store.get("categories", "finance");
        return res?.categories || {};
    },

    getChartOfAccounts: async function() {
        return await Store.get("chartOfAccounts", "finance");
    },

    listEntries: async function() {
        return await Store.get("listEntries", "finance");
    },
    
    getEntry: async function(id) {
        return await Store.get("getEntry", "finance", { id });
    },

    createEntry: async function(data) {
        return await Store.api("createEntry", "finance", data);
    },

    getRendiconto: async function() {
        return await Store.get("rendiconto", "finance");
    },

    getFiscal74ter: async function() {
        return await Store.get("getFiscal74ter", "finance");
    },

    getInvoices: async function() {
        return await Store.get("listInvoices", "finance");
    }

};

export default FinanceAPI;
