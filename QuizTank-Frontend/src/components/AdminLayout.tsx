import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Gamepad2,
    Flag,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Settings,
    Trophy,
    History,
    Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuItems = [
        {
            title: 'Dashboard',
            icon: LayoutDashboard,
            path: '/admin/dashboard',
        },
        {
            title: 'Users',
            icon: Users,
            path: '/admin/users',
        },
        {
            title: 'Games',
            icon: Gamepad2,
            path: '/admin/games',
        },
        {
            title: 'Plays',
            icon: History,
            path: '/admin/plays',
        },
        {
            title: 'Challenges',
            icon: Trophy,
            path: '/admin/challenges',
        },
        {
            title: 'Maps',
            icon: Map,
            path: '/admin/maps',
        },
        {
            title: 'Reports',
            icon: Flag,
            path: '/admin/reports',
        },
        {
            title: 'Settings',
            icon: Settings,
            path: '/admin/options',
        },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800 text-center">
                {(isSidebarOpen || isMobileOpen) && (
                    <span onClick={() => navigate('/')} className="font-bold text-xl tracking-tight cursor-pointer">Admin Panel</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/25 font-medium"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-colors",
                                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                            )} />
                            {(isSidebarOpen || isMobileOpen) && (
                                <span className="truncate">{item.title}</span>
                            )}
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className={cn(
                        "w-full justify-start gap-3 hover:bg-red-500/10 hover:text-red-500 text-slate-400",
                        !isSidebarOpen && !isMobileOpen && "justify-center px-0"
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    {(isSidebarOpen || isMobileOpen) && <span>Logout</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Sidebar - Mobile */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="relative h-full">
                    <SidebarContent />
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300",
                isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
            )}>
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b flex items-center px-4 sticky top-0 z-20">
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                    <span className="ml-4 font-semibold text-lg">Admin Panel</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
