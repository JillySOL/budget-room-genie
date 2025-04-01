export function validateEnvironmentVariables() {
  const requiredVars = {
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
    VITE_AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    VITE_AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    VITE_S3_BUCKET_NAME: import.meta.env.VITE_S3_BUCKET_NAME,
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
} 