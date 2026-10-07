import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true,
  },
  documentTitle: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    default: 'General',
    index: true,
  },
  pageNumber: {
    type: Number,
    default: 1,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  charCount: {
    type: Number,
    default: 0,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for multi-field filtering
ChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.model('Chunk', ChunkSchema);
