import { describe, it, expect } from 'vitest'
import { validateNumber, validateDivisor } from './validators'

// ─────────────────────── validateNumber ───────────────────────

describe('validateNumber', () => {
  it('accepts a positive integer string', () => {
    expect(validateNumber('42')).toEqual({ valid: true, error: null })
  })

  it('accepts a negative integer string', () => {
    expect(validateNumber('-7')).toEqual({ valid: true, error: null })
  })

  it('accepts a positive float string', () => {
    expect(validateNumber('3.14')).toEqual({ valid: true, error: null })
  })

  it('accepts a negative float string', () => {
    expect(validateNumber('-0.5')).toEqual({ valid: true, error: null })
  })

  it('accepts the string "0"', () => {
    expect(validateNumber('0')).toEqual({ valid: true, error: null })
  })

  it('accepts a numeric number type', () => {
    expect(validateNumber(100)).toEqual({ valid: true, error: null })
  })

  it('rejects an empty string', () => {
    const result = validateNumber('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects null', () => {
    const result = validateNumber(null)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects undefined', () => {
    const result = validateNumber(undefined)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects a whitespace-only string', () => {
    const result = validateNumber('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects an alphabetic string', () => {
    const result = validateNumber('abc')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/numeric/i)
  })

  it('rejects a mixed alphanumeric string', () => {
    const result = validateNumber('12abc')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects Infinity', () => {
    const result = validateNumber('Infinity')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

// ─────────────────────── validateDivisor ───────────────────────

describe('validateDivisor', () => {
  it('accepts a positive non-zero number', () => {
    expect(validateDivisor('5')).toEqual({ valid: true, error: null })
  })

  it('accepts a negative non-zero number', () => {
    expect(validateDivisor('-3')).toEqual({ valid: true, error: null })
  })

  it('accepts a non-zero float', () => {
    expect(validateDivisor('0.001')).toEqual({ valid: true, error: null })
  })

  it('rejects zero as a string', () => {
    const result = validateDivisor('0')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/zero/i)
  })

  it('rejects numeric zero', () => {
    const result = validateDivisor(0)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/zero/i)
  })

  it('rejects an empty string (propagates from validateNumber)', () => {
    const result = validateDivisor('')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects a non-numeric string', () => {
    const result = validateDivisor('hello')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects null', () => {
    const result = validateDivisor(null)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
