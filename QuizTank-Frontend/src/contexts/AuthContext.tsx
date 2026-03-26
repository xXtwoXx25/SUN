import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { authService, LoginResponse, RegisterResponse } from '@/services/authService';

interface User {
    id: string;
    username: string;
    email: string;
    xp: number;
    level: number;
    avatarUrl?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<LoginResponse | void>;
    logout: () => Promise<void>;
    register: (username: string, email: string, password: string, name?: string) => Promise<RegisterResponse | void>;
    completeLogin: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Initial check for token
    // We could add useEffect to validate token here

    const login = useCallback(async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login(username, password);
            if (response.token && response.user) {
                // Login successful (no 2FA)
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
            }
            return response; // Return full response to handle OTP case in component
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (username: string, email: string, password: string, name?: string) => {
        setIsLoading(true);
        try {
            return await authService.register(username, email, password, name);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const completeLogin = useCallback((user: User, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoggedIn: !!user,
                isLoading,
                login,
                logout,
                register,
                completeLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
