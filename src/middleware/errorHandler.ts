import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../models/order.model';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;

  if (err instanceof ZodError) {
    const body: ApiError = {
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      timestamp,
      path,
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof Error) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  } else {
    console.error('[ERROR] Unknown error:', err);
  }

  const body: ApiError = {
    error: 'Internal server error',
    timestamp,
    path,
  };
  res.status(500).json(body);
}

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiError = {
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
  res.status(404).json(body);
}
