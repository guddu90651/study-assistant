import { cleanText, countWords } from '../utils/textUtils.js';

/**
 * Splits document pages into semantic chunks with overlap.
 * Each chunk retains its page number, index, subject, and document reference.
 *
 * @param {Array<{pageNumber: number, text: string}>} pages
 * @param {Object} options
 * @returns {Array<Object>} chunks
 */
export const createDocumentChunks = (
  pages,
  options = { chunkSize: 800, chunkOverlap: 150 }
) => {
  const { chunkSize = 800, chunkOverlap = 150 } = options;
  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageText = cleanText(page.text);
    if (!pageText || pageText.length === 0) continue;

    // If page text is within chunk size, keep it as a single chunk
    if (pageText.length <= chunkSize) {
      chunks.push({
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        text: pageText,
        charCount: pageText.length,
        wordCount: countWords(pageText),
      });
      continue;
    }

    // Split page text into sentences/paragraphs
    const paragraphs = pageText.split(/(?<=\n\n|\.\s+|\?\s+|\!\s+)/);
    let currentChunk = '';

    for (let i = 0; i < paragraphs.length; i++) {
      const segment = paragraphs[i].trim();
      if (!segment) continue;

      if ((currentChunk + ' ' + segment).length <= chunkSize) {
        currentChunk = currentChunk ? `${currentChunk} ${segment}` : segment;
      } else {
        if (currentChunk.trim().length > 0) {
          chunks.push({
            chunkIndex: globalChunkIndex++,
            pageNumber: page.pageNumber,
            text: currentChunk.trim(),
            charCount: currentChunk.trim().length,
            wordCount: countWords(currentChunk.trim()),
          });
        }

        // Calculate overlap from previous chunk
        if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
          const words = currentChunk.split(' ');
          const overlapWords = words.slice(-Math.min(words.length, Math.ceil(chunkOverlap / 6))).join(' ');
          currentChunk = `${overlapWords} ${segment}`.trim();
        } else {
          currentChunk = segment;
        }

        // If a single segment is still larger than chunkSize, slice it cleanly
        while (currentChunk.length > chunkSize) {
          const slicePoint = currentChunk.lastIndexOf(' ', chunkSize);
          const cutAt = slicePoint > chunkSize / 2 ? slicePoint : chunkSize;
          const piece = currentChunk.substring(0, cutAt).trim();
          
          if (piece.length > 0) {
            chunks.push({
              chunkIndex: globalChunkIndex++,
              pageNumber: page.pageNumber,
              text: piece,
              charCount: piece.length,
              wordCount: countWords(piece),
            });
          }
          currentChunk = currentChunk.substring(cutAt).trim();
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        text: currentChunk.trim(),
        charCount: currentChunk.trim().length,
        wordCount: countWords(currentChunk.trim()),
      });
    }
  }

  return chunks;
};
