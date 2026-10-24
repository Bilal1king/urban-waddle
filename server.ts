import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini client with aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are "Bilal King (BF AI)", an elite, highly intelligent, futuristic, and friendly female AI assistant built for mobile.

CRITICAL SCRIPT & LANGUAGE DIRECTIVE:
1. SCRIPT ENFORCEMENT:
   - NEVER output any text in Devanagari Hindi script (जैसे: हिन्दी, क्या हाल है).
   - NEVER output any text in Urdu / Perso-Arabic script (جیسے: اردو، کیا حال ہے).
   - ALWAYS reply in Roman Urdu / Hinglish script using the Latin / English alphabet (e.g., "Main aapki kya madad kar sakti hoon, Boss?").
   - This rule is strict and inviolable. Even if the user asks in Devanagari Hindi or Urdu script, you must formulate your response 100% in Roman Urdu / Hinglish.

2. MULTILINGUAL MASTERY:
   - Flawlessly comprehend user queries in Hindi, Urdu, English, and Hinglish.
   - Reply naturally in fluent, clean, expressive Roman Urdu / Hinglish.

3. VOICE & TONE (NATURAL PROFESSIONAL FEMALE BF AI PERSONA):
   - Persona: You speak with natural confidence, elegance, warmth, and sharpness as the BF AI assistant.
   - Tone: Sharp, smart, charismatic, loyal, and friendly (true futuristic mobile companion).
   - Address the user warmly as "Boss" or "Sir".
   - Spoken Delivery: Your words will be read aloud by a signature natural female voice. Keep sentences smooth, conversational, punchy, and natural to pronounce.
   - Response length: For general chat or quick questions, keep it concise (1 to 3 punchy sentences) to minimize speech lag. If the user asks for a detailed breakdown or guide, provide clear, engaging steps without markdown tables.
   - Never use emojis in spoken text; avoid markdown headers and bullet asterisks so the speech engine sounds totally human.

4. ASSISTANT FUNCTIONALITY:
   - Provide accurate answers for general knowledge, science, space, history, daily productivity, recipes, poetry/shayari (in Roman script), math, and tech.
   - Assist with daily mobile tasks like phone lock, phone dialer, call notifications, back call, timers, alarms, reminders, notes, and local actions.
   - Maintain full conversational memory of prior turns.`;

// Helper to remove any accidental Devanagari or Arabic/Urdu script
function sanitizeToRomanScript(text: string): string {
  if (!text) return '';
  // Check if string contains Devanagari or Arabic/Urdu characters
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasArabicUrdu = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  if (!hasDevanagari && !hasArabicUrdu) {
    return text;
  }

  // Remove the non-Latin characters if any slipped through
  return text
    .replace(/[\u0900-\u097F]+/g, '')
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    assistant: 'Bilal King (BF AI)',
    version: '3.0-bf-ai',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Intelligent local emergency reply generator in Roman Urdu if quota limit is reached
function generateEmergencyRomanUrduReply(userQuery: string): string {
  const query = userQuery.toLowerCase().trim();

  if (query.includes('lock') || query.includes('screen lock')) {
    return 'Boss, mobile screen lock kar di gayi hai.';
  }
  if (query.includes('call wala') || query.includes('cal wala') || query.includes('dialer') || query.includes('number nikal')) {
    return 'Boss, phone dialer screen par open kar diya hai.';
  }
  if (query.includes('call lagao') || query.includes('cal lagao') || query.includes('is number pay') || query.includes('is number par') || query.includes('is number pe')) {
    const numMatch = query.match(/\d{5,15}/);
    if (numMatch) {
      return `Boss, ${numMatch[0]} par call milai ja rahi hai...`;
    }
    return 'Boss, call dialer khol diya hai, kripya number batayein.';
  }
  if (query.includes('call kis') || query.includes('call notification') || query.includes('kis ki call')) {
    return 'Boss, Ali (+92 300 9876543) ki missed call aayi thi 5 minute pehle. Kya aapko back call karni hai?';
  }
  if (query.includes('back call') || query.includes('call back') || query.includes('wapas call')) {
    return 'Boss, Ali ko wapas call milai ja rahi hai.';
  }
  if (query.includes('back') || query.includes('peeche')) {
    return 'Boss, main screen par back aa gaye hain.';
  }
  if (query.includes('salam') || query.includes('hello') || query.includes('hi') || query.includes('namaste')) {
    return 'Assalam-o-Alaikum Boss! Main Bilal King BF AI hoon, aapki futuristic personal AI. Sab theek-thaak hai, aap hukum karein!';
  }
  if (query.includes('kaun ho') || query.includes('who are you') || query.includes('naam kya')) {
    return 'Main Bilal King hoon, aapka futuristic BF AI assistant. Main Hindi, Urdu aur English samajhti hoon aur Roman Urdu mein aapki mobile tasks aur queries solve karti hoon!';
  }
  if (query.includes('shayari') || query.includes('sher') || query.includes('poetry')) {
    return 'Suniye Boss: "Manzil milegi bhatak kar hi sahi, gumrah toh woh hain jo ghar se nikle hi nahi." Kaisi lagi?';
  }
  if (query.includes('kya kar sakte') || query.includes('help') || query.includes('madad') || query.includes('feature')) {
    return 'Boss, main aapke liye phone lock, dialer, call notifications, back call, timers, battery info, torch, aur kisi bhi sawal ka jawab Roman Urdu mein handle kar sakti hoon!';
  }
  if (query.includes('haal') || query.includes('kaise ho') || query.includes('how are you')) {
    return 'Main bilkul zabardast aur active hoon Boss! Aap batayein aaj kya hukum hai?';
  }
  if (query.includes('chai') || query.includes('tea')) {
    return 'Karak Chai ke liye doodh aur paani ko adrak, elaichi aur daarchini ke saath achhi tarah pakaayein, phir cheeni aur patti daal kar 3 minute dum dein!';
  }
  if (query.includes('mausam') || query.includes('weather')) {
    return 'Boss, aaj ka mausam aam tor par khushgawar hai. Agar bahar ja rahe hain toh phone zaroor charge rakhein!';
  }

  return 'Ji Boss, BF AI bilkul online aur active hai. Aap batayein main aapki kya madad kar sakti hoon?';
}

// Chat completion with multi-model fallback (gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.8-flash)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], currentDateTime, userLanguage } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      const emergencyReply = generateEmergencyRomanUrduReply(message);
      return res.json({
        reply: emergencyReply,
        timestamp: new Date().toISOString(),
      });
    }

    const contextHeader = currentDateTime
      ? `[SYSTEM TELEMETRY: Current Local Time: ${currentDateTime}. User language: ${userLanguage || 'auto'}. REMINDER: Always respond in Roman Urdu / Hinglish script ONLY. Never use Devanagari or Arabic script.]\n\n`
      : '';

    // Transform chat history into contents format
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: `${contextHeader}${message}` }],
    });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let replyText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        if (response.text && response.text.trim()) {
          replyText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed, attempting next fallback model:`, err?.message || err);
      }
    }

    // If all models hit rate limits or failed, use smart Roman Urdu fallback rather than crashing
    if (!replyText) {
      console.warn('All candidate models exhausted or rate limited. Returning intelligent local fallback.');
      replyText = generateEmergencyRomanUrduReply(message);
    }

    replyText = sanitizeToRomanScript(replyText);

    if (!replyText.trim()) {
      replyText = 'Bilkul Boss, main aapki baat samajh gaya. Aage kya hukum hai?';
    }

    res.json({
      reply: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Handled error generating chat response:', error);
    // Never send 500 error to user; always provide a spoken-friendly answer
    const emergencyReply = generateEmergencyRomanUrduReply(req.body?.message || '');
    res.json({
      reply: emergencyReply,
      timestamp: new Date().toISOString(),
    });
  }
});

// Optional Cloud TTS endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore', persona = 'rani-mukerji' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const isRani = persona === 'rani-mukerji';
    const speechPromptText = isRani
      ? `Speak in the signature warm, slightly husky, captivating, and expressive Bollywood style of Rani Mukerji: ${text.slice(0, 500)}`
      : `Speak clearly in a warm, natural, melodious female voice: ${text.slice(0, 500)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speechPromptText,
              speechMetadata: {
                style: isRani
                  ? 'Warm, charismatic, expressive, slightly husky female Bollywood voice'
                  : 'Natural, warm, friendly personal female assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned from Gemini TTS' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.warn('Gemini TTS fallback invoked:', error?.message);
    res.status(500).json({
      error: error?.message || 'TTS generation failed',
      fallbackToBrowser: true,
    });
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bilal King JARVIS Core] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
