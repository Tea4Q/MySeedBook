import { ENV } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private static instance: Logger;
  private logHistory: Set<string> = new Set();

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!ENV.isDevelopment) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private logOnce(message: string, level: LogLevel = 'debug'): void {
    if (!this.shouldLog(level)) return;
    
    if (!this.logHistory.has(message)) {
      console[level](message);
      this.logHistory.add(message);
    }
  }

  debug(message: string): void {
    this.logOnce(`[DEBUG] ${message}`, 'debug');
  }

  info(message: string): void {
    this.logOnce(`[INFO] ${message}`, 'info');
  }

  warn(message: string): void {
    this.logOnce(`[WARN] ${message}`, 'warn');
  }

  error(message: string): void {
    this.logOnce(`[ERROR] ${message}`, 'error');
  }

  // For things that should always log (like errors)
  always(message: string, level: LogLevel = 'info'): void {
    console[level](message);
  }

  // Clear the log history (useful for development)
  clearHistory(): void {
    this.logHistory.clear();
  }
}

export const logger = Logger.getInstance();
export default logger;
