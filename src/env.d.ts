/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_STRIPE_PRICE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 