
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = "" }: PageContainerProps) => {
  return (
    <div className={`mobile-container ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
