import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { generateQuizFromContext } from '../services/geminiService.js';

/**
 * Generate a new quiz from study material
 * POST /api/quiz/generate
 */
export const generateQuiz = async (req, res, next) => {
  try {
    const {
      documentId = null,
      subject = 'General',
      topic = '',
      difficulty = 'medium',
      questionType = 'mcq',
      totalQuestions = 5,
    } = req.body;

    let docTitle = 'Study Material';
    let chunksText = '';

    if (documentId) {
      const doc = await Document.findById(documentId);
      if (doc) docTitle = doc.title;

      if (topic) {
        const targeted = await searchSimilarChunks({
          query: topic,
          scope: 'document',
          documentId,
          topK: 10,
        });
        chunksText = targeted.map((c) => c.text).join('\n\n');
      } else {
        const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).limit(15);
        chunksText = chunks.map((c) => c.text).join('\n\n');
      }
    } else {
      const filter = subject && subject !== 'All' ? { subject: new RegExp(`^${subject}$`, 'i') } : {};
      const chunks = await Chunk.find(filter).sort({ createdAt: -1 }).limit(15);
      chunksText = chunks.map((c) => c.text).join('\n\n');
    }

    if (!chunksText || chunksText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No study material found for the selected options. Please upload a document first.',
      });
    }

    const quizData = await generateQuizFromContext({
      contextText: chunksText.substring(0, 15000),
      docTitle,
      subject,
      topic,
      difficulty,
      questionType,
      totalQuestions: Number(totalQuestions) || 5,
    });

    const newQuiz = await Quiz.create({
      documentId: documentId || null,
      documentTitle: docTitle,
      title: quizData.title || `${subject} Quiz (${difficulty.toUpperCase()})`,
      subject,
      topic: topic || subject,
      difficulty,
      questionType,
      totalQuestions: quizData.questions.length,
      questions: quizData.questions,
    });

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully.',
      quiz: newQuiz,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit quiz answers and calculate results + weak topics
 * POST /api/quiz/submit
 */
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, answers = [], timeSpentSeconds = 0 } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let score = 0;
    const gradedAnswers = [];
    const missedTopicsMap = {};

    for (const q of quiz.questions) {
      const userSubmission = answers.find((a) => String(a.questionId) === String(q.id));
      const userAnswer = (userSubmission?.userAnswer || '').trim();
      const correctAnswer = (q.correctAnswer || '').trim();

      let isCorrect = false;
      if (q.type === 'mcq' || q.type === 'true_false') {
        isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
      } else {
        // Short answer comparison (fuzzy check or non-empty matching keyword)
        const uClean = userAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cClean = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
        isCorrect = uClean === cClean || (uClean.length > 3 && cClean.includes(uClean));
      }

      if (isCorrect) {
        score += 1;
      } else {
        const topicName = q.topic || quiz.topic || quiz.subject || 'General Concepts';
        missedTopicsMap[topicName] = (missedTopicsMap[topicName] || 0) + 1;
      }

      gradedAnswers.push({
        questionId: q.id,
        questionText: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        topic: q.topic || quiz.subject,
      });
    }

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const weakTopics = Object.keys(missedTopicsMap);

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      score,
      totalQuestions,
      percentage,
      answers: gradedAnswers,
      weakTopics,
      timeSpentSeconds,
    });

    res.json({
      success: true,
      message: 'Quiz evaluated successfully.',
      attempt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get quiz by ID
 * GET /api/quiz/:id
 */
export const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, quiz });
  } catch (err) {
    next(err);
  }
};

/**
 * Get quiz attempt by ID
 * GET /api/quiz/attempt/:id
 */
export const getQuizAttemptById = async (req, res, next) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    res.json({ success: true, attempt });
  } catch (err) {
    next(err);
  }
};

/**
 * Get quiz attempt history
 * GET /api/quiz/history
 */
export const getQuizHistory = async (req, res, next) => {
  try {
    const attempts = await QuizAttempt.find().sort({ completedAt: -1 }).limit(30);
    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    next(err);
  }
};
