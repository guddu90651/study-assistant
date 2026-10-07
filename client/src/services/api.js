import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents API
export const documentAPI = {
  upload: (formData) =>
    API.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params) => API.get('/documents', { params }),
  getById: (id) => API.get(`/documents/${id}`),
  delete: (id) => API.delete(`/documents/${id}`),
  getSubjects: () => API.get('/documents/subjects'),
};

// Chat / RAG API
export const chatAPI = {
  sendMessage: (payload) => API.post('/chat', payload),
  getHistory: (sessionId) => API.get(`/chat/history/${sessionId}`),
  clearHistory: (sessionId) => API.delete(`/chat/history/${sessionId}`),
};

// Summary API
export const summaryAPI = {
  generate: (payload) => API.post('/summary/generate', payload),
  getAll: (params) => API.get('/summary', { params }),
  getById: (id) => API.get(`/summary/${id}`),
  delete: (id) => API.delete(`/summary/${id}`),
};

// Quiz API
export const quizAPI = {
  generate: (payload) => API.post('/quiz/generate', payload),
  submitAttempt: (payload) => API.post('/quiz/submit', payload),
  getById: (id) => API.get(`/quiz/${id}`),
  getAttemptById: (id) => API.get(`/quiz/attempt/${id}`),
  getHistory: () => API.get('/quiz/history'),
};

// Flashcards API
export const flashcardAPI = {
  generate: (payload) => API.post('/flashcards/generate', payload),
  getAll: (params) => API.get('/flashcards', { params }),
  getById: (id) => API.get(`/flashcards/${id}`),
  updateCardStatus: (deckId, cardId, status) =>
    API.patch(`/flashcards/${deckId}/card/${cardId}`, { status }),
  delete: (id) => API.delete(`/flashcards/${id}`),
};

// Personalized Study API
export const personalizedStudyAPI = {
  generate: (payload) => API.post('/personalized-study/generate', payload),
  getAll: (params) => API.get('/personalized-study', { params }),
  getById: (id) => API.get(`/personalized-study/${id}`),
  delete: (id) => API.delete(`/personalized-study/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => API.get('/analytics'),
};

export default API;
