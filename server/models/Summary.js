import mongoose from 'mongoose';

const SummarySchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null,
  },
  documentTitle: {
    type: String,
    default: 'Uploaded Material',
  },
  subject: {
    type: String,
    default: 'General',
  },
  type: {
    type: String,
    enum: ['complete', 'chapter', 'topic', 'revision_notes', 'key_points', 'definitions'],
    default: 'complete',
  },
  length: {
    type: String,
    enum: ['brief', 'medium', 'detailed'],
    default: 'medium',
  },
  topicOrChapter: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Summary', SummarySchema);
