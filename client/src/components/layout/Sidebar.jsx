import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  MessageSquareQuote,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const { documents, analytics } = useApp();

  const navLinks = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/upload',
      label: 'Upload Notes / PDF',
      icon: UploadCloud,
      badge: 'New',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      to: '/documents',
      label: 'My Documents',
      icon: FolderOpen,
      count: documents.length,
    },
    {
      to: '/chat',
      label: 'AI Study Chat (RAG)',
      icon: MessageSquareQuote,
      highlight: true,
    },
    {
      to: '/summary',
      label: 'Summary Generator',
      icon: FileText,
    },
    {
      to: '/quiz',
      label: 'Quiz Generator',
      icon: HelpCircle,
    },
    {
      to: '/flashcards',
      label: 'Flashcards',
      icon: Layers,
    },
    {
      to: '/personalized-study',
      label: 'Personalized Study',
      icon: Sparkles,
      badge: analytics?.weakTopics?.length > 0 ? `${analytics.weakTopics.length} Weak` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen shrink-0 backdrop-blur-xl z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">
            Study<span className="text-indigo-400">AI</span> RAG
          </h1>
          <p className="text-xs text-slate-400 font-medium">Smart Learning Hub</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Learning Suite
        </div>

        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="w-4 h-4 transition-transform group-hover:scale-110 shrink-0"
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {typeof item.count === 'number' && (
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 group-hover:bg-slate-700">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-between font-semibold text-indigo-300">
            <span>RAG Grounded</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Grounded strictly in your uploaded notes with MongoDB Vector Search & Gemini.
          </p>
        </div>
      </div>
    </aside>
  );
};
