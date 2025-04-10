import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { BottomNav } from "./components/navigation/BottomNav";
import { Loader2 } from 'lucide-react';

// Instantiate QueryClient
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while auth state initializes
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Redirect to login page if not logged in
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

// Layout component including BottomNav
const MainLayout = () => (
  <div className="pb-16"> {/* Add padding to bottom to accommodate the nav bar */}
    <Outlet /> {/* Nested routes will render here */}
    <BottomNav />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes outside MainLayout - Removed Onboarding */}
              {/* <Route path="/onboarding" element={<OnboardingPage />} /> */}

              {/* Routes within MainLayout */}
              <Route element={<MainLayout />}>
                {/* Public routes within MainLayout */}
                <Route path="/" element={<Index />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes within MainLayout */}
                <Route element={<ProtectedRoute />}>
                  {/* Moved Onboarding route here */}
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/project/:id" element={<ProjectDetailPage />} />
                </Route>

                {/* Catch-all for 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
