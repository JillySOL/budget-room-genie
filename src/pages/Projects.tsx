import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoadingPage, Loading } from "@/components/ui/loading";
import { useAuth } from "@clerk/clerk-react";
import { ProjectCard } from "@/components/projects/ProjectCard";

// Define Project interface matching ProjectCard
interface Project {
  id: string;
  title: string;
  userId: string;
  roomType: string;
  budget: number;
  style: string;
  renovationType: string;
  instructions?: string;
  beforeImageKey: string;
  afterImageKey?: string;
  diySuggestions: Array<{ id: string; title: string; description: string; cost: number }>;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  totalCost: number;
}

const Projects = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if signed in and loaded
    if (isSignedIn && isLoaded) {
      const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = await getToken({ template: "RenoMateBackendAPI" });
          if (!token) {
            throw new Error("Authentication token not available.");
          }

          const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/projects`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const data: Project[] = await response.json();
          setProjects(data);
        } catch (err: any) {
          console.error("Error fetching projects:", err);
          setError(err.message || "An unexpected error occurred.");
          setProjects([]); // Clear projects on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchProjects();
    } else if (isLoaded) {
      // If loaded but not signed in, stop loading
      setIsLoading(false);
      setProjects([]); // Ensure projects are empty if not signed in
    }
    // Dependency array includes isLoaded and isSignedIn to refetch if auth state changes
  }, [isLoaded, isSignedIn, getToken]);

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return <LoadingPage />;
  }

  // Signed out view
  if (!isSignedIn) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Your Projects</h1>
          <p className="text-muted-foreground mb-6">
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

  // Signed in view
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

        {/* Loading state for API call */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-12 text-destructive">
            <p>Error loading projects: {error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-muted-foreground mb-4">You haven't created any projects yet.</p>
            <Button 
              className="gap-2"
              onClick={() => navigate('/new-project')}
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Projects; 