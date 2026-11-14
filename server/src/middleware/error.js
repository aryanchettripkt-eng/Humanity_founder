import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'Invalid identifier format',
      },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A record with that value already exists',
      },
    });
  }

  logger.error('Unhandled error', { message: err?.message, stack: err?.stack });
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

