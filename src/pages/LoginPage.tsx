import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Chrome } from "lucide-react";
import Logo from "@/components/ui-custom/Logo";
import { auth } from "@/firebase-config"; // Import Firebase auth
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile, // To set user's display name
  sendPasswordResetEmail, // For forgot password
  GoogleAuthProvider,       // Keep ONLY this social provider import
  signInWithPopup,          // Added
  AuthProvider as FirebaseAuthProvider // Alias for type safety
} from "firebase/auth";
import { useToast } from "@/components/ui/use-toast"; // For error messages
import { toast as sonnerToast } from "sonner"; // For success messages

// Define providers
const googleProvider = new GoogleAuthProvider(); // Keep ONLY this provider definition

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false); // Added for social logins
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", name: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLogin(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      sonnerToast.success("Logged in successfully!");
      navigate("/"); // Navigate to home page after successful login
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSignup(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      );
      
      // Set the user's display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: signupData.name,
        });
      }

      sonnerToast.success("Account created successfully!");
      // Navigate to onboarding or home depending on your flow
      navigate("/onboarding"); 
    } catch (error: any) {
      console.error("Signup Error:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoadingSignup(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      toast({
        variant: "destructive",
        title: "Forgot Password",
        description: "Please enter your email address first.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginData.email);
      sonnerToast.info("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      toast({
        variant: "destructive",
        title: "Forgot Password Failed",
        description: error.message || "Could not send reset email.",
      });
    }
  };

  // Generic handler for social logins
  const handleSocialLogin = async (provider: FirebaseAuthProvider) => {
    setIsLoadingSocial(true);
    try {
      const result = await signInWithPopup(auth, provider);
      // You might want to check if it's a new user and redirect to onboarding
      // const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
      sonnerToast.success(`Signed in with ${provider.providerId.split('.')[0]} successfully!`);
      navigate("/"); // Navigate to home page after successful social login
    } catch (error: any) {
      console.error("Social Login Error:", error);
      // Handle specific errors like account linking if necessary
      toast({
        variant: "destructive",
        title: "Social Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoadingSocial(false);
    }
  };

  return (
    <PageContainer className="flex flex-col" bg="white">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Logo size="md" />
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* Social Login Buttons - Only Google */} 
        <div className="space-y-3 mb-6">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={() => handleSocialLogin(googleProvider)}
            disabled={isLoadingSocial || isLoadingLogin || isLoadingSignup}
          >
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
        </div>
        
        {/* Separator */} 
        <div className="relative mb-6"> 
          <div className="absolute inset-0 flex items-center"> 
            <span className="w-full border-t" /> 
          </div> 
          <div className="relative flex justify-center text-xs uppercase"> 
            <span className="bg-white px-2 text-muted-foreground"> 
              Or continue with email 
            </span> 
          </div> 
        </div>

        <TabsContent value="login" className="mt-0">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                disabled={isLoadingLogin || isLoadingSocial}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <Button 
                  type="button" 
                  variant="link"
                  onClick={handleForgotPassword} 
                  className="text-xs text-budget-teal hover:underline p-0 h-auto"
                  disabled={isLoadingLogin || isLoadingSocial}
                >
                  Forgot password?
                </Button>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                disabled={isLoadingLogin || isLoadingSocial}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoadingLogin || isLoadingSocial}>
              {isLoadingLogin ? "Logging in..." : "Login"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Your Name" 
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                required
                disabled={isLoadingSignup || isLoadingSocial}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input 
                id="signup-email" 
                type="email" 
                placeholder="your@email.com" 
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
                disabled={isLoadingSignup || isLoadingSocial}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password" 
                type="password" 
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                disabled={isLoadingSignup || isLoadingSocial}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters (Firebase default)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoadingSignup || isLoadingSocial}>
              {isLoadingSignup ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By signing up, you agree to our Terms and Privacy Policy
            </p>
          </form>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default LoginPage;
