import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";

/**
 * NanoBanana Pro Model Configuration
 * 
 * To enable Pro model (for testing):
 * 
 * Local Testing:
 * - Linux/Mac: export USE_NANOBANANA_PRO=true
 * - Windows: $env:USE_NANOBANANA_PRO="true"
 * - Or create .env file in functions/ directory: USE_NANOBANANA_PRO=true
 * 
 * Firebase Functions (Production):
 * - Via Firebase Console: Functions > Select function > Configuration > Environment variables
 * - Add: USE_NANOBANANA_PRO = true
 * - Or via CLI: firebase functions:config:set nanobanana.pro="true" (legacy)
 * 
 * To disable/revert: Remove the environment variable or set it to false/empty
 * 
 * Pro model differences:
 * - Endpoint: /api/v1/nanobanana/generate-pro (vs /api/v1/nanobanana/generate)
 * - Parameters: resolution (1K/2K/4K), aspectRatio (various ratios)
 * - Removed: numImages, type, image_size
 * 
 * Defaults when Pro is enabled:
 * - resolution: '2K'
 * - aspectRatio: '16:9'
 * 
 * Note: Response structure and polling logic remain the same for both APIs
 */

export async function getNanoBananaApiKey(): Promise<string> {
  // First, check if API key is provided as environment variable (for testing/fallback)
  if (process.env.NANOBANANA_API_KEY) {
    logger.info("Using NanoBanana API key from environment variable.");
    const apiKey = process.env.NANOBANANA_API_KEY.trim();
    logger.info(`API key length: ${apiKey.length} characters`);
    return apiKey;
  }

  logger.info("Initializing Secret Manager client for NanoBanana...");
  const secretClient = new SecretManagerServiceClient();
  
  // Use GOOGLE_CLOUD_PROJECT (automatically set in Cloud Functions) or fallback to project ID
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'renomate-1b214';
  const secretName = `projects/${projectId}/secrets/nanobanana-api-key/versions/latest`;
  
  logger.info(`Fetching secret: ${secretName}`);
  logger.info(`Project ID: ${projectId}`);
  
  try {
    const [version] = await secretClient.accessSecretVersion({ name: secretName });
    const apiKey = version.payload?.data?.toString();
    
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error("Secret exists but contains empty value");
    }
    
    logger.info("NanoBanana API key retrieved successfully from Secret Manager.");
    return apiKey.trim();
  } catch (error: any) {
    logger.error("Critical: Failed to retrieve NanoBanana API key from Secret Manager");
    logger.error("Error details:", {
      code: error?.code,
      message: error?.message,
      details: error?.details
    });
    
    let errorMessage = "Failed to retrieve NanoBanana API credentials.";
    if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
      errorMessage += ` Permission denied. Ensure the Cloud Function service account has 'Secret Manager Secret Accessor' role.`;
    } else if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
      errorMessage += ` Secret 'nanobanana-api-key' not found at path '${secretName}'. Verify the secret exists and has at least one enabled version.`;
    } else {
      errorMessage += ` Error: ${error?.message || 'Unknown error'}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Generates an edited image using NanoBanana API
 * 
 * API Documentation: 
 * - Regular: https://docs.nanobananaapi.ai/nanobanana-api/generate-or-edit-image
 * - Pro: https://docs.nanobananaapi.ai/nanobanana-api/generate-image-pro
 * 
 * @param apiKey NanoBanana API key (Bearer token)
 * @param prompt Editing instructions
 * @param imageUrl URL of the image to edit (must be publicly accessible)
 * @param options Optional configuration for Pro model (resolution, aspectRatio)
 * @returns Base64 encoded image data
 */
export async function generateImageWithNanoBanana(
  apiKey: string,
  prompt: string,
  imageUrl: string,
  options?: {
    resolution?: '1K' | '2K' | '4K';
    aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  }
): Promise<string> {
  try {
    const trimmedApiKey = apiKey.trim();
    
    const usePro = process.env.USE_NANOBANANA_PRO === 'true' || process.env.USE_NANOBANANA_PRO === '1';
    
    logger.info(`Generating image with NanoBanana API (${usePro ? 'Pro' : 'Regular'} mode)`);
    logger.info(`Prompt length: ${prompt.length} characters`);
    logger.info(`Image URL: ${imageUrl}`);
    logger.info(`API key length: ${trimmedApiKey.length} characters`);
    
    // Determine endpoint based on Pro mode
    const baseUrl = usePro 
      ? 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro'
      : 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate';
    
    logger.info(`Calling NanoBanana API: ${baseUrl}`);
    
    // Prepare request body - different format for Pro vs Regular
    let requestBody: any;
    
    if (usePro) {
      // Pro API format
      requestBody = {
        prompt: prompt,
        imageUrls: [imageUrl], // Array of input image URLs (up to 8)
        resolution: options?.resolution || '2K', // 1K, 2K, or 4K
        aspectRatio: options?.aspectRatio || '16:9', // Various aspect ratios
        callBackUrl: "https://example.com/callback" // Required but we'll poll instead
      };
      
      logger.info(`Request body (Pro):`, {
        promptLength: prompt.length,
        imageUrl: imageUrl,
        resolution: requestBody.resolution,
        aspectRatio: requestBody.aspectRatio
      });
    } else {
      // Regular API format
      requestBody = {
        prompt: prompt,
        numImages: 1,
        imageUrls: [imageUrl], // Array of input image URLs for image editing
        type: "IMAGETOIAMGE", // Note: API docs show typo "IMAGETOIAMGE" not "IMAGETOIMAGE"
        image_size: "16:9",
        callBackUrl: "https://example.com/callback" // Required but we'll poll instead
      };
      
      logger.info(`Request body (Regular):`, {
        promptLength: prompt.length,
        imageUrl: imageUrl,
        numImages: 1,
        type: "IMAGETOIAMGE",
        image_size: "16:9"
      });
    }
    
    // Make request with Bearer token authentication
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trimmedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    logger.info(`NanoBanana API response status: ${response.status}`);
    logger.info(`NanoBanana API response: ${responseText}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails: any = null;
      
      try {
        errorDetails = JSON.parse(responseText);
        errorMessage = errorDetails.msg || errorDetails.message || errorMessage;
        logger.error(`NanoBanana API error response: ${JSON.stringify(errorDetails, null, 2)}`);
      } catch (parseError) {
        logger.error(`Failed to parse error response: ${responseText}`);
      }
      
      if (response.status === 401) {
        throw new Error(`NanoBanana API Authentication failed (401). Check your API key. Error: ${errorMessage}`);
      }
      
      throw new Error(`NanoBanana API Error: ${errorMessage}`);
    }
    
    // Parse response - NanoBanana returns taskId
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      logger.info(`✅ Successfully parsed NanoBanana API response`);
      logger.info(`Response:`, JSON.stringify(responseData, null, 2));
    } catch (parseError: any) {
      logger.error(`❌ Failed to parse NanoBanana response as JSON`);
      throw new Error(`NanoBanana API returned invalid JSON. Status: ${response.status}, Response: ${responseText.substring(0, 200)}`);
    }
    
    // Check if we got a taskId
    if (responseData.code !== 200 || !responseData.data?.taskId) {
      logger.error(`❌ NanoBanana API response missing taskId`);
      logger.error(`Full response:`, JSON.stringify(responseData, null, 2));
      throw new Error(`NanoBanana API error: ${responseData.msg || 'Missing taskId'}`);
    }
    
    const taskId = responseData.data.taskId;
    logger.info(`✅ Task submitted successfully. Task ID: ${taskId}`);
    
    // Poll for task completion
    // Status endpoint: /api/v1/nanobanana/record-info?taskId={taskId}
    logger.info(`Polling for task completion...`);
    const maxAttempts = 60; // 60 attempts
    const pollInterval = 3000; // 3 seconds between polls
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      logger.info(`Polling attempt ${attempt}/${maxAttempts}...`);
      
      // Status endpoint from docs: /api/v1/nanobanana/record-info?taskId={taskId}
      const statusUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`;
      
      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${trimmedApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        const statusText = await statusResponse.text();
        
        if (!statusResponse.ok) {
          logger.warn(`Status check failed (attempt ${attempt}): ${statusResponse.status} - ${statusText}`);
          continue;
        }
        
        const statusData = JSON.parse(statusText);
        logger.info(`Task status response:`, JSON.stringify(statusData, null, 2));
        
        // Check task status
        // According to NanoBanana API callback response structure:
        // {
        //   "code": 200,
        //   "msg": "Image generated successfully.",
        //   "data": {
        //     "taskId": "...",
        //     "info": {
        //       "resultImageUrl": "https://..."  // Single URL
        //     }
        //   }
        // }
        // OR status endpoint might return:
        // {
        //   "code": 200,
        //   "data": {
        //     "response": ["https://..."],  // Array of URLs
        //     "status": 1
        //   }
        // }
        // Check task status
        // According to NanoBanana API record-info endpoint response structure:
        // {
        //   "code": 200,
        //   "msg": "success",
        //   "data": {
        //     "taskId": "...",
        //     "response": {
        //       "originImageUrl": "...",
        //       "resultImageUrl": "https://..."  // Generated image URL
        //     },
        //     "successFlag": 1,  // 1 = SUCCESS, 0 = GENERATING, 2 = CREATE_TASK_FAILED, 3 = GENERATE_FAILED
        //     ...
        //   }
        // }
        if (statusData.code === 200 && statusData.data) {
          const successFlag = statusData.data.successFlag;
          const resultImageUrl = statusData.data.response?.resultImageUrl;
          
          logger.info(`Task successFlag: ${successFlag} (1=SUCCESS, 0=GENERATING, 2=CREATE_TASK_FAILED, 3=GENERATE_FAILED)`);
          logger.info(`Result image URL: ${resultImageUrl || 'not available yet'}`);
          
          // Check if task is complete (successFlag === 1) and has image URL
          if (successFlag === 1 && resultImageUrl && resultImageUrl.trim().length > 0) {
            logger.info(`✅ Task completed successfully! Image URL: ${resultImageUrl}`);
            
            // Download the generated image and convert to base64
            try {
              logger.info(`Attempting to download image from: ${resultImageUrl}`);
              const imageResponse = await fetch(resultImageUrl);
              
              if (!imageResponse.ok) {
                logger.error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
                throw new Error(`Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`);
              }
              
              const imageBuffer = await imageResponse.buffer();
              const imageBase64 = imageBuffer.toString('base64');
              
              logger.info(`✅ Image downloaded and converted to base64. Size: ${imageBase64.length} characters`);
              logger.info(`Image buffer size: ${imageBuffer.length} bytes`);
              return imageBase64;
            } catch (downloadError: any) {
              logger.error(`Error downloading image: ${downloadError.message}`);
              logger.error(`Image URL was: ${resultImageUrl}`);
              throw downloadError;
            }
          } else if (successFlag === 2) {
            // CREATE_TASK_FAILED
            throw new Error(`NanoBanana task failed: Failed to create task. Error: ${statusData.data.errorMessage || 'Unknown error'}`);
          } else if (successFlag === 3) {
            // GENERATE_FAILED
            throw new Error(`NanoBanana task failed: Image generation failed. Error: ${statusData.data.errorMessage || 'Unknown error'}`);
          } else if (successFlag === 0) {
            // Task still processing
            logger.info(`Task still processing (successFlag: 0 = GENERATING)...`);
          } else {
            // Unexpected successFlag value
            logger.warn(`Unexpected successFlag: ${successFlag}. Response:`, JSON.stringify(statusData, null, 2));
          }
        } else {
          logger.warn(`Unexpected status response structure. Code: ${statusData.code}`, JSON.stringify(statusData, null, 2));
        }
      } catch (fetchError: any) {
        logger.warn(`Status check error (attempt ${attempt}): ${fetchError.message}`);
        // Continue polling
      }
    }
    
    throw new Error(`NanoBanana task did not complete within ${(maxAttempts * pollInterval) / 1000} seconds. Task ID: ${taskId}`);
    
  } catch (error: any) {
    logger.error("❌ ERROR in generateImageWithNanoBanana:");
    logger.error("Error type:", error?.constructor?.name);
    logger.error("Error message:", error?.message);
    logger.error("Error stack:", error?.stack);
    throw error;
  }
}

/**
 * Legacy function names for backward compatibility
 */
export async function submitNanoBananaEditTask(
  apiKey: string,
  prompt: string,
  imageUrl: string
): Promise<string> {
  logger.warn("submitNanoBananaEditTask is deprecated. Use generateImageWithNanoBanana instead.");
  await generateImageWithNanoBanana(apiKey, prompt, imageUrl);
  return "direct-response"; // Placeholder for compatibility
}

export async function checkNanoBananaTaskStatus(
  apiKey: string,
  taskId: string
): Promise<any> {
  const statusUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`;
  const response = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  const responseText = await response.text();
  return JSON.parse(responseText);
}

export async function pollNanoBananaTaskUntilComplete(
  apiKey: string,
  taskId: string,
  maxAttempts: number = 60,
  initialDelayMs: number = 2000
): Promise<string> {
  logger.warn("pollNanoBananaTaskUntilComplete is deprecated. Use generateImageWithNanoBanana instead.");
  throw new Error("Use generateImageWithNanoBanana instead - it handles polling internally.");
}

