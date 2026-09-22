/**
 * Calculator.tsx
 *
 * Main calculator UI.
 *
 * Layout:
 *  ┌─ Two labelled text-inputs (real-time validation) ──────────┐
 *  │  Operation row  [ +  −  ×  ÷ ]                             │
 *  │  Numpad         [ 7  8  9  C ]                              │
 *  │                 [ 4  5  6  ⌫ ]                              │
 *  │                 [ 1  2  3 +/−]                              │
 *  │                 [  0   .   = ]                              │
 *  │  Result / API error display                                 │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * Number-pad buttons type into whichever text-input is currently focused.
 * Selecting an operation automatically moves focus to the second input.
 */

import { useRef, useState, useCallback, type JSX } from 'react'
import { useCalculator, OPERATIONS } from '../hooks/useCalculator'
import type { OperationSymbol } from '../hooks/useCalculator'
import type { ApiError } from '../types'
import './Calculator.css'

// ── Presentational sub-components ─────────────────────────────────────────

interface ValidationErrorProps {
  message: string
}

function ValidationError({ message }: ValidationErrorProps): JSX.Element {
  return (
    <span className="field-error" role="alert" aria-live="polite">
      ⚠ {message}
    </span>
  )
}

interface ApiErrorsProps {
  errors: ApiError[]
}

function ApiErrors({ errors }: ApiErrorsProps): JSX.Element | null {
  if (errors.length === 0) return null
  return (
    <div className="api-errors" role="alert" aria-live="assertive">
      {errors.map((err, i) => (
        <div key={i} className="api-error-item">
          <span className="error-badge">{err.errorCode}</span>
          <span className="error-msg">{err.errorMessage}</span>
        </div>
      ))}
    </div>
  )
}

interface ResultDisplayProps {
  result: string | null
}

function ResultDisplay({ result }: ResultDisplayProps): JSX.Element | null {
  if (result === null) return null
  return (
    <div className="result-section" data-testid="result-display">
      <span className="result-label">Result</span>
      <span className="result-value" data-testid="result-value">{result}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

function Calculator(): JSX.Element {
  const {
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
  } = useCalculator()

  // Track which input is "active" for numpad injection.
  const [focusedField, setFocusedField] = useState<'first' | 'second'>('first')

  const firstRef  = useRef<HTMLInputElement>(null)
  const secondRef = useRef<HTMLInputElement>(null)

  // ── Numpad helpers ──────────────────────────────────────────────────────

  const appendChar = useCallback((char: string): void => {
    if (focusedField === 'second') {
      if (char === '.' && secondValue.includes('.')) return
      const newVal = secondValue === '' ? (char === '.' ? '0.' : char) : secondValue + char
      handleSecondChange(newVal)
    } else {
      if (char === '.' && firstValue.includes('.')) return
      const newVal = firstValue === '' ? (char === '.' ? '0.' : char) : firstValue + char
      handleFirstChange(newVal)
    }
  }, [focusedField, firstValue, secondValue, handleFirstChange, handleSecondChange])

  const backspace = useCallback((): void => {
    if (focusedField === 'second') {
      handleSecondChange(secondValue.slice(0, -1))
    } else {
      handleFirstChange(firstValue.slice(0, -1))
    }
  }, [focusedField, firstValue, secondValue, handleFirstChange, handleSecondChange])

  const toggleSign = useCallback((): void => {
    if (focusedField === 'second') {
      if (!secondValue) return
      handleSecondChange(secondValue.startsWith('-') ? secondValue.slice(1) : '-' + secondValue)
    } else {
      if (!firstValue) return
      handleFirstChange(firstValue.startsWith('-') ? firstValue.slice(1) : '-' + firstValue)
    }
  }, [focusedField, firstValue, secondValue, handleFirstChange, handleSecondChange])

  // ── Operation / Calculate / Clear ──────────────────────────────────────

  const handleOperationClick = useCallback((op: OperationSymbol): void => {
    selectOperation(op)
    setFocusedField('second')
    secondRef.current?.focus()
  }, [selectOperation])

  const handleCalculate = useCallback(async (): Promise<void> => {
    await calculate()
  }, [calculate])

  const handleClear = useCallback((): void => {
    clear()
    setFocusedField('first')
    firstRef.current?.focus()
  }, [clear])

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="calculator" data-testid="calculator">

      {/* ── Input fields ───────────────────────────────────────────── */}
      <div className="inputs-section">
        <div className="input-group">
          <label className="input-label" htmlFor="first-input">
            {fieldLabels.first}
          </label>
          <input
            id="first-input"
            ref={firstRef}
            type="text"
            inputMode="decimal"
            className={`number-input${firstError !== null ? ' error' : ''}${focusedField === 'first' ? ' focused' : ''}`}
            value={firstValue}
            placeholder="0"
            aria-label={fieldLabels.first}
            aria-invalid={firstError !== null}
            onChange={(e) => handleFirstChange(e.target.value)}
            onFocus={() => setFocusedField('first')}
            data-testid="first-input"
          />
          {firstError !== null && <ValidationError message={firstError} />}
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="second-input">
            {fieldLabels.second}
          </label>
          <input
            id="second-input"
            ref={secondRef}
            type="text"
            inputMode="decimal"
            className={`number-input${secondError !== null ? ' error' : ''}${focusedField === 'second' ? ' focused' : ''}`}
            value={secondValue}
            placeholder="0"
            aria-label={fieldLabels.second}
            aria-invalid={secondError !== null}
            onChange={(e) => handleSecondChange(e.target.value)}
            onFocus={() => setFocusedField('second')}
            data-testid="second-input"
          />
          {secondError !== null && <ValidationError message={secondError} />}
        </div>
      </div>

      {/* ── Operation selector ─────────────────────────────────────── */}
      <div className="operations-row" role="group" aria-label="Operations">
        {(Object.entries(OPERATIONS) as Array<[string, OperationSymbol]>).map(([key, symbol]) => (
          <button
            key={key}
            className={`btn btn-op${operation === symbol ? ' active' : ''}`}
            onClick={() => handleOperationClick(symbol)}
            aria-label={key.toLowerCase()}
            aria-pressed={operation === symbol}
            data-testid={`op-${key.toLowerCase()}`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* ── Numpad ─────────────────────────────────────────────────── */}
      <div className="numpad" role="group" aria-label="Numpad">
        {/* Row 1 */}
        <button className="btn btn-digit" onClick={() => appendChar('7')} aria-label="7">7</button>
        <button className="btn btn-digit" onClick={() => appendChar('8')} aria-label="8">8</button>
        <button className="btn btn-digit" onClick={() => appendChar('9')} aria-label="9">9</button>
        <button className="btn btn-control" onClick={handleClear} aria-label="clear">C</button>

        {/* Row 2 */}
        <button className="btn btn-digit" onClick={() => appendChar('4')} aria-label="4">4</button>
        <button className="btn btn-digit" onClick={() => appendChar('5')} aria-label="5">5</button>
        <button className="btn btn-digit" onClick={() => appendChar('6')} aria-label="6">6</button>
        <button className="btn btn-control" onClick={backspace} aria-label="backspace">⌫</button>

        {/* Row 3 */}
        <button className="btn btn-digit" onClick={() => appendChar('1')} aria-label="1">1</button>
        <button className="btn btn-digit" onClick={() => appendChar('2')} aria-label="2">2</button>
        <button className="btn btn-digit" onClick={() => appendChar('3')} aria-label="3">3</button>
        <button className="btn btn-control" onClick={toggleSign} aria-label="toggle sign">+/−</button>

        {/* Row 4 */}
        <button className="btn btn-digit btn-zero" onClick={() => appendChar('0')} aria-label="0">0</button>
        <button className="btn btn-digit" onClick={() => appendChar('.')} aria-label="decimal point">.</button>
        <button
          className={`btn btn-equals${isLoading ? ' loading' : ''}`}
          onClick={handleCalculate}
          disabled={isLoading}
          aria-label="equals"
          aria-busy={isLoading}
          data-testid="equals-btn"
        >
          {isLoading ? '…' : '='}
        </button>
      </div>

      {/* ── Feedback ───────────────────────────────────────────────── */}
      <ApiErrors errors={apiErrors} />
      <ResultDisplay result={result} />
    </div>
  )
}

export default Calculator
