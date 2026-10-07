import pdf from 'pdf-parse';
import { cleanText } from '../utils/textUtils.js';

/**
 * Extracts structured text and page information from a PDF buffer or plain text file.
 * Returns an array of page objects: [{ pageNumber: 1, text: '...' }, ...]
 */
export const extractDocumentText = async (fileBuffer, fileType = 'pdf', originalName = '') => {
  if (fileType === 'pdf' || originalName.toLowerCase().endsWith('.pdf')) {
    try {
      const pageTexts = [];

      // Custom page renderer to capture page number with text
      const customPagerender = async (pageData) => {
        const textContent = await pageData.getTextContent();
        let lastY;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += (item.str || '') + ' ';
          } else {
            text += '\n' + (item.str || '') + ' ';
          }
          lastY = item.transform[5];
        }
        return text;
      };

      const options = {
        pagerender: customPagerender,
      };

      const data = await pdf(fileBuffer, options);
      const totalPages = data.numpages || 1;

      // Split parsed text by Form Feed \f or parse page blocks
      // Fallback: If pages are separated by form feed
      const rawPages = data.text.split(/\f|\x0c/);

      if (rawPages.length >= totalPages && totalPages > 1) {
        for (let i = 0; i < totalPages; i++) {
          const cleaned = cleanText(rawPages[i] || '');
          if (cleaned.length > 0) {
            pageTexts.push({
              pageNumber: i + 1,
              text: cleaned,
            });
          }
        }
      } else {
        // Single block or uniform text, distribute cleanly
        const fullCleaned = cleanText(data.text);
        if (fullCleaned.length === 0) {
          throw new Error('No readable text could be extracted from this PDF. It may contain scanned images.');
        }

        // If multi-page but didn't split by \f, split text proportionally
        const charsPerPage = Math.ceil(fullCleaned.length / Math.max(1, totalPages));
        for (let i = 0; i < totalPages; i++) {
          const start = i * charsPerPage;
          const pageChunk = fullCleaned.substring(start, start + charsPerPage);
          if (pageChunk.trim().length > 0) {
            pageTexts.push({
              pageNumber: i + 1,
              text: pageChunk.trim(),
            });
          }
        }
      }

      return {
        totalPages: totalPages,
        pages: pageTexts.length > 0 ? pageTexts : [{ pageNumber: 1, text: cleanText(data.text) }],
        fullText: cleanText(data.text),
      };
    } catch (err) {
      console.error('[PDF Extraction Error]:', err);
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  } else {
    // Plain text / markdown / study notes
    const rawContent = fileBuffer.toString('utf-8');
    const cleaned = cleanText(rawContent);

    // Split text notes every ~2000 chars into simulated pages if large
    const pageSize = 2000;
    const pageCount = Math.max(1, Math.ceil(cleaned.length / pageSize));
    const pages = [];

    for (let i = 0; i < pageCount; i++) {
      const start = i * pageSize;
      const pageText = cleaned.substring(start, start + pageSize);
      if (pageText.trim().length > 0) {
        pages.push({
          pageNumber: i + 1,
          text: pageText.trim(),
        });
      }
    }

    return {
      totalPages: pageCount,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleaned }],
      fullText: cleaned,
    };
  }
};
