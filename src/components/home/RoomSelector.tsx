import { PaintBucket, Hammer, Bath } from "lucide-react";
import { Link } from "react-router-dom";

interface RoomOption {
  icon: JSX.Element;
  name: string;
}

const ROOM_OPTIONS: RoomOption[] = [
  {
    icon: <PaintBucket className="h-6 w-6" />,
    name: "Living Room"
  },
  {
    icon: <Hammer className="h-6 w-6" />,
    name: "Kitchen"
  },
  {
    icon: <Bath className="h-6 w-6" />,
    name: "Bathroom"
  },
];

export const RoomSelector = () => {
  return (
    <div>
      <h2 className="text-sm font-medium mb-4 text-budget-dark">What room do you want to flip?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROOM_OPTIONS.map((room) => (
          <Link 
            to="/new-project" 
            key={room.name} 
            className="flex flex-col items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-budget-yellow/20 flex items-center justify-center mb-4">
              {room.icon}
            </div>
            <span className="text-sm font-medium text-budget-dark">{room.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector; 