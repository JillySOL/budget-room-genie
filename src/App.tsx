import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import BottomNav from "./components/navigation/BottomNav";
import { Loader2 } from 'lucide-react';

// Get Clerk publishable key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected Route Component
const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner while checking auth state
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
  // No need for Clerk provider here anymore
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes outside MainLayout - only Onboarding now */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Routes within MainLayout */}
            <Route element={<MainLayout />}>
              {/* Public routes within MainLayout */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<ExplorePage />} />

              {/* Protected Routes within MainLayout */}
              <Route element={<ProtectedRoute />}>
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/project/:id" element={<ProjectDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Catch-all Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
