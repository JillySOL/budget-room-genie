import React from "react";
import RoomTypeCard from "./RoomTypeCard";

// Room type data
const ROOM_TYPES = [
  {
    name: "Bedroom",
    image: "/lovable-uploads/ff66ab71-8056-4e11-8f9c-5ca7bcd63501.png",
    link: "/onboarding?room=bedroom",
    valueIncrease: "$12,000+"
  },
  {
    name: "Living Room",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/onboarding?room=living-room",
    valueIncrease: "$15,000+"
  },
  {
    name: "Kitchen",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    link: "/onboarding?room=kitchen",
    valueIncrease: "$20,000+"
  },
  {
    name: "Bathroom",
    image: "/after.png",
    link: "/onboarding?room=bathroom",
    valueIncrease: "$18,000+"
  }
];

const RoomTypesSection = () => {
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-3 min-w-full">
        {ROOM_TYPES.map((room, i) => (
          <RoomTypeCard
            key={i}
            name={room.name}
            image={room.image}
            link={room.link}
            valueIncrease={room.valueIncrease}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomTypesSection;
