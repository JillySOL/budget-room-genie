import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, Image, Plus } from "lucide-react";
import MyPhotosTab from "./MyPhotosTab";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

const HomeTabs = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        setProjectError(null);
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
          setProjects(data.slice(0, 3));
        } catch (err: any) {
          console.error("Error fetching projects for homepage:", err);
          setProjectError(err.message || "An unexpected error occurred.");
          setProjects([]);
        } finally {
          setIsLoadingProjects(false);
        }
      };

      fetchProjects();
    } else if (isLoaded) {
      setIsLoadingProjects(false);
      setProjects([]);
      setProjectError(null);
    }
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <Tabs defaultValue="projects" className="w-full">
      <TabsList className={`w-full grid ${isSignedIn ? 'grid-cols-2' : 'grid-cols-1'} p-0.5 rounded-lg`}>
        <TabsTrigger value="projects" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <HomeIcon className="h-4 w-4" /> My Projects
        </TabsTrigger>
        {isSignedIn && (
          <TabsTrigger value="photos" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
            <Image className="h-4 w-4" /> My Photos
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="projects" className="mt-4">
        {!isSignedIn && isLoaded && (
          <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
             <p className="text-muted-foreground mb-4">Sign in to see your projects.</p>
             <Button onClick={() => navigate('/sign-in')}>Sign In</Button>
          </div>
        )}

        {isLoadingProjects && isSignedIn && (
           <div className="flex justify-center py-12">
             <Loading />
           </div>
         )}

         {projectError && !isLoadingProjects && isSignedIn && (
           <div className="text-center py-12 text-destructive">
             <p>Error loading projects: {projectError}</p>
           </div>
         )}

         {!isLoadingProjects && !projectError && isSignedIn && projects.length === 0 && (
           <div className="text-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
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

         {!isLoadingProjects && !projectError && isSignedIn && projects.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {projects.map((project) => (
               <ProjectCard key={project.id} project={project} />
             ))}
             {projects.length === 3 && (
                <div className="col-span-full text-center mt-4">
                    <Button variant="outline" onClick={() => navigate('/projects')}>
                        View All Projects
                    </Button>
                </div>
             )}
           </div>
         )}
      </TabsContent>
      
      {isSignedIn && (
        <TabsContent value="photos" className="mt-4">
          <MyPhotosTab />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default HomeTabs;
