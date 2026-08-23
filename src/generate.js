/**
 * Synthetic card generation.
 *
 * Everything produced here is structurally valid and financially inert: the
 * numbers satisfy the Luhn checksum and sit inside published IIN ranges, and
 * they correspond to no account at any issuer. That is the point — they are for
 * exercising a card field, not for buying anything.
 */

import { networks, networkKeys } from './networks.js';
import { luhnCheckDigit } from './luhn.js';
import { randomInt, randomDigits, choose } from './random.js';

/**
 * @typedef {object} GenerateOptions
 * @property {number} [length] Force one of the network's accepted lengths.
 * @property {boolean} [formatted] Also return the number grouped for display.
 * @property {number} [expiryYearsAhead] Upper bound for the expiry year, default 5.
 */

/**
 * @typedef {object} TestCard
 * @property {string} network Network key, e.g. "mastercard".
 * @property {string} networkName Display name, e.g. "Mastercard".
 * @property {string} pan Digits only.
 * @property {string} [formatted] Grouped PAN, when `formatted` was requested.
 * @property {string} cvv 3 or 4 digits, per network.
 * @property {string} expiryMonth Zero-padded, "01"–"12".
 * @property {string} expiryYear Four digits.
 */

/**
 * Pick a concrete prefix from a network's rules.
 *
 * @param {import('./networks.js').Prefix[]} prefixes
 * @returns {string}
 */
function choosePrefix(prefixes) {
  const prefix = choose(prefixes);
  if (typeof prefix === 'string') return prefix;

  // Preserve the digit count: 300–305 must yield "300", never "3".
  return String(randomInt(prefix.from, prefix.to)).padStart(String(prefix.to).length, '0');
}

/**
 * Group a PAN for display, e.g. "4111 1111 1111 1111".
 *
 * @param {string} pan
 * @param {readonly number[]} groups
 * @returns {string}
 */
export function format(pan, groups) {
  const chunks = [];
  let at = 0;

  for (const size of groups) {
    if (at >= pan.length) break;
    chunks.push(pan.slice(at, at + size));
    at += size;
  }

  if (at < pan.length) chunks.push(pan.slice(at));

  return chunks.join(' ');
}

/**
 * Generate one synthetic card.
 *
 * @param {string} [network] Network key. Omitted or "random" picks one.
 * @param {GenerateOptions} [options]
 * @returns {TestCard}
 * @throws {RangeError} On an unknown network or a length that network never issues.
 */
export function generate(network = 'random', options = {}) {
  const key = network === 'random' ? choose(networkKeys) : network;
  const rule = networks[key];

  if (!rule) {
    throw new RangeError(
      `unknown network "${network}" — expected one of: ${networkKeys.join(', ')}`
    );
  }

  const length = options.length ?? choose(rule.lengths);
  if (!rule.lengths.includes(length)) {
    throw new RangeError(
      `${rule.name} does not issue ${length}-digit numbers — accepted: ${rule.lengths.join(', ')}`
    );
  }

  const prefix = choosePrefix(rule.prefixes);
  const payload = prefix + randomDigits(length - prefix.length - 1);
  const pan = payload + luhnCheckDigit(payload);

  const now = new Date();
  const yearsAhead = options.expiryYearsAhead ?? 5;

  /** @type {TestCard} */
  const card = {
    network: key,
    networkName: rule.name,
    pan,
    cvv: randomDigits(rule.cvvLength),
    expiryMonth: String(randomInt(1, 12)).padStart(2, '0'),
    expiryYear: String(now.getFullYear() + randomInt(1, yearsAhead)),
  };

  if (options.formatted) {
    card.formatted = format(pan, rule.groups);
  }

  return card;
}

/**
 * Generate `count` cards.
 *
 * Numbers are not deduplicated: collisions are astronomically unlikely at any
 * realistic count, and silently discarding draws would bias the output.
 *
 * @param {number} count
 * @param {string} [network]
 * @param {GenerateOptions} [options]
 * @returns {TestCard[]}
 * @throws {RangeError} If `count` is not a positive integer.
 */
export function generateMany(count, network = 'random', options = {}) {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('count must be a positive integer');
  }

  return Array.from({ length: count }, () => generate(network, options));
}
