import { Router } from 'express';
import { documentRoutes } from './document.routes';
// import { authRoutes } from './auth.routes';

const router = Router();

/**
 * API v1 Routes
 * 
 * Base URL: /api/v1
 */

// Health check at API level
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
// router.use('/auth', authRoutes);

// Document management routes
router.use('/documents', documentRoutes);

export { router as apiRoutes };
