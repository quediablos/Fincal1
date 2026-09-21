import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'
import * as useCalculatorModule from '../hooks/useCalculator'

/* ── Default mock hook state ─────────────────────────────────── */

const buildMock = (overrides = {}) => ({
  firstValue:        '',
  secondValue:       '',
  operation:         null,
  result:            null,
  apiErrors:         [],
  isLoading:         false,
  firstError:        null,
  secondError:       null,
  fieldLabels:       { first: 'First Number', second: 'Second Number' },
  handleFirstChange: vi.fn(),
  handleSecondChange: vi.fn(),
  selectOperation:   vi.fn(),
  calculate:         vi.fn().mockResolvedValue(true),
  clear:             vi.fn(),
  OPERATIONS: {
    ADD: '+', SUBTRACT: '−', MULTIPLY: '×', DIVIDE: '÷',
  },
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

const spy = (overrides) =>
  vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(buildMock(overrides))

/* ── Rendering ─────────────────────────────────────────────── */

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

/* ── Input field behaviour ─────────────────────────────────── */

describe('Calculator — input fields', () => {
  it('calls handleFirstChange when first input changes', async () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    const input = screen.getByTestId('first-input')
    await userEvent.type(input, '5')
    expect(mockHook.handleFirstChange).toHaveBeenCalled()
  })

  it('calls handleSecondChange when second input changes', async () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    const input = screen.getByTestId('second-input')
    await userEvent.type(input, '3')
    expect(mockHook.handleSecondChange).toHaveBeenCalled()
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

/* ── Validation error display ──────────────────────────────── */

describe('Calculator — validation errors', () => {
  it('shows firstError message', () => {
    spy({ firstValue: 'abc', firstError: 'Value must be a numeric number' })
    render(<Calculator />)
    expect(screen.getByText(/numeric number/i)).toBeInTheDocument()
  })

  it('shows secondError message', () => {
    spy({ secondValue: '0', secondError: 'Divisor cannot be zero' })
    render(<Calculator />)
    expect(screen.getByText(/zero/i)).toBeInTheDocument()
  })

  it('adds the error CSS class to first input on error', () => {
    spy({ firstError: 'error!' })
    render(<Calculator />)
    expect(screen.getByTestId('first-input')).toHaveClass('error')
  })

  it('does not show error when no firstError', () => {
    spy({ firstError: null })
    render(<Calculator />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

/* ── API error display ─────────────────────────────────────── */

describe('Calculator — API errors', () => {
  it('renders API errors list', () => {
    spy({
      apiErrors: [
        { errorCode: 'DIVISION_BY_ZERO', errorClass: 'VALIDATION', errorMessage: 'divisor cannot be zero' },
      ],
    })
    render(<Calculator />)
    expect(screen.getByText(/DIVISION_BY_ZERO/)).toBeInTheDocument()
    expect(screen.getByText(/divisor cannot be zero/i)).toBeInTheDocument()
  })

  it('does not render error section when apiErrors is empty', () => {
    spy({ apiErrors: [] })
    render(<Calculator />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

/* ── Result display ────────────────────────────────────────── */

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

/* ── Operation button interactions ────────────────────────── */

describe('Calculator — operation buttons', () => {
  it('calls selectOperation when + is clicked', () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('op-add'))
    expect(mockHook.selectOperation).toHaveBeenCalledWith('+')
  })

  it('calls selectOperation when ÷ is clicked', () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('op-divide'))
    expect(mockHook.selectOperation).toHaveBeenCalledWith('÷')
  })

  it('marks the active operation button with class "active"', () => {
    spy({ operation: '+' })
    render(<Calculator />)
    expect(screen.getByTestId('op-add')).toHaveClass('active')
    expect(screen.getByTestId('op-subtract')).not.toHaveClass('active')
  })

  it('marks operation button as aria-pressed when active', () => {
    spy({ operation: '×' })
    render(<Calculator />)
    expect(screen.getByTestId('op-multiply')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('op-add')).toHaveAttribute('aria-pressed', 'false')
  })
})

/* ── Equals button ─────────────────────────────────────────── */

describe('Calculator — equals button', () => {
  it('calls calculate when = is clicked', async () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.click(screen.getByTestId('equals-btn'))
    await waitFor(() => expect(mockHook.calculate).toHaveBeenCalledOnce())
  })

  it('is disabled when isLoading is true', () => {
    spy({ isLoading: true })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toBeDisabled()
  })

  it('shows loading indicator when isLoading', () => {
    spy({ isLoading: true })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toHaveTextContent('…')
  })

  it('shows = when not loading', () => {
    spy({ isLoading: false })
    render(<Calculator />)
    expect(screen.getByTestId('equals-btn')).toHaveTextContent('=')
  })
})

/* ── Numpad ────────────────────────────────────────────────── */

describe('Calculator — numpad', () => {
  it('calls handleFirstChange when a digit button is pressed (first input focused)', () => {
    const mockHook = buildMock({ firstValue: '' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    // Focus first input, then click digit
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('5'))
    expect(mockHook.handleFirstChange).toHaveBeenCalledWith('5')
  })

  it('calls handleSecondChange when a digit button is pressed (second input focused)', () => {
    const mockHook = buildMock({ secondValue: '' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('second-input'))
    fireEvent.click(screen.getByLabelText('3'))
    expect(mockHook.handleSecondChange).toHaveBeenCalledWith('3')
  })

  it('appends digit to existing value', () => {
    const mockHook = buildMock({ firstValue: '12' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('3'))
    expect(mockHook.handleFirstChange).toHaveBeenCalledWith('123')
  })

  it('calls clear when C is pressed', () => {
    const mockHook = buildMock()
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.click(screen.getByLabelText('clear'))
    expect(mockHook.clear).toHaveBeenCalledOnce()
  })

  it('calls handleFirstChange with truncated value on backspace', () => {
    const mockHook = buildMock({ firstValue: '123' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('backspace'))
    expect(mockHook.handleFirstChange).toHaveBeenCalledWith('12')
  })

  it('toggles sign on +/− press', () => {
    const mockHook = buildMock({ firstValue: '5' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('toggle sign'))
    expect(mockHook.handleFirstChange).toHaveBeenCalledWith('-5')
  })

  it('removes leading minus on +/− press when already negative', () => {
    const mockHook = buildMock({ firstValue: '-5' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('toggle sign'))
    expect(mockHook.handleFirstChange).toHaveBeenCalledWith('5')
  })

  it('does not append a second decimal point', () => {
    const mockHook = buildMock({ firstValue: '3.' })
    vi.spyOn(useCalculatorModule, 'useCalculator').mockReturnValue(mockHook)
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('decimal point'))
    // handleFirstChange should NOT have been called (guard prevents double dot)
    expect(mockHook.handleFirstChange).not.toHaveBeenCalled()
  })
})
