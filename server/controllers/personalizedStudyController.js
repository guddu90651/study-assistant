import PersonalizedStudy from '../models/PersonalizedStudy.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { generatePersonalizedStudyPack } from '../services/geminiService.js';

/**
 * Generate adaptive personalized study material targeting weak topics
 * POST /api/personalized-study/generate
 */
export const generatePersonalizedPlan = async (req, res, next) => {
  try {
    const {
      weakTopic,
      subject = 'General',
      difficulty = 'remedial',
      quizAttemptId = null,
      documentId = null,
    } = req.body;

    if (!weakTopic || !weakTopic.trim()) {
      return res.status(400).json({ success: false, message: 'Weak topic name is required.' });
    }

    let missedQuestions = [];
    if (quizAttemptId) {
      const attempt = await QuizAttempt.findById(quizAttemptId);
      if (attempt && attempt.answers) {
        missedQuestions = attempt.answers.filter((a) => !a.isCorrect);
      }
    }

    // Search relevant context chunks for this weak topic
    const targetedChunks = await searchSimilarChunks({
      query: `${weakTopic} ${subject}`,
      scope: documentId ? 'document' : 'all',
      documentId,
      topK: 8,
    });

    let contextText = targetedChunks.map((c) => c.text).join('\n\n');

    // Fallback: If no targeted chunks, pull general chunks for subject
    if (!contextText || contextText.length < 50) {
      const generalChunks = await Chunk.find({
        ...(subject && subject !== 'All' ? { subject: new RegExp(`^${subject}$`, 'i') } : {}),
      })
        .limit(10)
        .lean();
      contextText = generalChunks.map((c) => c.text).join('\n\n');
    }

    // Generate adaptive study pack via Gemini
    const packData = await generatePersonalizedStudyPack({
      weakTopic: weakTopic.trim(),
      subject,
      contextText: contextText.substring(0, 15000),
      difficulty,
      missedQuestions,
    });

    const newPlan = await PersonalizedStudy.create({
      subject,
      weakTopic: weakTopic.trim(),
      difficulty,
      quizAttemptId: quizAttemptId || null,
      documentId: documentId || null,
      simpleExplanation: packData.simpleExplanation,
      importantConcepts: packData.importantConcepts || [],
      realWorldExamples: packData.realWorldExamples || [],
      practiceQuestions: packData.practiceQuestions || [],
      flashcards: packData.flashcards || [],
      revisionNotes: packData.revisionNotes || [],
    });

    res.status(201).json({
      success: true,
      message: 'Personalized remediation study pack created successfully.',
      plan: newPlan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all personalized study plans
 * GET /api/personalized-study
 */
export const getPersonalizedPlans = async (req, res, next) => {
  try {
    const { subject, weakTopic } = req.query;
    const query = {};
    if (subject && subject !== 'All') query.subject = new RegExp(`^${subject}$`, 'i');
    if (weakTopic) query.weakTopic = new RegExp(weakTopic, 'i');

    const plans = await PersonalizedStudy.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, plans });
  } catch (err) {
    next(err);
  }
};

/**
 * Get personalized study plan by ID
 * GET /api/personalized-study/:id
 */
export const getPersonalizedPlanById = async (req, res, next) => {
  try {
    const plan = await PersonalizedStudy.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Personalized study plan not found' });
    }
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete personalized study plan
 * DELETE /api/personalized-study/:id
 */
export const deletePersonalizedPlan = async (req, res, next) => {
  try {
    const plan = await PersonalizedStudy.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, message: 'Personalized study plan deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
