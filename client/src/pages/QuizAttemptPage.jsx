import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Flag,
} from 'lucide-react';
import { quizAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const QuizAttemptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast, refreshAnalytics } = useApp();

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: "Selected" }
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const res = await quizAPI.getById(id);
        if (res.data?.success && res.data.quiz) {
          setQuiz(res.data.quiz);
        } else {
          throw new Error('Quiz not found');
        }
      } catch (err) {
        addToast('Failed to load quiz', 'error');
        navigate('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate, addToast]);

  // Timer counter
  useEffect(() => {
    if (isLoading || isSubmitting) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isSubmitting]);

  const handleSelectAnswer = (qId, ans) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: ans,
    }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = quiz.questions.length;

    if (answeredCount < totalCount) {
      if (!window.confirm(`You answered ${answeredCount} of ${totalCount} questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payloadAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        userAnswer: userAnswers[q.id] || '',
      }));

      const res = await quizAPI.submitAttempt({
        quizId: quiz._id,
        answers: payloadAnswers,
        timeSpentSeconds: secondsElapsed,
      });

      if (res.data?.success && res.data.attempt) {
        addToast('Quiz submitted successfully!', 'success');
        refreshAnalytics();
        navigate(`/quiz/results/${res.data.attempt._id}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error submitting quiz', 'error');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span>Preparing your quiz...</span>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const currentQ = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Meta Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 capitalize">
            {quiz.difficulty}
          </span>
          <h1 className="font-bold text-white text-sm truncate max-w-xs">{quiz.title}</h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{progressPercent}% completed</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Question Topic & Type */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
            Topic: {currentQ.topic || quiz.subject}
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400 capitalize">
            {currentQ.type === 'mcq'
              ? 'Multiple Choice'
              : currentQ.type === 'true_false'
              ? 'True / False'
              : 'Short Answer'}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options / Input based on question type */}
        {currentQ.type === 'mcq' || currentQ.type === 'true_false' ? (
          <div className="space-y-3 pt-2">
            {(currentQ.options || (currentQ.type === 'true_false' ? ['True', 'False'] : [])).map(
              (option, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === option;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, option)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-md font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                            : 'border-slate-700 text-slate-400 group-hover:border-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-sm">{option}</span>
                    </div>

                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </button>
                );
              }
            )}
          </div>
        ) : (
          /* Short Answer Input */
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-400">Type your answer below:</label>
            <textarea
              rows={3}
              value={userAnswers[currentQ.id] || ''}
              onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
              placeholder="Enter your concise answer..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Navigation & Submit Bar */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Grading...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
