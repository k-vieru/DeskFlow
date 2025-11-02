/**
 * Fetch with automatic retry logic and better error messages
 */

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 2, retryDelay = 1000, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`[Fetch] Attempt ${i + 1}/${retries + 1}: ${url}`);
      
      const response = await fetch(url, fetchOptions);
      
      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx) - retry
      if (response.status >= 500 && i < retries) {
        console.warn(`[Fetch] Server error ${response.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      console.error(`[Fetch] Attempt ${i + 1} failed:`, error.message);
      
      // Network error - retry
      if (i < retries) {
        console.log(`[Fetch] Retrying in ${retryDelay * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        continue;
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to fetch after ${retries + 1} attempts. ` +
    `Please check your internet connection and try again. ` +
    `Original error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Check if the server is reachable
 */
export async function checkServerHealth(
  projectId: string,
  accessToken?: string
): Promise<{ healthy: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-8f21c4d2/projects`,
      {
        method: 'GET',
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`,
        } : {},
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );
    
    return { healthy: response.ok || response.status === 401 };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Get a user-friendly error message based on the error type
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const message = error?.message || String(error);
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'Request timed out. The server might be slow or unavailable.';
  }
  
  if (message.includes('CORS')) {
    return 'Connection blocked by browser security. Please contact support.';
  }
  
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The requested resource was not found.';
  }
  
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Server error. Please try again in a few moments.';
  }
  
  return message;
}
