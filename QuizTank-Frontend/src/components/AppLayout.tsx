import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
    children: ReactNode;
    showFooter?: boolean;
}

/**
 * Main application layout component.
 * Provides consistent Navbar and Footer across all pages.
 * Uses AuthContext for authentication state.
 */
const AppLayout = ({
    children,
    showFooter = true
}: AppLayoutProps) => {
    const { user, isLoggedIn } = useAuth();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isPlayRoute = location.pathname.startsWith('/play/');
    const isShareRoute = location.pathname.startsWith('/share/');
    const isAuthRoute = ['/login', '/register', '/verify-otp', '/login-2fa'].includes(location.pathname);
    const shouldHideNav = isAdminRoute || isPlayRoute || isShareRoute || isAuthRoute;

    // Force reload when navigating away from play page to fix CSS issues
    useEffect(() => {
        const handleLocationChange = () => {
            const prevPath = sessionStorage.getItem('prevPath');
            const currentPath = location.pathname;

            if (prevPath && prevPath.startsWith('/play/') && !currentPath.startsWith('/play/')) {
                sessionStorage.removeItem('prevPath');
                window.location.reload();
            } else {
                sessionStorage.setItem('prevPath', currentPath);
            }
        };

        handleLocationChange();
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Skip to main content link for accessibility */}


            {!shouldHideNav && <Navbar />}

            <main id="main-content" className="flex-1">
                {children}
            </main>

            {showFooter && !shouldHideNav && <Footer />}
        </div>
    );
};

export default AppLayout;
