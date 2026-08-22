import { Router } from 'express';
import { processingController } from '../controllers/ProcessingController';
import { authenticate } from '../middlewares/authenticate';
import { uploadSingle } from '../middlewares/upload';

const router = Router();

// All processing routes require authentication
router.use(authenticate);

/**
 * @route   POST /documents/:id/process
 * @desc    Process document (OCR + AI extraction)
 * @access  Private
 */
router.post('/:id/process', processingController.processDocument.bind(processingController));

/**
 * @route   GET /documents/:id/processing
 * @desc    Get processing status
 * @access  Private
 */
router.get('/:id/processing', processingController.getProcessingStatus.bind(processingController));

/**
 * @route   PATCH /documents/:id/extracted-data
 * @desc    Update extracted data manually
 * @access  Private
 */
router.patch('/:id/extracted-data', processingController.updateExtractedData.bind(processingController));

/**
 * @route   POST /documents/:id/confirm
 * @desc    Confirm extracted data
 * @access  Private
 */
router.post('/:id/confirm', processingController.confirmExtractedData.bind(processingController));

/**
 * @route   POST /documents/:id/reprocess
 * @desc    Reprocess document
 * @access  Private
 */
router.post('/:id/reprocess', processingController.reprocessDocument.bind(processingController));

export { router as processingRoutes };
