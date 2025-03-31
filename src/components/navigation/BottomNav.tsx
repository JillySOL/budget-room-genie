
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Percent, User } from "lucide-react";

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
      
      <Link to="/login" className="flex flex-col items-center">
        <User className={`h-6 w-6 ${isActive('/login') ? 'text-budget-accent' : 'text-gray-500'}`} />
        <span className={`text-xs mt-1 ${isActive('/login') ? 'text-budget-accent font-medium' : 'text-gray-500'}`}>Profile</span>
      </Link>
    </div>
  );
};

export default BottomNav;
