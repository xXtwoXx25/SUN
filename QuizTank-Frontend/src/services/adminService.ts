import api from './api';

export const adminService = {
    // Users
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },
    getUser: async (id: string) => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },
    createUser: async (data: any) => {
        const response = await api.post('/admin/users', data);
        return response.data;
    },
    updateUser: async (id: string, data: any) => {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    },

    // Games
    getGames: async (params?: any) => {
        const response = await api.get('/admin/games', { params });
        return response.data;
    },
    getGame: async (id: string) => {
        const response = await api.get(`/admin/games/${id}`);
        return response.data;
    },
    createGame: async (data: any) => {
        const response = await api.post('/admin/games', data);
        return response.data;
    },
    updateGame: async (id: string, data: any) => {
        const response = await api.put(`/admin/games/${id}`, data);
        return response.data;
    },

    // Reports
    getReports: async () => {
        const response = await api.get('/admin/reports');
        return response.data;
    },
    getReport: async (id: string) => {
        const response = await api.get(`/admin/reports/${id}`);
        return response.data;
    },
    updateReport: async (id: string, data: any) => {
        const response = await api.put(`/admin/reports/${id}`, data);
        return response.data;
    },

    // Options
    getOptions: async () => {
        const response = await api.get('/admin/options');
        return response.data;
    },
    updateOption: async (key: string, value: any) => {
        const response = await api.put('/admin/options', { key, value });
        return response.data;
    },

    // Challenges
    getChallenges: async () => {
        const response = await api.get('/admin/challenges');
        return response.data;
    },
    getChallenge: async (id: string) => {
        const response = await api.get(`/admin/challenges/${id}`);
        return response.data;
    },
    createChallenge: async (data: any) => {
        const response = await api.post('/admin/challenges', data);
        return response.data;
    },
    updateChallenge: async (id: string, data: any) => {
        const response = await api.put(`/admin/challenges/${id}`, data);
        return response.data;
    },
    deleteChallenge: async (id: string) => {
        const response = await api.delete(`/admin/challenges/${id}`);
        return response.data;
    },

    // Game Plays
    getGamePlays: async () => {
        const response = await api.get('/game-plays');
        return response.data;
    }
};
