import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
  },
  documentTitle: {
    type: String,
    default: 'All Documents',
  },
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: 'General',
  },
  topic: {
    type: String,
    default: '',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer', 'mixed'],
    default: 'mcq',
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  questions: [
    {
      id: { type: String, required: true },
      question: { type: String, required: true },
      type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
      options: [{ type: String }],
      correctAnswer: { type: String, required: true },
      explanation: { type: String, default: '' },
      topic: { type: String, default: 'General' },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Quiz', QuizSchema);
