import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Validates JWT token from API Gateway event and extracts user ID
 * @param event APIGatewayProxyEvent containing JWT claims
 * @returns userId from JWT claims
 * @throws Error if JWT validation fails
 */
export const validateJWT = (event: APIGatewayProxyEvent): string => {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    
    if (!userId) {
        throw new Error('Unauthorized: User ID missing from JWT claims');
    }

    return userId;
};

/**
 * Formats error response with proper security headers
 * @param error Error object
 * @param statusCode HTTP status code (default: 500)
 * @returns Formatted API Gateway response
 */
export const formatErrorResponse = (error: Error, statusCode: number = 500) => {
    console.error('Security Error:', error);
    
    // Show validation errors in all environments, but hide internal errors in production
    const isValidationError = statusCode < 500;
    const message = isValidationError || process.env.NODE_ENV !== 'production' 
        ? error.message 
        : 'Internal server error';

    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            message,
            error: message
        })
    };
};

/**
 * Validates S3 key format and ownership
 * @param key S3 object key
 * @param userId User ID to validate ownership
 * @returns boolean indicating if key is valid and owned by user
 */
export const validateS3Key = (key: string | undefined, userId: string): boolean => {
    if (!key || typeof key !== 'string') return false;
    
    // Ensure key starts with user's upload or results directory
    return key.startsWith(`uploads/${userId}/`) || key.startsWith(`results/${userId}/`);
}; 