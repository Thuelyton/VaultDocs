import { Router } from 'express';
import { documentRoutes } from './document.routes';
import { processingRoutes } from './processing.routes';

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

// Document management routes
router.use('/documents', documentRoutes);

// Document processing routes
router.use('/documents', processingRoutes);

export { router as apiRoutes };
