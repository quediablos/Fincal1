import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { add, subtract, multiply, divide } from './api'
import type { SuccessResponse, ApiError } from '../types'

vi.mock('axios')

const mockedPost = vi.mocked(axios.post)

function resolveWith(result: string): void {
  const data: SuccessResponse = { result }
  mockedPost.mockResolvedValue({ data })
}

function rejectWith(errors: ApiError[]): void {
  const err = Object.assign(new Error('API error'), { response: { data: { errors } } })
  mockedPost.mockRejectedValue(err)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ────────────── add ──────────────

describe('add()', () => {
  it('posts to /api/add with correct payload', async () => {
    resolveWith('8')
    await add(5, 3)
    expect(mockedPost).toHaveBeenCalledWith(
      expect.stringContaining('/add'),
      { addend1: 5, addend2: 3 },
    )
  })

  it('returns the parsed SuccessResponse', async () => {
    resolveWith('8')
    const data = await add(5, 3)
    expect(data).toEqual<SuccessResponse>({ result: '8' })
  })

  it('propagates axios rejection', async () => {
    rejectWith([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(add(0, 0)).rejects.toThrow()
  })
})

// ────────────── subtract ──────────────

describe('subtract()', () => {
  it('posts to /api/subtract with correct payload', async () => {
    resolveWith('7')
    await subtract(10, 3)
    expect(mockedPost).toHaveBeenCalledWith(
      expect.stringContaining('/subtract'),
      { minuend: 10, subtrahend: 3 },
    )
  })

  it('returns the parsed SuccessResponse', async () => {
    resolveWith('7')
    expect(await subtract(10, 3)).toEqual<SuccessResponse>({ result: '7' })
  })

  it('propagates axios rejection', async () => {
    rejectWith([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(subtract(0, 0)).rejects.toThrow()
  })
})

// ────────────── multiply ──────────────

describe('multiply()', () => {
  it('posts to /api/multiply with correct payload', async () => {
    resolveWith('42')
    await multiply(6, 7)
    expect(mockedPost).toHaveBeenCalledWith(
      expect.stringContaining('/multiply'),
      { multiplicand: 6, multiplier: 7 },
    )
  })

  it('returns the parsed SuccessResponse', async () => {
    resolveWith('42')
    expect(await multiply(6, 7)).toEqual<SuccessResponse>({ result: '42' })
  })

  it('propagates axios rejection', async () => {
    rejectWith([{ errorCode: 'MISSING_FIELD', errorClass: 'VALIDATION', errorMessage: 'err' }])
    await expect(multiply(0, 0)).rejects.toThrow()
  })
})

// ────────────── divide ──────────────

describe('divide()', () => {
  it('posts to /api/divide with correct payload', async () => {
    resolveWith('2.5')
    await divide(10, 4)
    expect(mockedPost).toHaveBeenCalledWith(
      expect.stringContaining('/divide'),
      { dividend: 10, divisor: 4 },
    )
  })

  it('returns the parsed SuccessResponse', async () => {
    resolveWith('2.5')
    expect(await divide(10, 4)).toEqual<SuccessResponse>({ result: '2.5' })
  })

  it('propagates DIVISION_BY_ZERO rejection from server', async () => {
    rejectWith([{ errorCode: 'DIVISION_BY_ZERO', errorClass: 'VALIDATION', errorMessage: 'divisor cannot be zero' }])
    await expect(divide(5, 0)).rejects.toThrow()
  })
})
