import Chunk from '../models/Chunk.js';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { generateEmbedding } from './geminiService.js';

/**
 * Searches for the top-k most relevant chunks using vector similarity.
 * Supports:
 * - MongoDB Atlas $vectorSearch (if Atlas search index is active)
 * - Automatic Cosine Similarity calculation with filtering (resilient fallback)
 *
 * @param {Object} options
 * @param {string} options.query - User question or query string
 * @param {Array<number>} [options.queryEmbedding] - Precomputed query embedding vector
 * @param {string} [options.scope] - 'all' | 'document' | 'subject'
 * @param {string} [options.documentId] - Target document ID if scope === 'document'
 * @param {string} [options.subject] - Target subject if scope === 'subject'
 * @param {number} [options.topK=5] - Number of top chunks to retrieve
 * @param {number} [options.minSimilarity=0.25] - Minimum cosine similarity threshold
 */
export const searchSimilarChunks = async ({
  query,
  queryEmbedding = null,
  scope = 'all',
  documentId = null,
  subject = null,
  topK = 5,
  minSimilarity = 0.2,
}) => {
  try {
    // 1. Generate query embedding if not provided
    const embedding = queryEmbedding || (await generateEmbedding(query));

    // 2. Build MongoDB query filter
    const filter = {};
    if (scope === 'document' && documentId) {
      filter.documentId = documentId;
    } else if (scope === 'subject' && subject && subject !== 'All') {
      filter.subject = new RegExp(`^${subject}$`, 'i');
    }

    let results = [];

    // 3. Attempt Atlas $vectorSearch aggregation first
    try {
      const vectorSearchStage = {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: Math.max(50, topK * 10),
          limit: topK,
        },
      };

      if (Object.keys(filter).length > 0) {
        vectorSearchStage.$vectorSearch.filter = filter;
      }

      const atlasResults = await Chunk.aggregate([
        vectorSearchStage,
        {
          $project: {
            _id: 1,
            documentId: 1,
            documentTitle: 1,
            pageNumber: 1,
            chunkIndex: 1,
            text: 1,
            subject: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      if (atlasResults && atlasResults.length > 0) {
        return atlasResults;
      }
    } catch (atlasErr) {
      // Atlas $vectorSearch index not configured or local environment - proceed to exact vector similarity
      // (Silent fallback to ensure smooth user experience)
    }

    // 4. Exact Vector Similarity Search Fallback
    const candidateChunks = await Chunk.find(filter)
      .select('documentId documentTitle pageNumber chunkIndex text subject embedding')
      .lean();

    if (!candidateChunks || candidateChunks.length === 0) {
      return [];
    }

    // Compute cosine similarity for each chunk
    const scoredChunks = candidateChunks.map((chunk) => {
      const sim = cosineSimilarity(embedding, chunk.embedding || []);
      return {
        _id: chunk._id,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        subject: chunk.subject,
        score: sim,
      };
    });

    // Sort descending by similarity score and take top-K
    results = scoredChunks
      .filter((c) => c.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  } catch (err) {
    console.error('[Vector Search Error]:', err);
    throw err;
  }
};
