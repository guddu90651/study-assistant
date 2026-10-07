import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Layers,
  FileText,
  Lightbulb,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';
import { personalizedStudyAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const PersonalizedStudyPage = () => {
  const { documents, subjects, analytics, addToast, refreshAnalytics } = useApp();
  const location = useLocation();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [weakTopic, setWeakTopic] = useState(location.state?.autoTopic || '');
  const [subject, setSubject] = useState(location.state?.subject || 'General');
  const [difficulty, setDifficulty] = useState('remedial');
  const [quizAttemptId, setQuizAttemptId] = useState(location.state?.quizAttemptId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Practice questions interactive visibility state { [qIdx]: { showHint: false, showAnswer: false } }
  const [revealedStates, setRevealedStates] = useState({});

  useEffect(() => {
    if (location.state?.autoTopic) {
      setWeakTopic(location.state.autoTopic);
    }
    if (location.state?.quizAttemptId) {
      setQuizAttemptId(location.state.quizAttemptId);
    }
    if (location.state?.subject) {
      setSubject(location.state.subject);
    }
  }, [location.state]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const res = await personalizedStudyAPI.getAll();
      if (res.data?.success) {
        setPlans(res.data.plans || []);
        if (res.data.plans?.length > 0 && !selectedPlan) {
          setSelectedPlan(res.data.plans[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load personalized plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!weakTopic.trim()) {
      addToast('Please enter the weak topic to remediate.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await personalizedStudyAPI.generate({
        weakTopic: weakTopic.trim(),
        subject,
        difficulty,
        quizAttemptId,
      });

      if (res.data?.success && res.data.plan) {
        addToast('Personalized remediation pack generated!', 'success');
        setPlans((prev) => [res.data.plan, ...prev]);
        setSelectedPlan(res.data.plan);
        setRevealedStates({});
        refreshAnalytics();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate plan', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this personalized study pack?')) return;
    try {
      await personalizedStudyAPI.delete(id);
      addToast('Study plan deleted', 'info');
      setPlans((prev) => prev.filter((p) => p._id !== id));
      if (selectedPlan?._id === id) {
        setSelectedPlan(plans.find((p) => p._id !== id) || null);
      }
      refreshAnalytics();
    } catch (err) {
      addToast('Failed to delete plan', 'error');
    }
  };

  const toggleHint = (idx) => {
    setRevealedStates((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        showHint: !prev[idx]?.showHint,
      },
    }));
  };

  const toggleAnswer = (idx) => {
    setRevealedStates((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        showAnswer: !prev[idx]?.showAnswer,
      },
    }));
  };

  const weakTopicsList = analytics?.weakTopics || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-400" />
          <span>Personalized Adaptive Study</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Adaptive remediation modules tailored specifically to strengthen your identified weak topics.
        </p>
      </div>

      {/* Generator & Quick Chips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Config & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleGeneratePlan}
            className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Generate Targeted Module</span>
              </h2>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/30">
                Adaptive AI
              </span>
            </div>

            {/* Quick Weak Topic Chips from Quizzes */}
            {weakTopicsList.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select from Quiz Weak Topics:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {weakTopicsList.slice(0, 4).map((wt) => (
                    <button
                      key={wt.topic}
                      type="button"
                      onClick={() => setWeakTopic(wt.topic)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        weakTopic === wt.topic
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-amber-300 hover:border-amber-500/50'
                      }`}
                    >
                      {wt.topic} ({wt.count}x)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Weak Topic</label>
              <input
                type="text"
                value={weakTopic}
                onChange={(e) => setWeakTopic(e.target.value)}
                placeholder="e.g. Deadlocks, Banker's Algorithm, Semaphore vs Mutex..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Subject Category</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Difficulty Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Remediation Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'remedial', label: 'Intuitive / ELI5', desc: 'Focus on fundamentals & analogies' },
                  { id: 'standard', label: 'Standard', desc: 'Balanced concepts & practice' },
                  { id: 'advanced', label: 'Advanced', desc: 'Complex edge cases & mastery' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`py-2 px-1 rounded-xl text-center border text-xs transition-all ${
                      difficulty === diff.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>{diff.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating || !weakTopic.trim()}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isGenerating || !weakTopic.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Adaptive Study Pack...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Remediation Pack</span>
                </>
              )}
            </button>
          </form>

          {/* Past Remediation Modules */}
          {plans.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Saved Remediation Modules ({plans.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {plans.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      setSelectedPlan(p);
                      setRevealedStates({});
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selectedPlan?._id === p._id
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-200 truncate">{p.weakTopic}</div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {p.subject} • {p.difficulty}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(p._id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Remediation Pack Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedPlan ? (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 capitalize">
                    {selectedPlan.difficulty} Remediation
                  </span>
                  <span className="text-xs text-slate-400">{selectedPlan.subject}</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Mastering: {selectedPlan.weakTopic}
                </h2>
              </div>

              {/* 1. Simple Intuitive Explanation */}
              <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <span>Intuitive Explanation & Concept Breakdown</span>
                </h3>
                <div className="text-sm text-slate-200 leading-relaxed font-sans prose prose-invert prose-indigo max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedPlan.simpleExplanation}
                  </ReactMarkdown>
                </div>
              </div>

              {/* 2. Key Concepts & Rules */}
              {selectedPlan.importantConcepts?.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Important Core Concepts & Rules</span>
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                    {selectedPlan.importantConcepts.map((concept, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Real World Examples & Analogies */}
              {selectedPlan.realWorldExamples?.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    <span>Real-World Examples & Analogies</span>
                  </h3>
                  <div className="space-y-2.5">
                    {selectedPlan.realWorldExamples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed"
                      >
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Interactive Step-by-Step Practice Questions */}
              {selectedPlan.practiceQuestions?.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Targeted Practice Questions ({selectedPlan.practiceQuestions.length})</span>
                  </h3>

                  <div className="space-y-4">
                    {selectedPlan.practiceQuestions.map((pq, idx) => {
                      const state = revealedStates[idx] || { showHint: false, showAnswer: false };
                      return (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                        >
                          <div className="font-bold text-white text-xs sm:text-sm leading-snug">
                            Q{idx + 1}. {pq.question}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {pq.hint && (
                              <button
                                type="button"
                                onClick={() => toggleHint(idx)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                              >
                                {state.showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{state.showHint ? 'Hide Hint' : 'Show Hint'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => toggleAnswer(idx)}
                              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold ml-2"
                            >
                              {state.showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{state.showAnswer ? 'Hide Solution' : 'Reveal Solution'}</span>
                            </button>
                          </div>

                          {state.showHint && pq.hint && (
                            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 animate-slide-up">
                              💡 <strong>Hint:</strong> {pq.hint}
                            </div>
                          )}

                          {state.showAnswer && (
                            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1 animate-slide-up">
                              <div className="font-bold">Answer: {pq.answer}</div>
                              {pq.explanation && (
                                <div className="text-slate-300 text-[11px] pt-1 border-t border-amber-900/60">
                                  {pq.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Revision Notes Recap */}
              {selectedPlan.revisionNotes?.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Quick Bullet Revision Notes</span>
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                    {selectedPlan.revisionNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl border border-slate-800 text-center space-y-4">
              <Target className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Remediation Pack Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a weak topic on the left or take a quiz to discover which topics need targeted remediation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
