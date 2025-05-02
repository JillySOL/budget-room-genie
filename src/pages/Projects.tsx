import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoadingPage, Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { db } from "@/firebase-config";
import { collection, query, where, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

// Remove the local Project interface for now
/*
interface Project {
  id: string;
  projectName?: string; 
  uploadedImageURL?: string; 
  roomType?: string; 
  style?: string;
  budget?: string | number; 
  renovationType?: string;
  createdAt?: any; 
  userId?: string; 
}
*/

const Projects = () => {
  const { currentUser } = useAuth();
  // Store the raw Firestore documents
  const [projectDocs, setProjectDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const fetchProjects = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const projectsRef = collection(db, "projects");
          const q = query(projectsRef, where("userId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          // Set the raw documents
          setProjectDocs(querySnapshot.docs);
        } catch (err: unknown) {
          console.error("Error fetching projects:", err);
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
          setProjectDocs([]); // Clear docs on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    } else {
      setIsLoading(false);
      setProjectDocs([]); // Clear docs if not logged in
    }
  }, [currentUser]);

  // Loading state while Firebase auth initializes or projects are fetching
  if (isLoading) {
    return <LoadingPage />;
  }

  // Signed out view (Redirect or show message if currentUser is null)
  // This check is redundant if protected routes are set up correctly,
  // but can be kept as a fallback.
  if (!currentUser) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Your Projects</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your projects.
          </p>
          {/* Optional: Add Login Button */}
          {/* <Button onClick={() => navigate('/login')}>Login</Button> */}
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
          {/* Link to onboarding instead of /new-project */}
          <Link to="/onboarding">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Loading state (handled above, but keep for consistency if preferred) */}
        {/* {isLoading && (...)} */}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-destructive">
            <p>Error loading projects: {error}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && projectDocs.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-muted-foreground mb-4">You haven't created any projects yet.</p>
            <Button
              className="gap-2"
              onClick={() => navigate('/onboarding')} // Navigate to onboarding
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        )}

        {/* Projects grid */}
        {!error && projectDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectDocs.map((doc) => {
              // Extract data and pass to ProjectCard, casting as needed
              // This assumes ProjectCard expects an object with project data
              const projectData = { 
                id: doc.id, 
                ...doc.data() 
              }; 
              
              // Use type assertion for the project data
              return (
                <ProjectCard 
                  key={projectData.id} 
                  project={projectData as import('@/components/projects/ProjectCard').Project} 
                /> 
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Projects;        