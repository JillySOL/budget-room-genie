import { useState, useEffect } from 'react';
import { db } from '@/firebase-config';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  DocumentData, 
  QueryDocumentSnapshot 
} from 'firebase/firestore';
import { getUniquePhotoUrls } from '@/lib/utils';

interface UseUserProjectsResult {
  recentProjects: QueryDocumentSnapshot<DocumentData>[];
  allProjects: QueryDocumentSnapshot<DocumentData>[]; // Keep returning all if needed later, e.g., for full gallery view
  userPhotos: string[];
  loadingRecent: boolean;
  loadingAll: boolean;
  error: string | null;
}

export const useUserProjects = (): UseUserProjectsResult => {
  const { currentUser } = useAuth();
  const [recentProjects, setRecentProjects] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [allProjects, setAllProjects] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) {
        setLoadingRecent(false);
        setLoadingAll(false);
        return;
      }

      setLoadingRecent(true);
      setLoadingAll(true);
      setError(null);

      try {
        const projectsRef = collection(db, "projects");
        const baseQuery = where("userId", "==", currentUser.uid);

        // Fetch recent 3 projects
        const recentQuery = query(
          projectsRef,
          baseQuery,
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const recentSnapshot = await getDocs(recentQuery);
        setRecentProjects(recentSnapshot.docs);
        setLoadingRecent(false);

        // Fetch all projects
        const allProjectsQuery = query(projectsRef, baseQuery);
        const allProjectsSnapshot = await getDocs(allProjectsQuery);
        const allDocs = allProjectsSnapshot.docs;
        setAllProjects(allDocs);
        setUserPhotos(getUniquePhotoUrls(allDocs));
        setLoadingAll(false);

      } catch (err) {
        console.error("Error fetching user projects:", err);
        const errorMsg = "Failed to load project data. Please try again.";
        setError(errorMsg);
        setLoadingRecent(false);
        setLoadingAll(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  return { 
    recentProjects, 
    allProjects,
    userPhotos, 
    loadingRecent, 
    loadingAll, 
    error 
  };
}; 