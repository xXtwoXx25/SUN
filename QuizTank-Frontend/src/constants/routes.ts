/**
 * Centralized route definitions for type-safe navigation
 */
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',

    // Game routes
    GAME: (id: string) => `/game/${id}` as const,
    EDIT_GAME: (id: string) => `/edit/${id}` as const,
    CREATE_GAME: '/create',
    GAMEPLAY: '/gameplay',

    // Discovery routes
    SEARCH: '/search',
    CATEGORIES: '/categories',
    TAGS: '/tags',
    LEADERBOARD: '/leaderboard',
    DAILY_CHALLENGE: '/daily-challenge',

    // User routes
    SETTINGS: '/settings',
    FAVOURITES: '/favourites',
    MY_GAMES: '/my-games',
} as const;

/**
 * Routes that require authentication
 */
export const PROTECTED_ROUTES = [
    ROUTES.SETTINGS,
    ROUTES.FAVOURITES,
    ROUTES.MY_GAMES,
    ROUTES.CREATE_GAME,
] as const;

/**
 * Routes that should redirect logged-in users (e.g., login page)
 */
export const AUTH_ROUTES = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.VERIFY_OTP,
] as const;
