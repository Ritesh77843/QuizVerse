/**
 * Run: node test_pdf.js
 * Diagnoses why PDF extraction is failing
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create a minimal valid PDF with text
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>endobj\n' +
  '4 0 obj<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World Test PDF) Tj ET\nendstream\nendobj\n' +
  'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000068 00000 n \n0000000125 00000 n \n0000000266 00000 n \n' +
  'trailer<</Size 5/Root 1 0 R>>\nstartxref\n360\n%%EOF'
);

async function testPdfParse() {
  console.log('\n=== TEST 1: pdf-parse (require) ===');
  try {
    const pdfParse = require('pdf-parse');
    console.log('  require("pdf-parse") type:', typeof pdfParse);
    console.log('  pdfParse.default type:', typeof pdfParse.default);
    
    const fn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
    console.log('  fn type:', typeof fn);
    
    if (typeof fn === 'function') {
      const data = await fn(MINIMAL_PDF);
      console.log('  ✅ SUCCESS! Extracted text:', JSON.stringify(data.text?.trim()?.slice(0, 100)));
    } else {
      console.log('  ❌ FAIL: pdf-parse did not return a callable function');
    }
  } catch (e) {
    console.log('  ❌ FAIL:', e.message?.slice(0, 200));
    console.log('  Stack:', e.stack?.slice(0, 300));
  }
}

async function testGeminiVision() {
  console.log('\n=== TEST 2: Gemini Vision for PDF ===');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('  ❌ SKIPPED: GEMINI_API_KEY not set');
    return;
  }
  console.log('  API key present:', apiKey.slice(0, 10) + '...');
  
  try {
    const base64 = MINIMAL_PDF.toString('base64');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extract all text from this PDF document.' },
              { inline_data: { mime_type: 'application/pdf', data: base64 } },
            ]
          }],
        }),
        signal: AbortSignal.timeout(30000),
      }
    );
    
    const data = await res.json();
    if (!res.ok) {
      console.log('  ❌ FAIL HTTP', res.status, ':', JSON.stringify(data).slice(0, 300));
    } else {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('  ✅ SUCCESS! Response:', JSON.stringify(text?.slice(0, 100)));
    }
  } catch (e) {
    console.log('  ❌ FAIL:', e.message?.slice(0, 200));
  }
}

async function testUploadsDir() {
  console.log('\n=== TEST 3: uploads/ directory ===');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('  ✅ uploads/ directory exists');
  } else {
    console.log('  ❌ uploads/ directory does NOT exist — multer will fail!');
    console.log('  Creating it...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('  ✅ Created uploads/ directory');
  }
}

async function testGroq() {
  console.log('\n=== TEST 4: Groq API ===');
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log('  ❌ SKIPPED: GROQ_API_KEY not set');
    return;
  }
  console.log('  API key present:', apiKey.slice(0, 10) + '...');
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (!res.ok) {
      console.log('  ❌ FAIL HTTP', res.status, ':', JSON.stringify(data).slice(0, 200));
    } else {
      console.log('  ✅ SUCCESS! Response:', data.choices?.[0]?.message?.content);
    }
  } catch (e) {
    console.log('  ❌ FAIL:', e.message?.slice(0, 200));
  }
}

async function main() {
  console.log('QuizVerse PDF Diagnostic Tool');
  console.log('Node version:', process.version);
  console.log('CWD:', process.cwd());
  
  await testUploadsDir();
  await testPdfParse();
  await testGeminiVision();
  await testGroq();
  
  console.log('\n=== DONE ===\n');
}

main().catch(console.error);
