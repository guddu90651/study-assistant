import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Layers,
  MessageSquareQuote,
  HelpCircle,
  Search,
  Sparkles,
  BookOpen,
  Hash,
  Loader2,
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const DocumentViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveDocument } = useApp();

  const [document, setDocument] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchChunk, setSearchChunk] = useState('');
  const [selectedPage, setSelectedPage] = useState('all');

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        setIsLoading(true);
        const res = await documentAPI.getById(id);
        if (res.data?.success) {
          setDocument(res.data.document);
          setChunks(res.data.chunks || []);
          setActiveDocument(res.data.document);
        }
      } catch (err) {
        console.error('Failed to load document:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDoc();
  }, [id, setActiveDocument]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <span>Loading document chunks...</span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Document Not Found</h2>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Documents</span>
        </Link>
      </div>
    );
  }

  // Filter chunks by search term and selected page
  const filteredChunks = chunks.filter((c) => {
    const matchesPage = selectedPage === 'all' || String(c.pageNumber) === String(selectedPage);
    const matchesSearch = !searchChunk.trim() || c.text?.toLowerCase().includes(searchChunk.toLowerCase());
    return matchesPage && matchesSearch;
  });

  const uniquePages = Array.from(new Set(chunks.map((c) => c.pageNumber))).sort((a, b) => a - b);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/documents')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Documents</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/chat', { state: { selectedDocId: document._id } })}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Chat With Doc</span>
          </button>

          <button
            onClick={() => navigate('/summary', { state: { selectedDocId: document._id } })}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>Summarize</span>
          </button>

          <button
            onClick={() => navigate('/quiz', { state: { selectedDocId: document._id } })}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>

      {/* Document Overview Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              {document.subject || 'General'}
            </div>
            <h1 className="text-2xl font-black text-white">{document.title}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>File: {document.fileName}</span>
              <span>•</span>
              <span>{((document.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              <span>•</span>
              <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xl font-bold text-white">{document.totalPages || 1}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pages</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xl font-bold text-indigo-400">{document.totalChunks || chunks.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vector Chunks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chunks Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Extracted Semantic Chunks ({filteredChunks.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              These chunks are embedded in 768-dimensional vector space for semantic retrieval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Filter */}
            {uniquePages.length > 1 && (
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Pages ({uniquePages.length})</option>
                {uniquePages.map((p) => (
                  <option key={p} value={p}>
                    Page {p}
                  </option>
                ))}
              </select>
            )}

            {/* Chunk Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchChunk}
                onChange={(e) => setSearchChunk(e.target.value)}
                placeholder="Filter chunk text..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Chunks List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredChunks.map((chunk) => (
            <div
              key={chunk.chunkIndex}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/20 text-indigo-300 font-mono font-bold">
                    Chunk #{chunk.chunkIndex + 1}
                  </span>
                  <span className="text-slate-400">Page {chunk.pageNumber}</span>
                </div>
                <span className="text-slate-500">{chunk.wordCount || 0} words</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {chunk.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
