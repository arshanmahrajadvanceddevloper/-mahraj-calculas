import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const geminiRouter = Router();

// Lazy-initialize Gemini client to ensure zero startup crashes if key is initially empty
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_')) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

/**
 * POST /api/gemini/chat
 * Handles text-based conversations with Mahraj helps, with optional text-to-speech output.
 */
geminiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, voiceEnabled } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages list is required and must be an array.' });
      return;
    }

    const client = getAiClient();
    if (!client) {
      res.status(503).json({
        error: 'Gemini AI service is currently unavailable. Please verify your GEMINI_API_KEY in the Secrets panel.',
      });
      return;
    }

    // Prepare concise, high-impact system instruction for maximum speed & accuracy
    const systemInstruction = 
      'You are "Mahraj helps", the ultra-fast intelligent AI companion for Mahraj Calculus.\n' +
      'You answer ANY question in Science, Math, Calculus, Physics, Chemistry, Coding, and General Knowledge.\n\n' +
      'RULES FOR MAXIMUM ACCURACY & LIGHTNING SPEED:\n' +
      '1. Be direct, authoritative, and concise. Avoid disclaimers or repetitive preambles.\n' +
      '2. For Math & Equations: State formula clearly, show clean step-by-step arithmetic/algebra, and highlight final answer.\n' +
      '3. For Images/Documents/Exams: Accurately read all text, identify question numbers, and solve step-by-step.\n' +
      '4. Language: Automatically detect user language/dialect (English, Hindi, Roman Urdu/Hindi, etc.) and reply in the same language.\n' +
      '5. Formatting: Clean markdown with headers (##), bullet points, and standard code blocks (```python, etc.). Never output raw LaTeX delimiters like $$ or $.';

    // Format message history for the Gemini SDK generateContent structure
    // Accepts multimodal text and image data (base64 inlineData)
    let hasImages = false;
    const geminiContents = messages.map((msg: any) => {
      const role = msg.role === 'user' ? 'user' : 'model';
      const parts: any[] = [];

      if (msg.image) {
        hasImages = true;
        let mimeType = 'image/jpeg';
        let base64Data = '';
        if (typeof msg.image === 'string') {
          const match = msg.image.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          } else {
            base64Data = msg.image;
          }
        } else if (msg.image && typeof msg.image === 'object') {
          base64Data = msg.image.data || '';
          mimeType = msg.image.mimeType || 'image/jpeg';
        }

        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      const text = msg.content?.trim() || (parts.length > 0 ? 'Analyze this image in detail: solve any questions or equations, scan and explain.' : '');
      if (text) {
        parts.push({ text });
      }

      return {
        role,
        parts: parts.length > 0 ? parts : [{ text: 'Hello' }],
      };
    });

    let textResponse: any = null;
    let lastError: any = null;

    if (hasImages) {
      // Multimodal vision & OCR: use proven multimodal models with fast fallback
      const visionModels = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const modelName of visionModels) {
        try {
          const res = await client.models.generateContent({
            model: modelName,
            contents: geminiContents as any,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.5,
              maxOutputTokens: 1200,
            },
          });
          if (res && res.text) {
            textResponse = res;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[GEMINI ROUTER] Vision model ${modelName} failed (${err?.status || err?.message})`);
        }
      }
    } else {
      // Text-only: Run a parallel race across the fastest models!
      // Whichever model responds first wins and is returned immediately to user!
      const raceModels = ['gemma-4-26b-a4b-it', 'gemini-3.6-flash', 'gemini-3-flash-preview'];
      try {
        const racePromises = raceModels.map((modelName) =>
          client.models.generateContent({
            model: modelName,
            contents: geminiContents as any,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.6,
              maxOutputTokens: 900,
            },
          }).then((res) => {
            if (!res || !res.text) throw new Error('Empty response');
            return res;
          })
        );

        // Resilient 12s race timeout so users never wait and heavy concurrent batches complete safely
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Race timeout')), 12000)
        );

        textResponse = await Promise.race([Promise.any(racePromises), timeoutPromise]) as any;
      } catch (raceErr: any) {
        console.warn('[GEMINI ROUTER] Parallel race failed, falling back:', raceErr?.message);
        const fallbackModels = ['gemma-4-26b-a4b-it', 'gemini-3-flash-preview', 'gemini-3.6-flash'];
        for (const modelName of fallbackModels) {
          try {
            const res = await client.models.generateContent({
              model: modelName,
              contents: geminiContents as any,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.6,
                maxOutputTokens: 1000,
              },
            });
            if (res && res.text) {
              textResponse = res;
              break;
            }
          } catch (e: any) {
            lastError = e;
          }
        }
      }
    }

    if (!textResponse) {
      throw new Error(`All generative text models failed. Last error: ${lastError?.message || String(lastError)}`);
    }

    const aiText = textResponse.text || '';

    // Fast-path: Return response instantly to achieve lightning speed
    res.status(200).json({
      text: aiText,
      audio: null,
    });
  } catch (error: any) {
    console.error('[GEMINI ROUTER ERROR] Failed to process chat request:', error);
    res.status(500).json({
      error: 'An internal error occurred while generating the AI response. Please try again.',
      details: error.message || String(error),
    });
  }
});

// In-memory cache for generated TTS audio to save quota and provide instant playback
const ttsAudioCache = new Map<string, string>();
let ttsCooldownUntil = 0;

/**
 * Dedicated Mahraj Voice TTS Endpoint: Converts text into ultra-smooth, natural audio
 * Supporting Female ('Kore') and Male ('Charon') voices with native accent adaptation
 * Features intelligent audio caching and silent fallback to prevent quota exhaustion
 */
geminiRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, gender = 'female', voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Determine voice based on gender selection
    // 'Kore' is renowned for ultra-smooth, sweet, melodious warmth (Female)
    // 'Charon' is renowned for deep, velvety, reassuring studio baritone (Male)
    const effectiveVoice = voiceName || (gender === 'male' ? 'Charon' : 'Kore');

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*#_`~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 plus $2')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 minus $2')
      .replace(/(\d+)\s*\*\s*(\d+)/g, '$1 multiplied by $2')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 divided by $2')
      .replace(/(\d+)\s*=\s*(\d+)/g, '$1 equals $2')
      .replace(/\n+/g, '. ')
      .trim()
      .slice(0, 500);

    // 1. Check in-memory cache first (Zero latency, zero quota usage)
    const cacheKey = `${effectiveVoice}:${cleanText}`;
    if (ttsAudioCache.has(cacheKey)) {
      return res.status(200).json({ 
        audio: ttsAudioCache.get(cacheKey),
        voice: effectiveVoice,
        gender,
        cached: true
      });
    }

    // 2. Check if circuit breaker is cooling down after recent 429
    if (Date.now() < ttsCooldownUntil) {
      return res.status(200).json({ audio: null, fallback: true });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(200).json({ audio: null, fallback: true });
    }

    // Detect language or script to guide natural accent
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const hasUrduArabic = /[\u0600-\u06FF]/.test(cleanText);
    const hasRomanHindiUrdu = /\b(hai|hain|kya|karein|kaise|karna|hota|hoti|hote|suno|bilkul|bhai|sakte|chahiye|batao|aap|hum|apne|isko|kuch|bahut|acha|accha|shukriya|namaste|salaam)\b/i.test(cleanText);

    let accentStyle = 'Ultra-smooth, gentle, expressive, studio-quality natural human voice.';
    if (hasDevanagari || hasRomanHindiUrdu) {
      accentStyle = 'Ultra-smooth, melodious, fluent with natural Indian/South Asian accent and warm cadence.';
    } else if (hasUrduArabic) {
      accentStyle = 'Ultra-smooth, articulate, and fluent with authentic Urdu/Arabic phonetics.';
    }

    const ttsResponse = await client.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: accentStyle,
              },
            },
          ],
        },
      ] as any,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: effectiveVoice },
          },
        },
      },
    });

    const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      const audioData = part.inlineData.data;
      // Store in LRU cache up to 100 audio files
      if (ttsAudioCache.size > 100) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, audioData);

      return res.status(200).json({ 
        audio: audioData,
        voice: effectiveVoice,
        gender
      });
    }

    return res.status(200).json({ audio: null, fallback: true });
  } catch (err: any) {
    const isQuotaOrRateLimit = 
      err?.status === 429 || 
      err?.code === 429 || 
      String(err?.message || '').includes('429') || 
      String(err?.message || '').includes('quota') ||
      String(err?.message || '').includes('RESOURCE_EXHAUSTED');

    if (isQuotaOrRateLimit) {
      // Cooldown for 25 seconds to respect free tier limits and seamlessly fall back to local voice
      ttsCooldownUntil = Date.now() + 25000;
      return res.status(200).json({ audio: null, fallback: true });
    }

    return res.status(200).json({ audio: null, fallback: true });
  }
});


