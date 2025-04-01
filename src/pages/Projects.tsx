import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { useAuth } from "@clerk/clerk-react";

// This will be replaced with real data from the user's account
const MOCK_PROJECTS = [
  {
    id: "project-1",
    title: "Master Bathroom Renovation",
    valueAdd: 25000,
    totalCost: 1200,
    status: "in_progress",
    lastUpdated: "2024-03-15"
  },
  {
    id: "project-2",
    title: "Kitchen Cabinet Refresh",
    valueAdd: 15000,
    totalCost: 800,
    status: "completed",
    lastUpdated: "2024-03-10"
  }
];

const Projects = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded || isLoading) {
    return <LoadingPage />;
  }

  if (!isSignedIn) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Your Projects</h1>
          <p className="text-budget-dark/70 mb-6">
            Sign in to view and manage your renovation projects.
          </p>
          <div className="space-y-4">
            <Link to="/sign-in">
              <Button className="w-full">
                Sign In to View Projects
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="outline" className="w-full">
                Browse Example Projects
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">My Projects</h1>
          <Link to="/new-project">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {MOCK_PROJECTS.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-budget-dark/70 mb-4">You haven't created any projects yet.</p>
            <Link to="/new-project">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {MOCK_PROJECTS.map((project) => (
              <Link 
                key={project.id} 
                to={`/project/${project.id}`}
                className="block transition-transform hover:scale-[1.02]"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-medium text-budget-dark">{project.title}</h2>
                    <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                      +${project.valueAdd.toLocaleString()} Value
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-budget-dark/70">
                    <div className="flex items-center gap-4">
                      <span>Budget: ${project.totalCost}</span>
                      <span>•</span>
                      <span className="capitalize">{project.status.replace('_', ' ')}</span>
                    </div>
                    <span>Last updated: {new Date(project.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-4 flex items-center text-budget-accent text-sm font-medium">
                    View Project Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Projects; 