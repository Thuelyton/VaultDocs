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
// In production, CORS_ORIGIN must be set to the exact frontend domain
// In development, allow localhost for local testing
const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin ? [corsOrigin] : true, // Allow all origins in dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body Parsing
// Skip JSON/urlencoded parsing on /upload routes so multer always receives the raw stream.
// (Some clients send an incorrect Content-Type for multipart, causing these parsers
//  to consume the body before multer gets a chance to parse it.)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/upload')) return next();
  return express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/upload')) return next();
  return express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Diagnostic middleware: log raw request headers/body BEFORE multer runs.
// Helps debug React Native/Expo uploads where the Content-Type may not arrive as multipart.
app.use((req: Request, _res: Response, next) => {
  if (req.path.includes('/upload')) {
    console.log('🛰️  Incoming upload request:', {
      method: req.method,
      path: req.path,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      transferEncoding: req.headers['transfer-encoding'],
      hasAuth: !!req.headers.authorization,
    });
  }
  next();
});

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
