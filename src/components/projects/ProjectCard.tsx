import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FirestoreTimestamp {
  toDate: () => Date;
  toMillis: () => number;
}

const renovationTypeLabel: Record<string, string> = {
  budget: "Budget Flip",
  full: "Full Reno",
  visual: "Visualize",
};

export interface Project {
  id: string;
  title?: string;
  projectName?: string; // Alternative field name
  userId: string; // Included for completeness, though not directly used in card
  roomType: string;
  budget?: number | string; // Included for completeness
  style?: string; // Included for completeness
  renovationType?: string; // Included for completeness
  instructions?: string; // Included for completeness
  beforeImageKey?: string;
  afterImageKey?: string;
  diySuggestions?: Array<{ id: string; title: string; description: string; cost: number }>; // Included for completeness
  createdAt: string | Date | FirestoreTimestamp;
  updatedAt?: string | Date | FirestoreTimestamp;
  status?: 'PENDING' | 'COMPLETE' | 'FAILED' | 'processing' | 'completed' | 'failed' | string; // Included for completeness
  aiStatus?: 'pending' | 'processing' | 'completed' | 'failed' | string;
  totalCost?: number;
  aiTotalEstimatedCost?: number;
  thumbnailUrl?: string;
  uploadedImageURL?: string;
  aiGeneratedImageURL?: string;
}

interface ProjectCardProps {
  project: Project;
}

// Remove s3BaseUrl if no longer needed for direct construction
// const s3BaseUrl = import.meta.env.VITE_S3_BASE_URL || '';

// Helper function to safely convert Firestore Timestamp or string to Date
const toDate = (dateValue: string | Date | FirestoreTimestamp | null | undefined): Date => {
  if (!dateValue) return new Date();
  
  // If it's a Firestore Timestamp, convert it
  if (dateValue && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // If it's a Firestore Timestamp with toMillis
  if (dateValue && typeof dateValue.toMillis === 'function') {
    return new Date(dateValue.toMillis());
  }
  
  // If it's already a Date
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a string or number, try to parse it
  try {
    return new Date(dateValue);
  } catch {
    return new Date();
  }
};

export function ProjectCard({ project }: ProjectCardProps) {
  // Calculate time since creation (kept for potential future use, not displayed in new design)
  let timeAgo = "just now";
  try {
    const createdDate = toDate(project.createdAt);
    if (createdDate && !isNaN(createdDate.getTime())) {
      timeAgo = formatDistance(createdDate, new Date(), { addSuffix: true });
    }
  } catch (e) {
    // Fallback to "just now" if date formatting fails
    timeAgo = "just now";
  }

  // Show the after (AI-generated) image when completed, before otherwise
  const isCompleted = displayStatus === 'COMPLETE' || displayStatus === 'completed';
  const imageUrl = (isCompleted && project.aiGeneratedImageURL)
    ? project.aiGeneratedImageURL
    : project.thumbnailUrl || project.uploadedImageURL || '/placeholder-image.png';
  
  // Get title from either title or projectName field
  const displayTitle = project.title || project.projectName || 'Untitled Project';
  
  // Get status from either status or aiStatus field
  const displayStatus = project.status || project.aiStatus || 'PENDING';
  
  // Get total cost from either totalCost or aiTotalEstimatedCost
  const displayCost = project.totalCost ?? project.aiTotalEstimatedCost ?? 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
     e.currentTarget.src = '/placeholder-image.png';
     e.currentTarget.alt = 'Error loading image';
  };

  // Determine status badge variant
  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'COMPLETE' || upperStatus === 'COMPLETED') return 'default';
    if (upperStatus === 'FAILED' || upperStatus === 'FAILURE') return 'destructive';
    return 'secondary';
  };

  return (
    <Link to={`/project/${project.id}`} className="flex flex-col h-full">
      <Card className="overflow-hidden transition-all hover:shadow-lg flex-1 flex flex-col group border-border/50">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />
          <Badge
            variant="outline"
            className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-xs font-medium shadow-sm"
          >
            {project.roomType || 'Room'}
          </Badge>
          {project.renovationType && (
            <Badge
              variant="outline"
              className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-xs font-medium shadow-sm"
            >
              {renovationTypeLabel[project.renovationType] || project.renovationType}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-budget-accent transition-colors" title={displayTitle}>
              {displayTitle}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Est. DIY Cost: <span className="text-foreground">${displayCost != null ? Number(displayCost).toLocaleString() : 'N/A'}</span>
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <Badge variant={getStatusVariant(displayStatus)} className="text-xs capitalize">
              {displayStatus.toLowerCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}  