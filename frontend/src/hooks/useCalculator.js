/**
 * useCalculator.js
 *
 * Central business-logic hook for the calculator.
 * Manages field values, the selected operation, validation errors,
 * API call lifecycle, and the computed result.
 */

import { useState, useMemo, useCallback } from 'react'
import { validateNumber, validateDivisor } from '../utils/validators'
import * as api from '../services/api'

/** Operation symbols shown in the UI and used for routing API calls. */
export const OPERATIONS = {
  ADD: '+',
  SUBTRACT: '−',
  MULTIPLY: '×',
  DIVIDE: '÷',
}

/** Field label pairs keyed by operation symbol. */
const LABELS = {
  [OPERATIONS.ADD]:      { first: 'First Number (Addend 1)', second: 'Second Number (Addend 2)' },
  [OPERATIONS.SUBTRACT]: { first: 'Minuend',                 second: 'Subtrahend' },
  [OPERATIONS.MULTIPLY]: { first: 'Multiplicand',            second: 'Multiplier' },
  [OPERATIONS.DIVIDE]:   { first: 'Dividend',                second: 'Divisor' },
}

const DEFAULT_LABELS = { first: 'First Number', second: 'Second Number' }

export function useCalculator() {
  const [firstValue, setFirstValue]   = useState('')
  const [secondValue, setSecondValue] = useState('')
  const [operation, setOperation]     = useState(null)
  const [result, setResult]           = useState(null)
  const [apiErrors, setApiErrors]     = useState([])
  const [isLoading, setIsLoading]     = useState(false)

  // ── Derived: real-time validation ──────────────────────────────────────────
  // Errors are only surfaced once the field contains at least one character,
  // giving users instant feedback without showing "required" on a pristine form.

  const firstError = useMemo(() => {
    if (firstValue === '') return null
    const v = validateNumber(firstValue)
    return v.valid ? null : v.error
  }, [firstValue])

  const secondError = useMemo(() => {
    if (secondValue === '') return null
    const v = operation === OPERATIONS.DIVIDE
      ? validateDivisor(secondValue)
      : validateNumber(secondValue)
    return v.valid ? null : v.error
  }, [secondValue, operation])

  const fieldLabels = useMemo(
    () => (operation ? LABELS[operation] : DEFAULT_LABELS),
    [operation],
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFirstChange = useCallback((value) => {
    setFirstValue(value)
    setResult(null)
    setApiErrors([])
  }, [])

  const handleSecondChange = useCallback((value) => {
    setSecondValue(value)
    setResult(null)
    setApiErrors([])
  }, [])

  const selectOperation = useCallback((op) => {
    setOperation(op)
    setResult(null)
    setApiErrors([])
  }, [])

  /**
   * Validates both fields and calls the appropriate backend endpoint.
   * Returns true on success, false if validation fails or the request errors.
   */
  const calculate = useCallback(async () => {
    // Run full validation (including "required" check for empty fields)
    const v1 = validateNumber(firstValue)
    const v2 = operation === OPERATIONS.DIVIDE
      ? validateDivisor(secondValue)
      : validateNumber(secondValue)

    if (!v1.valid || !v2.valid || !operation) {
      // Trigger the hook's derived errors by touching the values
      // (callers can read firstError / secondError for display)
      return false
    }

    setIsLoading(true)
    setApiErrors([])

    try {
      const n1 = parseFloat(firstValue)
      const n2 = parseFloat(secondValue)
      let response

      switch (operation) {
        case OPERATIONS.ADD:
          response = await api.add(n1, n2)
          break
        case OPERATIONS.SUBTRACT:
          response = await api.subtract(n1, n2)
          break
        case OPERATIONS.MULTIPLY:
          response = await api.multiply(n1, n2)
          break
        case OPERATIONS.DIVIDE:
          response = await api.divide(n1, n2)
          break
        default:
          setIsLoading(false)
          return false
      }

      setResult(response.result)
      return true
    } catch (err) {
      const errors = err?.response?.data?.errors ?? [
        {
          errorCode: 'INTERNAL_ERROR',
          errorClass: 'INTERNAL',
          errorMessage: 'An unexpected error occurred. Please try again.',
        },
      ]
      setApiErrors(errors)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [firstValue, secondValue, operation])

  const clear = useCallback(() => {
    setFirstValue('')
    setSecondValue('')
    setOperation(null)
    setResult(null)
    setApiErrors([])
  }, [])

  return {
    // State
    firstValue,
    secondValue,
    operation,
    result,
    apiErrors,
    isLoading,
    // Derived
    firstError,
    secondError,
    fieldLabels,
    // Handlers
    handleFirstChange,
    handleSecondChange,
    selectOperation,
    calculate,
    clear,
    // Constants
    OPERATIONS,
  }
}
