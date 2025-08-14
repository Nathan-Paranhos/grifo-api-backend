import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, '../../logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${level}]`;

    if (service) {
      log += ` [${service}]`;
    }

    log += `: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'grifo-api'
  },
  transports: [
    // Error logs - separate file
    new DailyRotateFile({
      filename: join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),

    // Combined logs - all levels
    new DailyRotateFile({
      filename: join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),

    // Console output for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      filename: join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Create specialized loggers for different contexts
export const authLogger = logger.child({ context: 'auth' });
export const dbLogger = logger.child({ context: 'database' });
export const apiLogger = logger.child({ context: 'api' });
export const uploadLogger = logger.child({ context: 'upload' });
export const syncLogger = logger.child({ context: 'sync' });

// Helper functions for structured logging
export const loggers = {
  // API request logging
  logRequest: (req, res, responseTime) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id,
      companyId: req.user?.company_id
    };

    if (res.statusCode >= 400) {
      apiLogger.warn('API Request Failed', logData);
    } else {
      apiLogger.info('API Request', logData);
    }
  },

  // Authentication logging
  logAuth: (action, userId, companyId, success, details = {}) => {
    const logData = {
      action,
      userId,
      companyId,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (success) {
      authLogger.info(`Auth Success: ${action}`, logData);
    } else {
      authLogger.warn(`Auth Failed: ${action}`, logData);
    }
  },

  // Database operation logging
  logDb: (operation, table, success, details = {}) => {
    const logData = {
      operation,
      table,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (success) {
      dbLogger.debug(`DB ${operation}: ${table}`, logData);
    } else {
      dbLogger.error(`DB ${operation} Failed: ${table}`, logData);
    }
  },

  // File upload logging
  logUpload: (filename, size, userId, companyId, success, details = {}) => {
    const logData = {
      filename,
      size,
      userId,
      companyId,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (success) {
      uploadLogger.info('File Upload Success', logData);
    } else {
      uploadLogger.error('File Upload Failed', logData);
    }
  },

  // Sync operation logging
  logSync: (operation, userId, companyId, success, details = {}) => {
    const logData = {
      operation,
      userId,
      companyId,
      success,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (success) {
      syncLogger.info(`Sync Success: ${operation}`, logData);
    } else {
      syncLogger.error(`Sync Failed: ${operation}`, logData);
    }
  },

  // Security event logging
  logSecurity: (event, severity, details = {}) => {
    const logData = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details
    };

    logger.warn(`Security Event: ${event}`, logData);
  },

  // Performance logging
  logPerformance: (operation, duration, details = {}) => {
    const logData = {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    };

    if (duration > 5000) {
      // Log slow operations (>5s)
      logger.warn(`Slow Operation: ${operation}`, logData);
    } else {
      logger.debug(`Performance: ${operation}`, logData);
    }
  }
};

// Error logging helper
export const logError = (error, context = 'general', additionalData = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  logger.error('Application Error', errorData);
};

// Startup logging
logger.info('🚀 Logger initialized', {
  level: logger.level,
  environment: process.env.NODE_ENV || 'development',
  logsDirectory: logsDir
});

export default logger;
