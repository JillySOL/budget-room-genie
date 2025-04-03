import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, X, CheckCircle, AlertTriangle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
// Import the hook for fetching user photos
import { useFetchUserPhotos } from "@/hooks/useFetchUserPhotos";

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
  const [isConfigValid, setIsConfigValid] = useState(true);
  // Add state to control gallery visibility
  const [showGallery, setShowGallery] = useState(false);
  // Add state to track selected S3 key when choosing existing photo
  const [selectedPhotoKey, setSelectedPhotoKey] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get userId along with getToken
  const { userId, getToken } = useAuth();
  // Initialize navigate
  const navigate = useNavigate();
  // Fetch user photos using the hook
  const { photos, isLoading: isLoadingPhotos, error: photoError } = useFetchUserPhotos();

  // Validate environment configuration on mount
  useEffect(() => {
    const requiredEnvVars = {
      'API Endpoint': import.meta.env.VITE_API_ENDPOINT,
      'Clerk Key': import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      setIsConfigValid(false);
      setError(`Missing configuration: ${missingVars.join(', ')}`);
    }
  }, []);

  // If configuration is invalid, show error state
  if (!isConfigValid) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Configuration Error
          </CardTitle>
          <CardDescription>
            The application is not properly configured. Please contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
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
    setSelectedPhotoKey(null);
    setShowGallery(false);

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

  // Handle selecting a photo from the gallery
  const handleSelectExistingPhoto = (photo: { key: string, url: string }) => {
    // Reset file-related states
    setSelectedFile(null);
    setUploadSuccess(false);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    
    // Set the preview URL to the photo URL
    setPreviewUrl(photo.url);
    // Store the S3 key of the selected photo
    setSelectedPhotoKey(photo.key);
    // Hide the gallery after selection
    setShowGallery(false);
  };

  // Rename to handleConfirmAndUpload, takes no file argument
  const handleConfirmAndUpload = async () => {
    // If we're using an existing photo, we don't need to upload
    if (selectedPhotoKey) {
      toast.success("Using existing photo!");
      // Navigate to the next step
      navigate('/onboarding', { 
        state: { 
          photoKey: selectedPhotoKey 
        } 
      });
      return;
    }

    // Otherwise, handle uploading a new file
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
      const token = await getToken({ template: "RenoMateBackendAPI" });
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Get pre-signed URL from API Gateway
      console.log('Requesting pre-signed URL...');
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/generate-upload-url`, {
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
          endpoint: `${import.meta.env.VITE_API_ENDPOINT}/generate-upload-url`,
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
        // Update navigation target to /onboarding, passing the uploaded photo key
        navigate('/onboarding', { 
          state: { 
            photoKey: responseData.key 
          } 
        });
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
    setSelectedPhotoKey(null);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
  };

  // Toggle gallery visibility
  const toggleGallery = () => {
    setShowGallery(prev => !prev);
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
            {/* New button to show gallery */}
            <Button onClick={toggleGallery} className="w-full" variant="outline">
              <ImageIcon className="mr-2 h-4 w-4" /> Choose from your photos
            </Button>
            
            {/* Display gallery when showGallery is true */}
            {showGallery && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Your Photos</h3>
                {isLoadingPhotos ? (
                  <div className="flex justify-center items-center h-32 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading photos...
                  </div>
                ) : photoError ? (
                  <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-1" /> {photoError}
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    <p>You haven't uploaded any photos yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div 
                        key={photo.key} 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleSelectExistingPhoto(photo)}
                      >
                        <img
                          src={photo.url}
                          alt="User uploaded room photo"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.src = '/placeholder-image.svg')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
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
                {selectedPhotoKey ? 'Change Photo' : 'Retake'}
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