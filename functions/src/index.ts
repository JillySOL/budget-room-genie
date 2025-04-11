/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import { VertexAI, Part, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

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
function generateSuggestionsByRoomType(roomType: string, budget: string, style: string): any {
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
    
    // Create the after image description
    switch(roomType.toLowerCase()) {
        case "bathroom":
            afterImageDescription = `A ${styleDesc} bathroom with ${isBudgetHigh ? 'premium' : 'refreshed'} fixtures, ${isBudgetLow ? 'freshly painted walls' : 'updated vanity'}, and ${isBudgetHigh ? 'luxury flooring' : 'new lighting'}. The space feels clean, bright, and inviting with ${style.toLowerCase()} design elements throughout.`;
            break;
        case "kitchen":
            afterImageDescription = `A ${styleDesc} kitchen with ${isBudgetHigh ? 'refinished premium cabinets' : 'refreshed cabinets'}, ${isBudgetLow ? 'clean countertops' : 'new countertops'}, and ${isBudgetHigh ? 'designer backsplash' : 'simple backsplash'}. The space is well-lit with ${isBudgetHigh ? 'modern pendant lighting' : 'updated fixtures'} and has a cohesive ${style.toLowerCase()} aesthetic.`;
            break;
        case "bedroom":
            afterImageDescription = `A ${styleDesc} bedroom with ${isBudgetHigh ? 'premium painted walls' : 'freshly painted walls'}, ${isBudgetLow ? 'updated lighting' : 'new flooring'}, and ${isBudgetHigh ? 'custom storage solutions' : 'refreshed window treatments'}. The space feels calm and inviting with thoughtful ${style.toLowerCase()} design elements.`;
            break;
        case "living room":
            afterImageDescription = `A ${styleDesc} living room with ${isBudgetHigh ? 'premium painted walls' : 'freshly painted walls'}, ${isBudgetLow ? 'updated lighting' : 'new flooring'}, and ${isBudgetHigh ? 'a refined fireplace surround' : 'refreshed accent pieces'}. The space feels open and inviting with cohesive ${style.toLowerCase()} design elements throughout.`;
            break;
        default:
            afterImageDescription = `A refreshed ${roomType} with updated paint, lighting, and décor elements in a ${styleDesc} style. The space feels rejuvenated and more functional while maintaining a cohesive ${style.toLowerCase()} aesthetic.`;
    }
    
    return {
        suggestions,
        totalEstimatedCost,
        estimatedValueAdded,
        afterImageDescription
    };
}

// --- Cloud Function Trigger (v2) ---
export const generateRenovationSuggestions = onDocumentCreated("projects/{projectId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.error("No data associated with the event");
        return;
    }
    const projectId = event.params.projectId;
    const projectData = snapshot.data();

    logger.info(`Processing project ${projectId}`, { structuredData: true });

    if (!projectData || !projectData.uploadedImageURL) {
        logger.error("Project data or uploadedImageURL missing.", { projectId });
        if (snapshot) {
            await snapshot.ref.update({
                aiStatus: "failed",
                aiError: "Missing project data or image URL.",
            });
        }
        return;
    }

    try {
        // --- Step 1: Extract project data ---
        const imageUrl = projectData.uploadedImageURL as string;
        const budget = projectData.budget || "not specified";
        const style = projectData.style || "modern";
        const roomType = projectData.roomType || "room";
        
        // --- Step 2: Generate suggestions based on room type ---
        const analysisResult = generateSuggestionsByRoomType(roomType, budget, style);
        logger.info(`Generated suggestions for ${projectId} based on room type ${roomType}`);
        
        // Mark project as processing
        await snapshot.ref.update({
            aiStatus: "processing",
            aiError: null,
            aiProcessedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Successfully generated analysis for project ${projectId}`);

        // Update Firestore immediately after analysis, before image generation
        await snapshot.ref.update({
            aiStatus: "generating_image", // Indicate image generation is starting
            aiSuggestions: analysisResult.suggestions || [],
            aiTotalEstimatedCost: analysisResult.totalEstimatedCost || 0,
            aiEstimatedValueAdded: analysisResult.estimatedValueAdded || 0,
            aiAfterImageDescription: analysisResult.afterImageDescription || "",
            aiError: null,
        });

        // --- Step 3: Call Gemini Pro for Image Generation/Editing ---
        logger.info(`Calling Gemini Pro for project ${projectId}`);

        // --- Restore Original Gemini Prompt ---
        const imagePrompt = `
Interior Design Renovation Agent - Image Editing Task

You are a photo-realistic interior design assistant. Your task is to take the provided image of a ${roomType} and renovate/restyle it based on the following design instructions. You MUST modify the original image provided.

ROOM DETAILS:
- Room type: ${roomType}
- Design style: ${style}
- Budget level: ${budget}

DESIGN INSTRUCTIONS:
${analysisResult.afterImageDescription}

IMAGE EDITING GUIDELINES:
- Modify the input image directly to apply the changes.
- Maintain the original camera angle, perspective, and overall room structure.
- Only change furniture, colors, flooring, decor, etc. as described in the DESIGN INSTRUCTIONS.
- Ensure the final image is photorealistic and matches the ${style} style.
- DO NOT generate a completely new image; edit the existing one.

Create a photorealistic "after" image showing the result of applying the design instructions to the original ${roomType} image.
`;
        // const imagePrompt = `Take the provided image and make the main walls bright blue. Modify the original image directly. Maintain the original camera angle, perspective, and structure.`; // Keep commented out
        // --- END Restore Original Gemini Prompt ---

        let generatedImageUrl = null;
        try {
            const PROJECT_ID = "renomate-1f15d"; // Firebase Project ID
            const LOCATION_ID = "us-central1"; // Or your preferred location

            // --- Download and encode the original image ---
            logger.info(`Downloading original image for project ${projectId} from ${imageUrl}`);
            const { data: originalImageBase64, mimeType: originalMimeType } = await downloadImageAndEncode(imageUrl);
            logger.info(`Successfully downloaded and encoded original image (${originalMimeType})`);
            // --- End Download ---

            // --- Remove Diagnostic Log ---
            // logger.info(`Preparing Gemini request. Image MIME type: ${originalMimeType}, Base64 preview: ${originalImageBase64.substring(0, 80)}...`);
            // --- End Remove ---

            // Initialize Vertex AI
            const vertex_ai = new VertexAI({ project: PROJECT_ID, location: LOCATION_ID });
            const model = 'gemini-1.5-pro-preview-0514'; // Using a capable multimodal model

            // Instantiate the model
            const generativeModel = vertex_ai.getGenerativeModel({
                model: model,
                // Adjust safety settings as needed for interior design images
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
                generationConfig: {
                    maxOutputTokens: 2048, // Adjust if needed, though for image output this might not be primary
                    temperature: 0.4, // Lower temperature for more predictable edits
                    // topP: 1, // topP and topK can also be adjusted
                    // topK: 32,
                },
            });

            // Prepare the parts for the multimodal request
            const imagePart: Part = {
                inlineData: {
                    mimeType: originalMimeType,
                    data: originalImageBase64,
                },
            };
            const textPart: Part = {
                text: imagePrompt,
            };

            const requestPayload = {
                contents: [{ role: 'user', parts: [imagePart, textPart] }],
            };

            logger.info(`Sending request to Gemini Pro model (${model}) for project ${projectId}`);

            // Call the Gemini API
            const streamingResp = await generativeModel.generateContentStream(requestPayload);
            // Aggregate the response to get the image data
            const aggregatedResponse = await streamingResp.response;

            // Check for safety blocks or missing content
            if (!aggregatedResponse.candidates || aggregatedResponse.candidates.length === 0 || !aggregatedResponse.candidates[0].content || !aggregatedResponse.candidates[0].content.parts || aggregatedResponse.candidates[0].content.parts.length === 0) {
                 // Check finishReason for safety issues
                 const finishReason = aggregatedResponse.candidates?.[0]?.finishReason;
                 const safetyRatings = aggregatedResponse.candidates?.[0]?.safetyRatings;
                 logger.error(`Gemini response missing content or blocked. Finish Reason: ${finishReason}`, { safetyRatings });
                 let errorMessage = "Gemini response missing expected content.";
                 if (finishReason === 'SAFETY') {
                     errorMessage = "Image generation blocked due to safety settings.";
                 } else if (finishReason === 'RECITATION') {
                     errorMessage = "Image generation blocked due to potential recitation issues.";
                 } else if (!aggregatedResponse.candidates || aggregatedResponse.candidates.length === 0) {
                     errorMessage = "No candidates returned by Gemini API.";
                 }
                 throw new Error(errorMessage);
             }

            // Find the part containing the image data
            const imageOutputPart = aggregatedResponse.candidates[0].content.parts.find(part => part.inlineData && part.inlineData.data);

            if (!imageOutputPart || !imageOutputPart.inlineData) {
                logger.error("Gemini response did not contain image data", { response: JSON.stringify(aggregatedResponse) });
                throw new Error("Gemini response did not contain the expected image data.");
            }

            const generatedImageBase64 = imageOutputPart.inlineData.data;
            const generatedMimeType = imageOutputPart.inlineData.mimeType || 'image/png'; // Assume png if not specified

            logger.info(`Received Gemini Pro response with image data for ${projectId}`);

            // --- Upload the generated base64 image to Firebase Storage ---
            const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
            const fileName = `generated-images/${projectId}/${Date.now()}.${generatedMimeType.split('/')[1] || 'png'}`;
            const imageStorageRef = admin.storage().bucket().file(fileName);

            await imageStorageRef.save(imageBuffer, {
                metadata: {
                    contentType: generatedMimeType
                }
            });

            // Get the public URL of the uploaded image
            const [url] = await imageStorageRef.getSignedUrl({
                action: 'read',
                expires: '03-01-2500' // Far future expiration
            });

            logger.info(`Generated image saved to Firebase Storage for ${projectId}`);

            // Store the URL for later use
            generatedImageUrl = url;

        } catch (geminiError) {
            logger.error(`Error generating image with Gemini for project ${projectId}:`, geminiError);
            // Use a placeholder image if Gemini fails
            const errorMessage = geminiError instanceof Error ? geminiError.message : "Unknown AI image generation error";
            generatedImageUrl = `https://via.placeholder.com/1024x1024.png/ff0000/FFFFFF?text=AI+Edit+Failed:+${encodeURIComponent(errorMessage.substring(0, 50))}`;
            // Update Firestore with the specific error message from Gemini
            await snapshot.ref.update({ aiStatus: "failed", aiError: errorMessage });
            // Re-throw the error if you want the function execution to reflect the failure, 
            // otherwise let it proceed to update Firestore with the placeholder URL
            // throw geminiError; // Optional: uncomment if failure should stop execution here
        }

        // --- Step 4: Update Firestore with Final Results ---
        if (!snapshot) {
            logger.error("Cannot update Firestore: snapshot is undefined");
            return;
        }
        
        logger.info(`Updating Firestore for project ${projectId} with AI results.`);
        // Use snapshot.ref for v2 triggers
        await snapshot.ref.update({
            aiStatus: "completed",
            aiSuggestions: analysisResult.suggestions || [],
            aiTotalEstimatedCost: analysisResult.totalEstimatedCost || 0,
            aiEstimatedValueAdded: analysisResult.estimatedValueAdded || 0,
            aiAfterImageDescription: analysisResult.afterImageDescription || "", 
            aiGeneratedImageURL: generatedImageUrl || null,
            aiError: null,
            aiProcessedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Successfully processed project ${projectId}`);

    } catch (error) {
        logger.error(`Error processing project ${projectId}:`, error);
        // Update Firestore using snapshot.ref
        if (snapshot) {
            await snapshot.ref.update({
                aiStatus: "failed",
                aiError: error instanceof Error ? error.message : "An unknown error occurred during AI processing.",
                aiProcessedAt: FieldValue.serverTimestamp(),
            }).catch(updateError => {
                logger.error(`Failed to update project ${projectId} with error status:`, updateError);
            });
        }
    }
});