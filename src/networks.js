/**
 * Card network rules: the IIN ranges, accepted lengths, CVV length and display
 * grouping for each network the package supports.
 *
 * This table is the same one the generators on ccgenerator.org run on
 * (layouts/partials/card-generator.html). Ranges come from ISO/IEC 7812-1 and
 * the networks' own published IIN allocations. Two of them are worth calling
 * out because they are the most commonly wrong entries in other people's
 * tables:
 *
 *   - Mastercard's 2-series (222100–272099) has been live since 2017. Code that
 *     only checks 51–55 rejects a real, in-issue Mastercard.
 *   - Maestro and UnionPay issue at 19 digits as well as 16. A form that hard
 *     codes 16 truncates them.
 *
 * `prefixes` entries are either a literal digit string or a numeric range whose
 * bounds have the same digit count.
 */

/**
 * @typedef {{from: number, to: number}} PrefixRange
 * @typedef {string | PrefixRange} Prefix
 */

export const networks = Object.freeze({
  visa: {
    name: 'Visa',
    prefixes: ['4'],
    lengths: [16],
    cvvLength: 3,
    groups: [4, 4, 4, 4],
  },
  mastercard: {
    name: 'Mastercard',
    prefixes: [{ from: 51, to: 55 }, { from: 2221, to: 2720 }],
    lengths: [16],
    cvvLength: 3,
    groups: [4, 4, 4, 4],
  },
  amex: {
    name: 'American Express',
    prefixes: ['34', '37'],
    lengths: [15],
    cvvLength: 4,
    groups: [4, 6, 5],
  },
  discover: {
    name: 'Discover',
    prefixes: ['6011', '65', { from: 644, to: 649 }],
    lengths: [16],
    cvvLength: 3,
    groups: [4, 4, 4, 4],
  },
  jcb: {
    name: 'JCB',
    prefixes: [{ from: 3528, to: 3589 }],
    lengths: [16],
    cvvLength: 3,
    groups: [4, 4, 4, 4],
  },
  diners: {
    name: 'Diners Club',
    prefixes: [{ from: 300, to: 305 }, '36', '38', '39'],
    lengths: [14],
    cvvLength: 3,
    groups: [4, 6, 4],
  },
  maestro: {
    name: 'Maestro',
    // Not the "50, 56–69" approximation that circulates widely. That range
    // swallows 6011 and 65 (Discover), 644–649 (Discover) and 62 (UnionPay), so
    // a generator built on it emits numbers that are not Maestro at all. These
    // are the allocations Maestro actually issues on.
    prefixes: ['50', { from: 56, to: 58 }, '6304', '6759', { from: 6761, to: 6763 }],
    lengths: [16, 19],
    cvvLength: 3,
    groups: [4, 4, 4, 4, 3],
  },
  unionpay: {
    name: 'UnionPay',
    prefixes: ['62', '81'],
    lengths: [16, 19],
    cvvLength: 3,
    groups: [4, 4, 4, 4, 3],
  },
  troy: {
    name: 'Troy',
    prefixes: ['9792'],
    lengths: [16],
    cvvLength: 3,
    groups: [4, 4, 4, 4],
  },
});

/** Every supported network key. */
export const networkKeys = Object.freeze(Object.keys(networks));

/**
 * Whether a digit string starts inside a prefix rule.
 *
 * Partial input matches: "42" is enough to identify Visa, and "2" is enough to
 * keep Mastercard in play without committing to it, which is what a brand
 * indicator in a card field needs while the user is still typing.
 *
 * @param {string} digits
 * @param {Prefix} prefix
 * @returns {boolean}
 */
export function matchesPrefix(digits, prefix) {
  if (typeof prefix === 'string') {
    const width = Math.min(digits.length, prefix.length);
    return digits.slice(0, width) === prefix.slice(0, width);
  }

  const width = String(prefix.to).length;
  const head = digits.slice(0, width);
  if (head.length === 0) return false;

  // Compare at the length actually available: a partial "22" against 2221–2720
  // is checked as 22 against 22–27.
  const scale = 10 ** (width - head.length);
  const from = Math.floor(prefix.from / scale);
  const to = Math.floor(prefix.to / scale);
  const value = Number(head);

  return value >= from && value <= to;
}

/**
 * How many digits of a prefix rule are known — used to rank competing matches
 * so the most specific network wins.
 *
 * @param {Prefix} prefix
 * @returns {number}
 */
export function prefixWidth(prefix) {
  return typeof prefix === 'string' ? prefix.length : String(prefix.to).length;
}
