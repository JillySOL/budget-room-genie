import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ImageUpload } from './components/upload/ImageUpload';
import { SubscriptionCheckout } from './components/subscription/SubscriptionCheckout';
import { Toaster } from 'sonner';
import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvironmentVariables } from './utils/env';
import { BottomNav } from './components/navigation/BottomNav';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { ClerkAuth, ClerkSignUp } from './components/auth/ClerkAuth';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OnboardingPage from './pages/OnboardingPage';
import NewProject from './pages/NewProject';
import Projects from './pages/Projects';
import ExplorePage from './pages/ExplorePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Clerk Publishable Key");
}

// Protected Route wrapper - redirects to sign-in if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
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

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
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
                  
                  {/* Auth routes */}
                  <Route path="/sign-in" element={<ClerkAuth />} />
                  <Route path="/sign-up" element={<ClerkSignUp />} />

                  {/* Protected routes */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />
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

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <BottomNav />
          </div>
        </Router>
        <Toaster />
      </ErrorBoundary>
    </ClerkProvider>
  );
}

export default App;
