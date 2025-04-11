// Use static imports to ensure the images are processed by webpack
import beforeImg from '/public/before.png';
import afterImg from '/public/after.png';

export const IMAGES = {
  BEFORE: beforeImg,
  AFTER: afterImg,
} as const;

// Type for image keys
export type ImageKey = keyof typeof IMAGES; 