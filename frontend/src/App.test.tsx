import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Isolate App from Calculator's API calls
vi.mock('./components/Calculator', () => ({
  default: () => <div data-testid="calculator-stub">Calculator</div>,
}))

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(screen.getByText('Calculator')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<App />)
    expect(screen.getByText(/React/i)).toBeInTheDocument()
  })

  it('renders the Calculator component', () => {
    render(<App />)
    expect(screen.getByTestId('calculator-stub')).toBeInTheDocument()
  })
})
