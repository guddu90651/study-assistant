import mongoose from 'mongoose';

const FlashcardDeckSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
  },
  documentTitle: {
    type: String,
    default: 'Study Notes',
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
  totalCards: {
    type: Number,
    default: 0,
  },
  cards: [
    {
      id: { type: String, required: true },
      question: { type: String, required: true },
      answer: { type: String, required: true },
      topic: { type: String, default: 'General' },
      status: {
        type: String,
        enum: ['new', 'known', 'difficult'],
        default: 'new',
      },
      lastReviewed: {
        type: Date,
        default: null,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('FlashcardDeck', FlashcardDeckSchema);
