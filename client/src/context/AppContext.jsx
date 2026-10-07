import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { documentAPI, analyticsAPI } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState(['All']);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeDocument, setActiveDocument] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all documents and subjects
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const res = await documentAPI.getAll();
      if (res.data?.success) {
        setDocuments(res.data.documents || []);
      }

      const subjRes = await documentAPI.getSubjects();
      if (subjRes.data?.success) {
        setSubjects(subjRes.data.subjects || ['All']);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Fetch dashboard analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchAnalytics();
  }, [fetchDocuments, fetchAnalytics]);

  return (
    <AppContext.Provider
      value={{
        documents,
        subjects,
        selectedSubject,
        setSelectedSubject,
        activeDocument,
        setActiveDocument,
        analytics,
        isLoadingDocs,
        toasts,
        addToast,
        removeToast,
        refreshDocuments: fetchDocuments,
        refreshAnalytics: fetchAnalytics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
