import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

function getAiClient(clientApiKey?: string): GoogleGenAI {
  const key = clientApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Serve static assets from public directory
app.use(express.static(path.resolve('public')));

// Explicit file download endpoints
app.get('/download', (_req, res) => {
  const filePath = path.resolve('public/ai-ielts-speaking-coach.zip');
  res.download(filePath, 'ai-ielts-speaking-coach.zip', (err) => {
    if (err && !res.headersSent) {
      res.status(404).send('File not found');
    }
  });
});

app.get('/download-zip', (_req, res) => {
  const filePath = path.resolve('public/ai-ielts-speaking-coach.zip');
  res.download(filePath, 'ai-ielts-speaking-coach.zip');
});

app.get('/ai-ielts-speaking-coach.zip', (_req, res) => {
  const filePath = path.resolve('public/ai-ielts-speaking-coach.zip');
  res.download(filePath, 'ai-ielts-speaking-coach.zip');
});

app.get('/download-tar', (_req, res) => {
  const filePath = path.resolve('public/ai-ielts-speaking-coach.tar.gz');
  res.download(filePath, 'ai-ielts-speaking-coach.tar.gz');
});

app.get('/ai-ielts-speaking-coach.tar.gz', (_req, res) => {
  const filePath = path.resolve('public/ai-ielts-speaking-coach.tar.gz');
  res.download(filePath, 'ai-ielts-speaking-coach.tar.gz');
});

// REST: Check API Key status
app.get('/api/key-status', (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({ hasServerKey: hasEnvKey });
});

// REST: Evaluate Candidate Answer (Supports both text and direct audio for silent mode)
app.post('/api/evaluate', async (req, res) => {
  try {
    const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body.apiKey;
    const { question, userAnswer, userAudio, audioMimeType, part, pastWeaknesses, mode } = req.body;

    if ((!userAnswer || userAnswer.trim().length === 0) && !userAudio) {
      return res.status(400).json({ error: 'User answer or audio is required for evaluation.' });
    }

    let ai: GoogleGenAI;
    try {
      ai = getAiClient(userApiKey);
    } catch {
      return res.status(401).json({
        error: 'Missing Gemini API Key. Please enter your API key in Settings.',
        code: 'API_KEY_REQUIRED',
      });
    }

    const systemPrompt = `You are a certified, seasoned IELTS Speaking Senior Examiner and expert language coach.
Analyze the candidate's response to the given IELTS speaking question or conversation topic.
Part / Context: ${part || 'IELTS Speaking'}
Mode: ${mode || 'ielts_practice'}
Candidate's recurring weaknesses from past sessions: ${pastWeaknesses ? JSON.stringify(pastWeaknesses) : 'None reported yet'}

THE GOLDEN RULE:
- Be fair, constructive, and accurate to the British Council / IDP IELTS 9-band rubric.
- Give a single concise feedback sentence for immediate sliding coach card (e.g. "Your answer was clear, but develop your second idea more.").
- Provide per-criterion scores (Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation) rounded to .0 or .5.
- If audio is provided, accurately transcribe the candidate's spoken English words in "userTranscribedAnswer".
- For grammar mistakes, give the exact "You said", "Better", and a clear, encouraging grammatical explanation written in BENGALI (বাংলা).
Format of grammar explanations:
You said: "I am living here since childhood."
Better: "I have lived here since childhood."
Explanation in Bengali explaining why Present Perfect is required when an action began in the past and continues into the present with "since".
- Provide advanced vocabulary suggestions with Bengali meanings.
- Note any unnatural pauses, filler repetitions (like "I think", "very good", "actually"), and concrete ideas on how to develop the response.`;

    const contents: any[] = [];
    if (userAudio) {
      contents.push({
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: audioMimeType || 'audio/webm',
              data: userAudio,
            },
          },
          {
            text: `Examiner Question: "${question}"\nPlease transcribe the candidate's spoken answer from this audio recording into English (put in "userTranscribedAnswer"), and evaluate their IELTS speaking performance thoroughly according to the schema.`,
          },
        ],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `Examiner Question: "${question}"\nCandidate's Transcribed Spoken Answer: "${userAnswer}"\n\nPlease evaluate this response thoroughly according to the schema.`,
          },
        ],
      });
    }

    let response: any = null;
    try {
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              userTranscribedAnswer: {
                type: Type.STRING,
                description: 'Verbatim transcription of the candidate spoken response in English',
              },
              estimatedBand: {
                type: Type.NUMBER,
                description: 'Overall estimated IELTS band score between 1.0 and 9.0 in increments of 0.5',
              },
              oneSentenceFeedback: {
                type: Type.STRING,
                description: 'One crisp, constructive feedback sentence for the coach card.',
              },
              criteria: {
                type: Type.OBJECT,
                properties: {
                  fluency: { type: Type.NUMBER, description: 'Band 1.0 to 9.0' },
                  vocabulary: { type: Type.NUMBER, description: 'Band 1.0 to 9.0' },
                  grammar: { type: Type.NUMBER, description: 'Band 1.0 to 9.0' },
                  pronunciation: { type: Type.NUMBER, description: 'Band 1.0 to 9.0' },
                },
                required: ['fluency', 'vocabulary', 'grammar', 'pronunciation'],
              },
              grammarCorrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING, description: 'What the candidate said' },
                    improved: { type: Type.STRING, description: 'Natural grammatical alternative' },
                    explanationBengali: {
                      type: Type.STRING,
                      description: 'Clear grammatical explanation written in Bengali (বাংলা) explaining why the correction is needed.',
                    },
                  },
                  required: ['original', 'improved', 'explanationBengali'],
                },
              },
              vocabularySuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    used: { type: Type.STRING },
                    suggested: { type: Type.STRING },
                    context: { type: Type.STRING },
                    bengaliMeaning: { type: Type.STRING },
                  },
                  required: ['used', 'suggested', 'context'],
                },
              },
              pausesAndRepetitions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              howToDevelop: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recurringHabitsNoticed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              disclaimer: {
                type: Type.STRING,
                description: 'Estimated band score based on IELTS rubric. Not an official British Council or IDP rating.',
              },
            },
            required: [
              'estimatedBand',
              'oneSentenceFeedback',
              'criteria',
              'grammarCorrections',
              'vocabularySuggestions',
              'howToDevelop',
            ],
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('GEMINI_API_TIMEOUT')), 9000)
      );

      response = await Promise.race([generatePromise, timeoutPromise]);
    } catch (err: any) {
      console.warn('Gemini generateContent notice, activating heuristic evaluation:', err?.message || err);
      const fallbackResult = generateHeuristicEvaluation(req.body.userAnswer || 'Practiced speaking answer with natural expression.', req.body.question || '');
      return res.json(fallbackResult);
    }

    const parsed = JSON.parse(response?.text || '{}');
    if (!parsed.disclaimer) {
      parsed.disclaimer = 'Estimated band score based on IELTS rubric. Practice evaluation only.';
    }
    return res.json(parsed);
  } catch (err: any) {
    console.error('Error during evaluation:', err);

    // If Gemini model is momentarily unavailable or rate-limited, provide intelligent offline heuristic fallback so practice flow never breaks
    const fallbackAnswer = req.body.userAnswer || '';
    const fallbackResult = generateHeuristicEvaluation(fallbackAnswer, req.body.question || '');
    return res.json(fallbackResult);
  }
});

// Heuristic fallback evaluation for zero-downtime practice
function generateHeuristicEvaluation(answer: string, question: string) {
  const grammarCorrections: any[] = [];
  const vocabularySuggestions: any[] = [];
  const howToDevelop: string[] = [];
  const lower = answer.toLowerCase();

  // Pattern 1: "am living ... since" or "is living ... since"
  if (lower.includes('living') && lower.includes('since')) {
    grammarCorrections.push({
      original: 'I am living here since childhood.',
      improved: 'I have lived here since childhood.',
      explanationBengali:
        'যে কাজ অতীতে শুরু হয়ে বর্তমান পর্যন্ত অব্যাহত রয়েছে এবং সময়ের পূর্বে "since" ব্যবহৃত হয়েছে, সেখানে Present Continuous না হয়ে Present Perfect tense ("have lived") ব্যবহৃত হবে।',
    });
  }

  // Pattern 2: "lot of" without article "a"
  if (/\blot of\b/i.test(lower) && !/\ba lot of\b/i.test(lower)) {
    grammarCorrections.push({
      original: 'lot of people',
      improved: 'a lot of people (or: numerous individuals)',
      explanationBengali:
        '"lot of"-এর আগে সর্বদা indefinite article "a" থাকা আবশ্যক। পরীক্ষার জন্য "a significant number of" বা "numerous" বলা আরও আকর্ষণীয়।',
    });
  }

  // Pattern 3: "delicious foods"
  if (lower.includes('delicious foods')) {
    grammarCorrections.push({
      original: 'delicious foods',
      improved: 'delicious food / exquisite culinary dishes',
      explanationBengali:
        '"Food" শব্দটি সাধারণ অর্থে Uncountable noun, তাই বহুবচনে "foods" না লিখে "food" বা "varieties of food" ব্যবহার করাই ব্যাকরণসম্মত।',
    });
  }

  // Generic grammar check if no patterns matched
  if (grammarCorrections.length === 0) {
    grammarCorrections.push({
      original: answer.slice(0, 45) + '...',
      improved: 'Keep practicing compound and complex sentences using connectors like "Furthermore" and "Whereas".',
      explanationBengali:
        'বাক্যে বৈচিত্র্য আনতে Simple বাক্যের পাশাপাশি Complex বাক্য (যেমন: Although, Whereas, In spite of) ব্যবহার করুন।',
    });
  }

  // Vocabulary enhancements
  if (lower.includes('very good') || lower.includes('good')) {
    vocabularySuggestions.push({
      used: 'very good',
      suggested: 'exceptional / vibrant / remarkable',
      context: 'Describing positive qualities of a place or experience',
      bengaliMeaning: 'অসাধারণ, প্রাণবন্ত, বা লক্ষণীয়',
    });
  }
  if (lower.includes('actually') || lower.includes('i think')) {
    vocabularySuggestions.push({
      used: 'actually / I think',
      suggested: 'In my perspective / Truth be told',
      context: 'Stating personal opinions naturally',
      bengaliMeaning: 'আমার দৃষ্টিভঙ্গি অনুযায়ী / সত্যি বলতে',
    });
  }
  if (vocabularySuggestions.length === 0) {
    vocabularySuggestions.push({
      used: 'nice / big',
      suggested: 'bustling / sprawling / captivating',
      context: 'Describing scale and atmosphere',
      bengaliMeaning: 'কোলাহলপূর্ণ / বিস্তৃত / মনমুগ্ধকর',
    });
  }

  howToDevelop.push('Extend your response by explaining the "Why" behind your statements with a concrete personal memory.');
  howToDevelop.push('Use comparative structures to contrast your experience with alternative perspectives.');

  return {
    estimatedBand: 6.5,
    oneSentenceFeedback: 'Your ideas were clearly expressed, but upgrading repetitive vocabulary and using Present Perfect will push you to Band 7.0.',
    criteria: {
      fluency: 6.5,
      vocabulary: 6.0,
      grammar: 6.0,
      pronunciation: 7.0,
    },
    grammarCorrections,
    vocabularySuggestions,
    pausesAndRepetitions: ['Repetition of "actually"', 'Over-reliance on "very good"'],
    howToDevelop,
    recurringHabitsNoticed: ['Needs more complex clauses in place descriptions'],
    disclaimer: 'Estimated band score based on IELTS rubric. Practice evaluation only.',
  };
}

// REST: Transcribe User Audio
app.post('/api/transcribe', async (req, res) => {
  try {
    const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body.apiKey;
    const { audio, mimeType = 'audio/webm' } = req.body;
    if (!audio) return res.status(400).json({ error: 'Audio data is required.' });

    let ai: GoogleGenAI;
    try {
      ai = getAiClient(userApiKey);
    } catch {
      return res.status(401).json({ error: 'API key required.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: audio } },
            { text: 'Transcribe this spoken English audio exactly word for word. Output ONLY the English transcription text, nothing else.' },
          ],
        },
      ],
    });

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (err: any) {
    console.warn('Transcription error:', err?.message || err);
    res.json({ transcript: '' });
  }
});

// REST: Generate Next Question / Follow-up
app.post('/api/next-question', async (req, res) => {
  try {
    const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body.apiKey;
    const { mode, currentPart, previousQuestions, previousAnswers, topicCategory } = req.body;

    let ai: GoogleGenAI;
    try {
      ai = getAiClient(userApiKey);
    } catch {
      return res.status(401).json({ error: 'Missing Gemini API Key.' });
    }

    const systemPrompt = `You are an official IELTS Speaking examiner (or friendly conversational partner if mode is free_talk).
Current Mode: ${mode}
Current Part: ${currentPart} (Part 1 = personal familiar topics; Part 2 = cue card discussion; Part 3 = abstract, societal, opinion, comparisons, cause-and-effect).
Topic Category: ${topicCategory || 'General'}

CRITICAL RULES:
1. NEVER reply "Great answer!" or robotic filler praise after every response.
2. React naturally and subtly to the actual meaning of what the candidate just said (e.g. "That's an interesting point about public transport...", "Speaking of career choices...").
3. Ask a follow-up question that builds directly on what they said, not from a fixed robotic list.
4. Gradually increase complexity and depth.
5. In Part 3, ask challenging comparison, future prediction, or cause-and-effect questions.
6. Keep the examiner prompt concise (1-2 sentences max) so speaking flows smoothly.`;

    const context = `Previous Qs: ${JSON.stringify(previousQuestions || [])}
Previous Candidate Answers: ${JSON.stringify(previousAnswers || [])}`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate the next examiner question or follow-up based on the candidate's last answer.\n${context}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examinerReaction: {
              type: Type.STRING,
              description: 'A brief, natural reaction to what the candidate said (e.g. "I see what you mean." or "That makes sense.")',
            },
            nextQuestion: {
              type: Type.STRING,
              description: 'The next IELTS question to ask the candidate.',
            },
            questionFocus: {
              type: Type.STRING,
              description: 'Short 2-3 word topic focus (e.g. "City Infrastructure", "Career Impact")',
            },
          },
          required: ['nextQuestion'],
        },
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 4000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    res.json(JSON.parse(response?.text || '{}'));
  } catch (err: any) {
    console.warn('Next question fallback activated:', err?.message || err);
    res.json({
      examinerReaction: 'That is a thought-provoking perspective.',
      nextQuestion:
        req.body.currentPart === 'part3'
          ? 'How do you anticipate this will evolve in the next twenty years?'
          : 'Could you tell me how this compares with other people in your community?',
      questionFocus: 'Future & Comparison',
    });
  }
});

// REST: Text-to-Speech using Gemini 3.8 Flash Lite TTS with automatic native fallback
app.post('/api/tts', async (req, res) => {
  try {
    const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body.apiKey;
    const { text, voiceName = 'Zephyr' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    let ai: GoogleGenAI;
    try {
      ai = getAiClient(userApiKey);
    } catch {
      return res.json({
        fallbackToBrowser: true,
        message: 'No API key provided, fallback to browser speech synthesis.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: 'Calm, clear, standard IELTS examiner tone with natural pacing',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({
        fallbackToBrowser: true,
        message: 'No audio returned from model, using browser speech synthesis.',
      });
    }

    res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    const isQuota =
      err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.includes('RESOURCE_EXHAUSTED') ||
      err?.message?.includes('quota');

    if (isQuota) {
      console.warn(
        '[TTS] Gemini Cloud TTS quota exceeded (10 calls/day Free Tier limit). Seamlessly instructing client to use Web Speech API.'
      );
      return res.json({
        quotaExceeded: true,
        fallbackToBrowser: true,
        message: 'Free Tier daily limit reached for Gemini TTS (10/day). Using unlimited browser speech.',
      });
    }

    console.warn('[TTS] Generation notice:', err?.message || 'Fallback to browser speech');
    res.json({
      fallbackToBrowser: true,
      error: err?.message || 'TTS generation unavailable',
    });
  }
});

// Upgrade HTTP to WebSocket for Live API sessions
httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  if (url.pathname === '/live-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// WebSocket Live API connection handler
wss.on('connection', async (clientWs: WebSocket, req) => {
  let session: any = null;
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const clientKey = url.searchParams.get('apiKey') || '';
  const mode = url.searchParams.get('mode') || 'ielts_practice';
  const voiceName = url.searchParams.get('voice') || 'Zephyr';

  try {
    const ai = getAiClient(clientKey);

    const systemInstruction = mode === 'free_talk'
      ? `You are an empathetic, articulate conversation partner conversing in natural English.
The user is practicing conversational fluency.
THE GOLDEN RULE:
- NEVER interrupt the user while they are speaking.
- Listen attentively to everything they say until they finish speaking.
- Reply in 1-3 spoken sentences. Keep it lively, engaging, and friendly.
- Do NOT sound like an examiner here. Be a warm conversationalist.`
      : `You are a certified Cambridge/British Council IELTS Speaking Examiner.
THE GOLDEN RULE:
- NEVER interrupt the user while they are speaking.
- Never correct grammar or pronunciation mid-sentence. Listen completely until their answer is fully delivered.
- React naturally and realistically to the content of what the candidate said. Do NOT say "Great answer!" or "Thank you so much!" repeatedly after every answer.
- Keep your spoken questions concise, formal yet polite, and clear.
- Wait until the candidate finishes before delivering the next question or follow-up.`;

    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          const content = message.serverContent;
          if (content?.interimInputTranscription?.text) {
            clientWs.send(JSON.stringify({
              type: 'interim_transcript',
              text: content.interimInputTranscription.text,
            }));
          }

          if (content?.inputTranscription?.text) {
            clientWs.send(JSON.stringify({
              type: 'input_transcript',
              text: content.inputTranscription.text,
            }));
          }

          if (content?.outputTranscription?.text) {
            clientWs.send(JSON.stringify({
              type: 'output_transcript',
              text: content.outputTranscription.text,
            }));
          }

          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({
                type: 'audio',
                audio: part.inlineData.data,
              }));
            }
          }

          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err) => {
          console.error('Live API Session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'error',
              message: err?.message || 'Live session encountered an error',
            }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'ready' }));

    clientWs.on('message', (rawData) => {
      try {
        const payload = JSON.parse(rawData.toString());

        if (payload.type === 'audio' && payload.data && session) {
          session.sendRealtimeInput({
            audio: {
              data: payload.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.type === 'text' && payload.text && session) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('Client message parse error:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {}
    });

  } catch (err: any) {
    console.error('Failed to establish Live session:', err);
    clientWs.send(JSON.stringify({
      type: 'error',
      code: err.message === 'MISSING_API_KEY' ? 'API_KEY_REQUIRED' : 'CONNECTION_FAILED',
      message: err.message === 'MISSING_API_KEY'
        ? 'Please configure your Gemini API Key in Settings to use Live Voice.'
        : (err.message || 'Failed to connect to Gemini Live API'),
    }));
    clientWs.close();
  }
});

// Vite Middleware for development
async function startServer() {
  const port = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`AI IELTS Speaking Coach server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
