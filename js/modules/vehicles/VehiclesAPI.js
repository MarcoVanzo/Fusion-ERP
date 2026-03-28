export class VehiclesAPI {
    /**
     * Gets all vehicles from the fleet
     * @returns {Promise<Array>} Array of vehicle objects
     */
    static async getAllVehicles() {
        return await window.Store.get('getAllVehicles', 'vehicles');
    }

    /**
     * Gets a specific vehicle by ID, including its anomalies and maintenance records
     * @param {number|string} id 
     * @returns {Promise<Object>}
     */
    static async getVehicleById(id) {
        return await window.Store.get('getVehicleById', 'vehicles', { id });
    }

    /**
     * Creates a new vehicle
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    static async createVehicle(data) {
        return await window.Store.api('createVehicle', 'vehicles', data);
    }

    /**
     * Updates an existing vehicle
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    static async updateVehicle(data) {
        return await window.Store.api('updateVehicle', 'vehicles', data);
    }

    /**
     * Deletes a vehicle by ID
     * @param {number|string} id 
     * @returns {Promise<Object>}
     */
    static async deleteVehicle(id) {
        return await window.Store.api('deleteVehicle', 'vehicles', { id });
    }

    /**
     * Adds a maintenance record to a vehicle
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    static async addMaintenance(data) {
        return await window.Store.api('addMaintenance', 'vehicles', data);
    }

    /**
     * Adds an anomaly (fault report) to a vehicle
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    static async addAnomaly(data) {
        return await window.Store.api('addAnomaly', 'vehicles', data);
    }

    /**
     * Updates the status of a specific anomaly
     * @param {Object} data 
     * @returns {Promise<Object>}
     */
    static async updateAnomalyStatus(data) {
        return await window.Store.api('updateAnomalyStatus', 'vehicles', data);
    }
}
