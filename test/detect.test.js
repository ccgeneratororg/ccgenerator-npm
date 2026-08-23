import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectBrand } from '../src/detect.js';

test('detectBrand identifies each network from a full PAN', () => {
  const cases = {
    '4111111111111111': 'visa',
    '5555555555554444': 'mastercard',
    '2223003122003222': 'mastercard',
    '378282246310005': 'amex',
    '6011111111111117': 'discover',
    '3530111333300000': 'jcb',
    '30569309025904': 'diners',
    '6759649826438453': 'maestro',
    '6200000000000005': 'unionpay',
    '9792000000000001': 'troy',
  };

  for (const [pan, expected] of Object.entries(cases)) {
    assert.equal(detectBrand(pan), expected, pan);
  }
});

test('detectBrand covers the whole Mastercard 2-series', () => {
  // 222100–272099 has been live since 2017 and is the single most common gap
  // in other people's brand-detection code.
  assert.equal(detectBrand('2221000000000009'), 'mastercard');
  assert.equal(detectBrand('2720999999999999'), 'mastercard');
  // Just outside the range on both sides.
  assert.notEqual(detectBrand('2220999999999999'), 'mastercard');
  assert.notEqual(detectBrand('2721000000000000'), 'mastercard');
});

test('detectBrand prefers the most specific prefix', () => {
  // 6011 is Discover even though Maestro's 56–69 also covers 60.
  assert.equal(detectBrand('6011111111111117'), 'discover');
  // 9792 is Troy, not a bare unknown.
  assert.equal(detectBrand('9792'), 'troy');
});

test('detectBrand works on partial input, for live brand indicators', () => {
  assert.equal(detectBrand('4'), 'visa');
  assert.equal(detectBrand('34'), 'amex');
  assert.equal(detectBrand('22'), 'mastercard');
  assert.equal(detectBrand('222'), 'mastercard');
});

test('detectBrand ignores separators', () => {
  assert.equal(detectBrand('4111 1111 1111 1111'), 'visa');
  assert.equal(detectBrand('3782-822463-10005'), 'amex');
});

test('detectBrand returns null rather than guessing', () => {
  assert.equal(detectBrand(''), null);
  assert.equal(detectBrand('1'), null);
  assert.equal(detectBrand('abcd'), null);
  assert.equal(detectBrand(4111), null);
  assert.equal(detectBrand(null), null);
});
