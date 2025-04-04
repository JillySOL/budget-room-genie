RenoMate-ProcessImage:

// RenoMate-ProcessImage Lambda (Mock Implementation)
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto'); // For generating UUIDs

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'renomate-projects'; // Make sure this matches your DynamoDB table name

// --- Mock Data Generation ---
function generateMockSuggestions(roomType) {
    // Return simple, consistent mock suggestions based on room type
    const suggestions = {
        bathroom: [
            { id: crypto.randomUUID(), title: "Mock: Paint Wall (Neutral)", description: "Mock suggestion: Painted the wall a neutral tone.", cost: 150 },
            { id: crypto.randomUUID(), title: "Mock: Replace Shower Curtain", description: "Mock suggestion: Swapped the curtain.", cost: 80 },
        ],
        kitchen: [
            { id: crypto.randomUUID(), title: "Mock: Update Cabinet Hardware", description: "Mock suggestion: Replaced hardware.", cost: 75 },
            { id: crypto.randomUUID(), title: "Mock: Add Backsplash", description: "Mock suggestion: Installed a simple backsplash.", cost: 200 },
        ],
        // Add other room types as needed
    };
    // Return specific suggestions or a default set
    return suggestions[roomType?.toLowerCase()] || [
        { id: crypto.randomUUID(), title: "Mock: Fresh Paint", description: "Mock suggestion: Applied new paint.", cost: 100 },
        { id: crypto.randomUUID(), title: "Mock: Update Lighting", description: "Mock suggestion: Installed new lights.", cost: 120 },
    ];
}

// --- Helper Functions ---
function formatResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            // IMPORTANT: Ensure CORS headers are consistent with your API Gateway settings
            'Access-Control-Allow-Origin': '*', // Adjust if needed for specific origins
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(body)
    };
}

// Generate a more unique project ID
function generateProjectId(base = 'project') {
    const safeBase = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
    return `${safeBase}-${crypto.randomUUID()}`;
}


// --- Lambda Handler ---
exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        // Get user ID from JWT claims (adjust path if needed based on your authorizer config)
        const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
        if (!userId) {
            console.error("User ID not found in JWT claims");
            return formatResponse(401, { message: 'Unauthorized: User ID missing.' });
        }

        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error("Failed to parse request body:", parseError);
            return formatResponse(400, { message: 'Invalid request body.' });
        }

        // Extract key and projectDetails (as sent by the frontend Task 6)
        const imageKey = requestBody.key;
        const projectDetails = requestBody.projectDetails;

        // Validate input
        if (!imageKey || typeof imageKey !== 'string') {
             return formatResponse(400, { message: 'Missing or invalid image key.' });
        }
        if (!projectDetails || typeof projectDetails !== 'object') {
            return formatResponse(400, { message: 'Missing or invalid projectDetails.' });
        }
        const requiredDetails = ['roomType', 'budget', 'style', 'renovationType'];
        for (const field of requiredDetails) {
            if (!projectDetails[field]) {
                return formatResponse(400, { message: `Missing required field in projectDetails: ${field}` });
            }
        }

        // --- Mock Generation Logic ---
        const projectId = generateProjectId(projectDetails.roomType);
        const jobId = crypto.randomUUID(); // For frontend polling mechanism
        const mockAfterImageKey = imageKey; // Reuse original image as 'after' for mock
        const mockSuggestions = generateMockSuggestions(projectDetails.roomType);
        const mockTotalCost = mockSuggestions.reduce((sum, item) => sum + item.cost, 0);
        const timestamp = new Date().toISOString();

        // Prepare item for DynamoDB - combining user input and mock results
        const projectItem = {
            userId: userId,
            id: projectId, // Generated project ID
            title: `${projectDetails.style} ${projectDetails.roomType} (${projectDetails.renovationType})`, // Example title
            // User Input Details:
            roomType: projectDetails.roomType,
            budget: Number(projectDetails.budget) || 0, // Ensure budget is a number
            style: projectDetails.style,
            renovationType: projectDetails.renovationType,
            instructions: projectDetails.instructions || '',
            beforeImageKey: imageKey,
            // Mock Generated Details:
            afterImageKey: mockAfterImageKey,
            diySuggestions: mockSuggestions,
            totalCost: mockTotalCost,
            status: 'COMPLETE', // Mock processing is instant
            // Timestamps
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        // Save to DynamoDB
        const command = new PutCommand({
            TableName: tableName,
            Item: projectItem
        });

        await docClient.send(command);
        console.log(`Project ${projectId} saved successfully for user ${userId}`);

        // Return jobId and projectId as expected by frontend flow (Task 6)
        return formatResponse(200, {
            jobId: jobId,
            projectId: projectId,
            status: 'COMPLETE' // Let frontend know it's done
        });

    } catch (error) {
        console.error('Error in RenoMate-ProcessImage:', error);
        // Provide a more generic error message to the client
        return formatResponse(500, {
            message: 'Failed to process request due to an internal error.'
            // Avoid sending detailed error messages like error.message to the client
        });
    }
};


RenoMate-ListUserPhotos:
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client outside the handler for reuse
// Ensure AWS_REGION environment variable is set in Lambda config
const s3Client = new S3Client({ region: process.env.AWS_REGION });
// Ensure BUCKET_NAME environment variable is set in Lambda config
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Basic check for environment variable configuration
    if (!BUCKET_NAME || !process.env.AWS_REGION) {
        console.error("Error: Required environment variables (BUCKET_NAME, AWS_REGION) are not set.");
        return {
            statusCode: 500,
            headers: { // CORS Headers for error responses too
                "Access-Control-Allow-Origin": "*", // Or restrict to your Vercel domain
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
             },
            body: JSON.stringify({ message: "Internal server configuration error." }),
        };
    }

    let userId;
    try {
        // Attempt to extract userId from common locations in API Gateway JWT authorizer claims
        // Adjust these paths if your authorizer configuration places the 'sub' claim elsewhere
        userId = event.requestContext?.authorizer?.jwt?.claims?.sub || event.requestContext?.authorizer?.claims?.sub;

        if (!userId) {
            console.error("Error: Could not extract userId from authorizer claims.", JSON.stringify(event.requestContext?.authorizer, null, 2));
            return {
                statusCode: 401, // Unauthorized
                 headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    "Access-Control-Allow-Methods": "GET,OPTIONS"
                 },
                body: JSON.stringify({ message: "Unauthorized: User ID not found in token claims." }),
            };
        }
         console.log("Authenticated userId:", userId);

    } catch (error) {
        console.error("Error accessing or processing authorizer claims:", error);
         return {
            statusCode: 401,
             headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
             },
            body: JSON.stringify({ message: "Unauthorized: Error processing authentication token." }),
        };
    }

    // Define parameters for listing objects for the specific user
    const listParams = {
        Bucket: BUCKET_NAME,
        Prefix: `uploads/${userId}/`, // Only list objects under the user's prefix
    };

    try {
        console.log(`Listing objects with prefix: ${listParams.Prefix}`);
        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await s3Client.send(listCommand);
         console.log(`Found ${listResponse.Contents?.length || 0} items in S3 response.`);

        // Filter out any potential "folder" objects and generate pre-signed URLs
        const photoPromises = (listResponse.Contents || [])
            .filter(item => item.Key && item.Size > 0 && !item.Key.endsWith('/')) // Ensure it's a file, not a pseudo-folder
            .map(async (item) => {
                const getObjectParams = {
                    Bucket: BUCKET_NAME,
                    Key: item.Key,
                };
                try {
                    const command = new GetObjectCommand(getObjectParams);
                    // Generate a pre-signed URL valid for 15 minutes (900 seconds)
                    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
                    return { key: item.Key, url: url };
                } catch (urlError) {
                     console.error(`Error generating signed URL for key ${item.Key}:`, urlError);
                     // Return null or a specific error object if needed, instead of failing the whole batch
                     return null;
                }
            });

        // Wait for all URL generation promises to resolve
        const photosRaw = await Promise.all(photoPromises);
        // Filter out any null results from URL generation errors
        const photos = photosRaw.filter(p => p !== null);

        console.log(`Successfully generated ${photos.length} signed URLs for user ${userId}`);

        // Return the list of photos with their pre-signed URLs
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // IMPORTANT for CORS - Or restrict to your Vercel domain
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,OPTIONS" // Allow GET and OPTIONS for CORS preflight
             },
            body: JSON.stringify(photos),
        };

    } catch (error) {
        console.error("Error listing objects or generating signed URLs:", error);
        return {
            statusCode: 500,
             headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,OPTIONS"
             },
            body: JSON.stringify({ message: "Failed to retrieve photos.", error: error.message }),
        };
    }
};


RenoMate-GetStatusResult:
export const handler = async (event) => {
  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};


RenoMate-SaveProject:

// Replace your Lambda code with this:
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient();

exports.handler = async (event) => {
    try {
        // Parse request body
        const requestBody = JSON.parse(event.body);
        
        // Get user ID from JWT claims
        const userId = event.requestContext.authorizer.jwt.claims.sub;
        
        // Validate required fields
        const requiredFields = ['roomType', 'budget', 'style', 'renovationType', 'beforeImageKey'];
        for (const field of requiredFields) {
            if (!requestBody[field]) {
                return formatResponse(400, { 
                    message: `Missing required field: ${field}`
                });
            }
        }
        
        // Generate project ID if not provided
        const projectId = requestBody.id || generateProjectId(requestBody.roomType);
        
        // Prepare item for DynamoDB
        const timestamp = new Date().toISOString();
        const projectItem = {
            userId: userId,
            id: projectId,
            title: requestBody.title || `${requestBody.roomType} Project`,
            roomType: requestBody.roomType,
            budget: requestBody.budget,
            style: requestBody.style,
            renovationType: requestBody.renovationType,
            instructions: requestBody.instructions || '',
            beforeImageKey: requestBody.beforeImageKey,
            afterImageKey: requestBody.afterImageKey || null,
            diySuggestions: requestBody.diySuggestions || [],
            createdAt: requestBody.createdAt || timestamp,
            updatedAt: timestamp,
            status: requestBody.status || 'PENDING',
            totalCost: calculateTotalCost(requestBody.diySuggestions || [])
        };
        
        // Save to DynamoDB
        const command = new PutItemCommand({
            TableName: 'renomate-projects',
            Item: marshall(projectItem)
        });
        
        await dynamoClient.send(command);
        
        return formatResponse(200, { 
            message: 'Project saved successfully',
            projectId: projectId
        });
    } catch (error) {
        console.error('Error saving project:', error);
        return formatResponse(500, { 
            message: 'Failed to save project',
            error: error.message
        });
    }
};

// Helper to calculate total cost from DIY suggestions
function calculateTotalCost(suggestions) {
    return suggestions.reduce((total, suggestion) => total + (suggestion.cost || 0), 0);
}

// Helper to generate a URL-friendly project ID
function generateProjectId(roomType) {
    const base = roomType.toLowerCase().replace(/\s+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${randomSuffix}`;
}

// Helper to format API Gateway response
function formatResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify(body)
    };
}



RenoMate-GeneratePresignedUrl:
// Full implementation with S3 pre-signed URL generation using ES modules
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

// Bucket name from environment variable
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'renomate-uploads-jp-12';

export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or specific origins
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  try {
    // Handle OPTIONS request (preflight)
    if (event.requestContext?.http?.method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error.message
        })
      };
    }
    
    const { fileName, contentType } = body;
    
    if (!fileName || !contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          requiredParams: ['fileName', 'contentType'] 
        })
      };
    }
    
    // Get user info from the auth context if available
    let userId = 'anonymous';
    if (event.requestContext?.authorizer?.jwt?.claims?.sub) {
      userId = event.requestContext.authorizer.jwt.claims.sub;
    }
    
    // Create a unique key for the upload
    const key = `uploads/${userId}/${Date.now()}-${fileName}`;
    
    // Create the command to put an object in S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });
    
    // Generate the pre-signed URL
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    console.log('Generated presigned URL:', uploadUrl);
    console.log('Object key:', key);
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        key
      })
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate upload URL',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};


RenoMate-ListUserProjects:
// *** UPDATED CODE (ES Module Syntax with Pre-signed URLs) ***
// RenoMate-ListUserProjects Lambda
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"; // Added S3 Client and GetObjectCommand
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Added getSignedUrl

const dynamoClient = new DynamoDBClient({}); // DynamoDB Client
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({}); // S3 Client

const tableName = process.env.TABLE_NAME || 'renomate-projects'; // DynamoDB table name
const bucketName = process.env.S3_BUCKET_NAME || 'renomate-uploads-jp-12'; // S3 Bucket Name
const signedUrlExpiry = 900; // 15 minutes expiry for URLs

// Helper to format API Gateway response
function formatResponse(statusCode, body, additionalHeaders = {}) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Adjust as necessary
            'Access-Control-Allow-Credentials': true,
            ...additionalHeaders
        },
        body: JSON.stringify(body)
    };
}

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    // Get user ID from JWT claims
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
        console.error("User ID not found in JWT claims");
        return formatResponse(401, { message: 'Unauthorized: User ID missing.' });
    }

    console.log(`Querying projects for userId: ${userId}`);

    // Query DynamoDB for user's projects
    const queryCommand = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    });

    const dynamoResponse = await docClient.send(queryCommand);
    const items = dynamoResponse.Items || [];
    console.log(`Found ${items.length} projects for user ${userId}`);

    // Generate pre-signed URLs for each project's thumbnail
    const projectsWithUrls = await Promise.all(items.map(async (project) => {
      // Determine the key for the thumbnail (prefer 'after' image, fallback to 'before')
      const imageKey = project.afterImageKey || project.beforeImageKey;
      let thumbnailUrl = '/placeholder-image.png'; // Default fallback URL

      if (imageKey && typeof imageKey === 'string') {
        try {
          const getObjectParams = {
              Bucket: bucketName,
              Key: imageKey,
          };
          const command = new GetObjectCommand(getObjectParams);
          // Generate the pre-signed URL
          thumbnailUrl = await getSignedUrl(s3Client, command, { expiresIn: signedUrlExpiry });
        } catch (urlError) {
          console.error(`Error generating signed URL for key ${imageKey}:`, urlError);
          // If URL generation fails, keep the default fallback URL
        }
      }

      // Return the project object augmented with the thumbnailUrl
      return {
          ...project,
          thumbnailUrl: thumbnailUrl // Add the generated or fallback URL
      };
    }));

    console.log(`Processed ${projectsWithUrls.length} projects with signed URLs.`);

    return formatResponse(200, projectsWithUrls); // Return the array of projects with URLs

  } catch (error) {
    console.error('Error retrieving user projects or generating URLs:', error);
    return formatResponse(500, {
        message: 'Failed to retrieve user projects due to an internal error.'
    });
  }
};
// *** END UPDATED CODE ***

// --- NEW LAMBDA FUNCTION: RenoMate-GetProject ---
// --- RenoMate-GetProject (Original with Enhanced Logging) ---
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize clients
console.log("Initializing AWS SDK clients...");
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
console.log("AWS SDK clients initialized.");

// Configuration
const tableName = process.env.TABLE_NAME || 'renomate-projects';
const bucketName = process.env.S3_BUCKET_NAME || 'renomate-uploads-jp-12';
const signedUrlExpiry = 900; 
const defaultImageUrl = '/placeholder-image.png'; 

// Helper function to generate a signed URL safely
async function generatePresignedUrlForKey(key) {
  console.log(`Attempting to generate pre-signed URL for key: ${key}`);
  if (!key || typeof key !== 'string') {
    console.warn(`Invalid or missing key provided: ${key}. Returning default URL.`);
    return defaultImageUrl; 
  }
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: signedUrlExpiry });
    console.log(`Successfully generated pre-signed URL for key: ${key}`);
    return url;
  } catch (error) {
    // Log the specific error during URL generation
    console.error(`!!! ERROR generating pre-signed URL for key ${key}:`, error); 
    return defaultImageUrl; // Return default on error
  }
}

// Helper to format API Gateway response
function formatResponse(statusCode, body, additionalHeaders = {}) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Credentials': true,
            ...additionalHeaders
        },
        body: JSON.stringify(body)
    };
}

export const handler = async (event) => {
  // Log entry and event immediately
  console.log("--- RenoMate-GetProject Handler invoked (Enhanced Logging) ---");
  console.log("Received Event:", JSON.stringify(event, null, 2));

  let projectId = event.pathParameters?.projectId; // Keep projectId accessible for catch block

  try {
    // 1. Extract Project ID
    if (!projectId) {
      console.error("Missing projectId in path.");
      return formatResponse(400, { message: 'Missing projectId in path.' });
    }
    console.log(`Extracted projectId: ${projectId}`);

    // 2. Extract User ID
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      console.error("User ID not found in JWT claims");
      return formatResponse(401, { message: 'Unauthorized: User ID missing.' });
    }
    console.log(`Extracted userId: ${userId}`);

    // 3. Retrieve project details from DynamoDB
    console.log(`Attempting to fetch project from DynamoDB. Table: ${tableName}, Key: { userId: ${userId}, id: ${projectId} }`);
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { 
        userId: userId,   // Provide Partition Key
        id: projectId     // Provide Sort Key
      }
    });
    const dynamoResponse = await docClient.send(getCommand);
    const project = dynamoResponse.Item;
    console.log("DynamoDB response received.");

    // 4. Handle Project Not Found
    if (!project) {
      console.warn(`Project ${projectId} not found in DynamoDB.`);
      return formatResponse(404, { message: 'Project not found.' });
    }
    console.log(`Project ${projectId} found.`);

    // 5. Verify Ownership
    console.log(`Verifying ownership. Project userId: ${project.userId}, Requesting userId: ${userId}`);
    if (project.userId !== userId) {
      console.warn(`Ownership verification failed for project ${projectId}.`);
      return formatResponse(403, { message: 'Forbidden: You do not have permission to access this project.' });
    }
    console.log("Ownership verified.");

    // 6. Generate Pre-signed URLs for images
    console.log("Generating pre-signed URL for beforeImageKey...");
    const beforeImageUrl = await generatePresignedUrlForKey(project.beforeImageKey);
    console.log("Generating pre-signed URL for afterImageKey...");
    const afterImageUrl = await generatePresignedUrlForKey(project.afterImageKey) || beforeImageUrl;
    console.log("Pre-signed URLs generated.");

    // 7. Construct response object
    const responseData = {
      ...project,
      beforeImageUrl: beforeImageUrl,
      afterImageUrl: afterImageUrl,
    };
    console.log("Constructed response data.");

    // 8. Return complete project data
    console.log(`Successfully processed request for project ${projectId}. Returning 200 OK.`);
    return formatResponse(200, responseData);

  } catch (error) {
    // Log the detailed error in the catch block
    console.error(`!!! UNHANDLED ERROR processing project ${projectId}:`, error); 
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    
    // Return the generic 500 error
    return formatResponse(500, {
        message: 'Failed to retrieve project details due to an internal server error.'
    });
  }
};
// --- END RenoMate-GetProject (Enhanced Logging) ---

