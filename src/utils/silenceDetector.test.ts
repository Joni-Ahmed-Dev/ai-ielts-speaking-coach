import test from 'node:test';
import assert from 'node:assert/strict';
import { SilenceTracker } from './silenceDetector';

test('SilenceTracker.calculateRms computes correct RMS value', () => {
  const silent = new Float32Array([0, 0, 0, 0]);
  assert.equal(SilenceTracker.calculateRms(silent), 0);

  const constAudio = new Float32Array([0.5, 0.5, 0.5, 0.5]);
  assert.ok(Math.abs(SilenceTracker.calculateRms(constAudio) - 0.5) < 0.0001);
});

test('SilenceTracker enforces 2000ms silence rule before completing', () => {
  const tracker = new SilenceTracker({
    silenceThresholdRms: 0.02,
    silenceDurationMs: 2000,
    minSpeechDurationMs: 1000,
  });

  // User speaks from t=1000 to t=2500 (1500ms of speech)
  let res = tracker.processVolume(0.08, 1000);
  assert.equal(res.state, 'speaking');
  assert.equal(res.hasCompleted, false);

  res = tracker.processVolume(0.09, 2500);
  assert.equal(res.state, 'speaking');
  assert.equal(res.hasCompleted, false);

  // Transition to pause at t=2600 (silence begins)
  res = tracker.processVolume(0.005, 2600);
  assert.equal(res.state, 'paused');
  assert.equal(res.hasCompleted, false);

  // 1000ms into pause (at t=3600): silenceElapsedMs is 1000ms - MUST NOT complete yet
  res = tracker.processVolume(0.005, 3600);
  assert.equal(res.state, 'paused');
  assert.equal(res.silenceElapsedMs, 1000);
  assert.equal(res.hasCompleted, false);

  // 1900ms into pause (at t=4500): silenceElapsedMs is 1900ms - STILL NOT completed
  res = tracker.processVolume(0.005, 4500);
  assert.equal(res.silenceElapsedMs, 1900);
  assert.equal(res.hasCompleted, false);

  // 2000ms into pause (at t=4600): exactly 2.0s continuous silence -> triggers completion!
  res = tracker.processVolume(0.005, 4600);
  assert.equal(res.silenceElapsedMs, 2000);
  assert.equal(res.hasCompleted, true);
  assert.equal(res.state, 'completed');
});

test('SilenceTracker resets silence timer if user speaks again within 2 seconds', () => {
  const tracker = new SilenceTracker({
    silenceThresholdRms: 0.02,
    silenceDurationMs: 2000,
    minSpeechDurationMs: 1000,
  });

  // User speaks from 1000 to 2000
  tracker.processVolume(0.1, 1000);
  tracker.processVolume(0.1, 2000);

  // Silence begins at 2100
  tracker.processVolume(0.01, 2100);

  // At 3300 (1200ms of silence)
  let res = tracker.processVolume(0.01, 3300);
  assert.equal(res.silenceElapsedMs, 1200);
  assert.equal(res.hasCompleted, false);

  // User resumes speaking at 3500!
  res = tracker.processVolume(0.12, 3500);
  assert.equal(res.state, 'speaking');
  assert.equal(res.isSilent, false);

  // Pauses again at 4000
  tracker.processVolume(0.01, 4000);

  // At 5500 (1500ms after new pause) - still not completed
  res = tracker.processVolume(0.01, 5500);
  assert.equal(res.hasCompleted, false);
  assert.equal(res.silenceElapsedMs, 1500);
});
