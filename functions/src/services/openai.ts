import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as logger from "firebase-functions/logger";
import OpenAI from 'openai';

export async function getOpenAIApiKey(): Promise<string> {
  logger.info("Initializing Secret Manager client...");
  const secretClient = new SecretManagerServiceClient();
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || '517067540669';
  const secretName = `projects/${projectId}/secrets/openai-api-key/versions/latest`;
  
  logger.info(`Fetching secret: ${secretName}`);
  try {
    const [version] = await secretClient.accessSecretVersion({ name: secretName });
    const apiKey = version.payload?.data?.toString();
    if (!apiKey) {
      throw new Error("Secret payload data is empty or undefined.");
    }
    logger.info("Secret retrieved successfully from Secret Manager.");
    return apiKey;
  } catch (secretError) {
    logger.error("Critical: Failed to retrieve OpenAI API key from Secret Manager:", secretError);
    throw new Error("Failed to retrieve API credentials."); // Re-throw critical error
  }
}

export async function getOpenAIClient(): Promise<OpenAI> {
  try {
    const apiKey = await getOpenAIApiKey();
    return new OpenAI({ apiKey });
  } catch (error) {
    logger.error("Failed to initialize OpenAI client:", error);
    throw error;
  }
}

const enhancedDescriptionsCache = new Map<string, string>();

export async function enhanceDIYDescription(
  item: string,
  description: string,
  cost: number,
  roomType: string,
  style: string
): Promise<string> {
  const cacheKey = `${item}-${description}-${cost}-${roomType}-${style}`;
  
  if (enhancedDescriptionsCache.has(cacheKey)) {
    logger.info(`Using cached enhanced description for ${item}`);
    return enhancedDescriptionsCache.get(cacheKey) as string;
  }
  
  try {
    const openai = await getOpenAIClient();
    
    const prompt = `
      Enhance the following DIY home improvement description to make it more detailed, 
      engaging, and helpful for a homeowner planning a renovation:
      
      Item: ${item}
      Basic Description: ${description}
      Approximate Cost: $${cost}
      Room Type: ${roomType}
      Design Style: ${style}
      
      Provide a detailed, engaging paragraph (100-150 words) that:
      1. Explains what the improvement entails
      2. Mentions specific materials or techniques that would work well
      3. Highlights the visual impact and benefits
      4. Includes practical tips for implementation
      5. Maintains the specified design style
      
      Return ONLY the enhanced description text without any additional formatting or labels.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a home renovation expert who provides detailed, practical advice for DIY improvements." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    const enhancedDescription = response.choices[0]?.message?.content?.trim() || description;
    
    enhancedDescriptionsCache.set(cacheKey, enhancedDescription);
    
    return enhancedDescription;
  } catch (error) {
    logger.error(`Error enhancing description for ${item}:`, error);
    return description;
  }
}

export async function enhanceDIYDescriptionsBatch(
  improvements: Array<{
    item: string;
    description: string;
    cost: number;
  }>,
  roomType: string,
  style: string
): Promise<Array<{
  item: string;
  description: string;
  enhancedDescription: string;
  cost: number;
}>> {
  const results = await Promise.all(
    improvements.map(async (improvement, index) => {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * index));
      }
      
      try {
        const enhancedDescription = await enhanceDIYDescription(
          improvement.item,
          improvement.description,
          improvement.cost,
          roomType,
          style
        );
        
        return {
          ...improvement,
          enhancedDescription
        };
      } catch (error) {
        logger.error(`Error enhancing description for ${improvement.item}:`, error);
        return {
          ...improvement,
          enhancedDescription: improvement.description // Use original if enhancement fails
        };
      }
    })
  );
  
  return results;
}
