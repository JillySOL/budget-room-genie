import { lazy, Suspense } from "react";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Import refactored components
import HeroSection from "@/components/home/HeroSection";
import BeforeAfterSection from "@/components/home/BeforeAfterSection";
import ActionCards from "@/components/home/ActionCards";
import HomeTabs from "@/components/home/TabsContent";
import QuickWinsSection from "@/components/home/QuickWinsSection";

const Index = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-4 flex justify-between items-center">
          <Logo size="md" />
          <Link to="/onboarding">
            <Button variant="ghost" size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
        
        {/* Hero Section */}
        <HeroSection />
        
        {/* Before/After Preview */}
        <BeforeAfterSection />
        
        {/* Main action cards */}
        <ActionCards />
        
        {/* Tabs Navigation */}
        <HomeTabs />
        
        {/* Quick Wins Section */}
        <QuickWinsSection />
      </div>
    </PageContainer>
  );
};

export default Index;
