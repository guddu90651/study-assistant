# AI Study Assistant (RAG + Gemini + MongoDB Vector Search)

A full-stack, responsive AI Study Assistant platform that empowers students to upload PDFs/study notes, ask grounded questions using **Retrieval-Augmented Generation (RAG)**, generate structured summaries, take adaptive quizzes, practice active-recall flashcards, and receive personalized remediation modules for weak topics.

> 📖 **आसान भाषा में समझने के लिए पढ़ें:** [PROJECT_GUIDE.md](file:///Users/guddusharma/Desktop/genai/PROJECT_GUIDE.md)

---

## 🚀 Key Features

1. **Document Upload & Ingestion**:
   - PDF & text/markdown extraction with page tracking.
   - Text cleaning, normalization, and semantic recursive chunking.
   - 768-dimensional vector embedding generation via Gemini (`text-embedding-004`).
   - Vector storage in MongoDB Atlas.

2. **Grounded AI Chat (RAG)**:
   - ChatGPT-style responsive chat with search scope filtering (*All Documents*, *Specific Document*, *Specific Subject*).
   - Retrieves top-K semantically similar chunks via Vector Search.
   - Grounded context synthesis with Gemini.
   - Strict citation trays with Document Title, Page Number, and snippet previews.
   - Strict hallucination refusal: `«"I couldn't find enough information about this topic in your uploaded study material."»`.

3. **Summary Generator**:
   - Formats: *Complete Document*, *Chapter*, *Topic*, *Quick Revision Notes*, *Important Points*, *Definitions & Terms*.
   - Detail levels: *Brief*, *Medium*, *Detailed*.
   - Export to Markdown and one-click copy.

4. **Interactive Quiz Engine**:
   - Formats: *Multiple Choice (MCQ)*, *True/False*, *Short Answer*, *Mixed*.
   - Difficulty: *Easy*, *Medium*, *Hard*.
   - Real-time timer and progress tracker.
   - Automated grading, correct answers, and AI explanations.
   - **Weak Topic Detection**: Automatically tags subtopics where mistakes occurred.

5. **3D Interactive Flashcards**:
   - 3D flip card animations with active recall.
   - Mark cards as *Known* (Green) or *Difficult* (Red).
   - "Review Difficult Cards Only" mode and deck mastery percentage indicators.

6. **Personalized Adaptive Study Modules**:
   - 1-click remediation targeting identified weak topics from quizzes.
   - Generates: *Intuitive Conceptual Explanations (ELI5)*, *Important Concepts & Formulas*, *Real-World Examples & Analogies*, *Interactive Step-by-Step Practice Questions with Hint & Solution Toggles*, *Targeted Flashcards*, and *Revision Notes*.

7. **Dashboard & Analytics**:
   - Key metrics (Documents, Chunks, Quizzes taken, Average Score %, Card Mastery %).
   - Performance trend chart over time.
   - Weak topics leaderboard with direct remediation shortcuts.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6, Recharts, React Markdown, Remark GFM, Canvas Confetti.
- **Backend**: Node.js, Express.js (ES Modules), Multer, pdf-parse, `@google/generative-ai`.
- **Database & Vector Search**: MongoDB Atlas, Mongoose, Vector Search Aggregation `$vectorSearch` with automatic fallback to exact cosine similarity calculation.

---

## 📂 Project Structure

```
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Sidebar, Toast, Common UI
│   │   ├── context/            # Global AppContext & State
│   │   ├── pages/              # 11 Main Study Pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── DocumentViewerPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── SummaryPage.jsx
│   │   │   ├── QuizGeneratorPage.jsx
│   │   │   ├── QuizAttemptPage.jsx
│   │   │   ├── QuizResultsPage.jsx
│   │   │   ├── FlashcardsPage.jsx
│   │   │   └── PersonalizedStudyPage.jsx
│   │   ├── services/           # Axios API Client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # MongoDB connection (db.js)
│   ├── controllers/            # Controller logic for all features
│   ├── middleware/             # Upload (Multer), error handling
│   ├── models/                 # Mongoose models (Document, Chunk, Quiz, etc.)
│   ├── routes/                 # Express REST API routes
│   ├── services/               # Gemini AI, Vector Search, PDF & Chunking
│   ├── utils/                  # Text cleaning & Vector Math (cosine similarity)
│   └── server.js               # Server entry point
└── README.md
```

---

## ⚙️ Quick Start Guide

### 1. Configure Backend Environment (`server/.env`)

Edit `server/.env` with your credentials:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ai_study_assistant
# Or MongoDB Atlas: mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai_study_assistant?retryWrites=true&w=majority

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
CLIENT_URL=http://localhost:5173
```

### 2. MongoDB Atlas Vector Search Index (Optional for Atlas)

When using MongoDB Atlas, create a Vector Search Index on the `chunks` collection:

- **Index Name**: `vector_index`
- **Definition**:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    },
    {
      "type": "filter",
      "path": "subject"
    }
  ]
}
```
*(Note: If the Atlas Vector index is not yet configured, the system automatically falls back to in-memory cosine similarity calculation so the application runs seamlessly out-of-the-box in any MongoDB environment!)*

### 3. Running the Application

In terminal 1 (Backend):
```bash
cd server
npm start
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Open your browser at `http://localhost:5173`.
