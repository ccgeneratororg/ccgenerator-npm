import { test } from 'node:test';
import assert from 'node:assert/strict';

import { luhnCheckDigit, isLuhnValid } from '../src/luhn.js';

test('luhnCheckDigit completes the canonical test numbers', () => {
  // Each payload is a published test PAN with its final digit removed.
  assert.equal(luhnCheckDigit('411111111111111'), '1'); // 4111111111111111
  assert.equal(luhnCheckDigit('555555555555444'), '4'); // 5555555555554444
  assert.equal(luhnCheckDigit('37828224631000'), '5'); //  378282246310005
});

test('luhnCheckDigit is the digit that makes the whole number valid', () => {
  const payload = '45320151128303';
  assert.ok(isLuhnValid(payload + luhnCheckDigit(payload)));
});

test('luhnCheckDigit can be 0', () => {
  // Sum lands on a multiple of 10, so the completing digit is 0 rather than 10.
  assert.equal(luhnCheckDigit('4000000000001'), '0');
});

test('luhnCheckDigit rejects non-digit input', () => {
  assert.throws(() => luhnCheckDigit(''), TypeError);
  assert.throws(() => luhnCheckDigit('4111 1111'), TypeError);
  assert.throws(() => luhnCheckDigit(4111), TypeError);
  assert.throws(() => luhnCheckDigit(null), TypeError);
});

test('isLuhnValid accepts known-good numbers with separators', () => {
  assert.ok(isLuhnValid('4111111111111111'));
  assert.ok(isLuhnValid('4111 1111 1111 1111'));
  assert.ok(isLuhnValid('4111-1111-1111-1111'));
});

test('isLuhnValid rejects a single mistyped digit', () => {
  assert.equal(isLuhnValid('4111111111111112'), false);
});

test('isLuhnValid catches every single-digit error, its whole job', () => {
  const pan = '4111111111111111';
  for (let i = 0; i < pan.length; i += 1) {
    for (let d = 0; d <= 9; d += 1) {
      if (String(d) === pan[i]) continue;
      const mutated = pan.slice(0, i) + d + pan.slice(i + 1);
      assert.equal(isLuhnValid(mutated), false, `missed a bad digit at ${i}`);
    }
  }
});

test('isLuhnValid catches adjacent transpositions, except 09 <-> 90', () => {
  // The documented blind spot: doubling 0 and 9 both contribute the same
  // amount, so swapping them leaves the sum unchanged. Everything else is
  // caught. A guide that claims Luhn catches "all" transpositions is wrong,
  // and this test is what keeps ours honest.
  const pan = '4111111111111111';
  const missed = [];

  for (let i = 0; i < pan.length - 1; i += 1) {
    for (let a = 0; a <= 9; a += 1) {
      for (let b = 0; b <= 9; b += 1) {
        if (a === b) continue;
        const base = pan.slice(0, i) + a + b + pan.slice(i + 2);
        const swapped = pan.slice(0, i) + b + a + pan.slice(i + 2);
        if (!isLuhnValid(base)) continue;
        if (isLuhnValid(swapped)) missed.push([a, b]);
      }
    }
  }

  for (const [a, b] of missed) {
    assert.deepEqual([a, b].sort(), [0, 9], `unexpected miss: ${a}${b}`);
  }
});

test('isLuhnValid rejects malformed input rather than stripping it', () => {
  assert.equal(isLuhnValid(''), false);
  assert.equal(isLuhnValid('4111a11111111111'), false);
  assert.equal(isLuhnValid(4111111111111111), false);
  assert.equal(isLuhnValid(undefined), false);
});
