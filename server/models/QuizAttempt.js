import mongoose from 'mongoose';

const QuizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  quizTitle: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: 'General',
  },
  difficulty: {
    type: String,
    default: 'medium',
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  answers: [
    {
      questionId: String,
      questionText: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      explanation: String,
      topic: String,
    },
  ],
  weakTopics: [
    {
      type: String,
    },
  ],
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('QuizAttempt', QuizAttemptSchema);
