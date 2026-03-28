/**
 * Teams API Module
 * Fusion ERP v1.1
 */

const TeamsAPI = {
    /** Lists all teams with grouped seasons */
    list: async () => {
        return await Store.api("listGrouped", "teams", {});
    },

    /** Lists active team-seasons for dropdowns */
    listActive: async () => {
        return await Store.api("listActive", "teams", {});
    },

    /** Create a new team with initial season */
    create: async (data) => {
        return await Store.api("create", "teams", data);
    },

    /** Update basic team info */
    update: async (data) => {
        return await Store.api("update", "teams", data);
    },

    /** Add a season to a team */
    addSeason: async (data) => {
        return await Store.api("addSeason", "teams", data);
    },

    /** Toggle season active state */
    toggleSeason: async (id, isActive) => {
        return await Store.api("toggleSeason", "teams", { id, is_active: isActive });
    },

    /** Remove a season mapping from a team */
    deleteSeason: async (teamSeasonId) => {
        return await Store.api("deleteSeason", "teams", { team_season_id: teamSeasonId });
    },

    /** Soft delete a team */
    deleteTeam: async (id) => {
        return await Store.api("delete", "teams", { id });
    }
};

export default TeamsAPI;
