type ApiError = { status?: number; message?: string };

/**
 * Retry wrapper for OpenAI API calls with exponential backoff
 * Handles rate limits, server errors, and content size issues
 */
export async function retryOpenAICall<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, onRetry } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: unknown) {
      lastError = error as Error;
      const apiErr = error as ApiError;
      console.error(
        `[Attempt ${attempt + 1}/${maxRetries}] OpenAI API error:`,
        apiErr?.message || error
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      // If it's not a retryable error, throw immediately
      if (apiErr?.status && ![429, 500, 502, 503, 504].includes(apiErr.status)) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // If all retries failed, throw the last error
  if (lastError) {
    throw lastError;
  }

  throw new Error("Failed to get response from OpenAI after all retries");
}

/**
 * Retry wrapper with adaptive content sizing
 * Progressively reduces content size on retry to avoid size limits
 */
export async function retryWithAdaptiveContent(
  baseApiCall: (content: string) => Promise<unknown>,
  fullContent: string,
  options: {
    maxRetries?: number;
    contentLimits?: number[];
  } = {}
): Promise<unknown> {
  const { maxRetries = 3, contentLimits = [150000, 100000, 50000] } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use progressively smaller content on each retry
      const contentLimit = contentLimits[Math.min(attempt, contentLimits.length - 1)];
      const contentToUse = fullContent.substring(0, contentLimit);

      return await baseApiCall(contentToUse);
    } catch (error: unknown) {
      lastError = error as Error;
      const apiErr = error as ApiError;
      console.error(
        `[Attempt ${attempt + 1}/${maxRetries}] OpenAI API error:`,
        apiErr?.message || error
      );

      // If it's not a retryable error, throw immediately
      if (apiErr?.status && ![429, 500, 502, 503, 504].includes(apiErr.status)) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // If all retries failed, throw the last error
  if (lastError) {
    throw lastError;
  }

  throw new Error("Failed to get response from OpenAI after all retries");
}
