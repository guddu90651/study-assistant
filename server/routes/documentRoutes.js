import express from 'express';
import upload from '../middleware/upload.js';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  getSubjects,
} from '../controllers/documentController.js';

const router = express.Router();

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/subjects', getSubjects);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;
