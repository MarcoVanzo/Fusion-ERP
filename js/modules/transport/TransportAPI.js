/**
 * Transport API Module
 * Provides methods to interact with the Transport backend.
 */

const TransportAPI = {
    getEvents: async (teamId = '', type = '') => {
        return Store.fetchAPI(`/transport/events?teamId=${teamId}&type=${type}`);
    },

    createEvent: async (data) => {
        return Store.fetchAPI('/transport/events', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getRoutes: async (eventId) => {
        return Store.fetchAPI(`/transport/routes?eventId=${eventId}`);
    },

    createRoute: async (data) => {
        return Store.fetchAPI('/transport/routes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getAttendees: async (eventId) => {
        return Store.fetchAPI(`/transport/attendees?eventId=${eventId}`);
    },

    addPassenger: async (data) => {
        return Store.fetchAPI('/transport/passengers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    confirmPassenger: async (data) => {
        return Store.fetchAPI('/transport/passengers/confirm', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getGyms: async () => {
        return Store.fetchAPI('/transport/gyms');
    },

    createGym: async (data) => {
        return Store.fetchAPI('/transport/gyms', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    deleteGym: async (data) => {
        return Store.fetchAPI('/transport/gyms/delete', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getTeams: async () => {
        return Store.fetchAPI('/transport/teams');
    },

    getTeamAthletes: async (teamId) => {
        return Store.fetchAPI(`/transport/athletes?teamId=${teamId}`);
    },

    saveTransport: async (data) => {
        return Store.fetchAPI('/transport/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getTransports: async (teamId = '') => {
        return Store.fetchAPI(`/transport/list?teamId=${teamId}`);
    },

    getDrivers: async () => {
        return Store.fetchAPI('/transport/drivers');
    },

    getVehicles: async () => {
        return Store.fetchAPI('/fleet/list'); // Assuming vehicles come from fleet module
    },

    sendConvocations: async (data) => {
        return Store.fetchAPI('/transport/convocations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    generateReimbursement: async (data) => {
        return Store.fetchAPI('/transport/reimbursements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    analyzeAI: async (data) => {
        return Store.fetchAPI('/transport/ai-analyze', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

export default TransportAPI;
