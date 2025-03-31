
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, Sparkles, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Badge from "@/components/ui-custom/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load components that are not immediately visible
const RoomSelector = lazy(() => import("@/components/home/RoomSelector"));
const BeforeAfterPreview = lazy(() => import("@/components/home/BeforeAfterPreview"));

// Room type data
const ROOM_TYPES = [
  {
    name: "Bedroom",
    image: "/lovable-uploads/ff66ab71-8056-4e11-8f9c-5ca7bcd63501.png",
    link: "/new-project?room=bedroom"
  },
  {
    name: "Living Room",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/new-project?room=living-room"
  },
  {
    name: "Kitchen",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/new-project?room=kitchen"
  },
  {
    name: "Bathroom",
    image: "/after.png",
    link: "/new-project?room=bathroom"
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
        
        {/* Main action cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/new-project" className="block">
            <div className="bg-gray-100 rounded-xl aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3">
                <PlusCircle className="h-6 w-6 text-budget-accent" />
              </div>
              <span className="text-sm font-medium text-center">Add Room or Plan</span>
            </div>
          </Link>
          
          <Link to="/new-project" className="block">
            <div className="bg-gray-100 rounded-xl aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-budget-accent" />
              </div>
              <span className="text-sm font-medium text-center">Design with AI</span>
            </div>
          </Link>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="rooms" className="text-base">My Rooms</TabsTrigger>
            <TabsTrigger value="photos" className="text-base">My Photos</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Room Grid */}
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
                    <Badge variant="success">
                      <span>💰</span> +$18,000 Value
                    </Badge>
                  </div>
                  <Progress value={100} className="h-3 rounded-full bg-gray-100" />
                </div>
                <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0" />
              </div>
            </div>
          </Link>
          
          {/* Room category cards */}
          <div className="grid grid-cols-2 gap-3">
            {ROOM_TYPES.map((room, i) => (
              <Link key={i} to={room.link} className="block">
                <div className="relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md transition-all">
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Add {room.name}</span>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <PlusCircle className="h-5 w-5 text-budget-accent" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;
