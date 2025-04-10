import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeIcon, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomProject from "./RoomProject";
import RoomTypesSection from "./RoomTypesSection";
import { Link } from "react-router-dom";

const HomeTabs = () => {
  return (
    <Tabs defaultValue="rooms" className="w-full">
      <TabsList className="w-full grid grid-cols-2 p-0.5 rounded-lg">
        <TabsTrigger value="rooms" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <HomeIcon className="h-4 w-4" /> My Rooms
        </TabsTrigger>
        <TabsTrigger value="photos" className="text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium flex items-center justify-center gap-1.5">
          <Image className="h-4 w-4" /> My Photos
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="rooms" className="mt-4">
        <div className="space-y-6">
          {/* Recently active project - Updated with subtle progress bar */}
          <RoomProject
            title="Bathroom Renovation"
            image="/after.png"
            value="+$18,000 Value"
            roi="ROI: 360%"
            progress={100}
            link="/project/bathroom-refresh"
          />
          
          {/* Room category cards */}
          <RoomTypesSection />
        </div>
      </TabsContent>
      
      <TabsContent value="photos" className="mt-4">
        <div className="flex justify-center items-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">No photos yet</p>
            <Link to="/onboarding">
              <Button variant="outline" size="sm" className="mt-2">
                Upload Photos
              </Button>
            </Link>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default HomeTabs;
