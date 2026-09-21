package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"calculator/middleware"
)

func TestCORS_AddsCORSHeaders(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodPost, "/add", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Access-Control-Allow-Origin = %q; want %q", got, "*")
	}
	if got := rr.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Error("Access-Control-Allow-Methods header should be set")
	}
	if got := rr.Header().Get("Access-Control-Allow-Headers"); got == "" {
		t.Error("Access-Control-Allow-Headers header should be set")
	}
}

func TestCORS_OptionsPreflightReturns204(t *testing.T) {
	called := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})

	handler := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodOptions, "/add", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if called {
		t.Error("next handler must not be called for OPTIONS preflight")
	}
	if rr.Code != http.StatusNoContent {
		t.Errorf("status = %d; want %d", rr.Code, http.StatusNoContent)
	}
}

func TestCORS_ForwardsNonOptions(t *testing.T) {
	called := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.CORS(inner)

	req := httptest.NewRequest(http.MethodPost, "/add", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if !called {
		t.Error("next handler should be called for non-OPTIONS requests")
	}
	if rr.Code != http.StatusOK {
		t.Errorf("status = %d; want %d", rr.Code, http.StatusOK)
	}
}
