import React, { useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AnswerEvaluation, formatBand, getBandDescriptorTitle } from '../utils/ieltsScoring';

interface CoachCardProps {
  evaluation: AnswerEvaluation | null;
  isLoading: boolean;
  onNextQuestion: () => void;
  onDismiss?: () => void;
  partName?: string;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  evaluation,
  isLoading,
  onNextQuestion,
  onDismiss,
  partName = 'Part 1',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // When a new evaluation arrives, reset expanded state to collapsed so the user sees the crisp 1-sentence card first
  useEffect(() => {
    if (evaluation) {
      setIsExpanded(false);
    }
  }, [evaluation]);

  if (!evaluation && !isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ease-out flex justify-center pointer-events-none ${
        isExpanded ? 'h-[85vh]' : 'h-auto'
      }`}
    >
      <div
        className={`w-full max-w-md bg-zinc-900/95 border-t border-zinc-700/80 backdrop-blur-2xl text-zinc-100 rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto transition-all ${
          isExpanded ? 'h-full' : 'max-h-56'
        }`}
      >
        {/* Swipe / Drag Indicator Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="pt-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer select-none group"
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse coach card' : 'Expand full feedback'}
        >
          <div className="w-12 h-1.5 bg-zinc-600 rounded-full group-hover:bg-amber-400 transition" />
        </div>

        {/* Loading State */}
        {isLoading && !evaluation && (
          <div className="p-6 flex items-center justify-center space-x-3 text-zinc-400">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm font-medium">Examiner analyzing your answer...</span>
          </div>
        )}

        {/* Collapsed View (The Golden 1-Sentence Card) */}
        {evaluation && !isExpanded && (
          <div className="px-5 pt-1 pb-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-400 font-extrabold text-sm tracking-wide shadow-sm">
                  Band {formatBand(evaluation.estimatedBand)}
                </span>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {partName}
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition"
              >
                <span>Full Feedback</span>
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* The single crisp feedback sentence */}
            <p className="text-sm text-zinc-200 font-normal leading-snug line-clamp-2">
              "{evaluation.oneSentenceFeedback}"
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700/60 transition flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Bengali Grammar & Tips</span>
              </button>
              <button
                onClick={onNextQuestion}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Expanded View (Comprehensive IELTS Analysis & Bengali Grammar Explanations) */}
        {evaluation && isExpanded && (
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  Band {formatBand(evaluation.estimatedBand)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {getBandDescriptorTitle(evaluation.estimatedBand)}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {evaluation.disclaimer || 'Estimated band based on official IELTS speaking rubric.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
                aria-label="Collapse view"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Criteria Scores */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Fluency & Coherence</span>
                  <span className="font-bold text-amber-400">{formatBand(evaluation.criteria.fluency)}</span>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.criteria.fluency / 9) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Lexical Resource</span>
                  <span className="font-bold text-amber-400">{formatBand(evaluation.criteria.vocabulary)}</span>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.criteria.vocabulary / 9) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Grammar & Accuracy</span>
                  <span className="font-bold text-amber-400">{formatBand(evaluation.criteria.grammar)}</span>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.criteria.grammar / 9) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-800">
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Pronunciation</span>
                  <span className="font-bold text-amber-400">{formatBand(evaluation.criteria.pronunciation)}</span>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(evaluation.criteria.pronunciation / 9) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grammar Points with Bengali Explanations (THE REQUIRED FORMAT) */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Grammar Corrections & বাংলা ব্যাখ্যা</span>
              </div>

              {evaluation.grammarCorrections && evaluation.grammarCorrections.length > 0 ? (
                <div className="space-y-3">
                  {evaluation.grammarCorrections.map((corr, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 space-y-2 text-xs"
                    >
                      <div className="text-rose-300 flex items-start gap-1.5">
                        <span className="text-rose-400 font-semibold shrink-0">You said:</span>
                        <span className="italic line-through decoration-rose-400/60 font-sans">
                          "{corr.original}"
                        </span>
                      </div>
                      <div className="text-emerald-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 font-semibold shrink-0">Better:</span>
                        <span className="font-semibold font-sans">"{corr.improved}"</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 leading-relaxed font-['Noto_Sans_Bengali',sans-serif] text-[13px]">
                        <span className="text-amber-400 font-semibold block mb-0.5 text-xs">
                          বাংলায় ব্যাখ্যা:
                        </span>
                        {corr.explanationBengali}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No major grammatical errors observed in this answer. Excellent control!</span>
                </div>
              )}
            </div>

            {/* Better Vocabulary Suggestions */}
            {evaluation.vocabularySuggestions && evaluation.vocabularySuggestions.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>High-Band Vocabulary Alternatives</span>
                </div>
                <div className="space-y-2">
                  {evaluation.vocabularySuggestions.map((vocab, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-800 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 line-through">"{vocab.used}"</span>
                        <span className="text-amber-300 font-bold">→ "{vocab.suggested}"</span>
                      </div>
                      {vocab.bengaliMeaning && (
                        <div className="text-[12px] text-zinc-400 font-['Noto_Sans_Bengali',sans-serif]">
                          অর্থ: <span className="text-zinc-200">{vocab.bengaliMeaning}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-zinc-400 italic">Context: {vocab.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Develop the Answer */}
            {evaluation.howToDevelop && evaluation.howToDevelop.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" />
                  <span>How to Develop This Answer</span>
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {evaluation.howToDevelop.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-800/60">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pauses & Repetitions */}
            {evaluation.pausesAndRepetitions && evaluation.pausesAndRepetitions.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 text-xs space-y-1">
                <div className="text-zinc-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pauses & Repetitions Observed</span>
                </div>
                <ul className="list-disc list-inside text-zinc-300 space-y-0.5">
                  {evaluation.pausesAndRepetitions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Floating Action Bar */}
            <div className="pt-2 sticky bottom-0 bg-zinc-900/90 backdrop-blur-md pb-2">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onNextQuestion();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
              >
                <span>Continue to Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
