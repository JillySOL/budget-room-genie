import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import Logo from "@/components/ui-custom/Logo";
import {
  Sparkles, CheckCircle, Star, Zap,
  Camera, Wand2, Download, ArrowRight, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase-config";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const steps = [
  {
    icon: Camera,
    title: "Snap your room",
    desc: "Upload any photo of your space — messy or perfect.",
  },
  {
    icon: Wand2,
    title: "Pick your style",
    desc: "Choose a renovation type, budget, and aesthetic.",
  },
  {
    icon: Download,
    title: "Get your AI design",
    desc: "See your room transformed in under 60 seconds.",
  },
];

const features = [
  { emoji: "⚡", title: "Results in 60 seconds", desc: "No waiting days for a designer quote." },
  { emoji: "💰", title: "DIY cost breakdown", desc: "Itemised list of what to buy and how much it costs." },
  { emoji: "🏠", title: "Every room type", desc: "Living room, bedroom, kitchen, bathroom, and more." },
  { emoji: "📲", title: "Download & share", desc: "Save your design or send it to a tradie for quotes." },
];

const reviews = [
  { name: "Sarah M.", text: "Showed my husband the AI version and he finally agreed to the renovation. Worth every cent.", stars: 5 },
  { name: "James T.", text: "Used it to visualise a kitchen reno before spending $40k. Saved me from a colour I would have hated.", stars: 5 },
  { name: "Priya K.", text: "Did 3 different style options in 5 minutes. My interior designer charges $200/hr for that!", stars: 5 },
];

const monthlyFeatures = [
  "Unlimited AI renovations",
  "All room types & styles",
  "DIY cost breakdowns",
  "Download & share results",
];

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  const handleStart = () => {
    navigate(currentUser ? "/home" : "/login");
  };

  const handleCheckout = async (planId: "monthly" | "annual") => {
    if (!currentUser) { navigate("/login"); return; }
    setCheckoutLoading(planId);
    try {
      const fn = httpsCallable<{ planId: string; successUrl: string; cancelUrl: string }, { url: string }>(
        functions, "stripeCreateCheckout"
      );
      const result = await fn({ planId, successUrl: `${window.location.origin}/success`, cancelUrl: window.location.href });
      window.location.href = result.data.url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link to="/home">
                <Button size="sm" className="bg-budget-accent hover:bg-budget-accent/90 gap-1">
                  Open App <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-budget-accent hover:bg-budget-accent/90">
                    Try free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 pt-10 pb-6 text-center">
        <Badge className="bg-budget-accent/10 text-budget-accent border-budget-accent/20 mb-4 text-xs gap-1.5">
          <Sparkles className="h-3 w-3" /> AI Room Renovation
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
          See your room renovated<br />
          <span className="text-budget-accent">before spending a cent</span>
        </h1>
        <p className="text-base text-muted-foreground mb-6 max-w-sm mx-auto">
          Upload a photo. Get a photorealistic AI renovation with a full DIY cost breakdown — in 60 seconds.
        </p>
        <div className="flex flex-col items-center gap-2 mb-2">
          <Button
            size="lg"
            className="bg-budget-accent hover:bg-budget-accent/90 gap-2 w-full max-w-xs text-base h-12"
            onClick={handleStart}
          >
            <Sparkles className="h-4 w-4" />
            Start My Free Renovation
          </Button>
          <span className="text-xs text-muted-foreground">2 free renovations · No card required</span>
        </div>
      </section>

      {/* ── Before/After Demo ───────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 mb-10">
        <EnhancedBeforeAfter
          beforeImage="/before.png"
          afterImage="/after.png"
          className="rounded-2xl overflow-hidden shadow-xl border"
        />
        <p className="text-center text-xs text-muted-foreground mt-2">
          Real result — Budget Flip renovation, under $500
        </p>
      </section>

      {/* ── Social proof strip ──────────────────────────────────── */}
      <section className="bg-muted/40 border-y border-border/50 py-4 mb-10">
        <div className="max-w-2xl mx-auto px-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> No tradie required</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> Results in 60 seconds</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> 2 free tries, no card</span>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 mb-12">
        <h2 className="text-xl font-bold text-center mb-6">How it works</h2>
        <div className="grid grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-budget-accent/10 flex items-center justify-center mx-auto mb-3">
                <s.icon className="h-6 w-6 text-budget-accent" />
              </div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 mb-12">
        <h2 className="text-xl font-bold text-center mb-6">Everything you need</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <span className="text-2xl mb-2 block">{f.emoji}</span>
              <p className="font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 mb-12">
        <h2 className="text-xl font-bold text-center mb-6">What homeowners say</h2>
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: r.stars }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 mb-2">"{r.text}"</p>
              <p className="text-xs text-muted-foreground font-medium">— {r.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-5 mb-12">
        <h2 className="text-xl font-bold text-center mb-2">Simple pricing</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Start free. Upgrade when you're ready.</p>

        <div className="space-y-3">
          {/* Annual hero */}
          <div className="relative rounded-2xl border-2 border-budget-accent bg-budget-accent/5 p-5">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-budget-accent text-white border-0 gap-1 text-xs">
                <Star className="h-3 w-3 fill-white" /> Most popular · 7-day free trial
              </Badge>
            </div>
            <div className="flex items-start justify-between mt-1">
              <div>
                <p className="font-bold text-base">Annual</p>
                <p className="text-xs text-muted-foreground">$4.17 / month, billed yearly</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$49.99</p>
                <p className="text-xs text-muted-foreground line-through">$119.88</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 mb-4">
              {[...monthlyFeatures, "7-day free trial — no charge upfront", "Save 58% vs monthly"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-budget-accent shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-budget-accent hover:bg-budget-accent/90"
              onClick={() => handleCheckout("annual")}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === "annual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free Trial"}
            </Button>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-base">Monthly</p>
                <p className="text-xs text-muted-foreground">Cancel any time</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">$9.99</p>
                <p className="text-xs text-muted-foreground">/ month</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {monthlyFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleCheckout("monthly")}
              disabled={checkoutLoading !== null}
            >
              {checkoutLoading === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Monthly"}
            </Button>
          </div>

          {/* Free tier callout */}
          <div className="rounded-xl bg-muted/40 border p-4 text-center">
            <p className="text-sm font-medium mb-1">Just browsing?</p>
            <p className="text-xs text-muted-foreground mb-3">Get 2 free renovations — no card needed.</p>
            <Button variant="outline" size="sm" onClick={handleStart} className="gap-1">
              Try for free <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="bg-budget-accent px-5 py-12 text-center text-white mb-0">
        <Zap className="h-8 w-8 fill-white mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-extrabold mb-2">Ready to see your renovation?</h2>
        <p className="text-white/80 text-sm mb-6 max-w-xs mx-auto">
          Join thousands of homeowners visualising their dream space before spending a cent.
        </p>
        <Button
          size="lg"
          className="bg-white text-budget-accent hover:bg-white/90 gap-2 font-semibold"
          onClick={handleStart}
        >
          <Sparkles className="h-4 w-4" />
          Start My Free Renovation
        </Button>
        <p className="text-white/60 text-xs mt-3">2 free renovations · No card required</p>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border/50 px-5 py-6 text-center">
        <Logo size="sm" className="mx-auto mb-3" />
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground mb-3">
          <Link to="/login" className="hover:text-foreground">Sign in</Link>
          <Link to="/subscription" className="hover:text-foreground">Pricing</Link>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RenoMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
