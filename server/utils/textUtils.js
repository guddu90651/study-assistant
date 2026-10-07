/**
 * Utility functions for text cleaning and normalization
 */

export const cleanText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';

  return rawText
    // Replace non-breaking spaces and unusual whitespace
    .replace(/[\u00A0\u1680​\u180e\u2000-\u200a​\u202f\u205f​\u3000]/g, ' ')
    // Replace multiple newlines with at most 2
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple horizontal spaces with a single space
    .replace(/[ \t]{2,}/g, ' ')
    // Remove isolated unprintable control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
};

export const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const truncateSnippet = (text, maxLength = 240) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
