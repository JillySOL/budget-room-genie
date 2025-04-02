import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, Image } from "lucide-react";
import RoomProject from "./RoomProject";
import MyPhotosTab from "./MyPhotosTab";

const HomeTabs = () => {
  const { isSignedIn } = useAuth();

  return (
    <Tabs defaultValue="rooms" className="w-full">
      <TabsList className={`w-full grid ${isSignedIn ? 'grid-cols-2' : 'grid-cols-1'} p-0.5 rounded-lg`}>
        <TabsTrigger value="rooms" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <HomeIcon className="h-4 w-4" /> My Rooms
        </TabsTrigger>
        {isSignedIn && (
          <TabsTrigger value="photos" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
            <Image className="h-4 w-4" /> My Photos
          </TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="rooms" className="mt-4">
        <div className="space-y-6">
          <RoomProject
            title="Bathroom Renovation"
            image="/after.png"
            value="+$18,000 Value"
            roi="ROI: 360%"
            progress={100}
            link="/project/bathroom-refresh"
          />
        </div>
      </TabsContent>
      
      {isSignedIn && (
        <TabsContent value="photos" className="mt-4">
          <MyPhotosTab />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default HomeTabs;
