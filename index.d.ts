/**
 * Type definitions for @ccgenerator/test-cards.
 *
 * Hand-written rather than emitted by tsc: the package is plain ESM with no
 * build step, and a 90-line declaration file is cheaper to maintain than a
 * toolchain. Keep this in step with src/index.js.
 */

/** A network key accepted by `generate` and returned by `detectBrand`. */
export type NetworkKey =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'jcb'
  | 'diners'
  | 'maestro'
  | 'unionpay'
  | 'troy';

/** An inclusive numeric IIN range whose bounds have the same digit count. */
export interface PrefixRange {
  from: number;
  to: number;
}

export type Prefix = string | PrefixRange;

export interface NetworkRule {
  /** Display name, e.g. "American Express". */
  name: string;
  /** Published IIN prefixes and ranges. */
  prefixes: readonly Prefix[];
  /** Digit counts this network issues. */
  lengths: readonly number[];
  /** CVV/CVC/CID length. */
  cvvLength: number;
  /** Digit grouping used by `format`. */
  groups: readonly number[];
}

export interface GenerateOptions {
  /** Force one of the network's accepted lengths. */
  length?: number;
  /** Also return the number grouped for display. */
  formatted?: boolean;
  /** Upper bound for the generated expiry year. Default 5. */
  expiryYearsAhead?: number;
}

export interface TestCard {
  network: NetworkKey;
  networkName: string;
  /** Digits only. */
  pan: string;
  /** Present only when `formatted: true` was passed. */
  formatted?: string;
  cvv: string;
  /** Zero-padded, "01"–"12". */
  expiryMonth: string;
  /** Four digits. */
  expiryYear: string;
}

/** Stable, machine-readable reasons a PAN failed validation. */
export type ValidationError =
  | 'not_a_string'
  | 'empty'
  | 'non_digit'
  | 'unknown_network'
  | 'bad_length'
  | 'luhn_failed';

export interface ValidationResult {
  /** True only when every structural check passed. */
  valid: boolean;
  network: NetworkKey | null;
  /** The PAN with separators removed. */
  pan: string;
  length: number;
  luhn: boolean;
  errors: ValidationError[];
}

export declare function generate(
  network?: NetworkKey | 'random',
  options?: GenerateOptions
): TestCard;

export declare function generateMany(
  count: number,
  network?: NetworkKey | 'random',
  options?: GenerateOptions
): TestCard[];

export declare function format(pan: string, groups: readonly number[]): string;

export declare function validate(pan: string): ValidationResult;

export declare function detectBrand(pan: string): NetworkKey | null;

export declare function luhnCheckDigit(payload: string): string;

export declare function isLuhnValid(pan: string): boolean;

export declare const networks: Readonly<Record<NetworkKey, NetworkRule>>;

export declare const networkKeys: readonly NetworkKey[];
