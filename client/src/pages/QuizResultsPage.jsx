import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  Clock,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { quizAPI } from '../services/api';

export const QuizResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setIsLoading(true);
        const res = await quizAPI.getAttemptById(id);
        if (res.data?.success && res.data.attempt) {
          setAttempt(res.data.attempt);
          if (res.data.attempt.percentage >= 80) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        }
      } catch (err) {
        console.error('Failed to load quiz results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttempt();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span>Loading your performance report...</span>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Quiz Attempt Not Found</h2>
        <Link to="/quiz" className="text-emerald-400 font-semibold text-sm">
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const isHigh = attempt.percentage >= 80;
  const isMed = attempt.percentage >= 50 && attempt.percentage < 80;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/quiz')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </button>

        <span className="text-xs text-slate-400">
          Completed on {new Date(attempt.completedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Score Overview Card */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border ${
              isHigh
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isMed
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-white">{attempt.quizTitle}</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Difficulty: <span className="font-semibold text-slate-200 capitalize">{attempt.difficulty}</span> • Subject:{' '}
              <span className="font-semibold text-slate-200">{attempt.subject}</span>
            </p>
          </div>

          {/* Big Score Display */}
          <div className="pt-2">
            <span
              className={`text-5xl sm:text-6xl font-black tracking-tight ${
                isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {attempt.percentage}%
            </span>
            <p className="text-sm font-semibold text-slate-300 mt-1">
              You got <span className="text-white font-bold">{attempt.score}</span> out of{' '}
              <span className="text-white font-bold">{attempt.totalQuestions}</span> questions correct.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate(`/quiz/attempt/${attempt.quizId}`)}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake This Quiz</span>
            </button>

            {attempt.weakTopics?.length > 0 && (
              <button
                onClick={() =>
                  navigate('/personalized-study', {
                    state: {
                      autoTopic: attempt.weakTopics[0],
                      quizAttemptId: attempt._id,
                      subject: attempt.subject,
                    },
                  })
                }
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Remediate Weak Topic: {attempt.weakTopics[0]}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weak Topics Analysis Alert */}
      {attempt.weakTopics && attempt.weakTopics.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Identified Weak Topics to Improve:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {attempt.weakTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() =>
                  navigate('/personalized-study', {
                    state: {
                      autoTopic: topic,
                      quizAttemptId: attempt._id,
                      subject: attempt.subject,
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all group"
              >
                <span>{topic}</span>
                <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Detailed Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Question Review & Explanations ({attempt.answers?.length})</span>
        </h2>

        <div className="space-y-4">
          {attempt.answers?.map((ans, idx) => (
            <div
              key={idx}
              className={`glass-panel p-6 rounded-2xl border space-y-4 ${
                ans.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : 'border-rose-500/30 bg-rose-950/10'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Q{idx + 1}.
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                      {ans.topic || attempt.subject}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base leading-snug">
                    {ans.questionText}
                  </h3>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shrink-0 ${
                    ans.isCorrect
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {ans.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </>
                  )}
                </div>
              </div>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Your Answer:</span>
                  <p
                    className={`font-semibold ${
                      ans.isCorrect ? 'text-emerald-300' : 'text-rose-300 line-through'
                    }`}
                  >
                    {ans.userAnswer || '(No answer provided)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Correct Answer:</span>
                  <p className="font-semibold text-emerald-400">{ans.correctAnswer}</p>
                </div>
              </div>

              {/* AI Grounded Explanation */}
              {ans.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    💡 Explanation:
                  </span>
                  <p className="leading-relaxed text-slate-300">{ans.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
