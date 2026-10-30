/**
 * IELTS Examiner Voice Synthesizer
 * Uses high-fidelity Web Speech API with authentic British English (en-GB) accents.
 * Provides 100% free, unlimited, zero-latency speech output with seamless fallback
 * if Gemini Cloud TTS quota (10 requests/day on Free Tier) is exhausted.
 */

export interface SpeechOptions {
  rate?: number; // 0.85 - 1.1 (default 0.94 for measured examiner pace)
  pitch?: number; // 0.9 - 1.1 (default 1.0)
  volume?: number; // 0 - 1.0 (default 1.0)
  isMuted?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SpeechSynthesizer {
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const available = window.speechSynthesis.getVoices();
    if (available && available.length > 0) {
      this.voices = available;
      this.selectedVoice = this.pickBestExaminerVoice(available);
      this.isInitialized = true;
    }
  }

  /**
   * Selects an authentic British IELTS examiner voice if available,
   * otherwise falls back to natural English voices.
   */
  private pickBestExaminerVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // 1. UK British voices preferred for standard IELTS examiner tone
    const britishVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().includes('en-gb') ||
        v.lang.toLowerCase().includes('en_gb') ||
        v.name.toLowerCase().includes('united kingdom') ||
        v.name.toLowerCase().includes('british') ||
        v.name.toLowerCase().includes('uk english')
    );

    // Prefer high-quality neural/Google/natural British voices
    const naturalBritish = britishVoices.find(
      (v) =>
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('oliver') ||
        v.name.toLowerCase().includes('george') ||
        v.name.toLowerCase().includes('hazel') ||
        v.name.toLowerCase().includes('serena')
    );

    if (naturalBritish) return naturalBritish;
    if (britishVoices.length > 0) return britishVoices[0];

    // 2. Fallback to any English voice (en-US, en-AU, en-CA, etc.)
    const anyEnglish = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    const naturalEnglish = anyEnglish.find(
      (v) =>
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('alex')
    );

    if (naturalEnglish) return naturalEnglish;
    if (anyEnglish.length > 0) return anyEnglish[0];

    // 3. Fallback to default system voice
    return voices[0] || null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized) {
      this.initVoices();
    }
    return this.voices;
  }

  public getSelectedVoiceName(): string {
    if (!this.selectedVoice) {
      this.initVoices();
    }
    return this.selectedVoice?.name || 'Default English Voice';
  }

  public stop(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    window.speechSynthesis.cancel();
    this.activeUtterance = null;
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  /**
   * Speaks the text aloud using browser Web Speech API with examiner cadence.
   */
  public speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        options.onEnd?.();
        resolve();
        return;
      }

      if (options.isMuted || !text || text.trim().length === 0) {
        options.onEnd?.();
        resolve();
        return;
      }

      // Stop any current utterance first to prevent queue deadlock in mobile Chrome
      this.stop();

      if (!this.selectedVoice) {
        this.initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.voice = this.selectedVoice;
      utterance.lang = this.selectedVoice?.lang || 'en-GB';
      utterance.rate = options.rate ?? 0.94; // Measured, articulate IELTS examiner rate
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      this.activeUtterance = utterance;

      utterance.onstart = () => {
        options.onStart?.();
        // Mobile Chrome keepalive fix for long utterances
        this.keepAliveInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
          } else {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 8000);
      };

      utterance.onend = () => {
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        this.activeUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval);
          this.keepAliveInterval = null;
        }
        this.activeUtterance = null;
        options.onEnd?.();
        options.onError?.(e);
        resolve();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        options.onEnd?.();
        resolve();
      }
    });
  }

  /**
   * Master speak function:
   * Uses native Web Speech API directly for instant, free, unlimited IELTS speech.
   * If Cloud TTS is requested and encounters 429 quota or network errors,
   * seamlessly falls back to the native British voice without breaking.
   */
  public async speakExaminer(
    text: string,
    options: SpeechOptions & { preferCloud?: boolean; apiKey?: string; playWavAudio?: (base64: string) => Promise<void> } = {}
  ): Promise<void> {
    if (options.isMuted || !text) {
      options.onEnd?.();
      return;
    }

    // Default is native browser voice (free, unlimited, 0 lag, British IELTS accent)
    if (!options.preferCloud || !options.apiKey) {
      return this.speak(text, options);
    }

    // If cloud TTS is requested, attempt it with graceful fallback
    try {
      options.onStart?.();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': options.apiKey,
        },
        body: JSON.stringify({ text, voiceName: 'Zephyr' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.quotaExceeded || data.fallbackToBrowser || !data.audio) {
          // Cloud quota reached or fallback requested — seamlessly switch to browser speech
          return this.speak(text, options);
        }

        if (data.audio && options.playWavAudio) {
          await options.playWavAudio(data.audio);
          options.onEnd?.();
          return;
        }
      }

      // If non-200 or no audio, fallback to browser native speech
      return this.speak(text, options);
    } catch {
      // Network or API failure — fallback to browser speech
      return this.speak(text, options);
    }
  }
}

export const speechSynthesizer = new SpeechSynthesizer();
