package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"calculator/models"
)

// extractFloat extracts a float64 value from a map of raw JSON messages.
// Returns an ErrorDetail if the key is absent or its value is non-numeric.
func extractFloat(raw map[string]json.RawMessage, key string) (float64, *models.ErrorDetail) {
	rawVal, ok := raw[key]
	// Treat absent key or explicit JSON null as a missing/non-numeric field.
	if !ok || string(rawVal) == "null" {
		return 0, &models.ErrorDetail{
			ErrorCode:    "MISSING_FIELD",
			ErrorClass:   "VALIDATION",
			ErrorMessage: fmt.Sprintf("field '%s' is required and must be numeric", key),
		}
	}

	var val float64
	if err := json.Unmarshal(rawVal, &val); err != nil {
		return 0, &models.ErrorDetail{
			ErrorCode:    "MISSING_FIELD",
			ErrorClass:   "VALIDATION",
			ErrorMessage: fmt.Sprintf("field '%s' must be a numeric value", key),
		}
	}

	return val, nil
}

// formatResult converts a float64 to its shortest decimal string representation.
func formatResult(v float64) string {
	return strconv.FormatFloat(v, 'f', -1, 64)
}

// writeError writes a JSON error response with the given HTTP status code.
func writeError(w http.ResponseWriter, statusCode int, errs []models.ErrorDetail) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.ErrorResponse{Errors: errs}) //nolint:errcheck
}

// writeSuccess writes a JSON success response with the computed result.
func writeSuccess(w http.ResponseWriter, result float64) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.SuccessResponse{Result: formatResult(result)}) //nolint:errcheck
}

// decodeBody decodes the request body into a raw JSON map.
// Returns nil and writes an INTERNAL_ERROR response if decoding fails.
func decodeBody(w http.ResponseWriter, r *http.Request) map[string]json.RawMessage {
	var raw map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		writeError(w, http.StatusBadRequest, []models.ErrorDetail{
			{
				ErrorCode:    "INTERNAL_ERROR",
				ErrorClass:   "INTERNAL",
				ErrorMessage: "failed to parse request body: invalid JSON",
			},
		})
		return nil
	}
	return raw
}

// Add handles POST /add
// Request: { "addend1": number, "addend2": number }
func Add(w http.ResponseWriter, r *http.Request) {
	raw := decodeBody(w, r)
	if raw == nil {
		return
	}

	var errs []models.ErrorDetail

	addend1, err1 := extractFloat(raw, "addend1")
	if err1 != nil {
		errs = append(errs, *err1)
	}

	addend2, err2 := extractFloat(raw, "addend2")
	if err2 != nil {
		errs = append(errs, *err2)
	}

	if len(errs) > 0 {
		writeError(w, http.StatusBadRequest, errs)
		return
	}

	writeSuccess(w, addend1+addend2)
}

// Subtract handles POST /subtract
// Request: { "minuend": number, "subtrahend": number }
func Subtract(w http.ResponseWriter, r *http.Request) {
	raw := decodeBody(w, r)
	if raw == nil {
		return
	}

	var errs []models.ErrorDetail

	minuend, err1 := extractFloat(raw, "minuend")
	if err1 != nil {
		errs = append(errs, *err1)
	}

	subtrahend, err2 := extractFloat(raw, "subtrahend")
	if err2 != nil {
		errs = append(errs, *err2)
	}

	if len(errs) > 0 {
		writeError(w, http.StatusBadRequest, errs)
		return
	}

	writeSuccess(w, minuend-subtrahend)
}

// Multiply handles POST /multiply
// Request: { "multiplicand": number, "multiplier": number }
func Multiply(w http.ResponseWriter, r *http.Request) {
	raw := decodeBody(w, r)
	if raw == nil {
		return
	}

	var errs []models.ErrorDetail

	multiplicand, err1 := extractFloat(raw, "multiplicand")
	if err1 != nil {
		errs = append(errs, *err1)
	}

	multiplier, err2 := extractFloat(raw, "multiplier")
	if err2 != nil {
		errs = append(errs, *err2)
	}

	if len(errs) > 0 {
		writeError(w, http.StatusBadRequest, errs)
		return
	}

	writeSuccess(w, multiplicand*multiplier)
}

// Divide handles POST /divide
// Request: { "dividend": number, "divisor": number }
// Returns DIVISION_BY_ZERO when divisor is 0.
func Divide(w http.ResponseWriter, r *http.Request) {
	raw := decodeBody(w, r)
	if raw == nil {
		return
	}

	var errs []models.ErrorDetail

	dividend, err1 := extractFloat(raw, "dividend")
	if err1 != nil {
		errs = append(errs, *err1)
	}

	divisor, err2 := extractFloat(raw, "divisor")
	if err2 != nil {
		errs = append(errs, *err2)
	}

	if len(errs) > 0 {
		writeError(w, http.StatusBadRequest, errs)
		return
	}

	if divisor == 0 {
		writeError(w, http.StatusBadRequest, []models.ErrorDetail{
			{
				ErrorCode:    "DIVISION_BY_ZERO",
				ErrorClass:   "VALIDATION",
				ErrorMessage: "field 'divisor' cannot be zero",
			},
		})
		return
	}

	writeSuccess(w, dividend/divisor)
}
