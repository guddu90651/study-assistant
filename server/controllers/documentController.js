import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Quiz from '../models/Quiz.js';
import Summary from '../models/Summary.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import { extractDocumentText } from '../services/pdfService.js';
import { createDocumentChunks } from '../services/chunkingService.js';
import { generateEmbeddingsBatch } from '../services/geminiService.js';
import { truncateSnippet } from '../utils/textUtils.js';

/**
 * Upload and process PDF or text document
 * POST /api/documents/upload
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or text file.' });
    }

    const { originalname, size, buffer } = req.file;
    const title = req.body.title?.trim() || originalname.replace(/\.[^/.]+$/, '');
    const subject = req.body.subject?.trim() || 'General';
    const fileType = originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'notes';

    // 1. Create document record with 'processing' status
    const newDoc = await Document.create({
      title,
      fileName: originalname,
      fileSize: size,
      fileType,
      subject,
      status: 'processing',
    });

    // 2. Process text asynchronously or in-band
    try {
      const extracted = await extractDocumentText(buffer, fileType, originalname);
      
      if (!extracted.pages || extracted.pages.length === 0) {
        throw new Error('No text could be extracted from the file.');
      }

      // 3. Create semantic chunks
      const chunkData = createDocumentChunks(extracted.pages, {
        chunkSize: 800,
        chunkOverlap: 150,
      });

      if (chunkData.length === 0) {
        throw new Error('Could not create chunks from extracted text.');
      }

      // 4. Generate embeddings for all chunks
      const embeddings = await generateEmbeddingsBatch(chunkData, 8);

      // 5. Store chunks in MongoDB
      const chunkDocuments = chunkData.map((chunk, index) => ({
        documentId: newDoc._id,
        documentTitle: newDoc.title,
        subject: newDoc.subject,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        charCount: chunk.charCount,
        wordCount: chunk.wordCount,
        embedding: embeddings[index] || new Array(768).fill(0),
      }));

      await Chunk.insertMany(chunkDocuments);

      // 6. Update document status to ready
      newDoc.status = 'ready';
      newDoc.totalPages = extracted.totalPages || 1;
      newDoc.totalChunks = chunkDocuments.length;
      newDoc.rawTextPreview = truncateSnippet(extracted.fullText, 400);
      await newDoc.save();

      res.status(201).json({
        success: true,
        message: 'Document uploaded and indexed successfully.',
        document: newDoc,
      });
    } catch (processErr) {
      newDoc.status = 'failed';
      newDoc.errorMessage = processErr.message;
      await newDoc.save();

      return res.status(422).json({
        success: false,
        message: `Document processing failed: ${processErr.message}`,
        document: newDoc,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get all documents with optional subject filter
 * GET /api/documents
 */
export const getDocuments = async (req, res, next) => {
  try {
    const { subject, search } = req.query;
    const query = {};

    if (subject && subject !== 'All') {
      query.subject = new RegExp(`^${subject}$`, 'i');
    }

    if (search && search.trim()) {
      query.title = new RegExp(search.trim(), 'i');
    }

    const documents = await Document.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get document by ID with chunk details
 * GET /api/documents/:id
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Retrieve sample chunks for preview
    const chunks = await Chunk.find({ documentId: document._id })
      .select('chunkIndex pageNumber text wordCount')
      .sort({ chunkIndex: 1 });

    res.json({
      success: true,
      document,
      chunks,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete document and cascade delete associated chunks, quizzes, flashcards, summaries
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await Promise.all([
      Document.findByIdAndDelete(documentId),
      Chunk.deleteMany({ documentId }),
      Quiz.deleteMany({ documentId }),
      Summary.deleteMany({ documentId }),
      FlashcardDeck.deleteMany({ documentId }),
    ]);

    res.json({
      success: true,
      message: 'Document and all associated indexed content deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get distinct subject list
 * GET /api/documents/subjects
 */
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Document.distinct('subject');
    res.json({
      success: true,
      subjects: ['All', ...subjects.filter(Boolean)],
    });
  } catch (err) {
    next(err);
  }
};
