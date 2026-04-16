import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SuccessPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Force a token refresh so the new stripeRole custom claim is picked up
  useEffect(() => {
    if (currentUser) {
      currentUser.getIdToken(true).catch(() => null);
    }
  }, [currentUser]);

  // If somehow landed here without auth, bounce to login
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold mb-2">You're now a Pro!</h1>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Your subscription is active. Start generating unlimited AI renovations.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link to="/onboarding">
          <Button className="w-full gap-2 bg-budget-accent hover:bg-budget-accent/90">
            <Zap className="h-4 w-4 fill-white" />
            Generate My First Renovation
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" className="w-full">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
