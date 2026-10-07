import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Play,
  History,
  CheckCircle2,
  Award,
  Clock,
  Loader2,
} from 'lucide-react';
import { quizAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const QuizGeneratorPage = () => {
  const { documents, subjects, addToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [documentId, setDocumentId] = useState(location.state?.selectedDocId || '');
  const [subject, setSubject] = useState('General');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionType, setQuestionType] = useState('mcq');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    if (location.state?.selectedDocId) {
      setDocumentId(location.state.selectedDocId);
    }
  }, [location.state]);

  const fetchHistory = async () => {
    try {
      const res = await quizAPI.getHistory();
      if (res.data?.success) {
        setQuizHistory(res.data.attempts || []);
      }
    } catch (err) {
      console.error('Failed to load quiz history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      addToast('Please upload study materials first to generate a quiz.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await quizAPI.generate({
        documentId: documentId || null,
        subject,
        topic: topic.trim(),
        difficulty,
        questionType,
        totalQuestions: Number(totalQuestions),
      });

      if (res.data?.success && res.data.quiz) {
        addToast('Quiz generated successfully! Starting quiz...', 'success');
        navigate(`/quiz/attempt/${res.data.quiz._id}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate quiz';
      addToast(errorMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-emerald-400" />
          <span>Quiz Generator</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Test your knowledge with AI-crafted assessments, detect weak topics, and track mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Quiz Generator Form (6 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleGenerateQuiz}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Create New Assessment</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Grounded in RAG context</span>
            </div>

            {/* Target Document */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Study Material</label>
              <select
                value={documentId}
                onChange={(e) => {
                  setDocumentId(e.target.value);
                  const found = documents.find((d) => d._id === e.target.value);
                  if (found?.subject) setSubject(found.subject);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Uploaded Documents</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title} ({d.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Focus Topic (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Focus Subtopic (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Process Scheduling, Banker's Algorithm, or leave blank for all"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            {/* Question Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Question Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mcq', label: 'Multiple Choice' },
                  { id: 'true_false', label: 'True / False' },
                  { id: 'short_answer', label: 'Short Answer' },
                  { id: 'mixed', label: 'Mixed Types' },
                ].map((qt) => (
                  <button
                    key={qt.id}
                    type="button"
                    onClick={() => setQuestionType(qt.id)}
                    className={`py-2 px-2 text-center rounded-xl border text-xs font-medium transition-all ${
                      questionType === qt.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'easy', label: 'Easy' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'hard', label: 'Hard' },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id)}
                      className={`py-2 rounded-xl text-center border text-xs font-medium transition-all ${
                        difficulty === diff.id
                          ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Question Count</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setTotalQuestions(cnt)}
                      className={`py-2 rounded-xl text-center border text-xs font-medium transition-all ${
                        totalQuestions === cnt
                          ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-md shadow-emerald-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cnt} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate & Start Button */}
            <button
              type="submit"
              disabled={isGenerating || documents.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                isGenerating || documents.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.01]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Custom Quiz with AI...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Generate & Start Quiz</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Past Quiz History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Quiz Attempts</span>
            </h2>

            {quizHistory.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {quizHistory.map((att) => {
                  const isHigh = att.percentage >= 80;
                  const isMed = att.percentage >= 50 && att.percentage < 80;
                  return (
                    <div
                      key={att._id}
                      onClick={() => navigate(`/quiz/results/${att._id}`)}
                      className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-200 text-xs truncate max-w-[200px] group-hover:text-emerald-300">
                          {att.quizTitle}
                        </div>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            isHigh
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : isMed
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {att.percentage}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {att.score} / {att.totalQuestions} Correct • {att.difficulty?.toUpperCase()}
                        </span>
                        <span>{new Date(att.completedAt).toLocaleDateString()}</span>
                      </div>

                      {att.weakTopics?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-amber-400">Weak:</span>
                          {att.weakTopics.slice(0, 2).map((wt, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-600/30"
                            >
                              {wt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Award className="w-8 h-8 mx-auto text-slate-700" />
                <p>No past quiz attempts yet. Generate a quiz on the left to start testing!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
