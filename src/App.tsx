
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
import { toast } from 'sonner';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OnboardingPage from './pages/OnboardingPage';
import NewProject from './pages/NewProject';
import Projects from './pages/Projects';
import ExplorePage from './pages/ExplorePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage';

// Get Clerk publishable key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
    try {
      validateEnvironmentVariables();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      console.error('Environment validation error:', error);
    }
  }, []);

  const handleUploadComplete = (url: string) => {
    console.log('Upload complete:', url);
  };

  // If Clerk key is missing, show a developer-friendly error message
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-red-500 mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">Missing Clerk Publishable Key</h2>
          <p className="text-gray-600 text-center mb-4">
            Authentication cannot initialize without your Clerk publishable key.
          </p>
          <div className="bg-gray-100 p-3 rounded-md mb-4">
            <p className="text-sm font-mono text-gray-800">
              1. Create a <code>.env</code> file in the project root<br />
              2. Add <code>VITE_CLERK_PUBLISHABLE_KEY=your_key_here</code><br />
              3. Restart your development server
            </p>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Get your publishable key from the <a href="https://dashboard.clerk.dev" target="_blank" rel="noopener noreferrer" className="text-budget-accent hover:underline">Clerk Dashboard</a>
          </p>
        </div>
      </div>
    );
  }

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
