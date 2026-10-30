import React from 'react';
import {
  GraduationCap,
  MessagesSquare,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserMemoryProfile } from '../utils/sessionMemory';
import { formatBand } from '../utils/ieltsScoring';

interface HomeScreenProps {
  onStartIeltsPractice: () => void;
  onStartFreeTalk: () => void;
  onStartMockTest: () => void;
  onViewProgress: () => void;
  onOpenInstall?: () => void;
  currentBand: number;
  memoryProfile: UserMemoryProfile;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartIeltsPractice,
  onStartFreeTalk,
  onStartMockTest,
  onViewProgress,
  onOpenInstall,
  currentBand,
  memoryProfile,
}) => {
  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-16 text-left select-none animate-fadeIn">
      {/* Target & Band Status Banner */}
      <div className="relative p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal AI Examiner</span>
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              AI IELTS Speaking Coach
            </h2>
            <p className="text-xs text-zinc-400 max-w-[240px]">
              Strict non-interruption turn taking & Bengali grammar explanations
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Current</span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {currentBand > 0 ? formatBand(currentBand) : '—'}
            </span>
            <span className="text-[10px] text-zinc-400">Target 7.0</span>
          </div>
        </div>

        {/* AI Focus Recommendation */}
        {memoryProfile.aiRecommendationBengali && (
          <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-start gap-2.5">
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-zinc-300 font-['Noto_Sans_Bengali',sans-serif] leading-relaxed">
              <strong className="text-amber-400 font-semibold block mb-0.5 text-[11px]">
                আজকের পরামর্শ (Focus):
              </strong>
              {memoryProfile.aiRecommendationBengali}
            </p>
          </div>
        )}
      </div>

      {/* Two Big Primary Choices (As explicitly requested in Screen 1) */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Choose Practice Mode
        </h3>

        {/* Choice 1: IELTS Practice */}
        <button
          onClick={onStartIeltsPractice}
          className="w-full text-left p-5 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-850 hover:from-zinc-850 hover:to-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 shadow-lg active:scale-98 transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Exam Standard
            </span>
          </div>

          <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition">
            IELTS Practice
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Authentic Part 1, Part 2 (60s prep cue card), and Part 3 abstract discussion.
            Adaptive examiner follow-ups based on what you actually say.
          </p>

          <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition gap-1">
            <span>Start Practice Session</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Choice 2: Free Talk */}
        <button
          onClick={onStartFreeTalk}
          className="w-full text-left p-5 rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-850 hover:from-zinc-850 hover:to-zinc-800 border border-zinc-700/80 hover:border-emerald-500/50 shadow-lg active:scale-98 transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition">
              <MessagesSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Casual & Fluent
            </span>
          </div>

          <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition">
            Free Talk
          </h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Chat like a friend about travel, technology, life, and hobbies. Quietly observes your
            grammar in the background without breaking your conversational rhythm.
          </p>

          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition gap-1">
            <span>Start Free Talk</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Bonus Mock Test Card & Progress Entry */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Mock Test */}
        <button
          onClick={onStartMockTest}
          className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-left transition flex flex-col justify-between space-y-3 group"
        >
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
              Full Mock Test
            </h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              15 min exam with official rubric & final scorecard
            </p>
          </div>
        </button>

        {/* Progress Entry */}
        <button
          onClick={onViewProgress}
          className="p-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-left transition flex flex-col justify-between space-y-3 group"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
              Band Progress
            </h5>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Band history, 4 skills & Bengali strengths review
            </p>
          </div>
        </button>
      </div>

      {/* Android App & APK Installation Banner */}
      {onOpenInstall && (
        <button
          onClick={onOpenInstall}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 hover:border-emerald-500/50 text-left transition flex items-center justify-between group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Android App & APK
                </h5>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Mobile Install
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                মোবাইলে নেটিভ অ্যাপের মতো ১-ক্লিকে ইনস্টল বা APK ডাউনলোড করুন
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition shrink-0" />
        </button>
      )}

      {/* Trust & Methodology Footer */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-900 text-[11px] text-zinc-400 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          The Golden Rule active: Examiner never interrupts mid-sentence. Listens until you tap
          "I'm done" or pause 2s.
        </span>
      </div>
    </div>
  );
};
