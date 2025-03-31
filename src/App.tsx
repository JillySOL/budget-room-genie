
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import BottomNav from "./components/navigation/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="pb-16"> {/* Add padding to bottom to accommodate the nav bar */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/new-project" element={<NewProjectPage />} />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
