import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileText,
  Search,
  Trash2,
  MessageSquareQuote,
  HelpCircle,
  Layers,
  Eye,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const DocumentsPage = () => {
  const {
    documents,
    subjects,
    selectedSubject,
    setSelectedSubject,
    setActiveDocument,
    refreshDocuments,
    refreshAnalytics,
    addToast,
    isLoadingDocs,
  } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Filter documents by subject and search query
  const filteredDocs = documents.filter((doc) => {
    const matchesSubject =
      selectedSubject === 'All' || doc.subject?.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}" and all its indexed chunks?`)) {
      return;
    }

    try {
      setDeletingId(docId);
      const res = await documentAPI.delete(docId);
      if (res.data?.success) {
        addToast(`Document "${docTitle}" deleted successfully.`, 'success');
        refreshDocuments();
        refreshAnalytics();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete document', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAction = (doc, route) => {
    setActiveDocument(doc);
    navigate(route, { state: { selectedDocId: doc._id } });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-indigo-400" />
            <span>My Documents</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your indexed study materials, view chunk metadata, and launch AI study tools.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search & Subject Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or subject..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Subject Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {subjects.map((subj) => {
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {subj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoadingDocs && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span>Loading your documents...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingDocs && filteredDocs.length === 0 && (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No documents found</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              {searchQuery || selectedSubject !== 'All'
                ? 'Try adjusting your search query or subject filter.'
                : 'Upload your first study note or PDF textbook to get started with AI learning.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      )}

      {/* Documents Grid */}
      {!isLoadingDocs && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const isDeleting = deletingId === doc._id;
            return (
              <div
                key={doc._id}
                className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/20 group"
              >
                <div className="space-y-3">
                  {/* Top Row: Subject & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                      {doc.subject || 'General'}
                    </span>

                    {doc.status === 'ready' ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : doc.status === 'failed' ? (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>

                  {/* Title & File Name */}
                  <div className="space-y-1">
                    <h3
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      className="font-bold text-white text-base leading-snug group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-2"
                    >
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{doc.fileName}</span>
                    </p>
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Pages: </span>
                      <span className="font-semibold text-slate-200">{doc.totalPages || 1}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Chunks: </span>
                      <span className="font-semibold text-slate-200">{doc.totalChunks || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Size: </span>
                      <span className="font-semibold text-slate-200">
                        {((doc.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Uploaded: </span>
                      <span className="font-semibold text-slate-200">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Learning Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleAction(doc, '/chat')}
                      title="Ask AI Chat"
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                    >
                      <MessageSquareQuote className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(doc, '/summary')}
                      title="Generate Summary"
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-violet-600 text-slate-300 hover:text-white transition-all"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(doc, '/quiz')}
                      title="Generate Quiz"
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600 text-slate-300 hover:text-white transition-all"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(doc, '/flashcards')}
                      title="Flashcards"
                      className="flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-amber-600 text-slate-300 hover:text-white transition-all"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Chunks</span>
                    </button>

                    <button
                      disabled={isDeleting}
                      onClick={() => handleDelete(doc._id, doc.title)}
                      className="text-xs text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete Document"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
