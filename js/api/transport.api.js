"use strict";

/**
 * TransportAPI - Frontend SDK per le chiamate API del modulo Trasporti
 * Astrae le chiamate a Store.get e Store.api per decoupling della vista della logica di rete.
 */
const TransportAPI = (() => {
    return {
        // --- Eventi e Viaggi ---
        getEvents: async () => await Store.get("listEvents", "transport"),
        getTransports: async () => await Store.get("listTransports", "transport"),
        createEvent: async (data) => await Store.api("createEvent", "transport", data),
        
        // --- Dettaglio Evento ---
        getRoutes: async (eventId) => await Store.get("listRoutes", "transport", { eventId }),
        getAttendees: async (eventId) => await Store.get("listAttendees", "transport", { eventId }),
        createRoute: async (data) => await Store.api("createRoute", "transport", data),
        sendConvocations: async (eventId) => await Store.api("sendConvocations", "transport", { eventId }),
        
        // --- Dizionari di appoggio ---
        getGyms: async () => await Store.get("listGyms", "transport"),
        getTeams: async () => await Store.get("listTeams", "transport"),
        getDrivers: async () => await Store.get("listDrivers", "transport"),
        
        // --- Relativo a Veicoli ---
        getVehicles: async () => await Store.get("getAllVehicles", "vehicles"),

        // --- Atleti per Squadra ---
        getTeamAthletes: async (teamId) => await Store.get("listTeamAthletes", "transport", { teamId }),

        // --- Palestre ---
        createGym: async (data) => await Store.api("createGym", "transport", data),
        deleteGym: async (id) => await Store.api("deleteGym", "transport", { id }),

        // --- Driver ---
        createDriver: async (data) => await Store.api("createDriver", "transport", data),
        toggleDriverActive: async (id, isActive) => await Store.api("toggleDriverActive", "transport", { id, is_active: isActive }),
        deleteDriver: async (id) => await Store.api("deleteDriver", "transport", { id }),

        // --- Modifica Passaggio / Transport ---
        saveTransport: async (data) => await Store.api("saveTransport", "transport", data),
        analyzeTransportAI: async (payload) => await Store.api("analyzeTransportAI", "transport", payload),
        updateAttendeeStatus: async (eventId, athleteId, status) => await Store.api("updateAttendeeStatus", "transport", { eventId, athleteId, status })
    };
})();
