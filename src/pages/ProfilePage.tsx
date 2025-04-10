import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/firebase-config";
import { signOut } from "firebase/auth";
import { toast as sonnerToast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sonnerToast.success("Logged out successfully!");
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error);
      sonnerToast.error("Failed to log out.");
    }
  };

  if (!currentUser) {
    // This shouldn't happen due to ProtectedRoute, but good practice
    return (
      <PageContainer>
        <p>Loading user information...</p>
      </PageContainer>
    );
  }

  // Get first letter for fallback avatar
  const fallbackName = currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 
                       currentUser.email ? currentUser.email[0].toUpperCase() : '?';

  return (
    <PageContainer className="flex flex-col items-center pt-10">
      <Avatar className="w-24 h-24 mb-4">
        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
        <AvatarFallback className="text-3xl">{fallbackName}</AvatarFallback>
      </Avatar>

      <h1 className="text-2xl font-semibold mb-1">{currentUser.displayName || "User"}</h1>
      <p className="text-muted-foreground mb-6">{currentUser.email}</p>

      {/* Add other profile details or settings links here if needed */}
      
      <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs mt-4 gap-2">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </PageContainer>
  );
};

export default ProfilePage; 