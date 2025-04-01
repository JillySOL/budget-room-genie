export function validateEnvironmentVariables() {
  const requiredVars = {
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and make sure all required variables are set.'
    );
  }

  // Validate Clerk key format
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey?.startsWith('pk_test_') && !clerkKey?.startsWith('pk_live_')) {
    throw new Error(
      'Invalid Clerk publishable key format. Key should start with "pk_test_" or "pk_live_"'
    );
  }
} 