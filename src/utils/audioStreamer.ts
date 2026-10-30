/**
 * Audio streaming, PCM conversion, Web Audio playback, and Speech Recognition
 */

import { SilenceTracker } from './silenceDetector';

export interface AudioStreamerCallbacks {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onVolumeChange?: (rms: number) => void;
  onSilenceDetected?: () => void;
  onError?: (err: string) => void;
  onAudioChunk?: (base64Pcm: string) => void;
}

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isMuted: boolean = false;
  private isRecording: boolean = false;

  private silenceTracker: SilenceTracker;
  private callbacks: AudioStreamerCallbacks;

  // Speech Recognition fallback
  private recognition: any = null;
  private isRecognizing: boolean = false;

  // Playback queue for 24kHz PCM from Live API
  private nextPlayTime: number = 0;
  private audioQueue: AudioBufferSourceNode[] = [];

  constructor(callbacks: AudioStreamerCallbacks = {}) {
    this.callbacks = callbacks;
    this.silenceTracker = new SilenceTracker({
      silenceThresholdRms: 0.015,
      silenceDurationMs: 2000, // 2s strict silence requirement
      minSpeechDurationMs: 800,
    });
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.silenceTracker.reset();
      this.isRecording = true;

      // Create 16kHz context for Live API input capture
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      // Buffer size 4096 gives ~256ms frames at 16kHz
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const rms = SilenceTracker.calculateRms(inputData);
        this.callbacks.onVolumeChange?.(rms);

        // Run 2-second silence detector
        const now = Date.now();
        const res = this.silenceTracker.processVolume(rms, now);

        if (res.hasCompleted) {
          this.callbacks.onSilenceDetected?.();
        }

        // Convert Float32Array to 16-bit PCM little endian
        if (this.callbacks.onAudioChunk) {
          const pcm16 = this.floatTo16BitPCM(inputData);
          this.callbacks.onAudioChunk(this.arrayBufferToBase64(pcm16.buffer));
        }
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);

      // Start Web Speech API for real-time live interim transcription display
      this.initSpeechRecognition();

      return true;
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      this.callbacks.onError?.(err?.message || 'Failed to access microphone.');
      return false;
    }
  }

  public stopMicrophone(): void {
    this.isRecording = false;
    this.stopSpeechRecognition();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    this.silenceTracker.reset();
  }

  public resetSilenceTracker(): void {
    this.silenceTracker.reset();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays 24kHz raw PCM chunk from Live API gaplessly
   */
  public playPcmChunk(base64Data: string): void {
    if (this.isMuted) return;
    if (!this.outputAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
    }

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit little endian PCM to float array
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.audioQueue.push(source);

      source.onended = () => {
        const idx = this.audioQueue.indexOf(source);
        if (idx !== -1) this.audioQueue.splice(idx, 1);
      };
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }

  /**
   * Plays WAV audio file (e.g. from TTS)
   */
  public async playWavAudio(base64Wav: string): Promise<void> {
    if (this.isMuted) return;
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }

  public stopPlayback(): void {
    for (const src of this.audioQueue) {
      try {
        src.stop();
      } catch {}
    }
    this.audioQueue = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
  }

  // --- Speech Recognition ---
  private initSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalized = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalized += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          this.callbacks.onInterimTranscript?.(interim);
        }
        if (finalized) {
          this.callbacks.onFinalTranscript?.(finalized.trim());
        }
      };

      this.recognition.onerror = (e: any) => {
        // Ignore aborted errors
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SpeechRecognition error:', e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isRecording && !this.isMuted) {
          try {
            this.recognition?.start();
          } catch {}
        }
      };

      this.recognition.start();
      this.isRecognizing = true;
    } catch (err) {
      console.warn('Could not start SpeechRecognition:', err);
    }
  }

  private stopSpeechRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
      this.isRecognizing = false;
    }
  }

  // --- Helper math/buffer methods ---
  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
