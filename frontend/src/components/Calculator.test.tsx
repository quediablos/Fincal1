/**
 * Calculator.test.tsx — Unit tests
 *
 * The useCalculator hook is fully mocked via vi.spyOn so every test
 * exercises only the Calculator component's rendering and event-wiring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'
import * as useCalculatorModule from '../hooks/useCalculator'
import type { UseCalculatorReturn, OperationSymbol } from '../hooks/useCalculator'
import type { ApiError } from '../types'

// ── Mock factory ──────────────────────────────────────────────────────────

function buildMock(overrides: Partial<UseCalculatorReturn> = {}): UseCalculatorReturn {
  return {
    firstValue:         '',
    secondValue:        '',
    operation:          null,
    result:             null,
    apiErrors:          [],
    isLoading:          false,
    firstError:         null,
    secondError:        null,
    fieldLabels:        { first: 'First Number', second: 'Second Number' },
    handleFirstChange:  vi.fn(),
    handleSecondChange: vi.fn(),
    selectOperation:    vi.fn(),
    calculate:          vi.fn<[], Promise<boolean>>().mockResolvedValue(true),
    clear:              vi.fn(),
    OPERATIONS: { ADD: '+', SUBTRACT: '−', MULTIPLY: '×', DIVIDE: '÷' },
    ...overrides,
  }
}

function spy(overrides: Partial<UseCalculatorReturn> = {}): UseCalculatorReturn {
  const mock = buildMock(overrides)
  vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mock)
  return mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Rendering ─────────────────────────────────────────────────────────────

describe('Calculator — rendering', () => {
  it('renders the calculator container', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByTestId('calculator')).toBeInTheDocument()
  })

  it('renders both labelled inputs', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByTestId('first-input')).toBeInTheDocument()
    expect(screen.getByTestId('second-input')).toBeInTheDocument()
  })

  it('renders all four operation buttons', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByTestId('op-add')).toBeInTheDocument()
    expect(screen.getByTestId('op-subtract')).toBeInTheDocument()
    expect(screen.getByTestId('op-multiply')).toBeInTheDocument()
    expect(screen.getByTestId('op-divide')).toBeInTheDocument()
  })

  it('renders numpad digit buttons', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByLabelText('7')).toBeInTheDocument()
    expect(screen.getByLabelText('0')).toBeInTheDocument()
  })

  it('renders the equals button', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toBeInTheDocument()
  })

  it('renders the clear button', () => {
    spy()
    render(<Calculator />)
    expect(screen.getByLabelText('clear')).toBeInTheDocument()
  })

  it('shows dynamic field labels from hook', () => {
    spy({ fieldLabels: { first: 'Dividend', second: 'Divisor' } })
    render(<Calculator />)
    expect(screen.getByLabelText('Dividend')).toBeInTheDocument()
    expect(screen.getByLabelText('Divisor')).toBeInTheDocument()
  })
})

// ── Input field behaviour ─────────────────────────────────────────────────

describe('Calculator — input fields', () => {
  it('calls handleFirstChange when the first input changes', async () => {
    const mock = spy()
    render(<Calculator />)
    await userEvent.type(screen.getByTestId('first-input'), '5')
    expect(mock.handleFirstChange).toHaveBeenCalled()
  })

  it('calls handleSecondChange when the second input changes', async () => {
    const mock = spy()
    render(<Calculator />)
    await userEvent.type(screen.getByTestId('second-input'), '3')
    expect(mock.handleSecondChange).toHaveBeenCalled()
  })

  it('displays firstValue in the first input', () => {
    spy({ firstValue: '42' })
    render(<Calculator />)
    expect(screen.getByTestId('first-input')).toHaveValue('42')
  })

  it('displays secondValue in the second input', () => {
    spy({ secondValue: '7' })
    render(<Calculator />)
    expect(screen.getByTestId('second-input')).toHaveValue('7')
  })
})

// ── Validation error display ──────────────────────────────────────────────

describe('Calculator — validation errors', () => {
  it('shows firstError message', () => {
    spy({ firstValue: 'abc', firstError: 'Value must be a numeric number' })
    render(<Calculator />)
    expect(screen.getByText(/numeric number/i)).toBeInTheDocument()
  })

  it('shows secondError message', () => {
    spy({ secondValue: '0', secondError: 'Divisor cannot be zero' })
    render(<Calculator />)
    expect(screen.getByText(/cannot be zero/i)).toBeInTheDocument()
  })

  it('adds the error CSS class to the first input when there is a firstError', () => {
    spy({ firstError: 'some error' })
    render(<Calculator />)
    expect(screen.getByTestId('first-input')).toHaveClass('error')
  })

  it('adds aria-invalid to the first input when there is a firstError', () => {
    spy({ firstError: 'some error' })
    render(<Calculator />)
    expect(screen.getByTestId('first-input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not render any alert when there are no errors', () => {
    spy({ firstError: null, secondError: null })
    render(<Calculator />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

// ── API error display ─────────────────────────────────────────────────────

describe('Calculator — API errors', () => {
  it('renders API errors list', () => {
    const errors: ApiError[] = [
      { errorCode: 'DIVISION_BY_ZERO', errorClass: 'VALIDATION', errorMessage: 'divisor cannot be zero' },
    ]
    spy({ apiErrors: errors })
    render(<Calculator />)
    expect(screen.getByText('DIVISION_BY_ZERO')).toBeInTheDocument()
    expect(screen.getByText(/divisor cannot be zero/i)).toBeInTheDocument()
  })

  it('renders multiple API errors', () => {
    const errors: ApiError[] = [
      { errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'field addend1 missing' },
      { errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'field addend2 missing' },
    ]
    spy({ apiErrors: errors })
    render(<Calculator />)
    expect(screen.getAllByText('MISSING_FIELD')).toHaveLength(2)
  })

  it('does not render the API error section when there are no errors', () => {
    spy({ apiErrors: [] })
    render(<Calculator />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

// ── Result display ────────────────────────────────────────────────────────

describe('Calculator — result display', () => {
  it('shows result when present', () => {
    spy({ result: '42' })
    render(<Calculator />)
    expect(screen.getByTestId('result-display')).toBeInTheDocument()
    expect(screen.getByTestId('result-value')).toHaveTextContent('42')
  })

  it('does not render result section when result is null', () => {
    spy({ result: null })
    render(<Calculator />)
    expect(screen.queryByTestId('result-display')).toBeNull()
  })
})

// ── Operation button interactions ─────────────────────────────────────────

describe('Calculator — operation buttons', () => {
  it('calls selectOperation("+") when + is clicked', () => {
    const mock = spy()
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('op-add'))
    expect(mock.selectOperation).toHaveBeenCalledWith('+')
  })

  it('calls selectOperation("÷") when ÷ is clicked', () => {
    const mock = spy()
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('op-divide'))
    expect(mock.selectOperation).toHaveBeenCalledWith('÷')
  })

  it('marks the active operation button with class "active"', () => {
    spy({ operation: '+' as OperationSymbol })
    render(<Calculator />)
    expect(screen.getByTestId('op-add')).toHaveClass('active')
    expect(screen.getByTestId('op-subtract')).not.toHaveClass('active')
  })

  it('sets aria-pressed="true" only on the active operation button', () => {
    spy({ operation: '×' as OperationSymbol })
    render(<Calculator />)
    expect(screen.getByTestId('op-multiply')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('op-add')).toHaveAttribute('aria-pressed', 'false')
  })
})

// ── Equals button ─────────────────────────────────────────────────────────

describe('Calculator — equals button', () => {
  it('calls calculate when = is clicked', async () => {
    const mock = spy()
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('equals-btn'))
    await waitFor(() => expect(mock.calculate).toHaveBeenCalledOnce())
  })

  it('is disabled when isLoading is true', () => {
    spy({ isLoading: true })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toBeDisabled()
  })

  it('shows a loading indicator when isLoading', () => {
    spy({ isLoading: true })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toHaveTextContent('…')
  })

  it('shows "=" when not loading', () => {
    spy({ isLoading: false })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toHaveTextContent('=')
  })
})

// ── Numpad ────────────────────────────────────────────────────────────────

describe('Calculator — numpad', () => {
  it('calls handleFirstChange when a digit is pressed (first input focused)', () => {
    const mock = spy({ firstValue: '' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('5'))
    expect(mock.handleFirstChange).toHaveBeenCalledWith('5')
  })

  it('calls handleSecondChange when a digit is pressed (second input focused)', () => {
    const mock = spy({ secondValue: '' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('second-input'))
    fireEvent.click(screen.getByLabelText('3'))
    expect(mock.handleSecondChange).toHaveBeenCalledWith('3')
  })

  it('appends digit to an existing value', () => {
    const mock = spy({ firstValue: '12' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('3'))
    expect(mock.handleFirstChange).toHaveBeenCalledWith('123')
  })

  it('calls clear when C is pressed', () => {
    const mock = spy()
    render(<Calculator />)
    fireEvent.click(screen.getByLabelText('clear'))
    expect(mock.clear).toHaveBeenCalledOnce()
  })

  it('truncates the last character on backspace', () => {
    const mock = spy({ firstValue: '123' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('backspace'))
    expect(mock.handleFirstChange).toHaveBeenCalledWith('12')
  })

  it('prepends minus sign on +/− press', () => {
    const mock = spy({ firstValue: '5' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('toggle sign'))
    expect(mock.handleFirstChange).toHaveBeenCalledWith('-5')
  })

  it('removes leading minus sign on +/− press when already negative', () => {
    const mock = spy({ firstValue: '-5' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('toggle sign'))
    expect(mock.handleFirstChange).toHaveBeenCalledWith('5')
  })

  it('does not append a second decimal point', () => {
    const mock = spy({ firstValue: '3.' })
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('decimal point'))
    expect(mock.handleFirstChange).not.toHaveBeenCalled()
  })
})
