import api from './api';

export interface LoginResponse {
    success?: boolean;
    message?: string;
    token?: string;
    user?: any;
    requireOtp?: boolean;
    email?: string;
    error?: string;
}

export interface RegisterResponse {
    message?: string;
    email?: string;
    otp?: string;
    error?: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        // Current backend expects username, not email for login? 
        // Controller says: const { username, password } = req.body;
        // But AuthContext uses 'email'. I should probably support both or verify what the user inputs.
        // The legacy context uses email, but backend uses username. 
        // I can try to pass the input as username.
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },

    verifyLoginOTP: async (email: string, code: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/login-verify', { email, code });
        return response.data;
    },

    register: async (username: string, email: string, password: string, name?: string): Promise<RegisterResponse> => {
        const response = await api.post('/auth/register', { username, email, password, full_name: name });
        return response.data; // returns { message, email }
    },

    verifyEmail: async (email: string, code: string) => {
        const response = await api.post('/auth/verify-email', { email, code });
        return response.data;
    },

    resendOtp: async (email: string): Promise<RegisterResponse> => {
        const response = await api.post('/auth/resend-otp', { email });
        return response.data;
    }
};
