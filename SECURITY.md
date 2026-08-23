# Security

## What this package touches

No real card data, at any point. The numbers it emits are synthetic: they
satisfy the Luhn checksum and sit inside published IIN ranges, correspond to
no account at any issuer, and cannot authorise a transaction.

The package also has:

- **no runtime dependencies,**
- **no network calls,**
- **no lifecycle scripts** (nothing runs on install),
- **no state** — it reads nothing and writes nothing.

`crypto.getRandomValues()` is used for uniformity, not secrecy; nothing here is
a security boundary. See the README's "Randomness" section.

## Reporting

If you believe you have found a security issue — in the package itself or in
its publishing chain — email **bugs@ccgenerator.org**. You will get a reply
within a few days. Please do not open a public issue for anything you would
not want exploited before it is fixed.

## Scope notes for scanners

A finding along the lines of "this package generates credit card numbers" is
working as documented, not a vulnerability — see
[What it is not](README.md#what-it-is-not) in the README.
