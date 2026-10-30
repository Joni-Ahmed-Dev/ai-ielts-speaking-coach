import test from 'node:test';
import assert from 'node:assert/strict';
import { roundToIeltsBand, calculateOverallBand, formatBand } from './ieltsScoring';

test('roundToIeltsBand respects official IELTS rounding rules', () => {
  // Exact whole or half
  assert.equal(roundToIeltsBand(6.0), 6.0);
  assert.equal(roundToIeltsBand(6.5), 6.5);

  // Less than .25 rounds down to floor
  assert.equal(roundToIeltsBand(6.125), 6.0);
  assert.equal(roundToIeltsBand(6.20), 6.0);

  // .25 rounds UP to .5
  assert.equal(roundToIeltsBand(6.25), 6.5);

  // Between .25 and .75 rounds to .5
  assert.equal(roundToIeltsBand(6.375), 6.5);
  assert.equal(roundToIeltsBand(6.625), 6.5);

  // .75 rounds UP to next whole band
  assert.equal(roundToIeltsBand(6.75), 7.0);
  assert.equal(roundToIeltsBand(6.875), 7.0);

  // Boundary clamp
  assert.equal(roundToIeltsBand(9.2), 9.0);
  assert.equal(roundToIeltsBand(0), 0.0);
});

test('calculateOverallBand averages 4 criteria correctly', () => {
  // 6.5, 6.5, 6.0, 6.0 -> avg 6.25 -> rounded up to 6.5
  const band1 = calculateOverallBand({
    fluency: 6.5,
    vocabulary: 6.5,
    grammar: 6.0,
    pronunciation: 6.0,
  });
  assert.equal(band1, 6.5);

  // 7.0, 7.0, 6.5, 6.5 -> avg 6.75 -> rounded up to 7.0
  const band2 = calculateOverallBand({
    fluency: 7.0,
    vocabulary: 7.0,
    grammar: 6.5,
    pronunciation: 6.5,
  });
  assert.equal(band2, 7.0);
});

test('formatBand formats bands consistently', () => {
  assert.equal(formatBand(7), '7.0');
  assert.equal(formatBand(6.5), '6.5');
});
