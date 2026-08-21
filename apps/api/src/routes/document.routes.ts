import { Router } from 'express';
import { documentController } from '../controllers/DocumentController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// All document routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/documents
 * @desc    Create a new document
 * @access  Private
 */
router.post('/', documentController.create.bind(documentController));

/**
 * @route   GET /api/v1/documents
 * @desc    List all user's documents with filters
 * @access  Private
 * @query   status, category, search, expiringBefore, page, limit
 */
router.get('/', documentController.list.bind(documentController));

/**
 * @route   GET /api/v1/documents/stats
 * @desc    Get user's document statistics
 * @access  Private
 */
router.get('/stats', documentController.getStats.bind(documentController));

/**
 * @route   GET /api/v1/documents/expiring
 * @desc    Get documents expiring soon
 * @access  Private
 * @query   days - Number of days ahead (default: 30)
 */
router.get('/expiring', documentController.getExpiring.bind(documentController));

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get a single document by ID
 * @access  Private
 */
router.get('/:id', documentController.getById.bind(documentController));

/**
 * @route   PUT /api/v1/documents/:id
 * @desc    Update a document
 * @access  Private
 */
router.put('/:id', documentController.update.bind(documentController));

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete (archive) a document
 * @access  Private
 */
router.delete('/:id', documentController.delete.bind(documentController));

export { router as documentRoutes };
