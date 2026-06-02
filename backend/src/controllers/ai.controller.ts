import { Request, Response } from 'express';
import prisma from '../prisma';
import fs from 'fs';
import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AiQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Text extraction helpers
// ---------------------------------------------------------------------------

/** Extract text from a PDF buffer using pdf-parse v2 class-based API */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Strategy 1: pdf-parse v2 class API — new PDFParse({ data }).getText()
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfMod = require('pdf-parse');
    const PDFParse = pdfMod.PDFParse ?? pdfMod.default?.PDFParse;
    if (PDFParse) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const text = result?.text?.trim() ?? '';
      if (text) return text;
    }
  } catch (e1: any) {
    console.warn('[PDF] v2 class strategy failed:', e1.message?.slice(0, 150));
  }

  // Strategy 2: pdf-parse v1 function API — pdfParse(buffer)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const fn = typeof pdfParse === 'function' ? pdfParse
             : typeof pdfParse.default === 'function' ? pdfParse.default
             : null;
    if (fn) {
      const data = await fn(buffer);
      if (data?.text?.trim()) return data.text.trim();
    }
  } catch (e2: any) {
    console.warn('[PDF] v1 function strategy failed:', e2.message?.slice(0, 150));
  }

  // Strategy 3: Gemini Vision (supports application/pdf inline data)
  console.log('[PDF] Falling back to Gemini Vision for PDF text extraction...');
  return extractWithGeminiVision(buffer, 'application/pdf');
}

/** Scrape readable text from a URL */
async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const $ = cheerio.load(html);
  // Remove all noise elements
  $('script, style, nav, footer, header, aside, noscript, iframe, svg, button, form, input, select').remove();
  // Try article-specific selectors first for better content
  const articleText = $('article, main, [role="main"], .content, .post-content, .article-body').text();
  const bodyText = $('body').text();
  const text = articleText.length > 200 ? articleText : bodyText;
  // Collapse whitespace
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
}

/** Extract text from an image or PDF using Gemini Vision API */
async function extractWithGeminiVision(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set — image/PDF OCR requires Gemini Vision');

  // Check size — Gemini inline data limit is ~20MB (base64 adds ~33% overhead)
  const fileSizeMB = buffer.length / (1024 * 1024);
  if (fileSizeMB > 14) {
    throw new Error(`File too large for Gemini Vision inline upload (${fileSizeMB.toFixed(1)} MB > 14 MB limit). Please use a smaller file.`);
  }

  const base64 = buffer.toString('base64');
  const isPdf = mimeType === 'application/pdf';
  const prompt = isPdf
    ? 'Extract all the readable text from this PDF document. Preserve the content faithfully including headings, paragraphs, and lists. Return only the extracted text.'
    : 'Extract all visible text from this image. If this is a question paper or notes, preserve the content faithfully. Return only the extracted text without any commentary.';

  console.log(`[Gemini Vision] Sending ${mimeType} (${fileSizeMB.toFixed(2)} MB) to Gemini...`);

  const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError = '';

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Vision] Trying model: ${model}...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mimeType, data: base64 } },
              ]
            }],
            generationConfig: { temperature: 0.1 },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini Vision] ${model} HTTP ${res.status} error:`, errText.slice(0, 500));
        lastError = errText;
        continue; // Try next model
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`[Gemini Vision] ${model} Extracted ${text.length} characters`);
      
      if (!text.trim()) {
        console.warn(`[Gemini Vision] ${model} Empty response. Full API response:`, JSON.stringify(data).slice(0, 500));
        lastError = 'Empty response';
        continue; // Try next model
      }
      
      return text.trim();
    } catch (err: any) {
      console.warn(`[Gemini Vision] ${model} exception:`, err.message);
      lastError = err.message;
    }
  }

  throw new Error(`Gemini Vision failed after trying multiple models. Last error: ${lastError.slice(0, 300)}`);
}

// ---------------------------------------------------------------------------
// AI question generation  (Groq primary → Gemini → Grok fallback)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a quiz generation assistant. You MUST respond with ONLY a valid JSON object matching this schema, no markdown, no explanation:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"confidence":100.0}]}
Rules:
- Generate 5-10 multiple-choice questions from the provided text.
- Each question MUST have EXACTLY 4 options.
- correctAnswer is the 0-based index of the correct option.
- confidence is always 100.0.
- Make wrong options plausible.
- Respond with ONLY the JSON, nothing else.`;

function buildUserPrompt(text: string): string {
  return `Generate quiz questions from this text (respond with JSON only):\n\n${text.slice(0, 12000)}`;
}

/** Call Groq API (OpenAI-compatible) */
async function generateWithGroq(text: string, model: string): Promise<AiQuestion[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(text) },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error');
    throw new Error(`Groq API error ${res.status} (${model}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || '';
  if (!content.trim()) throw new Error('Groq returned empty content');
  return parseAiResponse(content);
}

/** Call Grok (x.ai) API */
async function generateWithGrok(text: string): Promise<AiQuestion[]> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not set');

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(text) },
      ],
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Grok API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content || '';
  return parseAiResponse(content);
}

/** Call Google Gemini API with a specific model */
async function generateWithGemini(text: string, model: string): Promise<AiQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(text)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        },
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status} (model: ${model}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseAiResponse(content);
}

/** Parse the raw LLM string into validated questions */
function parseAiResponse(raw: string): AiQuestion[] {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // If strict parsing fails, try evaluating it (dangerous but sometimes LLMs output bad json)
    // Actually, just throw to fallback to another model.
    throw new Error('Failed to parse JSON: ' + e);
  }

  const questions: any[] = Array.isArray(parsed)
    ? parsed
    : parsed.questions || [];

  return questions.map((q: any) => {
    // LLMs sometimes return "A", "B", "C", "D" or 1,2,3,4
    let ca = q.correctAnswer;
    if (typeof ca === 'string') {
      const idx = ['a', 'b', 'c', 'd'].indexOf(ca.toLowerCase());
      ca = idx !== -1 ? idx : 0;
    } else if (typeof ca === 'number' && ca > 3) {
      ca = 0;
    } else if (typeof ca === 'number' && ca === 4) {
      ca = 3;
    } else if (typeof ca === 'number' && ca < 0) {
      ca = 0;
    }

    return {
      question: q.question || 'Unknown Question?',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof ca === 'number' ? ca : 0,
      confidence: q.confidence || 100
    };
  }).filter(q => q.question && q.options.length === 4);
}

/** Try Groq first, then Gemini, then Grok (x.ai) */
async function generateQuestions(text: string): Promise<AiQuestion[]> {
  const errors: string[] = [];

  // 1. Try Groq (primary — free & fast)
  if (process.env.GROQ_API_KEY) {
    const groqModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
    ];
    for (const model of groqModels) {
      try {
        console.log(`[AI] Trying Groq model: ${model}...`);
        const questions = await generateWithGroq(text, model);
        if (questions.length > 0) {
          console.log(`[AI] Groq (${model}) generated ${questions.length} questions`);
          return questions;
        }
        console.log(`[AI] Groq (${model}) returned 0 valid questions, trying next...`);
      } catch (e: any) {
        const msg = e.message?.slice(0, 200) || 'unknown error';
        console.error(`[AI] Groq (${model}) failed: ${msg}`);
        errors.push(`Groq/${model}: ${msg}`);
      }
    }
  }

  // 2. Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    const geminiModels = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ];
    for (const model of geminiModels) {
      try {
        console.log(`[AI] Trying Gemini model: ${model}...`);
        const questions = await generateWithGemini(text, model);
        if (questions.length > 0) {
          console.log(`[AI] Gemini (${model}) generated ${questions.length} questions`);
          return questions;
        }
      } catch (e: any) {
        const msg = e.message?.slice(0, 200) || 'unknown error';
        console.error(`[AI] Gemini (${model}) failed: ${msg}`);
        errors.push(`Gemini/${model}: ${msg}`);
      }
    }
  }

  // 3. Fallback to Grok (x.ai)
  if (process.env.GROK_API_KEY) {
    try {
      console.log('[AI] Trying Grok API...');
      const questions = await generateWithGrok(text);
      if (questions.length > 0) {
        console.log(`[AI] Grok generated ${questions.length} questions`);
        return questions;
      }
    } catch (e: any) {
      const msg = e.message?.slice(0, 200) || 'unknown error';
      console.error(`[AI] Grok failed: ${msg}`);
      errors.push(`Grok: ${msg}`);
    }
  }

  throw new Error(
    `All AI providers failed.\n${errors.join('\n')}`
  );
}

// ---------------------------------------------------------------------------
// Background job processor (replaces the Python ai-service call)
// ---------------------------------------------------------------------------

const processAiJob = async (
  jobId: string,
  reqBody: any,
  file?: Express.Multer.File
) => {
  try {
    let text = '';

    // 1. Determine the source and extract text
    if (file) {
      const fileBuffer = fs.readFileSync(file.path);
      if (file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')) {
        console.log(`[Job ${jobId}] Extracting text from PDF: ${file.originalname}`);
        text = await extractTextFromPdf(fileBuffer);
      } else if (file.mimetype?.startsWith('image/')) {
        // Use Gemini Vision for OCR
        console.log(`[Job ${jobId}] Running OCR on image: ${file.originalname} (${file.mimetype})`);
        text = await extractWithGeminiVision(fileBuffer, file.mimetype);
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF or image.`);
      }
      // Clean up temp file
      try { fs.unlinkSync(file.path); } catch (_) {}
    } else if (reqBody.url || reqBody.targetUrl) {
      text = await extractTextFromUrl(reqBody.url || reqBody.targetUrl);
    } else if (reqBody.topic || reqBody.textContent) {
      text = reqBody.topic || reqBody.textContent;
    } else {
      throw new Error('No valid input provided (file, url, or text)');
    }

    if (!text || text.trim().length < 20) {
      throw new Error('Extracted text is too short to generate meaningful questions.');
    }

    console.log(`[Job ${jobId}] Extracted ${text.length} chars, starting AI generation...`);

    // 2. Generate questions via AI
    let questions = await generateQuestions(text);

    // Optionally limit count
    if (reqBody.count && !isNaN(parseInt(reqBody.count, 10))) {
      questions = questions.slice(0, parseInt(reqBody.count, 10));
    }

    // 3. Save to database
    await prisma.importJob.update({
      where: { jobId },
      data: {
        jobStatus: 'COMPLETED',
        parsedQuestions: JSON.stringify(questions),
        completedAt: new Date(),
      },
    });

    console.log(`[Job ${jobId}] Completed with ${questions.length} questions`);
  } catch (error: any) {
    console.error(`[Job ${jobId}] AI processing error:`, error.message || error);
    await prisma.importJob.update({
      where: { jobId },
      data: { jobStatus: 'FAILED' },
    });
  }
};

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export const importQuiz = async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, topic, url, count, textContent, targetUrl } = req.body;
    const file = req.file;

    let jobTitle = title || topic || url || targetUrl || 'AI Generated Quiz';
    if (textContent) jobTitle = 'AI Generated Quiz from Text';
    if (file) {
      jobTitle = title || file.originalname || 'AI Generated Quiz from File';
    }

    // Create an import job
    const job = await prisma.importJob.create({
      data: {
        title: jobTitle,
        jobStatus: 'PROCESSING',
      },
    });

    // Start background processing (no longer calls Python service)
    processAiJob(job.jobId, req.body, file).catch((e) =>
      console.error('Unhandled error in processAiJob:', e)
    );

    return res.status(202).json({
      success: true,
      message: 'Import started',
      data: job,
    });
  } catch (error) {
    console.error('Error importing quiz:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};

export const getImportStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const jobId = req.params.jobId as string;

    const job = await prisma.importJob.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: 'Job not found' });
    }

    return res.json({
      success: true,
      message: 'Job status retrieved',
      data: job,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};
