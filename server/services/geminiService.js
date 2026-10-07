import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const defaultModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const defaultEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('[Gemini API] Warning: GEMINI_API_KEY is not set in .env. RAG and generation will run in mock/simulation mode.');
}

/**
 * Deterministic pseudo-embedding generator for offline testing or when API key is not yet supplied.
 * Produces 768-dimensional normalized vector from text hash and char distributions.
 */
const generateDeterministicVector = (text, dimensions = 768) => {
  const vec = new Array(dimensions).fill(0);
  if (!text) return vec;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const index = (code * 31 + i * 17) % dimensions;
    vec[index] += 1 / (1 + (i % 10));
  }
  // Normalize vector
  let sum = 0;
  for (let i = 0; i < dimensions; i++) sum += vec[i] * vec[i];
  const mag = Math.sqrt(sum) || 1;
  return vec.map((v) => v / mag);
};

/**
 * Generate embedding for a single text string
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    return new Array(768).fill(0);
  }

  if (genAI && apiKey && apiKey.trim().length > 5) {
    try {
      const model = genAI.getGenerativeModel({ model: defaultEmbeddingModel });
      const result = await model.embedContent(text.substring(0, 8000));
      if (result && result.embedding && result.embedding.values) {
        return result.embedding.values;
      }
    } catch (err) {
      console.error(`[Gemini Embedding Error]: ${err.message}. Falling back to normalized vector representation.`);
    }
  }

  return generateDeterministicVector(text);
};

/**
 * Generate embeddings for an array of text chunks in batches
 */
export const generateEmbeddingsBatch = async (chunks, batchSize = 10) => {
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchPromises = batch.map((chunk) => generateEmbedding(chunk.text || chunk));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
  }
  return embeddings;
};

/**
 * Helper to call Gemini model with fallback
 */
const callGemini = async (prompt, systemInstruction = '', responseMimeType = 'text/plain') => {
  if (!genAI || !apiKey || apiKey.trim().length < 5) {
    console.warn('[Gemini API] Using simulated response because GEMINI_API_KEY is not set.');
    return null;
  }

  try {
    const modelOptions = {
      model: defaultModelName,
      generationConfig: {
        temperature: 0.2,
      },
    };

    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }

    if (responseMimeType === 'application/json') {
      modelOptions.generationConfig.responseMimeType = 'application/json';
    }

    const model = genAI.getGenerativeModel(modelOptions);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error(`[Gemini Generation Error]: ${err.message}`);
    throw err;
  }
};

/**
 * RAG Grounded Question Answering with strict source citations
 */
export const generateRAGChatAnswer = async ({ question, chunks, history = [] }) => {
  const strictOutMessage = "I couldn't find enough information about this topic in your uploaded study material.";

  if (!chunks || chunks.length === 0) {
    return {
      answer: strictOutMessage,
      citations: [],
    };
  }

  const contextText = chunks
    .map(
      (c, idx) =>
        `[Source ${idx + 1}] (Document: "${c.documentTitle}", Page: ${c.pageNumber}):\n${c.text}`
    )
    .join('\n\n---\n\n');

  const systemInstruction = `You are an expert AI Study Assistant and tutor.
Your core task is to answer the student's question STRICTLY and EXCLUSIVELY based on the provided Context excerpts from their uploaded study material.

CRITICAL RULES:
1. Base your answer ONLY on the provided Context.
2. If the answer cannot be found or reasonably deduced from the Context excerpts, your ENTIRE response MUST be:
"${strictOutMessage}"
Do NOT guess, do NOT bring in outside ungrounded facts, and do NOT extrapolate beyond what the notes support.
3. When you answer from the Context, provide a clear, accurate, and structured explanation. Use markdown (headings, bullet points, bold key terms, LaTeX math expressions if applicable).
4. Explicitly reference which source/document and page number supports each key point (e.g. *[Document: "OS Concepts", Page 12]*).
5. Never invent or hallucinate answers.`;

  const conversationContext = history
    .slice(-6)
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const prompt = `CONTEXT FROM UPLOADED STUDY MATERIAL:
${contextText}

${conversationContext ? `PREVIOUS RECENT CONVERSATION:\n${conversationContext}\n\n` : ''}
STUDENT QUESTION:
${question}

Provide your grounded response following all strict guidelines:`;

  try {
    const rawAnswer = await callGemini(prompt, systemInstruction);

    if (rawAnswer) {
      return {
        answer: rawAnswer.trim(),
        citations: chunks.map((c) => ({
          documentId: c.documentId,
          documentTitle: c.documentTitle,
          pageNumber: c.pageNumber,
          chunkIndex: c.chunkIndex,
          snippet: c.text.substring(0, 200) + '...',
          score: c.score || 1.0,
        })),
      };
    }
  } catch (err) {
    console.error('[RAG Chat Error]:', err.message);
  }

  // Fallback if API key not available or API down
  const sampleDoc = chunks[0] ? chunks[0].documentTitle : 'Study Notes';
  const samplePage = chunks[0] ? chunks[0].pageNumber : 1;
  const snippet = chunks[0] ? chunks[0].text : '';

  return {
    answer: `Based on your uploaded material in **${sampleDoc}** (Page ${samplePage}):\n\n${snippet}\n\n*(Note: To enable live dynamic Gemini generation, ensure your GEMINI_API_KEY is configured in server/.env)*`,
    citations: chunks.map((c) => ({
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      snippet: c.text.substring(0, 200) + '...',
      score: c.score || 1.0,
    })),
  };
};

/**
 * Generate comprehensive summary
 */
export const generateSummaryFromContext = async ({
  contextText,
  docTitle,
  subject,
  type = 'complete',
  length = 'medium',
  topicOrChapter = '',
}) => {
  const typeDescriptions = {
    complete: 'a comprehensive full document summary covering all major themes',
    chapter: `a chapter summary focusing on ${topicOrChapter || 'the main chapter'}`,
    topic: `a focused topic summary on ${topicOrChapter || 'the key subject matter'}`,
    revision_notes: 'high-yield quick revision notes formatted in structured bullet points',
    important_points: 'a numbered list of the most critical key points, takeaways, and principles',
    definitions: 'a glossary table or bulleted list of all key terms, definitions, and acronyms',
  };

  const lengthGuidelines = {
    brief: 'Concise, high-level overview in ~150-250 words.',
    medium: 'Balanced in-depth summary in ~400-600 words with sections.',
    detailed: 'Exhaustive, thorough breakdown with detailed explanations and subsections.',
  };

  const systemInstruction = `You are a master academic summarizer and educator.
Your task is to generate ${typeDescriptions[type] || 'a summary'} from the provided study material.
Length requirement: ${lengthGuidelines[length] || lengthGuidelines.medium}
Format nicely using Markdown with bold headers, bullet lists, callouts, and clean formatting.
Base everything exclusively on the provided context material.`;

  const prompt = `DOCUMENT TITLE: ${docTitle}
SUBJECT: ${subject}
TYPE: ${type}
${topicOrChapter ? `FOCUS TOPIC/CHAPTER: ${topicOrChapter}` : ''}

STUDY MATERIAL CONTEXT:
${contextText}

Generate the summary now:`;

  try {
    const summary = await callGemini(prompt, systemInstruction);
    if (summary) return summary;
  } catch (err) {
    console.error('[Summary Generation Error]:', err.message);
  }

  // Fallback
  return `# Summary: ${docTitle}\n\n**Subject:** ${subject} | **Type:** ${type.toUpperCase()} | **Detail Level:** ${length.toUpperCase()}\n\n### Key Takeaways\n- Extracted from uploaded material context.\n- Covers fundamental principles, concepts, and definitions.\n\n### Overview\n${contextText.substring(0, 600)}...\n\n*(Configure GEMINI_API_KEY in server/.env for live AI synthesis)*`;
};

/**
 * Generate interactive Quiz with validated questions
 */
export const generateQuizFromContext = async ({
  contextText,
  docTitle,
  subject,
  topic = '',
  difficulty = 'medium',
  questionType = 'mcq',
  totalQuestions = 5,
}) => {
  const systemInstruction = `You are an expert exam creator and academic professor.
Your goal is to generate an educational quiz strictly based on the provided study material.
You must return a valid JSON object matching the exact specified schema.
Ensure questions are clear, unambiguous, and accurately test concepts from the material.
Difficulty: ${difficulty.toUpperCase()}.
Question Type format: ${questionType.toUpperCase()} (options: mcq, true_false, short_answer, or mixed).`;

  const prompt = `STUDY MATERIAL CONTEXT:
${contextText}

REQUIREMENTS:
- Document: "${docTitle}"
- Subject: "${subject}"
${topic ? `- Focus Topic: "${topic}"` : ''}
- Total Questions: ${totalQuestions}
- Question Type: ${questionType} (for 'mcq' provide 4 options; for 'true_false' options must be ["True", "False"]; for 'short_answer' options should be empty array [])
- Difficulty: ${difficulty}

Respond ONLY with valid JSON conforming to this schema:
{
  "title": "Quiz Title",
  "topic": "${topic || subject}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "type": "mcq", // "mcq" | "true_false" | "short_answer"
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation of why this answer is correct based on the study material.",
      "topic": "Specific subtopic tested"
    }
  ]
}`;

  try {
    const rawJson = await callGemini(prompt, systemInstruction, 'application/json');
    if (rawJson) {
      const parsed = JSON.parse(rawJson.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed.questions && Array.isArray(parsed.questions)) {
        // Ensure each question has a valid UUID
        parsed.questions = parsed.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q_${uuidv4().substring(0, 8)}_${idx}`,
        }));
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Quiz Generation Error]:', err.message);
  }

  // Fallback Quiz
  return {
    title: `${subject} Knowledge Check`,
    topic: topic || subject,
    questions: [
      {
        id: `q_${uuidv4().substring(0, 8)}_1`,
        question: `What is the primary concept discussed in the study material for ${subject}?`,
        type: 'mcq',
        options: [
          'The core foundational principles explained in the text',
          'An unrelated external concept',
          'Historical background from 1800s',
          'None of the above',
        ],
        correctAnswer: 'The core foundational principles explained in the text',
        explanation: 'The uploaded study notes focus directly on the core principles.',
        topic: subject,
      },
      {
        id: `q_${uuidv4().substring(0, 8)}_2`,
        question: `True or False: The uploaded material covers key definitions and applications for ${subject}.`,
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'The document outlines standard definitions and core domain concepts.',
        topic: subject,
      },
    ],
  };
};

/**
 * Generate Flashcards
 */
export const generateFlashcardsFromContext = async ({
  contextText,
  docTitle,
  subject,
  topic = '',
  cardCount = 8,
}) => {
  const systemInstruction = `You are a learning science expert specializing in active recall and spaced repetition flashcards.
Generate high-impact study flashcards based on the provided material.
Return ONLY a valid JSON object matching the requested schema.`;

  const prompt = `STUDY MATERIAL CONTEXT:
${contextText}

REQUIREMENTS:
- Document: "${docTitle}"
- Subject: "${subject}"
${topic ? `- Topic: "${topic}"` : ''}
- Generate ${cardCount} flashcards.
- Each flashcard should have a clear prompt/question on the front and a concise, memorable answer on the back.

Respond ONLY with valid JSON:
{
  "title": "${topic ? `${topic} Flashcards` : `${subject} Flashcard Deck`}",
  "cards": [
    {
      "id": "card_1",
      "question": "Concept or Question?",
      "answer": "Clear, concise definition or explanation.",
      "topic": "${topic || subject}"
    }
  ]
}`;

  try {
    const rawJson = await callGemini(prompt, systemInstruction, 'application/json');
    if (rawJson) {
      const parsed = JSON.parse(rawJson.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed.cards && Array.isArray(parsed.cards)) {
        parsed.cards = parsed.cards.map((c, idx) => ({
          ...c,
          id: c.id || `card_${uuidv4().substring(0, 8)}_${idx}`,
          status: 'new',
        }));
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Flashcard Generation Error]:', err.message);
  }

  // Fallback Flashcards
  return {
    title: `${subject} Flashcard Deck`,
    cards: [
      {
        id: `card_${uuidv4().substring(0, 8)}_1`,
        question: `What is the core subject matter of ${docTitle}?`,
        answer: `Covers foundational principles and topics in ${subject}.`,
        topic: subject,
        status: 'new',
      },
      {
        id: `card_${uuidv4().substring(0, 8)}_2`,
        question: `Why is understanding ${subject} important?`,
        answer: `It provides essential theoretical concepts and practical applications.`,
        topic: subject,
        status: 'new',
      },
    ],
  };
};

/**
 * Generate Adaptive Personalized Remediation Study Pack for Weak Topics
 */
export const generatePersonalizedStudyPack = async ({
  weakTopic,
  subject,
  contextText,
  difficulty = 'remedial',
  missedQuestions = [],
}) => {
  const systemInstruction = `You are a world-class personalized AI tutor.
A student took a quiz and demonstrated difficulty/weak understanding in the specific topic: "${weakTopic}".
Your goal is to build an adaptive, structured remediation study pack to help them achieve mastery.

The study pack MUST include:
1. Simple Intuitive Explanation (ELi5 / conceptual clarity with analogies).
2. Important Concepts (core rules, definitions, formulas).
3. Real-World Examples / Case Studies.
4. Step-by-Step Practice Questions (with hidden hints and complete step-by-step explanations).
5. Quick Active-Recall Flashcards.
6. High-Yield Revision Notes (bulleted recap).

Respond strictly with valid JSON.`;

  const prompt = `WEAK TOPIC: ${weakTopic}
SUBJECT: ${subject}
TARGET DIFFICULTY: ${difficulty}
${missedQuestions.length > 0 ? `STUDENT'S MISSED QUESTIONS:\n${JSON.stringify(missedQuestions, null, 2)}\n` : ''}

RELEVANT REFERENCE STUDY MATERIAL:
${contextText}

Generate the personalized remediation study pack now in the following JSON format:
{
  "simpleExplanation": "Clear, engaging, and intuitive explanation simplifying the complex concept...",
  "importantConcepts": [
    "Key concept 1: ...",
    "Key concept 2: ..."
  ],
  "realWorldExamples": [
    "Example 1: ...",
    "Example 2: ..."
  ],
  "practiceQuestions": [
    {
      "question": "Practice Question 1",
      "hint": "Helpful hint without giving away the full answer",
      "answer": "Correct answer",
      "explanation": "Step-by-step solution breakdown"
    }
  ],
  "flashcards": [
    {
      "question": "Targeted Question",
      "answer": "Targeted Answer"
    }
  ],
  "revisionNotes": [
    "Quick bullet revision takeaway 1",
    "Quick bullet revision takeaway 2"
  ]
}`;

  try {
    const rawJson = await callGemini(prompt, systemInstruction, 'application/json');
    if (rawJson) {
      const parsed = JSON.parse(rawJson.replace(/```json/g, '').replace(/```/g, '').trim());
      return parsed;
    }
  } catch (err) {
    console.error('[Personalized Study Pack Error]:', err.message);
  }

  // Fallback Remediation
  return {
    simpleExplanation: `**${weakTopic}** is a fundamental concept in **${subject}**. To understand it intuitively, imagine how components communicate and synchronize to avoid race conditions or stalls.`,
    importantConcepts: [
      `Definition and scope of ${weakTopic}.`,
      `Mechanisms used to control and manage ${weakTopic}.`,
      `Common edge cases and mitigation strategies.`,
    ],
    realWorldExamples: [
      `Real-world application: Operating systems using resource locks to coordinate concurrent processes.`,
      `Daily life analogy: Traffic signals at a four-way intersection preventing collisions.`,
    ],
    practiceQuestions: [
      {
        question: `How does a system detect or prevent issues related to ${weakTopic}?`,
        hint: `Think about resource ordering or timeout strategies.`,
        answer: `By establishing strict resource hierarchy and implementing deadlock prevention or detection algorithms.`,
        explanation: `Hierarchical resource ordering ensures circular wait conditions cannot occur.`,
      },
    ],
    flashcards: [
      {
        question: `What is the core challenge in ${weakTopic}?`,
        answer: `Maintaining consistency and preventing blocked or conflicting states.`,
      },
    ],
    revisionNotes: [
      `Review core definitions for ${weakTopic}.`,
      `Remember the 4 necessary conditions and how to break at least one.`,
    ],
  };
};
