import jwt from 'jsonwebtoken';
import { UserModel, IUserDocument, UserJSON } from '../models/User';
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
  user: UserJSON;
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
  private JWT_SECRET: string = '';
  private readonly JWT_EXPIRES_IN: string = '7d';
  private initialized = false;

  private ensureInitialized() {
    if (!this.initialized) {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
      }
      this.JWT_SECRET = secret;
      this.initialized = true;
    }
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
      user: user.toJSON() as UserJSON,
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
      user: user.toJSON() as UserJSON,
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserJSON> {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.toJSON() as UserJSON;
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: JwtPayload): string {
    this.ensureInitialized();
    // Use number of days for expiresIn to avoid type issues with 'ms' module
    const expiresInDays = 7;
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: expiresInDays * 24 * 60 * 60, // 7 days in seconds
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload {
    this.ensureInitialized();
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      
      // Ensure decoded has the expected shape
      if (typeof decoded === 'string') {
        throw new AppError('Invalid token format', 401);
      }
      
      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
