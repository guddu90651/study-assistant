import Summary from '../models/Summary.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { generateSummaryFromContext } from '../services/geminiService.js';

/**
 * Generate a new summary from study material
 * POST /api/summary/generate
 */
export const generateSummary = async (req, res, next) => {
  try {
    const {
      documentId = null,
      subject = 'General',
      type = 'complete',
      length = 'medium',
      topicOrChapter = '',
    } = req.body;

    let docTitle = 'Uploaded Study Material';
    let chunksText = '';

    if (documentId) {
      const doc = await Document.findById(documentId);
      if (doc) docTitle = doc.title;

      if (type === 'topic' || type === 'chapter') {
        // Retrieve targeted chunks using vector similarity
        const targeted = await searchSimilarChunks({
          query: topicOrChapter || docTitle,
          scope: 'document',
          documentId,
          topK: 8,
        });
        chunksText = targeted.map((c) => c.text).join('\n\n');
      } else {
        // Retrieve representative chunks across the document
        const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).limit(15);
        chunksText = chunks.map((c) => c.text).join('\n\n');
      }
    } else {
      // General or subject-wide summary
      const filter = subject && subject !== 'All' ? { subject: new RegExp(`^${subject}$`, 'i') } : {};
      const chunks = await Chunk.find(filter).sort({ createdAt: -1 }).limit(15);
      chunksText = chunks.map((c) => c.text).join('\n\n');
    }

    if (!chunksText || chunksText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No indexed study material found for the selected document or subject. Please upload documents first.',
      });
    }

    // Generate summary via Gemini
    const content = await generateSummaryFromContext({
      contextText: chunksText.substring(0, 15000),
      docTitle,
      subject,
      type,
      length,
      topicOrChapter,
    });

    const newSummary = await Summary.create({
      documentId: documentId || null,
      documentTitle: docTitle,
      subject,
      type,
      length,
      topicOrChapter,
      content,
    });

    res.status(201).json({
      success: true,
      message: 'Summary generated successfully.',
      summary: newSummary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all summaries
 * GET /api/summary
 */
export const getSummaries = async (req, res, next) => {
  try {
    const { documentId, subject } = req.query;
    const query = {};
    if (documentId) query.documentId = documentId;
    if (subject && subject !== 'All') query.subject = new RegExp(`^${subject}$`, 'i');

    const summaries = await Summary.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: summaries.length, summaries });
  } catch (err) {
    next(err);
  }
};

/**
 * Get summary by ID
 * GET /api/summary/:id
 */
export const getSummaryById = async (req, res, next) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete summary
 * DELETE /api/summary/:id
 */
export const deleteSummary = async (req, res, next) => {
  try {
    const summary = await Summary.findByIdAndDelete(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Summary not found' });
    }
    res.json({ success: true, message: 'Summary deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
