
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bg?: "white" | "green" | "none";
}

const PageContainer = ({ 
  children, 
  className = "",
  bg = "green"
}: PageContainerProps) => {
  const getBgColor = () => {
    switch(bg) {
      case "white": return "bg-white";
      case "green": return "bg-budget-green-bg";
      case "none": return "";
      default: return "bg-budget-green-bg";
    }
  };

  return (
    <div className={`mobile-container ${getBgColor()} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
