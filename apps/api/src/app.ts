import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

// Import routes
import { documentRoutes } from './routes/document.routes';
import { authRoutes } from './routes/auth.routes';
import { uploadRoutes } from './routes/upload.routes';
import { processingRoutes } from './routes/processing.routes';

const app: Application = express();

// ===========================================
// Global Middleware
// ===========================================

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Headers (basic)
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ===========================================
// Health Check
// ===========================================
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'VaultDocs API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ===========================================
// API Routes
// ===========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/documents', processingRoutes);

// ===========================================
// 404 Handler
// ===========================================
app.use(notFoundHandler);

// ===========================================
// Error Handler (must be last)
// ===========================================
app.use(errorHandler);

export default app;
