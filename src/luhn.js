/**
 * The Luhn mod-10 checksum (ISO/IEC 7812-1, Annex B).
 *
 * Both functions walk the digits right to left, doubling every second one and
 * subtracting 9 from any result above 9. They are kept as two functions rather
 * than one because the check-digit case operates on a payload with the final
 * position still empty, and folding that into the validator with a flag makes
 * both harder to read than they need to be.
 */

const DIGITS = /^\d+$/;

/**
 * Sum a digit string under the Luhn weighting, doubling from the right.
 *
 * @param {string} digits
 * @returns {number}
 */
function luhnSum(digits) {
  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }

  return sum;
}

/**
 * The digit that completes `payload` into a Luhn-valid number.
 *
 * `payload` is the number *without* its final check digit — for a 16-digit PAN
 * that is 15 digits.
 *
 * @param {string} payload Digits only.
 * @returns {string} A single digit, "0"–"9".
 * @throws {TypeError} If `payload` is not a non-empty digit string.
 */
export function luhnCheckDigit(payload) {
  if (typeof payload !== 'string' || !DIGITS.test(payload)) {
    throw new TypeError('luhnCheckDigit expects a non-empty string of digits');
  }

  // Appending "0" puts the payload digits in the parity they will have once the
  // real check digit occupies the last position.
  return String((10 - (luhnSum(payload + '0') % 10)) % 10);
}

/**
 * Whether a number satisfies the Luhn checksum.
 *
 * Separators are ignored, so "4111 1111 1111 1111" and "4111-1111-1111-1111"
 * both work. A string containing anything other than digits, spaces and hyphens
 * is rejected outright rather than silently stripped — a letter in a PAN is a
 * data-entry bug worth surfacing, not whitespace worth forgiving.
 *
 * @param {string} pan
 * @returns {boolean}
 */
export function isLuhnValid(pan) {
  if (typeof pan !== 'string') return false;

  const digits = pan.replace(/[ -]/g, '');
  if (!DIGITS.test(digits)) return false;

  return luhnSum(digits) % 10 === 0;
}
