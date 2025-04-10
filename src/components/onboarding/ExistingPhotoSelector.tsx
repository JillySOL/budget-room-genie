import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface ExistingPhotoSelectorProps {
  projects: QueryDocumentSnapshot<DocumentData>[];
  isLoading: boolean;
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}

const ExistingPhotoSelector: React.FC<ExistingPhotoSelectorProps> = ({
  projects,
  isLoading,
  selectedUrl,
  onSelect,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading gallery...</span>
      </div>
    );
  }

  const uniqueUrls = React.useMemo(() => {
    const urls = new Set<string>();
    projects.forEach(doc => {
      const data = doc.data();
      if (data.uploadedImageURL && typeof data.uploadedImageURL === 'string') {
        urls.add(data.uploadedImageURL);
      }
    });
    return Array.from(urls);
  }, [projects]);

  if (uniqueUrls.length === 0) {
    return <p className="text-sm text-center text-muted-foreground mt-4">No existing photos found in your projects.</p>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-base font-medium mb-3 text-center">Or Select from Your Gallery</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-md border">
        {uniqueUrls.map((url) => (
          <button
            key={url}
            onClick={() => onSelect(url)}
            className={`aspect-square rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-budget-teal ${selectedUrl === url ? 'border-budget-teal ring-2 ring-offset-1 ring-budget-teal' : 'border-transparent'} hover:border-gray-400 bg-muted`}
          >
            <img 
              src={url} 
              alt="Existing project image" 
              className="w-full h-full object-cover transition-opacity duration-300 opacity-0" 
              loading="lazy"
              onLoad={(e) => e.currentTarget.style.opacity = '1'}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExistingPhotoSelector; 