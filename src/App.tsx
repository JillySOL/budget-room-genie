import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import SuccessPage from "./pages/SuccessPage";
import { BottomNav } from "./components/navigation/BottomNav";
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = () => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  return currentUser ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

const MainLayout = () => (
  <div className="pb-16">
    <Outlet />
    <BottomNav />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page — standalone, no BottomNav */}
            <Route path="/" element={<LandingPage />} />

            {/* All app routes — with BottomNav */}
            <Route element={<MainLayout />}>
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Index />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/project/:id" element={<ProjectDetailPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
