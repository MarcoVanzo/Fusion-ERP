/**
 * Transport API Module
 * Provides methods to interact with the Transport backend.
 */

const TransportAPI = {
    getEvents: async (teamId = '', type = '') => {
        return await Store.get("listEvents", "transport", { teamId, type });
    },

    createEvent: async (data) => {
        return await Store.api("createEvent", "transport", data);
    },

    getRoutes: async (eventId) => {
        return await Store.get("listRoutes", "transport", { eventId });
    },

    createRoute: async (data) => {
        return await Store.api("createRoute", "transport", data);
    },

    getAttendees: async (eventId) => {
        return await Store.get("listAttendees", "transport", { eventId });
    },

    addPassenger: async (data) => {
        return await Store.api("addPassenger", "transport", data);
    },

    confirmPassenger: async (data) => {
        return await Store.api("confirmPassenger", "transport", data);
    },

    getGyms: async () => {
        return await Store.get("listGyms", "transport");
    },

    createGym: async (data) => {
        return await Store.api("createGym", "transport", data);
    },

    deleteGym: async (data) => {
        return await Store.api("deleteGym", "transport", data);
    },

    getTeams: async () => {
        return await Store.get("listTeams", "transport");
    },

    getTeamAthletes: async (teamId) => {
        return await Store.get("listTeamAthletes", "transport", { teamId });
    },

    saveTransport: async (data) => {
        return await Store.api("saveTransport", "transport", data);
    },

    getTransports: async (teamId = '') => {
        return await Store.get("listTransports", "transport", { teamId });
    },

    getDrivers: async () => {
        return await Store.get("listDrivers", "transport");
    },

    createDriver: async (data) => {
        return await Store.api("createDriver", "transport", data);
    },

    toggleDriverActive: async (data) => {
        return await Store.api("toggleDriverActive", "transport", data);
    },

    deleteDriver: async (data) => {
        return await Store.api("deleteDriver", "transport", data);
    },

    getDriverDetail: async (id) => {
        return await Store.get("getDriverDetail", "transport", { id });
    },

    updateDriver: async (data) => {
        return await Store.api("updateDriver", "transport", data);
    },

    getVehicles: async () => {
        return await Store.get("listVehicles", "transport");
    },

    sendConvocations: async (data) => {
        return await Store.api("sendConvocations", "transport", data);
    },

    generateReimbursement: async (data) => {
        return await Store.api("generateReimbursement", "transport", data);
    },

    getStats: async () => {
        return await Store.get("getStats", "transport");
    },

    analyzeAI: async (data) => {
        return await Store.api("analyzeTransportAI", "transport", data);
    }
};

export default TransportAPI;
