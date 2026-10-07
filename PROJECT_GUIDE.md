# 📚 AI Study Assistant - Project Guide & Overview (आसान भाषा में समझें)

यह प्रोजेक्ट एक **Full-Stack AI Study Assistant** है जो स्टूडेंट्स को उनकी पढ़ाई की किताबों (PDFs) और स्टडी नोट्स (Notes) के आधार पर स्मार्ट तरीके से पढ़ाई करने में मदद करता है। 

यह **Retrieval-Augmented Generation (RAG)**, **Google Gemini API**, और **MongoDB Vector Search** की मदद से काम करता है।

---

## 🎯 1. यह प्रोजेक्ट क्या करता है? (What does it do?)

जब आप कोई 50-100 पेज की PDF या नोट्स अपलोड करते हैं, तो यह सिस्टम:
1. पूरी PDF को छोटे-छोटे अर्थपूर्ण टुकड़ों (**Chunks**) में बाँटता है।
2. हर टुकड़े का गणितीय वेक्टर (**Embedding**) बनाकर डेटाबेस में स्टोर करता है।
3. जब आप सवाल पूछते हैं, तो यह सिर्फ सबसे जरूरी पेजों को खोजकर Gemini AI को देता है और **सटीक पेज नंबर के साथ** जवाब देता है।
4. अगर सवाल का जवाब आपकी अपलोड की गई सामग्री में नहीं है, तो AI मनगढ़ंत जवाब नहीं देता बल्कि साफ मना कर देता है:  
   *«"I couldn't find enough information about this topic in your uploaded study material."»*
5. यह आपकी कमजोरियों (**Weak Topics**) को पहचानकर आपके लिए पर्सनलाइज्ड स्टडी प्लान तैयार करता है।

---

## 🔄 2. RAG Workflow कैसे काम करता है? (Core Workflow)

```
[1. Student uploads PDF/Notes]
             ↓
[2. Text Extraction] → PDF से टेक्स्ट और पेज नंबर निकाला जाता है (pdfService.js)
             ↓
[3. Text Cleaning] → एक्स्ट्रा स्पेस और अनचाहे कैरेक्टर हटाए जाते हैं
             ↓
[4. Semantic Chunking] → टेक्स्ट को ~800 अक्षरों के अर्थपूर्ण टुकड़ों में बाँटा जाता है
             ↓
[5. Generate Embeddings] → Gemini (text-embedding-004) 768-डायमेंशन वेक्टर बनाता है
             ↓
[6. MongoDB Atlas] → Chunks + Embeddings + Page Numbers डेटाबेस में सेव होते हैं
             ↓
[7. Student asks Question]
             ↓
[8. Vector Search] → सवाल के वेक्टर से मिलते-जुलते टॉप Chunks खोजे जाते हैं (Cosine Similarity)
             ↓
[9. Gemini Context Prompt] → "सिर्फ इन Chunks के आधार पर जवाब दो और पेज नंबर बताओ"
             ↓
[10. Grounded Answer + Page Citations]
```

---

## ✨ 3. प्रमुख फीचर्स (Key Features Explained)

### 📄 1. Document Upload & Management
- PDF, TXT या Markdown फाइलें अपलोड करें।
- सब्जेक्ट (जैसे Computer Science, Physics आदि) टैग करें।
- स्क्रीन पर लाइव 4-स्टेप प्रोग्रेस ट्रैकर दिखता है (*Extracting → Chunking → Embedding → Storing*)।
- हर डॉक्यूमेंट के पेजों और Chunks को देखने के लिए **Document Viewer** उपलब्ध है।

### 💬 2. Grounded AI Chat (RAG)
- ChatGPT जैसा आधुनिक इंटरफ़ेस।
- **सर्च का दायरा चुनें**:
  - *All Documents* (सभी किताबों में खोजें)
  - *Specific Document* (किसी एक खास किताब में खोजें)
  - *By Subject* (किसी एक सब्जेक्ट में खोजें)
- हर जवाब के नीचे **Source Citations** दिखते हैं (किताब का नाम, पेज नंबर और टेक्स्ट का हिस्सा)।

### 📝 3. Summary Generator (सारांश जनरेटर)
- 6 तरह के सारांश:
  1. **Complete Document Summary** (पूरी फाइल का ओवरव्यू)
  2. **Chapter Summary** (खास चैप्टर का सारांश)
  3. **Topic Summary** (किसी एक टॉपिक का सारांश)
  4. **Quick Revision Notes** (एग्जाम से पहले रिवीज़न बुलेट पॉइंट्स)
  5. **Important Points** (मुख्य नियम और बिंदु)
  6. **Definitions & Terms** (महत्वपूर्ण शब्दावली)
- 3 डिटेल लेवल: Brief (~200 शब्द), Medium (~500 शब्द), Detailed (~1000 शब्द)।
- एक क्लिक में कॉपी या Markdown डाउनलोड करें।

### 🎯 4. Quiz Generator & Weak Topic Detection (क्विज और कमजोरी की पहचान)
- प्रश्न प्रकार: **Multiple Choice (MCQs)**, **True/False**, **Short Answer**, या **Mixed**।
- कठिनाई स्तर: **Easy**, **Medium**, **Hard**।
- परीक्षा के बाद तुरंत स्कोर, टाइमर, सही/गलत उत्तर और **AI Explanation**।
- **कमजोर टॉपिक्स की पहचान**: जिन सवालों में गलती हुई, उनके टॉपिक्स को सिस्टम पहचान लेता है (जैसे *Deadlocks*, *CPU Scheduling*)।

### 🃏 5. 3D Interactive Flashcards (फ्लैशकार्ड्स)
- 3D फ्लिप एनीमेशन (क्लिक करने पर कार्ड घूमकर उत्तर दिखाता है)।
- कार्ड्स को मार्क करें:
  - ✅ **Mark Known** (आसान/याद हो गया)
  - ⚠️ **Mark Difficult** (कठिन)
- **"Review Difficult Cards Only"** मोड से सिर्फ कठिन कार्ड्स का रिवीज़न करें।
- मास्टरी प्रोग्रेस बार (% में) देखें।

### 🚀 6. Personalized Adaptive Study (व्यक्तिगत अध्ययन सामग्री)
- क्विज में पकड़ी गई कमजोरियों को 1-क्लिक में ठीक करें।
- सिस्टम उस टॉपिक के लिए तैयार करता है:
  - 💡 **Simple Intuitive Explanation (ELI5)** - आसान भाषा और उदाहरण में समझ।
  - 📌 **Important Concepts & Formulas** - जरूरी नियम।
  - 🌍 **Real-World Examples & Analogies** - असल जिंदगी के उदाहरण।
  - ✍️ **Step-by-Step Practice Questions** - हिंट और सॉल्यूशन बटन के साथ।
  - 🗂️ **Targeted Flashcards** - टॉपिक-विशिष्ट फ्लैशकार्ड्स।
  - 📝 **Revision Notes** - क्विक बुलेट नोट्स।

### 📊 7. Dashboard & Analytics
- कुल डॉक्यूमेंट्स, इंडेक्स्ड Chunks, पूछे गए सवाल।
- क्विज स्कोर का ग्राफ़ (Performance Trends)।
- फ्लैशकार्ड रिटेंशन प्रोग्रेस बार।
- कमजोर टॉपिक्स की लिस्ट और उन पर सीधे क्लिक करके पढ़ाई शुरू करने का विकल्प।

---

## 💻 4. Tech Stack (तकनीकी संरचना)

| लेयर | टेक्नोलॉजी | उपयोग |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS | तेज़, आधुनिक और रिस्पॉन्सिव यूजर इंटरफ़ेस |
| **Icons & Charts** | Lucide React, Recharts | सुंदर आइकॉन्स और परफॉरमेंस ग्राफिक्स |
| **Backend** | Node.js, Express.js (ES Modules) | REST API और बिजनेस लॉजिक |
| **PDF Processing** | pdf-parse, Multer | फाइल अपलोड और पेज-लेवल टेक्स्ट एक्सट्रैक्शन |
| **Vector Database** | MongoDB Atlas / Mongoose | Chunks और Embeddings का स्टोरेज |
| **Search Engine** | Atlas `$vectorSearch` + Cosine Math | सिमेंटिक वेक्टर सिमिलैरिटी सर्च |
| **AI Models** | Google Gemini 1.5 Flash + text-embedding-004 | RAG उत्तर, क्विज, सारांश और पर्सनलाइज्ड स्टडी जनरेशन |

---

## 📁 5. प्रोजेक्ट की फाइल संरचना (Folder Structure)

```
genai/
├── client/                     # रिएक्ट फ्रंटएंड
│   ├── src/
│   │   ├── components/         # लेआउट (Sidebar, Navbar, Toast आदि)
│   │   ├── context/            # Global State (AppContext.jsx)
│   │   ├── pages/              # 11 मुख्य पेजेस (Dashboard, Chat, Quiz आदि)
│   │   ├── services/           # Axios API कॉल्स (api.js)
│   │   ├── App.jsx             # React Router राउटिंग
│   │   └── main.jsx
│   ├── tailwind.config.js      # स्टाइलिंग कॉन्फ़िगरेशन
│   └── vite.config.js          # Vite और प्रॉक्सी सेटिंग्स
│
├── server/                     # एक्सप्रेस बैकएंड
│   ├── config/db.js            # MongoDB कनेक्शन
│   ├── models/                 # Mongoose डेटाबेस स्कीमा (Document, Chunk, Quiz आदि)
│   ├── services/               # Gemini AI, Vector Search, PDF Chunking
│   ├── controllers/            # API कंट्रोलर्स (Chat, Quiz, Summary आदि)
│   ├── routes/                 # API एंडपॉइंट्स (/api/chat, /api/quiz आदि)
│   ├── middleware/             # फाइल अपलोड और एरर हैंडलिंग
│   ├── utils/                  # Cosine Similarity और टेक्स्ट क्लीनिंग
│   └── server.js               # मुख्य सर्वर फाइल
│
├── README.md                   # विस्तृत तकनीकी दस्तावेज़
└── PROJECT_GUIDE.md            # यह सरल हिंदी गाइड
```

---

## ⚡ 6. प्रोजेक्ट को कैसे चलाएं? (How to Run)

### स्टेप 1: बैकएंड कॉन्फ़िगर करें (`server/.env`)
`server/.env` फाइल खोलें और अपनी MongoDB और Gemini API Key भरें:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ai_study_assistant
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004
CLIENT_URL=http://localhost:5173
```

### स्टेप 2: बैकएंड शुरू करें
टर्मिनल में:
```bash
cd server
npm start
```
*(बैकएंड `http://localhost:5001` पर चालू हो जाएगा)*

### स्टेप 3: फ्रंटएंड शुरू करें
एक नए टर्मिनल में:
```bash
cd client
npm run dev
```
*(फ्रंटएंड `http://localhost:5173` पर चालू हो जाएगा)*

### स्टेप 4: ब्राउज़र में खोलें
ब्राउज़र में `http://localhost:5173` खोलें और पढ़ाई शुरू करें!

---

## 🎓 7. संक्षेप में (In Summary)

यह प्रोजेक्ट केवल एक सामान्य PDF चैटबॉट नहीं है, बल्कि एक **सम्पूर्ण AI लर्निंग प्लेटफ़ॉर्म** है:
- **Upload Notes** ➔ **Ask Grounded Questions** ➔ **Generate Summaries** ➔ **Take Quizzes** ➔ **Practice Flashcards** ➔ **Analyze Weak Topics** ➔ **Adaptive Remediation**.
