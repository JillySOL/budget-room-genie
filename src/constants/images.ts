export const IMAGES = {
  BEFORE: "/before.png",
  AFTER: "/after.png",
} as const;

// Type for image keys
export type ImageKey = keyof typeof IMAGES; 