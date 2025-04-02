import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/lib/apiClient";

interface PhotoItem {
  key: string;
  url: string;
}

export function useFetchUserPhotos() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request } = useApiClient();
  console.log('useFetchUserPhotos: Hook rendered/request changed');

  useEffect(() => {
    console.log('useFetchUserPhotos: Effect triggered');
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchPhotos = async () => {
      console.log('useFetchUserPhotos: Setting loading true');
      setIsLoading(true);
      setError(null);
      try {
        console.log('useFetchUserPhotos: Calling API client request');
        const data = await request<PhotoItem[]>('/my-photos');
        if (isMounted) {
          console.log('useFetchUserPhotos: Request successful, setting photos', data);
          setPhotos(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("useFetchUserPhotos: Error fetching photos:", err);
          const errorMessage = err.message || "An unknown error occurred while fetching photos.";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          console.log('useFetchUserPhotos: Setting loading false in finally block');
          setIsLoading(false);
        }
      }
    };

    fetchPhotos();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      console.log('useFetchUserPhotos: Cleanup function ran');
      isMounted = false;
    };
  }, [request]);

  console.log('useFetchUserPhotos: Returning state', { isLoading, error, photos });
  return { photos, isLoading, error };
} 