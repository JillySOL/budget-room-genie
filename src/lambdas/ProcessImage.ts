import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { validateJWT, formatErrorResponse, validateS3Key } from '../utils/security';
import crypto from 'crypto';

// Initialize DynamoDB clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME || 'renomate-projects';

// Types
interface ProjectDetails {
    roomType: string;
    budget: number;
    style: string;
    renovationType: string;
    instructions?: string;
}

interface DIYSuggestion {
    id: string;
    title: string;
    description: string;
    cost: number;
}

interface RequestBody {
    key: string;
    projectDetails: ProjectDetails;
}

// Helper function to generate mock suggestions based on room type
function generateMockSuggestions(roomType: string): DIYSuggestion[] {
    const suggestions: Record<string, DIYSuggestion[]> = {
        bathroom: [
            {
                id: crypto.randomUUID(),
                title: "Paint Wall (Neutral)",
                description: "Mock suggestion: Painted the wall a neutral tone.",
                cost: 150
            },
            {
                id: crypto.randomUUID(),
                title: "Replace Shower Curtain",
                description: "Mock suggestion: Swapped the curtain.",
                cost: 80
            },
        ],
        kitchen: [
            {
                id: crypto.randomUUID(),
                title: "Update Cabinet Hardware",
                description: "Mock suggestion: Replaced hardware.",
                cost: 75
            },
            {
                id: crypto.randomUUID(),
                title: "Add Backsplash",
                description: "Mock suggestion: Installed a simple backsplash.",
                cost: 200
            },
        ],
    };

    return suggestions[roomType?.toLowerCase()] || [
        {
            id: crypto.randomUUID(),
            title: "Fresh Paint",
            description: "Mock suggestion: Applied new paint.",
            cost: 100
        },
        {
            id: crypto.randomUUID(),
            title: "Update Lighting",
            description: "Mock suggestion: Installed new lights.",
            cost: 120
        },
    ];
}

// Generate a project ID
function generateProjectId(base: string = 'project'): string {
    const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
    return `${safeBase}-${crypto.randomUUID()}`;
}

// Lambda Handler
export const handler = async (event: APIGatewayProxyEvent) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        // Validate JWT and get userId
        const userId = validateJWT(event);

        // Parse and validate request body
        let requestBody: RequestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (error) {
            return formatErrorResponse(new Error('Invalid request body format'), 400);
        }

        // Validate image key
        if (!validateS3Key(requestBody.key, userId)) {
            return formatErrorResponse(new Error('Invalid or unauthorized image key'), 403);
        }

        // Validate project details
        const projectDetails = requestBody.projectDetails;
        if (!projectDetails || typeof projectDetails !== 'object') {
            return formatErrorResponse(new Error('Missing or invalid project details'), 400);
        }

        // Validate required fields
        const requiredFields = ['roomType', 'budget', 'style', 'renovationType'] as const;
        for (const field of requiredFields) {
            if (!projectDetails[field]) {
                return formatErrorResponse(
                    new Error(`Missing required field: ${field}`),
                    400
                );
            }
        }

        // Validate budget is a positive number
        const budget = Number(projectDetails.budget);
        if (isNaN(budget) || budget <= 0) {
            return formatErrorResponse(
                new Error('Budget must be a positive number'),
                400
            );
        }

        // Generate mock data
        const projectId = generateProjectId(projectDetails.roomType);
        const jobId = crypto.randomUUID();
        const mockAfterImageKey = requestBody.key; // Reuse original image for mock
        const mockSuggestions = generateMockSuggestions(projectDetails.roomType);
        const mockTotalCost = mockSuggestions.reduce((sum, item) => sum + item.cost, 0);
        const timestamp = new Date().toISOString();

        // Prepare item for DynamoDB
        const projectItem = {
            userId,
            id: projectId,
            title: `${projectDetails.style} ${projectDetails.roomType} (${projectDetails.renovationType})`,
            roomType: projectDetails.roomType,
            budget,
            style: projectDetails.style,
            renovationType: projectDetails.renovationType,
            instructions: projectDetails.instructions || '',
            beforeImageKey: requestBody.key,
            afterImageKey: mockAfterImageKey,
            diySuggestions: mockSuggestions,
            totalCost: mockTotalCost,
            status: 'COMPLETE',
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        // Save to DynamoDB
        await docClient.send(new PutCommand({
            TableName: tableName,
            Item: projectItem
        }));

        console.log(`Project ${projectId} saved successfully for user ${userId}`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({
                jobId,
                projectId,
                status: 'COMPLETE'
            })
        };

    } catch (error) {
        return formatErrorResponse(error as Error);
    }
}; 