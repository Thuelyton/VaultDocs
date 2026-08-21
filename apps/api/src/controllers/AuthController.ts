import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { authService, RegisterDTO, LoginDTO } from '../services/AuthService';
import { AppError } from '../middlewares/errorHandler';

/**
 * Authentication Controller
 * Handles HTTP requests for user authentication
 */
export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new AppError('Missing required fields: name, email, password', 400);
    }

    // Validate password strength
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const dto: RegisterDTO = {
      name,
      email,
      password,
    };

    const result = await authService.register(dto);

    res.status(201).json({
      status: 'success',
      data: result,
    });
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Missing required fields: email, password', 400);
    }

    const dto: LoginDTO = {
      email,
      password,
    };

    const result = await authService.login(dto);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;

    const user = await authService.getUserById(userId);

    res.status(200).json({
      status: 'success',
      data: user,
    });
  }
}

// Export singleton instance
export const authController = new AuthController();
