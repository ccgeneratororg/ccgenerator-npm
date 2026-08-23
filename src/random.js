/**
 * Uniform random integers, from Web Crypto where it exists.
 *
 * Rejection sampling rather than `% range`: taking a modulus of a 32-bit value
 * biases the low end of the range whenever the range does not divide 2^32
 * evenly. Values at or above the largest exact multiple of `range` are discarded
 * and redrawn, which keeps every value equally likely.
 *
 * This is not a security requirement — nothing here protects anything, and the
 * output is synthetic test data by definition. It is a correctness requirement:
 * a biased generator produces test corpora that under-sample part of the range,
 * which is exactly the kind of gap a test corpus exists to close.
 */

/* globals crypto */
const source =
  typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    ? crypto
    : null;

/**
 * Uniform integer in [min, max], inclusive.
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  const range = max - min + 1;

  if (!source) {
    // Only reached on runtimes with no Web Crypto at all. Node has had it
    // globally since v19, and every browser this package targets has it.
    return Math.floor(Math.random() * range) + min;
  }

  const limit = Math.floor(0x100000000 / range) * range;
  const buffer = new Uint32Array(1);
  let value;

  do {
    source.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return min + (value % range);
}

/**
 * A string of `length` random digits.
 *
 * @param {number} length
 * @returns {string}
 */
export function randomDigits(length) {
  let digits = '';
  for (let i = 0; i < length; i += 1) {
    digits += String(randomInt(0, 9));
  }
  return digits;
}

/**
 * A uniformly chosen element of `items`.
 *
 * @template T
 * @param {readonly T[]} items
 * @returns {T}
 */
export function choose(items) {
  return items[randomInt(0, items.length - 1)];
}
