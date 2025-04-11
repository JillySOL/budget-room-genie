import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/firebase-config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react'; // Reverted to Chrome icon
import PageContainer from '@/components/layout/PageContainer';
import Logo from '@/components/ui-custom/Logo';
import { toast as sonnerToast } from 'sonner';
import { useAuth } from "@/context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Use location hook
  const { currentUser } = useAuth();
  const postLoginRedirectKey = 'postLoginRedirectPath';

  // Redirect if user is already logged in (uses location.state)
  useEffect(() => {
    if (currentUser) {
      console.log("User already logged in, checking for redirect path...");
      const intendedPath = location.state?.from?.pathname;
      // Also check sessionStorage as a fallback if state was lost somehow before login page loaded
      const storedPath = sessionStorage.getItem(postLoginRedirectKey);
      const destination = intendedPath || storedPath || "/";
      
      console.log(`Redirecting already logged-in user to: ${destination}`);
      if (storedPath) sessionStorage.removeItem(postLoginRedirectKey); // Clean up storage
      navigate(destination, { replace: true });
    }
  }, [currentUser, navigate, location.state]);

  const handleGoogleSignIn = async () => {
    if (currentUser) {
      sonnerToast.info("You are already signed in.");
      return;
    }

    // --- Store intended path before starting sign-in ---
    const intendedPath = location.state?.from?.pathname;
    if (intendedPath && intendedPath !== '/') {
      sessionStorage.setItem(postLoginRedirectKey, intendedPath);
      console.log(`Stored intended redirect path: ${intendedPath}`);
    }
    // --------------------------------------------------

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      sonnerToast.success("Signed in successfully!");
      
      // --- Determine redirect path: check sessionStorage first ---
      const storedPath = sessionStorage.getItem(postLoginRedirectKey);
      const from = storedPath || "/"; // Use stored path or default to homepage
      
      console.log(`Login successful. Navigating to: ${from}`);
      if (storedPath) {
        sessionStorage.removeItem(postLoginRedirectKey); // Clean up storage
      }
      navigate(from, { replace: true }); 
      // ---------------------------------------------------------

    } catch (error) {
      // --- Clear stored path on error to prevent incorrect redirect later ---
      sessionStorage.removeItem(postLoginRedirectKey);
      // ------------------------------------------------------------------
      console.error("Google Sign-In failed:", error);
      let message = "Google Sign-In failed. Please try again.";
      if (error instanceof Error && 'code' in error) {
          const firebaseError = error as { code: string; message: string }; // Type assertion
          if (firebaseError.code === 'auth/popup-closed-by-user') {
              message = "Sign-in cancelled. Please try again if you wish to log in.";
              sonnerToast.info(message);
          } else if (firebaseError.code === 'auth/cancelled-popup-request') {
              message = "Multiple sign-in attempts detected. Please complete the existing sign-in first.";
              sonnerToast.warning(message);
          } else if (firebaseError.code === 'auth/popup-blocked-by-browser') {
              message = "Popup blocked by browser. Please allow popups for this site to sign in.";
              sonnerToast.error(message);
          } else {
              sonnerToast.error(message + ` (Code: ${firebaseError.code})`);
          }
      } else {
        sonnerToast.error(message);
      }
    }
  };

  // Don't render the login form if the user is logged in (they are being redirected by useEffect)
  if (currentUser) {
    return null; // Or a loading indicator
  }

  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center max-w-xs w-full">
        <Logo size="lg" />
        <h1 className="text-2xl font-semibold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground mb-8">
          Sign in to continue to your projects.
        </p>
        <Button 
          onClick={handleGoogleSignIn} 
          variant="outline" 
          className="w-full gap-2" 
        >
          <Chrome className="h-5 w-5" />
          Sign in with Google
        </Button>
        {/* Add other sign-in methods here if needed */}
      </div>
    </PageContainer>
  );
};

export default LoginPage; 