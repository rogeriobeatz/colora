// Logger estruturado para toda aplicação
export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  responseTime?: number;
  timestamp?: string;
  status?: string;
  stack?: string;
  error?: Error;
  errorInfo?: any;
  services?: any;
  metadata?: Record<string, any>;
  mountTime?: number;
  unmountTime?: number;
  renderTime?: number;
  memoryUsage?: number;
  operation?: string;
}

export class Logger {
  private static instance: Logger;
  private context: LogContext = {};

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const ctx = { ...this.context, ...context };
    const contextStr = Object.keys(ctx).length > 0 ? JSON.stringify(ctx) : '';
    
    return `[${timestamp}] [${level}] ${message} ${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  debug(message: string, context?: LogContext): void {
    console.log(this.formatMessage('DEBUG', message, context));
  }

  // Performance tracking
  startTimer(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { duration });
      return duration;
    };
  }

  // Error tracking
  trackError(error: Error, context?: LogContext): void {
    this.error(error.message, { error, ...context });
    
    // Enviar para serviço de tracking (implementação futura)
    this.sendToTrackingService(error, context);
  }

  private sendToTrackingService(error: Error, context?: LogContext): void {
    // Implementação futura: enviar para Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // TODO: Integrar com serviço de tracking
      console.warn('Error tracking service not implemented yet', { error, context });
    }
  }
}

export const logger = Logger.getInstance();
