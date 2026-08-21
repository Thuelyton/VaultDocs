import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User';
import { AppError } from '../middlewares/errorHandler';

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Auth Response Interface
 */
export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
  expiresIn: string;
}

/**
 * DTOs
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Authentication Service
 * Handles user registration, login, and JWT operations
 */
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string = '7d';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Create new user
    const user = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
    });

    // Generate token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      user: user.toJSON(),
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user by email (include password for comparison)
    const user = await UserModel.findOne({ email: data.email.toLowerCase() }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      user: user.toJSON(),
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
