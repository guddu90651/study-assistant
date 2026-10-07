import express from 'express';
import {
  handleChat,
  getChatHistory,
  clearChatSession,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', handleChat);
router.get('/history/:sessionId', getChatHistory);
router.delete('/history/:sessionId', clearChatSession);

export default router;
