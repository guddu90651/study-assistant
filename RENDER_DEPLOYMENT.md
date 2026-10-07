# 🚀 Render Deployment Guide for AI Study Assistant

इस प्रोजेक्ट को Render पर Deploy करने के लिए सभी सेटिंग्स और फाइल्स तैयार कर दी गई हैं।

---

## 🌐 URLs
- **Frontend URL:** `https://study-assistant-mk34.onrender.com`
- **Backend URL:** `https://study-assistant-backend-rzak.onrender.com`

---

## 🛠️ Step 1: Git में बदलाव Commit और Push करें

अपने लोकल टर्मिनल में यह कमांड्स चलाएँ:
```bash
git add .
git commit -m "Configure project for Render production deployment"
git push origin main
```

---

## 🖥️ Step 2: Render पर Backend Deploy करें (Web Service)

1. [dashboard.render.com](https://dashboard.render.com/) पर लॉगिन करें।
2. **"New +"** बटन दबाएं और **"Web Service"** चुनें।
3. अपना GitHub Repository कनेक्ट करें।
4. निम्नलिखित सेटिंग्स भरें:
   - **Name:** `study-assistant-backend` (या आपकी पसंद का नाम)
   - **Region:** `Oregon (US West)` या कोई भी
   - **Root Directory:** `server`  *(⚠️ बहुत जरूरी)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

5. **Environment Variables (Add Environment Variable):**
   Render डैशबोर्ड में नीचे Environment Variables सेक्शन में यह की-वैल्यू जोड़ें:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (या Render द्वारा दिया गया पोर्ट) |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/ai_study_assistant?retryWrites=true&w=majority` |
   | `GEMINI_API_KEY` | `आपकी_GEMINI_API_KEY` |
   | `GEMINI_MODEL` | `gemini-1.5-flash` |
   | `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` |
   | `CLIENT_URL` | `https://study-assistant-mk34.onrender.com` |

6. **"Deploy Web Service"** पर क्लिक करें।

> 🔍 **Backend Verify करें:** डिप्लॉय होने के बाद `https://study-assistant-backend-rzak.onrender.com/api/health` खोलें।  
> वहाँ `{ "status": "healthy", "service": "AI Study Assistant RAG API" }` दिखना चाहिए।

---

## 💻 Step 3: Render पर Frontend Deploy करें (Static Site)

1. Render डैशबोर्ड में **"New +"** ➔ **"Static Site"** चुनें।
2. वही GitHub Repository कनेक्ट करें।
3. निम्नलिखित सेटिंग्स भरें:
   - **Name:** `study-assistant`
   - **Root Directory:** `client`  *(⚠️ बहुत जरूरी)*
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`  *(⚠️ बहुत जरूरी)*

4. **Environment Variables (Add Environment Variable):**
   
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://study-assistant-backend-rzak.onrender.com` |

5. **SPA Redirects / Rewrites:**
   - हमने `client/public/_redirects` फाइल बना दी है, जिससे React Router (पेज रीफ्रेश और डायरेक्ट लिंक) बिना किसी 404 एरर के काम करेगा।
   - (वैकल्पिक) आप Render के "Redirects/Rewrites" टैब में भी यह जोड़ सकते हैं:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`

6. **"Create Static Site"** पर क्लिक करें।

---

## ⚡ Step 4: MongoDB Atlas Network Access जाँचें

सुनिश्चित करें कि MongoDB Atlas में Render के सर्वर से कनेक्शन अलाउड है:
1. [MongoDB Atlas Dashboard](https://cloud.mongodb.com/) ➔ **Network Access** में जाएँ।
2. **"Add IP Address"** ➔ **"Allow Access from Anywhere"** (`0.0.0.0/0`) सेव करें।

---

## 🎉 Done!
आपका AI Study Assistant अब Render पर पूरी तरह लाइव काम करेगा:
- Frontend: `https://study-assistant-mk34.onrender.com/`
- Backend: `https://study-assistant-backend-rzak.onrender.com/`
