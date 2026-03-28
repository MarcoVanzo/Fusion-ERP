export class NetworkAPI {
    // --- HUB API ---
    static async getHubConfig() {
        return await window.Store.get("getHubConfig", "network");
    }

    static async updateHubText(text) {
        return await window.Store.api("updateHubText", "network", { text });
    }

    static async uploadHubLogo(fd) {
        return await window.Store.api("uploadHubLogo", "network", fd);
    }

    // --- COLLABORATIONS API ---
    static async listCollaborations() {
        return await window.Store.get("listCollaborations", "network");
    }

    static async createCollaboration(data) {
        return await window.Store.api("createCollaboration", "network", data);
    }

    static async updateCollaboration(data) {
        return await window.Store.api("updateCollaboration", "network", data);
    }

    static async deleteCollaboration(id) {
        return await window.Store.api("deleteCollaboration", "network", { id });
    }

    static async uploadColLogo(fd) {
        return await window.Store.api("uploadColLogo", "network", fd);
    }

    static async uploadColDocument(fd) {
        return await window.Store.api("uploadColDocument", "network", fd);
    }

    static async listColDocuments(collaborationId) {
        return await window.Store.get("listColDocuments", "network", { collaboration_id: collaborationId });
    }

    // --- TRIALS API ---
    static async listTrials() {
        return await window.Store.get("listTrials", "network");
    }

    static async createTrial(data) {
        return await window.Store.api("createTrial", "network", data);
    }

    static async updateTrial(data) {
        return await window.Store.api("updateTrial", "network", data);
    }

    static async evaluateTrial(data) {
        return await window.Store.api("evaluateTrial", "network", data);
    }

    static async convertToScouting(trialId) {
        return await window.Store.api("convertToScouting", "network", { trial_id: trialId });
    }

    static async deleteTrial(id) {
        return await window.Store.api("deleteTrial", "network", { id });
    }

    // --- ACTIVITIES API ---
    static async listActivities() {
        return await window.Store.get("listActivities", "network");
    }

    static async createActivity(data) {
        return await window.Store.api("createActivity", "network", data);
    }

    static async updateActivity(data) {
        return await window.Store.api("updateActivity", "network", data);
    }

    static async deleteActivity(id) {
        return await window.Store.api("deleteActivity", "network", { id });
    }
}
