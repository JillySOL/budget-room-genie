import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const secretsManager = new SecretsManagerClient();
const dynamodb = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodb);

interface RequestBody {
  imageUrl: string;
  style: string;
  roomType: string;
  budgetRange: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const body: RequestBody = JSON.parse(event.body);
    const { imageUrl, style, roomType, budgetRange } = body;

    // Get user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    const isAnonymous = !userId;

    // Check if user has exceeded free tier limit
    if (isAnonymous) {
      const renderLogs = await docClient.send(
        new GetCommand({
          TableName: 'RenoMateRenderLogs',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: {
            ':userId': 'anonymous',
          },
        })
      );

      if (renderLogs.Items && renderLogs.Items.length >= 1) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Free tier limit reached. Please sign up to continue.',
          }),
        };
      }
    } else {
      // Check if user is pro
      const user = await docClient.send(
        new GetCommand({
          TableName: 'RenoMateUsers',
          Key: { id: userId },
        })
      );

      if (!user.Item?.is_pro) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: 'Pro subscription required. Please upgrade to continue.',
          }),
        };
      }
    }

    // Get OpenAI API key from Secrets Manager
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.OPENAI_API_KEY_SECRET_NAME,
      })
    );

    const openaiApiKey = JSON.parse(secretResponse.SecretString || '{}').apiKey;
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Generate room redesign using GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert interior designer. Generate a detailed room redesign based on the provided image, style, room type, and budget range. Include specific recommendations for furniture, colors, materials, and estimated costs.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please redesign this ${roomType} in a ${style} style with a budget range of ${budgetRange}. Provide specific recommendations and cost estimates.`,
            },
            {
              type: 'image_url',
              image_url: imageUrl,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const redesign = response.choices[0].message.content;

    // Generate image using DALL-E
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `A professional interior design rendering of a ${roomType} in ${style} style, high-end architectural visualization, photorealistic, 4K quality`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const generatedImageUrl = imageResponse.data[0].url;

    // Save render log
    const renderId = uuidv4();
    await docClient.send(
      new PutCommand({
        TableName: 'RenoMateRenderLogs',
        Item: {
          id: renderId,
          user_id: userId || 'anonymous',
          render_type: isAnonymous ? 'initial_free' : 'pro_render',
          created_at: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        renderId,
        redesign,
        generatedImageUrl,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
} 