import { Clerk } from '@clerk/clerk-sdk-node';
import { expect } from 'chai';
import axios from 'axios';

describe('Authentication Flow', () => {
  const apiEndpoint = process.env.VITE_API_ENDPOINT;
  const clerkPubKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  before(() => {
    if (!apiEndpoint || !clerkPubKey || !clerkSecretKey) {
      throw new Error('Missing required environment variables');
    }
  });

  describe('User Registration', () => {
    it('should create a new user', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';

      const user = await Clerk.users.createUser({
        emailAddress: [email],
        password,
      });

      expect(user).to.have.property('id');
      expect(user.emailAddresses[0].emailAddress).to.equal(email);
    });
  });

  describe('User Login', () => {
    it('should authenticate user and get JWT token', async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';

      // Create user
      const user = await Clerk.users.createUser({
        emailAddress: [email],
        password,
      });

      // Get session token
      const session = await Clerk.sessions.createSession({
        userId: user.id,
      });

      expect(session).to.have.property('token');
    });
  });

  describe('Protected API Access', () => {
    let token: string;

    before(async () => {
      // Create and login user
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!';

      const user = await Clerk.users.createUser({
        emailAddress: [email],
        password,
      });

      const session = await Clerk.sessions.createSession({
        userId: user.id,
      });

      token = session.token;
    });

    it('should access protected endpoint with valid token', async () => {
      const response = await axios.get(`${apiEndpoint}/my-photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.status).to.equal(200);
    });

    it('should reject request without token', async () => {
      try {
        await axios.get(`${apiEndpoint}/my-photos`);
        throw new Error('Request should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should reject request with invalid token', async () => {
      try {
        await axios.get(`${apiEndpoint}/my-photos`, {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        });
        throw new Error('Request should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });
}); 