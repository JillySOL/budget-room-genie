import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase-config";
import { Loader2, Zap, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
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

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "annual" | null>(null);

  const handleCheckout = async (planId: "monthly" | "annual") => {
    setLoadingPlan(planId);
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
    } catch (err) {
      toast.error("Could not start checkout. Please try again.");
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-budget-accent/90 to-budget-accent px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 fill-white" />
            <Badge className="bg-white/20 text-white border-0 text-xs">Free limit reached</Badge>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Upgrade to Pro</DialogTitle>
            <DialogDescription className="text-white/85 mt-1">
              You've used your 2 free renovations. Unlock unlimited AI designs.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Annual card — hero */}
          <div className="relative rounded-xl border-2 border-budget-accent bg-budget-accent/5 p-4">
            <div className="absolute -top-2.5 left-3">
              <Badge className="bg-budget-accent text-white border-0 text-xs gap-1">
                <Star className="h-3 w-3 fill-white" /> Most popular · 7-day free trial
              </Badge>
            </div>
            <div className="flex items-start justify-between mt-1">
              <div>
                <p className="font-semibold text-sm">Annual</p>
                <p className="text-xs text-muted-foreground">$4.17 / month, billed yearly</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$49.99</p>
                <p className="text-xs text-muted-foreground line-through">$119.88</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {annualFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                  <CheckCircle className="h-3.5 w-3.5 text-budget-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full mt-3 bg-budget-accent hover:bg-budget-accent/90"
              onClick={() => handleCheckout("annual")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "annual" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Start Free Trial"
              )}
            </Button>
          </div>

          {/* Monthly card */}
          <div className="rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">Monthly</p>
                <p className="text-xs text-muted-foreground">Cancel any time</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">$9.99</p>
                <p className="text-xs text-muted-foreground">/ month</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {monthlyFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => handleCheckout("monthly")}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === "monthly" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Get Monthly"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-1">
            Secure payment via Stripe · Cancel any time
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
