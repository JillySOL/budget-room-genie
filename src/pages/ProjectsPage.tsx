
import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, PlusCircle } from "lucide-react";

const ProjectsPage = () => {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">My Projects</h1>
          <Link to="/new-project">
            <Button variant="ghost" size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
            <TabsTrigger value="saved" className="text-sm">Saved</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Project Cards */}
        <div className="space-y-4">
          <Link to="/project/bathroom-refresh" className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
              <div className="relative h-40 w-full">
                <EnhancedBeforeAfter
                  beforeImage={IMAGES.BEFORE}
                  afterImage={IMAGES.AFTER}
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-budget-dark text-lg">Bathroom Renovation</h3>
                  <span className="bg-[#E6F4EA] text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    +$18,000 Value
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Progress value={100} className="h-2 rounded-full bg-gray-100" />
                    <span className="text-xs text-gray-500 mt-1 block">Completed</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-budget-neutral ml-4" />
                </div>
              </div>
            </div>
          </Link>
          
          <Link to="/new-project" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-3 py-6">
                <PlusCircle className="h-6 w-6 text-budget-accent" />
                <span className="font-medium text-budget-dark">Start New Project</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectsPage;
