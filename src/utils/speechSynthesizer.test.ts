import test from 'node:test';
import assert from 'node:assert';
import { speechSynthesizer } from './speechSynthesizer';

test('speechSynthesizer stops without throwing when no active utterance', () => {
  assert.doesNotThrow(() => {
    speechSynthesizer.stop();
  });
  assert.strictEqual(speechSynthesizer.isSpeaking(), false);
});

test('speechSynthesizer returns fallback voice name when running in test environment', () => {
  const name = speechSynthesizer.getSelectedVoiceName();
  assert.ok(typeof name === 'string' && name.length > 0);
});
