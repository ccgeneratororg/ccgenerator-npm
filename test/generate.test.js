import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generate, generateMany, format } from '../src/generate.js';
import { validate } from '../src/validate.js';
import { detectBrand } from '../src/detect.js';
import { networks, networkKeys } from '../src/networks.js';

test('every network generates cards that validate, 200 draws each', () => {
  for (const key of networkKeys) {
    for (let i = 0; i < 200; i += 1) {
      const card = generate(key);
      const result = validate(card.pan);

      assert.ok(result.valid, `${key}: ${card.pan} -> ${result.errors.join(', ')}`);
      assert.equal(result.network, key);
      assert.equal(card.network, key);
      assert.equal(card.cvv.length, networks[key].cvvLength);
      assert.ok(networks[key].lengths.includes(card.pan.length));
    }
  }
});

test('generated prefixes keep their digit count', () => {
  // The bug this guards: a 300–305 range rendering as "3" instead of "300",
  // which shifts every following digit and silently changes the network.
  for (let i = 0; i < 300; i += 1) {
    assert.equal(detectBrand(generate('diners').pan), 'diners');
    assert.equal(detectBrand(generate('discover').pan), 'discover');
  }
});

test('generate honours an explicit length', () => {
  for (let i = 0; i < 50; i += 1) {
    assert.equal(generate('maestro', { length: 19 }).pan.length, 19);
    assert.equal(generate('maestro', { length: 16 }).pan.length, 16);
  }
});

test('generate rejects a length the network does not issue', () => {
  assert.throws(() => generate('visa', { length: 19 }), RangeError);
  assert.throws(() => generate('amex', { length: 16 }), RangeError);
});

test('generate rejects an unknown network', () => {
  assert.throws(() => generate('mastercrad'), RangeError);
});

test('generate("random") stays inside the supported set', () => {
  for (let i = 0; i < 100; i += 1) {
    assert.ok(networkKeys.includes(generate().network));
    assert.ok(networkKeys.includes(generate('random').network));
  }
});

test('expiry is always in the future and well formed', () => {
  const thisYear = new Date().getFullYear();

  for (let i = 0; i < 100; i += 1) {
    const card = generate('visa');
    assert.match(card.expiryMonth, /^(0[1-9]|1[0-2])$/);
    assert.match(card.expiryYear, /^\d{4}$/);
    assert.ok(Number(card.expiryYear) > thisYear);
    assert.ok(Number(card.expiryYear) <= thisYear + 5);
  }
});

test('formatted output groups per network and loses no digits', () => {
  const visa = generate('visa', { formatted: true });
  assert.match(visa.formatted, /^\d{4} \d{4} \d{4} \d{4}$/);
  assert.equal(visa.formatted.replace(/ /g, ''), visa.pan);

  const amex = generate('amex', { formatted: true });
  assert.match(amex.formatted, /^\d{4} \d{6} \d{5}$/);
  assert.equal(amex.formatted.replace(/ /g, ''), amex.pan);

  assert.equal(generate('visa').formatted, undefined);
});

test('format keeps trailing digits the group spec does not cover', () => {
  assert.equal(format('12345678', [4]), '1234 5678');
  assert.equal(format('1234', [4, 4, 4]), '1234');
});

test('generateMany returns the requested count', () => {
  assert.equal(generateMany(25, 'visa').length, 25);
  assert.throws(() => generateMany(0), RangeError);
  assert.throws(() => generateMany(2.5), RangeError);
  assert.throws(() => generateMany('3'), RangeError);
});

test('output is not a constant — the generator actually varies', () => {
  const pans = new Set(generateMany(200, 'visa').map((c) => c.pan));
  assert.ok(pans.size > 190, `only ${pans.size} distinct numbers in 200 draws`);
});
