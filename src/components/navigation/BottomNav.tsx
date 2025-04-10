import { Link, useLocation } from "react-router-dom";
import { Home, Search, Percent, User, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BottomNav = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const isActive = (path: string) => {
    if (path === "/profile" && currentUser) {
      return location.pathname === "/profile";
    } else if (path === "/login" && !currentUser) {
      return location.pathname === "/login";
    }
    return location.pathname === path;
  };

  const profilePath = currentUser ? "/profile" : "/login";
  const profileLabel = currentUser ? "Profile" : "Login";
  const ProfileIcon = currentUser ? User : LogIn;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50">
      <Link to="/" className="flex flex-col items-center">
        <Home className={`h-6 w-6 ${isActive('/') ? 'text-budget-accent' : 'text-gray-500'}`} />
        <span className={`text-xs mt-1 ${isActive('/') ? 'text-budget-accent font-medium' : 'text-gray-500'}`}>Home</span>
      </Link>
      
      <Link to="/explore" className="flex flex-col items-center">
        <Search className={`h-6 w-6 ${isActive('/explore') ? 'text-budget-accent' : 'text-gray-500'}`} />
        <span className={`text-xs mt-1 ${isActive('/explore') ? 'text-budget-accent font-medium' : 'text-gray-500'}`}>Explore</span>
      </Link>
      
      <Link to="/projects" className="flex flex-col items-center">
        <Percent className={`h-6 w-6 ${isActive('/projects') ? 'text-budget-accent' : 'text-gray-500'}`} />
        <span className={`text-xs mt-1 ${isActive('/projects') ? 'text-budget-accent font-medium' : 'text-gray-500'}`}>Projects</span>
      </Link>
      
      <Link to={profilePath} className="flex flex-col items-center">
        <ProfileIcon className={`h-6 w-6 ${isActive(profilePath) ? 'text-budget-accent' : 'text-gray-500'}`} />
        <span className={`text-xs mt-1 ${isActive(profilePath) ? 'text-budget-accent font-medium' : 'text-gray-500'}`}>{profileLabel}</span>
      </Link>
    </div>
  );
};

export default BottomNav;
