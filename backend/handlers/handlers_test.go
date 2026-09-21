package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"calculator/handlers"
	"calculator/models"
)

// ─────────────────────────── helpers ───────────────────────────

func post(t *testing.T, h http.HandlerFunc, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h(rr, req)
	return rr
}

func decodeSuccess(t *testing.T, rr *httptest.ResponseRecorder) models.SuccessResponse {
	t.Helper()
	var resp models.SuccessResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode success: %v", err)
	}
	return resp
}

func decodeError(t *testing.T, rr *httptest.ResponseRecorder) models.ErrorResponse {
	t.Helper()
	var resp models.ErrorResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	return resp
}

func assertStatus(t *testing.T, rr *httptest.ResponseRecorder, want int) {
	t.Helper()
	if rr.Code != want {
		t.Errorf("status = %d; want %d", rr.Code, want)
	}
}

func assertErrorCode(t *testing.T, errs []models.ErrorDetail, idx int, code, class string) {
	t.Helper()
	if idx >= len(errs) {
		t.Fatalf("error index %d out of range (len=%d)", idx, len(errs))
	}
	if errs[idx].ErrorCode != code {
		t.Errorf("errors[%d].errorCode = %q; want %q", idx, errs[idx].ErrorCode, code)
	}
	if errs[idx].ErrorClass != class {
		t.Errorf("errors[%d].errorClass = %q; want %q", idx, errs[idx].ErrorClass, class)
	}
	if errs[idx].ErrorMessage == "" {
		t.Errorf("errors[%d].errorMessage must not be empty", idx)
	}
}

// ═══════════════════════════ Add ═══════════════════════════

func TestAdd_ValidIntegerInput(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":5,"addend2":3}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "8" {
		t.Errorf("result = %q; want %q", resp.Result, "8")
	}
}

func TestAdd_ValidFloatInput(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":2.5,"addend2":1.5}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "4" {
		t.Errorf("result = %q; want %q", resp.Result, "4")
	}
}

func TestAdd_ValidNegativeNumbers(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":-10,"addend2":3}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "-7" {
		t.Errorf("result = %q; want %q", resp.Result, "-7")
	}
}

func TestAdd_ValidZeroResult(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":5,"addend2":-5}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "0" {
		t.Errorf("result = %q; want %q", resp.Result, "0")
	}
}

func TestAdd_MissingAddend1(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend2":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestAdd_MissingAddend2(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":5}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestAdd_BothFieldsMissing(t *testing.T) {
	rr := post(t, handlers.Add, `{}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 2 {
		t.Fatalf("errors count = %d; want 2", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
	assertErrorCode(t, resp.Errors, 1, "MISSING_FIELD", "VALIDATION")
}

func TestAdd_NonNumericAddend1(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":"abc","addend2":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestAdd_NonNumericAddend2(t *testing.T) {
	rr := post(t, handlers.Add, `{"addend1":5,"addend2":true}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestAdd_InvalidJSON(t *testing.T) {
	rr := post(t, handlers.Add, `not-json`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "INTERNAL_ERROR", "INTERNAL")
}

// ═══════════════════════════ Subtract ═══════════════════════════

func TestSubtract_ValidIntegerInput(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"minuend":10,"subtrahend":3}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "7" {
		t.Errorf("result = %q; want %q", resp.Result, "7")
	}
}

func TestSubtract_ValidFloatInput(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"minuend":5.5,"subtrahend":0.5}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "5" {
		t.Errorf("result = %q; want %q", resp.Result, "5")
	}
}

func TestSubtract_NegativeResult(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"minuend":3,"subtrahend":10}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "-7" {
		t.Errorf("result = %q; want %q", resp.Result, "-7")
	}
}

func TestSubtract_MissingMinuend(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"subtrahend":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestSubtract_MissingSubtrahend(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"minuend":10}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestSubtract_BothFieldsMissing(t *testing.T) {
	rr := post(t, handlers.Subtract, `{}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 2 {
		t.Fatalf("errors count = %d; want 2", len(resp.Errors))
	}
}

func TestSubtract_NonNumericField(t *testing.T) {
	rr := post(t, handlers.Subtract, `{"minuend":"abc","subtrahend":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestSubtract_InvalidJSON(t *testing.T) {
	rr := post(t, handlers.Subtract, `{bad}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	assertErrorCode(t, resp.Errors, 0, "INTERNAL_ERROR", "INTERNAL")
}

// ═══════════════════════════ Multiply ═══════════════════════════

func TestMultiply_ValidIntegerInput(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":6,"multiplier":7}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "42" {
		t.Errorf("result = %q; want %q", resp.Result, "42")
	}
}

func TestMultiply_ValidFloatInput(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":2.5,"multiplier":4}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "10" {
		t.Errorf("result = %q; want %q", resp.Result, "10")
	}
}

func TestMultiply_NegativeNumbers(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":-3,"multiplier":-4}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "12" {
		t.Errorf("result = %q; want %q", resp.Result, "12")
	}
}

func TestMultiply_MultiplyByZero(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":99,"multiplier":0}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "0" {
		t.Errorf("result = %q; want %q", resp.Result, "0")
	}
}

func TestMultiply_MissingMultiplicand(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplier":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestMultiply_MissingMultiplier(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestMultiply_BothFieldsMissing(t *testing.T) {
	rr := post(t, handlers.Multiply, `{}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 2 {
		t.Fatalf("errors count = %d; want 2", len(resp.Errors))
	}
}

func TestMultiply_NonNumericField(t *testing.T) {
	rr := post(t, handlers.Multiply, `{"multiplicand":3,"multiplier":"xyz"}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestMultiply_InvalidJSON(t *testing.T) {
	rr := post(t, handlers.Multiply, `invalid`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	assertErrorCode(t, resp.Errors, 0, "INTERNAL_ERROR", "INTERNAL")
}

// ═══════════════════════════ Divide ═══════════════════════════

func TestDivide_ValidIntegerInput(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":10,"divisor":2}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "5" {
		t.Errorf("result = %q; want %q", resp.Result, "5")
	}
}

func TestDivide_ValidFloatResult(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":10,"divisor":4}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "2.5" {
		t.Errorf("result = %q; want %q", resp.Result, "2.5")
	}
}

func TestDivide_NegativeDividend(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":-9,"divisor":3}`)
	assertStatus(t, rr, http.StatusOK)
	resp := decodeSuccess(t, rr)
	if resp.Result != "-3" {
		t.Errorf("result = %q; want %q", resp.Result, "-3")
	}
}

func TestDivide_DivisionByZero(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":5,"divisor":0}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "DIVISION_BY_ZERO", "VALIDATION")
}

func TestDivide_DivisionByNegativeZero(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":5,"divisor":-0}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	assertErrorCode(t, resp.Errors, 0, "DIVISION_BY_ZERO", "VALIDATION")
}

func TestDivide_MissingDividend(t *testing.T) {
	rr := post(t, handlers.Divide, `{"divisor":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestDivide_MissingDivisor(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":10}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestDivide_BothFieldsMissing(t *testing.T) {
	rr := post(t, handlers.Divide, `{}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 2 {
		t.Fatalf("errors count = %d; want 2", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
	assertErrorCode(t, resp.Errors, 1, "MISSING_FIELD", "VALIDATION")
}

func TestDivide_NonNumericDividend(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":"abc","divisor":3}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestDivide_NonNumericDivisor(t *testing.T) {
	rr := post(t, handlers.Divide, `{"dividend":10,"divisor":null}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	if len(resp.Errors) != 1 {
		t.Fatalf("errors count = %d; want 1", len(resp.Errors))
	}
	assertErrorCode(t, resp.Errors, 0, "MISSING_FIELD", "VALIDATION")
}

func TestDivide_InvalidJSON(t *testing.T) {
	rr := post(t, handlers.Divide, `{nope}`)
	assertStatus(t, rr, http.StatusBadRequest)
	resp := decodeError(t, rr)
	assertErrorCode(t, resp.Errors, 0, "INTERNAL_ERROR", "INTERNAL")
}
