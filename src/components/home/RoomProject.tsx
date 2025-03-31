
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RoomProjectProps {
  title: string;
  image: string;
  value: string;
  roi: string;
  progress: number;
  link: string;
}

const RoomProject = ({ title, image, value, roi, progress, link }: RoomProjectProps) => {
  return (
    <Link to={link} className="block">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 mb-3">
              <h3 className="font-medium text-budget-dark text-lg">{title}</h3>
              <div className="flex items-center gap-1">
                <span className="text-budget-teal/90 text-xs font-semibold">{value}</span>
                <span className="text-budget-dark/40 text-xs">|</span>
                <span className="text-budget-dark/70 text-xs font-medium">{roi}</span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 rounded-full bg-gray-100" />
          </div>
          <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0 ml-2" />
        </div>
      </div>
    </Link>
  );
};

export default RoomProject;
