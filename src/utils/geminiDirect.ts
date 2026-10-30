/**
 * Direct Gemini API caller for static environments (e.g. GitHub Pages, standalone APK)
 * Allows the app to work seamlessly without an active Node.js server.
 */

import { AnswerEvaluation, calculateOverallBand } from './ieltsScoring';

export async function evaluateDirectlyWithGemini(
  question: string,
  userAnswer: string,
  apiKey: string,
  part: string = 'Part 1'
): Promise<AnswerEvaluation> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

  const prompt = `You are a certified IELTS Speaking Examiner. Evaluate the following response.
Question: "${question}"
Candidate Answer: "${userAnswer}"
Part: ${part}

Output ONLY valid JSON matching this schema:
{
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
IMPORTANT: You only see a text transcript, so give pronunciation as a cautious estimate. For grammarCorrections, explain the rule in clear BENGALI (বাংলা).`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');

  const result = JSON.parse(text);
  if (result.criteria) result.estimatedBand = calculateOverallBand(result.criteria);
  result.disclaimer = 'Estimated from a text transcript only. Pronunciation and pause scores are rough estimates. Not an official rating.';
  return result;
}
