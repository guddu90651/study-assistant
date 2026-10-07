import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  X,
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useApp } from '../context/AppContext';

export const UploadPage = () => {
  const { addToast, refreshDocuments, refreshAnalytics } = useApp();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [customSubject, setCustomSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0: Idle, 1: Extract, 2: Chunk, 3: Embed, 4: Storing, 5: Done
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const commonSubjects = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Biology',
    'Chemistry',
    'History',
    'Economics',
    'Literature',
    'Other',
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    const validExts = ['.pdf', '.txt', '.md'];
    const name = selectedFile.name.toLowerCase();
    const isValid = validExts.some((ext) => name.endsWith(ext));

    if (!isValid) {
      addToast('Please select a PDF or .txt/.md document.', 'error');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Please select a file to upload.', 'error');
      return;
    }

    const finalSubject = subject === 'Other' && customSubject.trim() ? customSubject.trim() : subject;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim() || file.name);
    formData.append('subject', finalSubject);

    try {
      setIsUploading(true);
      setUploadStep(1);

      // Simulate realistic step visual progression
      const stepTimer1 = setTimeout(() => setUploadStep(2), 700);
      const stepTimer2 = setTimeout(() => setUploadStep(3), 1600);
      const stepTimer3 = setTimeout(() => setUploadStep(4), 2800);

      const res = await documentAPI.upload(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (res.data?.success) {
        setUploadStep(5);
        setUploadedDoc(res.data.document);
        addToast('Document uploaded and indexed successfully!', 'success');
        refreshDocuments();
        refreshAnalytics();
      } else {
        throw new Error(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      setUploadStep(0);
      const errorMsg = err.response?.data?.message || err.message || 'Error uploading document';
      addToast(errorMsg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setUploadedDoc(null);
    setUploadStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-7 h-7 text-indigo-400" />
          <span>Upload Study Material</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload PDF textbooks, lecture notes, or study guides to enable AI Vector Search and RAG queries.
        </p>
      </div>

      {/* Success State */}
      {uploadedDoc ? (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 text-center space-y-6 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Indexing Completed!</h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              <span className="font-semibold text-emerald-300">{uploadedDoc.title}</span> has been parsed,
              split into <span className="font-semibold text-white">{uploadedDoc.totalChunks} chunks</span>,
              and indexed with vector embeddings in MongoDB Atlas.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI About this Doc</span>
            </button>

            <button
              onClick={() => navigate('/quiz')}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Generate Quiz</span>
            </button>

            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 text-sm font-semibold transition-all"
            >
              <span>Upload Another</span>
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
                : file
                ? 'border-indigo-500/50 bg-slate-900/60'
                : 'border-slate-800 hover:border-indigo-500/40 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-white text-base">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Choose different file</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200 text-base">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports PDF, TXT, and Markdown files (up to 25MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Inputs */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Document Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Chapter 4"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Subject Tag */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Subject Category
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {commonSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subject === 'Other' && (
              <div className="space-y-1.5 animate-slide-up">
                <label className="text-xs font-semibold text-slate-300">
                  Custom Subject Name
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter custom subject name..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Live Multi-Step Processing Tracker */}
          {isUploading && (
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Indexing Document with RAG Pipeline...</span>
                </span>
                <span>Step {Math.min(uploadStep, 4)} of 4</span>
              </div>

              <div className="space-y-2">
                {[
                  { step: 1, label: '1. Extracting text from document' },
                  { step: 2, label: '2. Cleaning text & recursive semantic chunking' },
                  { step: 3, label: '3. Generating Gemini vector embeddings (text-embedding-004)' },
                  { step: 4, label: '4. Storing vectors in MongoDB Atlas Vector Index' },
                ].map((s) => {
                  const isDone = uploadStep > s.step;
                  const isCurrent = uploadStep === s.step;

                  return (
                    <div
                      key={s.step}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/20'
                          : isCurrent
                          ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-500/30 font-semibold'
                          : 'bg-slate-950/40 text-slate-500 border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                            {s.step}
                          </div>
                        )}
                        <span>{s.label}</span>
                      </div>
                      {isDone && <span className="text-[10px] font-bold uppercase">Done</span>}
                      {isCurrent && <span className="text-[10px] font-bold text-indigo-400">Processing...</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
              !file || isUploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.01]'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Indexing Document...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Index with Vector Search</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
