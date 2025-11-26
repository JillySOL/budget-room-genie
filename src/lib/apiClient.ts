import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/firebase-config";
import type { User } from "firebase/auth";

const apiEndpoint = import.meta.env.VITE_API_ENDPOINT;

if (!apiEndpoint) {
  throw new Error("VITE_API_ENDPOINT is not configured in environment variables.");
}

// Interface for API client options
interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>; // Will be JSON.stringified for POST/PUT/PATCH
  headers?: Record<string, string>;
  // Add other fetch options if needed
}

/**
 * Gets the Firebase ID token for the current user.
 * @param user - The Firebase user object.
 * @returns The ID token string.
 */
async function getFirebaseToken(user: User): Promise<string> {
  return user.getIdToken();
}

/**
 * Makes an authenticated API request using Firebase Auth.
 * @param user - The Firebase user object.
 * @param path - The API path (e.g., '/my-photos').
 * @param options - Request options (method, body, etc.).
 * @returns The parsed JSON response.
 */
async function makeAuthenticatedRequest<T>(
  user: User,
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const token = await getFirebaseToken(user);
  if (!token) {
    throw new Error("Authentication token not available.");
  }

  const requestOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.headers = { ...requestOptions.headers, 'Content-Type': 'application/json' };
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiEndpoint}${path}`, requestOptions);

  if (!response.ok) {
    let errorText = `API request failed for ${method} ${path}`;
    let errorDetails: Record<string, unknown> = {};
    try {
      errorDetails = await response.json();
      errorText = typeof errorDetails.message === 'string' ? errorDetails.message : errorText;
    } catch {
      errorText = await response.text();
    }
    throw new Error(`${errorText} (Status: ${response.status})`);
  }

  // Handle cases where the response might be empty (e.g., 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }

  // Assuming successful responses are JSON
  return response.json() as Promise<T>;
}

/**
 * Hook providing an authenticated API client using Firebase Auth.
 * Usage: const { request } = useApiClient();
 * const data = await request('/my-data');
 */
export function useApiClient() {
  const { currentUser } = useAuth();

  // Wrap request in useCallback to stabilize its identity
  const request = useCallback(<T,>(path: string, options: ApiClientOptions = {}) => {
    if (!currentUser) {
      throw new Error("User must be authenticated to make API requests.");
    }
    return makeAuthenticatedRequest<T>(currentUser, path, options);
  }, [currentUser]);

  return { request };
}

// Optional: Export direct functions if needed outside React components
// export const apiClient = {
//   get: <T,>(path: string, getToken: GetTokenFunction) => makeAuthenticatedRequest<T>(getToken, path, { method: 'GET' }),
//   post: <T,>(path: string, body: any, getToken: GetTokenFunction) => makeAuthenticatedRequest<T>(getToken, path, { method: 'POST', body }),
//   // ... other methods
// };      