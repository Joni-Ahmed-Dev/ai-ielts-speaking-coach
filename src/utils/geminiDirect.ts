/**
 * Direct Gemini API caller for static environments (e.g. GitHub Pages, standalone APK)
 * Allows the app to work seamlessly without an active Node.js server.
 */

import { AnswerEvaluation } from './ieltsScoring';

export async function evaluateDirectlyWithGemini(
  question: string,
  userAnswer: string,
  apiKey: string,
  part: string = 'Part 1',
  userAudio?: { base64: string; mimeType: string } | null
): Promise<AnswerEvaluation & { userTranscribedAnswer?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const prompt = `You are a certified IELTS Speaking Examiner. Evaluate the candidate's response.
Question: "${question}"
${userAnswer ? `Candidate Answer: "${userAnswer}"` : 'Please transcribe the candidate response from audio into English (put in "userTranscribedAnswer") and evaluate.'}
Part: ${part}

Output ONLY valid JSON matching this schema:
{
  "userTranscribedAnswer": string (transcribed candidate answer if audio provided),
  "estimatedBand": number,
  "oneSentenceFeedback": string,
  "criteria": {
    "fluency": number,
    "vocabulary": number,
    "grammar": number,
    "pronunciation": number
  },
  "grammarCorrections": [
    {
      "original": string,
      "improved": string,
      "explanationBengali": string
    }
  ],
  "vocabularySuggestions": [
    {
      "used": string,
      "suggested": string,
      "context": string,
      "bengaliMeaning": string
    }
  ],
  "pausesAndRepetitions": [string],
  "howToDevelop": [string],
  "recurringHabitsNoticed": [string],
  "disclaimer": "Estimated band score based on IELTS rubric. Practice evaluation only."
}
IMPORTANT: For grammarCorrections, explain the rule in clear BENGALI (বাংলা).`;

  const parts: any[] = [];
  if (userAudio) {
    parts.push({
      inline_data: {
        mime_type: userAudio.mimeType,
        data: userAudio.base64,
      },
    });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');

  return JSON.parse(text);
}
