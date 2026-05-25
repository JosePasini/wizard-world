interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
}

/**
 * Executes a function and retries it with Exponential Backoff and Jitter if it fails.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 5, initialDelayMs: 1000, backoffFactor: 2 }
): Promise<T> {
  let attempt = 0;
  let delay = options.initialDelayMs;

  while (attempt < options.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= options.maxRetries) {
        throw new Error(`[RETRY] Failed after ${attempt} attempts. Original error: ${error instanceof Error ? error.message : error}`);
      }

      // Calculate exponential backoff
      delay = delay * options.backoffFactor;
      
      // Full Jitter: Introduce randomness to prevent synchronization conflicts
      const jitter = Math.random() * delay;
      const finalDelay = Math.min(jitter, 30000); // Cap at 30 seconds max

      console.warn(`[RETRY] Attempt ${attempt} failed. Retrying in ${Math.round(finalDelay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }
  throw new Error('[RETRY] Unreachable block');
}