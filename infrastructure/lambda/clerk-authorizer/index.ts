import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { verify } from 'jsonwebtoken';

const secretsManager = new SecretsManagerClient();

async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({
    SecretId: secretName,
  });
  const response = await secretsManager.send(command);
  const secret = JSON.parse(response.SecretString || '{}');
  return secret.secretKey || secret.apiKey || secret.url || secret.key;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const token = event.authorizationToken;
    if (!token) {
      throw new Error('No authorization token provided');
    }

    // Get Clerk secret key from Secrets Manager
    const clerkSecretKey = await getSecret(process.env.CLERK_SECRET_KEY_NAME || '');

    // Verify the JWT token
    const decoded = verify(token, clerkSecretKey);

    // Return IAM policy
    return {
      principalId: decoded.sub || 'user',
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
        email: decoded.email,
      },
    };
  } catch (error) {
    console.error('Authorization error:', error);
    throw new Error('Unauthorized');
  }
}; 