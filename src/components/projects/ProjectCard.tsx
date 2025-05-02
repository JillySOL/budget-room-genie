import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Update Project interface to expect thumbnailUrl
export interface Project {
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

  // Determine status badge variant
  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status.toUpperCase()) {
      case 'COMPLETE': return 'default';
      case 'FAILED': return 'destructive';
      case 'PENDING':
      default: return 'secondary';
    }
  };

  return (
    <Link to={`/project/${project.id}`} className="flex flex-col h-full">
      <Card className="overflow-hidden transition-all hover:shadow-lg flex-1 flex flex-col group">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={project.title || 'Project image'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />
          <Badge 
            variant={getStatusVariant(project.status)} 
            className="absolute top-2 right-2 capitalize"
          >
            {project.status.toLowerCase()}
          </Badge>
          <Badge 
            variant="outline" 
            className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm"
          >
            {project.roomType}
          </Badge>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg truncate mb-2 group-hover:text-budget-accent transition-colors" title={project.title}>
              {project.title || 'Untitled Project'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
               Est. DIY Cost: ${project.totalCost != null ? project.totalCost.toFixed(0) : 'N/A'}
            </p>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}  