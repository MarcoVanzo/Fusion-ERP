/**
 * Service/Repository layer for Open Day module
 */
export class OpenDayAPI {
    /**
     * Fetch all Open Day registrations for the current tenant.
     * @returns {Promise<{entries: Array, count: number}>}
     */
    static async listEntries() {
        return window.Store.get("listEntries", "openday");
    }

    /**
     * Add a new Open Day registration manually.
     * @param {Object} data
     * @returns {Promise<any>}
     */
    static async addEntry(data) {
        return window.Store.api("addEntry", "openday", data);
    }

    /**
     * Update an existing Open Day registration.
     * @param {Object} data Needs id payload at least.
     * @returns {Promise<any>}
     */
    static async updateEntry(data) {
        return window.Store.api("updateEntry", "openday", data);
    }

    /**
     * Delete an Open Day registration.
     * @param {Object} data Needs id payload.
     * @returns {Promise<any>}
     */
    static async deleteEntry(data) {
        return window.Store.api("deleteEntry", "openday", data);
    }
}
