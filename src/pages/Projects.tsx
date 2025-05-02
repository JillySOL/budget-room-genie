import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { LoadingPage, Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard, Project } from "@/components/projects/ProjectCard";
import { db } from "@/firebase-config";
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
      await deleteDoc(doc(db, "projects", projectId));
      
      setProjectDocs(prev => prev.filter(doc => doc.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Failed to delete project");
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
      console.error("Error duplicating project:", err);
      toast.error("Failed to duplicate project");
    }
  };

  const fetchProjects = async (loadMore = false) => {
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
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      if (!loadMore) {
        setProjectDocs([]); // Only clear on initial load error
      }
    } finally {
      setIsLoading(false);
    }
  };
  
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

  const ProjectActionMenu = ({ projectId }: { projectId: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/project/${projectId}`)}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicateProject(projectId)}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={() => setProjectToDelete(projectId)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((doc) => {
                const projectData = { 
                  id: doc.id, 
                  ...doc.data() 
                }; 
                
                return (
                  <div key={projectData.id} className="relative group">
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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