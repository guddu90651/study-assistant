import mongoose from 'mongoose';

const PersonalizedStudySchema = new mongoose.Schema({
  subject: {
    type: String,
    default: 'General',
  },
  weakTopic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['remedial', 'standard', 'advanced'],
    default: 'remedial',
  },
  quizAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    default: null,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
  },
  simpleExplanation: {
    type: String,
    required: true,
  },
  importantConcepts: [
    {
      type: String,
    },
  ],
  realWorldExamples: [
    {
      type: String,
    },
  ],
  practiceQuestions: [
    {
      question: String,
      answer: String,
      explanation: String,
      hint: String,
    },
  ],
  flashcards: [
    {
      question: String,
      answer: String,
    },
  ],
  revisionNotes: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('PersonalizedStudy', PersonalizedStudySchema);
