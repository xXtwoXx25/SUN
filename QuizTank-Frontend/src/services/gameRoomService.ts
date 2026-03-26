import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Axios instance with auth interceptor
const api = axios.create({
    baseURL: `${API_BASE_URL}/rooms`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Game Room Service - Simplified API for game_rooms table
 */

// Question types
export const QUESTION_TYPES = {
    SINGLE: 1,    // Choice - Single Answer
    MULTIPLE: 2,  // Choice - Multiple Answers
    FILL: 3       // Fill-in
};

// Game status
export const GAME_STATUS = {
    PUBLISHED: 1,
    DRAFT: 2,
    REMOVED: 3
};

// Game visibility
export const GAME_VISIBILITY = {
    PUBLIC: 1,
    PRIVATE: 2,
    LOCKED: 3,
    UNLISTED: 4
};

export interface GameRoomQuestion {
    type: number;
    question: string;
    media: { url: string; type: "image" | "video" }[];
    choices?: { content: string; correct: number }[];
    answers?: string[];
}

export interface GameRoomKnowledge {
    content: string;
    media_url?: string;
}

export interface GameRoomData {
    name: string;
    status?: number;
    visibility?: number;
    password?: string;
    ai_generated?: boolean | number;
    category: string;
    language: string;
    tags: string[];
    description: string;
    cover_image: string;
    questions: GameRoomQuestion[];
    knowledges: GameRoomKnowledge[];
    duration: number;
    enemies: number;
    hearts: number;
    brains: number;
    initial_ammo: number;
    ammo_per_correct: number;
    map: number;
    map_data?: number[];
    questions_order?: number;
    knowledges_order?: number;
}

export interface GameRoom extends GameRoomData {
    id: number;
    creator_name?: string;
    creator_avatar?: string;
    created_at: string;
    updated_at: string;
    is_unlocked?: boolean;
}

export const gameRoomService = {
    // Create a new game
    createGame: async (gameData: GameRoomData): Promise<{ gameId: number, gameCode: string }> => {
        const response = await api.post('/', gameData);
        return response.data;
    },

    // Get game by ID
    getGame: async (id: string): Promise<GameRoom> => {
        const response = await api.get(`/${id}`);
        return response.data;
    },

    // Get user's games (My Games)
    getMyGames: async (): Promise<GameRoom[]> => {
        const response = await api.get('/my-games');
        return response.data;
    },

    // Get public games
    getPublicGames: async (limit = 20, offset = 0, sortBy = "newest", category?: string, difficulty?: string, isAi?: boolean): Promise<GameRoom[]> => {
        const response = await api.get('/public', { params: { limit, offset, sortBy, category, difficulty, isAi } });
        return response.data;
    },

    // Get games by username
    getGamesByUsername: async (username: string, limit = 20, offset = 0, sortBy = "newest", category?: string, difficulty?: string, query?: string): Promise<GameRoom[]> => {
        const response = await api.get(`/user/${username}`, { params: { limit, offset, sortBy, category, difficulty, q: query } });
        return response.data;
    },

    // Search games
    searchGames: async (query: string, limit = 20, offset = 0, sortBy = "newest", category?: string, difficulty?: string): Promise<GameRoom[]> => {
        const response = await api.get('/search', { params: { q: query, limit, offset, sortBy, category, difficulty } });
        return response.data;
    },

    // Update game
    updateGame: async (id: string, gameData: Partial<GameRoomData>): Promise<{ gameId: number }> => {
        const response = await api.put(`/${id}`, gameData);
        return response.data;
    },

    // Delete game
    deleteGame: async (id: string): Promise<void> => {
        await api.delete(`/${id}`);
    },

    // Get recent games
    getRecentGames: async (limit = 10): Promise<GameRoom[]> => {
        const response = await api.get('/recent', { params: { limit } });
        return response.data;
    },

    // Get trending games
    getTrendingGames: async (limit = 10): Promise<GameRoom[]> => {
        const response = await api.get('/trending', { params: { limit } });
        return response.data;
    },

    // Get related games
    getRelatedGames: async (id: string, limit = 8): Promise<any[]> => {
        const response = await api.get(`/${id}/related`, { params: { limit } });
        return response.data;
    },

    // Report game
    reportGame: async (id: string, reason: string): Promise<void> => {
        await api.post(`/${id}/report`, { reason });
    },

    // Check if game is reported
    checkReportStatus: async (id: string): Promise<boolean> => {
        const response = await api.get(`/${id}/report`);
        return response.data.reported;
    },

    // Publish game (update status to 1)
    publishGame: async (id: string): Promise<{ gameId: number }> => {
        const response = await api.put(`/${id}`, { status: GAME_STATUS.PUBLISHED });
        return response.data;
    },

    saveDraft: async (id: string, gameData: Partial<GameRoomData>): Promise<{ gameId: number }> => {
        const response = await api.put(`/${id}`, { ...gameData, status: GAME_STATUS.DRAFT });
        return response.data;
    },

    // Check favourite status
    checkFavourite: async (gameId: string): Promise<boolean> => {
        try {
            const response = await api.get(`/${gameId}/favourite`);
            return response.data.isFavourite;
        } catch (error) {
            return false;
        }
    },

    // Add to favourites
    addFavourite: async (gameId: string): Promise<void> => {
        await api.post('/favourite/add', { gameId });
    },

    // Remove from favourites
    removeFavourite: async (gameId: string): Promise<void> => {
        await api.post('/favourite/remove', { gameId });
    },

    // Get my favourites
    getMyFavourites: async (limit = 20, offset = 0, sortBy = "newest", category?: string, difficulty?: string, query?: string): Promise<any[]> => {
        const response = await api.get('/my-favourites', { params: { limit, offset, sortBy, category, difficulty, q: query } });
        return response.data;
    },

    // Verify password
    verifyPassword: async (gameId: string, password: string): Promise<boolean> => {
        try {
            await api.post(`/${gameId}/verify-password`, { password });
            return true;
        } catch (error) {
            return false;
        }
    },

    // Generate game with AI
    generateWithAI: async (prompt: string, categories: string[], languages: string[]): Promise<{ success: boolean; gameId?: number; gameCode?: string; message?: string; error?: string }> => {
        const response = await api.post('/generate-ai', { prompt, categories, languages });
        return response.data;
    },

    // Generate edit with AI
    generateEditWithAI: async (gameId: number, prompt: string, categories: string[], languages: string[]): Promise<{ success: boolean; generatedData?: any; message?: string; error?: string }> => {
        const response = await api.post('/generate-ai-edit', { gameId, prompt, categories, languages });
        return response.data;
    }
};

export default gameRoomService;
