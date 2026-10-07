import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Download,
  Trash2,
  Loader2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { summaryAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const SummaryPage = () => {
  const { documents, subjects, addToast, refreshAnalytics } = useApp();
  const location = useLocation();

  const [documentId, setDocumentId] = useState(location.state?.selectedDocId || '');
  const [subject, setSubject] = useState('General');
  const [type, setType] = useState('complete');
  const [length, setLength] = useState('medium');
  const [topicOrChapter, setTopicOrChapter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (location.state?.selectedDocId) {
      setDocumentId(location.state.selectedDocId);
    }
  }, [location.state]);

  const summaryTypes = [
    { id: 'complete', label: 'Complete Document', desc: 'Holistic overview of full material' },
    { id: 'chapter', label: 'Chapter Summary', desc: 'Focused chapter analysis' },
    { id: 'topic', label: 'Topic Summary', desc: 'Deep dive on specific subject topic' },
    { id: 'revision_notes', label: 'Quick Revision Notes', desc: 'High-yield bulleted cram notes' },
    { id: 'important_points', label: 'Important Points', desc: 'Numbered list of critical principles' },
    { id: 'definitions', label: 'Definitions & Terms', desc: 'Glossary of key terminology' },
  ];

  const lengthOptions = [
    { id: 'brief', label: 'Brief', desc: '~200 words' },
    { id: 'medium', label: 'Medium', desc: '~500 words' },
    { id: 'detailed', label: 'Detailed', desc: '~1000+ words' },
  ];

  // Load existing summaries
  const fetchSummaries = async () => {
    try {
      const res = await summaryAPI.getAll();
      if (res.data?.success) {
        setSavedSummaries(res.data.summaries || []);
        if (res.data.summaries?.length > 0 && !currentSummary) {
          setCurrentSummary(res.data.summaries[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load summaries:', err);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (documents.length === 0) {
      addToast('Please upload at least one document first.', 'warning');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await summaryAPI.generate({
        documentId: documentId || null,
        subject,
        type,
        length,
        topicOrChapter: topicOrChapter.trim(),
      });

      if (res.data?.success) {
        setCurrentSummary(res.data.summary);
        addToast('Summary generated successfully!', 'success');
        fetchSummaries();
        refreshAnalytics();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate summary';
      addToast(errorMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSummary = async (id) => {
    if (!window.confirm('Delete this summary?')) return;
    try {
      await summaryAPI.delete(id);
      addToast('Summary deleted', 'info');
      setSavedSummaries((prev) => prev.filter((s) => s._id !== id));
      if (currentSummary?._id === id) {
        setCurrentSummary(savedSummaries.find((s) => s._id !== id) || null);
      }
      refreshAnalytics();
    } catch (err) {
      addToast('Failed to delete summary', 'error');
    }
  };

  const copyToClipboard = () => {
    if (!currentSummary?.content) return;
    navigator.clipboard.writeText(currentSummary.content);
    setCopied(true);
    addToast('Summary copied to clipboard!', 'success', 2000);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!currentSummary?.content) return;
    const blob = new Blob([currentSummary.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSummary.title || 'Summary'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-violet-400" />
          <span>Summary Generator</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Synthesize high-yield study summaries, key points, definitions, and revision notes from your uploaded materials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Config Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Configure Summary</span>
            </h2>

            {/* Document / Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Document</label>
              <select
                value={documentId}
                onChange={(e) => {
                  setDocumentId(e.target.value);
                  const found = documents.find((d) => d._id === e.target.value);
                  if (found?.subject) setSubject(found.subject);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">All Uploaded Documents</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title} ({d.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* Summary Format Types */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Summary Format</label>
              <div className="grid grid-cols-2 gap-2">
                {summaryTypes.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setType(st.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      type === st.id
                        ? 'bg-violet-600/20 border-violet-500/80 text-violet-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold leading-snug">{st.label}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Topic / Chapter */}
            {(type === 'chapter' || type === 'topic') && (
              <div className="space-y-1.5 animate-slide-up">
                <label className="text-xs font-semibold text-slate-300">
                  Specific Topic / Chapter Name
                </label>
                <input
                  type="text"
                  value={topicOrChapter}
                  onChange={(e) => setTopicOrChapter(e.target.value)}
                  placeholder="e.g. Memory Management or Chapter 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {/* Depth / Length Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Detail Level</label>
              <div className="grid grid-cols-3 gap-2">
                {lengthOptions.map((lo) => (
                  <button
                    key={lo.id}
                    type="button"
                    onClick={() => setLength(lo.id)}
                    className={`py-2 rounded-xl text-center border text-xs transition-all ${
                      length === lo.id
                        ? 'bg-violet-600 text-white font-bold border-violet-500 shadow-md shadow-violet-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>{lo.label}</div>
                    <div className="text-[9px] opacity-70">{lo.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating || documents.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                isGenerating || documents.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 hover:scale-[1.02]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Summary with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </form>

          {/* Past Summaries Sidebar List */}
          {savedSummaries.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Saved Summaries ({savedSummaries.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedSummaries.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => setCurrentSummary(s)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      currentSummary?._id === s._id
                        ? 'bg-violet-950/40 border-violet-500/40 text-violet-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-200 truncate">{s.documentTitle}</div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {s.type.replace('_', ' ')} • {s.length}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSummary(s._id);
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

        {/* Right Output Viewer (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 min-h-[500px] flex flex-col justify-between space-y-6">
            {currentSummary ? (
              <div className="space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase border border-violet-500/30">
                        {currentSummary.type?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {currentSummary.length} Length
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {currentSummary.documentTitle || 'Summary Notes'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={downloadMarkdown}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export MD</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Rendered Summary Content */}
                <div className="prose prose-invert prose-violet prose-sm sm:prose-base max-w-none space-y-3 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentSummary.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-16 text-slate-500">
                <FileText className="w-12 h-12 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-400">No Summary Selected</h3>
                <p className="text-xs max-w-xs">
                  Configure your preferences on the left and click "Generate Summary" to produce AI study notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
