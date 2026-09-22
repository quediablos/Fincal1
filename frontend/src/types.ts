/**
 * types.ts
 *
 * Shared domain types used across the frontend.
 * All API shapes mirror the Go backend response structures.
 */

// ── API error codes / classes ──────────────────────────────────────────────

export type ErrorCode = 'MISSING_FIELD' | 'DIVISION_BY_ZERO' | 'INTERNAL_ERROR'
export type ErrorClass = 'VALIDATION' | 'INTERNAL'

export interface ApiError {
  errorCode: ErrorCode
  errorClass: ErrorClass
  errorMessage: string
}

// ── API response shapes ────────────────────────────────────────────────────

export interface SuccessResponse {
  result: string
}

export interface ErrorResponse {
  errors: ApiError[]
}

// ── Validation ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  error: string | null
}

// ── Calculator domain ─────────────────────────────────────────────────────

export interface FieldLabels {
  first: string
  second: string
}
