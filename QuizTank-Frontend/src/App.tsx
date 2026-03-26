import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/skeletons/PageSkeleton";
import { ProtectedRoute, AuthRoute, ProtectedAdminRoute } from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load all page components for optimal bundle splitting
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp"));
const GameDetails = lazy(() => import("./pages/GameDetails"));
const EditGame = lazy(() => import("./pages/EditGame"));
const EditGameAI = lazy(() => import("./pages/EditGameAI"));
const EditGameAIResult = lazy(() => import("./pages/EditGameAIResult"));
const ViewGame = lazy(() => import("./pages/ViewGame"));
const CreateGame = lazy(() => import("./pages/CreateGame"));
const Search = lazy(() => import("./pages/Search"));
const Settings = lazy(() => import("./pages/Settings"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Enable2FA = lazy(() => import("./pages/Enable2FA"));
const Login2FA = lazy(() => import("./pages/Login2FA"));
const DailyChallenge = lazy(() => import("./pages/DailyChallenge"));
const ChallengeDetail = lazy(() => import("./pages/ChallengeDetail"));
const Favourites = lazy(() => import("./pages/Favourites"));
const MyGames = lazy(() => import("./pages/MyGames"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const PlayPage = lazy(() => import("./pages/PlayPage"));
const ShareGameCode = lazy(() => import("./pages/ShareGameCode"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserForm = lazy(() => import("./pages/admin/AdminUserForm"));
const AdminGames = lazy(() => import("./pages/admin/AdminGames"));
const AdminGameForm = lazy(() => import("./pages/admin/AdminGameForm"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminReportForm = lazy(() => import("./pages/admin/AdminReportForm"));
const AdminOptions = lazy(() => import("./pages/admin/AdminOptions"));
const AdminChallenges = lazy(() => import("./pages/admin/AdminChallenges"));
const AdminChallengeForm = lazy(() => import("./pages/admin/AdminChallengeForm"));
const AdminGamePlays = lazy(() => import("./pages/admin/AdminGamePlays"));
const AdminMaps = lazy(() => import("./pages/admin/AdminMaps"));
const AdminMapForm = lazy(() => import("./pages/admin/AdminMapForm"));

// Configure React Query with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AppLayout>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/user/:username" element={<UserProfile />} />
                  <Route path="/game/:code" element={<GameDetails />} />
                  <Route path="/play/:code" element={<PlayPage />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/challenge" element={<DailyChallenge />} />
                  <Route path="/challenge/:id" element={
                    <ProtectedRoute><ChallengeDetail /></ProtectedRoute>
                  } />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/share/:code" element={<ShareGameCode />} />

                  {/* Auth routes - redirect if already logged in */}
                  <Route path="/login" element={
                    <AuthRoute><Login /></AuthRoute>
                  } />
                  <Route path="/register" element={
                    <AuthRoute><Register /></AuthRoute>
                  } />
                  <Route path="/verify-otp" element={
                    <AuthRoute><VerifyOtp /></AuthRoute>
                  } />
                  <Route path="/login-2fa" element={
                    <AuthRoute><Login2FA /></AuthRoute>
                  } />

                  {/* Protected routes - require authentication */}
                  <Route path="/settings" element={
                    <ProtectedRoute><Settings /></ProtectedRoute>
                  } />
                  <Route path="/settings/password" element={
                    <ProtectedRoute><ChangePassword /></ProtectedRoute>
                  } />
                  <Route path="/settings/2fa" element={
                    <ProtectedRoute><Enable2FA /></ProtectedRoute>
                  } />
                  <Route path="/favourites" element={
                    <ProtectedRoute><Favourites /></ProtectedRoute>
                  } />
                  <Route path="/games" element={
                    <ProtectedRoute><MyGames /></ProtectedRoute>
                  } />
                  <Route path="/games/create" element={
                    <ProtectedRoute><CreateGame /></ProtectedRoute>
                  } />
                  <Route path="/games/edit/:id" element={
                    <ProtectedRoute><EditGame /></ProtectedRoute>
                  } />
                  <Route path="/games/edit-ai/:id" element={
                    <ProtectedRoute><EditGameAI /></ProtectedRoute>
                  } />
                  <Route path="/games/edit-ai/:id/result" element={
                    <ProtectedRoute><EditGameAIResult /></ProtectedRoute>
                  } />
                  <Route path="/games/view/:id" element={
                    <ProtectedRoute><ViewGame /></ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedAdminRoute>
                      <AdminLayout>
                        <Outlet />
                      </AdminLayout>
                    </ProtectedAdminRoute>
                  }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />

                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/create" element={<AdminUserForm />} />
                    <Route path="users/:id/edit" element={<AdminUserForm />} />

                    <Route path="games" element={<AdminGames />} />
                    <Route path="games/create" element={<AdminGameForm />} />
                    <Route path="games/:id/edit" element={<AdminGameForm />} />

                    <Route path="reports" element={<AdminReports />} />
                    <Route path="reports/:id/edit" element={<AdminReportForm />} />

                    <Route path="options" element={<AdminOptions />} />

                    <Route path="challenges" element={<AdminChallenges />} />
                    <Route path="challenges/create" element={<AdminChallengeForm />} />
                    <Route path="challenges/:id/edit" element={<AdminChallengeForm />} />

                    <Route path="plays" element={<AdminGamePlays />} />

                    <Route path="maps" element={<AdminMaps />} />
                    <Route path="maps/create" element={<AdminMapForm />} />
                    <Route path="maps/:id/edit" element={<AdminMapForm />} />
                  </Route>

                  {/* Catch-all 404 route - must be last */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
