import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import Logo from "@/components/ui-custom/Logo";

const NewProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Room Photo</CardTitle>
                <CardDescription>
                  Take a photo of the room you want to transform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-2"
                    onClick={() => document.getElementById('camera')?.click()}
                  >
                    <Camera className="h-6 w-6" />
                    <span>Take Photo</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-32 flex flex-col gap-2"
                    onClick={() => document.getElementById('upload')?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span>Upload Photo</span>
                  </Button>
                  <input
                    id="camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <input
                    id="upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview Your Photo</CardTitle>
                <CardDescription>
                  Make sure your room is clearly visible
                </CardDescription>
              </CardHeader>
              <CardContent>
                {image && (
                  <div className="space-y-4">
                    <img
                      src={image}
                      alt="Room preview"
                      className="w-full rounded-lg"
                    />
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handleBack}>
                        Retake
                      </Button>
                      <Button onClick={() => navigate('/onboarding')}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo size="sm" />
          <div className="w-8"></div>
        </div>

        {renderStep()}
      </div>
    </PageContainer>
  );
};

export default NewProject; 