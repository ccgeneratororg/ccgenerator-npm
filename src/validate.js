/**
 * PAN validation: structure only.
 *
 * Nothing here says a card exists, has funds, or would authorise. A PAN can
 * pass every check in this file and still be declined for a dozen reasons no
 * client can see. Structural validation is exactly the job of the card field in
 * a checkout form, and nothing more.
 */

import { networks } from './networks.js';
import { isLuhnValid } from './luhn.js';
import { detectBrand } from './detect.js';

/**
 * @typedef {object} ValidationResult
 * @property {boolean} valid True only when every structural check passed.
 * @property {string | null} network Detected network key, or null.
 * @property {string} pan The PAN with separators removed.
 * @property {number} length Digit count.
 * @property {boolean} luhn Whether the Luhn checksum holds.
 * @property {string[]} errors Machine-readable reasons, empty when valid.
 */

/**
 * Validate the structure of a PAN.
 *
 * The `errors` array is deliberately made of stable string codes rather than
 * sentences, so callers can map them to their own copy and their own
 * translations:
 *
 *   not_a_string, empty, non_digit, unknown_network,
 *   bad_length, luhn_failed
 *
 * ISO/IEC 7812-1 allows 12 to 19 digits, so a number that matches no known IIN
 * range is reported as `unknown_network` rather than rejected outright — new
 * ranges are allocated, and this table will be out of date before the standard
 * is.
 *
 * @param {string} pan
 * @returns {ValidationResult}
 */
export function validate(pan) {
  /** @type {ValidationResult} */
  const result = {
    valid: false,
    network: null,
    pan: '',
    length: 0,
    luhn: false,
    errors: [],
  };

  if (typeof pan !== 'string') {
    result.errors.push('not_a_string');
    return result;
  }

  const digits = pan.replace(/[ -]/g, '');
  result.pan = digits;
  result.length = digits.length;

  if (digits.length === 0) {
    result.errors.push('empty');
    return result;
  }

  if (!/^\d+$/.test(digits)) {
    result.errors.push('non_digit');
    return result;
  }

  result.luhn = isLuhnValid(digits);
  result.network = detectBrand(digits);

  if (!result.network) {
    result.errors.push('unknown_network');
  } else if (!networks[result.network].lengths.includes(digits.length)) {
    result.errors.push('bad_length');
  }

  if (!result.luhn) {
    result.errors.push('luhn_failed');
  }

  result.valid = result.errors.length === 0;
  return result;
}
