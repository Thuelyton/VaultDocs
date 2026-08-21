import { Router } from 'express';
import { uploadController } from '../controllers/UploadController';
import { authenticate } from '../middlewares/authenticate';
import { uploadSingle } from '../middlewares/upload';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/upload
 * @desc    Upload a single file to R2
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    file (multipart/form-data)
 */
router.post(
  '/',
  uploadSingle,
  uploadController.uploadFile.bind(uploadController)
);

/**
 * @route   POST /api/v1/upload/document
 * @desc    Upload file and create document in one step
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    file, title, category, expirationDate, extractedData (optional)
 */
router.post(
  '/document',
  uploadSingle,
  uploadController.uploadAndCreateDocument.bind(uploadController)
);

/**
 * @route   DELETE /api/v1/upload/:storageKey
 * @desc    Delete a file from R2
 * @access  Private
 */
router.delete(
  '/:storageKey',
  uploadController.deleteFile.bind(uploadController)
);

export { router as uploadRoutes };
