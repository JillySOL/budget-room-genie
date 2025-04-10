import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CameraOff, Upload, PlusCircle, Image } from "lucide-react";
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
      <div className="text-center py-10 px-4 bg-gray-50 rounded-lg border border-dashed">
        <Image className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
        <p className="mt-1 text-sm text-gray-500">Upload your first room photo to get started.</p>
        <div className="mt-6">
          <Link to="/onboarding">
            <Button type="button" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square bg-muted rounded-md overflow-hidden">
            <img
              src={photo.url}
              alt={`User photo ${index + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
              loading="lazy"
              onLoad={(e) => e.currentTarget.style.opacity = '1'}
            />
            {/* Add delete button here later */}
          </div>
        ))}
      </div>
      <Link to="/onboarding" className="flex items-center gap-2">
        <Button variant="outline" className="w-full gap-2">
          <PlusCircle className="h-4 w-4" /> Add More Photos
        </Button>
      </Link>
    </div>
  );
};

export default MyPhotosTab; 