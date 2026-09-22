import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCalculator, OPERATIONS } from './useCalculator'
import type { ApiError } from '../types'
import * as api from '../services/api'

vi.mock('../services/api')

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────── initial state ───────────────────

describe('initial state', () => {
  it('starts with empty first and second values', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.firstValue).toBe('')
    expect(result.current.secondValue).toBe('')
  })

  it('starts with no operation selected', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.operation).toBeNull()
  })

  it('starts with no result', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.result).toBeNull()
  })

  it('starts with no API errors', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.apiErrors).toHaveLength(0)
  })

  it('starts not loading', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.isLoading).toBe(false)
  })

  it('shows default field labels when no operation is selected', () => {
    const { result } = renderHook(() => useCalculator())
    expect(result.current.fieldLabels.first).toMatch(/first/i)
    expect(result.current.fieldLabels.second).toMatch(/second/i)
  })
})

// ─────────────────── handleFirstChange ───────────────────

describe('handleFirstChange', () => {
  it('updates firstValue', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('42') })
    expect(result.current.firstValue).toBe('42')
  })

  it('clears result when first value changes', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('5') })
    // Simulate a result being present
    act(() => { result.current.handleFirstChange('10') })
    expect(result.current.result).toBeNull()
  })

  it('clears apiErrors when first value changes', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('5') })
    expect(result.current.apiErrors).toHaveLength(0)
  })

  it('produces no firstError for an empty value', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('') })
    expect(result.current.firstError).toBeNull()
  })

  it('produces firstError for a non-numeric value', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('abc') })
    expect(result.current.firstError).toBeTruthy()
  })

  it('produces no firstError for a valid number', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('3.14') })
    expect(result.current.firstError).toBeNull()
  })

  it('produces no firstError for a negative number', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleFirstChange('-99') })
    expect(result.current.firstError).toBeNull()
  })
})

// ─────────────────── handleSecondChange ───────────────────

describe('handleSecondChange', () => {
  it('updates secondValue', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.handleSecondChange('7') })
    expect(result.current.secondValue).toBe('7')
  })

  it('shows divisor-zero error for ÷ when secondValue is "0"', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.selectOperation(OPERATIONS.DIVIDE)
      result.current.handleSecondChange('0')
    })
    expect(result.current.secondError).toMatch(/zero/i)
  })

  it('shows no error for a non-zero divisor', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.selectOperation(OPERATIONS.DIVIDE)
      result.current.handleSecondChange('4')
    })
    expect(result.current.secondError).toBeNull()
  })

  it('shows numeric error for non-numeric second value', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.selectOperation(OPERATIONS.ADD)
      result.current.handleSecondChange('xyz')
    })
    expect(result.current.secondError).toBeTruthy()
  })
})

// ─────────────────── selectOperation ───────────────────

describe('selectOperation', () => {
  it('updates the operation', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.selectOperation(OPERATIONS.MULTIPLY) })
    expect(result.current.operation).toBe(OPERATIONS.MULTIPLY)
  })

  it('updates fieldLabels for SUBTRACT', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.selectOperation(OPERATIONS.SUBTRACT) })
    expect(result.current.fieldLabels.first).toMatch(/minuend/i)
    expect(result.current.fieldLabels.second).toMatch(/subtrahend/i)
  })

  it('updates fieldLabels for MULTIPLY', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.selectOperation(OPERATIONS.MULTIPLY) })
    expect(result.current.fieldLabels.first).toMatch(/multiplicand/i)
    expect(result.current.fieldLabels.second).toMatch(/multiplier/i)
  })

  it('updates fieldLabels for DIVIDE', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.selectOperation(OPERATIONS.DIVIDE) })
    expect(result.current.fieldLabels.first).toMatch(/dividend/i)
    expect(result.current.fieldLabels.second).toMatch(/divisor/i)
  })

  it('clears apiErrors on selection', () => {
    const { result } = renderHook(() => useCalculator())
    act(() => { result.current.selectOperation(OPERATIONS.ADD) })
    expect(result.current.apiErrors).toHaveLength(0)
  })
})

// ─────────────────── calculate — success paths ───────────────────

describe('calculate — success paths', () => {
  it('calls api.add with parsed numbers and sets result', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    await act(async () => { await result.current.calculate() })
    expect(api.add).toHaveBeenCalledWith(5, 3)
    expect(result.current.result).toBe('8')
  })

  it('calls api.subtract with parsed numbers', async () => {
    vi.mocked(api.subtract).mockResolvedValue({ result: '7' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('10')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.SUBTRACT)
    })
    await act(async () => { await result.current.calculate() })
    expect(api.subtract).toHaveBeenCalledWith(10, 3)
    expect(result.current.result).toBe('7')
  })

  it('calls api.multiply with parsed numbers', async () => {
    vi.mocked(api.multiply).mockResolvedValue({ result: '42' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('6')
      result.current.handleSecondChange('7')
      result.current.selectOperation(OPERATIONS.MULTIPLY)
    })
    await act(async () => { await result.current.calculate() })
    expect(api.multiply).toHaveBeenCalledWith(6, 7)
    expect(result.current.result).toBe('42')
  })

  it('calls api.divide with parsed numbers', async () => {
    vi.mocked(api.divide).mockResolvedValue({ result: '2.5' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('10')
      result.current.handleSecondChange('4')
      result.current.selectOperation(OPERATIONS.DIVIDE)
    })
    await act(async () => { await result.current.calculate() })
    expect(api.divide).toHaveBeenCalledWith(10, 4)
    expect(result.current.result).toBe('2.5')
  })

  it('returns true on success', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    let ok: boolean = false
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(true)
  })

  it('sets isLoading to false after a successful call', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    await act(async () => { await result.current.calculate() })
    expect(result.current.isLoading).toBe(false)
  })
})

// ─────────────────── calculate — validation failures ───────────────────

describe('calculate — validation failures', () => {
  it('returns false when first value is empty', async () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
    expect(api.add).not.toHaveBeenCalled()
  })

  it('returns false when second value is empty', async () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
    expect(api.add).not.toHaveBeenCalled()
  })

  it('returns false when no operation is selected', async () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
  })

  it('returns false when divisor is zero', async () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('0')
      result.current.selectOperation(OPERATIONS.DIVIDE)
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
    expect(api.divide).not.toHaveBeenCalled()
  })

  it('returns false when first value is non-numeric', async () => {
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('abc')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
    expect(api.add).not.toHaveBeenCalled()
  })
})

// ─────────────────── calculate — API errors ───────────────────

describe('calculate — API errors', () => {
  it('sets apiErrors from structured server response', async () => {
    const serverErrors: ApiError[] = [
      { errorCode: 'DIVISION_BY_ZERO', errorClass: 'VALIDATION', errorMessage: 'divisor cannot be zero' },
    ]
    const axiosErr = Object.assign(new Error('server'), { response: { data: { errors: serverErrors } } })
    vi.mocked(api.divide).mockRejectedValue(axiosErr)

    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('1')
      result.current.selectOperation(OPERATIONS.DIVIDE)
    })
    await act(async () => { await result.current.calculate() })
    expect(result.current.apiErrors).toEqual(serverErrors)
  })

  it('sets a generic INTERNAL_ERROR when no structured error payload exists', async () => {
    vi.mocked(api.add).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    await act(async () => { await result.current.calculate() })
    expect(result.current.apiErrors[0].errorCode).toBe('INTERNAL_ERROR')
    expect(result.current.apiErrors[0].errorClass).toBe('INTERNAL')
  })

  it('returns false on API error', async () => {
    vi.mocked(api.add).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    let ok: boolean = true
    await act(async () => { ok = await result.current.calculate() })
    expect(ok).toBe(false)
  })

  it('sets isLoading to false after an API error', async () => {
    vi.mocked(api.add).mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useCalculator())
    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    await act(async () => { await result.current.calculate() })
    expect(result.current.isLoading).toBe(false)
  })
})

// ─────────────────── clear ───────────────────

describe('clear', () => {
  it('resets all state to initial values', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.handleFirstChange('5')
      result.current.handleSecondChange('3')
      result.current.selectOperation(OPERATIONS.ADD)
    })
    await act(async () => { await result.current.calculate() })

    act(() => { result.current.clear() })

    expect(result.current.firstValue).toBe('')
    expect(result.current.secondValue).toBe('')
    expect(result.current.operation).toBeNull()
    expect(result.current.result).toBeNull()
    expect(result.current.apiErrors).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
  })
})
