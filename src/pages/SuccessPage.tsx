import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db, functions } from "@/firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";

type Phase =
  | "confirming"   // polling token / webhook
  | "resuming"     // auto-creating the cached project
  | "ready"        // confirmed Pro, no pending project
  | "error";       // webhook never arrived within timeout

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 20; // 40 seconds total

export default function SuccessPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("confirming");
  const [statusText, setStatusText] = useState("Confirming your subscription…");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    let cancelled = false;

    const run = async () => {
      // ── Step 1: Poll until stripeRole === "pro" appears in the token ──────
      let confirmed = false;
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const tokenResult = await currentUser.getIdTokenResult(true);
          if (tokenResult.claims?.stripeRole === "pro") {
            confirmed = true;
            break;
          }
        } catch {
          // token refresh failed — keep trying
        }

        // Fallback: also ask the server in case claims are delayed
        if (attempt >= 5) {
          try {
            const checkFn = httpsCallable<void, { isPro: boolean }>(functions, "stripeCheckCanGenerate");
            const result = await checkFn();
            if (result.data.isPro) {
              confirmed = true;
              break;
            }
          } catch {
            // ignore, keep polling token
          }
        }

        if (attempt === 5) setStatusText("Almost there, finalising your account…");
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      if (cancelled) return;

      if (!confirmed) {
        // Webhook never arrived — let them proceed anyway (Firestore will catch up)
        setPhase("ready");
        return;
      }

      // ── Step 2: Check for a pending project saved by OnboardingPage ───────
      const raw = localStorage.getItem("renomate_pending_project");
      if (!raw) {
        setPhase("ready");
        return;
      }

      // ── Step 3: Auto-create the project and navigate ──────────────────────
      setPhase("resuming");
      setStatusText("Subscription confirmed! Starting your renovation…");

      try {
        const pending = JSON.parse(raw);
        localStorage.removeItem("renomate_pending_project");

        const docRef = await addDoc(collection(db, "projects"), {
          ...pending,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        toast.success("Subscription active — generating your renovation!");
        navigate(`/project/${docRef.id}`);
      } catch (err) {
        console.error("Failed to create pending project:", err);
        toast.error("Something went wrong resuming your project. Tap Generate below.");
        setPhase("ready");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [currentUser, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === "confirming" || phase === "resuming") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background gap-5">
        <div className="w-20 h-20 rounded-full bg-budget-accent/10 flex items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-budget-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-1">{statusText}</h1>
          <p className="text-sm text-muted-foreground">
            {phase === "resuming"
              ? "Creating your project…"
              : "Verifying with Stripe, this takes a few seconds."}
          </p>
        </div>
      </div>
    );
  }

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
        <Button
          className="w-full gap-2 bg-budget-accent hover:bg-budget-accent/90"
          onClick={() => navigate("/onboarding")}
        >
          <Zap className="h-4 w-4 fill-white" />
          Generate My First Renovation
        </Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}
