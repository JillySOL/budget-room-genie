
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, Sparkles, PlusCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Badge from "@/components/ui-custom/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import { IMAGES } from "@/constants/images";

// Lazy load components that are not immediately visible
const RoomSelector = lazy(() => import("@/components/home/RoomSelector"));
const BeforeAfterPreview = lazy(() => import("@/components/home/BeforeAfterPreview"));

// Room type data
const ROOM_TYPES = [
  {
    name: "Bedroom",
    image: "/lovable-uploads/ff66ab71-8056-4e11-8f9c-5ca7bcd63501.png",
    link: "/new-project?room=bedroom",
    valueIncrease: "$12,000+"
  },
  {
    name: "Living Room",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/new-project?room=living-room",
    valueIncrease: "$15,000+"
  },
  {
    name: "Kitchen",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/new-project?room=kitchen",
    valueIncrease: "$20,000+"
  },
  {
    name: "Bathroom",
    image: "/after.png",
    link: "/new-project?room=bathroom",
    valueIncrease: "$18,000+"
  }
];

const QUICK_WINS = [
  {
    title: "Paint Refresh",
    description: "Simple color changes can transform any room",
    image: "/after.png",
    valueIncrease: "$5,000+"
  },
  {
    title: "Lighting Update",
    description: "Modern fixtures for an instant upgrade",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    valueIncrease: "$3,000+"
  },
  {
    title: "Hardware Swap",
    description: "Replace cabinet handles and doorknobs",
    image: "/lovable-uploads/ff66ab71-8056-4e11-8f9c-5ca7bcd63501.png",
    valueIncrease: "$2,000+"
  }
];

const Index = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-4 flex justify-between items-center">
          <Logo size="md" />
          <Link to="/new-project">
            <Button variant="ghost" size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
        
        {/* Hero Section - Updated with improved spacing and typography */}
        <div className="relative bg-gradient-to-r from-budget-light to-budget-light/50 rounded-xl p-6 mb-4">
          <h1 className="text-2xl font-bold mb-2 text-budget-dark">
            Transform your home with<br />AI-powered design
          </h1>
          <p className="mb-6 text-budget-dark/70 text-sm max-w-xs font-light leading-relaxed">
            Create stunning before & after transformations that add real value to your property
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <Link to="/new-project">
              <Button size="lg" className="gap-1 shadow-sm relative overflow-hidden group">
                <span className="relative z-10">Start Your Project</span>
                <ChevronRight className="h-4 w-4 relative z-10" />
                <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              </Button>
            </Link>
            <Badge 
              variant="success" 
              className="animate-pulse mt-2 sm:mt-0 shadow-sm"
              style={{ fontSize: '0.7rem' }}
            >
              <span>💰</span> +$18,000 Value
            </Badge>
          </div>
          
          <div className="pt-2 pb-1">
            <p className="text-xs text-budget-dark/70 mb-2">
              Join 10,000+ homeowners who transformed their spaces
            </p>
          </div>
        </div>
        
        {/* Before/After Preview - Enhanced with swipe hints and better labels */}
        <div className="mb-6">
          <h2 className="font-medium text-budget-dark mb-3 flex items-center">
            See the transformation
            <span className="ml-2 text-xs bg-budget-accent/10 text-budget-accent px-2 py-0.5 rounded-full">Swipe to compare</span>
          </h2>
          <div className="rounded-xl overflow-hidden shadow-sm relative">
            <EnhancedBeforeAfter
              beforeImage={IMAGES.BEFORE}
              afterImage={IMAGES.AFTER}
            />
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">Before</div>
            <div className="absolute top-3 right-3 bg-budget-accent/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">After</div>
          </div>
        </div>
        
        {/* Main action cards - improved with consistent sizing and spacing */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/new-project" className="block">
            <div className="bg-gray-100 rounded-xl aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                <PlusCircle className="h-6 w-6 text-budget-accent transition-transform hover:scale-110 duration-200" />
              </div>
              <span className="text-sm font-medium text-center">Add Room or Plan</span>
              <span className="text-xs text-budget-dark/70 mt-1">(2 steps)</span>
            </div>
          </Link>
          
          <Link to="/new-project" className="block">
            <div className="bg-gray-100 rounded-xl aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Sparkles className="h-6 w-6 text-budget-accent transition-transform hover:scale-110 duration-200" />
              </div>
              <span className="text-sm font-medium text-center">Design with AI</span>
              <span className="text-xs text-budget-dark/70 mt-1">(AI-generated)</span>
            </div>
          </Link>
        </div>
        
        {/* Tabs Navigation - Improved contrast and visual cues */}
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="w-full grid grid-cols-2 p-0.5 rounded-lg">
            <TabsTrigger value="rooms" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium">My Rooms</TabsTrigger>
            <TabsTrigger value="photos" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium">My Photos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rooms" className="mt-4">
            <div className="space-y-6">
              {/* Recently active project */}
              <Link to="/project/bathroom-refresh" className="block">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      <img src="/after.png" alt="Bathroom" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 mb-3">
                        <h3 className="font-medium text-budget-dark text-lg">Bathroom Renovation</h3>
                        <Badge variant="success" style={{ fontSize: '0.7rem' }}>
                          <span>💰</span> +$18,000 Value
                        </Badge>
                      </div>
                      <Progress value={100} className="h-3 rounded-full bg-gray-100" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0 ml-2" />
                  </div>
                </div>
              </Link>
              
              {/* Room category cards - Improved spacing and tile uniformity */}
              <div className="grid grid-cols-2 gap-3">
                {ROOM_TYPES.map((room, i) => (
                  <Link key={i} to={room.link} className="block">
                    <div className="relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md transition-all">
                      <img 
                        src={room.image} 
                        alt={room.name} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">Add {room.name}</span>
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                            <PlusCircle className="h-5 w-5 text-budget-accent hover:scale-110 transition-transform duration-200" />
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs text-white/90 flex items-center gap-1">
                            <span className="bg-green-600/20 rounded-full px-1.5 py-0.5 flex items-center">
                              <span className="mr-1">↗️</span> Avg. value: {room.valueIncrease}
                            </span>
                          </span>
                        </div>
                      </div>
                      <Link to={`/examples?room=${room.name.toLowerCase()}`} className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-budget-dark font-medium shadow-sm">
                        See Example
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="mt-4">
            <div className="flex justify-center items-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500">No photos yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Upload Photos
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Quick Wins Section - Improved with value visualization */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-budget-dark">Easy Wins</h2>
            <span className="text-xs text-budget-dark/70">Small DIY changes, big results</span>
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-4 px-4">
            {QUICK_WINS.map((win, i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[240px] flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    <img src={win.image} alt={win.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-medium text-budget-dark">{win.title}</h3>
                    <p className="text-xs text-budget-dark/70">{win.description}</p>
                    <div className="mt-1">
                      <span className="text-xs flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        {win.valueIncrease} value
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Trust Building Element */}
          <div className="mt-6 bg-budget-light rounded-lg p-4 border border-gray-100">
            <div className="text-center">
              <p className="text-xs font-medium text-budget-dark/70 mb-2">FEATURED IN</p>
              <div className="flex justify-center items-center gap-6">
                <div className="text-budget-dark/50 font-semibold text-sm">Home & Design</div>
                <div className="text-budget-dark/50 font-semibold text-sm">RenovateDaily</div>
                <div className="text-budget-dark/50 font-semibold text-sm">DIY Network</div>
              </div>
            </div>
          </div>
          
          {/* Real-time Stats */}
          <div className="mt-4 bg-budget-accent/10 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-budget-accent">50 rooms transformed this week</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;
