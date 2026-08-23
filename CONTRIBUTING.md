# Contributing

Thanks for looking. This package is small on purpose, and the bar for changes
reflects that.

## Ground rules

- **Zero runtime dependencies, zero lifecycle scripts.** PRs that add either
  will be declined regardless of what they buy.
- **Every change to `src/networks.js` needs a source** — a network's published
  IIN allocation, an ISO/IEC 7812 reference, or equivalent. "Other libraries
  use this range" is not a source; several of them are wrong in the same way,
  which is half the reason this package exists.
- **Bug fixes come with a test** that fails before the fix and passes after.
- The same rule table also runs the generators on
  [ccgenerator.org](https://ccgenerator.org/) — table changes are synced there,
  so expect a short delay between merge and release.

## What gets merged

- IIN range corrections with a citation.
- Bug fixes with tests.
- Documentation fixes.

## What does not

- New dependencies, build steps, or CI complexity.
- Anything that makes the output resemble real card data more closely —
  balances, cardholder identities, issuer names on numbers. The package
  generates structurally valid test input, and that boundary is deliberate.
- Support for producing gateway-specific sandbox numbers (Stripe's `4242…`
  and friends). Those are assigned, not derived; use the gateway's own list.

## Running the tests

```sh
npm test
```

Node 18 or newer, nothing to install.
