import api from './api';

export const gameService = {
    // Public
    checkGamePin: async (pin: string) => {
        const response = await api.get(`/games/check-pin/${pin}`);
        return response.data;
    },

    getRecentGames: async () => {
        const response = await api.get('/games/recent');
        return response.data;
    },

    getTrendingGames: async () => {
        const response = await api.get('/games/trending');
        return response.data;
    },

    getPopularAiGames: async () => {
        const response = await api.get('/games/popular-ai');
        return response.data;
    },

    searchGames: async (query: string) => {
        const response = await api.get(`/games/search?q=${query}`);
        return response.data;
    },

    submitContact: async (data: { name: string, email: string, subject: string, message: string }) => {
        const response = await api.post('/games/contact', data);
        return response.data;
    },

    // Private
    getUserNavbar: async () => {
        const response = await api.get('/games/me-navbar');
        return response.data;
    },

    getFavoriteGames: async () => {
        const response = await api.get('/games/favorites');
        return response.data;
    },

    getMyGames: async () => {
        const response = await api.get('/games/my-games');
        return response.data;
    },

    getGameDetail: async (id: string) => {
        const response = await api.get(`/games/${id}/details`);
        return response.data;
    },

    getGameDashboard: async (id: string) => {
        const response = await api.get(`/games/${id}/dashboard`);
        return response.data;
    },

    createGame: async (gameData: any) => {
        const response = await api.post('/games', gameData);
        return response.data;
    },

    updateGame: async (id: string, gameData: any) => {
        const response = await api.put(`/games/${id}`, gameData);
        return response.data;
    },

    deleteGame: async (id: string) => {
        const response = await api.delete(`/games/${id}`);
        return response.data;
    },

    uploadMedia: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/games/media', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Game Plays
    startPlay: async (gameRoomId: number) => {
        const response = await api.post('/game-plays/start', { gameRoomId });
        return response.data;
    },

    endPlay: async (id: number, status: number, completionTime: number | null) => {
        const response = await api.put(`/game-plays/${id}/end`, { status, completionTime });
        return response.data;
    },

    getLeaderboard: async (gameId: string | number) => {
        const response = await api.get(`/game-plays/leaderboard/${gameId}`);
        return response.data;
    },

    getGameStats: async (gameId: string | number) => {
        const response = await api.get(`/game-plays/stats/${gameId}`);
        return response.data;
    },

    getGameHistory: async (gameId: string | number) => {
        const response = await api.get(`/game-plays/history/${gameId}`);
        return response.data;
    },

    submitReview: async (gameId: string | number, rating: number) => {
        const response = await api.post(`/reviews/${gameId}`, { rating });
        return response.data;
    },

    getMyReview: async (gameId: string | number) => {
        const response = await api.get(`/reviews/${gameId}`);
        return response.data;
    }
};
