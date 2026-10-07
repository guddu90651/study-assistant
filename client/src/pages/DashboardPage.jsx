import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  UploadCloud,
  MessageSquareQuote,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { useApp } from '../context/AppContext';

export const DashboardPage = () => {
  const { documents, analytics } = useApp();
  const navigate = useNavigate();

  const overview = analytics?.overview || {
    totalDocuments: documents.length,
    totalChunks: 0,
    totalQuestionsAsked: 0,
    totalSummaries: 0,
    totalQuizAttempts: 0,
    avgQuizScore: 0,
    totalFlashcards: 0,
    flashcardMasteryPercentage: 0,
    personalizedPlansCount: 0,
  };

  const weakTopics = analytics?.weakTopics || [];
  const scoreHistory = analytics?.quizScoreHistory || [];
  const subjectBreakdown = analytics?.subjectBreakdown || [];
  const flashcardStats = analytics?.flashcardStats || {
    total: 0,
    known: 0,
    difficult: 0,
    new: 0,
    masteryPercentage: 0,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/80 via-slate-900 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Study Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Learn Smarter with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Grounded RAG</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Upload course notes and textbooks to ask grounded questions, test yourself with AI-generated quizzes, practice flashcards, and master weak topics.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Study Material</span>
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
              <span>Ask AI Question</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Weak Topics Attention Banner */}
      {weakTopics.length > 0 && (
        <div className="rounded-2xl bg-amber-950/40 border border-amber-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-200">
                Identified Weak Topics from Quizzes ({weakTopics.length})
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Target these areas with automated adaptive study materials to boost retention.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {weakTopics.slice(0, 4).map((wt) => (
                  <span
                    key={wt.topic}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/60 border border-amber-700/40 text-amber-200 text-xs font-medium"
                  >
                    <span>{wt.topic}</span>
                    <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-400">
                      {wt.count}x missed
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() =>
              navigate('/personalized-study', {
                state: { autoTopic: weakTopics[0]?.topic },
              })
            }
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Remediate: {weakTopics[0]?.topic}</span>
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Documents</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{overview.totalDocuments}</div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>{overview.totalChunks} text chunks indexed</span>
          </p>
        </div>

        {/* Average Quiz Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Quiz Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {overview.totalQuizAttempts > 0 ? `${overview.avgQuizScore}%` : 'N/A'}
          </div>
          <p className="text-xs text-slate-400">
            {overview.totalQuizAttempts} {overview.totalQuizAttempts === 1 ? 'attempt' : 'attempts'} completed
          </p>
        </div>

        {/* Flashcard Mastery */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Card Mastery</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-violet-400">
            {flashcardStats.total > 0 ? `${flashcardStats.masteryPercentage}%` : '0%'}
          </div>
          <p className="text-xs text-slate-400">
            {flashcardStats.known} of {flashcardStats.total} mastered
          </p>
        </div>

        {/* Questions Asked */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Queries</span>
            <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{overview.totalQuestionsAsked}</div>
          <p className="text-xs text-slate-400">Grounded RAG answers</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz Performance Trend */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Quiz Score Trends</h3>
              <p className="text-xs text-slate-400">Performance percentage across recent quiz attempts</p>
            </div>
            <Link
              to="/quiz"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Take Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-56 w-full pt-4">
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="title" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    name="Score %"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <HelpCircle className="w-8 h-8 text-slate-600" />
                <span>No quiz history yet. Take your first quiz to see performance trends!</span>
              </div>
            )}
          </div>
        </div>

        {/* Subjects & Flashcard Progress */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-100 text-base">Flashcard Retention</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Mastery Progress</span>
                <span className="text-indigo-400">{flashcardStats.masteryPercentage}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(flashcardStats.known / Math.max(1, flashcardStats.total)) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title="Known"
                />
                <div
                  style={{ width: `${(flashcardStats.difficult / Math.max(1, flashcardStats.total)) * 100}%` }}
                  className="bg-rose-500 transition-all"
                  title="Difficult"
                />
                <div
                  style={{ width: `${(flashcardStats.new / Math.max(1, flashcardStats.total)) * 100}%` }}
                  className="bg-slate-600 transition-all"
                  title="New / Unreviewed"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400">{flashcardStats.known}</div>
                  <div className="text-[10px] text-slate-400">Known</div>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/20">
                  <div className="font-bold text-rose-400">{flashcardStats.difficult}</div>
                  <div className="text-[10px] text-slate-400">Difficult</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <div className="font-bold text-slate-300">{flashcardStats.new}</div>
                  <div className="text-[10px] text-slate-400">New</div>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/flashcards"
            className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Practice Flashcards</span>
          </Link>
        </div>
      </div>

      {/* Quick Access Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Learning Tool Suite</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/chat"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors">
                AI Grounded Chat
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask questions and receive precise answers with verified document page citations.
              </p>
            </div>
            <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <span>Open Chat</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/summary"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-violet-400 transition-colors">
                Summary Generator
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-yield chapter notes, definitions, key points, and brief overviews.
              </p>
            </div>
            <div className="text-xs text-violet-400 font-semibold flex items-center gap-1">
              <span>Create Summary</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/quiz"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                Quiz & Self-Test
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate MCQs, True/False, and short-answer tests to diagnose weak topics.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Generate Quiz</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/personalized-study"
            className="glass-panel glass-panel-hover p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                Personalized Study
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Remediation packs with intuitive explanations, real-world examples, and practice.
              </p>
            </div>
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>View Plans</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
