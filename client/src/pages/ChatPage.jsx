import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  BookOpen,
  Filter,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const ChatPage = () => {
  const { documents, subjects, addToast } = useApp();
  const location = useLocation();

  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('study_chat_session') || `session_${Date.now()}`;
  });

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState('all'); // 'all' | 'document' | 'subject'
  const [selectedDocId, setSelectedDocId] = useState(location.state?.selectedDocId || '');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('study_chat_session', sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (location.state?.selectedDocId) {
      setScope('document');
      setSelectedDocId(location.state.selectedDocId);
    }
  }, [location.state]);

  // Load chat history for session
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await chatAPI.getHistory(sessionId);
        if (res.data?.success && res.data.messages?.length > 0) {
          setMessages(res.data.messages);
        } else {
          // Default initial friendly greeting
          setMessages([
            {
              _id: 'welcome',
              role: 'assistant',
              content:
                "👋 Hello! I'm your **AI Study Assistant**.\n\nAsk me any question about your uploaded textbooks or notes. I will search your MongoDB Vector Index, retrieve relevant passages, and provide grounded answers with exact document & page references.",
              citations: [],
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchHistory();
  }, [sessionId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Optimistically add user message
    const tempUserMsg = {
      _id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      scope: { type: scope, documentId: selectedDocId, subject: selectedSubject },
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await chatAPI.sendMessage({
        question: userText,
        scope,
        documentId: scope === 'document' ? selectedDocId : null,
        subject: scope === 'subject' ? selectedSubject : null,
        sessionId,
      });

      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.message]);
      } else {
        throw new Error(res.data?.message || 'Failed to generate answer');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error communicating with AI service';
      addToast(errorMsg, 'error');

      setMessages((prev) => [
        ...prev,
        {
          _id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error:** ${errorMsg}. Please verify your network and server settings.`,
          citations: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all conversation history in this session?')) return;
    try {
      await chatAPI.clearHistory(sessionId);
      const newSess = `session_${Date.now()}`;
      setSessionId(newSess);
      setMessages([
        {
          _id: 'welcome',
          role: 'assistant',
          content: '✨ Chat cleared! Ask me anything about your uploaded study material.',
          citations: [],
        },
      ]);
      addToast('Chat history cleared', 'info');
    } catch (err) {
      addToast('Failed to clear history', 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard!', 'success', 2000);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sampleQuestions = [
    'What are the key concepts explained in my uploaded notes?',
    'Explain the main definitions with examples.',
    'Summarize the core differences between primary topics.',
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-7.5rem)] flex flex-col space-y-3 animate-fade-in">
      {/* Header & Scope Filter Controls */}
      <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Search Scope:</span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scope === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setScope('document')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scope === 'document'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Specific Document
            </button>
            <button
              onClick={() => setScope('subject')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scope === 'subject'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              By Subject
            </button>
          </div>

          {/* Sub-selectors */}
          {scope === 'document' && (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
            >
              <option value="">-- Choose Document --</option>
              {documents.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}

          {scope === 'subject' && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleClearHistory}
          title="Clear Chat History"
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const hasCitations = msg.citations && msg.citations.length > 0;
          const isStrictRefusal = msg.content?.includes("I couldn't find enough information about this topic");

          return (
            <div
              key={msg._id || index}
              className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md text-white mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`group relative rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-[88%] sm:max-w-[80%] ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                    : isStrictRefusal
                    ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200 rounded-tl-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none shadow-md'
                }`}
              >
                {/* Message Header / Action */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-400">Grounded RAG Response</span>
                    <button
                      onClick={() => copyToClipboard(msg.content, msg._id)}
                      className="text-slate-400 hover:text-white p-1 transition-colors flex items-center gap-1"
                      title="Copy Answer"
                    >
                      {copiedId === msg._id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px]">Copy</span>
                    </button>
                  </div>
                )}

                {/* Markdown Content */}
                <div className="prose prose-invert prose-indigo prose-sm max-w-none break-words space-y-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Source Citations Section */}
                {!isUser && hasCitations && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Referenced Sources ({msg.citations.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {msg.citations.map((cite, cIdx) => {
                        const isExpanded = expandedCitationIndex === `${msg._id}_${cIdx}`;
                        return (
                          <div
                            key={cIdx}
                            onClick={() =>
                              setExpandedCitationIndex(isExpanded ? null : `${msg._id}_${cIdx}`)
                            }
                            className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 p-2.5 rounded-xl cursor-pointer transition-all space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-200 truncate max-w-[160px]">
                                📄 {cite.documentTitle || 'Document'}
                              </span>
                              <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-500/30">
                                Page {cite.pageNumber || 1}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {cite.snippet}
                            </p>

                            {isExpanded && (
                              <div className="pt-2 mt-1 border-t border-slate-800 text-[11px] text-slate-300 animate-fade-in font-mono bg-slate-900/80 p-2 rounded-lg">
                                {cite.snippet}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-200 text-xs font-bold mt-1">
                  You
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 max-w-4xl mx-auto justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md text-white mt-1">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-300 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Searching vector database & synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && documents.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto px-1 py-1 shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold uppercase shrink-0">Suggestions:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(q);
              }}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="relative shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            documents.length === 0
              ? 'Please upload study materials first to start chatting...'
              : 'Ask any question based on your uploaded notes (e.g., "What is virtual memory?")...'
          }
          disabled={isLoading}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-5 pr-14 py-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-2xl transition-colors"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
            !inputValue.trim() || isLoading
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:scale-105'
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
