import ChatMessage from '../models/ChatMessage.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { generateRAGChatAnswer } from '../services/geminiService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle student question with Vector Search & Gemini RAG
 * POST /api/chat
 */
export const handleChat = async (req, res, next) => {
  try {
    const {
      question,
      scope = 'all',
      documentId = null,
      subject = null,
      sessionId = uuidv4(),
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty.' });
    }

    // 1. Check if any documents exist in database
    const totalDocsCount = await Document.countDocuments();
    if (totalDocsCount === 0) {
      const emptyNotice =
        "⚠️ **No study materials uploaded yet!**\n\nPlease go to the **'Upload Notes / PDF'** tab, upload your course PDF or notes, and then you can ask any question about them.";
      return res.json({
        success: true,
        sessionId,
        message: {
          sessionId,
          role: 'assistant',
          content: emptyNotice,
          citations: [],
        },
        answer: emptyNotice,
        citations: [],
      });
    }

    // 2. Save user query message to database
    await ChatMessage.create({
      sessionId,
      role: 'user',
      content: question.trim(),
      scope: { type: scope, documentId, subject },
    });

    // 3. Fetch recent conversation history for multi-turn context
    const history = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(8)
      .lean();

    // 4. Search vector index for top relevant chunks (Hybrid search)
    const relevantChunks = await searchSimilarChunks({
      query: question.trim(),
      scope,
      documentId,
      subject,
      topK: 5,
    });

    // 5. Generate grounded answer via Gemini RAG
    const { answer, citations } = await generateRAGChatAnswer({
      question: question.trim(),
      chunks: relevantChunks,
      history,
    });

    // 6. Save assistant response
    const assistantMessage = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: answer,
      scope: { type: scope, documentId, subject },
      citations,
    });

    res.json({
      success: true,
      sessionId,
      message: assistantMessage,
      answer,
      citations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get chat messages for a session
 * GET /api/chat/history/:sessionId
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      sessionId,
      messages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear chat session history
 * DELETE /api/chat/history/:sessionId
 */
export const clearChatSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    await ChatMessage.deleteMany({ sessionId });

    res.json({
      success: true,
      message: 'Chat session history cleared successfully.',
    });
  } catch (err) {
    next(err);
  }
};
