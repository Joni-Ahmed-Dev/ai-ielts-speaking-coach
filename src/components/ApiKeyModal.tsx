import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, ShieldCheck, Check, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { getStoredApiKey, saveStoredApiKey, removeStoredApiKey } from '../utils/sessionMemory';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
  canDismiss?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  canDismiss = true,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputKey(getStoredApiKey());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    // New Google keys start with "AQ.", old ones with "AIza" - so we do not check the prefix.
    if (trimmed.length < 20 || /\s/.test(trimmed)) {
      setStatusMessage({
        type: 'error',
        text: 'This does not look like a complete API key. Please copy the whole key from Google AI Studio (no spaces).',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Verifying API key with Google AI Studio...' });

    try {
      const res = await fetch('/api/key-status', {
        headers: { 'x-gemini-api-key': trimmed },
      });

      const check = res.ok ? await res.json().catch(() => ({})) : {};
      if (check.valid === false) {
        setStatusMessage({ type: 'error', text: 'Google rejected this key. Please create a new key in Google AI Studio and paste it again.' });
        return;
      }
      if (res.ok) {
        saveStoredApiKey(trimmed);
        setStatusMessage({
          type: 'success',
          text: check.valid === true ? 'API Key saved and verified successfully!' : 'API Key saved (could not verify it right now).',
        });
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
          <label className="text-xs font-medium text-zinc-300 block">
            Google AI Studio API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AQ.Ab... (paste your key)"
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
