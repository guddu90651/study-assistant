import Chunk from '../models/Chunk.js';
import Document from '../models/Document.js';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { generateEmbedding } from './geminiService.js';

/**
 * Extract meaningful search keywords from query (excluding common stop words)
 */
const extractKeywords = (query) => {
  if (!query) return [];
  const stopWords = new Set([
    'what', 'is', 'the', 'a', 'an', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'are', 'was',
    'were', 'this', 'that', 'these', 'those', 'explain', 'describe', 'tell', 'me', 'about',
    'how', 'why', 'can', 'you', 'give', 'from', 'my', 'uploaded', 'notes', 'document', 'pdf',
    'please', 'show', 'list', 'define', 'kya', 'hai', 'batao', 'samjhao'
  ]);
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
};

/**
 * Searches for the top-k most relevant chunks using Hybrid Vector & Keyword similarity.
 *
 * @param {Object} options
 * @param {string} options.query - User question or query string
 * @param {Array<number>} [options.queryEmbedding] - Precomputed query embedding vector
 * @param {string} [options.scope] - 'all' | 'document' | 'subject'
 * @param {string} [options.documentId] - Target document ID if scope === 'document'
 * @param {string} [options.subject] - Target subject if scope === 'subject'
 * @param {number} [options.topK=5] - Number of top chunks to retrieve
 * @param {number} [options.minSimilarity=0.05] - Minimum threshold floor
 */
export const searchSimilarChunks = async ({
  query,
  queryEmbedding = null,
  scope = 'all',
  documentId = null,
  subject = null,
  topK = 5,
  minSimilarity = 0.05,
}) => {
  try {
    // 1. Build MongoDB query filter
    const filter = {};
    if (scope === 'document' && documentId && documentId !== 'all') {
      filter.documentId = documentId;
    } else if (scope === 'subject' && subject && subject !== 'All') {
      filter.subject = new RegExp(`^${subject}$`, 'i');
    }

    // 2. Fetch candidate chunks
    let candidateChunks = await Chunk.find(filter)
      .select('documentId documentTitle pageNumber chunkIndex text subject embedding')
      .lean();

    // If no chunks found with specific subject/doc filter, fallback to all chunks
    if ((!candidateChunks || candidateChunks.length === 0) && (filter.documentId || filter.subject)) {
      candidateChunks = await Chunk.find()
        .select('documentId documentTitle pageNumber chunkIndex text subject embedding')
        .lean();
    }

    if (!candidateChunks || candidateChunks.length === 0) {
      return [];
    }

    // 3. Generate query embedding
    const embedding = queryEmbedding || (await generateEmbedding(query));
    const keywords = extractKeywords(query);

    // 4. Score each chunk using Hybrid Search (Vector + Keyword matching)
    const scoredChunks = candidateChunks.map((chunk) => {
      // Vector Cosine Similarity
      const vSim = cosineSimilarity(embedding, chunk.embedding || []);

      // Keyword match score
      let keywordScore = 0;
      if (keywords.length > 0 && chunk.text) {
        const textLower = chunk.text.toLowerCase();
        let matches = 0;
        for (const kw of keywords) {
          if (textLower.includes(kw)) matches++;
        }
        keywordScore = matches / keywords.length;
      }

      // Hybrid combined score (70% Vector + 30% Keyword boost)
      const hybridScore = (vSim * 0.7) + (keywordScore * 0.3);

      return {
        _id: chunk._id,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        subject: chunk.subject,
        score: Math.max(vSim, hybridScore),
        vectorScore: vSim,
        keywordScore,
      };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return top-K chunks
    const results = scoredChunks.slice(0, topK);

    return results;
  } catch (err) {
    console.error('[Vector Search Error]:', err);
    throw err;
  }
};
