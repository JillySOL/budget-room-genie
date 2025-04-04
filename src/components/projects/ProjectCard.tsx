import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { ChevronRight } from "lucide-react";

// Update Project interface to expect thumbnailUrl
interface Project {
  id: string;
  title: string;
  userId: string; // Included for completeness, though not directly used in card
  roomType: string;
  budget: number; // Included for completeness
  style: string; // Included for completeness
  renovationType: string; // Included for completeness
  instructions?: string; // Included for completeness
  beforeImageKey: string;
  afterImageKey?: string;
  diySuggestions: Array<{ id: string; title: string; description: string; cost: number }>; // Included for completeness
  createdAt: string;
  updatedAt: string; // Included for completeness
  status: 'PENDING' | 'COMPLETE' | 'FAILED'; // Included for completeness
  totalCost: number;
  thumbnailUrl: string; // Added pre-signed URL field
}

interface ProjectCardProps {
  project: Project;
}

// Remove s3BaseUrl if no longer needed for direct construction
// const s3BaseUrl = import.meta.env.VITE_S3_BASE_URL || '';

export function ProjectCard({ project }: ProjectCardProps) {
  // Calculate time since creation (kept for potential future use, not displayed in new design)
  let timeAgo = "just now";
  try {
    timeAgo = formatDistance(
      new Date(project.createdAt),
      new Date(),
      { addSuffix: true }
    );
  } catch (e) {
    console.error("Error formatting date:", project.createdAt, e);
  }

  // Use the pre-signed thumbnailUrl directly
  const imageUrl = project.thumbnailUrl || '/placeholder-image.png'; // Use provided URL or fallback

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
     e.currentTarget.src = '/placeholder-image.png';
     e.currentTarget.alt = 'Error loading image';
  };

  // Placeholder progress - 100% if complete, 50% otherwise
  const progressPercent = project.status === 'COMPLETE' ? 100 : 50;

  return (
    <Link to={`/project/${project.id}`} className="block group">
      {/* Main container: horizontal flex, padding, border, hover effect */}
      <div className="flex items-center p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-card group-hover:shadow-md transition-shadow duration-200 ease-in-out">

        {/* Image Thumbnail: fixed size, margin, rounded */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 mr-3 sm:mr-4 rounded-md overflow-hidden relative bg-gray-100 dark:bg-gray-800">
          <img
            // Use the imageUrl (pre-signed or fallback)
            src={imageUrl}
            alt={project.title || 'Project image'}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            onError={handleImageError}
          />
        </div>

        {/* Text Content: takes remaining space, margin for arrow */}
        <div className="flex-grow mr-2 sm:mr-4 min-w-0"> {/* Added min-w-0 for truncation */}
          <h3 className="font-semibold text-base sm:text-lg truncate mb-1" title={project.title}>
            {project.title || 'Untitled Project'}
          </h3>
          {/* Value/ROI Placeholder: Using totalCost for now */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
             Est. DIY Cost: ${project.totalCost != null ? project.totalCost.toFixed(0) : 'N/A'} {/* Placeholder */}
          </p>
          {/* Progress Bar Placeholder */}
          <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700 overflow-hidden">
             <div
                className="bg-budget-accent h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
             ></div>
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0">
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
} 