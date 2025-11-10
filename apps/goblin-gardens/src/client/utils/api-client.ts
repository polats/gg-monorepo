/**
 * API Client with Environment Detection
 * 
 * Automatically detects whether the app is running on:
 * - Vercel (production/preview)
 * - Local development
 * - Reddit Devvit
 * 
 * And uses the appropriate API base URL for each environment.
 */

export function getApiBaseUrl(): string {
  // Check if running on Vercel (production or preview)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Vercel deployment (adjust domain as needed)
    if (hostname.includes('vercel.app') || hostname.includes('goblin-gardens.com')) {
      return ''; // Use relative paths (same domain)
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Reddit Devvit (webview)
    if (hostname.includes('reddit.com') || hostname.includes('devvit')) {
      return ''; // Use relative paths
    }
  }
  
  // Default to relative paths
  return '';
}

/**
 * Make an API call with automatic environment detection
 * 
 * @param endpoint - API endpoint path (e.g., '/api/init')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise with typed response
 */
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Helper for GET requests
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

/**
 * Helper for POST requests
 */
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}
