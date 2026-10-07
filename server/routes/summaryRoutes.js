import express from 'express';
import {
  generateSummary,
  getSummaries,
  getSummaryById,
  deleteSummary,
} from '../controllers/summaryController.js';

const router = express.Router();

router.post('/generate', generateSummary);
router.get('/', getSummaries);
router.get('/:id', getSummaryById);
router.delete('/:id', deleteSummary);

export default router;
