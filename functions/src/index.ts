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
import fetch from "node-fetch";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import axios from "axios";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from 'openai';
// Remove functions sdk import - no longer needed
// import * as functions from "firebase-functions"; 
// Add Secret Manager Client
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
// Remove Readable import, not needed now
// import { Readable } from 'stream';
import * as fsPromises from 'fs/promises'; // Use promises for async operations
import * as fs from 'fs'; // Import standard fs for createReadStream
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp'; // Import sharp
import FormData from 'form-data'; // Import form-data library

import { getOpenAIApiKey } from './services/openai';
import { canUserGenerateDesign, getUserSubscription, subscriptionPlans, SubscriptionPlanType } from './services/subscriptions';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Remove global OpenAI Client Initialization
/*
// --- Initialize OpenAI Client ---
// Ensure OPENAI_API_KEY is set in function environment variables
logger.info("Attempting to initialize OpenAI client...");
logger.info(`OPENAI_API_KEY value: ${process.env.OPENAI_API_KEY ? 'Exists and has value' : 'MISSING or EMPTY'}`); // Log existence, not the key itself
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});
logger.info("OpenAI client initialized (or attempted).");
// --- End OpenAI Client Init ---
*/

// Helper function to download image and encode as base64
async function downloadImageAndEncode(url: string): Promise<{ data: string; mimeType: string }> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });
        const mimeType = response.headers['content-type'] || 'image/png'; // Default to png if type unknown
        const data = Buffer.from(response.data, 'binary').toString('base64');
        return { data, mimeType };
    } catch (error) {
        logger.error("Error downloading image:", error);
        throw new Error("Failed to download image for processing.");
    }
}

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

// Fetches the OpenAI API key from Secret Manager
async function getOpenApiKey(): Promise<string> {
    try {
        return await getOpenAIApiKey();
    } catch (secretError) {
        logger.error("Critical: Failed to retrieve OpenAI API key from Secret Manager:", secretError);
        throw new Error("Failed to retrieve API credentials."); // Re-throw critical error
    }
}

// Downloads an image from a URL
async function downloadImage(url: string): Promise<Buffer> {
    logger.info(`Downloading image from: ${url}`);
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        logger.info(`Successfully downloaded image (size: ${imageBuffer.length} bytes)`);
        return imageBuffer;
    } catch (downloadError) {
        logger.error(`Failed to download image from ${url}:`, downloadError);
        throw new Error(`Failed to download image: ${url}`);
    }
}

// Processes the image buffer: ensures alpha channel and converts to PNG
async function processImageForOpenAI(imageBuffer: Buffer): Promise<{ pngBuffer: Buffer, metadata: sharp.Metadata }> {
    try {
        logger.info('Processing image for OpenAI...');
        const imageSharp = sharp(imageBuffer);
        const metadata = await imageSharp.metadata();
        logger.info(`Original image info: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

        // Ensure Alpha channel for transparency (required by edit endpoint if no mask)
        const pngBuffer = await imageSharp.ensureAlpha().png().toBuffer();
        logger.info(`Successfully processed image to PNG w/alpha (size: ${pngBuffer.length} bytes)`);
        return { pngBuffer, metadata };
    } catch (sharpError) {
        logger.error('Error processing image with sharp:', sharpError);
        throw new Error('Failed to process input image to required PNG format.');
    }
}

// Calls the OpenAI image edit API
async function callOpenAIEditApi(
    apiKey: string,
    prompt: string,
    imageBuffer: Buffer,
    imageMetadata: sharp.Metadata // Pass metadata for logging
): Promise<{
    data?: Array<{
        url?: string;
        b64_json?: string;
    }>;
    error?: {
        message: string;
        type: string;
        code: string;
    };
}> {
    const tempDir = os.tmpdir();
    // Use a more unique temp file name (though still might collide in high concurrency)
    const tempFileName = `openai_edit_input_${process.pid}_${Date.now()}.png`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
        // Save buffer to temp file to use with FormData
        await fsPromises.writeFile(tempFilePath, imageBuffer);
        logger.info(`Processed image saved to temporary file: ${tempFilePath}`);

        // Construct FormData
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', 'gpt-image-1'); // Explicitly set model
        formData.append('image', fs.createReadStream(tempFilePath), { // Stream from temp file
            filename: 'input.png', // Generic filename for API
            contentType: 'image/png',
        });
        // Optional: Add 'n' or 'size' if needed

        // Pre-flight Logging
        logger.info(`Prompt length: ${prompt.length} characters`);
        logger.info(`Image buffer size being sent: ${imageBuffer.length} bytes`);
        logger.info(`Image dimensions being sent: ${imageMetadata.width}x${imageMetadata.height}`);
        logger.info('Constructed FormData for OpenAI edit request.');

        // Execute fetch request
        const apiEndpoint = 'https://api.openai.com/v1/images/edits';
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                // Content-Type set automatically by fetch for FormData
            },
            body: formData,
        };

        logger.info(`Sending manual request to ${apiEndpoint}`);
        const fetchResponse = await fetch(apiEndpoint, fetchOptions);
        const responseBody = await fetchResponse.json(); // Try parsing JSON always

        if (!fetchResponse.ok) {
            logger.error(`OpenAI API request failed with status ${fetchResponse.status}:`, JSON.stringify(responseBody));
            const message = responseBody?.error?.message || fetchResponse.statusText;
            throw new Error(`OpenAI API Error (${fetchResponse.status}): ${message}`);
        }

        logger.info('Received successful response from manual OpenAI fetch request.');
        return responseBody;

    } finally {
        // Clean up temporary file
        try {
            await fsPromises.unlink(tempFilePath);
            logger.info(`Successfully deleted temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
            // Log cleanup error but don't fail the function for this
            logger.warn(`Failed to delete temporary file ${tempFilePath}:`, cleanupError);
        }
    }
}


// Uploads the generated image buffer to Firebase Storage
async function uploadGeneratedImageToStorage(
    projectId: string,
    imageBuffer: Buffer
): Promise<string> {
    try {
        const mimeType = 'image/png'; // We know it's PNG after processing
        const finalFileName = `generated-images/${projectId}/${Date.now()}.png`;
        const imageStorageRef = admin.storage().bucket().file(finalFileName);

        logger.info(`Uploading generated image to GCS: ${finalFileName}`);
        await imageStorageRef.save(imageBuffer, {
            metadata: { contentType: mimeType }
        });

        const [url] = await imageStorageRef.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future expiration
        });
        logger.info(`Generated image saved to Firebase Storage: ${url}`);
        return url;
    } catch (uploadError) {
        logger.error(`Failed to upload generated image to storage for project ${projectId}:`, uploadError);
        throw new Error("Failed to save generated image.");
    }
}

// --- Main Cloud Function Trigger ---
export const generateRenovationSuggestions = onDocumentCreated("projects/{projectId}", async (event: {
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
        apiKey = await getOpenApiKey(); // Get key early

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
        const userImageBuffer = await downloadImage(imageUrl);
        const { pngBuffer: processedPngBuffer, metadata: imageMetadata } = await processImageForOpenAI(userImageBuffer);

        const generationPrompt = `Edit the provided image applying the following renovation:
Room: ${roomType}
Style: ${style}
Budget: ${budget}
Description: ${analysisResult.afterImageDescription}

Constraints: Maintain original camera angle, lighting, room structure. Only modify elements consistent with the description and budget (${style}, ${budget}). Result must be photorealistic.`;
        
        // --- Update Firestore: Generating Image ---
        // (Optional, but good feedback if frontend polls)
         await projectRef.update({ aiStatus: "generating_image" }); 
         logger.info("Updated Firestore: generating image.");

        const openAIResponse = await callOpenAIEditApi(apiKey, generationPrompt, processedPngBuffer, imageMetadata);

        // --- Process OpenAI Response ---
        let finalImageUrl: string;
        if (openAIResponse?.data?.[0]?.url) {
            const generatedUrl = openAIResponse.data[0].url;
            logger.info(`Received OpenAI response URL: ${generatedUrl}`);
            const finalImageBuffer = await downloadImage(generatedUrl); // Download the result
            finalImageUrl = await uploadGeneratedImageToStorage(projectId, finalImageBuffer);
        } else if (openAIResponse?.data?.[0]?.b64_json) {
            logger.info(`Received OpenAI response Base64`);
            const finalImageBuffer = Buffer.from(openAIResponse.data[0].b64_json, 'base64');
            finalImageUrl = await uploadGeneratedImageToStorage(projectId, finalImageBuffer);
        } else {
            logger.error("OpenAI response missing expected image data (url or b64_json)", { response: JSON.stringify(openAIResponse) });
            throw new Error("Parsed OpenAI response did not contain the expected image data format.");
        }

        // --- Final Firestore Update: Success ---
        await projectRef.update({
            aiStatus: "completed",
            aiGeneratedImageURL: finalImageUrl,
            aiError: null,
            aiProcessedAt: FieldValue.serverTimestamp(), // Update timestamp again
        });
        logger.info(`Successfully processed project ${projectId} and updated Firestore.`);

    } catch (error) {
        logger.error(`Error processing project ${projectId}:`, error);
        // General error handling: update Firestore with failure status
        await projectRef.update({
            aiStatus: "failed",
            aiError: error instanceof Error ? error.message : "An unknown error occurred during AI processing.",
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
