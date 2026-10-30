import React from 'react';
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { PracticeSessionRecord, UserMemoryProfile } from '../utils/sessionMemory';
import { formatBand, getBandDescriptorTitle } from '../utils/ieltsScoring';

interface ProgressScreenProps {
  sessions: PracticeSessionRecord[];
  memoryProfile: UserMemoryProfile;
  onBack: () => void;
  onStartPractice: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  sessions,
  memoryProfile,
  onBack,
  onStartPractice,
}) => {
  // Compute band history stats
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const todaySessions = sessions.filter((s) => now - s.timestamp <= dayMs);
  const lastWeekSessions = sessions.filter((s) => now - s.timestamp <= weekMs);

  const currentOverallBand = sessions.length > 0 ? sessions[0].overallBand : 6.5;

  const todayAvgBand =
    todaySessions.length > 0
      ? todaySessions.reduce((acc, s) => acc + s.overallBand, 0) / todaySessions.length
      : currentOverallBand;

  const lastWeekAvgBand =
    lastWeekSessions.length > 0
      ? lastWeekSessions.reduce((acc, s) => acc + s.overallBand, 0) / lastWeekSessions.length
      : 6.0;

  // Compute skill averages from last 5 sessions
  const recentSessions = sessions.slice(0, 5);
  const avgSkills = recentSessions.reduce(
    (acc, s) => ({
      fluency: acc.fluency + (s.criteria?.fluency || 6.5),
      vocabulary: acc.vocabulary + (s.criteria?.vocabulary || 6.5),
      grammar: acc.grammar + (s.criteria?.grammar || 6.0),
      pronunciation: acc.pronunciation + (s.criteria?.pronunciation || 6.5),
    }),
    { fluency: 0, vocabulary: 0, grammar: 0, pronunciation: 0 }
  );

  const count = Math.max(1, recentSessions.length);
  const fluencyScore = avgSkills.fluency / count;
  const vocabScore = avgSkills.vocabulary / count;
  const grammarScore = avgSkills.grammar / count;
  const pronScore = avgSkills.pronunciation / count;

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-20 text-left select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Speaking Analytics & Band
        </h2>
        <div className="w-8" />
      </div>

      {/* Band History Summary (Today, Last Week, Current, Target 7.0) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Band Score History</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
            <Target className="w-3.5 h-3.5" />
            <span>Target: 7.0</span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Today</span>
            <span className="text-base font-black text-white">{formatBand(todayAvgBand)}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Last Wk</span>
            <span className="text-base font-black text-zinc-300">{formatBand(lastWeekAvgBand)}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Current</span>
            <span className="text-base font-black text-amber-400">{formatBand(currentOverallBand)}</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Target</span>
            <span className="text-base font-black text-emerald-400">7.0</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300 flex items-center justify-between">
          <span className="text-zinc-400">Current Level Classification:</span>
          <span className="font-semibold text-amber-300">{getBandDescriptorTitle(currentOverallBand)}</span>
        </div>
      </div>

      {/* Per-Skill Performance (Fluency, Vocabulary, Grammar, Pronunciation) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Per-Skill Performance</h3>
        </div>

        <div className="space-y-3 text-xs">
          {/* Fluency & Coherence */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300 font-medium">Fluency & Coherence</span>
              <span className="text-amber-400 font-bold">{formatBand(fluencyScore)} / 9.0</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${(fluencyScore / 9) * 100}%` }}
              />
            </div>
          </div>

          {/* Lexical Resource */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300 font-medium">Lexical Resource (Vocabulary)</span>
              <span className="text-amber-400 font-bold">{formatBand(vocabScore)} / 9.0</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${(vocabScore / 9) * 100}%` }}
              />
            </div>
          </div>

          {/* Grammatical Range & Accuracy */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300 font-medium">Grammatical Range & Accuracy</span>
              <span className="text-amber-400 font-bold">{formatBand(grammarScore)} / 9.0</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${(grammarScore / 9) * 100}%` }}
              />
            </div>
          </div>

          {/* Pronunciation */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-300 font-medium">Pronunciation</span>
              <span className="text-amber-400 font-bold">{formatBand(pronScore)} / 9.0</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${(pronScore / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Written in Simple Bengali */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4 font-['Noto_Sans_Bengali',sans-serif]">
        <div className="flex items-center gap-2 font-sans">
          <Award className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            সবল দিক ও দুর্বল দিক (In Bengali)
          </h3>
        </div>

        {/* Strengths */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-sans">
            <CheckCircle2 className="w-4 h-4" />
            <span>সবল দিক (Strengths)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {memoryProfile.strengthsBengali.map((str, idx) => (
              <li
                key={idx}
                className="p-3 rounded-2xl bg-zinc-950/60 border border-emerald-950/30 flex items-start gap-2 leading-relaxed"
              >
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase font-sans">
            <AlertCircle className="w-4 h-4" />
            <span>উন্নতির জায়গা (Weaknesses to Fix)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {memoryProfile.weaknessesBengali.map((weak, idx) => (
              <li
                key={idx}
                className="p-3 rounded-2xl bg-zinc-950/60 border border-rose-950/30 flex items-start gap-2 leading-relaxed"
              >
                <span className="text-rose-400 font-bold mt-0.5">•</span>
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Recommendation for Next Practice Focus */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-400 tracking-tight">
            AI Recommendation for Next Practice
          </h3>
        </div>
        <p className="text-xs text-zinc-200 font-['Noto_Sans_Bengali',sans-serif] leading-relaxed">
          {memoryProfile.aiRecommendationBengali}
        </p>

        <button
          onClick={onStartPractice}
          className="mt-3 w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <span>Start Practice Based on Recommendation</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Session History */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Recent Sessions ({sessions.length})
        </h4>

        <div className="space-y-2">
          {sessions.slice(0, 5).map((sess) => (
            <div
              key={sess.id}
              className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white capitalize">
                    {sess.mode.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {new Date(sess.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-extrabold text-amber-400 text-sm">
                  Band {formatBand(sess.overallBand)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {sess.questionCount || 1} questions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
