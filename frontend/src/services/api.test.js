import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { add, subtract, multiply, divide } from './api'

vi.mock('axios')

const mockSuccess = (result) => {
  axios.post.mockResolvedValue({ data: { result } })
}

const mockFailure = (errors) => {
  const err = new Error('API error')
  err.response = { data: { errors } }
  axios.post.mockRejectedValue(err)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────── add ──────────────

describe('add()', () => {
  it('posts to /api/add with correct body', async () => {
    mockSuccess('8')
    await add(5, 3)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/add'),
      { addend1: 5, addend2: 3 },
    )
  })

  it('returns the server result', async () => {
    mockSuccess('8')
    const data = await add(5, 3)
    expect(data).toEqual({ result: '8' })
  })

  it('propagates axios errors', async () => {
    mockFailure([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(add(null, 3)).rejects.toThrow()
  })
})

// ────────────── subtract ──────────────

describe('subtract()', () => {
  it('posts to /api/subtract with correct body', async () => {
    mockSuccess('7')
    await subtract(10, 3)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/subtract'),
      { minuend: 10, subtrahend: 3 },
    )
  })

  it('returns the server result', async () => {
    mockSuccess('7')
    const data = await subtract(10, 3)
    expect(data).toEqual({ result: '7' })
  })

  it('propagates axios errors', async () => {
    mockFailure([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(subtract(null, 3)).rejects.toThrow()
  })
})

// ────────────── multiply ──────────────

describe('multiply()', () => {
  it('posts to /api/multiply with correct body', async () => {
    mockSuccess('42')
    await multiply(6, 7)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/multiply'),
      { multiplicand: 6, multiplier: 7 },
    )
  })

  it('returns the server result', async () => {
    mockSuccess('42')
    const data = await multiply(6, 7)
    expect(data).toEqual({ result: '42' })
  })

  it('propagates axios errors', async () => {
    mockFailure([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(multiply(null, 3)).rejects.toThrow()
  })
})

// ────────────── divide ──────────────

describe('divide()', () => {
  it('posts to /api/divide with correct body', async () => {
    mockSuccess('2.5')
    await divide(10, 4)
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/divide'),
      { dividend: 10, divisor: 4 },
    )
  })

  it('returns the server result', async () => {
    mockSuccess('2.5')
    const data = await divide(10, 4)
    expect(data).toEqual({ result: '2.5' })
  })

  it('propagates DIVISION_BY_ZERO error from server', async () => {
    mockFailure([
      { errorCode: 'DIVISION_BY_ZERO', errorClass: 'VALIDATION', errorMessage: "divisor cannot be zero" },
    ])
    await expect(divide(5, 0)).rejects.toThrow()
  })
})
