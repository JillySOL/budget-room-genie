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

export interface DIYSuggestion {
  item: string;
  description: string;
  cost: number;
}

export interface GeneratedSuggestions {
  suggestions: DIYSuggestion[];
  totalEstimatedCost: number;
  estimatedValueAdded: number;
}

export async function generateDIYSuggestionsWithAI(
  roomType: string,
  budget: string,
  style: string,
  renovationType: string
): Promise<GeneratedSuggestions> {
  const budgetNum = parseInt(budget, 10) || 500;

  const renovationTypeMap: Record<string, string> = {
    budget: `BUDGET COSMETIC FLIP (under $${budgetNum}): cosmetic-only changes — paint, fixtures, soft furnishings, décor, accessories. No flooring, cabinetry, or structural changes.`,
    full: `FULL RENOVATION (up to $${budgetNum}): complete transformation — flooring, cabinetry, countertops, fixtures, lighting, furniture. Make it look professionally renovated.`,
    visual: `DREAM VISUALIZATION (no budget limit): the most aspirational, premium version of this room in the ${style} style. No constraint on what can be changed.`,
  };
  const renovationScope = renovationTypeMap[renovationType] || renovationTypeMap["budget"];

  const systemPrompt = `You are a professional interior designer and licensed contractor. You generate accurate, specific, and realistic DIY renovation suggestions. You always respond with valid JSON only — no markdown, no commentary.`;

  const userPrompt = `Generate renovation suggestions for a ${roomType}.

Renovation type: ${renovationScope}
Design style: ${style}
Budget: $${budgetNum}

Return a JSON object with this exact structure:
{
  "suggestions": [
    { "item": "...", "description": "...", "cost": 0 }
  ],
  "totalEstimatedCost": 0,
  "estimatedValueAdded": 0
}

Rules:
- 3 to 5 suggestions
- Each suggestion must be specific and actionable (not generic like "update décor")
- Descriptions should be 1-2 sentences explaining exactly what to do and the visual impact
- Individual costs must be realistic for a DIY approach in 2024 USD
- totalEstimatedCost must equal the sum of individual costs
- estimatedValueAdded should be 2x–4x the totalEstimatedCost for budget renovations, up to 5x for full
- For "budget" type: paint, hardware, soft furnishings, lighting only — no structural work
- For "full" type: flooring, cabinetry, countertops are allowed
- Apply the ${style} aesthetic to material and finish choices in descriptions`;

  try {
    const openai = await getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw) as GeneratedSuggestions;

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      throw new Error("Invalid suggestions structure returned from OpenAI");
    }

    logger.info(`Generated ${parsed.suggestions.length} AI suggestions for ${roomType}`);
    return parsed;
  } catch (error) {
    logger.error("Error generating DIY suggestions with OpenAI:", error);
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
