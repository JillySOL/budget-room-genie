
import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

const ImageUploader = ({ onImageSelect }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      onImageSelect(file);
      const reader = new FileReader();
      
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
      
      {!preview ? (
        <div 
          onClick={triggerFileInput}
          className="border-2 border-dashed border-muted rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-muted-foreground">Click to upload</p>
            <p className="text-sm text-muted-foreground/70">
              JPG, PNG, or WEBP (max. 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={preview} 
            alt="Room preview" 
            className="w-full h-64 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
