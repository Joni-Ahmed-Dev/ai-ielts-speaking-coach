import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, ShieldCheck, Check, AlertCircle, Eye, EyeOff, Sparkles, BellOff, Mic } from 'lucide-react';
import {
  getStoredApiKey,
  saveStoredApiKey,
  removeStoredApiKey,
  getStoredMicMode,
  saveStoredMicMode,
  MicMode,
} from '../utils/sessionMemory';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  canDismiss?: boolean;
  micMode?: MicMode;
  onMicModeChange?: (mode: MicMode) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  canDismiss = true,
  micMode,
  onMicModeChange,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedMicMode, setSelectedMicMode] = useState<MicMode>(micMode || getStoredMicMode());
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputKey(getStoredApiKey());
      setSelectedMicMode(micMode || getStoredMicMode());
      setStatusMessage(null);
    }
  }, [isOpen, micMode]);

  const handleMicModeSelect = (mode: MicMode) => {
    setSelectedMicMode(mode);
    saveStoredMicMode(mode);
    onMicModeChange?.(mode);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    if (trimmed.length < 15) {
      setStatusMessage({
        type: 'error',
        text: 'The API key appears too short. Please copy your full Google AI Studio API key (starting with AQ... or AIza...).',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Verifying API key with Google AI Studio...' });

    try {
      const res = await fetch('/api/key-status', {
        headers: { 'x-gemini-api-key': trimmed },
      });

      if (res.ok) {
        saveStoredApiKey(trimmed);
        setStatusMessage({ type: 'success', text: 'API Key saved and verified successfully!' });
        setTimeout(() => {
          onKeySaved(trimmed);
          onClose();
        }, 600);
      } else {
        saveStoredApiKey(trimmed);
        onKeySaved(trimmed);
        onClose();
      }
    } catch {
      saveStoredApiKey(trimmed);
      onKeySaved(trimmed);
      onClose();
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    removeStoredApiKey();
    setInputKey('');
    setStatusMessage({ type: 'info', text: 'API key removed from local storage.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-100 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">Gemini API Key</h3>
              <p className="text-xs text-zinc-400">Required for real-time speech and IELTS coaching</p>
            </div>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 space-y-2 text-xs text-zinc-300 leading-relaxed">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Private & Local</span>
          </div>
          <p>
            Your key is saved only in your device's <code>localStorage</code>. It is never logged or stored on any external database.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline pt-1 font-medium"
          >
            <span>Get your free Gemini API key from Google AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300 block">
              Google AI Studio API Key
            </label>
            <span className="text-[10px] text-zinc-400 font-mono">Supports AQ... & AIza...</span>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AQ... or AIza..."
              className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 transition"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Paste your Google AI Studio key (modern Authentication keys starting with <strong>AQ</strong> are fully supported).
          </p>
        </div>

        {/* Microphone Sound & Chime Control Section */}
        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-200">মাইক্রোফোন সাউন্ড নিয়ন্ত্রণ (Mic Sound)</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wide">
              {selectedMicMode === 'silent' ? 'টুং টুং বন্ধ' : 'লাইভ টেক্সট'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleMicModeSelect('silent')}
              className={`p-2.5 rounded-xl border text-left transition ${
                selectedMicMode === 'silent'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <BellOff className="w-3.5 h-3.5 text-amber-400" />
                <span>নিঃশব্দ মোড (প্রস্তাবিত)</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                কোনো টুং টুং বা বিপ শব্দ হবে না। সম্পূর্ণ নিরবচ্ছিন্ন ভয়েস রেকর্ডিং।
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleMicModeSelect('speech_recognition')}
              className={`p-2.5 rounded-xl border text-left transition ${
                selectedMicMode === 'speech_recognition'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>ওয়েব স্পিচ (STT)</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                ব্রাউজারে সরাসরি টেক্সট ভেসে উঠবে (ব্রাউজার সিস্টেম সাউন্ড থাকতে পারে)।
              </p>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'error'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                : statusMessage.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 gap-2">
          {inputKey && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-zinc-400 hover:text-rose-400 py-2 px-3 transition"
            >
              Clear key
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {canDismiss && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isTesting || !inputKey.trim()}
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              {isTesting ? (
                <>Verifying...</>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
