import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import jwt from 'jsonwebtoken';

const secretsClient = new SecretsManagerClient({});

interface ClerkJWTPayload {
  azp: string;  // Authorized party (your API endpoint)
  sub: string;  // Subject (user ID)
  exp: number;  // Expiration time
  iat: number;  // Issued at time
}

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    // Get Clerk secret key from Secrets Manager
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({
        SecretId: process.env.CLERK_SECRET_KEY_NAME,
      })
    );

    const clerkSecretKey = secretResponse.SecretString;
    if (!clerkSecretKey) {
      throw new Error('Clerk secret key not found');
    }

    // Extract token from Authorization header
    const token = event.authorizationToken.replace('Bearer ', '');

    // Verify JWT
    const decoded = jwt.verify(token, clerkSecretKey) as ClerkJWTPayload;

    // Verify audience (azp) matches your API endpoint
    if (decoded.azp !== 'https://jiov4el7d0.execute-api.ap-southeast-2.amazonaws.com') {
      throw new Error('Invalid token audience');
    }

    // Generate IAM policy
    return {
      principalId: decoded.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
      context: {
        userId: decoded.sub,
      },
    };
  } catch (error) {
    console.error('Authorization error:', error);
    throw new Error('Unauthorized');
  }
}; 