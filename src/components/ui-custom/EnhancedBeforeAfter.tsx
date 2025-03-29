import ReactCompareImage from "react-compare-image";

interface EnhancedBeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

const EnhancedBeforeAfter = ({
  beforeImage,
  afterImage,
  className = "",
}: EnhancedBeforeAfterProps) => {
  return (
    <div className={`w-full rounded-lg overflow-hidden ${className}`}>
      <ReactCompareImage
        leftImage={beforeImage}
        rightImage={afterImage}
        leftImageLabel="Before"
        rightImageLabel="After"
        sliderLineWidth={2}
        handleSize={40}
        hover
        sliderPositionPercentage={0.5}
      />
    </div>
  );
};

export default EnhancedBeforeAfter; 