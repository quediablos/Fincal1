/**
 * validators.js
 *
 * Pure validation utilities.
 * Each function returns { valid: boolean, error: string | null }.
 */

/**
 * Validates that a value is non-empty and represents a finite number.
 *
 * @param {string|number|null|undefined} value
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateNumber(value) {
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
 * Validates that a value is a non-empty, numeric, and non-zero number.
 * Used for the divisor field in division.
 *
 * @param {string|number|null|undefined} value
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDivisor(value) {
  const base = validateNumber(value)
  if (!base.valid) return base

  if (Number(value) === 0) {
    return { valid: false, error: 'Divisor cannot be zero' }
  }

  return { valid: true, error: null }
}
