
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bg?: "white" | "beige" | "green" | "none";
}

const PageContainer = ({ 
  children, 
  className = "",
  bg = "beige"
}: PageContainerProps) => {
  const getBgColor = () => {
    switch(bg) {
      case "white": return "bg-white";
      case "beige": return "bg-budget-light";
      case "green": return "bg-budget-green-bg";
      case "none": return "";
      default: return "bg-budget-light";
    }
  };

  return (
    <div className={`mobile-container pb-20 ${getBgColor()} ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
