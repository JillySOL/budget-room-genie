import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, PlusCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase-config";
import { collection, query, where, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

const ProjectsPage = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) {
        setLoading(false);
        setError("Please log in to view projects.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setProjects(querySnapshot.docs);
      } catch (err) {         
        console.error("Error fetching projects:", err);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="icon" className="tap-target" aria-label="Back to Home">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">My Projects</h1>
          </div>
          <Link to="/onboarding">
            <Button variant="ghost" size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full grid grid-cols-3 p-0.5 rounded-lg">
            <TabsTrigger value="active" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium">Completed</TabsTrigger>
            <TabsTrigger value="saved" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium">Saved</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
             <div className="flex justify-center items-center h-40 bg-red-50 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}
          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No projects yet!</h3>
              <p className="text-sm text-gray-500 mb-4">Start your first room flip to see it here.</p>
              <Link to="/onboarding">
                 <Button>Start New Project</Button>
              </Link>
            </div>
          )}
          {!loading && !error && projects.map((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            return (
              <Link key={projectId} to={`/project/${projectId}`} className="block">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                  <div className="relative h-40 w-full bg-gray-100">
                   {project.uploadedImageURL ? (
                     <img 
                       src={project.uploadedImageURL} 
                       alt={project.projectName || 'Project image'} 
                       className="w-full h-full object-cover" 
                     />
                     ) : (
                       <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                     )
                   }
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-budget-dark text-lg truncate pr-2" title={project.projectName || 'Project'}>{project.projectName || 'Untitled Project'}</h3>
                      <span className="bg-[#E6F4EA] text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                         Value TBD
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Progress value={10} className="h-2 rounded-full bg-gray-100" /> 
                        <span className="text-xs text-gray-500 mt-1 block">In Progress</span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-budget-neutral ml-4 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectsPage;
