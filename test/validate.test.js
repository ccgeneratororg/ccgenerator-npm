import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validate } from '../src/validate.js';

test('validate accepts the published gateway test numbers', () => {
  const pans = [
    '4111111111111111',
    '5555555555554444',
    '2223003122003222',
    '378282246310005',
    '6011111111111117',
    '3530111333300000',
    '30569309025904',
  ];

  for (const pan of pans) {
    const result = validate(pan);
    assert.ok(result.valid, `${pan} -> ${result.errors.join(', ')}`);
    assert.deepEqual(result.errors, []);
  }
});

test('validate strips separators and reports the clean PAN', () => {
  const result = validate('4111 1111-1111 1111');
  assert.ok(result.valid);
  assert.equal(result.pan, '4111111111111111');
  assert.equal(result.length, 16);
});

test('validate reports a failed checksum', () => {
  const result = validate('4111111111111112');
  assert.equal(result.valid, false);
  assert.equal(result.luhn, false);
  assert.equal(result.network, 'visa');
  assert.deepEqual(result.errors, ['luhn_failed']);
});

test('validate reports a length the network does not issue', () => {
  // Luhn-valid, unmistakably Visa, but 15 digits.
  const result = validate('411111111111116');
  assert.equal(result.valid, false);
  assert.ok(result.luhn);
  assert.ok(result.errors.includes('bad_length'));
});

test('validate separates "unknown network" from "invalid"', () => {
  // Luhn-valid and inside the ISO length range, but no IIN rule matches. New
  // ranges get allocated; this table will be stale before the standard is.
  const result = validate('1234567812345670');
  assert.equal(result.network, null);
  assert.ok(result.luhn);
  assert.deepEqual(result.errors, ['unknown_network']);
});

test('validate reports every failure, not just the first', () => {
  const result = validate('9999999999999999');
  assert.ok(result.errors.includes('unknown_network'));
  assert.ok(result.errors.includes('luhn_failed'));
});

test('validate handles junk without throwing', () => {
  assert.deepEqual(validate('').errors, ['empty']);
  assert.deepEqual(validate('4111a11111111111').errors, ['non_digit']);
  assert.deepEqual(validate(4111111111111111).errors, ['not_a_string']);
  assert.deepEqual(validate(null).errors, ['not_a_string']);
  assert.deepEqual(validate(undefined).errors, ['not_a_string']);
});
