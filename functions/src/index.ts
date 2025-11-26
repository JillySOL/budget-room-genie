/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";
import sharp from 'sharp';

import { getNanoBananaApiKey, generateImageWithNanoBanana } from './services/nanobanana';
import { canUserGenerateDesign, getUserSubscription, subscriptionPlans, SubscriptionPlanType } from './services/subscriptions';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Removed downloadImageAndEncode - no longer needed, NanoBanana Pro accepts URLs directly

// Generate renovation suggestions based on room type
function generateSuggestionsByRoomType(roomType: string, budget: string, style: string): {
    suggestions: Array<{item: string, cost: number, description: string}>;
    totalEstimatedCost: number;
    estimatedValueAdded: number;
    afterImageDescription: string;
} {
    // Default values
    let suggestions = [];
    let totalEstimatedCost = 0;
    let estimatedValueAdded = 0;
    let afterImageDescription = "";
    
    // Budget tier determination (assumed format: "$500-$1000" or similar)
    const isBudgetLow = budget.includes("$500") || budget.includes("under") || budget.includes("low");
    const isBudgetHigh = budget.includes("$5000") || budget.includes("high") || budget.includes("unlimited");
    
    switch(roomType.toLowerCase()) {
        case "bathroom":
            if (isBudgetLow) {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a light neutral tone", cost: 150 },
                    { item: "New Fixtures", description: "Replace faucet, shower head, and cabinet hardware", cost: 250 },
                    { item: "Lighting Update", description: "Install new vanity light fixture", cost: 150 }
                ];
                totalEstimatedCost = 550;
                estimatedValueAdded = 2000;
            } else if (isBudgetHigh) {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a light neutral tone", cost: 150 },
                    { item: "New Vanity", description: "Replace existing vanity with modern unit", cost: 800 },
                    { item: "Premium Fixtures", description: "Install high-end faucet and shower fixtures", cost: 500 },
                    { item: "Flooring Update", description: "Replace flooring with luxury vinyl tile", cost: 1200 },
                    { item: "Custom Mirror", description: "Add framed mirror and update lighting", cost: 350 }
                ];
                totalEstimatedCost = 3000;
                estimatedValueAdded = 8000;
            } else {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a light neutral tone", cost: 150 },
                    { item: "New Vanity", description: "Replace existing vanity with modern unit", cost: 600 },
                    { item: "New Fixtures", description: "Replace faucet, shower head, and cabinet hardware", cost: 350 },
                    { item: "Lighting Update", description: "Install new vanity light fixture", cost: 200 }
                ];
                totalEstimatedCost = 1300;
                estimatedValueAdded = 4500;
            }
            break;
            
        case "kitchen":
            if (isBudgetLow) {
                suggestions = [
                    { item: "Cabinet Refresh", description: "Paint existing cabinets and add new hardware", cost: 300 },
                    { item: "Backsplash Tiles", description: "Add a simple tile backsplash", cost: 250 },
                    { item: "Lighting Update", description: "Replace outdated light fixtures", cost: 150 }
                ];
                totalEstimatedCost = 700;
                estimatedValueAdded = 2500;
            } else if (isBudgetHigh) {
                suggestions = [
                    { item: "Cabinet Refinishing", description: "Professionally refinish cabinets with premium paint", cost: 1200 },
                    { item: "New Countertops", description: "Install quartz or granite countertops", cost: 2500 },
                    { item: "Premium Backsplash", description: "Install designer tile backsplash", cost: 800 },
                    { item: "High-End Fixtures", description: "Replace sink and faucet with premium options", cost: 600 },
                    { item: "Modern Lighting", description: "Install recessed lighting and pendant fixtures", cost: 900 }
                ];
                totalEstimatedCost = 6000;
                estimatedValueAdded = 15000;
            } else {
                suggestions = [
                    { item: "Cabinet Refresh", description: "Paint existing cabinets and add new hardware", cost: 500 },
                    { item: "Countertop Replacement", description: "Install new laminate countertops", cost: 1200 },
                    { item: "Backsplash Tiles", description: "Add a simple tile backsplash", cost: 400 },
                    { item: "New Fixtures", description: "Replace sink faucet and add under-cabinet lighting", cost: 350 }
                ];
                totalEstimatedCost = 2450;
                estimatedValueAdded = 7000;
            }
            break;
            
        case "bedroom":
            if (isBudgetLow) {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a calming color", cost: 200 },
                    { item: "Light Fixture Update", description: "Replace outdated ceiling fixture", cost: 150 },
                    { item: "Window Treatments", description: "Add new curtains or blinds", cost: 150 }
                ];
                totalEstimatedCost = 500;
                estimatedValueAdded = 1500;
            } else if (isBudgetHigh) {
                suggestions = [
                    { item: "Premium Paint", description: "Apply designer paint with accent wall", cost: 500 },
                    { item: "Flooring Upgrade", description: "Install hardwood or premium laminate flooring", cost: 2500 },
                    { item: "Custom Lighting", description: "Add recessed lighting and bedside fixtures", cost: 1200 },
                    { item: "Built-in Storage", description: "Add custom built-in shelving or window seat", cost: 1800 }
                ];
                totalEstimatedCost = 6000;
                estimatedValueAdded = 12000;
            } else {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a calming color", cost: 250 },
                    { item: "Flooring Update", description: "Install new carpet or laminate flooring", cost: 1200 },
                    { item: "Light Fixture Update", description: "Replace outdated ceiling fixture and add bedside lamps", cost: 300 },
                    { item: "Window Treatments", description: "Add new curtains or blinds", cost: 250 }
                ];
                totalEstimatedCost = 2000;
                estimatedValueAdded = 5000;
            }
            break;
            
        case "living room":
            if (isBudgetLow) {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a modern neutral", cost: 300 },
                    { item: "Light Fixture Update", description: "Replace outdated ceiling fixture", cost: 200 },
                    { item: "Accent Décor", description: "Add new throw pillows, rug, and wall art", cost: 200 }
                ];
                totalEstimatedCost = 700;
                estimatedValueAdded = 2000;
            } else if (isBudgetHigh) {
                suggestions = [
                    { item: "Premium Paint", description: "Apply designer paint with accent wall", cost: 600 },
                    { item: "Flooring Upgrade", description: "Install hardwood or premium laminate flooring", cost: 3000 },
                    { item: "Custom Lighting", description: "Add recessed lighting and statement fixtures", cost: 1500 },
                    { item: "Fireplace Update", description: "Refinish fireplace with stone or tile surround", cost: 2000 },
                    { item: "Built-in Storage", description: "Add custom built-in shelving or entertainment center", cost: 2500 }
                ];
                totalEstimatedCost = 9600;
                estimatedValueAdded = 20000;
            } else {
                suggestions = [
                    { item: "Paint Refresh", description: "Apply a fresh coat of paint in a modern neutral", cost: 400 },
                    { item: "Flooring Update", description: "Install new carpet or laminate flooring", cost: 1500 },
                    { item: "Light Fixture Update", description: "Replace outdated ceiling fixture and add floor lamps", cost: 400 },
                    { item: "Accent Wall", description: "Create feature wall with paint or wallpaper", cost: 300 }
                ];
                totalEstimatedCost = 2600;
                estimatedValueAdded = 6500;
            }
            break;
            
        default:
            suggestions = [
                { item: "Paint Refresh", description: "Apply a fresh coat of paint", cost: 250 },
                { item: "Lighting Update", description: "Replace outdated light fixtures", cost: 200 },
                { item: "Décor Refresh", description: "Update accent pieces and accessories", cost: 300 }
            ];
            totalEstimatedCost = 750;
            estimatedValueAdded = 2000;
    }
    
    // Generate a description for image generation based on room type and style
    let styleDesc = "";
    if (style.toLowerCase().includes("modern")) {
        styleDesc = "modern, clean lines, minimalist";
    } else if (style.toLowerCase().includes("traditional")) {
        styleDesc = "traditional, classic, warm tones";
    } else if (style.toLowerCase().includes("farmhouse")) {
        styleDesc = "farmhouse style, rustic elements, warm wood tones";
    } else if (style.toLowerCase().includes("industrial")) {
        styleDesc = "industrial style, exposed materials, metal accents";
    } else if (style.toLowerCase().includes("mid-century")) {
        styleDesc = "mid-century modern, retro influence, clean lines";
    } else if (style.toLowerCase().includes("coastal")) {
        styleDesc = "coastal, beach-inspired, light blue and white palette";
    } else {
        styleDesc = "contemporary, tasteful, balanced";
    }
    
    // Create the after image description (Make descriptions more concise)
    switch(roomType.toLowerCase()) {
        case "bathroom":
            afterImageDescription = `A ${styleDesc} bathroom featuring ${isBudgetHigh ? 'premium' : 'refreshed'} fixtures, ${isBudgetLow ? 'fresh paint' : 'an updated vanity'}, and ${isBudgetHigh ? 'luxury flooring' : 'new lighting'}. Clean, bright ${style.toLowerCase()} design.`;
            break;
        case "kitchen":
            afterImageDescription = `A ${styleDesc} kitchen with ${isBudgetHigh ? 'refinished cabinets' : 'refreshed cabinets'}, ${isBudgetLow ? 'clean counters' : 'new countertops'}, and ${isBudgetHigh ? 'designer backsplash' : 'simple backsplash'}. Well-lit ${style.toLowerCase()} aesthetic.`;
            break;
        case "bedroom":
            afterImageDescription = `A ${styleDesc} bedroom with ${isBudgetHigh ? 'premium paint' : 'fresh paint'}, ${isBudgetLow ? 'updated lighting' : 'new flooring'}, and ${isBudgetHigh ? 'custom storage' : 'new window treatments'}. Calm, inviting ${style.toLowerCase()} design.`;
            break;
        case "living room":
            afterImageDescription = `A ${styleDesc} living room with ${isBudgetHigh ? 'premium paint' : 'fresh paint'}, ${isBudgetLow ? 'updated lighting' : 'new flooring'}, and ${isBudgetHigh ? 'refined fireplace' : 'new accent pieces'}. Open, inviting ${style.toLowerCase()} design.`;
            break;
        default:
            afterImageDescription = `Refreshed ${roomType} with updated paint, lighting, and décor in a ${styleDesc} style. Cohesive ${style.toLowerCase()} aesthetic.`;
    }
    
    return {
        suggestions,
        totalEstimatedCost,
        estimatedValueAdded,
        afterImageDescription
    };
}

// --- Helper Functions ---

// Fetches the NanoBanana API key from Secret Manager
async function getNanoBananaApiKeyFromSecret(): Promise<string> {
    try {
        return await getNanoBananaApiKey();
    } catch (secretError) {
        logger.error("Critical: Failed to retrieve NanoBanana API key from Secret Manager:", secretError);
        throw new Error("Failed to retrieve API credentials."); // Re-throw critical error
    }
}

// Removed downloadImage, processImageForNanoBanana, and uploadImageForNanoBanana
// NanoBanana Pro accepts image URLs directly - no need to download/re-upload


// Uploads the generated image buffer to Firebase Storage
async function uploadGeneratedImageToStorage(
    projectId: string,
    imageBuffer: Buffer
): Promise<string> {
    try {
        const mimeType = 'image/png'; // We know it's PNG after processing
        const finalFileName = `generated-images/${projectId}/${Date.now()}.png`;
        
        // Get the default Firebase Storage bucket
        const bucket = admin.storage().bucket();
        const imageStorageRef = bucket.file(finalFileName);

        logger.info(`Uploading generated image to Firebase Storage: ${finalFileName}`);
        logger.info(`Bucket name: ${bucket.name}`);
        
        // Upload the file
        // With uniform bucket-level access, we cannot use ACLs (public: true, makePublic)
        // Access is controlled by IAM policies and Storage Rules only
        await imageStorageRef.save(imageBuffer, {
            metadata: { 
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000' // Cache for 1 year
            }
            // DO NOT use public: true - it's not compatible with uniform bucket-level access
        });
        
        // Construct the public URL directly
        // With uniform bucket-level access + Storage Rules allowing public read,
        // we can use the Firebase Storage public URL format
        // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
        const bucketName = bucket.name;
        // Convert bucket name to Firebase Storage URL format if needed
        const urlBucketName = bucketName.includes('.firebasestorage.app') 
            ? bucketName 
            : bucketName.replace('.appspot.com', '.firebasestorage.app');
        
        // Properly encode the file path for uniform bucket-level access
        // Each path segment must be encoded separately, then joined with %2F
        const encodedPath = finalFileName.split('/').map(segment => encodeURIComponent(segment)).join('%2F');
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${urlBucketName}/o/${encodedPath}?alt=media`;
        
        logger.info(`Generated image saved to Firebase Storage`);
        logger.info(`File path: ${finalFileName}`);
        logger.info(`Bucket name: ${bucket.name}`);
        logger.info(`Firebase Storage public URL: ${publicUrl}`);
        logger.info(`Image buffer size: ${imageBuffer.length} bytes`);
        
        // Verify the URL is different from any input URLs
        logger.info(`Returning Firebase Storage public URL for aiGeneratedImageURL field`);
        
        return publicUrl;
    } catch (uploadError: any) {
        logger.error(`Failed to upload generated image to storage for project ${projectId}`);
        logger.error("Upload error details:", {
            message: uploadError?.message,
            code: uploadError?.code,
            status: uploadError?.status,
            stack: uploadError?.stack
        });
        throw new Error(`Failed to save generated image: ${uploadError?.message || 'Unknown error'}`);
    }
}

// NEW FUNCTION DEFINITION
async function updateUserSubscription(userId: string, planId: SubscriptionPlanType): Promise<boolean> {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.update({
      subscriptionPlan: planId,
      // Potentially update other fields like subscriptionStartDate, etc.
      updatedAt: FieldValue.serverTimestamp() 
    });
    logger.info(`Successfully updated subscription plan to ${planId} for user ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to update subscription for user ${userId} to plan ${planId}:`, error);
    return false; // Indicate failure
  }
}

// --- Main Cloud Function Trigger ---
export const generateRenovationSuggestions = onDocumentCreated(
    {
        document: "projects/{projectId}",
        maxInstances: 10,
        timeoutSeconds: 540, // 9 minutes (max for 2nd gen functions)
        memory: "1GiB",
    },
    async (event: {
        data?: FirebaseFirestore.DocumentSnapshot;
        id: string;
        params: {[key: string]: string};
    }) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.error("No data associated with the event");
        return;
    }
    const projectId = event.params.projectId;
    const projectData = snapshot.data();
    const projectRef = snapshot.ref; // Reference for Firestore updates

    logger.info(`Processing project ${projectId}`, { structuredData: true });

    // --- Initial Validation ---
    if (!projectData || !projectData.uploadedImageURL) {
        logger.error("Project data or uploadedImageURL missing.", { projectId });
        await projectRef.update({
            aiStatus: "failed",
            aiError: "Missing project data or image URL.",
            aiProcessedAt: FieldValue.serverTimestamp(),
        }).catch(e => logger.error("Firestore update failed (initial validation):", e));
        return;
    }

    let apiKey: string;
    try {
        // --- Get API Key ---
        apiKey = await getNanoBananaApiKeyFromSecret(); // Get NanoBanana key

        // --- Extract Data & Generate Suggestions ---
        const imageUrl = projectData.uploadedImageURL as string;
        const budget = projectData.budget || "not specified";
        const style = projectData.style || "modern";
        const roomType = projectData.roomType || "room";
        const analysisResult = generateSuggestionsByRoomType(roomType, budget, style);
        logger.info(`Generated suggestions for ${projectId}`);

        // --- Update Firestore: Processing Started ---
        await projectRef.update({
            aiStatus: "processing", // More accurate initial status
            aiSuggestions: analysisResult.suggestions || [],
            aiTotalEstimatedCost: analysisResult.totalEstimatedCost || 0,
            aiEstimatedValueAdded: analysisResult.estimatedValueAdded || 0,
            aiAfterImageDescription: analysisResult.afterImageDescription || "",
            aiError: null,
            aiProcessedAt: FieldValue.serverTimestamp(),
        });
        logger.info("Updated Firestore: processing started.");

        // --- Image Generation Steps ---
        // NanoBanana Pro accepts image URLs directly - no need to download/re-upload
        // Use the Firebase Storage URL directly (it's already publicly accessible)
        const publicImageUrl = imageUrl;
        logger.info(`Using Firebase Storage URL directly for NanoBanana Pro: ${publicImageUrl}`);

        // Enhanced prompt engineering with all user parameters
        const generationPrompt = `You are a professional interior designer. Edit the provided room image to show a renovated version based on these specifications:

ROOM TYPE: ${roomType}
DESIGN STYLE: ${style}
BUDGET LEVEL: ${budget}

RENOVATION DESCRIPTION:
${analysisResult.afterImageDescription}

CRITICAL REQUIREMENTS:
1. Maintain the EXACT same camera angle, perspective, and room structure as the original image
2. Keep the same lighting conditions and natural light sources
3. Only modify design elements (paint, fixtures, furniture, décor) - do NOT change room dimensions or layout
4. Apply the ${style} design style consistently throughout
5. Ensure all changes are realistic and achievable within a ${budget} budget
6. The result must be photorealistic and look like a real photograph
7. Preserve the original room's architectural features (windows, doors, structural elements)
8. Make the renovation look natural and cohesive, as if it was professionally done

Focus on: ${style.toLowerCase()} aesthetic elements, appropriate materials for ${budget} budget, and maintaining the room's original character while updating it to match the ${style} style.`;
        
        // Log the complete prompt for debugging
        logger.info("=== GENERATION PROMPT ===");
        logger.info(generationPrompt);
        logger.info("=== END PROMPT ===");
        logger.info("Prompt details:", {
            roomType,
            style,
            budget,
            afterImageDescription: analysisResult.afterImageDescription,
            promptLength: generationPrompt.length
        });
        
        // --- Update Firestore: Generating Image ---
        await projectRef.update({ aiStatus: "generating_image" }); 
        logger.info("Updated Firestore: generating image.");

        // Generate image using Gemini (Nano Banana) API
        // Gemini API returns base64 encoded image data directly (no polling needed)
        logger.info("Calling Gemini (Nano Banana) API to generate edited image...");
        logger.info("API Key available:", !!apiKey);
        logger.info("Public image URL:", publicImageUrl);
        
        let generatedImageBase64: string;
        try {
            generatedImageBase64 = await generateImageWithNanoBanana(apiKey, generationPrompt, publicImageUrl);
            logger.info(`✅ Gemini API image generation completed. Image data length: ${generatedImageBase64.length} characters (base64)`);
        } catch (nanobananaError: any) {
            logger.error("❌ ERROR in generateImageWithNanoBanana:", {
                error: nanobananaError,
                message: nanobananaError?.message,
                stack: nanobananaError?.stack,
                apiKeyLength: apiKey?.length,
                promptLength: generationPrompt.length,
                imageUrl: publicImageUrl
            });
            throw nanobananaError; // Re-throw to be caught by outer try-catch
        }

        // Convert base64 image data to Buffer and upload to Firebase Storage
        const finalImageBuffer = Buffer.from(generatedImageBase64, 'base64');
        logger.info(`Converted base64 to buffer: ${finalImageBuffer.length} bytes`);
        const finalImageUrl = await uploadGeneratedImageToStorage(projectId, finalImageBuffer);

        // --- Final Firestore Update: Success ---
        // Log the URLs before saving to verify they're different
        logger.info(`About to save aiGeneratedImageURL to Firestore:`, {
            projectId,
            uploadedImageURL: projectData.uploadedImageURL,
            aiGeneratedImageURL: finalImageUrl,
            urlsAreDifferent: projectData.uploadedImageURL !== finalImageUrl,
            finalImageUrlLength: finalImageUrl.length,
            uploadedImageUrlLength: projectData.uploadedImageURL?.length || 0
        });
        
        await projectRef.update({
            aiStatus: "completed",
            aiGeneratedImageURL: finalImageUrl,
            aiError: null,
            aiProcessedAt: FieldValue.serverTimestamp(), // Update timestamp again
        });
        
        // Verify the update was successful
        const verifyDoc = await projectRef.get();
        const verifyData = verifyDoc.data();
        logger.info(`Firestore update verified. aiGeneratedImageURL is now:`, {
            saved: verifyData?.aiGeneratedImageURL,
            matchesExpected: verifyData?.aiGeneratedImageURL === finalImageUrl,
            aiStatus: verifyData?.aiStatus
        });
        
        logger.info(`Successfully processed project ${projectId} and updated Firestore with generated image URL.`);

    } catch (error: any) {
        logger.error(`❌ ERROR processing project ${projectId}:`);
        logger.error("Error type:", error?.constructor?.name);
        logger.error("Error message:", error?.message);
        logger.error("Error stack:", error?.stack);
        if (error?.response) {
            logger.error("Error response:", error.response);
        }
        if (error?.config) {
            logger.error("Error config:", error.config);
        }
        
        // General error handling: update Firestore with failure status
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI processing.";
        await projectRef.update({
            aiStatus: "failed",
            aiError: errorMessage,
            aiProcessedAt: FieldValue.serverTimestamp(),
        }).catch(updateError => {
            logger.error(`Failed to update project ${projectId} with error status:`, updateError);
        });
    }
});
// --- End Cloud Function Trigger ---

import { enhanceDIYDescriptions } from './enhanceDIYDescriptions';
export { enhanceDIYDescriptions };

export const checkUserSubscription = onCall({
  maxInstances: 10,
}, async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    logger.error("Unauthenticated call to checkUserSubscription");
    throw new Error("Authentication required");
  }
  
  const userId = request.auth.uid;
  
  try {
    const result = await canUserGenerateDesign(userId);
    return {
      canGenerate: result.canGenerate,
      reason: result.reason || null,
      subscription: result.subscription || null,
      plans: subscriptionPlans
    };
  } catch (error) {
    logger.error(`Error checking subscription for user ${userId}:`, error);
    throw new Error("Failed to check subscription status");
  }
});

export const updateSubscription = onCall({
  maxInstances: 10,
}, async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    logger.error("Unauthenticated call to updateSubscription");
    throw new Error("Authentication required");
  }
  
  const userId = request.auth.uid;
  const { planId } = request.data;
  
  if (!planId || !Object.values(SubscriptionPlanType).includes(planId as SubscriptionPlanType)) {
    logger.error(`Invalid plan ID: ${planId}`);
    throw new Error("Invalid subscription plan");
  }
  
  try {
    const success = await updateUserSubscription(userId, planId as SubscriptionPlanType);
    
    if (!success) {
      throw new Error("Failed to update subscription");
    }
    
    return {
      success: true,
      message: "Subscription updated successfully"
    };
  } catch (error) {
    logger.error(`Error updating subscription for user ${userId}:`, error);
    throw new Error("Failed to update subscription");
  }
});

// HTTP callable function to fix image URL for existing projects
export const fixImageUrl = onCall(async (request) => {
  const projectId = request.data?.projectId;
  
  if (!projectId) {
    throw new Error('Project ID is required');
  }
  
  try {
    logger.info(`Fixing image URL for project: ${projectId}`);
    
    // Get the project document
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    const projectData = projectDoc.data();
    const currentUrl = projectData?.aiGeneratedImageURL;
    
    if (!currentUrl) {
      throw new Error(`No aiGeneratedImageURL found for project ${projectId}`);
    }
    
    logger.info(`Current URL: ${currentUrl}`);
    
    // Extract the file path from the URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const urlMatch = currentUrl.match(/\/o\/(.+?)(\?|$)/);
    if (!urlMatch) {
      throw new Error(`Could not parse file path from URL`);
    }
    
    const filePath = decodeURIComponent(urlMatch[1]);
    logger.info(`File path: ${filePath}`);
    
    // Get the file reference
    const storageBucket = admin.storage().bucket();
    const fileRef = storageBucket.file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      logger.error(`File does not exist at path: ${filePath}`);
      throw new Error(`File does not exist. The image may not have been uploaded correctly.`);
    }
    
    logger.info(`✅ File exists`);
    
    // With uniform bucket-level access, we cannot use makePublic()
    // Access is controlled by IAM policies and Storage Rules only
    // Since Storage Rules allow public read for generated-images, we can construct the URL directly
    
    // Construct the public URL directly
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media
    const bucketName = storageBucket.name;
    const urlBucketName = bucketName.includes('.firebasestorage.app') 
        ? bucketName 
        : bucketName.replace('.appspot.com', '.firebasestorage.app');
    
    // Properly encode the file path for uniform bucket-level access
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('%2F');
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${urlBucketName}/o/${encodedPath}?alt=media`;
    
    logger.info(`✅ Generated public URL: ${publicUrl}`);
    
    // Update Firestore
    await projectRef.update({
      aiGeneratedImageURL: publicUrl
    });
    
    logger.info(`✅ Updated Firestore with new URL`);
    
    return { success: true, newUrl: publicUrl };
  } catch (error: any) {
    logger.error(`Error fixing image URL: ${error.message}`);
    throw error;
  }
});
