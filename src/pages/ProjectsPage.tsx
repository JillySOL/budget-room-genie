import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import { Button } from "@/components/ui/button";

const ProjectsPage = () => {
  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Projects</h1>
          <Link to="/explore">
            <Button>Start New Project</Button>
          </Link>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">Budget-Friendly Bathroom Refresh</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full">
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
              className="mb-6 hover:opacity-95 transition-opacity"
            />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectsPage;
