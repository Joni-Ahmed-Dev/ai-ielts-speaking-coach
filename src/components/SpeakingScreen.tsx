import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  FileText,
  Keyboard,
  Send,
  HelpCircle,
} from 'lucide-react';
import { Part2CueCard } from '../data/ieltsTopics';

interface SpeakingScreenProps {
  mode: 'ielts_practice' | 'free_talk' | 'mock_test';
  currentPart: 'part1' | 'part2' | 'part3' | 'free_talk';
  currentQuestion: string;
  cueCard?: Part2CueCard | null;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isExaminerSpeaking: boolean;
  isEvaluating: boolean;
  volumeRms: number;
  silenceSeconds: number; // 0 to 2.0
  onToggleMic: () => void;
  onFinishAnswer: () => void;
  onRepeatQuestion: () => void;
  onEndSession: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSubmitTextAnswer?: (text: string) => void;
}

export const SpeakingScreen: React.FC<SpeakingScreenProps> = ({
  mode,
  currentPart,
  currentQuestion,
  cueCard,
  interimTranscript,
  finalTranscript,
  isListening,
  isExaminerSpeaking,
  isEvaluating,
  volumeRms,
  silenceSeconds,
  onToggleMic,
  onFinishAnswer,
  onRepeatQuestion,
  onEndSession,
  isMuted,
  onToggleMute,
  onSubmitTextAnswer,
}) => {
  // Part 2 Prep Countdown (60 seconds) & Speaking Timer (120 seconds)
  const [part2Phase, setPart2Phase] = useState<'prep' | 'speaking' | 'none'>('none');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [speakSecondsLeft, setSpeakSecondsLeft] = useState(120);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [manualText, setManualText] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Setup Part 2 timer
  useEffect(() => {
    if (currentPart === 'part2' && cueCard) {
      setPart2Phase('prep');
      setPrepSecondsLeft(60);
      setSpeakSecondsLeft(120);
    } else {
      setPart2Phase('none');
    }
  }, [currentPart, cueCard]);

  // Handle prep timer countdown
  useEffect(() => {
    if (part2Phase !== 'prep') return;
    if (prepSecondsLeft <= 0) {
      setPart2Phase('speaking');
      return;
    }
    const timer = setInterval(() => {
      setPrepSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [part2Phase, prepSecondsLeft]);

  // Handle speaking timer countdown
  useEffect(() => {
    if (part2Phase !== 'speaking') return;
    if (speakSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSpeakSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [part2Phase, speakSecondsLeft]);

  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [interimTranscript, finalTranscript]);

  const getPartLabel = () => {
    if (mode === 'free_talk') return 'Free Talk Session';
    switch (currentPart) {
      case 'part1':
        return 'Part 1: Introduction & Everyday Topics';
      case 'part2':
        return 'Part 2: Individual Long Turn (Cue Card)';
      case 'part3':
        return 'Part 3: Discussion & In-depth Analysis';
      default:
        return 'IELTS Speaking';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    onSubmitTextAnswer?.(manualText.trim());
    setManualText('');
    setShowTextFallback(false);
  };

  const combinedTranscript = (finalTranscript + ' ' + interimTranscript).trim();

  return (
    <div className="relative min-h-[calc(100vh-60px)] flex flex-col justify-between max-w-md mx-auto px-4 py-3 select-none">
      {/* Top Section: Navigation & Question Header */}
      <div className="space-y-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onEndSession}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Finish</span>
          </button>

          <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400">
            {getPartLabel()}
          </span>

          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-xl border transition ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title={isMuted ? 'Muted' : 'Unmuted'}
            aria-label={isMuted ? 'Muted' : 'Unmuted'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Part 2 Cue Card Card (Only if in Part 2) */}
        {currentPart === 'part2' && cueCard && (
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 shadow-lg space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white tracking-tight">{cueCard.title}</h4>
              </div>
              {part2Phase === 'prep' && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Prep: {prepSecondsLeft}s</span>
                </div>
              )}
              {part2Phase === 'speaking' && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.floor(speakSecondsLeft / 60)}:{(speakSecondsLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-300 font-medium italic">{cueCard.prompt}</p>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider">You should say:</p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-200">
                {cueCard.bulletPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>

            {part2Phase === 'prep' && (
              <div className="space-y-2">
                <textarea
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  placeholder="Digital scratchpad: Jot down keywords & ideas here during 60s prep..."
                  className="w-full h-16 p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
                <button
                  onClick={() => setPart2Phase('speaking')}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
                >
                  I'm ready, start speaking now ({prepSecondsLeft}s remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Current Question Card (Small, clean at top as requested) */}
        {currentPart !== 'part2' && (
          <div className="relative p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-sm text-center">
            <p className="text-xs font-medium text-amber-400 mb-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Examiner's Question</span>
            </p>
            <h3 className="text-sm font-semibold text-white leading-relaxed font-sans">
              "{currentQuestion || 'Please introduce yourself and where you live.'}"
            </h3>
            <button
              onClick={onRepeatQuestion}
              className="mt-2 text-[11px] text-zinc-400 hover:text-amber-400 transition inline-flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              <span>Hear question again</span>
            </button>
          </div>
        )}

        {/* Live Transcript Area (Interim text fading into solid text above the mic) */}
        <div
          ref={transcriptScrollRef}
          className="h-28 overflow-y-auto p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/70 text-left scrollbar-none transition-all flex flex-col justify-end"
        >
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
            <span>Your Live Transcript</span>
            {isListening && (
              <span className="flex items-center gap-1 text-emerald-400 lowercase font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                streaming
              </span>
            )}
          </div>

          <div className="text-xs leading-relaxed font-sans min-h-[3rem]">
            {combinedTranscript ? (
              <>
                <span className="text-zinc-100 font-medium">{finalTranscript}</span>{' '}
                <span className="text-amber-300/80 italic animate-pulse">{interimTranscript}</span>
              </>
            ) : isListening ? (
              <span className="text-zinc-400 italic">Listening... Start speaking your answer naturally.</span>
            ) : isExaminerSpeaking ? (
              <span className="text-amber-400/90 italic flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                Examiner is speaking...
              </span>
            ) : (
              <span className="text-zinc-400">Tap microphone or start speaking when ready.</span>
            )}
          </div>
        </div>

        {/* 2-Second Silence Progress Bar (Visual feedback for The Golden Rule) */}
        {isListening && silenceSeconds > 0.4 && (
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Silence detected:</span>
              <span className="font-mono text-amber-400 font-semibold">{silenceSeconds.toFixed(1)}s / 2.0s</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-150 rounded-full"
                style={{ width: `${Math.min(100, (silenceSeconds / 2.0) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Center & Bottom Section: Big Center Microphone + "I'm done" Thumb Button */}
      <div className="space-y-4 pt-4 pb-2 flex flex-col items-center">
        {/* Examiner Audio Wave Indicator */}
        {isExaminerSpeaking && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Examiner is speaking...</span>
          </div>
        )}

        {/* Big Center Microphone Button */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing rings when listening */}
          {isListening && (
            <>
              <div
                className="absolute w-36 h-36 rounded-full bg-amber-500/10 animate-ping duration-1000 pointer-events-none"
                style={{
                  transform: `scale(${1 + Math.min(0.6, volumeRms * 4)})`,
                }}
              />
              <div
                className="absolute w-28 h-28 rounded-full bg-amber-500/20 pointer-events-none transition-transform duration-75"
                style={{
                  transform: `scale(${1 + Math.min(0.4, volumeRms * 3)})`,
                }}
              />
            </>
          )}

          <button
            onClick={onToggleMic}
            disabled={isEvaluating}
            className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 focus:outline-none ${
              isListening
                ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-black shadow-amber-500/30 ring-4 ring-amber-400/40'
                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-2 border-zinc-700 shadow-black/60'
            }`}
            aria-label={isListening ? 'Mute or pause microphone' : 'Start speaking'}
          >
            {isListening ? (
              <Mic className="w-9 h-9 animate-pulse" />
            ) : (
              <MicOff className="w-8 h-8 text-zinc-400" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
              {isListening ? 'Listening' : 'Tap to talk'}
            </span>
          </button>
        </div>

        {/* The Golden Rule: "I'm done" Thumb Button */}
        <div className="w-full flex flex-col items-center gap-2">
          <button
            onClick={onFinishAnswer}
            disabled={isEvaluating || (!combinedTranscript && !isListening)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-black font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5 font-bold" />
            <span>I'm Done (Analyze Answer)</span>
          </button>

          <p className="text-[11px] text-zinc-400 text-center leading-tight">
            Golden rule: Examiner will <strong className="text-zinc-200">never interrupt you</strong>. Tap "I'm done" or pause for 2s.
          </p>
        </div>

        {/* Keyboard Text Fallback Toggle (Quiet environment or manual input) */}
        <div className="w-full pt-1">
          {!showTextFallback ? (
            <button
              onClick={() => setShowTextFallback(true)}
              className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-300 py-1 flex items-center justify-center gap-1 transition"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>In a quiet room? Type answer instead</span>
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-2 w-full animate-fadeIn">
              <div className="relative">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type your answer in English..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="absolute right-2 top-2 p-1 text-amber-400 disabled:text-zinc-600 hover:text-amber-300 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowTextFallback(false)}
                className="text-[10px] text-zinc-400 hover:text-zinc-300 block mx-auto"
              >
                Cancel typing
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
