# @ccgenerator/test-cards

[![npm version](https://img.shields.io/npm/v/%40ccgenerator%2Ftest-cards)](https://www.npmjs.com/package/@ccgenerator/test-cards)
[![CI](https://github.com/ccgeneratororg/ccgenerator-npm/actions/workflows/test.yml/badge.svg)](https://github.com/ccgeneratororg/ccgenerator-npm/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![dependencies: none](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](./package.json)

Synthetic, Luhn-valid payment card numbers for testing card input.

Zero dependencies. No network calls. Works in Node and the browser.

```js
import { generate, validate, detectBrand } from '@ccgenerator/test-cards';

generate('mastercard');
// { network: 'mastercard', networkName: 'Mastercard', pan: '5312448763449521',
//   cvv: '204', expiryMonth: '09', expiryYear: '2029' }

detectBrand('2223 0031 2200 3222');  // 'mastercard'
validate('4111111111111112').errors; // ['luhn_failed']
```

## What this is for

Exercising the card field. Does the input mask group digits correctly? Does the
brand icon switch on the right prefix? Does a 19-digit Maestro number survive the
form, and does a 15-digit Amex number get an Amex-length CVV field?

Those are the questions this package answers, and it is deliberately not useful
for anything else.

## What it is not

**The numbers are not real cards.** They satisfy the Luhn checksum and sit inside
published issuer identification ranges, which is exactly what a card field checks
— and that is where the resemblance stops. They correspond to no account at any
issuer, carry no balance, and cannot authorise a transaction. A payment gateway
declines them at the first hop.

**They are not gateway test cards either.** Stripe, PayPal, Adyen and the rest
publish their own fixed numbers that trigger specific sandbox behaviour, such as
a decline for insufficient funds or a 3-D Secure challenge. This package cannot
produce those, because they are assigned by the gateway, not derived. Use the
provider's own list for that: [ccgenerator.org/test-card-numbers](https://ccgenerator.org/test-card-numbers/)
collects them per gateway.

## Install

```sh
npm install --save-dev @ccgenerator/test-cards
```

Node 18 or newer. ESM only.

## Recipes

### Table-driven form tests

The output shape is stable, so a batch drops straight into a parameterised
suite. With `node:test` (works the same in Vitest or Jest):

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { generateMany } from '@ccgenerator/test-cards';
import { formatCardInput } from '../src/card-field.js'; // your code

for (const { networkName, pan } of generateMany(100)) {
  test(`${networkName} ${pan} survives the input mask`, () => {
    assert.equal(formatCardInput(pan).replaceAll(' ', ''), pan);
  });
}
```

One hundred fresh numbers per run costs nothing and finds the seams a single
hard-coded `4111 1111 1111 1111` never will — the 15-digit Amex, the 14-digit
Diners, the 19-digit Maestro.

### Negative cases

A number that is *almost* right is the most useful test input there is. Break
the check digit deliberately:

```js
import { generate, validate } from '@ccgenerator/test-cards';

const good = generate('visa').pan;
const bad = good.slice(0, -1) + String((Number(good.at(-1)) + 1) % 10);

validate(bad).errors; // ['luhn_failed'] — your form should reject it too
```

### End-to-end (Playwright, Cypress, …)

```js
import { generate } from '@ccgenerator/test-cards';

test('checkout accepts a 19-digit Maestro', async ({ page }) => {
  const card = generate('maestro', { length: 19 });

  await page.goto('/checkout');
  await page.fill('[name=cardnumber]', card.pan);
  await page.fill('[name=expiry]', `${card.expiryMonth}/${card.expiryYear.slice(2)}`);
  await page.fill('[name=cvc]', card.cvv);

  await expect(page.locator('.brand-icon')).toHaveClass(/maestro/);
});
```

This exercises *your* form, not a payment. If the page ends at a real gateway,
use that gateway's own sandbox numbers instead — see
[What it is not](#what-it-is-not).

### In the browser, no build step

```html
<script type="module">
  import { generate } from 'https://cdn.jsdelivr.net/npm/@ccgenerator/test-cards@1/+esm';

  console.log(generate('visa', { formatted: true }).formatted);
</script>
```

### TypeScript

Types ship with the package — no `@types/…` install, no build step on our side:

```ts
import { generate, networks, type NetworkKey } from '@ccgenerator/test-cards';

function cvvFieldSize(key: NetworkKey): number {
  return networks[key].cvvLength;
}

cvvFieldSize(generate().network); // 3 or 4
```

## API

### `generate(network?, options?)`

Returns one `TestCard`. `network` is a key from the table below, or `'random'`
(the default).

```js
generate('amex');
generate('visa', { formatted: true });   // adds `formatted: '4539 8776 1234 5678'`
generate('maestro', { length: 19 });     // pick one of the network's lengths
generate('visa', { expiryYearsAhead: 2 });
```

Throws `RangeError` on an unknown network, or on a length that network does not
issue — `generate('amex', { length: 16 })` is a mistake worth failing loudly.

### `generateMany(count, network?, options?)`

An array of `count` cards. Numbers are not deduplicated; collisions are
vanishingly unlikely at realistic counts, and discarding draws would bias the
output.

### `validate(pan)`

Structural validation. Separators are ignored.

```js
validate('4111 1111 1111 1111');
// { valid: true, network: 'visa', pan: '4111111111111111',
//   length: 16, luhn: true, errors: [] }
```

`errors` holds stable string codes rather than sentences, so you can map them to
your own copy: `not_a_string`, `empty`, `non_digit`, `unknown_network`,
`bad_length`, `luhn_failed`.

A number that passes Luhn but matches no known IIN range comes back with
`unknown_network` rather than being rejected outright. New ranges get allocated,
and any table like this one goes stale before the standard does.

### `detectBrand(pan)`

The network key, or `null`. Works on partial input, so it can drive a brand
indicator while the user is still typing:

```js
detectBrand('4');    // 'visa'
detectBrand('22');   // 'mastercard'
detectBrand('');     // null
```

### `luhnCheckDigit(payload)`

The digit that completes `payload` into a Luhn-valid number. `payload` is the
number *without* its final check digit.

```js
luhnCheckDigit('411111111111111'); // '1'
```

### `isLuhnValid(pan)`

Whether a number satisfies the checksum. Ignores spaces and hyphens; returns
`false` for anything else non-numeric rather than silently stripping it.

### `networks`, `networkKeys`

The rule table itself, if you need the lengths or CVV length for a network.

```js
networks.amex.cvvLength; // 4
networks.amex.lengths;   // [15]
```

## Supported networks

Each network name links to a browser version of the generator, for when you
want a number without opening a REPL.

| Key | Network | Lengths | CVV |
|---|---|---|---|
| `visa` | [Visa](https://ccgenerator.org/visa-card-generator/) | 16 | 3 |
| `mastercard` | [Mastercard](https://ccgenerator.org/mastercard-generator/) | 16 | 3 |
| `amex` | [American Express](https://ccgenerator.org/american-express-card-generator/) | 15 | 4 |
| `discover` | [Discover](https://ccgenerator.org/discover-card-generator/) | 16 | 3 |
| `jcb` | [JCB](https://ccgenerator.org/jcb-card-generator/) | 16 | 3 |
| `diners` | [Diners Club](https://ccgenerator.org/diners-club-card-generator/) | 14 | 3 |
| `maestro` | [Maestro](https://ccgenerator.org/maestro-card-generator/) | 16, 19 | 3 |
| `unionpay` | [UnionPay](https://ccgenerator.org/unionpay-card-generator/) | 16, 19 | 3 |
| `troy` | [Troy](https://ccgenerator.org/troy-card-generator/) | 16 | 3 |

## Why the ranges are what they are

The rule table is where hand-rolled card fixtures usually go wrong, so the three
most common mistakes are worth spelling out:

- **Mastercard's 2-series** (222100–272099) has been live since 2017. Code that
  only checks 51–55 rejects a real, in-issue Mastercard.
- **Maestro is not "50, 56–69".** That approximation swallows Discover's 6011,
  65 and 644–649 and UnionPay's 62, so a generator built on it emits numbers
  that are not Maestro at all. This package uses the allocations Maestro
  actually issues on.
- **Not every network is 16 digits.** Amex is 15, classic Diners Club is 14, and
  Maestro and UnionPay issue at 19 as well as 16 — the full picture is in
  [card number length by network](https://ccgenerator.org/guides/card-number-length-by-network/).
  A form that hard-codes 16 truncates real cards.

## Randomness

Card numbers are drawn from `crypto.getRandomValues()` with rejection sampling,
not `% range`. This is not a security property — nothing here protects anything.
It is a correctness one: a biased generator under-samples part of the range,
which is precisely the gap a test corpus exists to close.

## Tests

```sh
npm test
```

No test framework, no dependencies — `node:test` and `node:assert`. The suite
includes an exhaustive check that Luhn catches every single-digit error, and one
that pins its documented blind spot: a transposed `09` ↔ `90` passes, and any
claim that Luhn catches *all* transpositions is wrong.

## Related tools

The same rule table runs in two other places, for when you want the numbers
without writing code:

- **[Browser generator](https://ccgenerator.org/credit-card-number-generator/)** —
  generate and copy test numbers for any of the nine networks, no install.
- **[Chrome extension](https://chromewebstore.google.com/detail/credit-card-generator-tes/jmjdiinigjlchmnjkccoljpcnbgbikfd)** —
  generates test numbers, validates BINs, and fills checkout forms in one click
  while you develop.
- **[Card validator](https://ccgenerator.org/credit-card-validator/)** — paste a
  number, see the same structural checks `validate()` runs, with the failure
  explained.
- **[Bulk generator](https://ccgenerator.org/bulk-credit-card-generator/)** — up
  to 10,000 cards with reproducible seeds, exported as CSV, JSON, JSONL, SQL or
  TSV, for fixtures that live outside JavaScript.

## Background

Longer write-ups of the mechanics behind this package:

- [The Luhn algorithm](https://ccgenerator.org/guides/luhn-algorithm/) — worked
  example, reference implementation, and what it misses
- [Luhn algorithm code examples](https://ccgenerator.org/guides/luhn-algorithm-code-examples/) —
  the check digit routine in JavaScript, TypeScript, Python, PHP and Ruby
- [Card number structure](https://ccgenerator.org/guides/credit-card-number-structure/) —
  IIN, account identifier, check digit
- [Card brand detection regex](https://ccgenerator.org/guides/card-brand-detection-regex/)
- [Why test cards fail on real payment systems](https://ccgenerator.org/guides/why-test-cards-fail-on-real-payment-systems/)

## Contributing and security

Corrections to the IIN table are welcome — with a source; the bar is described
in [CONTRIBUTING.md](CONTRIBUTING.md). The package's security posture (no
dependencies, no scripts, no network, no real card data) is spelled out in
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
