
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageContainer className="flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="mt-4 gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </PageContainer>
  );
};

export default NotFound;
