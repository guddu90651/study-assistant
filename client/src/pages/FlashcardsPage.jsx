import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';
import { flashcardAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const FlashcardsPage = () => {
  const { documents, subjects, addToast, refreshAnalytics } = useApp();
  const location = useLocation();

  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Generator form states
  const [genDocId, setGenDocId] = useState(location.state?.selectedDocId || '');
  const [genSubject, setGenSubject] = useState('General');
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDecks = async () => {
    try {
      setIsLoading(true);
      const res = await flashcardAPI.getAll();
      if (res.data?.success) {
        setDecks(res.data.decks || []);
        if (res.data.decks?.length > 0 && !selectedDeck) {
          setSelectedDeck(res.data.decks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load flashcard decks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      addToast('Please upload study material first to generate flashcards.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await flashcardAPI.generate({
        documentId: genDocId || null,
        subject: genSubject,
        topic: genTopic.trim(),
        cardCount: Number(genCount),
      });

      if (res.data?.success && res.data.deck) {
        addToast('Flashcard deck created successfully!', 'success');
        setDecks((prev) => [res.data.deck, ...prev]);
        setSelectedDeck(res.data.deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowCreateModal(false);
        refreshAnalytics();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate flashcards', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCardStatus = async (status) => {
    if (!selectedDeck || !activeCards[currentCardIndex]) return;
    const card = activeCards[currentCardIndex];

    try {
      await flashcardAPI.updateCardStatus(selectedDeck._id, card.id || card._id, status);

      // Update in local state
      setSelectedDeck((prev) => {
        if (!prev) return prev;
        const updatedCards = prev.cards.map((c) =>
          (c.id === card.id || c._id === card._id) ? { ...c, status } : c
        );
        return { ...prev, cards: updatedCards };
      });

      addToast(`Card marked as ${status}`, 'info', 1500);
      refreshAnalytics();

      // Auto advance to next card if not at end
      if (currentCardIndex < activeCards.length - 1) {
        setTimeout(() => {
          setIsFlipped(false);
          setCurrentCardIndex((prev) => prev + 1);
        }, 300);
      }
    } catch (err) {
      addToast('Failed to update card status', 'error');
    }
  };

  const handleDeleteDeck = async (id) => {
    if (!window.confirm('Delete this flashcard deck?')) return;
    try {
      await flashcardAPI.delete(id);
      addToast('Deck deleted', 'info');
      setDecks((prev) => prev.filter((d) => d._id !== id));
      if (selectedDeck?._id === id) {
        setSelectedDeck(decks.find((d) => d._id !== id) || null);
        setCurrentCardIndex(0);
      }
      refreshAnalytics();
    } catch (err) {
      addToast('Failed to delete deck', 'error');
    }
  };

  // Filter cards based on difficult filter & topic filter
  const activeCards = (selectedDeck?.cards || []).filter((card) => {
    const matchesDifficult = !onlyDifficult || card.status === 'difficult';
    const matchesTopic = selectedTopic === 'All' || card.topic === selectedTopic;
    return matchesDifficult && matchesTopic;
  });

  const currentCard = activeCards[currentCardIndex];
  const uniqueTopics = Array.from(new Set(selectedDeck?.cards?.map((c) => c.topic).filter(Boolean)));

  const knownCount = selectedDeck?.cards?.filter((c) => c.status === 'known').length || 0;
  const diffCount = selectedDeck?.cards?.filter((c) => c.status === 'difficult').length || 0;
  const totalCardsCount = selectedDeck?.cards?.length || 0;
  const masteryPercentage = totalCardsCount > 0 ? Math.round((knownCount / totalCardsCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-violet-400" />
            <span>Interactive Flashcards</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Active recall and spaced repetition flashcards extracted from your learning materials.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Flashcard Deck</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Decks Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Flashcard Decks ({decks.length})
            </h2>

            {decks.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {decks.map((deck) => {
                  const isSelected = selectedDeck?._id === deck._id;
                  const deckKnown = deck.cards?.filter((c) => c.status === 'known').length || 0;
                  const deckTotal = deck.cards?.length || 0;
                  const deckPercent = deckTotal > 0 ? Math.round((deckKnown / deckTotal) * 100) : 0;

                  return (
                    <div
                      key={deck._id}
                      onClick={() => {
                        setSelectedDeck(deck);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-500/50 text-white shadow-md'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 truncate max-w-[170px]">
                          {deck.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(deck._id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{deck.subject}</span>
                        <span>{deckTotal} cards</span>
                      </div>

                      {/* Progress line */}
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${deckPercent}%` }}
                          className="h-full bg-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-700" />
                <p>No decks created yet. Click "New Flashcard Deck" to generate one!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Card Practice Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDeck ? (
            <div className="space-y-6">
              {/* Deck Stats & Filter Toolbar */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-slate-300">
                    Mastery: <span className="text-emerald-400 font-bold">{masteryPercentage}%</span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <div className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-semibold">{knownCount}</span> known,{' '}
                    <span className="text-rose-400 font-semibold">{diffCount}</span> difficult
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Difficult Only Toggle */}
                  <button
                    onClick={() => {
                      setOnlyDifficult(!onlyDifficult);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      onlyDifficult
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Difficult Only ({diffCount})
                  </button>

                  {/* Topic Filter */}
                  {uniqueTopics.length > 1 && (
                    <select
                      value={selectedTopic}
                      onChange={(e) => {
                        setSelectedTopic(e.target.value);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="All">All Topics</option>
                      {uniqueTopics.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Interactive 3D Flip Card */}
              {activeCards.length > 0 && currentCard ? (
                <div className="space-y-6">
                  {/* Perspective wrapper */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="relative w-full h-80 sm:h-96 cursor-pointer select-none perspective-1000"
                  >
                    <div
                      className={`w-full h-full duration-500 rounded-3xl transition-transform transform-style-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* FRONT OF CARD */}
                      <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 border border-slate-700/80 flex flex-col justify-between backface-hidden shadow-2xl bg-gradient-to-b from-slate-900/90 to-slate-950">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                            {currentCard.topic || selectedDeck.subject}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {currentCardIndex + 1} / {activeCards.length}
                          </span>
                        </div>

                        <div className="text-center space-y-3 my-auto">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Question / Concept
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                            {currentCard.question}
                          </h3>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                          <RotateCw className="w-3.5 h-3.5 text-violet-400" />
                          <span>Click to flip card & reveal answer</span>
                        </div>
                      </div>

                      {/* BACK OF CARD */}
                      <div className="absolute inset-0 w-full h-full glass-panel rounded-3xl p-8 border border-violet-500/40 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950">
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                            Answer / Explanation
                          </span>
                          <span className="text-slate-400 text-xs font-mono">
                            {currentCardIndex + 1} / {activeCards.length}
                          </span>
                        </div>

                        <div className="text-center space-y-3 my-auto overflow-y-auto max-h-48 pr-1">
                          <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                            {currentCard.answer}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                          <RotateCw className="w-3.5 h-3.5 text-violet-400" />
                          <span>Click to flip back</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Controls (Mark Known / Difficult / Navigate) */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCardStatus('difficult')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          currentCard.status === 'difficult'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                            : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Mark Difficult</span>
                      </button>

                      <button
                        onClick={() => handleCardStatus('known')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          currentCard.status === 'known'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Mark Known</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={currentCardIndex === 0}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          currentCardIndex === 0
                            ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <span className="text-xs font-mono text-slate-400 px-2">
                        {currentCardIndex + 1} of {activeCards.length}
                      </span>

                      <button
                        onClick={() => {
                          setIsFlipped(false);
                          setCurrentCardIndex((prev) => Math.min(activeCards.length - 1, prev + 1));
                        }}
                        disabled={currentCardIndex === activeCards.length - 1}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          currentCardIndex === activeCards.length - 1
                            ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">All cards reviewed!</h3>
                  <p className="text-xs text-slate-400">
                    {onlyDifficult
                      ? 'No difficult cards in this deck! Great job.'
                      : 'You have reviewed all available flashcards in this selection.'}
                  </p>
                  {onlyDifficult && (
                    <button
                      onClick={() => setOnlyDifficult(false)}
                      className="text-xs text-indigo-400 hover:underline font-semibold"
                    >
                      Show all cards
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Flashcard Deck Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an existing deck from the left or generate a new set of flashcards from your study materials.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Generate Flashcard Deck</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Target Study Material</label>
                <select
                  value={genDocId}
                  onChange={(e) => {
                    setGenDocId(e.target.value);
                    const found = documents.find((d) => d._id === e.target.value);
                    if (found?.subject) setGenSubject(found.subject);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value="">All Uploaded Documents</option>
                  {documents.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} ({d.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Specific Subtopic (Optional)</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Memory Hierarchy, Paging, Deadlocks..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Card Count</label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-violet-500"
                >
                  <option value={5}>5 Flashcards</option>
                  <option value={8}>8 Flashcards</option>
                  <option value={12}>12 Flashcards</option>
                  <option value={16}>16 Flashcards</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || documents.length === 0}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Flashcards</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
