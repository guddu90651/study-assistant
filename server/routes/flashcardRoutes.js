import express from 'express';
import {
  generateFlashcards,
  getFlashcardDecks,
  getFlashcardDeckById,
  updateCardStatus,
  deleteFlashcardDeck,
} from '../controllers/flashcardController.js';

const router = express.Router();

router.post('/generate', generateFlashcards);
router.get('/', getFlashcardDecks);
router.get('/:id', getFlashcardDeckById);
router.patch('/:deckId/card/:cardId', updateCardStatus);
router.delete('/:id', deleteFlashcardDeck);

export default router;
