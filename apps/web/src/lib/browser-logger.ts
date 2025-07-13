'use client';

// Browser Console Logger - Zero logging in production
// Only logs to browser console in development mode

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: any;
}

class BrowserLogger {
  private isDevelopment: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isEnabled = this.isDevelopment && typeof window !== 'undefined';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context?.component) {
      return `${prefix} [${context.component}] ${message}`;
    }

    return `${prefix} ${message}`;
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6b7280; font-weight: normal;',
      info: 'color: #3b82f6; font-weight: bold;',
      warn: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 4px;'
    };
    return styles[level];
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Silently return in production
    if (!this.isEnabled) return;

    const formattedMessage = this.formatMessage(level, message, context);
    const style = this.getLogStyle(level);

    // Use appropriate console method with safety check
    const consoleMethod = level === 'debug' ? 'log' : level;
    
    // Ensure the console method exists
    if (typeof console[consoleMethod as keyof Console] !== 'function') {
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
      return;
    }

    // Better context checking - consider non-enumerable properties and meaningful values
    const hasContext = context && (
      Object.keys(context).length > 0 || 
      Object.getOwnPropertyNames(context).length > 0 ||
      // Check for common non-enumerable properties
      context.error !== undefined ||
      context.message !== undefined ||
      context.stack !== undefined ||
      context.jobId !== undefined ||
      context.action !== undefined ||
      context.errorMessage !== undefined
    );

    try {
      const consoleFn = console[consoleMethod as keyof Console] as Function;
      
      if (hasContext) {
        // Serialize context properly for console output
        const serializedContext = this.serializeContext(context!);
        consoleFn(`%c${formattedMessage}`, style, serializedContext);
      } else {
        consoleFn(`%c${formattedMessage}`, style);
      }
    } catch (consoleError) {
      // Fallback: use basic console.log if styled logging fails
      console.log(`[${level.toUpperCase()}] ${message}`, context || '');
    }
  }

  // Serialize context to handle Error objects and other non-enumerable properties
  private serializeContext(context: LogContext): any {
    if (!context || typeof context !== 'object') return context;

    const serialized: any = {};

    // Copy ALL enumerable properties
    Object.keys(context).forEach(key => {
      const value = context[key];

      // Handle Error objects specially
      if (value instanceof Error) {
        serialized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      } else {
        serialized[key] = value;
      }
    });

    // Handle Error objects in 'error' property specially if not already handled
    if (context.error && context.error instanceof Error && !serialized.error) {
      serialized.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack
      };
    }

    // Handle other common non-enumerable properties
    if (context.message !== undefined && !serialized.message) {
      serialized.message = context.message;
    }
    if (context.stack !== undefined && !serialized.stack) {
      serialized.stack = context.stack;
    }
    if (context.jobId !== undefined && !serialized.jobId) {
      serialized.jobId = context.jobId;
    }
    if (context.action !== undefined && !serialized.action) {
      serialized.action = context.action;
    }
    if (context.errorMessage !== undefined && !serialized.errorMessage) {
      serialized.errorMessage = context.errorMessage;
    }

    return serialized;
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any): void {
    this.debug(`Component mounted: ${componentName}`, { 
      component: componentName, 
      action: 'mount',
      props: this.sanitizeProps(props)
    });
  }

  componentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, { 
      component: componentName, 
      action: 'unmount'
    });
  }

  // User interaction logging
  userAction(action: string, component: string, details?: any): void {
    this.info(`User action: ${action}`, {
      component,
      action,
      details: this.sanitizeData(details)
    });
  }

  // API call logging
  apiRequest(method: string, url: string, data?: any): void {
    this.info(`API ${method} ${url}`, {
      action: 'api_request',
      method,
      url,
      data: this.sanitizeData(data)
    });
  }

  apiResponse(method: string, url: string, status: number, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ''}`, {
      action: 'api_response',
      method,
      url,
      status,
      duration
    });
  }

  // Form logging
  formSubmit(formName: string, data?: any): void {
    this.info(`Form submitted: ${formName}`, {
      action: 'form_submit',
      form: formName,
      data: this.sanitizeFormData(data)
    });
  }

  formValidation(formName: string, errors: any): void {
    this.warn(`Form validation failed: ${formName}`, {
      action: 'form_validation',
      form: formName,
      errors
    });
  }

  // Authentication logging
  authEvent(event: string, details?: any): void {
    this.info(`Auth: ${event}`, {
      action: 'auth',
      event,
      details: this.sanitizeAuthData(details)
    });
  }

  // Navigation logging
  navigation(from: string, to: string): void {
    this.debug(`Navigation: ${from} → ${to}`, {
      action: 'navigation',
      from,
      to
    });
  }

  // Performance logging
  performance(operation: string, duration: number, details?: any): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    this.log(level, `Performance: ${operation} (${duration}ms)`, {
      action: 'performance',
      operation,
      duration,
      details: this.sanitizeData(details)
    });
  }

  // Data sanitization methods
  private sanitizeProps(props: any): any {
    if (!props || typeof props !== 'object') return props;

    const sanitized = { ...props };

    // Remove sensitive data
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;

    return sanitized;
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.token;
    delete sanitized.access_token;
    delete sanitized.refresh_token;
    delete sanitized.apiKey;
    delete sanitized.secret;
    delete sanitized.creditCard;
    delete sanitized.ssn;

    return sanitized;
  }

  private sanitizeFormData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = this.sanitizeData(data);

    // Mask email for privacy
    if (sanitized.email) {
      const email = sanitized.email;
      const [user, domain] = email.split('@');
      sanitized.email = `${user.substring(0, 2)}***@${domain}`;
    }

    return sanitized;
  }

  private sanitizeAuthData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = this.sanitizeData(data);

    // Remove auth-specific sensitive data
    delete sanitized.provider;
    delete sanitized.providerId;
    delete sanitized.session;

    return sanitized;
  }

  // Production safety check
  static checkProductionSafety(): boolean {
    if (process.env.NODE_ENV === 'production') {
      // In production, verify no console logs are being called
      const originalConsole = {
        log: console.log,
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      };

      let logCount = 0;

      // Override console methods to count calls
      Object.keys(originalConsole).forEach(method => {
        (console as any)[method] = (...args: any[]) => {
          logCount++;
          // Still call original in production for critical errors
          if (method === 'error') {
            (originalConsole as any)[method](...args);
          }
        };
      });

      // Restore after check
      setTimeout(() => {
        Object.assign(console, originalConsole);
      }, 100);

      return logCount === 0;
    }
    return true;
  }
}

// Interface for logger methods (for fallback compatibility)
interface LoggerMethods {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  componentMount: (componentName: string, props?: any) => void;
  componentUnmount: (componentName: string) => void;
  userAction: (action: string, component: string, details?: any) => void;
  apiRequest: (method: string, url: string, data?: any) => void;
  apiResponse: (method: string, url: string, status: number, duration?: number) => void;
  formSubmit: (formName: string, data?: any) => void;
  formValidation: (formName: string, errors: any) => void;
  authEvent: (event: string, details?: any) => void;
  navigation: (from: string, to: string) => void;
  performance: (operation: string, duration: number, details?: any) => void;
}

// Create singleton instance with safety checks
const createSafeBrowserLogger = (): LoggerMethods => {
  try {
    return new BrowserLogger();
  } catch (error) {
    // Fallback logger that does nothing if there are issues
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      componentMount: () => {},
      componentUnmount: () => {},
      userAction: () => {},
      apiRequest: () => {},
      apiResponse: () => {},
      formSubmit: () => {},
      formValidation: () => {},
      authEvent: () => {},
      navigation: () => {},
      performance: () => {},
    };
  }
};

export const browserLogger = createSafeBrowserLogger();

// Export logger alias for backward compatibility
export const logger = browserLogger;

// Development-only helper for React components
export const useBrowserLogger = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      userAction: () => {},
      mount: () => {},
      unmount: () => {}
    };
  }

  // Ensure browserLogger has the required methods
  if (!browserLogger || typeof browserLogger.info !== 'function') {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      userAction: () => {},
      mount: () => {},
      unmount: () => {}
    };
  }

  return {
    debug: (message: string, context?: LogContext) => 
      browserLogger.debug(message, { component: componentName, ...context }),
    info: (message: string, context?: LogContext) => 
      browserLogger.info(message, { component: componentName, ...context }),
    warn: (message: string, context?: LogContext) => 
      browserLogger.warn(message, { component: componentName, ...context }),
    error: (message: string, context?: LogContext) => 
      browserLogger.error(message, { component: componentName, ...context }),
    userAction: (action: string, details?: any) => 
      browserLogger.userAction(action, componentName, details),
    mount: (props?: any) => 
      browserLogger.componentMount(componentName, props),
    unmount: () => 
      browserLogger.componentUnmount(componentName)
  };
};

// Export for testing
export { BrowserLogger }; 