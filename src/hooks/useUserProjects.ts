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
        setError(null); // Clear error when no user
        return;
      }

      setLoadingRecent(true);
      setLoadingAll(true);
      setError(null); // Clear any previous errors

      try {
        const projectsRef = collection(db, "projects");
        const baseQuery = where("userId", "==", currentUser.uid);

        // Fetch all projects first (this doesn't require an index)
        const allProjectsQuery = query(projectsRef, baseQuery);
        const allProjectsSnapshot = await getDocs(allProjectsQuery);
        const allDocs = allProjectsSnapshot.docs;
        
        setAllProjects(allDocs);
        setUserPhotos(getUniquePhotoUrls(allDocs));
        setLoadingAll(false);

        // Try to fetch recent projects with ordering
        // If this fails due to missing index, we'll fall back to using all projects
        try {
          const recentQuery = query(
            projectsRef,
            baseQuery,
            orderBy("createdAt", "desc"),
            limit(3)
          );
          const recentSnapshot = await getDocs(recentQuery);
          setRecentProjects(recentSnapshot.docs);
        } catch (orderError: any) {
          // If ordering fails (likely due to missing index), use first 3 from all projects
          // Sort manually by createdAt if available, otherwise just take first 3
          const sorted = [...allDocs].sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            // Handle Firestore Timestamp
            let aTime = 0;
            let bTime = 0;
            
            if (aData.createdAt) {
              if (aData.createdAt.toMillis && typeof aData.createdAt.toMillis === 'function') {
                aTime = aData.createdAt.toMillis();
              } else if (aData.createdAt.toDate && typeof aData.createdAt.toDate === 'function') {
                aTime = aData.createdAt.toDate().getTime();
              } else if (aData.createdAt instanceof Date) {
                aTime = aData.createdAt.getTime();
              } else if (typeof aData.createdAt === 'number') {
                aTime = aData.createdAt;
              } else if (typeof aData.createdAt === 'string') {
                aTime = new Date(aData.createdAt).getTime() || 0;
              }
            }
            
            if (bData.createdAt) {
              if (bData.createdAt.toMillis && typeof bData.createdAt.toMillis === 'function') {
                bTime = bData.createdAt.toMillis();
              } else if (bData.createdAt.toDate && typeof bData.createdAt.toDate === 'function') {
                bTime = bData.createdAt.toDate().getTime();
              } else if (bData.createdAt instanceof Date) {
                bTime = bData.createdAt.getTime();
              } else if (typeof bData.createdAt === 'number') {
                bTime = bData.createdAt;
              } else if (typeof bData.createdAt === 'string') {
                bTime = new Date(bData.createdAt).getTime() || 0;
              }
            }
            
            return bTime - aTime;
          });
          setRecentProjects(sorted.slice(0, 3));
        }
        setLoadingRecent(false);

      } catch (err: any) {
        // Provide more detailed error message
        let errorMsg = "Failed to load project data. Please try again.";
        if (err?.code === 'permission-denied') {
          errorMsg = "Permission denied. Please check your authentication.";
        } else if (err?.code === 'failed-precondition') {
          errorMsg = "Database index required. Please check the browser console for a link to create it.";
        } else if (err?.message) {
          errorMsg = `Error: ${err.message}`;
        }
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