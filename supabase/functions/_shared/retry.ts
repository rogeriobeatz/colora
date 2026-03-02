// Retry and Circuit Breaker utilities for Edge Functions

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoff?: 'linear' | 'exponential';
  jitter?: boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(private options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      ...options
    };
  }

  async execute<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout!) {
        this.state = 'half-open';
        console.log(`[CIRCUIT-BREAKER] ${operationName}: Entering half-open state`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(operationName);
      return result;
    } catch (error) {
      this.onFailure(operationName);
      throw error;
    }
  }

  private onSuccess(operationName: string) {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
      console.log(`[CIRCUIT-BREAKER] ${operationName}: Circuit closed after successful operation`);
    }
  }

  private onFailure(operationName: string) {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    console.error(`[CIRCUIT-BREAKER] ${operationName}: Operation failed (${this.failures}/${this.options.failureThreshold})`);
    
    if (this.failures >= this.options.failureThreshold!) {
      this.state = 'open';
      console.error(`[CIRCUIT-BREAKER] ${operationName}: Circuit OPENED due to too many failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export const retry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  operationName: string = 'operation'
): Promise<T> => {
  const opts = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoff: 'exponential' as const,
    jitter: true,
    ...options
  };

  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts!; attempt++) {
    try {
      console.log(`[RETRY] ${operationName}: Attempt ${attempt}/${opts.maxAttempts}`);
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`[RETRY] ${operationName}: Success on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] ${operationName}: Attempt ${attempt} failed:`, error);
      
      if (attempt === opts.maxAttempts) {
        console.error(`[RETRY] ${operationName}: All ${opts.maxAttempts} attempts failed`);
        throw lastError;
      }
      
      // Calculate delay for next attempt
      let delay: number;
      
      if (opts.backoff === 'exponential') {
        delay = Math.min(opts.baseDelay! * Math.pow(2, attempt - 1), opts.maxDelay!);
      } else {
        delay = Math.min(opts.baseDelay! * attempt, opts.maxDelay!);
      }
      
      // Add jitter to prevent thundering herd
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }
      
      console.log(`[RETRY] ${operationName}: Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Helper for Supabase operations with retry
export const supabaseRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  options?: RetryOptions
): Promise<T> => {
  return retry(operation, options, `SUPABASE-${operationName}`);
};

// Helper for external API calls with retry
export const apiRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  options?: RetryOptions
): Promise<T> => {
  return retry(operation, {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoff: 'exponential',
    jitter: true,
    ...options
  }, `API-${operationName}`);
};

// Create circuit breakers for common services
export const circuitBreakers = {
  supabase: new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
  }),
  stripe: new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
  }),
  externalAPI: new CircuitBreaker({
    failureThreshold: 4,
    recoveryTimeout: 45000, // 45 seconds
  })
};

// Wrapper to combine circuit breaker and retry
export const resilientOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  circuitBreaker: CircuitBreaker,
  retryOptions?: RetryOptions
): Promise<T> => {
  return circuitBreaker.execute(
    () => retry(operation, retryOptions, operationName),
    operationName
  );
};
