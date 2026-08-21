import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Extended Request interface to include user data
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Authentication Middleware
 * Validates JWT token and extracts user information
 * 
 * TODO: Implement JWT verification when auth is ready
 * For now, this is a placeholder that will be enhanced
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid authentication token format', 401);
    }

    // TODO: Implement JWT verification
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.userId = decoded.userId;
    // req.userEmail = decoded.email;

    // Temporary: For development only, remove in production
    if (process.env.NODE_ENV === 'development') {
      req.userId = 'dev-user-id';
      req.userEmail = 'dev@vaultdocs.com';
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
}
