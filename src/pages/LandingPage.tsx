import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import Logo from "@/components/ui-custom/Logo";
import { BottomNav } from "@/components/navigation/BottomNav";
import {
  Sparkles, CheckCircle, Star, Zap,
  Camera, Wand2, Download, ArrowRight,
  Loader2, PlusCircle, FolderOpen, Crown, ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, db } from "@/firebase-config";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import PaywallModal from "@/components/ui-custom/PaywallModal";

// ── Shared marketing data ─────────────────────────────────────────────────────

const steps = [
  { icon: Camera, title: "Snap your room", desc: "Upload any photo of your space." },
  { icon: Wand2, title: "Pick your style", desc: "Choose budget, style & room type." },
  { icon: Download, title: "Get your AI design", desc: "See it transformed in 60 seconds." },
];

const features = [
  { emoji: "⚡", title: "Results in 60 seconds", desc: "No waiting days for a designer quote." },
  { emoji: "💰", title: "DIY cost breakdown", desc: "Itemised list of what to buy and how much." },
  { emoji: "🏠", title: "Every room type", desc: "Living, bedroom, kitchen, bathroom & more." },
  { emoji: "📲", title: "Download & share", desc: "Save or send to a tradie for quotes." },
];

const reviews = [
  { name: "Sarah M.", text: "Showed my husband the AI version and he finally agreed to the renovation.", stars: 5 },
  { name: "James T.", text: "Used it before spending $40k on a kitchen reno. Saved me from a colour I'd have hated.", stars: 5 },
  { name: "Priya K.", text: "3 style options in 5 minutes. My interior designer charges $200/hr for that!", stars: 5 },
];

const planFeatures = [
  "Unlimited AI renovations",
  "All room types & styles",
  "DIY cost breakdowns",
  "Download & share results",
];

// ── Logged-in dashboard ───────────────────────────────────────────────────────

interface UsageData {
  canGenerate: boolean;
  generationsUsed: number;
  generationsLimit: number;
  isPro: boolean;
}

interface RecentProject {
  id: string;
  projectName: string;
  aiGeneratedImageURL?: string;
  uploadedImageURL?: string;
  aiStatus?: string;
  roomType?: string;
}

function LoggedInDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const [usageResult, projectsSnap] = await Promise.all([
          httpsCallable<void, UsageData>(functions, "stripeCheckCanGenerate")(),
          getDocs(
            query(
              collection(db, "projects"),
              where("userId", "==", currentUser.uid),
              orderBy("createdAt", "desc"),
              limit(3)
            )
          ),
        ]);
        setUsage(usageResult.data);
        setRecentProjects(
          projectsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecentProject, "id">) }))
        );
      } catch {
        // Non-critical — degrade gracefully
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const handleNewRenovation = () => {
    if (usage && !usage.canGenerate) {
      setShowPaywall(true);
    } else {
      navigate("/onboarding");
    }
  };

  const displayName = currentUser?.displayName?.split(" ")[0] || "there";
  const remaining = usage ? Math.max(0, usage.generationsLimit - usage.generationsUsed) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">Profile</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 w-full flex-1 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Status / greeting card */}
            {usage?.isPro ? (
              <div className="rounded-2xl bg-budget-accent/8 border border-budget-accent/20 p-5 flex items-center gap-3">
                <Crown className="h-8 w-8 text-budget-accent shrink-0" />
                <div>
                  <p className="font-semibold">Hey {displayName}! You're on Pro 🎉</p>
                  <p className="text-sm text-muted-foreground">Unlimited renovations — go wild.</p>
                </div>
              </div>
            ) : usage && !usage.canGenerate ? (
              <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-5">
                <p className="font-semibold mb-1">Hey {displayName}! You've used your free renovations.</p>
                <p className="text-sm text-muted-foreground mb-3">Upgrade to keep going — 7-day free trial on annual.</p>
                <Button
                  size="sm"
                  className="bg-budget-accent hover:bg-budget-accent/90 gap-1.5"
                  onClick={() => setShowPaywall(true)}
                >
                  <Zap className="h-3.5 w-3.5 fill-white" /> Upgrade to Pro
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/50 border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">Hey {displayName}! 👋</p>
                    <p className="text-sm text-muted-foreground">
                      {remaining === 2
                        ? "Your 2 free renovations are waiting."
                        : `${remaining} free renovation${remaining === 1 ? "" : "s"} remaining.`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {usage?.generationsUsed ?? 0}/{usage?.generationsLimit ?? 2} used
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-budget-accent h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(((usage?.generationsUsed ?? 0) / (usage?.generationsLimit ?? 2)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Primary CTA */}
            <Button
              size="lg"
              className="w-full h-14 text-base bg-budget-accent hover:bg-budget-accent/90 gap-2"
              onClick={handleNewRenovation}
            >
              <Sparkles className="h-5 w-5" />
              {usage?.isPro ? "New Renovation" : usage?.canGenerate ? "Start My Free Renovation" : "Upgrade to Continue"}
            </Button>

            {/* Recent projects */}
            {recentProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">Recent projects</p>
                  <Link to="/projects" className="text-xs text-budget-accent flex items-center gap-0.5">
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {recentProjects.map((p) => {
                    const isCompleted = p.aiStatus === "completed";
                    const imgSrc = (isCompleted && p.aiGeneratedImageURL) ? p.aiGeneratedImageURL : p.uploadedImageURL;
                    return (
                      <Link key={p.id} to={`/project/${p.id}`} className="group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border relative">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={p.projectName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {!isCompleted && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{p.projectName || p.roomType || "Project"}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {recentProjects.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No renovations yet — your first one is free!</p>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/projects">
                <Button variant="outline" className="w-full gap-2 text-sm">
                  <FolderOpen className="h-4 w-4" /> My Projects
                </Button>
              </Link>
              <Link to="/subscription">
                <Button variant="outline" className="w-full gap-2 text-sm">
                  <Crown className="h-4 w-4" /> {usage?.isPro ? "Manage Plan" : "Go Pro"}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ── Marketing page (logged-out) ───────────────────────────────────────────────

function MarketingPage() {
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);

  const handleCheckout = async (planId: "monthly" | "annual") => {
    navigate("/login");
    // After login they'll be redirected to onboarding; pricing is shown there
    // We can't start checkout without auth, so send them to sign up first
    void planId;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login"><Button size="sm" className="bg-budget-accent hover:bg-budget-accent/90">Try free</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
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
          <Link to="/login" className="w-full max-w-xs">
            <Button size="lg" className="bg-budget-accent hover:bg-budget-accent/90 gap-2 w-full text-base h-12">
              <Sparkles className="h-4 w-4" /> Start My Free Renovation
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground">2 free renovations · No card required</span>
        </div>
      </section>

      {/* Before/After Demo */}
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

      {/* Social proof strip */}
      <section className="bg-muted/40 border-y border-border/50 py-4 mb-10">
        <div className="max-w-2xl mx-auto px-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> No tradie required</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> Results in 60 seconds</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> 2 free tries, no card</span>
        </div>
      </section>

      {/* How it works */}
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

      {/* Features */}
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

      {/* Reviews */}
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

      {/* Pricing */}
      <section className="max-w-2xl mx-auto px-5 mb-12">
        <h2 className="text-xl font-bold text-center mb-2">Simple pricing</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Start free. Upgrade when you're ready.</p>
        <div className="space-y-3">
          {/* Annual */}
          <div className="relative rounded-2xl border-2 border-budget-accent bg-budget-accent/5 p-5">
            <div className="absolute -top-3 left-4">
              <Badge className="bg-budget-accent text-white border-0 gap-1 text-xs">
                <Star className="h-3 w-3 fill-white" /> Most popular · 7-day free trial
              </Badge>
            </div>
            <div className="flex items-start justify-between mt-1">
              <div><p className="font-bold text-base">Annual</p><p className="text-xs text-muted-foreground">$4.17/mo, billed yearly</p></div>
              <div className="text-right"><p className="text-2xl font-bold">$49.99</p><p className="text-xs text-muted-foreground line-through">$119.88</p></div>
            </div>
            <ul className="mt-4 space-y-1.5 mb-4">
              {[...planFeatures, "7-day free trial — no charge upfront", "Save 58% vs monthly"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3.5 w-3.5 text-budget-accent shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full bg-budget-accent hover:bg-budget-accent/90" onClick={() => handleCheckout("annual")}>
              {checkoutLoading === "annual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Free Trial"}
            </Button>
          </div>
          {/* Monthly */}
          <div className="rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-4">
              <div><p className="font-bold text-base">Monthly</p><p className="text-xs text-muted-foreground">Cancel any time</p></div>
              <div className="text-right"><p className="text-2xl font-bold">$9.99</p><p className="text-xs text-muted-foreground">/month</p></div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {planFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" onClick={() => handleCheckout("monthly")}>
              {checkoutLoading === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Monthly"}
            </Button>
          </div>
          <div className="rounded-xl bg-muted/40 border p-4 text-center">
            <p className="text-sm font-medium mb-1">Just browsing?</p>
            <p className="text-xs text-muted-foreground mb-3">Get 2 free renovations — no card needed.</p>
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-1">Try 2 free renovations <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-budget-accent px-5 py-12 text-center text-white">
        <Zap className="h-8 w-8 fill-white mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-extrabold mb-2">Ready to see your renovation?</h2>
        <p className="text-white/80 text-sm mb-6 max-w-xs mx-auto">Join thousands of homeowners visualising their dream space before spending a cent.</p>
        <Link to="/login">
          <Button size="lg" className="bg-white text-budget-accent hover:bg-white/90 gap-2 font-semibold">
            <Sparkles className="h-4 w-4" /> Start My Free Renovation
          </Button>
        </Link>
        <p className="text-white/60 text-xs mt-3">2 free renovations · No card required</p>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t px-5 py-6 text-center">
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

// ── Root export — switches based on auth ──────────────────────────────────────

export default function LandingPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return currentUser ? <LoggedInDashboard /> : <MarketingPage />;
}
