package models

// ErrorDetail represents a single validation or processing error.
type ErrorDetail struct {
	ErrorCode    string `json:"errorCode"`
	ErrorClass   string `json:"errorClass"`
	ErrorMessage string `json:"errorMessage"`
}

// ErrorResponse is returned when validation or processing fails.
type ErrorResponse struct {
	Errors []ErrorDetail `json:"errors"`
}

// SuccessResponse is returned on a successful computation.
type SuccessResponse struct {
	Result string `json:"result"`
}
