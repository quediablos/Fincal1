/**
 * api.js
 *
 * Thin wrapper around axios for all calculator backend endpoints.
 * Base URL defaults to /api (proxied by Vite → Go backend in dev,
 * and by nginx → Go backend in Docker).
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * POST /api/add
 * @param {number} addend1
 * @param {number} addend2
 * @returns {Promise<{ result: string }>}
 */
export async function add(addend1, addend2) {
  const response = await axios.post(`${BASE_URL}/add`, { addend1, addend2 })
  return response.data
}

/**
 * POST /api/subtract
 * @param {number} minuend
 * @param {number} subtrahend
 * @returns {Promise<{ result: string }>}
 */
export async function subtract(minuend, subtrahend) {
  const response = await axios.post(`${BASE_URL}/subtract`, { minuend, subtrahend })
  return response.data
}

/**
 * POST /api/multiply
 * @param {number} multiplicand
 * @param {number} multiplier
 * @returns {Promise<{ result: string }>}
 */
export async function multiply(multiplicand, multiplier) {
  const response = await axios.post(`${BASE_URL}/multiply`, { multiplicand, multiplier })
  return response.data
}

/**
 * POST /api/divide
 * @param {number} dividend
 * @param {number} divisor
 * @returns {Promise<{ result: string }>}
 */
export async function divide(dividend, divisor) {
  const response = await axios.post(`${BASE_URL}/divide`, { dividend, divisor })
  return response.data
}
