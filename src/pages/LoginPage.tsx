import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/firebase-config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react'; // Or find a Google icon if preferred
import PageContainer from '@/components/layout/PageContainer';
import Logo from '@/components/ui-custom/Logo';
import { toast as sonnerToast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      sonnerToast.success("Signed in successfully!");
      
      // Navigate to the homepage after successful login
      console.log("Navigating to homepage after successful login.");
      navigate('/'); 

    } catch (error) {
      console.error("Google Sign-In failed:", error);
      sonnerToast.error("Sign-in failed. Please try again.");
    }
  };

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
          className="w-full gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
        >
          <Chrome className="h-5 w-5" /> Sign in with Google
        </Button>
        {/* Add other sign-in methods here if needed */}
      </div>
    </PageContainer>
  );
};

export default LoginPage; 