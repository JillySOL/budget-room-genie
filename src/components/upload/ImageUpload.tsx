import { useState, useRef } from 'react';
import { useAuth } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);

    // Upload file
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Get the JWT token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Get pre-signed URL from API Gateway
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await response.json();

      // Step 2: Upload file using pre-signed URL
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Start the generation process
      const startResponse = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/start-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          key,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start generation');
      }

      const { jobId } = await startResponse.json();

      // Step 4: Poll for completion
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}/generation-status/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error('Failed to get status');
        }

        const { status, resultUrl } = await statusResponse.json();

        if (status === 'COMPLETE') {
          clearInterval(pollInterval);
          onUploadComplete(resultUrl);
          toast.success('Image uploaded and processed successfully');
        } else if (status === 'FAILED') {
          clearInterval(pollInterval);
          throw new Error('Generation failed');
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Room Image</CardTitle>
        <CardDescription>
          Upload a photo of your room to start the redesign process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            type="button"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Select Image'}
          </Button>
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 