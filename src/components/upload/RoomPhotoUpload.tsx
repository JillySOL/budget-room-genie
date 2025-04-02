import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RoomPhotoUploadProps {
  // Remove onUploadComplete as navigation happens internally
  // onUploadComplete: (imageUrl: string) => void;
}

// Remove onUploadComplete from props
export function RoomPhotoUpload({ }: RoomPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Add state for the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Add state for upload success
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get userId along with getToken
  const { userId, getToken } = useAuth();
  // Initialize navigate
  const navigate = useNavigate();

  // Validate API endpoint
  const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
  if (!apiEndpoint) {
    console.error('API endpoint is not configured');
    setError('API endpoint is not configured. Please check your environment variables.');
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload Your Room Photo</CardTitle>
          <CardDescription>
            Take a photo of the room you want to transform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            Configuration error: API endpoint is not set
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setUploadSuccess(false);
    setIsUploading(false);
    setUploadProgress(0);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      toast.error('File must be an image');
      return;
    }

    // Store the file and create preview URL
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // **Do not upload immediately**
    // await handleUpload(file);

    // Clean up input value to allow selecting the same file again
    event.target.value = '';
  };

  // Rename to handleConfirmAndUpload, takes no file argument
  const handleConfirmAndUpload = async () => {
    if (!selectedFile) {
      setError("No file selected for upload.");
      toast.error("No file selected for upload.");
      return;
    }
    if (!userId) {
      setError("User not authenticated.");
      toast.error("User not authenticated.");
      return; // Should not happen if component is rendered correctly
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadSuccess(false);
    const file = selectedFile; // Use the file from state

    try {
      // Get the JWT token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Get pre-signed URL from API Gateway
      console.log('Requesting pre-signed URL...');
      const response = await fetch(`${apiEndpoint}/generate-upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          userId: userId, // Include userId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get upload URL:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          endpoint: `${apiEndpoint}/generate-upload-url`,
          requestHeaders: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer [redacted]'
          }
        });
        throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!responseData.uploadUrl || !responseData.key) {
        console.error('Invalid response format:', responseData);
        throw new Error('Server returned invalid response format');
      }

      const { uploadUrl, key } = responseData;
      console.log('Got pre-signed URL:', { uploadUrl, key });

      // Step 2: Upload file using pre-signed URL with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        });

        xhr.addEventListener('load', () => {
          console.log('Upload response:', { status: xhr.status, statusText: xhr.statusText });
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', (error) => {
          console.error('Upload error:', error);
          reject(new Error('Network error during upload'));
        });

        console.log('Starting upload to:', uploadUrl);
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Upload successful!
      setUploadSuccess(true);
      toast.success("Photo uploaded successfully!");

      // **Remove Step 3 (Start Generation) and Step 4 (Polling)**

      // Navigate to the next step after a short delay
      setTimeout(() => {
        // Update navigation target to /onboarding
        navigate('/onboarding');
      }, 1000); // 1 second delay to show success message

    } catch (err: any) {
      console.error('Upload process failed:', err);
      setError(err.message || 'An unknown error occurred during upload.');
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Don't reset preview on error, allow user to retry or retake
    }
  };

  // Function to clear the preview and selected file
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
  };

  // Trigger hidden file input click
  const triggerCameraInput = () => cameraInputRef.current?.click();
  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Render different content based on previewUrl state */}
      {!previewUrl ? (
        <>
          {/* Initial Upload Step */}
          <CardHeader>
            <CardTitle>Upload Your Room Photo</CardTitle>
            <CardDescription>
              Take a photo or upload an image of the room you want to transform. Max 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Buttons */}
            <Button onClick={triggerCameraInput} className="w-full" variant="outline">
              <Camera className="mr-2 h-4 w-4" /> Take Photo
            </Button>
            <Button onClick={triggerFileInput} className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Upload from Device
            </Button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </CardContent>
        </>
      ) : (
        <>
          {/* Preview Step */}
          <CardHeader>
            <CardTitle>Preview Your Photo</CardTitle>
            <CardDescription>
              Make sure your room is clearly visible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden border">
              <img
                src={previewUrl}
                alt="Room preview"
                className="absolute inset-0 w-full h-full object-contain" // Use object-contain for preview
              />
              {/* Loading/Progress Indicator */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Uploading... {uploadProgress}%</p>
                </div>
              )}
              {/* Success Indicator */}
              {uploadSuccess && (
                 <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center text-white space-y-2">
                   <CheckCircle className="h-8 w-8" />
                   <p>Upload Complete!</p>
                 </div>
               )}
            </div>

            {/* Buttons: Retake and Continue */}
            <div className="flex gap-4">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1"
                disabled={isUploading || uploadSuccess} // Disable if uploading or success
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirmAndUpload}
                className="flex-1 bg-green-600 hover:bg-green-700" // Match screenshot style
                disabled={isUploading || uploadSuccess} // Disable if uploading or success
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
            {error && !isUploading && <p className="text-sm text-red-500 text-center">{error}</p>}
          </CardContent>
        </>
      )}
    </Card>
  );
} 