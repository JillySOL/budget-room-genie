import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomProject from "./RoomProject";
import { Link } from "react-router-dom";
import PhotoGallery from "./PhotoGallery";
import { useUserProjects } from "@/hooks/useUserProjects";

const HomeTabs = () => {
  const { 
    recentProjects, 
    userPhotos, 
    loadingRecent, 
    loadingAll, 
    error 
  } = useUserProjects();

  return (
    <Tabs defaultValue="rooms" className="w-full">
      <TabsList className="w-full grid grid-cols-2 p-0.5 rounded-lg">
        <TabsTrigger value="rooms" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <HomeIcon className="h-4 w-4" /> My Rooms
        </TabsTrigger>
        <TabsTrigger value="photos" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <Image className="h-4 w-4" /> My Photos
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="rooms" className="mt-4">
        <div className="space-y-4 transition-opacity duration-500 ease-in-out" style={{ opacity: loadingRecent ? 0 : 1 }}>
          {loadingRecent && (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {!loadingRecent && !error && recentProjects.length === 0 && (
             <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-dashed">
               <p className="text-sm text-gray-600 mb-2">No rooms started yet.</p>
               <Link to="/onboarding">
                 <Button variant="outline" size="sm">Start Your First Room</Button>
               </Link>
             </div>
           )}
          {!loadingRecent && !error && recentProjects.map((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            const imageUrl = project.uploadedImageURL && typeof project.uploadedImageURL === 'string' ? project.uploadedImageURL : "/placeholder.svg"; 
            
            return (
              <RoomProject
                key={projectId}
                title={project.projectName || 'Untitled Project'}
                image={imageUrl}
                value="Value TBD" 
                roi="ROI TBD" 
                progress={10} 
                link={`/project/${projectId}`}
              />
            );
          })}
        </div>
      </TabsContent>
      
      <TabsContent value="photos" className="mt-4">
        <div className="transition-opacity duration-500 ease-in-out" style={{ opacity: loadingAll ? 0 : 1 }}>
          <PhotoGallery 
            photoUrls={userPhotos}
            isLoading={loadingAll}
            error={error}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default HomeTabs;
