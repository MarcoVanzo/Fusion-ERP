/**
 * Service/Repository layer for Scouting Module fetching data and syncing with Cognito Forms
 */
export class ScoutingAPI {
    /**
     * Fetch list of athletes in the scouting database.
     * @returns {Promise<{entries: Array, last_sync: string|null}>}
     */
    static async listDatabase() {
        return window.Store.get("listDatabase", "scouting");
    }

    /**
     * Synchronizes new entries from AWS Cognito.
     * @returns {Promise<{total: number}>}
     */
    static async syncFromCognito() {
        return window.Store.api("syncFromCognito", "scouting", {});
    }

    /**
     * Adds an athlete entry manually.
     * @param {Object} data 
     * @returns {Promise<any>}
     */
    static async addManualEntry(data) {
        return window.Store.api("addManualEntry", "scouting", data);
    }

    /**
     * Updates an existing entry, causing it to lock from future Cognito syncs.
     * @param {Object} data Needs id payload at least.
     * @returns {Promise<any>}
     */
    static async updateEntry(data) {
        return window.Store.api("updateEntry", "scouting", data);
    }
}
