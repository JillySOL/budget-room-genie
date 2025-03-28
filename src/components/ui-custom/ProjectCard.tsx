
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  room: string;
  thumbnail: string;
  flipsUsed: number;
  flipsTotal: number;
  isPro?: boolean;
}

const ProjectCard = ({
  id,
  name,
  room,
  thumbnail,
  flipsUsed,
  flipsTotal,
  isPro = false,
}: ProjectCardProps) => {
  const isLimited = !isPro && flipsUsed >= flipsTotal;
  
  return (
    <Link to={`/project/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="relative h-40">
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 rounded-full bg-white px-2 py-1 text-xs font-medium shadow-sm">
            {room}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium truncate">{name}</h3>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {flipsUsed} of {isPro ? "∞" : flipsTotal} flips used
              </span>
              {isLimited && (
                <span className="text-budget-accent font-medium">Upgrade for more</span>
              )}
            </div>
            <Progress
              value={(flipsUsed / flipsTotal) * 100}
              max={100}
              className="h-1"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
