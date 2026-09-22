/**
 * api.ts
 *
 * Typed axios wrappers for all four calculator endpoints.
 *
 * Base URL resolution:
 *  - Development  → /api  (Vite dev-server proxies → http://localhost:8080)
 *  - Docker       → /api  (nginx proxies → http://backend:8080)
 *  - Override     → set VITE_API_URL env-var
 */

import axios from 'axios'
import type { SuccessResponse } from '../types'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api'

/** POST /api/add */
export async function add(addend1: number, addend2: number): Promise<SuccessResponse> {
  const response = await axios.post<SuccessResponse>(`${BASE_URL}/add`, { addend1, addend2 })
  return response.data
}

/** POST /api/subtract */
export async function subtract(minuend: number, subtrahend: number): Promise<SuccessResponse> {
  const response = await axios.post<SuccessResponse>(`${BASE_URL}/subtract`, { minuend, subtrahend })
  return response.data
}

/** POST /api/multiply */
export async function multiply(multiplicand: number, multiplier: number): Promise<SuccessResponse> {
  const response = await axios.post<SuccessResponse>(`${BASE_URL}/multiply`, { multiplicand, multiplier })
  return response.data
}

/** POST /api/divide */
export async function divide(dividend: number, divisor: number): Promise<SuccessResponse> {
  const response = await axios.post<SuccessResponse>(`${BASE_URL}/divide`, { dividend, divisor })
  return response.data
}
