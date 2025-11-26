import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Copy, 
  MoreHorizontal,
  Search,
  ChevronRight
} from "lucide-react";
import { LoadingPage, Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { db, storage } from "@/firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  DocumentData, 
  QueryDocumentSnapshot,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc
} from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Helper function to extract storage path from URL
const extractStoragePath = (url: string): string | null => {
  try {
    // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch) {
        // Decode the path (Firebase Storage encodes paths)
        return decodeURIComponent(pathMatch[1].replace(/%2F/g, '/'));
      }
    }
    // For Google Cloud Storage URLs: https://storage.googleapis.com/{bucket}/{path}
    if (urlObj.hostname.includes('storage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/[^/]+\/(.+)/);
      if (pathMatch) {
        return pathMatch[1];
      }
    }
  } catch (e) {
    // If URL parsing fails, try to extract from common patterns
    const patterns = [
      /user-uploads\/[^/]+\/[^?]+/,
      /generated-images\/[^/]+\/[^?]+/,
      /temp-images\/[^/]+\/[^?]+/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[0];
    }
  }
  return null;
};

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status';

type FilterOption = 'all' | 'completed' | 'pending' | 'failed';

const PROJECTS_PER_PAGE = 9;

const Projects = () => {
  const { currentUser } = useAuth();
  // Store the raw Firestore documents
  const [projectDocs, setProjectDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDeleteProject = async (projectId: string) => {
    if (!currentUser) return;
    
    try {
      setIsDeleting(true);
      
      // Get project data to find image URLs
      const projectDoc = projectDocs.find(doc => doc.id === projectId);
      const projectData = projectDoc?.data();
      
      // Delete images from Storage
      const imagesToDelete: string[] = [];
      
      // Collect all image URLs from the project
      if (projectData?.uploadedImageURL) {
        imagesToDelete.push(projectData.uploadedImageURL);
      }
      if (projectData?.thumbnailUrl) {
        imagesToDelete.push(projectData.thumbnailUrl);
      }
      if (projectData?.aiGeneratedImageURL) {
        imagesToDelete.push(projectData.aiGeneratedImageURL);
      }
      
      // Delete images from Storage
      const deletePromises = imagesToDelete.map(async (imageUrl) => {
        const storagePath = extractStoragePath(imageUrl);
        if (storagePath) {
          try {
            const imageRef = ref(storage, storagePath);
            await deleteObject(imageRef);
          } catch (storageError) {
            // Silently handle image deletion failures
          }
        }
      });
      
      // Also try to delete any images in project-specific folders
      try {
        const projectFolders = [
          `generated-images/${projectId}`,
          `temp-images/${projectId}`,
        ];
        
        for (const folder of projectFolders) {
          try {
            const folderRef = ref(storage, folder);
            const listResult = await listAll(folderRef);
            const deleteFolderPromises = listResult.items.map(item => deleteObject(item));
            await Promise.all(deleteFolderPromises);
          } catch (folderError) {
            // Folder might not exist, that's okay - silently continue
          }
        }
      } catch (folderError) {
        // Silently handle folder deletion errors
      }
      
      // Wait for all image deletions to complete (or fail gracefully)
      await Promise.allSettled(deletePromises);
      
      // Delete the Firestore document
      await deleteDoc(doc(db, "projects", projectId));
      
      // Update local state
      setProjectDocs(prev => prev.filter(doc => doc.id !== projectId));
      toast.success("Project and associated images deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };
  
  const handleDuplicateProject = async (projectId: string) => {
    if (!currentUser) return;
    
    try {
      const projectDoc = projectDocs.find(doc => doc.id === projectId);
      if (!projectDoc) return;
      
      const projectData = projectDoc.data();
      
      const newProject = {
        ...projectData,
        title: `${projectData.title || 'Untitled'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid
      };
      
      // Navigate to onboarding with the duplicated project data
      navigate('/onboarding', { state: { duplicatedProject: newProject } });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to duplicate project";
      toast.error(errorMessage);
    }
  };

  const fetchProjects = useCallback(async (loadMore = false) => {
    if (!currentUser) return;
    
    setIsLoading(!loadMore); // Only show loading indicator for initial load
    setError(null);
    
    try {
      const projectsRef = collection(db, "projects");
      
      let baseQuery = query(projectsRef, where("userId", "==", currentUser.uid));
      
      if (filterBy !== 'all') {
        const statusValue = filterBy.toUpperCase();
        baseQuery = query(baseQuery, where("status", "==", statusValue));
      }
      
      let sortedQuery;
      switch (sortBy) {
        case 'newest':
          sortedQuery = query(baseQuery, orderBy("createdAt", "desc"));
          break;
        case 'oldest':
          sortedQuery = query(baseQuery, orderBy("createdAt", "asc"));
          break;
        case 'name-asc':
          sortedQuery = query(baseQuery, orderBy("title", "asc"));
          break;
        case 'name-desc':
          sortedQuery = query(baseQuery, orderBy("title", "desc"));
          break;
        case 'status':
          sortedQuery = query(baseQuery, orderBy("status", "asc"));
          break;
        default:
          sortedQuery = query(baseQuery, orderBy("createdAt", "desc"));
      }
      
      let paginatedQuery;
      if (loadMore && lastVisible) {
        paginatedQuery = query(sortedQuery, startAfter(lastVisible), limit(PROJECTS_PER_PAGE));
      } else {
        paginatedQuery = query(sortedQuery, limit(PROJECTS_PER_PAGE));
      }
      
      const querySnapshot = await getDocs(paginatedQuery);
      
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      
      setHasMore(querySnapshot.docs.length === PROJECTS_PER_PAGE);
      
      if (loadMore) {
        setProjectDocs(prev => [...prev, ...querySnapshot.docs]);
      } else {
        setProjectDocs(querySnapshot.docs);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      if (!loadMore) {
        setProjectDocs([]); // Only clear on initial load error
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, filterBy, sortBy, lastVisible, setIsLoading, setError, setLastVisible, setHasMore, setProjectDocs]);
  
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchProjects(true);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredProjects = projectDocs.filter(doc => {
    const data = doc.data();
    const title = data.title || '';
    const roomType = data.roomType || '';
    
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    } else {
      setIsLoading(false);
      setProjectDocs([]); // Clear docs if not logged in
    }
  }, [currentUser, sortBy, filterBy, fetchProjects]);

  // Loading state while Firebase auth initializes or projects are fetching
  if (isLoading && !projectDocs.length) {
    return <LoadingPage />;
  }

  // Signed out view (Redirect or show message if currentUser is null)
  // This check is redundant if protected routes are set up correctly,
  // but can be kept as a fallback.
  if (!currentUser) {
    return (
      <PageContainer>
        <div className="max-w-md mx-auto text-center py-12">
          <h1 className="text-2xl font-semibold mb-4">Your Projects</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your projects.
          </p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </PageContainer>
    );
  }

  const ProjectActionMenu = ({ projectId }: { projectId: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            onCloseAutoFocus={(e) => {
              // Prevent focus issues when closing
              e.preventDefault();
            }}
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                navigate(`/project/${projectId}`);
              }}
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                handleDuplicateProject(projectId);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                setProjectToDelete(projectId);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Signed in view
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">My Projects</h1>
          <Link to="/onboarding">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>Sort by</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filterBy}
              onValueChange={(value) => setFilterBy(value as FilterOption)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <span>Filter</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">In Progress</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state for initial load */}
        {isLoading && !projectDocs.length && (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-destructive">
            <p>Error loading projects: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchProjects()}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!error && !isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            {searchTerm || filterBy !== 'all' ? (
              <>
                <p className="text-muted-foreground mb-4">No projects match your search or filter criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">You haven't created any projects yet.</p>
                <Button
                  className="gap-2"
                  onClick={() => navigate('/onboarding')}
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </>
            )}
          </div>
        )}

        {/* Projects grid */}
        {!error && filteredProjects.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProjects.map((doc) => {
                const data = doc.data();
                
                // Convert Firestore Timestamp to string/Date for createdAt
                let createdAt: string | Date = new Date().toISOString();
                if (data.createdAt) {
                  if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate().toISOString();
                  } else if (data.createdAt.toMillis && typeof data.createdAt.toMillis === 'function') {
                    createdAt = new Date(data.createdAt.toMillis()).toISOString();
                  } else if (data.createdAt instanceof Date) {
                    createdAt = data.createdAt.toISOString();
                  } else if (typeof data.createdAt === 'string') {
                    createdAt = data.createdAt;
                  }
                }
                
                const projectData = { 
                  id: doc.id,
                  title: data.title || data.projectName,
                  projectName: data.projectName || data.title,
                  userId: data.userId || '',
                  roomType: data.roomType || 'Room',
                  budget: data.budget,
                  style: data.style,
                  renovationType: data.renovationType,
                  instructions: data.instructions,
                  beforeImageKey: data.beforeImageKey,
                  afterImageKey: data.afterImageKey,
                  diySuggestions: data.diySuggestions || data.aiSuggestions || [],
                  createdAt: createdAt,
                  updatedAt: data.updatedAt,
                  status: data.status || data.aiStatus || 'PENDING',
                  aiStatus: data.aiStatus,
                  totalCost: data.totalCost ?? data.aiTotalEstimatedCost,
                  aiTotalEstimatedCost: data.aiTotalEstimatedCost,
                  thumbnailUrl: data.thumbnailUrl,
                  uploadedImageURL: data.uploadedImageURL,
                }; 
                
                return (
                  <div key={projectData.id} className="relative group">
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 shadow-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProjectToDelete(projectData.id);
                        }}
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ProjectActionMenu projectId={projectData.id} />
                    </div>
                    <ProjectCard 
                      project={projectData as import('@/components/projects/ProjectCard').Project} 
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loading className="h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Projects
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        
        {/* Delete confirmation dialog */}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your project and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loading className="mr-2 h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
};

export default Projects;                        