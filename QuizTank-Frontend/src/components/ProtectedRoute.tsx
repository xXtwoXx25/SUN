import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

/**
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 */
export function ProtectedRoute({
    children,
    redirectTo = ROUTES.LOGIN
}: ProtectedRouteProps) {
    const { isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isLoggedIn) {
        // Redirect to login, but save the attempted location
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

/**
 * Wrapper component for auth pages (login, register).
 * Redirects authenticated users away from auth pages.
 */
export function AuthRoute({ children }: { children: ReactNode }) {
    const { isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (isLoggedIn) {
        // Redirect to the page they came from, or home
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.HOME;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}

/**
 * Wrapper component that protects admin-only routes.
 * Redirects non-admins to home.
 */
export function ProtectedAdminRoute({
    children,
    redirectTo = ROUTES.LOGIN
}: ProtectedRouteProps) {
    const { user, isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    if (user?.role?.toUpperCase() !== 'ADMIN') {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
