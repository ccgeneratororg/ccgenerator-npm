# Changelog

All notable changes to this package are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package
follows [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-08-23

First public release.

### Added

- `generate(network?, options?)` — one synthetic, Luhn-valid card with CVV and
  expiry; `formatted`, `length` and `expiryYearsAhead` options.
- `generateMany(count, network?, options?)` — batches, deliberately without
  deduplication.
- `validate(pan)` — structural validation with stable error codes
  (`not_a_string`, `empty`, `non_digit`, `unknown_network`, `bad_length`,
  `luhn_failed`).
- `detectBrand(pan)` — network detection that works on partial input.
- `luhnCheckDigit(payload)` / `isLuhnValid(pan)` — the checksum primitives.
- `networks` / `networkKeys` — the rule table itself: IIN prefixes, lengths,
  CVV length and display grouping per network.
- Nine networks: Visa, Mastercard (including the 2-series), American Express,
  Discover, JCB, Diners Club (14-digit), Maestro (16/19), UnionPay (16/19),
  Troy.
- Hand-written TypeScript declarations (`index.d.ts`).
- Test suite on `node:test` — no framework, no dependencies.
