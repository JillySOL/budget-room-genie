
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/ui-custom/Logo";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Kitchen", "Bathroom", "Bedroom", "Living"];

const ExplorePage = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Explore</h1>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="What do you need?" className="pl-9 bg-white" />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(category => (
            <div 
              key={category}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium whitespace-nowrap"
            >
              {category}
            </div>
          ))}
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">Budget-Friendly Bathroom Refresh</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              +$18,000 Value
            </span>
          </div>

          <p className="text-budget-dark/70 mb-4">
            See how we transformed this bathroom for under $450
          </p>

          <Link to="/project/bathroom-refresh" className="block">
            <EnhancedBeforeAfter
              beforeImage={IMAGES.BEFORE}
              afterImage={IMAGES.AFTER}
              className="mb-6 hover:opacity-95 transition-opacity rounded-xl overflow-hidden"
            />
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">Kitchen Cabinet Makeover</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              +$12,000 Value
            </span>
          </div>

          <p className="text-budget-dark/70 mb-4">
            Transform old cabinets with paint and new hardware
          </p>

          <Link to="/project/kitchen-makeover" className="block">
            <EnhancedBeforeAfter
              beforeImage={IMAGES.BEFORE}
              afterImage={IMAGES.AFTER}
              className="mb-6 hover:opacity-95 transition-opacity rounded-xl overflow-hidden"
            />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default ExplorePage;
