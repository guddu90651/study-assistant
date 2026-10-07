import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileType: {
    type: String,
    default: 'pdf',
  },
  subject: {
    type: String,
    default: 'General',
    trim: true,
    index: true,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  totalChunks: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
    index: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  rawTextPreview: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Document', DocumentSchema);
