/**
 * Service/Repository layer for Talent Day module
 */
export class TalentDayAPI {
    /**
     * Fetch all Talent Day registrations for the current tenant.
     * @returns {Promise<{entries: Array, count: number}>}
     */
    static async listEntries() {
        return window.Store.get("listEntries", "talentday");
    }

    /**
     * Add a new Talent Day registration manually.
     * @param {Object} data
     * @returns {Promise<any>}
     */
    static async addEntry(data) {
        return window.Store.api("addEntry", "talentday", data);
    }

    /**
     * Update an existing Talent Day registration.
     * @param {Object} data Needs id payload at least.
     * @returns {Promise<any>}
     */
    static async updateEntry(data) {
        return window.Store.api("updateEntry", "talentday", data);
    }

    /**
     * Delete a Talent Day registration.
     * @param {Object} data Needs id payload.
     * @returns {Promise<any>}
     */
    static async deleteEntry(data) {
        return window.Store.api("deleteEntry", "talentday", data);
    }
}
