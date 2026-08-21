import { Request, Response } from 'express';

/**
 * 404 Not Found Handler
 * Returns a consistent response for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
