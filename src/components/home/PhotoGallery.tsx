import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';

interface PhotoGalleryProps {
  photoUrls: string[];
  isLoading: boolean;
  error: string | null;
  // Add other props as needed, e.g., onDelete callback later
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photoUrls, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (photoUrls.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">No photos yet</p>
          <Link to="/onboarding">
            <Button variant="outline" size="sm" className="mt-2">
              Upload Photos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photoUrls.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={url}
              alt={`User photo ${index + 1}`}
              className="w-full h-full object-cover rounded-md bg-muted"
            />
            {/* Placeholder for Delete Button */}
          </div>
        ))}
      </div>
      {/* Button to add more photos, always visible when photos exist */}
      <Link to="/onboarding" className="block mt-4">
        <Button variant="outline" className="w-full gap-2">
          <PlusCircle className="h-4 w-4" /> Add More Photos
        </Button>
      </Link>
    </>
  );
};

export default PhotoGallery; 