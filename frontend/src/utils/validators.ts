/**
 * validators.ts
 *
 * Pure, side-effect-free validation utilities.
 * Each function returns a {@link ValidationResult} so callers
 * can display error messages without performing the validation twice.
 */

import type { ValidationResult } from '../types'

/**
 * Validates that `value` is non-empty and represents a finite number.
 *
 * @param value - Any value supplied by the user (string, number, null, …).
 * @returns `{ valid: true, error: null }` on success, or
 *          `{ valid: false, error: <message> }` on failure.
 */
export function validateNumber(value: unknown): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'This field is required' }
  }

  const trimmed = String(value).trim()

  if (trimmed === '') {
    return { valid: false, error: 'This field is required' }
  }

  const num = Number(trimmed)

  if (isNaN(num)) {
    return { valid: false, error: 'Value must be a numeric number' }
  }

  if (!isFinite(num)) {
    return { valid: false, error: 'Value must be a finite number' }
  }

  return { valid: true, error: null }
}

/**
 * Validates that `value` is a non-empty, numeric, **non-zero** number.
 * Used for the divisor field in division to surface the zero-check
 * before the request reaches the backend.
 *
 * @param value - Any value supplied by the user.
 */
export function validateDivisor(value: unknown): ValidationResult {
  const base = validateNumber(value)
  if (!base.valid) return base

  if (Number(value) === 0) {
    return { valid: false, error: 'Divisor cannot be zero' }
  }

  return { valid: true, error: null }
}
