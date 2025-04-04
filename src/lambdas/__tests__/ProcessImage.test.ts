import { handler } from '../ProcessImage';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Mock DynamoDB
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('ProcessImage Lambda', () => {
    beforeEach(() => {
        ddbMock.reset();
        // Mock successful DynamoDB put
        ddbMock.on(PutCommand).resolves({});
    });

    it('should process valid request successfully', async () => {
        const mockEvent = {
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'user123'
                        }
                    }
                }
            },
            body: JSON.stringify({
                key: 'uploads/user123/test-image.jpg',
                projectDetails: {
                    roomType: 'bathroom',
                    budget: 1000,
                    style: 'modern',
                    renovationType: 'full',
                    instructions: 'Test instructions'
                }
            })
        };

        const response = await handler(mockEvent as any);
        expect(response.statusCode).toBe(200);
        
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('jobId');
        expect(body).toHaveProperty('projectId');
        expect(body).toHaveProperty('status', 'COMPLETE');

        // Verify DynamoDB was called
        expect(ddbMock.calls()).toHaveLength(1);
    });

    it('should reject invalid image key', async () => {
        const mockEvent = {
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'user123'
                        }
                    }
                }
            },
            body: JSON.stringify({
                key: 'uploads/different-user/test-image.jpg',
                projectDetails: {
                    roomType: 'bathroom',
                    budget: 1000,
                    style: 'modern',
                    renovationType: 'full'
                }
            })
        };

        const response = await handler(mockEvent as any);
        expect(response.statusCode).toBe(403);
        expect(response.body).toContain('Invalid or unauthorized image key');
    });

    it('should reject invalid project details', async () => {
        const mockEvent = {
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'user123'
                        }
                    }
                }
            },
            body: JSON.stringify({
                key: 'uploads/user123/test-image.jpg',
                projectDetails: {
                    // Missing required fields
                    roomType: 'bathroom'
                }
            })
        };

        const response = await handler(mockEvent as any);
        expect(response.statusCode).toBe(400);
        expect(response.body).toContain('Missing required field');
    });

    it('should reject invalid budget', async () => {
        const mockEvent = {
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'user123'
                        }
                    }
                }
            },
            body: JSON.stringify({
                key: 'uploads/user123/test-image.jpg',
                projectDetails: {
                    roomType: 'bathroom',
                    budget: -100, // Invalid negative budget
                    style: 'modern',
                    renovationType: 'full'
                }
            })
        };

        const response = await handler(mockEvent as any);
        expect(response.statusCode).toBe(400);
        expect(response.body).toContain('Budget must be a positive number');
    });

    it('should handle DynamoDB errors', async () => {
        // Mock DynamoDB error
        ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

        const mockEvent = {
            requestContext: {
                authorizer: {
                    jwt: {
                        claims: {
                            sub: 'user123'
                        }
                    }
                }
            },
            body: JSON.stringify({
                key: 'uploads/user123/test-image.jpg',
                projectDetails: {
                    roomType: 'bathroom',
                    budget: 1000,
                    style: 'modern',
                    renovationType: 'full'
                }
            })
        };

        const response = await handler(mockEvent as any);
        expect(response.statusCode).toBe(500);
        
        if (process.env.NODE_ENV === 'development') {
            expect(response.body).toContain('DynamoDB error');
        } else {
            expect(response.body).toContain('Internal server error');
        }
    });
}); 