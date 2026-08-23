/**
 * Network detection from an IIN prefix.
 */

import { networks, matchesPrefix, prefixWidth } from './networks.js';

/**
 * Score a matching prefix so the most specific rule wins.
 *
 * Two components, in order: how many prefix digits are pinned down, then
 * whether the rule is an exact prefix rather than a range. The second matters
 * where two networks are allocated at the same depth — "62" is UnionPay's own
 * two-digit allocation, so it beats a two-digit range that merely spans it.
 *
 * @param {import('./networks.js').Prefix} prefix
 * @returns {number}
 */
function specificity(prefix) {
  return prefixWidth(prefix) * 2 + (typeof prefix === 'string' ? 1 : 0);
}

/**
 * Identify the card network from a PAN or a partial one.
 *
 * A number starting 6011 is Discover, not something matched by a shorter rule,
 * because the four pinned digits outrank two. Ties beyond that fall to
 * declaration order in the network table.
 *
 * Returns `null` for input that matches nothing — including empty input, which
 * is the normal state of a card field before the first keystroke and not an
 * error.
 *
 * @param {string} pan Full or partial PAN. Spaces and hyphens are ignored.
 * @returns {string | null} A network key such as "visa", or null.
 */
export function detectBrand(pan) {
  if (typeof pan !== 'string') return null;

  const digits = pan.replace(/[ -]/g, '');
  if (!/^\d+$/.test(digits)) return null;

  let best = null;
  let bestScore = -1;

  for (const [key, rule] of Object.entries(networks)) {
    for (const prefix of rule.prefixes) {
      if (!matchesPrefix(digits, prefix)) continue;

      const score = specificity(prefix);
      if (score > bestScore) {
        best = key;
        bestScore = score;
      }
    }
  }

  return best;
}
