import express from 'express';
import {
  generateQuiz,
  submitQuizAttempt,
  getQuizById,
  getQuizAttemptById,
  getQuizHistory,
} from '../controllers/quizController.js';

const router = express.Router();

router.post('/generate', generateQuiz);
router.post('/submit', submitQuizAttempt);
router.get('/history', getQuizHistory);
router.get('/:id', getQuizById);
router.get('/attempt/:id', getQuizAttemptById);

export default router;
