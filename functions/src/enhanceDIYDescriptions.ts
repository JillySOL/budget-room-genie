import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onCall } from "firebase-functions/v2/https";
import { enhanceDIYDescriptionsBatch } from "./services/openai";
import { canUserGenerateDesign, getUserSubscription, subscriptionPlans } from "./services/subscriptions";

export const enhanceDIYDescriptions = onCall({
  maxInstances: 10,
  timeoutSeconds: 120,
  memory: "1GiB",
}, async (request) => {
  if (!request.auth) {
    logger.error("Unauthenticated call to enhanceDIYDescriptions");
    throw new Error("Authentication required");
  }
  
  const userId = request.auth.uid;
  const { improvements, roomType, style, projectId } = request.data;
  
  if (!improvements || !Array.isArray(improvements) || improvements.length === 0) {
    logger.error("Invalid improvements data:", improvements);
    throw new Error("Invalid improvements data");
  }
  
  if (!roomType || !style) {
    logger.error("Missing roomType or style:", { roomType, style });
    throw new Error("Room type and style are required");
  }
  
  try {
    const subscriptionCheck = await canUserGenerateDesign(userId);
    const subscription = subscriptionCheck.subscription || await getUserSubscription(userId);
    
    if (!subscription) {
      logger.error(`No subscription found for user ${userId}`);
      throw new Error("Subscription not found");
    }
    
    const plan = subscriptionPlans[subscription.planId];
    
    if (!plan.enhancedDescriptions) {
      logger.info(`User ${userId} does not have enhanced descriptions in their plan`);
      return {
        success: true,
        improvements: improvements.map(improvement => ({
          ...improvement,
          enhancedDescription: improvement.description
        }))
      };
    }
    
    logger.info(`Enhancing ${improvements.length} DIY descriptions for project ${projectId}`);
    const enhancedImprovements = await enhanceDIYDescriptionsBatch(
      improvements,
      roomType,
      style
    );
    
    if (projectId) {
      const db = admin.firestore();
      await db.collection('projects').doc(projectId).update({
        enhancedDIYSuggestions: enhancedImprovements,
        enhancedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`Updated project ${projectId} with enhanced descriptions`);
    }
    
    return {
      success: true,
      improvements: enhancedImprovements
    };
  } catch (error) {
    logger.error("Error enhancing DIY descriptions:", error);
    throw new Error("Failed to enhance DIY descriptions: " + (error instanceof Error ? error.message : "Unknown error"));
  }
});
