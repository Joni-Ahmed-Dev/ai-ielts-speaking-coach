import React from 'react';
import { Award, CheckCircle2, ChevronRight, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import { PracticeSessionRecord } from '../utils/sessionMemory';
import { formatBand, getBandDescriptorTitle } from '../utils/ieltsScoring';

interface MockTestSummaryModalProps {
  session: PracticeSessionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onViewProgress: () => void;
}

export const MockTestSummaryModal: React.FC<MockTestSummaryModalProps> = ({
  session,
  isOpen,
  onClose,
  onViewProgress,
}) => {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 flex flex-col space-y-5 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">IELTS Mock Test Complete</h3>
          <p className="text-xs text-zinc-400">Official Cambridge/British Council format assessment</p>
        </div>

        {/* Hero Band Score */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/30 text-center space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
            Overall Estimated Band
          </span>
          <div className="text-4xl font-black text-amber-400 tracking-tight">
            Band {formatBand(session.overallBand)}
          </div>
          <div className="text-xs font-semibold text-zinc-200">
            {getBandDescriptorTitle(session.overallBand)}
          </div>
          <p className="text-[10px] text-zinc-400 pt-1">
            Official IELTS 9-band scale rounding rule applied (.25 & .75 ceiling rounding).
          </p>
        </div>

        {/* 4 Criteria breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5">Fluency & Coherence</span>
            <span className="text-base font-extrabold text-amber-400">{formatBand(session.criteria.fluency)}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5">Lexical Resource</span>
            <span className="text-base font-extrabold text-amber-400">{formatBand(session.criteria.vocabulary)}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5">Grammar & Accuracy</span>
            <span className="text-base font-extrabold text-amber-400">{formatBand(session.criteria.grammar)}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5">Pronunciation</span>
            <span className="text-base font-extrabold text-amber-400">{formatBand(session.criteria.pronunciation)}</span>
          </div>
        </div>

        {/* Questions evaluated in this test */}
        {session.evaluations && session.evaluations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Questions Answered ({session.evaluations.length})</span>
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
              {session.evaluations.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white">
                    <span className="truncate max-w-[200px]">{ev.question}</span>
                    <span className="text-amber-400 font-bold shrink-0">Band {formatBand(ev.band)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic line-clamp-2">"{ev.feedback}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onViewProgress();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <TrendingUp className="w-4 h-4" />
            <span>View Detailed Analytics & Bengali Rules</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
