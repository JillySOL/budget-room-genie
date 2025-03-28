
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2, Image, Lightbulb, Loader2 } from "lucide-react";

interface AIImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const AIImageGenerator = ({ onImageGenerated }: AIImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Placeholder prompts to inspire users
  const examplePrompts = [
    "Modern living room with light grey walls, wooden floors, and green plants",
    "Coastal style kitchen with white cabinets, wooden countertops, and blue accents",
    "Scandinavian bedroom with minimalist furniture, neutral colors, and natural light"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description first");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Placeholder for API integration with OpenAI/ChatGPT
      // In a real implementation, this would call your backend
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demonstration, we'll use a placeholder image
      const demoImage = "https://images.unsplash.com/photo-1615529328331-f8917597711f";
      setGeneratedImage(demoImage);
      
      if (onImageGenerated) {
        onImageGenerated(demoImage);
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error("Image generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const useExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium">
          Describe your dream room
        </label>
        <Textarea
          id="prompt"
          placeholder="e.g., Bright living room with coastal colors, white sofa, wooden coffee table, and blue accent pillows"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-24"
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center">
          <Lightbulb className="h-3 w-3 mr-1" />
          Try one of these:
        </p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((examplePrompt, index) => (
            <Button 
              key={index} 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => useExamplePrompt(examplePrompt)}
            >
              {examplePrompt.slice(0, 20)}...
            </Button>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleGenerate} 
        className="w-full gap-2" 
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generate Room Design
          </>
        )}
      </Button>

      {generatedImage && (
        <Card>
          <CardContent className="p-2">
            <div className="relative pb-[56.25%] rounded-md overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Generated room design" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between mt-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Image className="h-4 w-4" />
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIImageGenerator;
