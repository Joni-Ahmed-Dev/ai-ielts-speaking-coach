/**
 * IELTS Coach Session & Memory Storage
 * Preserves user band history, recurring habits, and adaptive examiner context in localStorage.
 */

import { CriterionScores, AnswerEvaluation } from './ieltsScoring';

export interface PracticeSessionRecord {
  id: string;
  timestamp: number;
  mode: 'ielts_practice' | 'free_talk' | 'mock_test';
  overallBand: number;
  criteria: CriterionScores;
  questionCount: number;
  evaluations: Array<{
    question: string;
    userAnswer: string;
    band: number;
    feedback: string;
    grammarHighlights: string[];
  }>;
  notedWeaknesses: string[];
}

export interface UserMemoryProfile {
  targetBand: number;
  recurringWeaknesses: string[];
  overusedWords: string[];
  preferredTopics: string[];
  strengthsBengali: string[];
  weaknessesBengali: string[];
  aiRecommendationBengali: string;
  totalPracticeMinutes: number;
}

export type MicMode = 'silent' | 'speech_recognition';

const STORAGE_KEYS = {
  SESSIONS: 'ielts_coach_sessions_v1',
  MEMORY: 'ielts_coach_memory_v1',
  API_KEY: 'ielts_coach_api_key_v1',
  MIC_MODE: 'ielts_coach_mic_mode_v1',
};

export function getStoredMicMode(): MicMode {
  if (typeof window === 'undefined') return 'silent';
  const saved = localStorage.getItem(STORAGE_KEYS.MIC_MODE);
  return (saved === 'speech_recognition' || saved === 'silent') ? saved : 'silent';
}

export function saveStoredMicMode(mode: MicMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MIC_MODE, mode);
}

export const DEFAULT_MEMORY_PROFILE: UserMemoryProfile = {
  targetBand: 7.0,
  recurringWeaknesses: [
    'Over-reliance on repetitive transition phrases like "I think" and "Actually"',
    'Needs to expand Part 3 answers with real-world examples and hypothetical conditionals',
    'Confusion between Present Perfect ("have lived") vs Present Continuous ("am living")',
  ],
  overusedWords: ['very good', 'I think', 'nice', 'actually', 'a lot of'],
  preferredTopics: ['Work & Career', 'Technology & AI', 'Travel & Culture', 'Environment'],
  strengthsBengali: [
    'কথা বলার সময় জড়তা কম এবং আত্মবিশ্বাসী বাচনভঙ্গি।',
    'সহজ ও দৈনন্দিন বিষয়ে সাবলীলভাবে মনের ভাব প্রকাশ করতে পারেন।',
    'উচ্চারণ সাধারণভাবে বোধগম্য ও স্পষ্ট।',
  ],
  weaknessesBengali: [
    "'I think' এবং 'very good' শব্দ বারবার ব্যবহার করার প্রবণতা রয়েছে। বৈচিত্র্য আনতে 'In my view' বা 'exceptional' ব্যবহার করুন।",
    'Part 3-তে বিমূর্ত বা বিশ্লেষণাত্মক প্রশ্নে উত্তর তুলনামূলক সংক্ষিপ্ত হয়ে যায়; কারণ ও বাস্তব উদাহরণ যোগ করুন।',
    'Tense ব্যবহারে সতর্ক থাকুন (যেমন: অতীতকালের অভিজ্ঞতায় Past Simple ও বর্তমান সংযোগে Present Perfect)।',
  ],
  aiRecommendationBengali: 'পরবর্তী সেশনে Part 3-এর "Comparison & Future predictions" সংক্রান্ত প্রশ্নে ২-৩টি জটিল বাক্য (Complex sentences) এবং বাস্তব উদাহরণ দিয়ে উত্তর দীর্ঘায়িত করার অনুশীলন করুন।',
  totalPracticeMinutes: 35,
};

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function saveStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
}

export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

export function loadUserSessions(): PracticeSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return getDefaultSeedSessions();
    return JSON.parse(raw);
  } catch {
    return getDefaultSeedSessions();
  }
}

export function saveUserSession(session: PracticeSessionRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadUserSessions();
    list.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list.slice(0, 50)));
    updateMemoryFromSession(session);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function loadMemoryProfile(): UserMemoryProfile {
  if (typeof window === 'undefined') return DEFAULT_MEMORY_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY);
    if (!raw) return DEFAULT_MEMORY_PROFILE;
    return { ...DEFAULT_MEMORY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MEMORY_PROFILE;
  }
}

export function saveMemoryProfile(profile: UserMemoryProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save memory profile:', err);
  }
}

function updateMemoryFromSession(session: PracticeSessionRecord) {
  const profile = loadMemoryProfile();
  // Merge any new noted weaknesses
  if (session.notedWeaknesses && session.notedWeaknesses.length > 0) {
    const set = new Set([...profile.recurringWeaknesses, ...session.notedWeaknesses]);
    profile.recurringWeaknesses = Array.from(set).slice(0, 8);
  }
  saveMemoryProfile(profile);
}

/**
 * Returns initial realistic session history so the Progress screen looks informative immediately
 */
function getDefaultSeedSessions(): PracticeSessionRecord[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'seed-3',
      timestamp: now - 1 * dayMs,
      mode: 'ielts_practice',
      overallBand: 6.5,
      criteria: { fluency: 6.5, vocabulary: 6.5, grammar: 6.0, pronunciation: 7.0 },
      questionCount: 4,
      evaluations: [
        {
          question: 'Do you prefer living in a city or a rural area?',
          userAnswer: 'I definitely prefer living in a city because there are more opportunities and public transit is convenient.',
          band: 6.5,
          feedback: 'Clear response with good coherence. Try using cohesive devices like "On the flip side" to compare with countryside.',
          grammarHighlights: ['Tense agreement good', 'Opportunity phrasing natural'],
        },
      ],
      notedWeaknesses: ['Part 3 needs deeper illustration', 'Overusing "I think"'],
    },
    {
      id: 'seed-2',
      timestamp: now - 3 * dayMs,
      mode: 'free_talk',
      overallBand: 6.5,
      criteria: { fluency: 7.0, vocabulary: 6.0, grammar: 6.0, pronunciation: 6.5 },
      questionCount: 6,
      evaluations: [],
      notedWeaknesses: ['Frequent repetitions of filler words'],
    },
    {
      id: 'seed-1',
      timestamp: now - 7 * dayMs,
      mode: 'ielts_practice',
      overallBand: 6.0,
      criteria: { fluency: 6.0, vocabulary: 6.0, grammar: 5.5, pronunciation: 6.5 },
      questionCount: 5,
      evaluations: [],
      notedWeaknesses: ['Past tense errors when recounting past events'],
    },
  ];
}
