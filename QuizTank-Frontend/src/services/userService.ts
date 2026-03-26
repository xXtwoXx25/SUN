import api from './api';

export interface UserProfile {
    full_name?: string;
    biography?: string;
    username?: string;
    email?: string;
    level?: number;
    xp?: number;
    profile_pic_url?: string;
    game_audio?: number;
    game_music?: number;
    game_sfx?: number;
}

export const userService = {
    async getProfile(username?: string) {
        // If username provided, get that profile, else get current user profile?
        // Backend route is /profile/:username.
        // There is no /id or /me route explicit in provided info, wait.
        // Assuming /profile/:username fetches public data. 
        // For current user edits, we might already have data in AuthContext.
        // But typically we fetch fresh data.
        if (username) {
            const response = await api.get(`/users/profile/${username}`);
            return response.data;
        }
        return null;
    },

    async updateProfile(data: any) {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    async changePassword(passwordData: any) {
        const response = await api.put('/users/security', passwordData);
        return response.data;
    },

    async toggle2FA() {
        const response = await api.post('/users/2fa/toggle');
        return response.data;
    },

    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/users/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
