import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentViewerPage } from './pages/DocumentViewerPage';
import { ChatPage } from './pages/ChatPage';
import { SummaryPage } from './pages/SummaryPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { QuizAttemptPage } from './pages/QuizAttemptPage';
import { QuizResultsPage } from './pages/QuizResultsPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { PersonalizedStudyPage } from './pages/PersonalizedStudyPage';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentViewerPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="quiz" element={<QuizGeneratorPage />} />
            <Route path="quiz/attempt/:id" element={<QuizAttemptPage />} />
            <Route path="quiz/results/:id" element={<QuizResultsPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="personalized-study" element={<PersonalizedStudyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
