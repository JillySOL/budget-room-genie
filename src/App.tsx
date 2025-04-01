import { ClerkProvider, useUser } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ClerkAuth } from './components/auth/ClerkAuth';
import { ImageUpload } from './components/upload/ImageUpload';
import { SubscriptionCheckout } from './components/subscription/SubscriptionCheckout';
import { Toaster } from 'sonner';
import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvironmentVariables } from './utils/env';
import { BottomNav } from './components/navigation/BottomNav';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OnboardingPage from './pages/OnboardingPage';
import NewProject from './pages/NewProject';
import Projects from './pages/Projects';
import ExplorePage from './pages/ExplorePage';
import ProjectDetailPage from './pages/ProjectDetailPage';

// Get the key from environment variables
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Protected Route wrapper - redirects to sign-in if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    // Save the attempted location
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper - redirects to home if already signed in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    // Redirect to the page they came from, or home
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

function App() {
  useEffect(() => {
    validateEnvironmentVariables();
  }, []);

  const handleUploadComplete = (url: string) => {
    console.log('Upload complete:', url);
  };

  // Show error if no key is present
  if (!CLERK_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Missing Clerk Configuration</h2>
          <p className="text-gray-600">
            Please check your environment variables and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600">
              There was an error initializing the application. Please try again.
            </p>
          </div>
        </div>
      }
    >
      <ClerkProvider publishableKey={CLERK_KEY}>
        <Router>
          <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <p>Loading...</p>
                    </div>
                  </div>
                }
              >
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/project/:id" element={<ProjectDetailPage />} />
                  
                  {/* Auth routes - redirect to home if already signed in */}
                  <Route 
                    path="/sign-in" 
                    element={
                      <PublicRoute>
                        <ClerkAuth />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/sign-up" 
                    element={
                      <PublicRoute>
                        <ClerkAuth />
                      </PublicRoute>
                    } 
                  />

                  {/* Protected routes - redirect to sign-in if not authenticated */}
                  <Route 
                    path="/new-project" 
                    element={
                      <ProtectedRoute>
                        <NewProject />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects" 
                    element={
                      <ProtectedRoute>
                        <Projects />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/upload" 
                    element={
                      <ProtectedRoute>
                        <ImageUpload onUploadComplete={handleUploadComplete} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/subscription" 
                    element={
                      <ProtectedRoute>
                        <SubscriptionCheckout />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ClerkAuth />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <BottomNav />
          </div>
        </Router>
        <Toaster />
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
