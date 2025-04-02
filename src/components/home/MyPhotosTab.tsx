import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CameraOff, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useFetchUserPhotos } from "@/hooks/useFetchUserPhotos";

const MyPhotosTab = () => {
  const { photos, isLoading, error } = useFetchUserPhotos();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading photos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p className="font-medium">Error Loading Photos</p>
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center p-4">
        <CameraOff className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 mb-2">No photos yet</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/new-project">
            Upload Your First Photo
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/new-project" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload More
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((photo) => (
          <div key={photo.key} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
            <img
              src={photo.url}
              alt="User uploaded room photo"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = '/placeholder-image.svg')} // Consider a better placeholder
            />
            {/* Optional: Add overlay/actions on hover */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPhotosTab; 