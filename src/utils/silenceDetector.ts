/**
 * Audio analysis & Silence Detection for IELTS Coach
 * Enforces the Golden Rule: NEVER interrupt while speaking.
 * Silence detection waits for 2000ms (2 seconds) of sustained silence before completing an answer.
 */

export interface SilenceDetectorConfig {
  silenceThresholdRms?: number; // Volume below which sound is considered silence (e.g. 0.015)
  silenceDurationMs?: number; // Time in ms of silence required before completing turn (2000ms)
  minSpeechDurationMs?: number; // Minimum speech needed before silence can trigger completion (e.g. 1000ms)
}

export type SilenceState = 'idle' | 'speaking' | 'paused' | 'completed';

export class SilenceTracker {
  private silenceThresholdRms: number;
  private silenceDurationMs: number;
  private minSpeechDurationMs: number;

  private state: SilenceState = 'idle';
  private speechStartTime: number = 0;
  private silenceStartTime: number = 0;
  private totalSpeechTimeMs: number = 0;

  constructor(config: SilenceDetectorConfig = {}) {
    this.silenceThresholdRms = config.silenceThresholdRms ?? 0.015;
    this.silenceDurationMs = config.silenceDurationMs ?? 2000; // 2 seconds strict requirement
    this.minSpeechDurationMs = config.minSpeechDurationMs ?? 1000;
  }

  /**
   * Resets tracker state
   */
  public reset(): void {
    this.state = 'idle';
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
    this.totalSpeechTimeMs = 0;
  }

  /**
   * Calculates Root Mean Square (RMS) volume from Float32 PCM sample buffer
   */
  public static calculateRms(samples: Float32Array): number {
    if (!samples || samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Processes a single audio sample frame with timestamp.
   * Returns whether completion condition (2s silence after speech) was reached.
   */
  public processVolume(volumeRms: number, nowMs: number): {
    state: SilenceState;
    isSilent: boolean;
    silenceElapsedMs: number;
    hasCompleted: boolean;
  } {
    const isSilent = volumeRms < this.silenceThresholdRms;

    if (!isSilent) {
      // Audio level is above silence threshold -> user is speaking
      if (this.state === 'idle' || this.state === 'paused') {
        if (this.state === 'idle') {
          this.speechStartTime = nowMs;
        }
        this.state = 'speaking';
      }
      this.silenceStartTime = 0;
      this.totalSpeechTimeMs = nowMs - this.speechStartTime;

      return {
        state: this.state,
        isSilent: false,
        silenceElapsedMs: 0,
        hasCompleted: false,
      };
    } else {
      // Audio level is below silence threshold
      if (this.state === 'speaking') {
        // Just transitioned into silence
        this.state = 'paused';
        this.silenceStartTime = nowMs;
      }

      let silenceElapsedMs = 0;
      if (this.silenceStartTime > 0) {
        silenceElapsedMs = nowMs - this.silenceStartTime;
      }

      const speechDuration = this.totalSpeechTimeMs;
      const canComplete = speechDuration >= this.minSpeechDurationMs;
      const hasCompleted = canComplete && silenceElapsedMs >= this.silenceDurationMs;

      if (hasCompleted) {
        this.state = 'completed';
      }

      return {
        state: this.state,
        isSilent: true,
        silenceElapsedMs,
        hasCompleted,
      };
    }
  }

  public getState(): SilenceState {
    return this.state;
  }
}
