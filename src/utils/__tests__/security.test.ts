import { validateJWT, formatErrorResponse, validateS3Key } from '../security';

describe('Security Utilities', () => {
    describe('validateJWT', () => {
        it('should return userId when JWT is valid', () => {
            const mockEvent = {
                requestContext: {
                    authorizer: {
                        jwt: {
                            claims: {
                                sub: 'user123'
                            }
                        }
                    }
                }
            };

            const userId = validateJWT(mockEvent as any);
            expect(userId).toBe('user123');
        });

        it('should throw error when JWT is missing', () => {
            const mockEvent = {
                requestContext: {}
            };

            expect(() => validateJWT(mockEvent as any)).toThrow('Unauthorized: User ID missing from JWT claims');
        });
    });

    describe('formatErrorResponse', () => {
        it('should format error response with development details', () => {
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');
            const response = formatErrorResponse(error, 400);

            expect(response.statusCode).toBe(400);
            expect(response.body).toContain('Test error');
        });

        it('should hide error details in production', () => {
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');
            const response = formatErrorResponse(error);

            expect(response.statusCode).toBe(500);
            expect(response.body).not.toContain('Test error');
            expect(response.body).toContain('Internal server error');
        });
    });

    describe('validateS3Key', () => {
        it('should validate correct S3 key format', () => {
            const userId = 'user123';
            const validKey = `uploads/${userId}/image.jpg`;
            
            expect(validateS3Key(validKey, userId)).toBe(true);
        });

        it('should reject incorrect S3 key format', () => {
            const userId = 'user123';
            const invalidKey = 'uploads/otheruser/image.jpg';
            
            expect(validateS3Key(invalidKey, userId)).toBe(false);
        });

        it('should handle undefined or invalid key types', () => {
            const userId = 'user123';
            
            expect(validateS3Key(undefined, userId)).toBe(false);
            expect(validateS3Key(123 as any, userId)).toBe(false);
        });
    });
}); 