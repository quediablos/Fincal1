/**
 * Calculator.integration.test.tsx — Integration tests
 *
 * Tests the Calculator component with the REAL useCalculator hook.
 * Only the API service layer (axios) is mocked, so these tests exercise
 * the full React ↔ hook ↔ validator pipeline end-to-end.
 *
 * Scenarios covered:
 *  1. Full addition flow
 *  2. Full subtraction flow
 *  3. Full multiplication flow
 *  4. Full division flow
 *  5. Division-by-zero blocked at UI level (no API call made)
 *  6. Real-time validation for non-numeric first input
 *  7. Real-time divisor-zero error in second input
 *  8. API error is rendered after a failed request
 *  9. Clear resets the entire UI state
 * 10. Numpad digit injection into the focused input
 * 11. Backspace via numpad
 * 12. Toggle sign via numpad
 * 13. Decimal point via numpad (no duplicate dot)
 * 14. Calculation blocked when fields are empty (returns false)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Calculator from './Calculator'
import * as api from '../services/api'
import type { ApiError } from '../types'

vi.mock('../services/api')

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────────────

async function typeInFirst(value: string): Promise<void> {
  await userEvent.type(screen.getByTestId('first-input'), value)
}

async function typeInSecond(value: string): Promise<void> {
  await userEvent.type(screen.getByTestId('second-input'), value)
}

function clickOp(testId: string): void {
  fireEvent.click(screen.getByTestId(testId))
}

async function clickEquals(): Promise<void> {
  fireEvent.click(screen.getByTestId('equals-btn'))
  // Wait for async state to settle
  await waitFor(() => {})
}

// ── 1–4: Full operation flows ──────────────────────────────────────────────

describe('Integration — addition', () => {
  it('performs addition end-to-end and displays the result', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    render(<Calculator />)

    await typeInFirst('5')
    clickOp('op-add')
    await typeInSecond('3')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByTestId('result-value')).toHaveTextContent('8')
    })
    expect(api.add).toHaveBeenCalledWith(5, 3)
  })

  it('sends the correct float values to the API', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '4' })
    render(<Calculator />)

    await typeInFirst('2.5')
    clickOp('op-add')
    await typeInSecond('1.5')
    await clickEquals()

    expect(api.add).toHaveBeenCalledWith(2.5, 1.5)
  })

  it('shows field labels for addition', async () => {
    render(<Calculator />)
    clickOp('op-add')
    expect(screen.getByLabelText(/addend 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/addend 2/i)).toBeInTheDocument()
  })
})

describe('Integration — subtraction', () => {
  it('performs subtraction end-to-end and displays the result', async () => {
    vi.mocked(api.subtract).mockResolvedValue({ result: '7' })
    render(<Calculator />)

    await typeInFirst('10')
    clickOp('op-subtract')
    await typeInSecond('3')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByTestId('result-value')).toHaveTextContent('7')
    })
    expect(api.subtract).toHaveBeenCalledWith(10, 3)
  })

  it('shows Minuend / Subtrahend labels for subtraction', () => {
    render(<Calculator />)
    clickOp('op-subtract')
    expect(screen.getByLabelText(/minuend/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subtrahend/i)).toBeInTheDocument()
  })
})

describe('Integration — multiplication', () => {
  it('performs multiplication end-to-end and displays the result', async () => {
    vi.mocked(api.multiply).mockResolvedValue({ result: '42' })
    render(<Calculator />)

    await typeInFirst('6')
    clickOp('op-multiply')
    await typeInSecond('7')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByTestId('result-value')).toHaveTextContent('42')
    })
    expect(api.multiply).toHaveBeenCalledWith(6, 7)
  })

  it('shows Multiplicand / Multiplier labels for multiplication', () => {
    render(<Calculator />)
    clickOp('op-multiply')
    expect(screen.getByLabelText(/multiplicand/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/multiplier/i)).toBeInTheDocument()
  })
})

describe('Integration — division', () => {
  it('performs division end-to-end and displays the result', async () => {
    vi.mocked(api.divide).mockResolvedValue({ result: '2.5' })
    render(<Calculator />)

    await typeInFirst('10')
    clickOp('op-divide')
    await typeInSecond('4')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByTestId('result-value')).toHaveTextContent('2.5')
    })
    expect(api.divide).toHaveBeenCalledWith(10, 4)
  })

  it('shows Dividend / Divisor labels for division', () => {
    render(<Calculator />)
    clickOp('op-divide')
    expect(screen.getByLabelText(/dividend/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/divisor/i)).toBeInTheDocument()
  })
})

// ── 5: Division by zero blocked at UI level ────────────────────────────────

describe('Integration — division-by-zero UI guard', () => {
  it('shows a real-time error when "0" is typed into the divisor field', async () => {
    render(<Calculator />)
    clickOp('op-divide')
    await typeInSecond('0')

    await waitFor(() => {
      expect(screen.getByText(/cannot be zero/i)).toBeInTheDocument()
    })
  })

  it('does NOT call api.divide when divisor is "0"', async () => {
    render(<Calculator />)
    await typeInFirst('5')
    clickOp('op-divide')
    await typeInSecond('0')
    await clickEquals()

    expect(api.divide).not.toHaveBeenCalled()
  })
})

// ── 6: Real-time validation — non-numeric first input ─────────────────────

describe('Integration — real-time validation', () => {
  it('shows a validation error immediately when a non-numeric value is typed', async () => {
    render(<Calculator />)
    await typeInFirst('abc')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText(/numeric/i)).toBeInTheDocument()
  })

  it('clears the validation error when the input becomes valid', async () => {
    render(<Calculator />)
    const input = screen.getByTestId('first-input')

    // Type invalid value
    await userEvent.type(input, 'x')
    await waitFor(() => expect(screen.queryByRole('alert')).toBeInTheDocument())

    // Clear and type valid value
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })

  it('shows no error when the first input is empty (pristine form)', async () => {
    render(<Calculator />)
    // Do not type anything — field is empty
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

// ── 7: Real-time divisor-zero error ───────────────────────────────────────

describe('Integration — divisor validation', () => {
  it('shows no error when divisor is a valid non-zero number', async () => {
    render(<Calculator />)
    clickOp('op-divide')
    await typeInSecond('4')
    expect(screen.queryByText(/zero/i)).toBeNull()
  })
})

// ── 8: API error rendering ─────────────────────────────────────────────────

describe('Integration — API error display', () => {
  it('renders structured API errors after a failed request', async () => {
    const errors: ApiError[] = [
      { errorCode: 'INTERNAL_ERROR', errorClass: 'INTERNAL', errorMessage: 'Service unavailable' },
    ]
    const axiosErr = Object.assign(new Error('server error'), { response: { data: { errors } } })
    vi.mocked(api.add).mockRejectedValue(axiosErr)

    render(<Calculator />)
    await typeInFirst('5')
    clickOp('op-add')
    await typeInSecond('3')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByText(/INTERNAL_ERROR/)).toBeInTheDocument()
      expect(screen.getByText(/Service unavailable/i)).toBeInTheDocument()
    })
  })

  it('renders a generic error when the server sends no structured payload', async () => {
    vi.mocked(api.subtract).mockRejectedValue(new Error('Network error'))

    render(<Calculator />)
    await typeInFirst('10')
    clickOp('op-subtract')
    await typeInSecond('3')
    await clickEquals()

    await waitFor(() => {
      expect(screen.getByText(/INTERNAL_ERROR/)).toBeInTheDocument()
    })
  })
})

// ── 9: Clear ──────────────────────────────────────────────────────────────

describe('Integration — clear', () => {
  it('resets the UI to its initial state after a completed calculation', async () => {
    vi.mocked(api.add).mockResolvedValue({ result: '8' })
    render(<Calculator />)

    await typeInFirst('5')
    clickOp('op-add')
    await typeInSecond('3')
    await clickEquals()

    await waitFor(() => expect(screen.getByTestId('result-display')).toBeInTheDocument())

    // Press C
    fireEvent.click(screen.getByLabelText('clear'))

    expect(screen.queryByTestId('result-display')).toBeNull()
    expect(screen.getByTestId('first-input')).toHaveValue('')
    expect(screen.getByTestId('second-input')).toHaveValue('')
  })
})

// ── 10–13: Numpad interactions ────────────────────────────────────────────

describe('Integration — numpad digit injection', () => {
  it('appends a digit to the first input when it is focused', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('7'))
    expect(screen.getByTestId('first-input')).toHaveValue('7')
  })

  it('appends a digit to the second input when it is focused', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('second-input'))
    fireEvent.click(screen.getByLabelText('4'))
    expect(screen.getByTestId('second-input')).toHaveValue('4')
  })

  it('removes the last character via the backspace button', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('1'))
    fireEvent.click(screen.getByLabelText('2'))
    fireEvent.click(screen.getByLabelText('backspace'))
    expect(screen.getByTestId('first-input')).toHaveValue('1')
  })

  it('prepends a minus sign via the toggle-sign button', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('5'))
    fireEvent.click(screen.getByLabelText('toggle sign'))
    expect(screen.getByTestId('first-input')).toHaveValue('-5')
  })

  it('appends a decimal point via the numpad', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('3'))
    fireEvent.click(screen.getByLabelText('decimal point'))
    fireEvent.click(screen.getByLabelText('1'))
    expect(screen.getByTestId('first-input')).toHaveValue('3.1')
  })

  it('does not add a second decimal point', () => {
    render(<Calculator />)
    fireEvent.focus(screen.getByTestId('first-input'))
    fireEvent.click(screen.getByLabelText('3'))
    fireEvent.click(screen.getByLabelText('decimal point'))
    fireEvent.click(screen.getByLabelText('decimal point')) // second press — should be ignored
    expect(screen.getByTestId('first-input')).toHaveValue('3.')
  })
})

// ── 14: Blocked calculation when fields are empty ─────────────────────────

describe('Integration — blocked calculation', () => {
  it('does not call any API when both fields are empty', async () => {
    render(<Calculator />)
    clickOp('op-add')
    await clickEquals()
    expect(api.add).not.toHaveBeenCalled()
  })

  it('does not call any API when no operation is selected', async () => {
    render(<Calculator />)
    await typeInFirst('5')
    await typeInSecond('3')
    await clickEquals()
    expect(api.add).not.toHaveBeenCalled()
    expect(api.subtract).not.toHaveBeenCalled()
  })
})
