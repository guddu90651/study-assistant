import FlashcardDeck from '../models/FlashcardDeck.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { searchSimilarChunks } from '../services/vectorService.js';
import { generateFlashcardsFromContext } from '../services/geminiService.js';

/**
 * Generate a new flashcard deck
 * POST /api/flashcards/generate
 */
export const generateFlashcards = async (req, res, next) => {
  try {
    const {
      documentId = null,
      subject = 'General',
      topic = '',
      cardCount = 8,
    } = req.body;

    let docTitle = 'Uploaded Material';
    let chunksText = '';

    if (documentId) {
      const doc = await Document.findById(documentId);
      if (doc) docTitle = doc.title;

      if (topic) {
        const targeted = await searchSimilarChunks({
          query: topic,
          scope: 'document',
          documentId,
          topK: 8,
        });
        chunksText = targeted.map((c) => c.text).join('\n\n');
      } else {
        const chunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 }).limit(15);
        chunksText = chunks.map((c) => c.text).join('\n\n');
      }
    } else {
      const filter = subject && subject !== 'All' ? { subject: new RegExp(`^${subject}$`, 'i') } : {};
      const chunks = await Chunk.find(filter).sort({ createdAt: -1 }).limit(15);
      chunksText = chunks.map((c) => c.text).join('\n\n');
    }

    if (!chunksText || chunksText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No study material found to generate flashcards. Please upload notes or PDFs first.',
      });
    }

    const deckData = await generateFlashcardsFromContext({
      contextText: chunksText.substring(0, 15000),
      docTitle,
      subject,
      topic,
      cardCount: Number(cardCount) || 8,
    });

    const newDeck = await FlashcardDeck.create({
      documentId: documentId || null,
      documentTitle: docTitle,
      title: deckData.title || `${subject} Flashcards`,
      subject,
      topic: topic || subject,
      totalCards: deckData.cards.length,
      cards: deckData.cards,
    });

    res.status(201).json({
      success: true,
      message: 'Flashcards generated successfully.',
      deck: newDeck,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all flashcard decks
 * GET /api/flashcards
 */
export const getFlashcardDecks = async (req, res, next) => {
  try {
    const { documentId, subject } = req.query;
    const query = {};
    if (documentId) query.documentId = documentId;
    if (subject && subject !== 'All') query.subject = new RegExp(`^${subject}$`, 'i');

    const decks = await FlashcardDeck.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: decks.length, decks });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a flashcard deck by ID
 * GET /api/flashcards/:id
 */
export const getFlashcardDeckById = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Flashcard deck not found' });
    }
    res.json({ success: true, deck });
  } catch (err) {
    next(err);
  }
};

/**
 * Update individual card learning status (known, difficult, new)
 * PATCH /api/flashcards/:deckId/card/:cardId
 */
export const updateCardStatus = async (req, res, next) => {
  try {
    const { deckId, cardId } = req.params;
    const { status } = req.body;

    if (!['new', 'known', 'difficult'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid card status' });
    }

    const deck = await FlashcardDeck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }

    const card = deck.cards.find((c) => String(c.id) === String(cardId) || String(c._id) === String(cardId));
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found in deck' });
    }

    card.status = status;
    card.lastReviewed = new Date();
    await deck.save();

    res.json({
      success: true,
      message: `Card marked as ${status}`,
      deck,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete flashcard deck
 * DELETE /api/flashcards/:id
 */
export const deleteFlashcardDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findByIdAndDelete(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Deck not found' });
    }
    res.json({ success: true, message: 'Flashcard deck deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
