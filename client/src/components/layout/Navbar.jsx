import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, BookOpen, Filter, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar = () => {
  const {
    subjects,
    selectedSubject,
    setSelectedSubject,
    documents,
    activeDocument,
    setActiveDocument,
  } = useApp();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-medium">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {subjects.map((subj) => (
              <option key={subj} value={subj} className="bg-slate-900 text-slate-100">
                {subj}
              </option>
            ))}
          </select>
        </div>

        {/* Active Document Selector */}
        {documents.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Focused Doc:</span>
            <select
              value={activeDocument?._id || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setActiveDocument(null);
                } else {
                  const found = documents.find((d) => d._id === val);
                  setActiveDocument(found || null);
                }
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-100">
                All Documents
              </option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id} className="bg-slate-900 text-slate-100">
                  {doc.title} ({doc.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/chat')}
          className="hidden sm:flex items-center gap-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        <Link
          to="/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload PDF</span>
        </Link>
      </div>
    </header>
  );
};
