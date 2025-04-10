import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to extract unique image URLs from projects
export const getUniquePhotoUrls = (projects: QueryDocumentSnapshot<DocumentData>[]): string[] => {
  const urls = new Set<string>();
  projects.forEach(doc => {
    const data = doc.data();
    if (data.uploadedImageURL && typeof data.uploadedImageURL === 'string') {
      urls.add(data.uploadedImageURL);
    }
  });
  return Array.from(urls);
};
