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

  useEffect(() => {
    let isMounted = true;

    const fetchPhotos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await request<PhotoItem[]>('/my-photos');
        if (isMounted) {
          setPhotos(data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching photos.";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPhotos();

    return () => {
      isMounted = false;
    };
  }, [request]);

  return { photos, isLoading, error };
}  