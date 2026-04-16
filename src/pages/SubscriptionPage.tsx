import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Star, Zap, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/PageContainer";

interface UsageData {
  canGenerate: boolean;
  generationsUsed: number;
  generationsLimit: number;
  isPro: boolean;
}

interface SubscriptionData extends UsageData {
  status?: string;
  planId?: "monthly" | "annual";
  currentPeriodEnd?: { seconds: number };
  cancelAtPeriodEnd?: boolean;
  trialEnd?: { seconds: number } | null;
}

const monthlyFeatures = [
  "Unlimited AI renovations",
  "All room types & styles",
  "DIY cost breakdowns",
  "Download & share results",
];

const annualFeatures = [
  ...monthlyFeatures,
  "7-day free trial — no charge upfront",
  "Save 58% vs monthly",
];

export default function SubscriptionPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    const fetch = async () => {
      try {
        const checkFn = httpsCallable<void, UsageData>(functions, "stripeCheckCanGenerate");
        const result = await checkFn();
        setData(result.data as SubscriptionData);
      } catch {
        toast.error("Failed to load subscription info");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentUser, navigate]);

  const handleCheckout = async (planId: "monthly" | "annual") => {
    setCheckoutLoading(planId);
    try {
      const createCheckout = httpsCallable<
        { planId: string; successUrl: string; cancelUrl: string },
        { url: string }
      >(functions, "stripeCreateCheckout");
      const result = await createCheckout({
        planId,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href,
      });
      window.location.href = result.data.url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const portalFn = httpsCallable<{ returnUrl: string }, { url: string }>(
        functions, "stripeCreatePortal"
      );
      const result = await portalFn({ returnUrl: window.location.href });
      window.location.href = result.data.url;
    } catch {
      toast.error("Could not open billing portal. Please try again.");
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p>Failed to load subscription info.</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </PageContainer>
    );
  }

  const periodEnd = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd.seconds * 1000).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  const trialEnd = data.trialEnd
    ? new Date(data.trialEnd.seconds * 1000).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>

      {/* Current status card */}
      {data.isPro ? (
        <div className="rounded-xl border-2 border-budget-accent/40 bg-budget-accent/5 p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-budget-accent fill-budget-accent" />
            <span className="font-semibold text-budget-accent">Pro Plan Active</span>
            {data.status === "trialing" && trialEnd && (
              <Badge variant="outline" className="ml-auto text-xs">Trial ends {trialEnd}</Badge>
            )}
            {data.status === "active" && data.cancelAtPeriodEnd && (
              <Badge variant="outline" className="ml-auto text-xs text-orange-600 border-orange-300">
                Cancels {periodEnd}
              </Badge>
            )}
            {data.status === "active" && !data.cancelAtPeriodEnd && periodEnd && (
              <Badge variant="outline" className="ml-auto text-xs">Renews {periodEnd}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {data.planId === "annual" ? "Annual plan · $49.99/yr" : "Monthly plan · $9.99/mo"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Manage Billing
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/40 p-5 mb-8">
          <p className="font-medium mb-1">Free Plan</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{data.generationsUsed} / {data.generationsLimit} free renovations used</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div
              className="bg-budget-accent h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((data.generationsUsed / data.generationsLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Upgrade section — only shown for free users */}
      {!data.isPro && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Upgrade to Pro</h2>

          {/* Annual hero */}
          <div className="relative rounded-xl border-2 border-budget-accent bg-budget-accent/5 p-5">
            <div className="absolute -top-2.5 left-3">
              <Badge className="bg-budget-accent text-white border-0 text-xs gap-1">
                <Star className="h-3 w-3 fill-white" /> Most popular · 7-day free trial
              </Badge>
            </div>
            <div className="flex items-start justify-between mt-1">
              <div>
                <p className="font-semibold">Annual</p>
                <p className="text-xs text-muted-foreground">$4.17 / month, billed yearly</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$49.99</p>
                <p className="text-xs text-muted-foreground line-through">$119.88</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {annualFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-budget-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-4 bg-budget-accent hover:bg-budget-accent/90"
              onClick={() => handleCheckout("annual")}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === "annual"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Start Free Trial"}
            </Button>
          </div>

          {/* Monthly */}
          <div className="rounded-xl border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">Monthly</p>
                <p className="text-xs text-muted-foreground">Cancel any time</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$9.99</p>
                <p className="text-xs text-muted-foreground">/ month</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {monthlyFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => handleCheckout("monthly")}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === "monthly"
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : "Get Monthly"}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground py-2">
            Secure payment via Stripe · Cancel any time
          </p>
        </div>
      )}
    </PageContainer>
  );
}
