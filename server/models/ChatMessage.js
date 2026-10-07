import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  scope: {
    type: {
      type: String,
      enum: ['all', 'document', 'subject'],
      default: 'all',
    },
    documentId: {
      type: String,
      default: null,
    },
    subject: {
      type: String,
      default: null,
    },
  },
  citations: [
    {
      documentId: String,
      documentTitle: String,
      pageNumber: Number,
      chunkIndex: Number,
      snippet: String,
      score: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('ChatMessage', ChatMessageSchema);
