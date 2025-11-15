/**
 * Logger Module
 * Centralized logging system using electron-log
 */

const log = require('electron-log');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    this.setupLogger();
  }

  /**
   * Set up logger configuration
   */
  setupLogger() {
    // Configure log file paths
    const logsPath = path.join(app.getPath('userData'), 'logs');
    
    // Main process log
    log.transports.file.resolvePathFn = () => path.join(logsPath, 'main.log');
    
    // Set log levels
    log.transports.file.level = 'info';
    log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    
    // Configure log rotation (keep last 7 days)
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    
    // Format log messages
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';
    
    console.log(`Logs directory: ${logsPath}`);
  }

  /**
   * Log info message
   */
  info(...args) {
    log.info(...args);
  }

  /**
   * Log warning message
   */
  warn(...args) {
    log.warn(...args);
  }

  /**
   * Log error message
   */
  error(...args) {
    log.error(...args);
  }

  /**
   * Log debug message
   */
  debug(...args) {
    log.debug(...args);
  }

  /**
   * Log verbose message
   */
  verbose(...args) {
    log.verbose(...args);
  }

  /**
   * Get log file path
   */
  getLogPath() {
    return log.transports.file.getFile().path;
  }

  /**
   * Clear old logs (older than 7 days)
   */
  async clearOldLogs() {
    const fs = require('fs').promises;
    const logsPath = path.join(app.getPath('userData'), 'logs');
    
    try {
      const files = await fs.readdir(logsPath);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(logsPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < sevenDaysAgo) {
          await fs.unlink(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to clear old logs:', error);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
