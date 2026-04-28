/**
 * Service/Repository layer for Open Day module
 */
export class OpenDayAPI {
    /**
     * Fetch Open Day registrations for the current tenant, filtered by annata.
     * @param {number} [annata] - Edition year (defaults to current year on server)
     * @returns {Promise<{entries: Array, count: number, annata: number, available_years: number[]}>}
     */
    static async listEntries(annata) {
        const params = annata ? { annata } : {};
        return window.Store.get("listEntries", "openday", params);
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
