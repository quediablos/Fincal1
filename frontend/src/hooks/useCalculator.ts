/**
 * useCalculator.ts
 *
 * Central business-logic hook for the calculator.
 * Manages field values, the selected operation, real-time validation,
 * API call lifecycle, and the computed result.
 */

import { useState, useMemo, useCallback } from 'react'
import { validateNumber, validateDivisor } from '../utils/validators'
import * as api from '../services/api'
import type { ApiError, FieldLabels, SuccessResponse } from '../types'
import type { AxiosError } from 'axios'
import type { ErrorResponse } from '../types'

// ── Operation constants ────────────────────────────────────────────────────

/** Symbols shown in the UI and used to route API calls. */
export const OPERATIONS = {
  ADD:      '+',
  SUBTRACT: '−',
  MULTIPLY: '×',
  DIVIDE:   '÷',
} as const

/** Union of every valid operation symbol: '+' | '−' | '×' | '÷' */
export type OperationSymbol = (typeof OPERATIONS)[keyof typeof OPERATIONS]

// ── Static label map ───────────────────────────────────────────────────────

const LABELS: Record<OperationSymbol, FieldLabels> = {
  [OPERATIONS.ADD]:      { first: 'First Number (Addend 1)', second: 'Second Number (Addend 2)' },
  [OPERATIONS.SUBTRACT]: { first: 'Minuend',                 second: 'Subtrahend' },
  [OPERATIONS.MULTIPLY]: { first: 'Multiplicand',            second: 'Multiplier' },
  [OPERATIONS.DIVIDE]:   { first: 'Dividend',                second: 'Divisor' },
}

const DEFAULT_LABELS: FieldLabels = { first: 'First Number', second: 'Second Number' }

// ── Return type ────────────────────────────────────────────────────────────

export interface UseCalculatorReturn {
  // State
  firstValue: string
  secondValue: string
  operation: OperationSymbol | null
  result: string | null
  apiErrors: ApiError[]
  isLoading: boolean
  // Derived
  firstError: string | null
  secondError: string | null
  fieldLabels: FieldLabels
  // Handlers
  handleFirstChange: (value: string) => void
  handleSecondChange: (value: string) => void
  selectOperation: (op: OperationSymbol) => void
  calculate: () => Promise<boolean>
  clear: () => void
  // Constants
  OPERATIONS: typeof OPERATIONS
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useCalculator(): UseCalculatorReturn {
  const [firstValue, setFirstValue]   = useState<string>('')
  const [secondValue, setSecondValue] = useState<string>('')
  const [operation, setOperation]     = useState<OperationSymbol | null>(null)
  const [result, setResult]           = useState<string | null>(null)
  const [apiErrors, setApiErrors]     = useState<ApiError[]>([])
  const [isLoading, setIsLoading]     = useState<boolean>(false)

  // ── Derived: real-time validation ────────────────────────────────────────
  // Errors are only surfaced once the field has at least one character,
  // so a pristine empty form never shows "required" errors.

  const firstError = useMemo<string | null>(() => {
    if (firstValue === '') return null
    const v = validateNumber(firstValue)
    return v.valid ? null : v.error
  }, [firstValue])

  const secondError = useMemo<string | null>(() => {
    if (secondValue === '') return null
    const v = operation === OPERATIONS.DIVIDE
      ? validateDivisor(secondValue)
      : validateNumber(secondValue)
    return v.valid ? null : v.error
  }, [secondValue, operation])

  const fieldLabels = useMemo<FieldLabels>(
    () => (operation !== null ? LABELS[operation] : DEFAULT_LABELS),
    [operation],
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFirstChange = useCallback((value: string): void => {
    setFirstValue(value)
    setResult(null)
    setApiErrors([])
  }, [])

  const handleSecondChange = useCallback((value: string): void => {
    setSecondValue(value)
    setResult(null)
    setApiErrors([])
  }, [])

  const selectOperation = useCallback((op: OperationSymbol): void => {
    setOperation(op)
    setResult(null)
    setApiErrors([])
  }, [])

  /**
   * Validates both fields and calls the appropriate backend endpoint.
   * @returns `true` on success, `false` if validation fails or the request errors.
   */
  const calculate = useCallback(async (): Promise<boolean> => {
    const v1 = validateNumber(firstValue)
    const v2 = operation === OPERATIONS.DIVIDE
      ? validateDivisor(secondValue)
      : validateNumber(secondValue)

    if (!v1.valid || !v2.valid || operation === null) {
      return false
    }

    setIsLoading(true)
    setApiErrors([])

    try {
      const n1 = parseFloat(firstValue)
      const n2 = parseFloat(secondValue)

      // Route to the correct endpoint via a type-safe lookup map.
      const apiCallMap: Record<OperationSymbol, () => Promise<SuccessResponse>> = {
        [OPERATIONS.ADD]:      () => api.add(n1, n2),
        [OPERATIONS.SUBTRACT]: () => api.subtract(n1, n2),
        [OPERATIONS.MULTIPLY]: () => api.multiply(n1, n2),
        [OPERATIONS.DIVIDE]:   () => api.divide(n1, n2),
      }

      const response = await apiCallMap[operation]()
      setResult(response.result)
      return true
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>
      const errors: ApiError[] = axiosError?.response?.data?.errors ?? [
        {
          errorCode:    'INTERNAL_ERROR',
          errorClass:   'INTERNAL',
          errorMessage: 'An unexpected error occurred. Please try again.',
        },
      ]
      setApiErrors(errors)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [firstValue, secondValue, operation])

  const clear = useCallback((): void => {
    setFirstValue('')
    setSecondValue('')
    setOperation(null)
    setResult(null)
    setApiErrors([])
  }, [])

  return {
    firstValue,
    secondValue,
    operation,
    result,
    apiErrors,
    isLoading,
    firstError,
    secondError,
    fieldLabels,
    handleFirstChange,
    handleSecondChange,
    selectOperation,
    calculate,
    clear,
    OPERATIONS,
  }
}
