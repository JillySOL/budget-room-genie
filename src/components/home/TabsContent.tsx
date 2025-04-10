import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, Image, Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomProject from "./RoomProject";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase-config";
import { collection, query, where, orderBy, limit, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import PhotoGallery from "./PhotoGallery";
import { getUniquePhotoUrls } from "@/lib/utils";

const HomeTabs = () => {
  const { currentUser } = useAuth();
  const [recentProjects, setRecentProjects] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [loadingRecentProjects, setLoadingRecentProjects] = useState(true);
  const [loadingAllPhotos, setLoadingAllPhotos] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectsAndPhotos = async () => {
      if (!currentUser) {
        setLoadingRecentProjects(false);
        setLoadingAllPhotos(false);
        return;
      }
      setLoadingRecentProjects(true);
      setLoadingAllPhotos(true);
      setFetchError(null);
      
      try {
        const projectsRef = collection(db, "projects");
        
        // Fetch recent 3 projects
        const recentQuery = query(
          projectsRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const recentSnapshot = await getDocs(recentQuery);
        setRecentProjects(recentSnapshot.docs);
        setLoadingRecentProjects(false);

        // Fetch all projects for photos
        const allProjectsQuery = query(projectsRef, where("userId", "==", currentUser.uid));
        const allProjectsSnapshot = await getDocs(allProjectsQuery);
        const allDocs = allProjectsSnapshot.docs;
        setUserPhotos(getUniquePhotoUrls(allDocs));
        setLoadingAllPhotos(false);

      } catch (err) {
        console.error("Error fetching projects/photos:", err);
        const errorMsg = "Failed to load data. Please try again.";
        setFetchError(errorMsg);
        setLoadingRecentProjects(false);
        setLoadingAllPhotos(false);
      } 
    };

    fetchProjectsAndPhotos();
  }, [currentUser]);

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
        <div className="space-y-4">
          {loadingRecentProjects && (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {fetchError && (
            <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {fetchError}
            </div>
          )}
          {!loadingRecentProjects && !fetchError && recentProjects.length === 0 && (
             <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-dashed">
               <p className="text-sm text-gray-600 mb-2">No rooms started yet.</p>
               <Link to="/onboarding">
                 <Button variant="outline" size="sm">Start Your First Room</Button>
               </Link>
             </div>
           )}
          {!loadingRecentProjects && !fetchError && recentProjects.map((doc) => {
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
        <PhotoGallery 
          photoUrls={userPhotos}
          isLoading={loadingAllPhotos}
          error={fetchError}
        />
      </TabsContent>
    </Tabs>
  );
};

export default HomeTabs;
