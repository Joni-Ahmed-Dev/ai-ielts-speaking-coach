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

const STORAGE_KEYS = {
  SESSIONS: 'ielts_coach_sessions_v1',
  MEMORY: 'ielts_coach_memory_v2',
  API_KEY: 'ielts_coach_api_key_v1',
};

export const DEFAULT_MEMORY_PROFILE: UserMemoryProfile = {
  targetBand: 7.0,
  recurringWeaknesses: [],
  overusedWords: [],
  preferredTopics: [],
  strengthsBengali: [],
  weaknessesBengali: [],
  aiRecommendationBengali: '',
  totalPracticeMinutes: 0,
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
    // drop old fake demo sessions saved by earlier versions
    return (JSON.parse(raw) as PracticeSessionRecord[]).filter((s) => !String(s.id).startsWith('seed-'));
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
  return [];
}
