/**
 * Transport API Module
 * Fusion ERP v1.0
 */

'use strict';

const TransportAPI = (() => {
    async function listEvents() {
        return await Store.get('listEvents', 'transport');
    }

    async function listRoutes(eventId) {
        return await Store.get('listRoutes', 'transport', { eventId });
    }

    async function listAttendees(eventId) {
        return await Store.get('listAttendees', 'transport', { eventId });
    }

    async function listDrivers() {
        return await Store.get('listDrivers', 'transport');
    }

    async function createRoute(data) {
        return await Store.api('createRoute', 'transport', data);
    }

    async function matchCarpool(eventId) {
        return await Store.get('matchCarpool', 'transport', { eventId });
    }

    async function sendConvocations(eventId) {
        return await Store.api('sendConvocations', 'transport', { eventId });
    }

    async function updateAttendeeStatus(eventId, athleteId, status) {
        return await Store.api('updateAttendeeStatus', 'transport', { event_id: eventId, athlete_id: athleteId, status });
    }

    async function listGyms() {
        return await Store.get('listGyms', 'transport');
    }

    async function listTeams() {
        return await Store.get('listTeams', 'transport');
    }

    async function listAthletes(teamId) {
        return await Store.get('listAthletes', 'transport', { teamId });
    }

    async function listTransports(teamId) {
        return await Store.get('listTransports', 'transport', teamId ? { teamId } : {});
    }

    async function createTransport(data) {
        return await Store.api('createTransport', 'transport', data);
    }

    async function createDriver(data) {
        return await Store.api('createDriver', 'transport', data);
    }

    return {
        listEvents, listRoutes, listAttendees, listDrivers, createRoute,
        matchCarpool, sendConvocations, updateAttendeeStatus,
        listGyms, listTeams, listAthletes, listTransports, createTransport, createDriver
    };
})();

window.TransportAPI = TransportAPI;
