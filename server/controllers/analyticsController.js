import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import ChatMessage from '../models/ChatMessage.js';
import Summary from '../models/Summary.js';
import QuizAttempt from '../models/QuizAttempt.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import PersonalizedStudy from '../models/PersonalizedStudy.js';

/**
 * Aggregate comprehensive dashboard and learning analytics
 * GET /api/analytics
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [
      totalDocuments,
      totalChunks,
      recentDocuments,
      totalQuestionsAsked,
      totalSummaries,
      quizAttempts,
      flashcardDecks,
      personalizedPlansCount,
    ] = await Promise.all([
      Document.countDocuments(),
      Chunk.countDocuments(),
      Document.find().sort({ createdAt: -1 }).limit(5),
      ChatMessage.countDocuments({ role: 'user' }),
      Summary.countDocuments(),
      QuizAttempt.find().sort({ completedAt: -1 }).limit(50),
      FlashcardDeck.find(),
      PersonalizedStudy.countDocuments(),
    ]);

    // Calculate Quiz Metrics
    const totalQuizAttempts = quizAttempts.length;
    let avgQuizScore = 0;
    const weakTopicsFrequency = {};
    const quizScoreHistory = [];

    if (totalQuizAttempts > 0) {
      const sumPercentage = quizAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      avgQuizScore = Math.round(sumPercentage / totalQuizAttempts);

      quizAttempts.forEach((attempt) => {
        quizScoreHistory.push({
          id: attempt._id,
          title: attempt.quizTitle,
          score: attempt.score,
          total: attempt.totalQuestions,
          percentage: attempt.percentage,
          subject: attempt.subject,
          date: attempt.completedAt,
        });

        if (attempt.weakTopics && Array.isArray(attempt.weakTopics)) {
          attempt.weakTopics.forEach((topic) => {
            if (topic) {
              weakTopicsFrequency[topic] = (weakTopicsFrequency[topic] || 0) + 1;
            }
          });
        }
      });
    }

    // Sort weak topics by frequency
    const weakTopics = Object.entries(weakTopicsFrequency)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate Flashcard Metrics
    let totalCards = 0;
    let knownCards = 0;
    let difficultCards = 0;
    let newCards = 0;

    flashcardDecks.forEach((deck) => {
      if (deck.cards && Array.isArray(deck.cards)) {
        deck.cards.forEach((card) => {
          totalCards++;
          if (card.status === 'known') knownCards++;
          else if (card.status === 'difficult') difficultCards++;
          else newCards++;
        });
      }
    });

    const flashcardMasteryPercentage = totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0;

    // Aggregate Subjects Breakdown
    const subjectCounts = await Document.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalChunks,
          totalQuestionsAsked,
          totalSummaries,
          totalQuizAttempts,
          avgQuizScore,
          totalFlashcards: totalCards,
          flashcardMasteryPercentage,
          personalizedPlansCount,
        },
        recentDocuments,
        quizScoreHistory: quizScoreHistory.reverse().slice(-10),
        weakTopics,
        flashcardStats: {
          total: totalCards,
          known: knownCards,
          difficult: difficultCards,
          new: newCards,
          masteryPercentage: flashcardMasteryPercentage,
        },
        subjectBreakdown: subjectCounts.map((s) => ({
          subject: s._id || 'General',
          count: s.count,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
