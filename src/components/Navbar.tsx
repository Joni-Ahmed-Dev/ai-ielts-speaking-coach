import React from 'react';
import { Mic2, TrendingUp, Settings, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'speaking' | 'progress';
  onNavigate: (view: 'home' | 'progress') => void;
  onOpenSettings: () => void;
  onOpenInstall?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  hasCustomKey?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenInstall,
  isMuted,
  onToggleMute,
  hasCustomKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80 px-4 py-3 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:scale-105 transition">
            <Mic2 className="w-4 h-4 text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white font-sans">
                IELTS Coach
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-none">Speaking Examiner AI</p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Target band indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Target: <strong className="text-amber-400">7.0</strong></span>
          </div>

          {/* Install / APK button */}
          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
              title="Install Android App / APK"
              aria-label="Install Android App / APK"
            >
              <span>APK</span>
            </button>
          )}

          {/* Mute Toggle if speaking */}
          {currentView === 'speaking' && onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Progress Link */}
          <button
            onClick={() => onNavigate('progress')}
            className={`p-2 rounded-xl border transition ${
              currentView === 'progress'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="View Band Progress & History"
            aria-label="View Band Progress & History"
          >
            <TrendingUp className="w-4 h-4" />
          </button>

          {/* Settings / API Key */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl border transition relative ${
              hasCustomKey
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
            }`}
            title="Settings & Gemini API Key"
            aria-label="Settings & Gemini API Key"
          >
            <Settings className="w-4 h-4" />
            {!hasCustomKey && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
