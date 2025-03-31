
import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";

interface RoomTypeCardProps {
  name: string;
  image: string;
  link: string;
  valueIncrease: string;
}

const RoomTypeCard = ({ name, image, link, valueIncrease }: RoomTypeCardProps) => {
  return (
    <div className="min-w-[160px] w-[160px] flex-shrink-0">
      <Link to={link} className="block">
        <div className="relative rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md transition-all">
          <img 
            src={image} 
            alt={name} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
            <p className="text-white font-medium text-sm">Add {name}</p>
            <span className="text-xs text-white/90 bg-green-600/20 rounded-full px-1.5 py-0.5 mt-1 inline-block">
              Avg: {valueIncrease}
            </span>
          </div>
          <button className="absolute top-2 right-2 bg-budget-accent text-white text-xs rounded-full p-1.5 shadow-md">
            <PlusCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </Link>
    </div>
  );
};

export default RoomTypeCard;
