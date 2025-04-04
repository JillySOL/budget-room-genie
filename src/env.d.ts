/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_AWS_REGION: string
  readonly VITE_AWS_ACCESS_KEY_ID: string
  readonly VITE_AWS_SECRET_ACCESS_KEY: string
  readonly VITE_S3_BUCKET_NAME: string
  readonly VITE_API_ENDPOINT: string
  readonly VITE_STRIPE_PRICE_ID: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 