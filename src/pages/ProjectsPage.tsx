
import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectCard from "@/components/ui-custom/ProjectCard";
import { Link } from "react-router-dom";

const ProjectsPage = () => {
  // Placeholder projects data
  const [projects] = useState([
    {
      id: "1",
      name: "Living Room Refresh",
      room: "Living Room",
      thumbnail: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb3",
      flipsUsed: 1,
      flipsTotal: 3,
    },
    {
      id: "2",
      name: "Kitchen Makeover",
      room: "Kitchen",
      thumbnail: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77",
      flipsUsed: 3,
      flipsTotal: 3,
    },
  ]);

  return (
    <PageContainer>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Link to="/new-project">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted rounded-full p-4 mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start by creating your first room transformation
          </p>
          <Link to="/new-project">
            <Button>Create Project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ProjectsPage;
