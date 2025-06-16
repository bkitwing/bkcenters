// Logging utility for BKCenters app

// Log levels
export enum LogLevel {
  NONE = 0,    // No logging
  ERROR = 1,   // Only errors
  WARN = 2,    // Errors and warnings
  INFO = 3,    // Normal informational logging
  DEBUG = 4,   // Detailed debug information
  TRACE = 5    // Very verbose tracing
}

// Current log level
// Default: In development, use WARN level; in production, use ERROR level
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'development' 
  ? LogLevel.WARN 
  : LogLevel.ERROR;

// Allow override via environment variable
const LOG_LEVEL_ENV = process.env.LOG_LEVEL ? 
  parseInt(process.env.LOG_LEVEL) : 
  DEFAULT_LOG_LEVEL;

// Create logger
class Logger {
  private level: LogLevel;
  
  constructor(level: LogLevel = LOG_LEVEL_ENV) {
    this.level = level;
  }
  
  setLevel(level: LogLevel) {
    this.level = level;
  }
  
  error(...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      console.error(...args);
    }
  }
  
  warn(...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      console.warn(...args);
    }
  }
  
  info(...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.log(...args);
    }
  }
  
  debug(...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  }
  
  trace(...args: any[]) {
    if (this.level >= LogLevel.TRACE) {
      console.log('[TRACE]', ...args);
    }
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export a method to set log level
export const setLogLevel = (level: LogLevel) => {
  logger.setLevel(level);
}; 