// API utility functions with timeout and retry limits
// Prevents infinite retry loops and resource exhaustion

interface ApiCallOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<ApiCallOptions> = {
  timeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

export async function safeApiCall<T = any>(
  url: string,
  options: RequestInit = {},
  apiOptions: ApiCallOptions = {}
): Promise<T> {
  const { timeout, maxRetries, retryDelay } = { ...DEFAULT_OPTIONS, ...apiOptions };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort (timeout) or client errors (4xx)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error; // Don't retry client errors
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  throw lastError || new Error('Unknown error');
}

// Simplified API response wrapper
export function createApiResponse<T>(data: T, success: boolean = true, message?: string) {
  return {
    success,
    data,
    message: message || (success ? 'Success' : 'Error'),
    timestamp: new Date().toISOString(),
  };
}

// Error boundary for API calls
export function handleApiError(error: unknown): { success: false; message: string } {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { success: false, message: 'Request timeout - please try again' };
    }
    if (error.message.includes('HTTP 4')) {
      return { success: false, message: 'Invalid request - please check your input' };
    }
    if (error.message.includes('HTTP 5')) {
      return { success: false, message: 'Server error - please try again later' };
    }
    return { success: false, message: error.message };
  }
  
  return { success: false, message: 'An unexpected error occurred' };
}
