// js/modules/newsletter/NewsletterAPI.js

export const NewsletterAPI = {
    async getConfig() {
        try {
            return await Store.get("getConfig", "newsletter");
        } catch (_err) {
            return { configured: false };
        }
    },
    
    async getStats() {
        return await Store.get("getStats", "newsletter");
    },
    
    async listGroups() {
        return await Store.get("listGroups", "newsletter");
    },
    
    async listCampaigns() {
        return await Store.get("listCampaigns", "newsletter");
    },
    
    async listSubscribers(params = {}) {
        return await Store.get("listSubscribers", "newsletter", params);
    },
    
    async upsertSubscriber(data) {
        return await Store.api("upsertSubscriber", "newsletter", data);
    },
    
    async deleteSubscriber(id) {
        return await Store.api("deleteSubscriber", "newsletter", { id });
    },
    
    async createGroup(data) {
        return await Store.api("createGroup", "newsletter", data);
    },
    
    async deleteGroup(id) {
        return await Store.api("deleteGroup", "newsletter", { id });
    }
};
